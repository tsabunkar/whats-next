package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/tsabunkar/career-oracle/internal/astrology"
	"github.com/tsabunkar/career-oracle/internal/careers"
	"github.com/tsabunkar/career-oracle/internal/salary"
	"github.com/tsabunkar/career-oracle/internal/scoring"
)

type CareerMatchRequest struct {
	PsychologicalTraits map[string]string  `json:"psychological_traits"`
	Astrology           *AstrologyPayload   `json:"astrology"`
}

type AstrologyPayload struct {
	SunSign        string `json:"sun_sign"`
	MoonSign       string `json:"moon_sign"`
	Ascendant      string `json:"ascendant"`
	DominantPlanet string `json:"dominant_planet"`
	Nakshatra      string `json:"nakshatra"`
}

type CareerMatchResponse struct {
	TopCareers []CareerResult `json:"top_careers"`
}

type CareerResult struct {
	Rank              int    `json:"rank"`
	Title             string `json:"title"`
	MatchScore        int    `json:"match_score"`
	MatchReason       string `json:"match_reason"`
	Category          string `json:"category"`
	AvgSalaryIndiaLPA int    `json:"avg_salary_india_lpa"`
	SalaryMin         int    `json:"salary_min_lpa"`
	SalaryMax         int    `json:"salary_max_lpa"`
	SalarySource      string `json:"salary_source"`
	GrowthTrajectory  string `json:"growth_trajectory"`
	AstroAlignment    string `json:"astro_alignment"`
}

var (
	careerDB      []careers.Career
	salaryProvider salary.Provider
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func handleCareerMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CareerMatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	results := scoring.ComputeMatch(careerDB, req.PsychologicalTraits)

	if req.Astrology != nil {
		astroBoost := astrology.ComputePlanetaryAffinity(
			req.Astrology.DominantPlanet,
			req.Astrology.SunSign,
			req.Astrology.MoonSign,
			req.Astrology.Nakshatra,
		)
		results = scoring.ApplyAstroBoost(results, astroBoost)
	}

	topN := 3
	if len(results) < topN {
		topN = len(results)
	}
	topResults := results[:topN]

	enriched, err := scoring.EnrichSalaries(topResults, salaryProvider)
	if err != nil {
		log.Printf("salary enrichment failed (using estimates): %v", err)
		enriched = topResults
	}

	topCareers := make([]CareerResult, 0, topN)
	for i, r := range enriched {
		astroAlignment := ""
		if req.Astrology != nil {
			astroAlignment = astrology.GetAlignmentReason(req.Astrology.DominantPlanet, r.Title)
		}
		topCareers = append(topCareers, CareerResult{
			Rank:              i + 1,
			Title:             r.Title,
			MatchScore:        r.Score,
			MatchReason:       r.Reason,
			Category:          r.Category,
			AvgSalaryIndiaLPA: r.Salary.AvgLPA,
			SalaryMin:         r.Salary.MinLPA,
			SalaryMax:         r.Salary.MaxLPA,
			SalarySource:      r.Salary.Source,
			GrowthTrajectory:  r.GrowthTrajectory,
			AstroAlignment:    astroAlignment,
		})
	}

	resp := CareerMatchResponse{TopCareers: topCareers}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "career-oracle-engine"})
}

func getSSMParam(ctx context.Context, client *ssm.Client, name string) string {
	result, err := client.GetParameter(ctx, &ssm.GetParameterInput{
		Name:           &name,
		WithDecryption: aws.Bool(true),
	})
	if err != nil {
		return ""
	}
	return *result.Parameter.Value
}

func initSalaryProvider() {
	ctx := context.Background()

	adzunaID := os.Getenv("ADZUNA_APP_ID")
	adzunaKey := os.Getenv("ADZUNA_APP_KEY")

	if adzunaID == "" || adzunaKey == "" {
		cfg, err := config.LoadDefaultConfig(ctx)
		if err == nil {
			ssmClient := ssm.NewFromConfig(cfg)
			if id := getSSMParam(ctx, ssmClient, "/whats-next/adzuna/app-id"); id != "" {
				adzunaID = id
			}
			if key := getSSMParam(ctx, ssmClient, "/whats-next/adzuna/app-key"); key != "" {
				adzunaKey = key
			}
		}
	}

	if adzunaID != "" && adzunaKey != "" {
		log.Println("salary provider: Adzuna API (live)")
		salaryProvider = salary.NewAdzunaProvider(salary.AdzunaConfig{
			AppID:  adzunaID,
			AppKey: adzunaKey,
		})
	} else {
		log.Println("salary provider: fallback estimation (set ADZUNA_APP_ID and ADZUNA_APP_KEY for live data)")
		salaryProvider = salary.NewFallbackProvider()
	}
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	careersPath := os.Getenv("CAREERS_JSON_PATH")
	if careersPath == "" {
		careersPath = "data/careers.json"
	}

	var err error
	careerDB, err = careers.Load(careersPath)
	if err != nil {
		log.Fatalf("failed to load careers: %v", err)
	}
	log.Printf("loaded %d careers from %s", len(careerDB), careersPath)

	initSalaryProvider()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/compute/career-match", handleCareerMatch)

	handler := enableCORS(loggingMiddleware(mux))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("career-oracle engine listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

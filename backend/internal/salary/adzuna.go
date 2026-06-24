package salary

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

type AdzunaConfig struct {
	AppID  string
	AppKey string
}

type AdzunaProvider struct {
	config    AdzunaConfig
	client    *http.Client
	cache     map[string]Result
	cacheMu   sync.RWMutex
	cacheTTL  time.Time
}

type adzunaResponse struct {
	Mean    float64 `json:"mean"`
	Results []struct {
		Title     string   `json:"title"`
		SalaryMin *float64 `json:"salary_min"`
		SalaryMax *float64 `json:"salary_max"`
	} `json:"results"`
}

func NewAdzunaProvider(cfg AdzunaConfig) *AdzunaProvider {
	return &AdzunaProvider{
		config:   cfg,
		client:   &http.Client{Timeout: 15 * time.Second},
		cache:    make(map[string]Result),
		cacheTTL: time.Now(),
	}
}

func (p *AdzunaProvider) FetchSalaries(careers []string) (map[string]Result, error) {
	p.cacheMu.RLock()
	if time.Since(p.cacheTTL) < 30*time.Minute && len(p.cache) > 0 {
		result := make(map[string]Result, len(careers))
		for _, c := range careers {
			if r, ok := p.cache[c]; ok {
				result[c] = r
			}
		}
		if len(result) == len(careers) {
			p.cacheMu.RUnlock()
			return result, nil
		}
	}
	p.cacheMu.RUnlock()

	results := make(map[string]Result)
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 5)

	for _, career := range careers {
		wg.Add(1)
		go func(c string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			r := p.fetchSingle(c)
			mu.Lock()
			results[c] = r
			mu.Unlock()
		}(career)
	}

	wg.Wait()

	p.cacheMu.Lock()
	p.cache = results
	p.cacheTTL = time.Now()
	p.cacheMu.Unlock()

	return results, nil
}

func (p *AdzunaProvider) fetchSingle(career string) Result {
	apiURL := fmt.Sprintf(
		"https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=%s&app_key=%s&what=%s&content-type=application/json&results_per_page=5",
		url.QueryEscape(p.config.AppID),
		url.QueryEscape(p.config.AppKey),
		url.QueryEscape(career+" India"),
	)

	resp, err := p.client.Get(apiURL)
	if err != nil {
		log.Printf("adzuna: request failed for %q: %v", career, err)
		return estimateByCategory(career)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("adzuna: non-200 for %q: %d", career, resp.StatusCode)
		return estimateByCategory(career)
	}

	var adResp adzunaResponse
	if err := json.NewDecoder(resp.Body).Decode(&adResp); err != nil {
		log.Printf("adzuna: decode failed for %q: %v", career, err)
		return estimateByCategory(career)
	}

	// Use the aggregate mean salary from Adzuna when available
	if adResp.Mean > 0 {
		lpa := int(adResp.Mean) / 100000
		return Result{
			Career: career,
			MinLPA: lpa - 5,
			MaxLPA: lpa + 5,
			AvgLPA: lpa,
			Source: "adzuna",
		}
	}

	// Fall back to individual result salaries
	var totalMin, totalMax, count float64
	for _, r := range adResp.Results {
		if r.SalaryMin != nil && *r.SalaryMin > 0 {
			totalMin += *r.SalaryMin
			count++
		}
		if r.SalaryMax != nil && *r.SalaryMax > 0 {
			totalMax += *r.SalaryMax
		}
	}

	if count == 0 {
		return estimateByCategory(career)
	}

	avgMin := int(totalMin/count) / 100000
	avgMax := int(totalMax/float64(len(adResp.Results))) / 100000
	avgLPA := (avgMin + avgMax) / 2

	return Result{
		Career: career,
		MinLPA: avgMin,
		MaxLPA: avgMax,
		AvgLPA: avgLPA,
		Source: "adzuna",
	}
}

var categorySalaryMap = map[string]struct{ Base, Range int }{
	"Technology": {16, 20},
	"Finance":    {18, 27},
	"Consulting": {16, 14},
	"Healthcare": {10, 22},
	"Business":   {20, 30},
	"Design":     {12, 18},
	"Marketing":  {14, 14},
	"Education":  {8, 12},
	"Legal":      {20, 15},
	"Science":    {16, 14},
	"Media":      {10, 20},
	"Hospitality": {10, 10},
	"Engineering": {14, 10},
	"Aviation":   {30, 20},
	"Government": {14, 12},
	"Social":     {8, 8},
}

func estimateByCategory(career string) Result {
	cat := detectCategory(career)
	base := 14
	rng := 14
	if s, ok := categorySalaryMap[cat]; ok {
		base = s.Base
		rng = s.Range
	}
	avg := base + rng/2
	return Result{
		Career: career,
		MinLPA: base,
		MaxLPA: base + rng,
		AvgLPA: avg,
		Source: "estimate",
	}
}

func detectCategory(career string) string {
	lower := strings.ToLower(career)
	switch {
	case strings.Contains(lower, "engineer"), strings.Contains(lower, "developer"), strings.Contains(lower, "architect"), strings.Contains(lower, "data"), strings.Contains(lower, "analyst"), strings.Contains(lower, "manager") && strings.Contains(lower, "product"):
		return "Technology"
	case strings.Contains(lower, "banker"), strings.Contains(lower, "finance"), strings.Contains(lower, "accountant"), strings.Contains(lower, "trader"), strings.Contains(lower, "capitalist"):
		return "Finance"
	case strings.Contains(lower, "consultant"), strings.Contains(lower, "analyst") && strings.Contains(lower, "business"):
		return "Consulting"
	case strings.Contains(lower, "doctor"), strings.Contains(lower, "surgeon"), strings.Contains(lower, "nurse"), strings.Contains(lower, "pharmacist"), strings.Contains(lower, "therapist"), strings.Contains(lower, "trainer"), strings.Contains(lower, "nutritionist"), strings.Contains(lower, "practitioner"):
		return "Healthcare"
	case strings.Contains(lower, "founder"), strings.Contains(lower, "ceo"), strings.Contains(lower, "director"), strings.Contains(lower, "entrepreneur"), strings.Contains(lower, "hr"), strings.Contains(lower, "manager") && !strings.Contains(lower, "product"):
		return "Business"
	case strings.Contains(lower, "designer"), strings.Contains(lower, "architect") && !strings.Contains(lower, "cloud"), strings.Contains(lower, "planner"):
		return "Design"
	case strings.Contains(lower, "marketing"), strings.Contains(lower, "brand"), strings.Contains(lower, "public relations"), strings.Contains(lower, "social media"):
		return "Marketing"
	case strings.Contains(lower, "professor"), strings.Contains(lower, "teacher"), strings.Contains(lower, "librarian"), strings.Contains(lower, "principal"):
		return "Education"
	case strings.Contains(lower, "lawyer"), strings.Contains(lower, "judge"), strings.Contains(lower, "legal"), strings.Contains(lower, "advisor"):
		return "Legal"
	case strings.Contains(lower, "scientist"), strings.Contains(lower, "researcher"), strings.Contains(lower, "biologist"), strings.Contains(lower, "physicist"), strings.Contains(lower, "chemist"), strings.Contains(lower, "mathematician"), strings.Contains(lower, "statistician"), strings.Contains(lower, "geologist"), strings.Contains(lower, "astronomer"):
		return "Science"
	case strings.Contains(lower, "writer"), strings.Contains(lower, "editor"), strings.Contains(lower, "journalist"), strings.Contains(lower, "director") && !strings.Contains(lower, "managing"), strings.Contains(lower, "actor"), strings.Contains(lower, "musician"), strings.Contains(lower, "dancer"), strings.Contains(lower, "photographer"):
		return "Media"
	case strings.Contains(lower, "chef"), strings.Contains(lower, "hotel"), strings.Contains(lower, "hospitality"):
		return "Hospitality"
	case strings.Contains(lower, "civil"), strings.Contains(lower, "mechanical"), strings.Contains(lower, "electrical"), strings.Contains(lower, "chemical"), strings.Contains(lower, "aerospace"):
		return "Engineering"
	case strings.Contains(lower, "pilot"), strings.Contains(lower, "aviation"):
		return "Aviation"
	case strings.Contains(lower, "civil servant"), strings.Contains(lower, "ias"), strings.Contains(lower, "police"), strings.Contains(lower, "military"), strings.Contains(lower, "foreign service"), strings.Contains(lower, "officer"):
		return "Government"
	case strings.Contains(lower, "nonprofit"), strings.Contains(lower, "social"), strings.Contains(lower, "ngo"):
		return "Social"
	default:
		return "Technology"
	}
}

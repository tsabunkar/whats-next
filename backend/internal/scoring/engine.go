package scoring

import (
	"math"
	"sort"

	"github.com/tsabunkar/career-oracle/internal/careers"
	"github.com/tsabunkar/career-oracle/internal/salary"
)

type ScoredCareer struct {
	Title            string
	Score            int
	Reason           string
	Category         string
	GrowthTrajectory string
	Salary           salary.Result
}

func ComputeMatch(careerList []careers.Career, traits map[string]string) []ScoredCareer {
	traitVec := buildTraitVector(traits)

	scored := make([]ScoredCareer, 0, len(careerList))

	for _, c := range careerList {
		similarity := cosineSimilarity(traitVec, c.TraitVector)
		score := int(math.Round(similarity * 100))
		if score > 99 {
			score = 99
		}
		if score < 10 {
			score = 10
		}

		reason := buildReason(traits, c)

		scored = append(scored, ScoredCareer{
			Title:            c.Title,
			Score:            score,
			Reason:           reason,
			Category:         c.Category,
			GrowthTrajectory: c.GrowthTrajectory,
		})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	return scored
}

func EnrichSalaries(careersList []ScoredCareer, provider salary.Provider) ([]ScoredCareer, error) {
	titles := make([]string, len(careersList))
	for i, c := range careersList {
		titles[i] = c.Title
	}

	salaries, err := provider.FetchSalaries(titles)
	if err != nil {
		return careersList, err
	}

	result := make([]ScoredCareer, len(careersList))
	for i, c := range careersList {
		if s, ok := salaries[c.Title]; ok {
			c.Salary = s
		}
		result[i] = c
	}
	return result, nil
}

func buildTraitVector(traits map[string]string) map[string]float64 {
	traitValues := map[string]float64{
		"intuitive":     0.0,
		"analytical":    0.0,
		"collaborative": 0.0,
		"methodical":    0.0,
		"creative":      0.0,
		"independent":   0.0,
		"ambition":      0.0,
		"impact":        0.0,
		"mastery":       0.0,
		"risk_tolerant": 0.0,
		"quiet":         0.0,
		"expressive":    0.0,
		"structured":    0.0,
		"invention":     0.0,
		"connection":    0.0,
		"justice":       0.0,
		"enterprise":    0.0,
	}

	traitKeyMap := map[string]string{
		"decision_style":       "decision_style",
		"strength_type":        "strength_type",
		"work_motivation":      "work_motivation",
		"psychological_safety": "psychological_safety",
		"purpose_driver":       "purpose_driver",
	}

	for key, val := range traits {
		if _, ok := traitKeyMap[key]; ok {
			if v, exists := traitValues[val]; exists {
				traitValues[val] = v + 1.0
			}
		}
	}

	return traitValues
}

func cosineSimilarity(a, b map[string]float64) float64 {
	var dotProduct, normA, normB float64

	allKeys := make(map[string]bool)
	for k := range a {
		allKeys[k] = true
	}
	for k := range b {
		allKeys[k] = true
	}

	for k := range allKeys {
		va := a[k]
		vb := b[k]
		dotProduct += va * vb
		normA += va * va
		normB += vb * vb
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}

func ApplyAstroBoost(careers []ScoredCareer, boost map[string]float64) []ScoredCareer {
	result := make([]ScoredCareer, len(careers))
	copy(result, careers)

	for i, c := range result {
		if factor, ok := boost[c.Title]; ok {
			boosted := float64(c.Score) * (1 + factor)
			if boosted > 99 {
				boosted = 99
			}
			result[i].Score = int(math.Round(boosted))
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Score > result[j].Score
	})

	return result
}

func buildReason(traits map[string]string, c careers.Career) string {
	styleDesc := ""
	switch traits["strength_type"] {
	case "analytical":
		styleDesc = "analytical mind"
	case "intuitive":
		styleDesc = "intuitive instincts"
	case "creative":
		styleDesc = "creative vision"
	case "collaborative":
		styleDesc = "collaborative spirit"
	case "methodical":
		styleDesc = "methodical approach"
	default:
		styleDesc = "unique strengths"
	}

	motivationDesc := ""
	switch traits["work_motivation"] {
	case "impact":
		motivationDesc = "drive for impact"
	case "ambition":
		motivationDesc = "ambitious drive"
	case "mastery":
		motivationDesc = "pursuit of mastery"
	case "creative":
		motivationDesc = "creative passion"
	default:
		motivationDesc = "strong motivation"
	}

	reason := "Your " + styleDesc + " and " + motivationDesc
	reason += " align well with " + c.Title + "."

	if c.Category != "" {
		reason += " This " + c.Category + " career leverages your natural strengths."
	}

	return reason
}

package careers

import (
	"encoding/json"
	"os"
)

type Career struct {
	Title            string             `json:"title"`
	Category         string             `json:"category"`
	GrowthTrajectory string             `json:"growth_trajectory"`
	TraitVector      map[string]float64 `json:"trait_vector"`
	PlanetAffinity   []string           `json:"planet_affinity"`
}

func Load(path string) ([]Career, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var careers []Career
	if err := json.Unmarshal(data, &careers); err != nil {
		return nil, err
	}

	return careers, nil
}

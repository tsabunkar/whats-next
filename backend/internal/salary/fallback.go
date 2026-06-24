package salary

import "sync"

type FallbackProvider struct {
	cache   map[string]Result
	cacheMu sync.RWMutex
}

func NewFallbackProvider() *FallbackProvider {
	return &FallbackProvider{
		cache: make(map[string]Result),
	}
}

func (p *FallbackProvider) FetchSalaries(careers []string) (map[string]Result, error) {
	p.cacheMu.RLock()
	hitCount := 0
	for _, c := range careers {
		if _, ok := p.cache[c]; ok {
			hitCount++
		}
	}
	if hitCount == len(careers) && len(p.cache) > 0 {
		result := make(map[string]Result, len(careers))
		for _, c := range careers {
			result[c] = p.cache[c]
		}
		p.cacheMu.RUnlock()
		return result, nil
	}
	p.cacheMu.RUnlock()

	result := make(map[string]Result, len(careers))
	for _, c := range careers {
		r := estimateByCategory(c)
		result[c] = r
	}

	p.cacheMu.Lock()
	for k, v := range result {
		p.cache[k] = v
	}
	p.cacheMu.Unlock()

	return result, nil
}

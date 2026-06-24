package salary

type Result struct {
	Career string
	MinLPA int
	MaxLPA int
	AvgLPA int
	Source string
}

type Provider interface {
	FetchSalaries(careers []string) (map[string]Result, error)
}

package astrology

import "strings"

type planetAffinity struct {
	careers   []string
	boost     float64
}

var planetCareerMap = map[string]planetAffinity{
	"Sun": {
		careers: []string{
			"Entrepreneur / Founder", "Management Consultant", "Civil Servant (IAS)",
			"Professor / Academic", "Politician", "CEO / Executive Director",
		},
		boost: 0.2,
	},
	"Moon": {
		careers: []string{
			"Psychologist", "Creative Director", "UX Designer",
			"Writer / Author", "Counselor", "Artist",
		},
		boost: 0.2,
	},
	"Mars": {
		careers: []string{
			"Machine Learning Engineer", "AI / Robotics Engineer", "Doctor (Surgeon)",
			"Investment Banker", "Entrepreneur / Founder", "Military / Defense",
			"Full Stack Developer", "Software Engineer", "Data Scientist",
		},
		boost: 0.2,
	},
	"Mercury": {
		careers: []string{
			"Data Scientist", "Software Engineer", "Full Stack Developer",
			"Cloud Architect", "Product Manager", "Management Consultant",
			"Bioinformatics Scientist", "Machine Learning Engineer", "UX Designer",
		},
		boost: 0.2,
	},
	"Jupiter": {
		careers: []string{
			"Product Manager", "Management Consultant", "Professor / Academic",
			"Lawyer", "Civil Servant (IAS)", "Psychologist",
			"Entrepreneur / Founder", "Marketing Director",
		},
		boost: 0.2,
	},
	"Venus": {
		careers: []string{
			"UX Designer", "Creative Director", "Marketing Director",
			"Architect", "Psychologist", "Artist / Designer",
		},
		boost: 0.2,
	},
	"Saturn": {
		careers: []string{
			"Civil Servant (IAS)", "Lawyer", "Cloud Architect",
			"Investment Banker", "Architect", "Professor / Academic",
			"Data Scientist", "Management Consultant",
		},
		boost: 0.15,
	},
	"Rahu": {
		careers: []string{
			"Machine Learning Engineer", "AI / Robotics Engineer",
			"Data Scientist", "Full Stack Developer", "Cloud Architect",
			"Investment Banker", "Bioinformatics Scientist",
		},
		boost: 0.15,
	},
	"Ketu": {
		careers: []string{
			"Bioinformatics Scientist", "Psychologist", "Professor / Academic",
			"Writer", "Philosopher", "Spiritual Leader",
		},
		boost: 0.1,
	},
}

func ComputePlanetaryAffinity(dominantPlanet, sunSign, moonSign, nakshatra string) map[string]float64 {
	boost := make(map[string]float64)

	if aff, ok := planetCareerMap[dominantPlanet]; ok {
		for _, c := range aff.careers {
			boost[c] = aff.boost
		}
	}

	sunCareerKeywords := getSunSignCareerKeywords(sunSign)
	for _, c := range sunCareerKeywords {
		if _, exists := boost[c]; exists {
			boost[c] += 0.05
		} else {
			boost[c] = 0.05
		}
	}

	nakshatraBoost := getNakshatraBoost(nakshatra)
	for career, factor := range nakshatraBoost {
		if _, exists := boost[career]; exists {
			boost[career] += factor * 0.5
		} else {
			boost[career] = factor * 0.5
		}
	}

	return boost
}

func GetAlignmentReason(dominantPlanet, careerTitle string) string {
	if aff, ok := planetCareerMap[dominantPlanet]; ok {
		for _, c := range aff.careers {
			if strings.EqualFold(c, careerTitle) {
				return dominantPlanet + " alignment amplifies your success in " + careerTitle
			}
		}
	}
	return dominantPlanet + " energy can be channeled effectively into " + careerTitle + " with focused effort"
}

func getSunSignCareerKeywords(sign string) []string {
	keywords := map[string][]string{
		"Aries":       {"Entrepreneur / Founder", "Investment Banker", "Doctor (Surgeon)"},
		"Taurus":      {"UX Designer", "Architect", "Creative Director"},
		"Gemini":      {"Full Stack Developer", "Marketing Director", "Product Manager"},
		"Cancer":      {"Psychologist", "Professor / Academic", "Civil Servant (IAS)"},
		"Leo":         {"CEO / Executive Director", "Entrepreneur / Founder", "Management Consultant"},
		"Virgo":       {"Data Scientist", "Bioinformatics Scientist", "Cloud Architect"},
		"Libra":       {"Lawyer", "Product Manager", "UX Designer"},
		"Scorpio":     {"Machine Learning Engineer", "AI / Robotics Engineer", "Psychologist"},
		"Sagittarius": {"Professor / Academic", "Management Consultant", "Marketing Director"},
		"Capricorn":   {"Investment Banker", "Civil Servant (IAS)", "Cloud Architect"},
		"Aquarius":    {"AI / Robotics Engineer", "Data Scientist", "Full Stack Developer"},
		"Pisces":      {"Creative Director", "Psychologist", "Bioinformatics Scientist"},
	}
	return keywords[sign]
}

func getNakshatraBoost(nakshatra string) map[string]float64 {
	boost := make(map[string]float64)
	switch nakshatra {
	case "Ashwini":
		boost["Doctor (Surgeon)"] = 0.2
		boost["Entrepreneur / Founder"] = 0.15
	case "Bharani":
		boost["Creative Director"] = 0.2
		boost["Artist"] = 0.15
	case "Krittika":
		boost["Investment Banker"] = 0.2
		boost["Architect"] = 0.15
	case "Rohini":
		boost["UX Designer"] = 0.2
		boost["Creative Director"] = 0.15
	case "Mrigashira":
		boost["Data Scientist"] = 0.2
		boost["Full Stack Developer"] = 0.15
	case "Ardra":
		boost["Machine Learning Engineer"] = 0.2
		boost["AI / Robotics Engineer"] = 0.2
	case "Punarvasu":
		boost["Professor / Academic"] = 0.2
		boost["Management Consultant"] = 0.15
	case "Pushya":
		boost["Civil Servant (IAS)"] = 0.2
		boost["Professor / Academic"] = 0.15
	case "Ashlesha":
		boost["Psychologist"] = 0.2
		boost["Data Scientist"] = 0.15
	case "Magha":
		boost["CEO / Executive Director"] = 0.2
		boost["Management Consultant"] = 0.15
	case "Purva Phalguni", "Uttara Phalguni":
		boost["Marketing Director"] = 0.2
		boost["Creative Director"] = 0.15
	case "Hasta":
		boost["Full Stack Developer"] = 0.2
		boost["Product Manager"] = 0.15
	case "Chitra":
		boost["Architect"] = 0.2
		boost["UX Designer"] = 0.15
	case "Swati":
		boost["Management Consultant"] = 0.2
		boost["Entrepreneur / Founder"] = 0.15
	case "Vishakha":
		boost["Product Manager"] = 0.2
		boost["Marketing Director"] = 0.15
	case "Anuradha":
		boost["Data Scientist"] = 0.2
		boost["Bioinformatics Scientist"] = 0.15
	case "Jyeshtha":
		boost["Investment Banker"] = 0.2
		boost["Entrepreneur / Founder"] = 0.15
	case "Mula":
		boost["AI / Robotics Engineer"] = 0.2
		boost["Bioinformatics Scientist"] = 0.15
	case "Purva Ashadha":
		boost["Marketing Director"] = 0.2
		boost["Entrepreneur / Founder"] = 0.15
	case "Uttara Ashadha":
		boost["Civil Servant (IAS)"] = 0.2
		boost["Professor / Academic"] = 0.15
	case "Shravana":
		boost["Professor / Academic"] = 0.2
		boost["Writer"] = 0.15
	case "Dhanishta":
		boost["Investment Banker"] = 0.2
		boost["Entrepreneur / Founder"] = 0.15
	case "Shatabhisha":
		boost["Cloud Architect"] = 0.2
		boost["Machine Learning Engineer"] = 0.15
	case "Purva Bhadrapada":
		boost["Psychologist"] = 0.2
		boost["Lawyer"] = 0.15
	case "Uttara Bhadrapada":
		boost["Psychologist"] = 0.2
		boost["Professor / Academic"] = 0.15
	case "Revati":
		boost["Creative Director"] = 0.2
		boost["Writer"] = 0.15
	}
	return boost
}

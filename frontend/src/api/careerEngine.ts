import axios from 'axios'
import type { AstrologyData } from '../store/useQuestStore'
import { buildPsychologicalTraits } from '../data/chapterConfigs'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export interface CareerMatchRequest {
  psychological_traits: Record<string, string>
  astrology: {
    sun_sign: string
    moon_sign: string
    ascendant: string
    dominant_planet: string
    nakshatra: string
  } | null
}

export interface CareerMatchResponse {
  top_careers: Array<{
    rank: number
    title: string
    match_score: number
    match_reason: string
    category: string
    avg_salary_india_lpa: number
    growth_trajectory: string
    astro_alignment: string
  }>
}

export async function fetchCareerMatch(
  answers: Record<string, string>,
  astrology: AstrologyData | null
): Promise<CareerMatchResponse> {
  const traits = buildPsychologicalTraits(answers)

  const astroPayload = astrology
    ? {
        sun_sign: astrology.sun_sign,
        moon_sign: astrology.moon_sign,
        ascendant: astrology.ascendant,
        dominant_planet: astrology.dominant_planet,
        nakshatra: astrology.nakshatra,
      }
    : null

  const payload: CareerMatchRequest = {
    psychological_traits: traits,
    astrology: astroPayload,
  }

  try {
    const response = await axios.post<CareerMatchResponse>(
      `${API_URL}/compute/career-match`,
      payload,
      { timeout: 15000 }
    )
    return response.data
  } catch {
    return getFallbackResults(traits, astrology)
  }
}

const categorySalaryRanges: Record<string, { base: number; range: number }> = {
  Technology: { base: 16, range: 20 },
  Finance: { base: 18, range: 27 },
  Consulting: { base: 16, range: 14 },
  Healthcare: { base: 10, range: 22 },
  Business: { base: 20, range: 30 },
  Design: { base: 12, range: 18 },
  Marketing: { base: 14, range: 14 },
  Education: { base: 8, range: 12 },
  Legal: { base: 20, range: 15 },
  Science: { base: 16, range: 14 },
  Media: { base: 10, range: 20 },
  Hospitality: { base: 10, range: 10 },
  Engineering: { base: 14, range: 10 },
  Aviation: { base: 30, range: 20 },
  Government: { base: 14, range: 12 },
  Social: { base: 8, range: 8 },
}

function estimateSalary(category: string): number {
  const r = categorySalaryRanges[category] || { base: 14, range: 14 }
  return r.base + Math.floor(r.range / 2)
}

function getFallbackResults(
  traits: Record<string, string>,
  astrology: AstrologyData | null
): CareerMatchResponse {
  const careerDb: Array<{
    title: string
    category: string
    growth: string
    traitVector: Record<string, number>
    planetAffinity: string[]
  }> = [
    { title: 'Machine Learning Engineer', category: 'Technology', growth: 'explosive', traitVector: { analytical: 1, mastery: 1, invention: 1, risk_tolerant: 0.5, independent: 0.5 }, planetAffinity: ['Mars', 'Rahu', 'Mercury'] },
    { title: 'Product Manager', category: 'Technology', growth: 'explosive', traitVector: { collaborative: 1, impact: 1, ambition: 1, intuitive: 0.5, expressive: 0.5 }, planetAffinity: ['Jupiter', 'Venus', 'Mercury'] },
    { title: 'UX Designer', category: 'Design', growth: 'steady', traitVector: { creative: 1, intuitive: 1, connection: 1, expressive: 0.5, independent: 0.5 }, planetAffinity: ['Venus', 'Mercury', 'Moon'] },
    { title: 'Data Scientist', category: 'Technology', growth: 'explosive', traitVector: { analytical: 1, methodical: 1, mastery: 1, structured: 0.5, invention: 0.5 }, planetAffinity: ['Mercury', 'Rahu', 'Saturn'] },
    { title: 'Software Engineer', category: 'Technology', growth: 'steady', traitVector: { analytical: 0.8, methodical: 0.8, mastery: 0.8, structured: 0.5, independent: 0.5 }, planetAffinity: ['Mercury', 'Mars', 'Saturn'] },
    { title: 'Management Consultant', category: 'Consulting', growth: 'steady', traitVector: { analytical: 0.8, collaborative: 0.8, ambition: 0.8, structured: 0.5, expressive: 0.5 }, planetAffinity: ['Jupiter', 'Mercury', 'Saturn'] },
    { title: 'Investment Banker', category: 'Finance', growth: 'steady', traitVector: { ambition: 1, analytical: 0.8, risk_tolerant: 0.8, structured: 0.5, independent: 0.5 }, planetAffinity: ['Mars', 'Saturn', 'Sun'] },
    { title: 'Doctor (Surgeon)', category: 'Healthcare', growth: 'steady', traitVector: { methodical: 1, structured: 1, impact: 1, analytical: 0.5, quiet: 0.5 }, planetAffinity: ['Mars', 'Sun', 'Jupiter'] },
    { title: 'Psychologist', category: 'Healthcare', growth: 'emerging', traitVector: { collaborative: 0.8, connection: 1, impact: 1, intuitive: 0.5, expressive: 0.5 }, planetAffinity: ['Moon', 'Venus', 'Jupiter'] },
    { title: 'Entrepreneur / Founder', category: 'Business', growth: 'explosive', traitVector: { risk_tolerant: 1, ambition: 1, independent: 1, intuitive: 0.8, invention: 0.8 }, planetAffinity: ['Mars', 'Sun', 'Jupiter'] },
    { title: 'Civil Servant (IAS)', category: 'Government', growth: 'steady', traitVector: { structured: 1, justice: 1, methodical: 0.8, collaborative: 0.5, impact: 0.5 }, planetAffinity: ['Saturn', 'Jupiter', 'Sun'] },
    { title: 'Architect', category: 'Design', growth: 'steady', traitVector: { creative: 1, methodical: 0.8, structured: 0.8, intuitive: 0.5, independent: 0.5 }, planetAffinity: ['Venus', 'Mercury', 'Saturn'] },
    { title: 'Marketing Director', category: 'Marketing', growth: 'emerging', traitVector: { creative: 0.8, expressive: 0.8, ambition: 0.8, collaborative: 0.5, intuitive: 0.5 }, planetAffinity: ['Venus', 'Jupiter', 'Mercury'] },
    { title: 'Full Stack Developer', category: 'Technology', growth: 'explosive', traitVector: { analytical: 0.8, creative: 0.8, independent: 0.8, mastery: 0.5, methodical: 0.5 }, planetAffinity: ['Mercury', 'Mars', 'Rahu'] },
    { title: 'AI / Robotics Engineer', category: 'Technology', growth: 'explosive', traitVector: { analytical: 1, invention: 1, mastery: 1, risk_tolerant: 0.5, independent: 0.5 }, planetAffinity: ['Mars', 'Rahu', 'Mercury'] },
    { title: 'Professor / Academic', category: 'Education', growth: 'steady', traitVector: { mastery: 1, methodical: 0.8, structured: 0.8, connection: 0.5, quiet: 0.5 }, planetAffinity: ['Jupiter', 'Mercury', 'Saturn'] },
    { title: 'Lawyer', category: 'Legal', growth: 'steady', traitVector: { analytical: 1, justice: 1, structured: 0.8, expressive: 0.5, ambition: 0.5 }, planetAffinity: ['Jupiter', 'Mercury', 'Saturn'] },
    { title: 'Creative Director', category: 'Design', growth: 'emerging', traitVector: { creative: 1, expressive: 1, intuitive: 0.8, independent: 0.5, ambition: 0.5 }, planetAffinity: ['Venus', 'Moon', 'Jupiter'] },
    { title: 'Cloud Architect', category: 'Technology', growth: 'explosive', traitVector: { analytical: 1, methodical: 0.8, mastery: 0.8, structured: 0.5, independent: 0.5 }, planetAffinity: ['Mercury', 'Saturn', 'Rahu'] },
    { title: 'Bioinformatics Scientist', category: 'Science', growth: 'emerging', traitVector: { analytical: 1, methodical: 0.8, invention: 0.8, mastery: 0.5, quiet: 0.5 }, planetAffinity: ['Mercury', 'Rahu', 'Jupiter'] },
  ]

  const traitKeys = Object.keys(traits)
  const traitVec = traitKeys.reduce((acc, key, i) => {
    acc[key] = 1 - (i * 0.05)
    return acc
  }, {} as Record<string, number>)

  const scored = careerDb.map((career) => {
    let score = 0
    let totalWeight = 0
    for (const [trait, value] of Object.entries(traitVec)) {
      const careerVal = career.traitVector[trait] || 0
      score += value * careerVal
      totalWeight += 1
    }
    let matchScore = Math.round((score / Math.max(totalWeight, 1)) * 100)

    let astroAlignment = ''
    if (astrology) {
      const dominantPlanet = astrology.dominant_planet
      if (career.planetAffinity.includes(dominantPlanet)) {
        matchScore = Math.min(99, matchScore + 12)
        astroAlignment = `${dominantPlanet} alignment amplifies your success in this path`
      } else {
        astroAlignment = `${dominantPlanet} energy can be channeled here with focus`
      }
    }

    return {
      rank: 0,
      title: career.title,
      match_score: Math.min(99, matchScore),
      match_reason: `Your ${traitKeys.slice(0, 2).join(' and ')} profile aligns strongly with this ${career.category.toLowerCase()} career path.`,
      category: career.category,
      avg_salary_india_lpa: estimateSalary(career.category),
      growth_trajectory: career.growth,
      astro_alignment: astroAlignment,
    }
  })

  scored.sort((a, b) => b.match_score - a.match_score)
  const top3 = scored.slice(0, 3).map((c, i) => ({ ...c, rank: i + 1 }))

  return { top_careers: top3 }
}

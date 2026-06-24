import { create } from 'zustand'

export interface AstrologyData {
  name: string
  dob: string
  tob: string
  city: string
  lat: number
  lon: number
  sun_sign: string
  moon_sign: string
  ascendant: string
  dominant_planet: string
  nakshatra: string
}

export interface CareerResult {
  rank: number
  title: string
  match_score: number
  match_reason: string
  category: string
  avg_salary_india_lpa: number
  growth_trajectory: string
  astro_alignment: string
}

type AnswerMap = Record<string, string>

interface QuestState {
  currentChapter: number
  currentQuestion: number
  answers: AnswerMap
  includeAstrology: boolean
  astrology: AstrologyData | null
  results: CareerResult[] | null
  isLoading: boolean
  xp: number

  setAnswer: (qId: string, answer: string) => void
  nextQuestion: () => void
  prevQuestion: () => void
  goToChapter: (chapter: number) => void
  setIncludeAstrology: (include: boolean) => void
  setAstrology: (data: AstrologyData) => void
  setResults: (results: CareerResult[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  currentChapter: 0,
  currentQuestion: 0,
  answers: {},
  includeAstrology: false,
  astrology: null,
  results: null,
  isLoading: false,
  xp: 0,
}

export const useQuestStore = create<QuestState>((set, get) => ({
  ...initialState,

  setAnswer: (qId, answer) => {
    const xpGain = 10
    set((state) => ({
      answers: { ...state.answers, [qId]: answer },
      xp: state.xp + xpGain,
    }))
  },

  nextQuestion: () => {
    const { currentQuestion, currentChapter } = get()
    const isLastInChapter = (currentQuestion + 1) % 3 === 0
    if (isLastInChapter && currentQuestion < 14) {
      set({ currentChapter: currentChapter + 1, currentQuestion: currentQuestion + 1 })
    } else if (currentQuestion < 14) {
      set({ currentQuestion: currentQuestion + 1 })
    }
  },

  prevQuestion: () => {
    const { currentQuestion, currentChapter } = get()
    const isFirstInChapter = currentQuestion % 3 === 0
    if (isFirstInChapter && currentQuestion > 0) {
      set({ currentChapter: currentChapter - 1, currentQuestion: currentQuestion - 1 })
    } else if (currentQuestion > 0) {
      set({ currentQuestion: currentQuestion - 1 })
    }
  },

  goToChapter: (chapter) => {
    set({ currentChapter: chapter, currentQuestion: chapter * 3 })
  },

  setIncludeAstrology: (include) => set({ includeAstrology: include }),

  setAstrology: (data) => set({ astrology: data }),

  setResults: (results) => set({ results }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}))

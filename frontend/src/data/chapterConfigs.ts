export interface QuestionOption {
  id: string
  text: string
  traitValue: string
}

export interface Question {
  id: string
  text: string
  options: QuestionOption[]
}

export interface Chapter {
  id: number
  title: string
  subtitle: string
  scene: string
  questions: Question[]
}

export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'The Forest of Choices',
    subtitle: 'Past choices & decision-making style',
    scene: 'forest',
    questions: [
      {
        id: 'q1',
        text: 'You find a glowing chest deep in the forest. You...',
        options: [
          { id: 'A', text: 'Open it immediately — you love surprises', traitValue: 'intuitive' },
          { id: 'B', text: 'Study it carefully before touching anything', traitValue: 'analytical' },
          { id: 'C', text: 'Ask the forest spirit for guidance first', traitValue: 'collaborative' },
          { id: 'D', text: 'Mark it on your map and come back with friends', traitValue: 'methodical' },
        ],
      },
      {
        id: 'q2',
        text: 'The path ahead splits into three. How do you choose?',
        options: [
          { id: 'A', text: 'Follow the path that feels right in my gut', traitValue: 'intuitive' },
          { id: 'B', text: 'Analyze the map and pick the shortest route', traitValue: 'analytical' },
          { id: 'C', text: 'Wait for a fellow traveler and decide together', traitValue: 'collaborative' },
          { id: 'D', text: 'Take the path with the most interesting landmarks', traitValue: 'creative' },
        ],
      },
      {
        id: 'q3',
        text: 'A stranger offers you a mysterious map. Do you...',
        options: [
          { id: 'A', text: 'Trust them and follow where it leads', traitValue: 'intuitive' },
          { id: 'B', text: 'Cross-reference it with your own knowledge first', traitValue: 'analytical' },
          { id: 'C', text: 'Ask around town if this person is trustworthy', traitValue: 'collaborative' },
          { id: 'D', text: 'Politely decline — I make my own way', traitValue: 'independent' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'The Mountain of Strengths',
    subtitle: 'Natural strengths & skills',
    scene: 'mountain',
    questions: [
      {
        id: 'q4',
        text: 'Your adventuring party is lost. You...',
        options: [
          { id: 'A', text: 'Climb high to scout — I trust my instincts', traitValue: 'intuitive' },
          { id: 'B', text: 'Pull out a map and calculate the optimal route', traitValue: 'analytical' },
          { id: 'C', text: 'Rally morale — we will figure it out together', traitValue: 'collaborative' },
          { id: 'D', text: 'Find herbs, make camp, solve problems methodically', traitValue: 'methodical' },
        ],
      },
      {
        id: 'q5',
        text: 'The village asks for help building a bridge. You...',
        options: [
          { id: 'A', text: 'Design it on the fly with natural materials', traitValue: 'creative' },
          { id: 'B', text: 'Calculate load-bearing requirements first', traitValue: 'analytical' },
          { id: 'C', text: 'Organize the villagers into efficient teams', traitValue: 'collaborative' },
          { id: 'D', text: 'Study similar bridges and follow proven plans', traitValue: 'methodical' },
        ],
      },
      {
        id: 'q6',
        text: 'A storm is approaching the mountain camp. You...',
        options: [
          { id: 'A', text: 'Trust my gut on the safest shelter location', traitValue: 'intuitive' },
          { id: 'B', text: 'Read the weather patterns and predict the path', traitValue: 'analytical' },
          { id: 'C', text: 'Get everyone working together to reinforce camp', traitValue: 'collaborative' },
          { id: 'D', text: 'Follow the emergency protocol step by step', traitValue: 'methodical' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'The City of Dreams',
    subtitle: 'Ambitions, money & meaning',
    scene: 'city',
    questions: [
      {
        id: 'q7',
        text: 'You have built the perfect city. What does it look like?',
        options: [
          { id: 'A', text: 'The tallest skyscrapers — ambition is everything', traitValue: 'ambition' },
          { id: 'B', text: 'Green parks and community centers — people first', traitValue: 'impact' },
          { id: 'C', text: 'Labs and universities — knowledge is foundation', traitValue: 'mastery' },
          { id: 'D', text: 'Markets and studios — creativity drives everything', traitValue: 'creative' },
        ],
      },
      {
        id: 'q8',
        text: 'What drives you to work every day?',
        options: [
          { id: 'A', text: 'Building wealth and financial independence', traitValue: 'ambition' },
          { id: 'B', text: 'Making a real difference in people lives', traitValue: 'impact' },
          { id: 'C', text: 'Becoming an expert at what I do', traitValue: 'mastery' },
          { id: 'D', text: 'Expressing myself and creating something new', traitValue: 'creative' },
        ],
      },
      {
        id: 'q9',
        text: 'Your ideal work environment is...',
        options: [
          { id: 'A', text: 'Fast-paced, competitive, winner-takes-all', traitValue: 'ambition' },
          { id: 'B', text: 'Collaborative, mission-driven, purposeful', traitValue: 'impact' },
          { id: 'C', text: 'Quiet, focused, deep work sessions', traitValue: 'mastery' },
          { id: 'D', text: 'Flexible, expressive, ever-changing', traitValue: 'creative' },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'The Cave of Fears',
    subtitle: 'Anxiety & psychological safety',
    scene: 'cave',
    questions: [
      {
        id: 'q10',
        text: 'Deep in the cave you must choose a tunnel...',
        options: [
          { id: 'A', text: 'The loud one — uncertainty does not scare me', traitValue: 'risk_tolerant' },
          { id: 'B', text: 'The silent one — I need quiet to think', traitValue: 'quiet' },
          { id: 'C', text: 'The one with faint music — creativity keeps me calm', traitValue: 'expressive' },
          { id: 'D', text: 'The one with light at the end — I need clarity', traitValue: 'structured' },
        ],
      },
      {
        id: 'q11',
        text: 'When work feels overwhelming, you...',
        options: [
          { id: 'A', text: 'Push through — pressure makes me perform', traitValue: 'risk_tolerant' },
          { id: 'B', text: 'Step away and meditate to reset', traitValue: 'quiet' },
          { id: 'C', text: 'Talk it out with someone I trust', traitValue: 'expressive' },
          { id: 'D', text: 'Make a detailed plan to tackle each piece', traitValue: 'structured' },
        ],
      },
      {
        id: 'q12',
        text: 'A project is failing. Your first instinct is...',
        options: [
          { id: 'A', text: 'Pivot fast — try something completely different', traitValue: 'risk_tolerant' },
          { id: 'B', text: 'Analyze quietly before sharing the news', traitValue: 'quiet' },
          { id: 'C', text: 'Call a team meeting to brainstorm solutions', traitValue: 'expressive' },
          { id: 'D', text: 'Create a recovery plan with clear milestones', traitValue: 'structured' },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'The Temple of Purpose',
    subtitle: 'Legacy, values & long-term purpose',
    scene: 'temple',
    questions: [
      {
        id: 'q13',
        text: 'You leave one thing behind for future generations...',
        options: [
          { id: 'A', text: 'A great invention that changes how people live', traitValue: 'invention' },
          { id: 'B', text: 'A story that makes people feel less alone', traitValue: 'connection' },
          { id: 'C', text: 'A system that creates fair opportunities for all', traitValue: 'justice' },
          { id: 'D', text: 'A business empire that employs thousands', traitValue: 'enterprise' },
        ],
      },
      {
        id: 'q14',
        text: 'What does success look like at the end of your life?',
        options: [
          { id: 'A', text: 'I changed the world through what I built', traitValue: 'invention' },
          { id: 'B', text: 'I touched hearts and built deep relationships', traitValue: 'connection' },
          { id: 'C', text: 'I made society more fair and equitable', traitValue: 'justice' },
          { id: 'D', text: 'I built something lasting that employed many', traitValue: 'enterprise' },
        ],
      },
      {
        id: 'q15',
        text: 'A young seeker asks: "What should I do with my life?"',
        options: [
          { id: 'A', text: 'Build things that did not exist before', traitValue: 'invention' },
          { id: 'B', text: 'Connect people and help them feel understood', traitValue: 'connection' },
          { id: 'C', text: 'Fix what is broken in the world', traitValue: 'justice' },
          { id: 'D', text: 'Create wealth and opportunities for others', traitValue: 'enterprise' },
        ],
      },
    ],
  },
]

export function getChapterForQuestion(qIndex: number): Chapter {
  const chapterIndex = Math.min(Math.floor(qIndex / 3), 4)
  return chapters[chapterIndex]
}

export function buildPsychologicalTraits(answers: Record<string, string>) {
  const traitCounts: Record<string, number> = {}
  const chapterTraits: Record<number, string[]> = {
    0: ['intuitive', 'analytical', 'collaborative', 'methodical', 'creative', 'independent'],
    1: ['intuitive', 'analytical', 'collaborative', 'methodical', 'creative'],
    2: ['ambition', 'impact', 'mastery', 'creative'],
    3: ['risk_tolerant', 'quiet', 'expressive', 'structured'],
    4: ['invention', 'connection', 'justice', 'enterprise'],
  }

  Object.entries(answers).forEach(([qId, answer]) => {
    const qNum = parseInt(qId.replace('q', '')) - 1
    const chapterIdx = Math.floor(qNum / 3)
    const question = chapters[chapterIdx]?.questions[qNum % 3]
    const option = question?.options.find((o) => o.id === answer)
    if (option) {
      traitCounts[option.traitValue] = (traitCounts[option.traitValue] || 0) + 1
    }
  })

  const traits: Record<string, string> = {}

  if (traitCounts['intuitive'] || traitCounts['analytical'] || traitCounts['collaborative'] || traitCounts['methodical'] || traitCounts['creative'] || traitCounts['independent']) {
    const decisionMap: Record<string, string> = {
      intuitive: 'intuitive', analytical: 'analytical', collaborative: 'collaborative',
      methodical: 'methodical', creative: 'creative', independent: 'independent',
    }
    let best = ''
    let bestCount = 0
    const ch0 = chapterTraits[0]
    for (const t of ch0) {
      if ((traitCounts[t] || 0) > bestCount) {
        bestCount = traitCounts[t] || 0
        best = decisionMap[t]
      }
    }
    traits['decision_style'] = best || 'analytical'
  }

  if (traitCounts['intuitive'] || traitCounts['analytical'] || traitCounts['collaborative'] || traitCounts['methodical'] || traitCounts['creative']) {
    const strengthMap: Record<string, string> = {
      intuitive: 'intuitive', analytical: 'analytical', collaborative: 'collaborative',
      methodical: 'methodical', creative: 'creative',
    }
    let best = ''
    let bestCount = 0
    const ch1 = chapterTraits[1]
    for (const t of ch1) {
      if ((traitCounts[t] || 0) > bestCount) {
        bestCount = traitCounts[t] || 0
        best = strengthMap[t]
      }
    }
    traits['strength_type'] = best || 'analytical'
  }

  const workMap: Record<string, string> = {
    ambition: 'ambition', impact: 'impact', mastery: 'mastery', creative: 'creative',
  }
  let wBest = ''
  let wBestCount = 0
  const ch3 = chapterTraits[2]
  for (const t of ch3) {
    if ((traitCounts[t] || 0) > wBestCount) {
      wBestCount = traitCounts[t] || 0
      wBest = workMap[t]
    }
  }
  traits['work_motivation'] = wBest || 'impact'

  const safetyMap: Record<string, string> = {
    risk_tolerant: 'risk_tolerant', quiet: 'quiet', expressive: 'expressive', structured: 'structured',
  }
  let sBest = ''
  let sBestCount = 0
  const ch4 = chapterTraits[3]
  for (const t of ch4) {
    if ((traitCounts[t] || 0) > sBestCount) {
      sBestCount = traitCounts[t] || 0
      sBest = safetyMap[t]
    }
  }
  traits['psychological_safety'] = sBest || 'structured'

  const purposeMap: Record<string, string> = {
    invention: 'invention', connection: 'connection', justice: 'justice', enterprise: 'enterprise',
  }
  let pBest = ''
  let pBestCount = 0
  const ch5 = chapterTraits[4]
  for (const t of ch5) {
    if ((traitCounts[t] || 0) > pBestCount) {
      pBestCount = traitCounts[t] || 0
      pBest = purposeMap[t]
    }
  }
  traits['purpose_driver'] = pBest || 'invention'

  return traits
}

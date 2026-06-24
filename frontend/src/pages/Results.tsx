import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuestStore } from '../store/useQuestStore'

function CelebrationParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: ['#D4A017','#7F0909','#2A623D','#0E1A40','#FFDB00','#946B2D','#88DDFF'][Math.floor(Math.random() * 7)],
      size: 2 + Math.random() * 5,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 3,
    }))
  )
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ y: p.y, opacity: 0 }}
          animate={{ y: '110vh', opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: Math.random() * 3 }}
        />
      ))}
    </div>
  )
}

const houseConfig = {
  gryffindor: { name: 'Gryffindor', color: '#7F0909', border: '#7F0909', emblem: '🦁', trait: 'Courage, bravery, daring & chivalry', founder: 'Godric Gryffindor' },
  slytherin: { name: 'Slytherin', color: '#2A623D', border: '#2A623D', emblem: '🐍', trait: 'Ambition, cunning, leadership & resourcefulness', founder: 'Salazar Slytherin' },
  ravenclaw: { name: 'Ravenclaw', color: '#0E1A40', border: '#946B2D', emblem: '🦅', trait: 'Intelligence, wisdom, creativity & wit', founder: 'Rowena Ravenclaw' },
  hufflepuff: { name: 'Hufflepuff', color: '#FFDB00', border: '#FFDB00', emblem: '🦡', trait: 'Loyalty, patience, hard work & fairness', founder: 'Helga Hufflepuff' },
}

function determineHouse(score: number, title: string): keyof typeof houseConfig {
  const t = title.toLowerCase()
  if (t.includes('scientist')||t.includes('engineer')||t.includes('doctor')) return 'ravenclaw'
  if (t.includes('defence')||t.includes('surgeon')||t.includes('entrepreneur')||t.includes('founder')) return 'gryffindor'
  if (t.includes('consult')||t.includes('director')||t.includes('manager')||t.includes('banker')||t.includes('lawyer')) return 'slytherin'
  if (t.includes('teacher')||t.includes('social')||t.includes('psychologist')||t.includes('architect')) return 'hufflepuff'
  if (score >= 60) return 'gryffindor'
  if (score >= 50) return 'ravenclaw'
  if (score >= 40) return 'slytherin'
  return 'hufflepuff'
}

const rankLabels = ['GOLD', 'SILVER', 'BRONZE']

function ScoreRing({ score }: { score: number }) {
  const r = 36; const circ = 2 * Math.PI * r; const off = circ - (score / 100) * circ
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(160,168,192,0.1)" strokeWidth="6" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="url(#sg)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: off }} transition={{ duration: 1.5, ease: 'easeOut' }} />
        <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#D4A017" /><stop offset="100%" stopColor="#00D4AA" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold font-display text-pure">{score}%</span>
      </div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { results, astrology, reset } = useQuestStore()
  const [showHouse, setShowHouse] = useState(false)
  const [house, setHouse] = useState<keyof typeof houseConfig>('gryffindor')

  const hatPhrases: Record<string, string> = {
    gryffindor: 'Better be... GRYFFINDOR!',
    slytherin: 'Slytherin!',
    ravenclaw: 'Ravenclaw!',
    hufflepuff: 'HUFFLEPUFF!',
  }

  useEffect(() => {
    if (!results || results.length === 0) { navigate('/quest'); return }
    const h = determineHouse(results[0].match_score, results[0].title)
    setHouse(h)
    setTimeout(() => setShowHouse(true), 800)
  }, [results, navigate])

  if (!results || results.length === 0) return null
  const hi = houseConfig[house]

  return (
    <div className="relative min-h-screen bg-void py-10 px-4">
      <CelebrationParticles />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-display uppercase tracking-[0.3em] text-cosmic-gold mb-2">The Sorting Hat Has Spoken</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-pure mb-2">Your Magical Career Paths</h1>
          <p className="text-stardust text-sm font-body">Based on your {astrology ? 'psychological profile + celestial alignment' : 'psychological profile'}</p>
        </div>

        {/* Sorting Hat reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={showHouse ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div
            className="inline-block glass-strong rounded-2xl p-6"
            style={{ borderColor: hi.border, borderWidth: 1, boxShadow: `0 0 30px ${hi.border}33` }}
          >
            <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 0 10px rgba(212,160,23,0.5))' }}>
              🎩
            </div>
            <p className="text-xs font-display uppercase tracking-[0.2em] text-cosmic-gold mb-1">{hi.founder}</p>
            <h2 className="text-3xl font-display font-bold" style={{ color: hi.color }}>{hi.name}</h2>
            <p className="text-sm text-stardust font-body italic mt-2">"{hi.trait}"</p>
            <motion.p
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="text-xl font-display font-bold text-cosmic-gold mt-3"
            >
              {hatPhrases[house]}
            </motion.p>
          </div>
        </motion.div>

        {/* Career cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map((career, i) => (
            <motion.div
              key={career.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 + 0.6, duration: 0.5 }}
              className="glass-strong rounded-2xl p-5 relative"
              style={{ borderColor: i === 0 ? '#D4A017' : i === 1 ? '#A0A8C0' : '#B45309', borderWidth: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    border: `1px solid ${i === 0 ? '#D4A017' : i === 1 ? '#A0A8C0' : '#B45309'}`,
                    color: i === 0 ? '#D4A017' : i === 1 ? '#A0A8C0' : '#B45309',
                  }}>
                  #{career.rank} {rankLabels[i]}
                </span>
                <ScoreRing score={career.match_score} />
              </div>
              <h2 className="text-lg font-display text-pure font-bold mb-1">{career.title}</h2>
              <p className="text-xs text-stardust font-body mb-1">{career.category}</p>
              <p className="text-sm text-stardust/80 font-body leading-relaxed mb-3">{career.match_reason}</p>
              {career.astro_alignment && <p className="text-xs text-astral-teal/80 italic font-body mb-3">✨ {career.astro_alignment}</p>}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-stardust font-body">Avg. Salary</p>
                  <p className="text-base font-mono font-bold text-cosmic-gold">₹{career.avg_salary_india_lpa} LPA</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  career.growth_trajectory === 'explosive' ? 'text-green-400 bg-green-400/10' :
                  career.growth_trajectory === 'emerging' ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-blue-400 bg-blue-400/10'
                }`}>
                  {career.growth_trajectory === 'explosive' ? '🚀' : career.growth_trajectory === 'emerging' ? '⚡' : '📈'} {career.growth_trajectory}
                </span>
              </div>

            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button onClick={() => { reset(); navigate('/') }}
            className="px-6 py-3 rounded-xl text-sm text-stardust hover:text-pure border border-white/10 hover:border-white/20 transition-all font-body">
            ← Back to Hogwarts
          </button>
          <button onClick={() => navigate('/astrology')}
            className="px-6 py-3 rounded-xl text-sm font-semibold font-display bg-gradient-to-r from-cosmic-gold to-astral-teal text-black hover:shadow-lg hover:shadow-cosmic-gold/30 transition-all">
            Refine with Celestial Reading →
          </button>
        </div>
      </div>
    </div>
  )
}

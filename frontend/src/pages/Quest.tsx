import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuestStore } from '../store/useQuestStore'
import { chapters } from '../data/chapterConfigs'
import GrowingTree from '../components/GrowingTree'

const chapterColors = [
  { bg: 'from-green-950/30 to-void', accent: '#88dd88', label: 'Forest' },
  { bg: 'from-blue-950/30 to-void', accent: '#88bbff', label: 'Mountain' },
  { bg: 'from-yellow-950/30 to-void', accent: '#ffaa44', label: 'City' },
  { bg: 'from-green-900/40 to-void', accent: '#44ff88', label: 'Cave' },
  { bg: 'from-purple-950/30 to-void', accent: '#dd88ff', label: 'Temple' },
]

export default function Quest() {
  const navigate = useNavigate()
  const { currentChapter, currentQuestion, answers, setAnswer, nextQuestion, prevQuestion, xp } = useQuestStore()

  const totalQuestions = 15
  const qId = `q${currentQuestion + 1}`
  const selectedAnswer = answers[qId] || ''
  const [showTransition, setShowTransition] = useState(true)
  const [answered, setAnswered] = useState(false)

  const chapter = chapters[currentChapter]
  const question = chapter?.questions[currentQuestion % 3]
  const colors = chapterColors[currentChapter]

  const qGlobal = currentChapter * 3 + (currentQuestion % 3)
  const isLast = qGlobal === totalQuestions - 1

  useEffect(() => {
    if (showTransition) {
      const t = setTimeout(() => setShowTransition(false), 1800)
      return () => clearTimeout(t)
    }
  }, [showTransition])

  const handleAnswer = useCallback((answerId: string) => {
    if (answered || answerId === selectedAnswer) return
    setAnswered(true)
    setAnswer(qId, answerId)
  }, [answered, selectedAnswer, qId, setAnswer])

  const handleNext = useCallback(() => {
    setAnswered(false)
    if (isLast) {
      navigate('/astrology')
      return
    }
    const isNew = (qGlobal + 1) % 3 === 0
    if (isNew) {
      setShowTransition(true)
    }
    nextQuestion()
  }, [isLast, qGlobal, navigate, nextQuestion])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showTransition) return
      if (answered) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNext() }
        return
      }
      switch (e.key) {
        case '1': handleAnswer('A'); break
        case '2': handleAnswer('B'); break
        case '3': handleAnswer('C'); break
        case '4': handleAnswer('D'); break
        case 'Escape': navigate('/'); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showTransition, answered, handleAnswer, handleNext, navigate])

  if (!question) return null

  return (
    <div className={`relative min-h-screen bg-void flex flex-col bg-gradient-to-b ${colors.bg}`}>
      {/* Chapter transition overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            key={`ch${chapter.id}`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 150, damping: 15 }}
            >
              <p className="text-xs font-display uppercase tracking-[0.3em] text-cosmic-gold mb-3">Chapter {chapter.id}</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-pure mb-2 gradient-gold">{chapter.title}</h2>
              <p className="text-stardust font-body italic">{chapter.subtitle}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Growing tree background */}
      <GrowingTree stage={Object.keys(answers).length} />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1.5 bg-void/80 backdrop-blur-sm">
        <div className="h-full bg-gradient-to-r from-cosmic-gold to-astral-teal transition-all duration-500" style={{ width: `${((Object.keys(answers).length + (answered ? 0 : 0)) / totalQuestions) * 100}%` }} />
      </div>

      {/* HUD */}
      <div className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="glass rounded-full px-3 py-1.5 text-xs text-stardust hover:text-pure transition-colors">
          ← Exit
        </button>
        <div className="flex items-center gap-3">
          <div className="glass rounded-full px-3 py-1.5 text-xs text-cosmic-gold">✨ {xp} XP</div>
          <div className="glass rounded-full px-3 py-1.5 text-xs text-stardust">{qGlobal + 1}/{totalQuestions}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i < Object.keys(answers).length ? '#F5C518' : i === qGlobal ? '#F5C518' : 'rgba(160,168,192,0.2)',
              transform: i === qGlobal ? 'scale(1.4)' : 'scale(1)',
              opacity: i > qGlobal ? 0.3 : 1,
            }}
          />
        ))}
      </div>

      {/* Chapter indicator */}
      <div className="mt-20 text-center">
        <span className="text-[10px] font-display uppercase tracking-[0.2em] text-cosmic-gold/80">
          Chapter {chapter.id} — {chapter.title}
        </span>
      </div>

      {/* Flash card with 3D scroll effect */}
      <div className="flex-1 flex items-center justify-center px-4 pb-24" style={{ perspective: '1000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={qGlobal}
            initial={{ opacity: 0, rotateX: 25, y: 120, scale: 0.85 }}
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: -25, y: -120, scale: 0.85 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="glass-strong rounded-2xl p-6 md:p-8 shadow-2xl">
              {/* Question */}
              <h2 className="text-lg md:text-xl font-display text-pure leading-relaxed mb-6">
                {question.text}
              </h2>

              {/* Answer options */}
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isSelected = selectedAnswer === opt.id
                  const isCorrectReveal = answered && isSelected
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handleAnswer(opt.id)}
                      disabled={answered}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className={`w-full text-left px-5 py-4 rounded-xl font-body text-sm transition-all duration-300 ${
                        answered
                          ? isSelected
                            ? 'bg-gradient-to-r from-cosmic-gold/20 to-amber-500/20 border border-cosmic-gold/40 text-pure'
                            : 'bg-white/5 border border-white/5 text-stardust/50'
                          : 'bg-white/5 border border-white/10 text-stardust hover:bg-white/10 hover:text-pure hover:border-cosmic-gold/30 active:scale-[0.98]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display ${
                          answered && isSelected
                            ? 'bg-cosmic-gold text-black'
                            : 'bg-white/10 text-stardust'
                        }`}>
                          {['A','B','C','D'][i]}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-void via-void/90 to-transparent">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => { if (qGlobal > 0) { setAnswered(false); prevQuestion() } }}
            disabled={qGlobal === 0}
            className="glass rounded-xl px-4 py-3 text-xs text-stardust disabled:opacity-30 hover:text-pure transition-colors"
          >
            ← Back
          </button>

          {answered ? (
            <button onClick={handleNext} className="flex-1 px-6 py-3 rounded-xl font-semibold font-display text-sm bg-gradient-to-r from-cosmic-gold to-astral-teal text-black hover:shadow-lg hover:shadow-cosmic-gold/30 transition-all flex items-center justify-center gap-2">
              {isLast ? '✨ View My Destiny' : 'Next Question →'}
            </button>
          ) : (
            <p className="text-xs text-stardust/40 text-center flex-1">Press 1-4 or click an answer</p>
          )}
        </div>
      </div>
    </div>
  )
}

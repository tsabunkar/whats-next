import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import HogwartsBackground from '../components/HogwartsBackground'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-void flex items-center justify-center px-4 overflow-hidden">
      <HogwartsBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <motion.p
          className="text-xs font-display uppercase tracking-[0.3em] text-cosmic-gold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Discover Your Path
        </motion.p>

        <motion.h1
          className="text-4xl md:text-6xl font-display font-bold leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="gradient-gold">What's Next?</span>
        </motion.h1>

        <motion.p
          className="text-base md:text-lg text-stardust font-body mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Answer 15 questions across 5 chapters to discover careers tailored to your personality, values, and strengths.
        </motion.p>

        <motion.button
          onClick={() => navigate('/quest')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cosmic-gold to-amber-500 text-black font-bold text-lg font-display shadow-lg shadow-cosmic-gold/20 hover:shadow-xl hover:shadow-cosmic-gold/40 transition-all duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          Begin the Journey →
        </motion.button>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {[
            { icon: '🧠', title: 'Psychology-Based', desc: 'Traits, values, and motivations' },
            { icon: '💼', title: '115+ Careers', desc: 'Across every industry' },
            { icon: '🔮', title: 'Optional Astrology', desc: 'Vedic overlay for deeper insight' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-display text-pure mb-1">{f.title}</h3>
              <p className="text-xs text-stardust font-body">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
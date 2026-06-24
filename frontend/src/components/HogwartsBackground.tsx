import { useMemo } from 'react'
import { motion } from 'framer-motion'

function Stars({ count = 6 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const isBright = Math.random() > 0.85
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 70}%`,
          size: isBright ? 1.2 + Math.random() * 0.8 : 0.3 + Math.random() * 0.6,
          delay: Math.random() * 8,
          duration: 3 + Math.random() * 6,
          brightness: isBright ? 0.5 + Math.random() * 0.4 : 0.15 + Math.random() * 0.25,
          twinkle: isBright,
        }
      }),
    [count],
  )
  return (
    <>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: s.left,
            top: s.top,
            backgroundColor: `rgba(255, 255, 255, ${s.brightness})`,
            boxShadow: s.twinkle
              ? `0 0 ${s.size * 3}px rgba(200, 200, 255, ${s.brightness * 0.3})`
              : 'none',
          }}
          animate={s.twinkle
            ? { opacity: [s.brightness * 0.4, s.brightness, s.brightness * 0.4] }
            : { opacity: [s.brightness * 0.7, s.brightness, s.brightness * 0.7] }
          }
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}

function NebulaClouds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '15%',
          left: '10%',
          width: '55%',
          height: '35%',
          background: 'radial-gradient(ellipse, rgba(80, 40, 120, 0.25) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '50%',
          right: '15%',
          width: '45%',
          height: '30%',
          background: 'radial-gradient(ellipse, rgba(20, 60, 120, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '30%',
          left: '45%',
          width: '40%',
          height: '25%',
          background: 'radial-gradient(ellipse, rgba(60, 20, 80, 0.15) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function DistantGalaxy() {
  return (
    <div
      className="absolute"
      style={{ top: '20%', right: '8%', width: '120px', height: '80px' }}
    >
      <motion.div
        className="w-full h-full rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(180,120,200,0.12) 0%, rgba(100,60,140,0.06) 40%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'rotate(-30deg)',
        }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.03, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '20%',
          left: '15%',
          width: '30%',
          height: '60%',
          background: 'radial-gradient(ellipse, rgba(200,150,255,0.08) 0%, transparent 70%)',
          filter: 'blur(4px)',
          transform: 'rotate(-30deg)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function AuroraBeam({ index, total }: { index: number; total: number }) {
  const xPos = (index / total) * 100
  const height = 15 + Math.random() * 25
  const width = 30 + Math.random() * 60
  const hue = 120 + Math.random() * 40
  const isPurple = Math.random() > 0.6

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${xPos}%`,
        top: `${5 + Math.random() * 8}%`,
        width: `${width}px`,
        height: `${height}%`,
        transformOrigin: '50% 0%',
      }}
      animate={{
        x: [
          0,
          -5 + Math.random() * 10,
          0,
          5 - Math.random() * 10,
          0,
        ],
        scaleX: [1, 0.7 + Math.random() * 0.6, 1, 0.6 + Math.random() * 0.8, 1],
        scaleY: [1, 0.85 + Math.random() * 0.3, 1, 0.8 + Math.random() * 0.4, 1],
        skewX: [0, -2 + Math.random() * 4, 0, 2 - Math.random() * 4, 0],
        opacity: [
          0.3 + Math.random() * 0.3,
          0.6 + Math.random() * 0.4,
          0.2 + Math.random() * 0.3,
          0.5 + Math.random() * 0.5,
          0.3 + Math.random() * 0.3,
        ],
      }}
      transition={{
        duration: 6 + Math.random() * 8,
        repeat: Infinity,
        delay: Math.random() * 5,
        ease: 'easeInOut',
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: isPurple
            ? `linear-gradient(180deg, rgba(${120 + Math.random() * 40},0,${180 + Math.random() * 75},${0.06 + Math.random() * 0.06}) 0%, rgba(${150 + Math.random() * 40},0,${200 + Math.random() * 55},${0.03 + Math.random() * 0.04}) 40%, transparent 100%)`
            : `linear-gradient(180deg, rgba(${60 + Math.random() * 40},${200 + Math.random() * 55},${80 + Math.random() * 40},${0.08 + Math.random() * 0.07}) 0%, rgba(${40 + Math.random() * 30},${150 + Math.random() * 50},${60 + Math.random() * 30},${0.04 + Math.random() * 0.05}) 40%, transparent 100%)`,
          filter: `blur(${8 + Math.random() * 12}px)`,
          boxShadow: isPurple
            ? `0 0 ${20 + Math.random() * 30}px rgba(${150 + Math.random() * 40},0,${200 + Math.random() * 55},${0.05 + Math.random() * 0.05})`
            : `0 0 ${20 + Math.random() * 30}px rgba(${60 + Math.random() * 40},${200 + Math.random() * 55},${80 + Math.random() * 40},${0.06 + Math.random() * 0.06})`,
        }}
      />
    </motion.div>
  )
}

function Aurora() {
  const beamCount = 40
  const beams = useMemo(
    () => Array.from({ length: beamCount }).map((_, i) => ({ id: i })),
    [],
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Ambient aurora glow - background layer */}
      <motion.div
        className="absolute"
        style={{
          top: '2%',
          left: '-10%',
          width: '120%',
          height: '35%',
          background: 'linear-gradient(180deg, rgba(60,200,120,0.025) 0%, rgba(40,150,80,0.015) 30%, transparent 100%)',
          filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.15, 0.35, 0.2, 0.3, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Purple ambient layer */}
      <motion.div
        className="absolute"
        style={{
          top: '0%',
          left: '-5%',
          width: '110%',
          height: '30%',
          background: 'linear-gradient(180deg, rgba(120,40,180,0.015) 0%, transparent 100%)',
          filter: 'blur(80px)',
        }}
        animate={{ opacity: [0.1, 0.25, 0.15, 0.2, 0.1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Individual dancing beams */}
      <div className="absolute inset-0">
        {beams.map((b) => (
          <AuroraBeam key={b.id} index={b.id} total={beamCount} />
        ))}
      </div>

      {/* Bottom glow reflection */}
      <motion.div
        className="absolute"
        style={{
          top: '28%',
          left: '-10%',
          width: '120%',
          height: '10%',
          background: 'linear-gradient(180deg, rgba(60,200,120,0.01) 0%, transparent 100%)',
          filter: 'blur(50px)',
        }}
        animate={{ opacity: [0.05, 0.15, 0.08, 0.12, 0.05] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function CosmicDust() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute"
        style={{
          top: '70%',
          left: '0%',
          width: '100%',
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(20,30,60,0.3) 50%, rgba(10,15,40,0.6) 100%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export default function HogwartsBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Galaxy image base */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/galaxy.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          filter: 'brightness(0.95) saturate(1.05) contrast(1.0)',
        }}
      />

      {/* Deep space overlay - lighter for aurora */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(5,5,20,0.4) 0%, rgba(8,8,25,0.2) 30%, rgba(10,10,30,0.1) 50%, rgba(10,10,25,0.3) 80%, rgba(5,5,20,0.5) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Aurora photo enhancer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, transparent 20%, rgba(40,80,60,0.04) 50%, transparent 80%)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Aurora borealis */}
      <Aurora />

      {/* Nebula clouds */}
      <NebulaClouds />

      {/* Distant galaxy */}
      <DistantGalaxy />

      {/* Stars */}
      <Stars count={6} />

      {/* Cosmic dust */}
      <CosmicDust />
    </div>
  )
}
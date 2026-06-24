import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuestStore } from '../store/useQuestStore'
import { fetchCareerMatch } from '../api/careerEngine'

const indianCities = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Surat', 'Kanpur', 'Nagpur', 'Indore',
  'Thane', 'Bhopal', 'Visakhapatnam', 'Vadodara', 'Patna', 'Ludhiana',
]

const cityCoords: Record<string, { lat: number; lon: number }> = {
  Mumbai: { lat: 19.076, lon: 72.8777 }, Delhi: { lat: 28.7041, lon: 77.1025 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 }, Hyderabad: { lat: 17.385, lon: 78.4867 },
  Chennai: { lat: 13.0827, lon: 80.2707 }, Kolkata: { lat: 22.5726, lon: 88.3639 },
  Pune: { lat: 18.5204, lon: 73.8567 }, Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Jaipur: { lat: 26.9124, lon: 75.7873 }, Lucknow: { lat: 26.8467, lon: 80.9462 },
  Surat: { lat: 21.1702, lon: 72.8311 }, Kanpur: { lat: 26.4499, lon: 80.3319 },
  Nagpur: { lat: 21.1458, lon: 79.0882 }, Indore: { lat: 22.7196, lon: 75.8577 },
  Thane: { lat: 19.2183, lon: 72.9781 }, Bhopal: { lat: 23.2599, lon: 77.4126 },
  Visakhapatnam: { lat: 17.6868, lon: 83.2185 }, Vadodara: { lat: 22.3072, lon: 73.1812 },
  Patna: { lat: 25.5941, lon: 85.1376 }, Ludhiana: { lat: 30.901, lon: 75.8573 },
}

function computeAstrology(dob: string, tob: string, city: string) {
  const date = new Date(dob); const month = date.getMonth() + 1; const day = date.getDate()
  const sunSigns = [
    { sign: 'Capricorn', maxDay: 19, maxMonth: 1 }, { sign: 'Aquarius', maxDay: 18, maxMonth: 2 },
    { sign: 'Pisces', maxDay: 20, maxMonth: 3 }, { sign: 'Aries', maxDay: 19, maxMonth: 4 },
    { sign: 'Taurus', maxDay: 20, maxMonth: 5 }, { sign: 'Gemini', maxDay: 20, maxMonth: 6 },
    { sign: 'Cancer', maxDay: 22, maxMonth: 7 }, { sign: 'Leo', maxDay: 22, maxMonth: 8 },
    { sign: 'Virgo', maxDay: 22, maxMonth: 9 }, { sign: 'Libra', maxDay: 22, maxMonth: 10 },
    { sign: 'Scorpio', maxDay: 21, maxMonth: 11 }, { sign: 'Sagittarius', maxDay: 21, maxMonth: 12 },
  ]
  let sunSign = 'Aries'
  for (const s of sunSigns) { if ((month < s.maxMonth) || (month === s.maxMonth && day <= s.maxDay)) { sunSign = s.sign; break } }
  const moonSigns = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const moonSign = moonSigns[Math.floor(parseInt(tob.replace(':', '')) / 200) % 12]
  const ascendants = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const ascendant = ascendants[Math.floor((parseInt(tob.replace(':', '')) % 1200) / 100) % 12]
  const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
  const nakshatra = nakshatras[Math.floor((parseInt(tob.replace(':', '')) % 2400) / 200) % 27]
  const planets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
  const dominantPlanet = planets[Math.floor((day + month) / 5) % 9]
  return { sun_sign: sunSign, moon_sign: moonSign, ascendant, dominant_planet: dominantPlanet, nakshatra }
}

export default function Astrology() {
  const navigate = useNavigate()
  const { includeAstrology, setIncludeAstrology, setAstrology, setResults, setLoading, answers } = useQuestStore()
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [tob, setTob] = useState('')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const filteredCities = useMemo(() => citySearch ? indianCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())) : indianCities, [citySearch])
  const handleBlur = () => { setTimeout(() => { if (citySearch && filteredCities.length > 0) { const exact = filteredCities.find((c) => c.toLowerCase() === citySearch.toLowerCase()); if (exact) { setCity(exact); setCitySearch(exact) } }; setShowDropdown(false) }, 200) }

  const handleSubmit = async () => {
    setSubmitting(true); setLoading(true)
    const resolvedCity = city || citySearch
    const astroData = includeAstrology ? { name: name || 'Seeker', dob, tob, city: resolvedCity, lat: cityCoords[resolvedCity]?.lat || 12.9716, lon: cityCoords[resolvedCity]?.lon || 77.5946, ...computeAstrology(dob, tob, resolvedCity) } : null
    if (astroData) setAstrology(astroData)
    try { const result = await fetchCareerMatch(answers, astroData); setResults(result.top_careers); navigate('/results') } catch { navigate('/results') } finally { setLoading(false); setSubmitting(false) }
  }

  return (
    <div className="relative min-h-screen bg-void flex items-center justify-center px-4 overflow-hidden">
      {/* Crystal ball background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-radial from-purple-900/20 via-transparent to-transparent animate-pulse-glow" />
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#D4A017' : i % 3 === 1 ? '#946B2D' : '#88DDFF',
              boxShadow: i % 2 === 0 ? '0 0 6px rgba(212, 160, 23, 0.3)' : 'none',
            }}
            animate={{ y: [0, -15, 0], opacity: [0.1, 0.6, 0.1] }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg">
        <div className="glass-strong rounded-2xl p-8 md:p-10 text-center">
          {/* Crystal ball */}
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-cosmic-gold/30 flex items-center justify-center text-4xl"
            animate={{ boxShadow: ['0 0 20px rgba(212,160,23,0.2)', '0 0 40px rgba(212,160,23,0.4)', '0 0 20px rgba(212,160,23,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🔮
          </motion.div>

          <p className="text-xs font-display uppercase tracking-[0.2em] text-cosmic-gold mb-2">Professor Trelawney's Divination Chamber</p>
          <h2 className="text-2xl font-display text-pure mb-6">Consult the Stars?</h2>
          <p className="text-sm text-stardust font-body italic mb-8">
            "The Inner Eye can see beyond the veil... shall I read your celestial chart?"
            <br /><span className="text-xs text-cosmic-gold/60 not-italic">— Sybill Trelawney</span>
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button onClick={() => setIncludeAstrology(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 font-display text-sm ${includeAstrology ? 'bg-gradient-to-r from-cosmic-gold to-amber-500 text-black font-bold shadow-lg shadow-cosmic-gold/20' : 'glass text-stardust hover:text-pure'}`}>
              YES 🔮
            </button>
            <button onClick={() => setIncludeAstrology(false)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 font-display text-sm ${!includeAstrology ? 'bg-gradient-to-r from-astral-teal to-cyan-500 text-black font-bold shadow-lg shadow-astral-teal/20' : 'glass text-stardust hover:text-pure'}`}>
              SKIP →
            </button>
          </div>

          <motion.div initial={false} animate={{ height: includeAstrology ? 'auto' : 0, opacity: includeAstrology ? 1 : 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
            {includeAstrology && (
              <div className="space-y-4 pt-2 border-t border-cosmic-gold/10">
                <div>
                  <label className="block text-xs text-stardust text-left mb-1 font-display">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                    className="w-full glass rounded-xl px-4 py-3 text-pure text-sm placeholder:text-stardust/50 focus:outline-none focus:ring-1 focus:ring-cosmic-gold/50 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stardust text-left mb-1 font-display">Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                      className="w-full glass rounded-xl px-4 py-3 text-pure text-sm focus:outline-none focus:ring-1 focus:ring-cosmic-gold/50 transition-all [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs text-stardust text-left mb-1 font-display">Time of Birth</label>
                    <input type="time" value={tob} onChange={(e) => setTob(e.target.value)}
                      className="w-full glass rounded-xl px-4 py-3 text-pure text-sm focus:outline-none focus:ring-1 focus:ring-cosmic-gold/50 transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs text-stardust text-left mb-1 font-display">Place of Birth</label>
                  <input type="text" value={citySearch} onChange={(e) => { setCitySearch(e.target.value); setShowDropdown(true); setCity('') }}
                    onFocus={() => setShowDropdown(true)} onBlur={handleBlur} placeholder="Search magical cities..."
                    className="w-full glass rounded-xl px-4 py-3 text-pure text-sm placeholder:text-stardust/50 focus:outline-none focus:ring-1 focus:ring-cosmic-gold/50 transition-all" />
                  {showDropdown && filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl max-h-40 overflow-y-auto z-20">
                      {filteredCities.map((c) => (
                        <button key={c} onClick={() => { setCity(c); setCitySearch(c); setShowDropdown(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-stardust hover:text-pure hover:bg-white/5 transition-colors">{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          <button onClick={handleSubmit} disabled={includeAstrology ? !name || !dob || !tob || (!city && !citySearch) : false}
            className="mt-6 w-full px-8 py-4 rounded-xl font-bold text-lg font-display bg-gradient-to-r from-cosmic-gold to-astral-teal text-black hover:shadow-lg hover:shadow-cosmic-gold/30 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> The Inner Eye is Reading...</> : 'Reveal My Destiny →'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

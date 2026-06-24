import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

const Landing = lazy(() => import('./pages/Landing'))
const Quest = lazy(() => import('./pages/Quest'))
const Astrology = lazy(() => import('./pages/Astrology'))
const Results = lazy(() => import('./pages/Results'))

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-void flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cosmic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stardust text-sm font-display tracking-wider">A Hogwarts owl is fetching your page...</p>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quest" element={<Quest />} />
          <Route path="/astrology" element={<Astrology />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Suspense>
    </>
  )
}

import { lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

// Lazy load route components
const Dashboard = lazy(() => import('./components/Dashboard'))
const HomePage = lazy(() => import('./components/HomePage'))

// Loading fallback component
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-600 dark:text-zinc-400 text-sm">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
     <Analytics />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/*" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App

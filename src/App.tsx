import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './components/Dashboard'
import HomePage from './components/HomePage'

function App() {
  return (
    <BrowserRouter>
     <Analytics />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

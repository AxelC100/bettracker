import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Bets from './pages/Bets/Bets'
import NewBet from './pages/Bets/NewBet'
import Analytics from './pages/Analytics/Analytics'
import Settings from './pages/Settings/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bets" element={<Bets />} />
        <Route path="/bets/new" element={<NewBet />} />

        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
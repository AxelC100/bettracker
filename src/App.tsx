import ImportBet from './pages/Import/ImportBet'
import { AuthProvider, Protected, GuestOnly } from './lib/auth'
import { BetsProvider } from './lib/bets'
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/Login/Login'
import Register from './pages/Register/Register'

import Dashboard from './pages/Dashboard/Dashboard'
import Bets from './pages/Bets/Bets'
import NewBet from './pages/Bets/NewBet'
import EditBet from './pages/Bets/EditBet'
import Analytics from './pages/Analytics/Analytics'
import Settings from './pages/Settings/Settings'

import AppLayout from './layouts/AppLayout'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        <Route element={<Protected><BetsProvider><AppLayout /></BetsProvider></Protected>}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/bets" element={<Bets />} />

          <Route path="/bets/new" element={<NewBet />} />
          <Route path="/bets/import" element={<ImportBet />} />

          <Route
            path="/bets/:id/edit"
            element={<EditBet />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>
      </Routes>
      </AuthProvider>
    </HashRouter>
  )
}

export default App
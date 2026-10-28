import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './AppLayout.css'

function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [error, setError] = useState('')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>BetTracker</h2>
          <span>Sports Analytics</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/bets" end
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            Mis apuestas
          </NavLink>

          <NavLink
            to="/bets/new"
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            Nueva apuesta
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            Analytics
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            Configuración
          </NavLink>
        </nav>

        <NavLink to="/bets/import" className="sidebar-link">Importar captura</NavLink>
        <div className="sidebar-footer">
          <p>{user?.name}</p>
          {error && <p role="alert">{error}</p>}
          <button
            type="button"
            onClick={async () => { try { await logout(); navigate('/login') } catch (e) { setError((e as Error).message) } }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
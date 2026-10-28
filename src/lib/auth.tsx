import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { api, ApiError } from './api'
type User = { id: string; name: string; email: string }
const Context = createContext<{ user: User | null; confirmSession: () => Promise<void>; logout: () => Promise<void> } | null>(null)
export function useAuth() { return useContext(Context)! }
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { setUser(await api<User>('/auth/me')) }
    catch (e) { if (!(e instanceof ApiError && e.status === 401)) setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  if (loading) return <main role="status">Conectando con BetTracker…</main>
  if (error) return <main><p role="alert">{error}</p><button onClick={() => void load()}>Reintentar conexión</button></main>
  async function confirmSession() {
    try { setUser(await api<User>('/auth/me')) }
    catch (e) {
      if (e instanceof ApiError && e.status === 401) throw new Error('El servidor no pudo mantener la sesión. Permite las cookies de este sitio e intenta de nuevo.')
      throw e
    }
  }
  return <Context.Provider value={{ user, confirmSession, logout: async () => { await api('/auth/logout', 'POST', {}); setUser(null) } }}>{children}</Context.Provider>
}
export function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

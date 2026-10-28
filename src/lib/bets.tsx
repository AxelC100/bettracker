import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
export type { BetStatus } from '../../shared/types'
export type Bet = import('../../shared/types').Ticket
const Context = createContext<{ bets: Bet[]; reload: () => Promise<void>; create: (bet: Bet) => Promise<void>; update: (bet: Bet) => Promise<void>; remove: (id: string) => Promise<void> } | null>(null)
export function useBets() { return useContext(Context)! }
export function BetsProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { setBets(await api<Bet[]>('/bets')) } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  if (loading) return <main role="status">Cargando apuestas…</main>
  if (error) return <main><p role="alert">{error}</p><button onClick={() => void load()}>Reintentar</button></main>
  return <Context.Provider value={{ bets, reload: async () => { setBets(await api<Bet[]>('/bets')) }, create: async bet => { const saved = await api<Bet>('/bets', 'POST', bet); setBets(previous => [...previous, saved]) }, update: async bet => { const saved = await api<Bet>(`/bets/${bet.id}`, 'PUT', bet); setBets(previous => previous.map(item => item.id === saved.id ? saved : item)) }, remove: async id => { await api(`/bets/${id}`, 'DELETE'); setBets(previous => previous.filter(item => item.id !== id)) } }}>{children}</Context.Provider>
}

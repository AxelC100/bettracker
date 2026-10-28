import { useEffect, useState } from 'react'
import { useBets } from '../../lib/bets'
import { api } from '../../lib/api'
export default function Settings() {
  const { bets, reload } = useBets()
  const [integrations,setIntegrations]=useState<{vision:boolean;localOcr:boolean;results:{sport:string;configured:boolean}[]}|null>(null)
  useEffect(()=>{let active=true;void api<typeof integrations>('/integrations').then(value=>{if(active)setIntegrations(value)}).catch(()=>{});return()=>{active=false}},[])

  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function importLocal() {
    setMessage('')
    let local: unknown
    try { local = JSON.parse(localStorage.getItem('bets') || '[]') } catch { setMessage('Los datos locales no tienen un formato válido. Se conservaron sin cambios.'); return }
    if (!Array.isArray(local) || !local.length) { setMessage('No hay apuestas locales para importar.'); return }
    if (local.some(bet => bet && typeof bet === 'object' && bet.currency && bet.currency !== 'USDT')) { setMessage('Hay apuestas en otra moneda. Solo se pueden importar apuestas en USDT; no se realiza conversión automática.'); return }
    if (!window.confirm(`¿Importar ${local.length} apuestas de este navegador a tu cuenta actual? Comprueba que sean tuyas y que los montos originales estén expresados en USDT. No se convertirán importes desde USD u otras monedas. Se conservará el original local.`)) return
    setBusy(true)
    try {
      const result = await api<{ imported: number; skipped: number }>('/bets/import', 'POST', { bets: local.map(bet => ({ ...bet, currency: 'USDT' })) })
      await reload()
      setMessage(`Importadas: ${result.imported}. Ya existentes: ${result.skipped}. Los originales siguen en este navegador.`)
    } catch (e) { setMessage((e as Error).message) } finally { setBusy(false) }
  }
  return <main className="bets-page"><h1>Configuración</h1>{integrations&&<section className="form-card"><h2>Conexiones</h2><p>Visión con IA: {integrations.vision?'configurada':'pendiente de configurar'}. OCR local: {integrations.localOcr?'disponible':'no disponible'}.</p>{integrations.results.map(r=><p key={r.sport}>{({football:'Fútbol',basketball:'Baloncesto',baseball:'Béisbol'} as Record<string,string>)[r.sport]}: {r.configured?'clave configurada; cobertura según proveedor':'conexión de resultados pendiente'}</p>)}</section>}<section className="bets-panel"><h2>Cuenta y datos</h2><p>Moneda inicial: USDT. Apuestas en tu cuenta: {bets.length}.</p><p>Puedes importar las apuestas que registraste antes de crear tu cuenta. La importación conserva el original y omite identificadores ya existentes.</p><button type="button" disabled={busy} onClick={() => void importLocal()}>{busy ? 'Importando…' : 'Importar apuestas de este navegador'}</button>{message && <p role="status">{message}</p>}</section></main>
}

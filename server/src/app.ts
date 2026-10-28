import { extractImage } from './image-import.js'
import { fetchFixtures, IntegrationError } from './providers.js'
import { syncResults, startResultsWorker } from './settlement.js'
import type { Sport } from '../../shared/types.js'
import { decorateTicket } from './tickets.js'
import express from 'express'
import { randomUUID, randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { pool, migrate } from './config/db.js'

const scrypt = promisify(scryptCallback)
export const app = express()
app.disable('x-powered-by')
app.use('/api/import/image',session,express.json({limit:'9mb'}))
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin')
    const allowed = process.env.APP_ORIGIN
      ? [process.env.APP_ORIGIN]
      : [
          `${req.protocol}://${req.get('host')}`,
          ...(process.env.NODE_ENV !== 'production'
            ? ['http://127.0.0.1:5173', 'http://localhost:5173']
            : []),
        ]
    if (origin && !allowed.includes(origin)) { res.status(403).json({ error: 'Origen no permitido.' }); return }
    if (req.method !== 'DELETE' && !req.is('application/json')) { res.status(415).json({ error: 'Se requiere JSON.' }); return }
  }
  res.set('Cache-Control', 'no-store')
  next()
})
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const cookieName = 'bettracker_session'
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/api' }
function token(req: express.Request) {
  return req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || ''
}
async function session(req: express.Request, res: express.Response, next: express.NextFunction) {
  const result = await pool.query('SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()', [digest(token(req))])
  if (!result.rows[0]) { res.status(401).json({ error: 'Inicia sesión para continuar.' }); return }
  res.locals.user = result.rows[0]
  next()
}
async function createSession(userId: string, res: express.Response, remember: boolean) {
  const raw = randomBytes(32).toString('hex')
  const age = (remember ? 30 : 1) * 86400000
  await pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [digest(raw), userId, new Date(Date.now() + age)])
  res.cookie(cookieName, raw, { ...cookieOptions, ...(remember ? { maxAge: age } : {}) })
}
const attempts = new Map<string, { count: number; until: number }>()
app.use('/api/auth', (req, res, next) => {
  if (req.method !== 'POST') { next(); return }
  const now = Date.now()
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key)
  const key = req.ip || 'unknown'
  const entry = attempts.get(key) || { count: 0, until: now + 600000 }
  entry.count++; attempts.set(key, entry)
  if (entry.count > 30) { res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }); return }
  next()
})
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 10 || password.length > 128) {
    res.status(400).json({ error: 'Indica nombre, correo válido y contraseña de 10 a 128 caracteres.' }); return
  }
  const salt = randomBytes(16).toString('hex')
  const hash = (await scrypt(password, salt, 64) as Buffer).toString('hex')
  const user = { id: randomUUID(), name: name.trim(), email: email.trim().toLowerCase() }
  try { await pool.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [user.id, user.name, user.email, `${salt}:${hash}`]) }
  catch (error) { if ((error as { code?: string }).code === '23505') { res.status(409).json({ error: 'Este correo ya está registrado.' }); return }; throw error }
  await createSession(user.id, res, false)
  res.status(201).json(user)
})
app.post('/api/auth/login', async (req, res) => {
  const { email, password, remember } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) { res.status(400).json({ error: 'Indica correo y contraseña.' }); return }
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.trim().toLowerCase()])
  const user = result.rows[0]
  const [salt, hash] = (user?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':')
  const candidate = await scrypt(password, salt, 64) as Buffer
  if (!user || !timingSafeEqual(candidate, Buffer.from(hash, 'hex'))) { res.status(401).json({ error: 'Correo o contraseña incorrectos.' }); return }
  await createSession(user.id, res, remember === true)
  res.json({ id: user.id, name: user.name, email: user.email })
})
app.get('/api/auth/me', session, (_req, res) => res.json(res.locals.user))
app.post('/api/auth/logout', async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE token_hash=$1', [digest(token(req))])
  res.clearCookie(cookieName, cookieOptions).json({ ok: true })
})
const imageRequests=new Map<string,number>()
app.post('/api/import/image',async(req,res)=>{
 const id=res.locals.user.id as string
 if((imageRequests.get(id)||0)>Date.now()){res.status(429).json({error:'Espera unos segundos antes de cargar otra captura.'});return}
 for(const[key,until]of imageRequests)if(until<Date.now())imageRequests.delete(key)
 imageRequests.set(id,Date.now()+10000)
 try{res.json(await extractImage(req.body?.image,String(req.body?.mode||'local')))}catch(e){if(e instanceof IntegrationError){res.status(e.status).json({error:e.message});return}throw e}
})
app.use('/api/results',session)
app.get('/api/integrations',session,(_req,res)=>res.json({vision:!!process.env.OPENAI_API_KEY,localOcr:process.platform==='win32',results:['football','basketball','baseball'].map(sport=>({sport,configured:!!(process.env.API_SPORTS_KEY||process.env[`API_SPORTS_${sport.toUpperCase()}_KEY`])}))}))
app.get('/api/results/fixtures',async(req,res)=>{
 const sport=String(req.query.sport) as Sport,date=String(req.query.date||'')
 if(!['football','basketball','baseball'].includes(sport)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))){res.status(400).json({error:'Deporte o fecha inválidos.'});return}
 try{res.json({fixtures:await fetchFixtures(sport,{date})})}catch(e){if(e instanceof IntegrationError){res.status(e.status).json({error:e.message});return}throw e}
})
const syncRequests=new Map<string,number>()
app.post('/api/results/sync',async(_req,res)=>{
 const id=res.locals.user.id as string
 if((syncRequests.get(id)||0)>Date.now()){res.status(429).json({error:'Espera un minuto antes de volver a consultar.'});return}
 for(const [key,until]of syncRequests)if(until<Date.now())syncRequests.delete(key)
 syncRequests.set(id,Date.now()+60000)
 try{res.json(await syncResults(id))}catch(e){if(e instanceof IntegrationError){res.status(e.status).json({error:e.message});return}throw e}
})
app.get('/api/results/audit/:id',async(req,res)=>{
 if(!/^[a-f0-9-]{36}$/i.test(String(req.params.id))){res.status(400).json({error:'Identificador inválido.'});return}
 const result=await pool.query('SELECT evidence,created_at FROM settlement_audit WHERE user_id=$1 AND ticket_id=$2 ORDER BY created_at DESC LIMIT 20',[res.locals.user.id,req.params.id]);res.json(result.rows)
})
app.use('/api/bets', session)
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function validateFlat(input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Datos de apuesta inválidos.')
  const b = input as Record<string, unknown>
  const fields = ['sport','country','league','event','eventDate','bookmaker','market','selection','notes'] as const
  const clean: Record<string, unknown> = {}
  for (const key of fields) {
    if (typeof b[key] !== 'string' || (b[key] as string).length > (key === 'notes' ? 5000 : 300)) throw new Error(`Campo inválido: ${key}.`)
    clean[key] = (b[key] as string).trim()
  }
  if (!clean.sport || !clean.event || !clean.market || !clean.selection || !Number.isFinite(Date.parse(String(clean.eventDate)))) throw new Error('Completa los datos del evento y la selección.')
  if (typeof b.id !== 'string' || !uuid.test(b.id) || typeof b.odds !== 'number' || !Number.isFinite(b.odds) || b.odds <= 1 || b.odds > 1000000 || typeof b.stake !== 'number' || !Number.isFinite(b.stake) || b.stake <= 0 || b.stake > 1000000000 || !['pending','won','lost','void'].includes(String(b.status))) throw new Error('Cuota, monto, estado o identificador inválidos.')
  if (b.currency !== 'USDT') throw new Error('La moneda debe ser USDT. No se convierten importes de otras monedas.')
  const stake = b.stake
  if (stake < 0.00000001 || Number(stake.toFixed(8)) !== stake) throw new Error('El monto debe ser al menos 0.00000001 USDT y tener hasta 8 decimales.')
  const units = BigInt(stake.toFixed(8).replace('.', ''))
  const oddsUnits = BigInt(b.odds.toFixed(8).replace('.', ''))
  const returnUnits = (units * oddsUnits + 50000000n) / 100000000n
  const potentialReturn = Number(returnUnits) / 100000000
  const potentialProfit = Number(returnUnits - units) / 100000000
  return { ...clean, id: b.id, odds: b.odds, stake, status: b.status, currency: 'USDT', potentialReturn, potentialProfit, createdAt: typeof b.createdAt === 'string' && Number.isFinite(Date.parse(b.createdAt)) ? new Date(b.createdAt).toISOString() : new Date().toISOString() }
}
export function validateBet(input: unknown) {
 const raw = input as Record<string,unknown>
 if (raw && Array.isArray(raw.legs) && raw.legs[0] && typeof raw.legs[0]==='object') {
  const first=raw.legs[0] as Record<string,unknown>
  const base=validateFlat({...raw,sport:first.sport,country:first.country||'',league:first.league||'',event:first.event,eventDate:first.eventDate,market:first.market,selection:first.selection})
  return decorateTicket(base,raw)
 }
 return decorateTicket(validateFlat(input),raw)
}
app.get('/api/bets', async (_req, res) => {
  const result = await pool.query('SELECT data FROM bets WHERE user_id=$1 ORDER BY created_at,id', [res.locals.user.id])
  res.json(result.rows.map(row => row.data))
})
app.post('/api/bets/import', async (req, res) => {
  if (!Array.isArray(req.body?.bets) || req.body.bets.length > 1000) { res.status(400).json({ error: 'Importa hasta 1000 apuestas por operación.' }); return }
  let bets
  try { bets = req.body.bets.map(validateBet) } catch (error) { res.status(400).json({ error: (error as Error).message }); return }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let imported = 0
    for (const bet of bets) {
      const result = await client.query('INSERT INTO bets(id,user_id,data,created_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', [bet.id, res.locals.user.id, bet, bet.createdAt])
      imported += result.rowCount || 0
    }
    await client.query('COMMIT'); res.json({ imported, skipped: bets.length - imported })
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
})
app.post('/api/bets', async (req, res) => {
  let bet
  try { bet = validateBet(req.body) } catch (error) { res.status(400).json({ error: (error as Error).message }); return }
  try { await pool.query('INSERT INTO bets(id,user_id,data,created_at) VALUES($1,$2,$3,$4)', [bet.id, res.locals.user.id, bet, bet.createdAt]) }
  catch (error) { if ((error as {code?: string}).code === '23505') { res.status(409).json({error:'El ticket o esta captura ya fueron registrados. Revisa el historial para evitar duplicados.'}); return }; throw error }
  res.status(201).json(bet)
})
app.put('/api/bets/:id', async (req, res) => {
  let bet
  try { bet = validateBet({ ...req.body, id: req.params.id }) } catch (error) { res.status(400).json({ error: (error as Error).message }); return }
  const result = await pool.query("UPDATE bets SET data=$3::jsonb || jsonb_build_object('createdAt', data->'createdAt') WHERE id=$1 AND user_id=$2 RETURNING data", [bet.id, res.locals.user.id, bet])
  if (!result.rows[0]) { res.status(404).json({ error: 'No se encontró la apuesta.' }); return }
  res.json(result.rows[0].data)
})
app.delete('/api/bets/:id', async (req, res) => {
  if (!uuid.test(String(req.params.id))) { res.status(400).json({ error: 'Identificador inválido.' }); return }
  const result = await pool.query('DELETE FROM bets WHERE id=$1 AND user_id=$2', [req.params.id, res.locals.user.id])
  if (!result.rowCount) { res.status(404).json({ error: 'No se encontró la apuesta.' }); return }
  res.json({ ok: true })
})
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (error as { status?: number }).status
  if (status === 400 || status === 413) { res.status(status).json({ error: 'Solicitud inválida o demasiado grande.' }); return }
  console.error('API error:', (error as { code?: string }).code || 'internal')
  res.status(503).json({ error: 'No se pudo completar la operación. Comprueba la conexión del servidor con PostgreSQL.' })
})
export async function start() {
  await migrate()
  startResultsWorker()
  return app.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('BetTracker API lista'))
}

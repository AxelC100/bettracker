import test from 'node:test'
import assert from 'node:assert/strict'
import { app, validateBet } from '../dist/app.js'
const bet = { id: '12345678-1234-4234-8234-123456789012', currency:'USDT',sport:'football', country:'', league:'', event:'A vs B', eventDate:'2026-10-27T12:00', bookmaker:'Stake', market:'match-winner', selection:'A', notes:'', odds:1.85, stake:10, status:'pending' }
test('server recalculates money and ignores supplied profit', () => {
 const result = validateBet({...bet,potentialProfit:99999})
 assert.equal(result.potentialReturn,18.5); assert.equal(result.potentialProfit,8.5); assert.equal(result.currency,'USDT')
})
test('rejects non-finite odds, invalid stake, identifiers, states and dates', () => {
 for(const change of [{odds:Infinity},{odds:NaN},{odds:1},{stake:-1},{stake:0.000000001},{id:'bad'},{status:'fake'},{eventDate:'bad'},{event:''}]) assert.throws(()=>validateBet({...bet,...change}))
})
test('preserves USDT stake precision and preserves valid import identity', () => {
 const result=validateBet({...bet,stake:10.125,createdAt:'2026-10-26T12:00:00Z'})
 assert.equal(result.stake,10.125); assert.equal(result.createdAt,'2026-10-26T12:00:00.000Z'); assert.equal(result.id,bet.id)
})
test('rejects oversized text and removes unrecognized fields', () => {
 assert.throws(()=>validateBet({...bet,notes:'a'.repeat(5001)}))
 assert.equal(validateBet({...bet,user_id:'another-user'}).user_id,undefined)
})
test('health and cross-origin request protection', async () => {
 const server=app.listen(0,'127.0.0.1')
 await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}`
 try {
  assert.equal((await fetch(`${base}/api/health`)).status,200)
  const response=await fetch(`${base}/api/auth/register`,{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'})
  assert.equal(response.status,403)
  for (const origin of ['http://127.0.0.1:5173', 'http://localhost:5173']) {
    const local = await fetch(`${base}/api/auth/register`, { method:'POST', headers:{origin,'content-type':'application/json'}, body:'{}' })
    assert.equal(local.status,400, `Development origin ${origin} must reach validation`)
  }
  const previousOrigin = process.env.APP_ORIGIN
  const previousEnvironment = process.env.NODE_ENV
  try {
    process.env.APP_ORIGIN = 'https://bettracker.example'
    const rejected = await fetch(`${base}/api/auth/register`, { method:'POST', headers:{origin:'http://127.0.0.1:5173','content-type':'application/json'}, body:'{}' })
    assert.equal(rejected.status,403)
    const accepted = await fetch(`${base}/api/auth/register`, { method:'POST', headers:{origin:'https://bettracker.example','content-type':'application/json'}, body:'{}' })
    assert.equal(accepted.status,400)
    delete process.env.APP_ORIGIN
    process.env.NODE_ENV = 'production'
    const production = await fetch(`${base}/api/auth/register`, { method:'POST', headers:{origin:'http://127.0.0.1:5173','content-type':'application/json'}, body:'{}' })
    assert.equal(production.status,403)
  } finally {
    if (previousOrigin === undefined) delete process.env.APP_ORIGIN
    else process.env.APP_ORIGIN = previousOrigin
    if (previousEnvironment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousEnvironment
  }
  assert.equal((await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'content-type':'text/plain'},body:'hello'})).status,415)
  assert.equal((await fetch(`${base}/api/auth/register`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Ana',email:'bad',password:'short'})})).status,400)
 } finally { await new Promise(resolve=>server.close(resolve)) }
})

test('USDT amounts keep eight decimals and reject other currencies', () => {
 const micro = validateBet({...bet, stake:0.00000001})
 assert.equal(micro.stake,0.00000001)
 assert.equal(micro.potentialReturn,0.00000002)
 assert.equal(micro.potentialProfit,0.00000001)
 const fractional = validateBet({...bet, stake:0.12345678, odds:1.63})
 assert.equal(fractional.potentialReturn,0.20123455)
 assert.equal(fractional.potentialProfit,0.07777777)
 for (const currency of ['USD','BTC',undefined]) assert.throws(() => validateBet({...bet,currency}), /USDT/)
 assert.throws(() => validateBet({...bet,stake:1.000000001}), /8/)
})

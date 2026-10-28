import {syncResults} from '../dist/settlement.js'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { app } from '../dist/app.js'
import { pool, migrate } from '../dist/config/db.js'
await migrate()
const server=app.listen(0,'127.0.0.1')
await new Promise(resolve=>server.once('listening',resolve))
const base=`http://127.0.0.1:${server.address().port}/api`
const users=[]
async function request(path,method='GET',body,cookie) {
 const response=await fetch(base+path,{method,headers:{'content-type':'application/json',...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}
}
try {
 const email=`test-${randomUUID()}@example.com`
 const a=await request('/auth/register','POST',{name:'Test A',email,password:'integration-password-123'})
 assert.equal(a.status,201); users.push(a.data.id); assert.match(a.cookie,/bettracker_session=/)
 const b=await request('/auth/register','POST',{name:'Test B',email:`test-${randomUUID()}@example.com`,password:'integration-password-123'})
 assert.equal(b.status,201); users.push(b.data.id)
 assert.equal((await request('/auth/me')).status,401)
 assert.equal((await request('/auth/me','GET',undefined,a.cookie)).data.email,email)
 assert.equal((await request('/auth/login','POST',{email,password:'wrong'})).status,401)
 const login=await request('/auth/login','POST',{email,password:'integration-password-123'})
 assert.equal(login.status,200)
 const bet={id:randomUUID(),currency:'USDT',sport:'football',country:'Costa Rica',league:'Test',event:'A vs B',eventDate:'2026-10-27T12:00',bookmaker:'Stake',market:'match-winner',selection:'A',notes:'',odds:1.85,stake:10,status:'pending'}
 assert.equal((await request('/bets','POST',bet,a.cookie)).status,201)
 assert.equal((await request('/bets','GET',undefined,b.cookie)).data.length,0)
 assert.equal((await request(`/bets/${bet.id}`,'PUT',{...bet,status:'won'},b.cookie)).status,404)
 assert.equal((await request(`/bets/${bet.id}`,'DELETE',undefined,b.cookie)).status,404)
 assert.equal((await request('/bets','GET',undefined,login.cookie)).data.length,1)
 assert.equal((await request(`/bets/${bet.id}`,'PUT',{...bet,status:'won'},a.cookie)).data.potentialProfit,8.5)
 const imported={...bet,id:randomUUID()}
 assert.equal((await request('/bets/import','POST',{bets:[imported]},a.cookie)).data.imported,1)
 assert.equal((await request('/bets/import','POST',{bets:[imported]},a.cookie)).data.skipped,1)
 assert.equal((await request('/bets/import','POST',{bets:[{...bet,id:randomUUID()}, {...bet,stake:-1}]},a.cookie)).status,400)
 assert.equal((await request('/bets','GET',undefined,a.cookie)).data.length,2)
 assert.equal((await request(`/bets/${bet.id}`,'DELETE',undefined,a.cookie)).status,200)

 const makeLeg=(changes={})=>({id:randomUUID(),sport:'basketball',country:'',league:'NBA',event:'A vs B',eventDate:'2026-10-27T12:00:00Z',home:'A',away:'B',market:'moneyline',selection:'A',side:'home',line:null,player:'',team:'',period:'full',includesOvertime:true,odds:2,status:'pending',fixtureId:'123',source:'api-sports',...changes})
 const advanced={...bet,id:randomUUID(),type:'parlay',legs:[makeLeg(),makeLeg({market:'total-points',side:'over',line:210.5})],odds:4,actualReturn:null,autoSettle:true,sourceHash:'a'.repeat(64)}
 const inserted=await request('/bets','POST',advanced,a.cookie)
 assert.equal(inserted.status,201);assert.equal(inserted.data.stake,10);assert.equal(inserted.data.legs.length,2)
 assert.equal((await request('/bets','POST',{...advanced,id:randomUUID()},a.cookie)).status,409)
 assert.equal((await request('/bets','POST',{...advanced,id:randomUUID(),sourceHash:undefined,legs:[makeLeg({sport:'baseball',market:'spread'})],type:'single'},a.cookie)).status,400)
 const data={id:'123',sport:'basketball',home:'A',away:'B',league:'NBA',date:'2026-10-27T12:00:00Z',status:'FT',scores:{full:{home:110,away:104},regulation:{home:110,away:104}}}
 const report=await syncResults(a.data.id,async()=>[data])
 assert.equal(report.updated,1)
 const settled=(await request('/bets','GET',undefined,a.cookie)).data.find(t=>t.id===advanced.id)
 assert.equal(settled.status,'won');assert.equal(settled.actualReturn,40);assert.equal(settled.settlementMethod,'automatic')
 assert.equal((await syncResults(a.data.id,async()=>[data])).updated,0)
 const audit=await request(`/results/audit/${advanced.id}`,'GET',undefined,a.cookie)
 assert.equal(audit.data.length,1);assert.equal(audit.data[0].evidence.length,2)
 assert.equal((await request(`/results/audit/${advanced.id}`,'GET',undefined,b.cookie)).data.length,0)
 assert.equal((await request('/import/image','POST',{},undefined)).status,401)
 assert.equal((await request('/import/image','POST',{image:'invalid',mode:'local'},a.cookie)).status,400)
 assert.equal((await request('/integrations','GET',undefined,a.cookie)).status,200)
 assert.equal((await request('/results/fixtures?sport=wrong&date=2026-10-27','GET',undefined,a.cookie)).status,400)
 assert.equal((await request('/auth/logout','POST',{},a.cookie)).status,200)
 assert.equal((await request('/bets','GET',undefined,a.cookie)).status,401)
 console.log('PASS: accounts, ownership, ticket legs, currency, CRUD, duplicate captures, atomic imports, automatic settlement, idempotency, private audit and image endpoint authentication against PostgreSQL')
} finally {
 for(const id of users) await pool.query('DELETE FROM users WHERE id=$1',[id])
 await new Promise(resolve=>server.close(resolve)); await pool.end()
}

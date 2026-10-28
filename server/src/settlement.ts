import type { Leg, LegStatus, Ticket, Fixture } from '../../shared/types.js'
import { getMarket } from '../../shared/markets.mjs'
import { payout } from './tickets.js'
import { fetchFixtures } from './providers.js'
import { pool } from './config/db.js'
export function settleLeg(leg:Leg,fixture:Fixture):{status:LegStatus;reason:string} {
 const pending=(reason:string)=>({status:'pending' as const,reason})
 if(leg.source!=='api-sports'||leg.fixtureId!==fixture.id||leg.sport!==fixture.sport||leg.home!==fixture.home||leg.away!==fixture.away)return pending('La identidad del partido no coincide.')
 if(!['FT','AOT','AET','PEN'].includes(fixture.status))return pending('Partido sin resultado definitivo; aplazamientos y cancelaciones requieren revisión.')
 const market=getMarket(leg.sport,leg.market)
 if(!market?.auto)return pending('Mercado sin estadísticas suficientes para resolución automática.')
 const key=leg.period==='full'?(leg.includesOvertime?'full':'regulation'):leg.period
 const score=fixture.scores[key]
 if(!score)return pending('Falta el marcador completo del periodo o sus condiciones de finalización.')
 const {home,away}=score,diff=home-away
 const outcome=diff>0?'home':diff<0?'away':'draw'
 let status:LegStatus
 if(market.kind==='winner')status=outcome==='draw'?'void':leg.side===outcome?'won':'lost'
 else if(market.kind==='three-way')status=leg.side===outcome?'won':'lost'
 else if(market.kind==='double')status=leg.side.split('-').includes(outcome)?'won':'lost'
 else if(market.kind==='btts')status=((home>0&&away>0)===(leg.side==='yes'))?'won':'lost'
 else if(market.kind==='odd-even')status=((home+away)%2===0)===(leg.side==='even')?'won':'lost'
 else if(['total','handicap'].includes(market.kind)&&leg.line!==null) {
  const evaluate=(line:number):LegStatus=>{
   const value=market.kind==='handicap'?(leg.side==='home'?diff:-diff)+line:((market.team?(leg.team==='home'?home:away):home+away)-line)*(leg.side==='under'?-1:1)
   return value===0?'void':value>0?'won':'lost'
  }
  const line=leg.line
  if(Number.isInteger(line*2))status=evaluate(line)
  else {
   // Quarter lines split into adjacent half-lines, including negative handicaps.
   const a=evaluate(Math.floor(line*2)/2),b=evaluate(Math.ceil(line*2)/2)
   status=a===b?a:[a,b].includes('void')?([a,b].includes('won')?'half-won':'half-lost'):'pending'
  }
 } else return pending('Mercado o línea no compatibles.')
 return {status,reason:`${fixture.home} ${home}–${away} ${fixture.away} · ${key}`}
}
let running=false
export async function syncResults(userId?:string,fetcher=fetchFixtures) {
 if(running)return {updated:0,review:0,checked:0,busy:true}
 running=true
 const report={updated:0,review:0,checked:0,busy:false}
 try {
  const candidates=await pool.query("SELECT id,user_id FROM bets WHERE data->>'status'='pending' AND data->>'autoSettle'='true'"+(userId?' AND user_id=$1':'')+' ORDER BY created_at LIMIT 100',userId?[userId]:[])
  for(const row of candidates.rows) {
   const client=await pool.connect()
   try {
    await client.query('BEGIN')
    const locked=await client.query("SELECT data FROM bets WHERE id=$1 AND user_id=$2 AND data->>'status'='pending' AND data->>'autoSettle'='true' FOR UPDATE SKIP LOCKED",[row.id,row.user_id])
    const ticket=locked.rows[0]?.data as Ticket|undefined
    if(!ticket){await client.query('ROLLBACK');continue}
    report.checked++
    const evidence:unknown[]=[]
    const next={...ticket,legs:ticket.legs.map(l=>({...l}))}
    for(const leg of next.legs) {
     if(leg.status!=='pending')continue
     if(!leg.fixtureId||leg.source!=='api-sports'){report.review++;continue}
     const fixture=(await fetcher(leg.sport,{id:leg.fixtureId})).find(f=>f.id===leg.fixtureId)
     if(!fixture){report.review++;continue}
     const evaluated=settleLeg(leg,fixture)
     if(evaluated.status!=='pending') {leg.status=evaluated.status;evidence.push({legId:leg.id,fixture,evaluation:evaluated})}
     else report.review++
    }
    const result=payout(next)
    if(result){Object.assign(next,result,{autoSettle:false,settlementMethod:'automatic',settledAt:new Date().toISOString()})}
    if(JSON.stringify(ticket)!==JSON.stringify(next)) {
     await client.query('UPDATE bets SET data=$3 WHERE id=$1 AND user_id=$2',[row.id,row.user_id,next])
     await client.query('INSERT INTO settlement_audit(id,user_id,ticket_id,evidence,before_data,after_data) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),row.user_id,row.id,JSON.stringify(evidence),ticket,next])
     report.updated++
    }
    await client.query('COMMIT')
   } catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }
  return report
 } finally {running=false}
}
export function startResultsWorker() {
 if(!process.env.API_SPORTS_KEY&&!['FOOTBALL','BASKETBALL','BASEBALL'].some(s=>process.env[`API_SPORTS_${s}_KEY`]))return
 const minutes=Math.max(5,Number(process.env.RESULTS_INTERVAL_MINUTES)||15)
 const timer=setInterval(()=>{void syncResults().catch(()=>console.error('No se completó la consulta programada de resultados.'))},minutes*60000)
 timer.unref()
 return timer
}

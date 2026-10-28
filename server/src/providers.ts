import type { Sport, Fixture } from '../../shared/types.js'
export class IntegrationError extends Error { constructor(message:string,public status=503){super(message)} }
type Raw = Record<string,any>
const num=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0
export function normalizeFixture(sport:Sport,row:Raw):Fixture {
 const scores:Fixture['scores']={}
 const pair=(key:string,h:unknown,a:unknown)=>{if(num(h)&&num(a))scores[key]={home:h,away:a}}
 const sum=(team:Raw,keys:string[])=>keys.every(k=>num(team?.[k]))?keys.reduce((n,k)=>n+team[k],0):null
 if(sport==='football') {
  pair('regulation',row.score?.fulltime?.home,row.score?.fulltime?.away)
  pair('first-half',row.score?.halftime?.home,row.score?.halftime?.away)
  if(scores.regulation&&scores['first-half'])pair('second-half',scores.regulation.home-scores['first-half'].home,scores.regulation.away-scores['first-half'].away)
 } else if(sport==='basketball') {
  const h=row.scores?.home,a=row.scores?.away
  pair('full',h?.total,a?.total)
  for(let i=1;i<=4;i++)pair(`q${i}`,h?.[`quarter_${i}`],a?.[`quarter_${i}`])
  pair('regulation',sum(h,['quarter_1','quarter_2','quarter_3','quarter_4']),sum(a,['quarter_1','quarter_2','quarter_3','quarter_4']))
  pair('first-half',sum(h,['quarter_1','quarter_2']),sum(a,['quarter_1','quarter_2']))
  pair('second-half',sum(h,['quarter_3','quarter_4']),sum(a,['quarter_3','quarter_4']))
 } else {
  const h=row.scores?.home,a=row.scores?.away,hi=h?.innings,ai=a?.innings
  for(let i=1;i<=9;i++)pair(`inning-${i}`,hi?.[String(i)],ai?.[String(i)])
  pair('first-5',sum(hi,['1','2','3','4','5']),sum(ai,['1','2','3','4','5']))
  const first8=sum(hi,['1','2','3','4','5','6','7','8'])
  const away9=sum(ai,['1','2','3','4','5','6','7','8','9'])
  // A missing bottom ninth is valid only when the home team did not need to bat.
  const home9=first8!==null&&hi?.['9']===null&&away9!==null&&first8>away9?first8:sum(hi,['1','2','3','4','5','6','7','8','9'])
  if(home9!==null&&away9!==null) {
   const homeExtra=hi?.extra===null?0:hi?.extra,awayExtra=ai?.extra===null?0:ai?.extra
   if(num(homeExtra)&&num(awayExtra)&&home9+homeExtra===h?.total&&away9+awayExtra===a?.total){pair('regulation',home9,away9);pair('full',h.total,a.total)}
  }
 }
 return {id:String(sport==='football'?row.fixture?.id:row.id),sport,home:row.teams?.home?.name||'',away:row.teams?.away?.name||'',league:row.league?.name||'',date:sport==='football'?row.fixture?.date:row.date,status:sport==='football'?row.fixture?.status?.short:row.status?.short,scores}
}
const cache=new Map<string,{until:number;value:Fixture[]}>()
let nextRequest=0
export async function fetchFixtures(sport:Sport,query:{date?:string;id?:string}):Promise<Fixture[]> {
 if(!['football','basketball','baseball'].includes(sport))throw new IntegrationError('Deporte no compatible.',400)
 const key=process.env[`API_SPORTS_${sport.toUpperCase()}_KEY`]||process.env.API_SPORTS_KEY
 if(!key)throw new IntegrationError('La conexión de resultados está preparada, pero falta configurar la clave de API-Sports en el servidor.')
 const signature=`${sport}:${query.id||query.date}`
 const cached=cache.get(signature);if(cached&&cached.until>Date.now())return cached.value
 if(Date.now()<nextRequest)throw new IntegrationError('El proveedor solicitó esperar antes de volver a consultar.',429)
 const domain=sport==='football'?'https://v3.football.api-sports.io/fixtures':`https://v1.${sport}.api-sports.io/games`
 const url=new URL(domain)
 if(query.id)url.searchParams.set('id',query.id)
 if(query.date){url.searchParams.set('date',query.date);url.searchParams.set('timezone',process.env.RESULTS_TIMEZONE||'America/Costa_Rica')}
 let response:Response
 try{response=await fetch(url,{headers:{'x-apisports-key':key},signal:AbortSignal.timeout(12000)})}catch{throw new IntegrationError('No se pudo contactar con el proveedor de resultados.')}
 if(response.status===429){nextRequest=Date.now()+60000;throw new IntegrationError('Se alcanzó el límite del proveedor. Intenta de nuevo en un minuto.',429)}
 if(!response.ok)throw new IntegrationError('El proveedor rechazó la consulta. Revisa la clave y cobertura del plan.')
 const body=await response.json() as Raw
 if(!Array.isArray(body.response)||Object.keys(body.errors||{}).length)throw new IntegrationError('El proveedor devolvió un error de cobertura, cuota o parámetros.')
 const value=body.response.map((r:Raw)=>normalizeFixture(sport,r)).filter((f:Fixture)=>f.home&&f.away&&/^\d+$/.test(f.id))
 for(const [k,v]of cache)if(v.until<Date.now())cache.delete(k)
 if(cache.size>500)cache.clear()
 cache.set(signature,{until:Date.now()+60000,value})
 return value
}

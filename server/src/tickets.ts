import { getMarket, periods } from '../../shared/markets.mjs'
import type { Leg, Ticket, TicketType, BetStatus } from '../../shared/types.js'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const statuses = ['pending','won','lost','void','half-won','half-lost']
const text = (value: unknown, limit=300) => typeof value === 'string' && value.length <= limit ? value.trim() : ''
export function validateLeg(input: unknown): Leg {
 if (!input || typeof input !== 'object') throw new Error('Selección inválida.')
 const b=input as Record<string,unknown>
 const sport=text(b.sport) as Leg['sport']
 const market=getMarket(sport,text(b.market))
 if (!market) throw new Error('El mercado no corresponde al deporte seleccionado.')
 const event=text(b.event), eventDate=text(b.eventDate), home=text(b.home), away=text(b.away)
 if (!event || !eventDate || !Number.isFinite(Date.parse(eventDate))) throw new Error('Cada selección necesita evento y fecha válidos.')
 if (typeof b.id !== 'string' || !uuid.test(b.id)) throw new Error('Identificador de selección inválido.')
 const period=text(b.period)
 if (!periods(sport).some(p=>p.id===period)) throw new Error('Periodo inválido para el deporte.')
 if (typeof b.includesOvertime !== 'boolean' || (period !== 'full' && b.includesOvertime)) throw new Error('La prórroga o entradas extra solo aplican al partido completo.')
 if (market.id==='first-inning-runs' && period!=='inning-1') throw new Error('YRFI / NRFI corresponde a la primera entrada.')
 const side=text(b.side), player=text(b.player), team=text(b.team), selection=text(b.selection)
 const allowed:Record<string,string[]>={winner:['home','away'], 'three-way':['home','draw','away'], double:['home-draw','away-draw','home-away'],total:['over','under'],handicap:['home','away'],btts:['yes','no'],yesno:['yes','no'],'odd-even':['odd','even']}
 if (market.kind!=='custom' && !allowed[market.kind]?.includes(side)) throw new Error('Elige una opción válida para el mercado.')
 if (!selection || (market.player && !player) || (market.team && !['home','away'].includes(team))) throw new Error('Completa selección, jugador o equipo según el mercado.')
 const needsLine=['total','handicap'].includes(market.kind)
 const line=needsLine && typeof b.line==='number' && Number.isFinite(b.line) ? b.line : null
 if (needsLine && (line===null || Math.abs(line)>100000 || (market.kind==='total' && line<0))) throw new Error('La línea numérica del mercado es obligatoria.')
 if (line!==null && !Number.isInteger(line*4)) throw new Error('La línea debe usar incrementos de 0.25.')
 if (b.odds!==null && (typeof b.odds!=='number' || !Number.isFinite(b.odds) || b.odds<=1 || b.odds>1000000)) throw new Error('Cuota de selección inválida.')
 if (!statuses.includes(String(b.status))) throw new Error('Estado de selección inválido.')
 const fixtureId=text(b.fixtureId)
 if (fixtureId && (!/^\d{1,12}$/.test(fixtureId) || b.source!=='api-sports' || !home || !away)) throw new Error('Referencia de partido inválida.')
 return {id:b.id,sport,country:text(b.country),league:text(b.league),event,eventDate,home,away,market:market.id,selection,side,line,player,team,period,includesOvertime:b.includesOvertime,odds:b.odds as number|null,status:b.status as Leg['status'],fixtureId,source:fixtureId?'api-sports':'manual'}
}
export function decorateTicket(base: Record<string,unknown>, raw: Record<string,unknown>): Ticket {
 if (!Array.isArray(raw.legs)) return { ...base, type:'single', autoSettle:false, legs:[], actualReturn:base.status==='pending'?null:base.status==='won'?base.potentialReturn:base.status==='void'?base.stake:0 } as unknown as Ticket
 if (raw.legs.length<1 || raw.legs.length>30) throw new Error('El ticket debe contener entre 1 y 30 selecciones.')
 const type=raw.type as TicketType
 if (!['single','parlay','same-game'].includes(type) || (type==='single' && raw.legs.length!==1) || (type!=='single' && raw.legs.length<2)) throw new Error('El tipo de ticket no corresponde al número de selecciones.')
 const legs=raw.legs.map(validateLeg)
 if (new Set(legs.map(l=>l.id)).size!==legs.length) throw new Error('Hay identificadores de selección repetidos.')
 if (type==='same-game' && legs.some(l=>l.sport!==legs[0]!.sport || l.event.trim().toLowerCase()!==legs[0]!.event.trim().toLowerCase() || Date.parse(l.eventDate)!==Date.parse(legs[0]!.eventDate))) throw new Error('Todas las selecciones del mismo partido deben coincidir en deporte, evento y fecha.')
 let actualReturn:number|null=null
 if (base.status!=='pending') {
  if (raw.actualReturn!==null && raw.actualReturn!==undefined) {
   if (typeof raw.actualReturn!=='number' || !Number.isFinite(raw.actualReturn) || raw.actualReturn<0 || raw.actualReturn>1e15 || Number(raw.actualReturn.toFixed(8))!==raw.actualReturn) throw new Error('Pago real inválido (hasta 8 decimales).')
   actualReturn=raw.actualReturn
  } else actualReturn=base.status==='won'?Number(base.potentialReturn):base.status==='void'?Number(base.stake):0
  if ((base.status==='void' && actualReturn!==base.stake) || (base.status==='won' && actualReturn<Number(base.stake)) || (base.status==='lost' && actualReturn>Number(base.stake))) throw new Error('El pago real no corresponde al estado del ticket.')
 }
 const first=legs[0]!
 const sameSport=legs.every(l=>l.sport===first.sport)
 return {...base,type,legs,actualReturn,autoSettle:base.status==='pending' && raw.autoSettle===true,settlementMethod:'manual',sport:sameSport?first.sport:'mixed',country:legs.every(l=>l.country===first.country)?first.country:'Varios',league:legs.every(l=>l.league===first.league)?first.league:'Varias ligas',event:type==='single'?first.event:type==='same-game'?first.event:`Combinada · ${legs.length} selecciones`,eventDate:first.eventDate,market:type==='single'?first.market:type,selection:type==='single'?first.selection:legs.map(l=>l.selection).join(' · ').slice(0,300),...(typeof raw.sourceHash==='string' && /^[a-f0-9]{64}$/.test(raw.sourceHash)?{sourceHash:raw.sourceHash}:{})} as unknown as Ticket
}
export function payout(ticket: Ticket): { status: BetStatus; actualReturn: number|null } | null {
 const legs=ticket.legs
 if (!legs.length) return null
 if (ticket.type==='same-game' && legs.some(l=>l.status==='void')) return {status:'void',actualReturn:ticket.stake}
 // A not-yet-settled SGM can still become void; wait for all its legs.
 if (ticket.type==='same-game' && legs.some(l=>l.status==='pending')) return null
 if (legs.some(l=>l.status==='lost')) return {status:'lost',actualReturn:0}
 if (legs.some(l=>l.status==='pending')) return null
 if (legs.every(l=>l.status==='void')) return {status:'void',actualReturn:ticket.stake}
 let multiplier=ticket.odds
 if (ticket.type==='single') {
  const status=legs[0]!.status
  multiplier=status==='half-won'?(ticket.odds+1)/2:status==='half-lost'?0.5:status==='void'?1:ticket.odds
 } else if (legs.some(l=>l.status==='void'||l.status==='half-won'||l.status==='half-lost')) {
  if (ticket.type==='same-game' || legs.some(l=>l.odds===null)) return null
  // Preserve the accepted ticket price; adjust only affected legs.
  multiplier=ticket.odds
  for (const leg of legs) {
   if (leg.status==='void') multiplier/=leg.odds!
   if (leg.status==='half-won') multiplier*=((leg.odds!+1)/2)/leg.odds!
   if (leg.status==='half-lost') multiplier*=0.5/leg.odds!
  }
 }
 const actualReturn=Number((ticket.stake*multiplier).toFixed(8))
 return {status:actualReturn>=ticket.stake?'won':'lost',actualReturn}
}

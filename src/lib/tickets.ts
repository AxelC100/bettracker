import type { Leg, Ticket, Sport } from '../../shared/types'
export function emptyLeg(sport: Sport='football'): Leg {
 return {id:crypto.randomUUID(),sport,country:'',league:'',event:'',eventDate:'',home:'',away:'',market:'',selection:'',side:'',line:null,player:'',team:'',period:'full',includesOvertime:false,odds:null,status:'pending',fixtureId:'',source:'manual'}
}
export function localDate(value: string) {
 const date=new Date(value)
 if (!Number.isFinite(date.getTime())) return ''
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)
}
export function profit(bet: Ticket) {
 if (bet.status==='pending') return 0
 if (bet.actualReturn!==null && bet.actualReturn!==undefined) return Number((bet.actualReturn-bet.stake).toFixed(8))
 return bet.status==='won'?bet.potentialProfit:bet.status==='lost'?-bet.stake:0
}

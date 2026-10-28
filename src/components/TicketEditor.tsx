import { useState, type FormEvent } from 'react'
import { markets, sports, periods, getMarket } from '../../shared/markets.mjs'
import type { Ticket, Leg, TicketType, Fixture } from '../../shared/types'
import { emptyLeg, localDate } from '../lib/tickets'
import { formatAmount } from '../lib/money'
import { api } from '../lib/api'
import '../pages/Bets/NewBet.css'

type Props={ initial?: Partial<Ticket>; onSave:(ticket:Ticket)=>Promise<void>; label?:string }
export default function TicketEditor({initial,onSave,label='Guardar ticket'}:Props) {
 const [type,setType]=useState<TicketType>(initial?.type||'single')
 const [legs,setLegs]=useState<Leg[]>(initial?.legs?.length?initial.legs.map(l=>({...l,eventDate:localDate(l.eventDate)})):[emptyLeg()])
 const [stake,setStake]=useState(initial?.stake?String(initial.stake):'')
 const [odds,setOdds]=useState(initial?.odds?String(initial.odds):'')
 const [status,setStatus]=useState(initial?.status||'pending')
 const [actualReturn,setActualReturn]=useState(initial?.actualReturn!=null?String(initial.actualReturn):'')
 const [bookmaker,setBookmaker]=useState(initial?.bookmaker||'Stake')
 const [notes,setNotes]=useState(initial?.notes||'')
 const [autoSettle,setAutoSettle]=useState(initial?.autoSettle||false)
 const [error,setError]=useState(''),[busy,setBusy]=useState(false)
 const [fixtures,setFixtures]=useState<Record<string,Fixture[]>>({}),[searching,setSearching]=useState('')
 function patch(id:string,changes:Partial<Leg>) {
  setLegs(current=>current.map((l,index)=> {
   const shared=type==='same-game' && current[0]?.id===id && index>0
    ? Object.fromEntries(Object.entries(changes).filter(([key])=>['sport','event','eventDate','home','away','league','country','fixtureId','source'].includes(key))) : {}
   return l.id===id?{...l,...changes}:{...l,...shared}
  }))
 }
 function changeType(next:TicketType) {
  if (next==='single' && legs.length>1 && !window.confirm('Cambiar a simple conserva solo la primera selección. ¿Continuar?')) return
  setType(next)
  setLegs(current=>next==='single'?[current[0]!]:next==='same-game'?current.map(l=>({...l,sport:current[0]!.sport,event:current[0]!.event,eventDate:current[0]!.eventDate,home:current[0]!.home,away:current[0]!.away,fixtureId:current[0]!.fixtureId,source:current[0]!.source})):current)
 }
 async function search(leg:Leg) {
  if (!leg.eventDate) {setError('Indica la fecha del partido antes de buscar.');return}
  setError('');setSearching(leg.id)
  try {const result=await api<{fixtures:Fixture[]}>(`/results/fixtures?sport=${leg.sport}&date=${leg.eventDate.slice(0,10)}`);setFixtures(previous=>({...previous,[leg.id]:result.fixtures}));if(!result.fixtures.length)setError('No se encontraron partidos para esa fecha. Puedes registrarlo manualmente.')}catch(e){setError((e as Error).message)}finally{setSearching('')}
 }
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy)return;setError('')
  if((type==='single'&&legs.length!==1)||(type!=='single'&&legs.length<2)){setError('Agrega al menos dos selecciones para una combinada.');return}
  if(!Number.isFinite(Number(stake))||Number(stake)<=0||!Number.isFinite(Number(odds))||Number(odds)<=1){setError('Indica monto positivo y cuota total mayor que 1.');return}
  if(legs.some(l=>!l.eventDate||!Number.isFinite(Date.parse(l.eventDate)))){setError('Completa la fecha y hora de cada selección.');return}
  const normalized=legs.map(l=>({...l,eventDate:new Date(l.eventDate).toISOString()}))
  const first=normalized[0]!
  const value={id:initial?.id||crypto.randomUUID(),currency:'USDT' as const,type,legs:normalized,bookmaker,stake:Number(stake),odds:Number(odds),status,actualReturn:status==='pending'||actualReturn===''?null:Number(actualReturn),notes,autoSettle,createdAt:initial?.createdAt||new Date().toISOString(),potentialReturn:0,potentialProfit:0,sport:first.sport,country:first.country,league:first.league,event:first.event,eventDate:first.eventDate,market:first.market,selection:first.selection,...(initial?.sourceHash?{sourceHash:initial.sourceHash}:{})}
  setBusy(true);try {await onSave(value)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const suggestion=legs.every(l=>l.odds&&l.odds>1)?Number(legs.reduce((total,l)=>total*l.odds!,1).toFixed(8)):null
 return <form className="new-bet-form" onSubmit={submit}>
  <section className="form-card"><h2>Ticket</h2><p className="editor-help">Un monto por ticket. Cada selección conserva su mercado y resultado.</p><div className="form-grid">
   <div className="form-group"><label htmlFor="ticket-type">Tipo de apuesta</label><select id="ticket-type" value={type} onChange={e=>changeType(e.target.value as TicketType)}><option value="single">Simple</option><option value="parlay">Combinada de partidos</option><option value="same-game">Combinada del mismo partido (SGM)</option></select></div>
   <div className="form-group"><label htmlFor="bookmaker">Casa de apuestas</label><input id="bookmaker" required maxLength={100} value={bookmaker} onChange={e=>setBookmaker(e.target.value)}/></div>
  </div></section>
  {legs.map((leg,index)=> {
   const spec=getMarket(leg.sport,leg.market),prefix=`leg-${leg.id}`,locked=type==='same-game'&&index>0
   const change=(changes:Partial<Leg>)=>patch(leg.id,changes)
   const sideOptions=spec?.kind==='double'?[['home-draw','Local o empate'],['away-draw','Visitante o empate'],['home-away','Local o visitante']]:spec?.kind==='total'?[['over','Más de / Over'],['under','Menos de / Under']]:['yesno','btts'].includes(spec?.kind||'')?[['yes','Sí'],['no','No']]:spec?.kind==='odd-even'?[['odd','Impar'],['even','Par']]:[['home','Local'],...(spec?.kind==='three-way'?[['draw','Empate']]:[]),['away','Visitante']]
   return <fieldset className="form-card leg-card" key={leg.id}><legend>Selección {index+1}</legend><div className="leg-toolbar"><span>{sports.find(s=>s.id===leg.sport)?.label} · {leg.fixtureId?'Partido vinculado':'Registro manual'}</span>{legs.length>1&&<button className="back-button" type="button" onClick={()=>setLegs(current=>current.filter(l=>l.id!==leg.id))}>Quitar selección {index+1}</button>}</div>
    <div className="form-grid">
     <div className="form-group"><label htmlFor={`${prefix}-sport`}>Deporte {index+1}</label><select id={`${prefix}-sport`} disabled={locked} value={leg.sport} onChange={e=>change({...emptyLeg(e.target.value as Leg['sport']),id:leg.id})}>{sports.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
     <div className="form-group"><label htmlFor={`${prefix}-date`}>Fecha y hora del evento {index+1}</label><input id={`${prefix}-date`} disabled={locked} type="datetime-local" required value={leg.eventDate} onChange={e=>change({eventDate:e.target.value,fixtureId:'',source:'manual'})}/></div>
     <div className="form-group"><label htmlFor={`${prefix}-event`}>Evento {index+1}</label><input id={`${prefix}-event`} disabled={locked} required maxLength={300} placeholder={leg.sport==='baseball'?'Dodgers vs Yankees':leg.sport==='basketball'?'Lakers vs Celtics':'Local vs visitante'} value={leg.event} onChange={e=>change({event:e.target.value,fixtureId:'',source:'manual'})}/></div>
     <div className="form-group"><label htmlFor={`${prefix}-league`}>Liga {index+1} (opcional)</label><input id={`${prefix}-league`} disabled={locked} list={`${prefix}-leagues`} value={leg.league} onChange={e=>change({league:e.target.value})}/><datalist id={`${prefix}-leagues`}>{sports.find(s=>s.id===leg.sport)?.leagues.map(l=><option key={l}>{l}</option>)}</datalist></div>
    </div>
    {!locked&&<div className="fixture-picker"><button type="button" className="back-button" disabled={!!searching} onClick={()=>void search(leg)}>{searching===leg.id?'Buscando…':'Buscar y vincular partido'}</button><p className="editor-help">Vincular identifica el partido para actualizar resultados. Puedes completar el registro sin hacerlo.</p>{fixtures[leg.id]&&<select aria-label={`Partido del proveedor ${index+1}`} value="" onChange={e=>{const f=fixtures[leg.id]?.find(item=>item.id===e.target.value);if(f)change({fixtureId:f.id,source:'api-sports',event:`${f.home} vs ${f.away}`,home:f.home,away:f.away,league:f.league,eventDate:localDate(f.date)})}}><option value="">Selecciona un partido</option>{fixtures[leg.id]?.map(f=><option key={f.id} value={f.id}>{f.home} vs {f.away} · {new Date(f.date).toLocaleString()} · {f.league}</option>)}</select>}</div>}
    <div className="form-grid">
     <div className="form-group"><label htmlFor={`${prefix}-market`}>Mercado {index+1}</label><select id={`${prefix}-market`} required value={leg.market} onChange={e=>change({market:e.target.value,side:'',line:null,player:'',team:'',selection:'',...(e.target.value==='first-inning-runs'?{period:'inning-1',includesOvertime:false}:{})})}><option value="">Selecciona un mercado</option>{markets.filter(m=>m.sport===leg.sport).map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
     <div className="form-group"><label htmlFor={`${prefix}-period`}>Periodo {index+1}</label><select id={`${prefix}-period`} value={leg.period} onChange={e=>change({period:e.target.value,includesOvertime:false})}>{periods(leg.sport).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
     {spec&&spec.kind!=='custom'&&<div className="form-group"><label htmlFor={`${prefix}-side`}>Opción {index+1}</label><select id={`${prefix}-side`} required value={leg.side} onChange={e=>{const side=e.target.value;change({side,selection:sideOptions.find(o=>o[0]===side)?.[1]||''})}}><option value="">Selecciona una opción</option>{sideOptions.map(([value,label])=><option value={value} key={value}>{label}{value==='home'&&leg.home?` · ${leg.home}`:value==='away'&&leg.away?` · ${leg.away}`:''}</option>)}</select></div>}
     {spec&&['total','handicap'].includes(spec.kind)&&<div className="form-group"><label htmlFor={`${prefix}-line`}>Línea {index+1}</label><input id={`${prefix}-line`} required type="number" step="0.25" value={leg.line??''} placeholder={leg.sport==='basketball'?'Ej. 225.5 o -4.5':'Ej. 8.5 o -1.5'} onChange={e=>change({line:e.target.value===''?null:Number(e.target.value)})}/></div>}
     {spec?.player&&<div className="form-group"><label htmlFor={`${prefix}-player`}>Jugador {index+1}</label><input id={`${prefix}-player`} required value={leg.player} onChange={e=>change({player:e.target.value})}/></div>}
     {spec?.team&&<div className="form-group"><label htmlFor={`${prefix}-team`}>Equipo {index+1}</label><select id={`${prefix}-team`} required value={leg.team} onChange={e=>change({team:e.target.value})}><option value="">Selecciona equipo</option><option value="home">Local {leg.home}</option><option value="away">Visitante {leg.away}</option></select></div>}
     <div className="form-group"><label htmlFor={`${prefix}-selection`}>Texto de selección {index+1}</label><input id={`${prefix}-selection`} required maxLength={300} value={leg.selection} onChange={e=>change({selection:e.target.value})} placeholder="Como aparece en tu ticket"/></div>
     <div className="form-group"><label htmlFor={`${prefix}-odds`}>Cuota de selección {index+1} (opcional)</label><input id={`${prefix}-odds`} type="number" min="1.00000001" step="any" value={leg.odds??''} onChange={e=>change({odds:e.target.value===''?null:Number(e.target.value)})}/></div>
     <div className="form-group"><label htmlFor={`${prefix}-status`}>Estado de selección {index+1}</label><select id={`${prefix}-status`} value={leg.status} onChange={e=>change({status:e.target.value as Leg['status']})}>{[['pending','Pendiente'],['won','Ganada'],['lost','Perdida'],['void','Nula'],['half-won','Media ganada'],['half-lost','Media perdida']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    </div>
    <label className="editor-check"><input type="checkbox" disabled={leg.period!=='full'} checked={leg.includesOvertime} onChange={e=>change({includesOvertime:e.target.checked})}/>{leg.sport==='baseball'?'Incluye entradas extra':'Incluye prórroga'} · según tu ticket</label>
    {spec&&<p className="editor-help">{spec.hint} {leg.sport==='baseball'&&spec.player?'Verifica titularidad y participación del jugador o lanzador.':''}</p>}
   </fieldset>
  })}
  {type!=='single'&&<button type="button" className="back-button" disabled={legs.length>=30} onClick={()=>setLegs(current=>{const first=current[0]!;const fresh=emptyLeg(first.sport);return [...current,type==='same-game'?{...fresh,event:first.event,eventDate:first.eventDate,home:first.home,away:first.away,league:first.league,fixtureId:first.fixtureId,source:first.source}:fresh]})}>+ Agregar selección</button>}
  <section className="form-card"><h2>Importes y resultado</h2><div className="form-grid">
   <div className="form-group"><label htmlFor="stake">Monto del ticket (USDT)</label><input id="stake" required type="number" min="0.00000001" max="1000000000" step="0.00000001" value={stake} onChange={e=>setStake(e.target.value)}/></div>
   <div className="form-group"><label htmlFor="ticket-odds">Cuota total aceptada</label><input id="ticket-odds" required type="number" min="1.00000001" max="1000000" step="any" value={odds} onChange={e=>setOdds(e.target.value)}/>{type==='parlay'&&suggestion&&<button type="button" className="back-button" onClick={()=>setOdds(String(suggestion))}>Usar producto: {suggestion}</button>}</div>
   <div className="form-group"><label htmlFor="ticket-status">Estado del ticket</label><select id="ticket-status" value={status} onChange={e=>{setStatus(e.target.value as Ticket['status']);setActualReturn('')}}><option value="pending">Pendiente</option><option value="won">Ganada</option><option value="lost">Perdida</option><option value="void">Nula</option></select></div>
   {status!=='pending'&&<div className="form-group"><label htmlFor="actual-return">Pago real (USDT, opcional)</label><input id="actual-return" type="number" min="0" step="0.00000001" value={actualReturn} onChange={e=>setActualReturn(e.target.value)}/><span className="editor-help">Pago total recibido, incluida la devolución del monto.</span></div>}
  </div><p className="editor-help">En SGM usa la cuota total de Stake: las selecciones del mismo partido pueden estar correlacionadas.</p><div className="bet-summary"><div><span>Retorno potencial</span><strong>{formatAmount(Number(stake)*Number(odds))}</strong></div><div><span>Ganancia potencial</span><strong>{formatAmount(Number(stake)*(Number(odds)-1))}</strong></div><div><span>Selecciones</span><strong>{legs.length}</strong></div></div>
  <label className="editor-check"><input type="checkbox" checked={autoSettle} disabled={status!=='pending'} onChange={e=>setAutoSettle(e.target.checked)}/>Actualizar automáticamente los mercados compatibles</label><p className="editor-help">Requiere partidos vinculados y conexión de resultados. Las estadísticas de jugadores y casos sin datos suficientes quedan para revisión.</p></section>
  <section className="form-card"><div className="form-group"><label htmlFor="notes">Notas (opcional)</label><textarea id="notes" maxLength={5000} rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></div></section>
  {error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="submit" className="save-button" disabled={busy}>{busy?'Guardando…':label}</button></div>
 </form>
}

import TicketEditor from '../../components/TicketEditor'
import { useBets } from '../../lib/bets'
import { emptyLeg } from '../../lib/tickets'
import { useNavigate, useParams, Link } from 'react-router-dom'
export default function EditBet() {
 const {id}=useParams();const {bets,update}=useBets();const navigate=useNavigate();const bet=bets.find(b=>b.id===id)
 if(!bet)return <main className="new-bet-page"><h1>No se encontró el ticket</h1><Link to="/bets">Volver al historial</Link></main>
 const initial=bet.legs?.length?bet:{...bet,legs:[{...emptyLeg(['football','basketball','baseball'].includes(bet.sport)?bet.sport as 'football'|'basketball'|'baseball':'football'),event:bet.event,eventDate:bet.eventDate,league:bet.league,country:bet.country,market:'other',selection:bet.selection,odds:bet.odds,status:bet.status}]}
 return <main className="new-bet-page"><div className="new-bet-container"><header className="new-bet-header"><h1>Editar ticket</h1><Link to="/bets">Volver al historial</Link></header><TicketEditor key={bet.id} initial={initial} label="Guardar cambios" onSave={async ticket=>{await update(ticket);navigate('/bets')}}/></div></main>
}

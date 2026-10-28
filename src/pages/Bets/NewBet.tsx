import TicketEditor from '../../components/TicketEditor'
import { useBets } from '../../lib/bets'
import { useNavigate, Link } from 'react-router-dom'
export default function NewBet() {
 const {create}=useBets();const navigate=useNavigate()
 return <main className="new-bet-page"><div className="new-bet-container"><header className="new-bet-header"><div><p className="new-bet-eyebrow">Registro de apuestas · USDT</p><h1>Nuevo ticket</h1><p>Simples, combinadas y selecciones del mismo partido.</p></div><Link className="back-button" to="/bets/import">Importar captura</Link></header><TicketEditor onSave={async ticket=>{await create(ticket);navigate('/bets')}}/></div></main>
}

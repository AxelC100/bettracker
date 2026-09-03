import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NewBet.css'

function NewBet() {
  const navigate = useNavigate()

  const [sport, setSport] = useState('')
  const [country, setCountry] = useState('')
  const [league, setLeague] = useState('')
  const [event, setEvent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [bookmaker, setBookmaker] = useState('')
  const [market, setMarket] = useState('')
  const [selection, setSelection] = useState('')
  const [odds, setOdds] = useState('')
  const [stake, setStake] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const oddsNumber = Number(odds)
  const stakeNumber = Number(stake)

  const potentialReturn =
    oddsNumber > 0 && stakeNumber > 0
      ? oddsNumber * stakeNumber
      : 0

  const potentialProfit =
    potentialReturn > 0
      ? potentialReturn - stakeNumber
      : 0

  function handleSubmit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault()
    setError('')

    if (
      !sport ||
      !country ||
      !league ||
      !event ||
      !eventDate ||
      !market ||
      !selection ||
      !odds ||
      !stake
    ) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (oddsNumber <= 1) {
      setError('La cuota debe ser mayor a 1.00.')
      return
    }

    if (stakeNumber <= 0) {
      setError('El monto apostado debe ser mayor a 0.')
      return
    }

    const newBet = {
      id: crypto.randomUUID(),
      sport,
      country,
      league,
      event,
      eventDate,
      bookmaker,
      market,
      selection,
      odds: oddsNumber,
      stake: stakeNumber,
      status: 'pending',
      potentialReturn,
      potentialProfit,
      notes,
      createdAt: new Date().toISOString(),
    }

    const savedBets = JSON.parse(localStorage.getItem('bets') || '[]')

    const updatedBets = [...savedBets, newBet]

    localStorage.setItem('bets', JSON.stringify(updatedBets))

    navigate('/dashboard')
  }

  return (
    <main className="new-bet-page">
      <div className="new-bet-container">
        <header className="new-bet-header">
          <div>
            <p className="new-bet-eyebrow">Registro de apuesta</p>
            <h1>Nueva apuesta</h1>
            <p>
              Registra los datos de tu apuesta para analizar tu rendimiento.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            Volver
          </button>
        </header>

        <form className="new-bet-form" onSubmit={handleSubmit}>
          <section className="form-card">
            <h2>Información del evento</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="sport">Deporte *</label>
                <select
                  id="sport"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="">Selecciona un deporte</option>
                  <option value="football">Fútbol</option>
                  <option value="basketball">Baloncesto</option>
                  <option value="tennis">Tenis</option>
                  <option value="baseball">Béisbol</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="country">País *</label>
                <input
                  id="country"
                  type="text"
                  placeholder="Ej. España"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="league">Liga / División *</label>
                <input
                  id="league"
                  type="text"
                  placeholder="Ej. LaLiga"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event">Evento *</label>
                <input
                  id="event"
                  type="text"
                  placeholder="Ej. Real Madrid vs Barcelona"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Fecha del evento *</label>
                <input
                  id="date"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookmaker">Casa de apuestas</label>
                <input
                  id="bookmaker"
                  type="text"
                  placeholder="Ej. Bet365"
                  value={bookmaker}
                  onChange={(e) => setBookmaker(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-card">
            <h2>Detalles de la apuesta</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="market">Mercado *</label>
                <select
                  id="market"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                >
                  <option value="">Selecciona un mercado</option>
                  <option value="match-winner">Ganador del partido</option>
                  <option value="double-chance">Doble oportunidad</option>
                  <option value="goals">Over / Under goles</option>
                  <option value="btts">Ambos equipos anotan</option>
                  <option value="corners">Corners</option>
                  <option value="cards">Tarjetas</option>
                  <option value="handicap">Hándicap</option>
                  <option value="shots">Tiros</option>
                  <option value="shots-on-target">Tiros a puerta</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="selection">Selección *</label>
                <input
                  id="selection"
                  type="text"
                  placeholder="Ej. Over 8.5 corners"
                  value={selection}
                  onChange={(e) => setSelection(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="odds">Cuota *</label>
                <input
                  id="odds"
                  type="number"
                  step="0.01"
                  min="1.01"
                  placeholder="1.85"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stake">Monto apostado *</label>
                <input
                  id="stake"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="50.00"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                />
              </div>
            </div>

            <div className="bet-summary">
              <div>
                <span>Estado inicial</span>
                <strong>Pendiente</strong>
              </div>

              <div>
                <span>Retorno potencial</span>
                <strong>${potentialReturn.toFixed(2)}</strong>
              </div>

              <div>
                <span>Ganancia potencial</span>
                <strong className="positive">
                  ${potentialProfit.toFixed(2)}
                </strong>
              </div>
            </div>
          </section>

          <section className="form-card">
            <h2>Notas</h2>

            <div className="form-group">
              <label htmlFor="notes">Notas opcionales</label>
              <textarea
                id="notes"
                rows={5}
                placeholder="Información adicional sobre la apuesta..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </button>

            <button type="submit" className="save-button">
              Guardar apuesta
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default NewBet
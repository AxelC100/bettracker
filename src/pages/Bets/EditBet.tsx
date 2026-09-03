import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './EditBet.css'

type BetStatus = 'pending' | 'won' | 'lost' | 'void'

type Bet = {
  id: string
  sport: string
  country: string
  league: string
  event: string
  eventDate: string
  bookmaker: string
  market: string
  selection: string
  odds: number
  stake: number
  status: BetStatus
  potentialReturn: number
  potentialProfit: number
  notes: string
  createdAt: string
}

function EditBet() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bet, setBet] = useState<Bet | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedBets: Bet[] = JSON.parse(
      localStorage.getItem('bets') || '[]',
    )

    const foundBet = savedBets.find(
      (savedBet) => savedBet.id === id,
    )

    if (!foundBet) {
      setError('No se encontró la apuesta.')
      return
    }

    setBet(foundBet)
  }, [id])

  if (!bet) {
    return (
      <main className="edit-bet-page">
        <div className="edit-bet-container">
          <p>{error || 'Cargando apuesta...'}</p>
        </div>
      </main>
    )
  }

  const potentialReturn = bet.odds * bet.stake

  const potentialProfit =
    potentialReturn - bet.stake

  function updateField<K extends keyof Bet>(
    field: K,
    value: Bet[K],
  ) {
    setBet((currentBet) => {
      if (!currentBet) return currentBet

      return {
        ...currentBet,
        [field]: value,
      }
    })
  }

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setError('')

  if (!bet) {
    setError('No se encontró la apuesta.')
    return
  }

  if (
    !bet.sport ||
    !bet.country ||
    !bet.league ||
    !bet.event ||
    !bet.eventDate ||
    !bet.market ||
    !bet.selection
  ) {
    setError('Completa todos los campos obligatorios.')
    return
  }

  if (bet.odds <= 1) {
    setError('La cuota debe ser mayor a 1.00.')
    return
  }

  if (bet.stake <= 0) {
    setError('El monto apostado debe ser mayor a 0.')
    return
  }

  const potentialReturn = bet.odds * bet.stake
  const potentialProfit = potentialReturn - bet.stake

  const savedBets: Bet[] = JSON.parse(
    localStorage.getItem('bets') || '[]',
  )

  const updatedBet: Bet = {
    ...bet,
    potentialReturn,
    potentialProfit,
  }

  const updatedBets = savedBets.map((savedBet) =>
    savedBet.id === bet.id
      ? updatedBet
      : savedBet,
  )

  localStorage.setItem(
    'bets',
    JSON.stringify(updatedBets),
  )

  navigate('/bets')
}

  return (
    <main className="edit-bet-page">
      <div className="edit-bet-container">
        <header className="edit-bet-header">
          <div>
            <p className="edit-bet-eyebrow">
              Modificar registro
            </p>

            <h1>Editar apuesta</h1>

            <p>
              Corrige información o actualiza el resultado.
            </p>
          </div>

          <button
            type="button"
            className="edit-back-button"
            onClick={() => navigate('/bets')}
          >
            Volver
          </button>
        </header>

        <form
          className="edit-bet-form"
          onSubmit={handleSubmit}
        >
          <section className="edit-form-card">
            <h2>Información del evento</h2>

            <div className="edit-form-grid">
              <div className="edit-form-group">
                <label>Deporte *</label>

                <select
                  value={bet.sport}
                  onChange={(e) =>
                    updateField('sport', e.target.value)
                  }
                >
                  <option value="football">Fútbol</option>
                  <option value="basketball">
                    Baloncesto
                  </option>
                  <option value="tennis">Tenis</option>
                  <option value="baseball">Béisbol</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="edit-form-group">
                <label>País *</label>

                <input
                  value={bet.country}
                  onChange={(e) =>
                    updateField('country', e.target.value)
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Liga / División *</label>

                <input
                  value={bet.league}
                  onChange={(e) =>
                    updateField('league', e.target.value)
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Evento *</label>

                <input
                  value={bet.event}
                  onChange={(e) =>
                    updateField('event', e.target.value)
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Fecha *</label>

                <input
                  type="datetime-local"
                  value={bet.eventDate}
                  onChange={(e) =>
                    updateField(
                      'eventDate',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Casa de apuestas</label>

                <input
                  value={bet.bookmaker}
                  onChange={(e) =>
                    updateField(
                      'bookmaker',
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="edit-form-card">
            <h2>Detalles de la apuesta</h2>

            <div className="edit-form-grid">
              <div className="edit-form-group">
                <label>Mercado *</label>

                <select
                  value={bet.market}
                  onChange={(e) =>
                    updateField('market', e.target.value)
                  }
                >
                  <option value="match-winner">
                    Ganador del partido
                  </option>

                  <option value="double-chance">
                    Doble oportunidad
                  </option>

                  <option value="goals">
                    Over / Under goles
                  </option>

                  <option value="btts">
                    Ambos equipos anotan
                  </option>

                  <option value="corners">
                    Corners
                  </option>

                  <option value="cards">
                    Tarjetas
                  </option>

                  <option value="handicap">
                    Hándicap
                  </option>

                  <option value="shots">
                    Tiros
                  </option>

                  <option value="shots-on-target">
                    Tiros a puerta
                  </option>

                  <option value="other">
                    Otro
                  </option>
                </select>
              </div>

              <div className="edit-form-group">
                <label>Selección *</label>

                <input
                  value={bet.selection}
                  onChange={(e) =>
                    updateField(
                      'selection',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Cuota *</label>

                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={bet.odds}
                  onChange={(e) =>
                    updateField(
                      'odds',
                      Number(e.target.value),
                    )
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Monto apostado *</label>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={bet.stake}
                  onChange={(e) =>
                    updateField(
                      'stake',
                      Number(e.target.value),
                    )
                  }
                />
              </div>

              <div className="edit-form-group">
                <label>Estado</label>

                <select
                  value={bet.status}
                  onChange={(e) =>
                    updateField(
                      'status',
                      e.target.value as BetStatus,
                    )
                  }
                >
                  <option value="pending">
                    Pendiente
                  </option>

                  <option value="won">
                    Ganada
                  </option>

                  <option value="lost">
                    Perdida
                  </option>

                  <option value="void">
                    Anulada
                  </option>
                </select>
              </div>
            </div>

            <div className="edit-summary">
              <div>
                <span>Retorno</span>
                <strong>
                  ${potentialReturn.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Ganancia potencial</span>
                <strong className="positive">
                  ${potentialProfit.toFixed(2)}
                </strong>
              </div>
            </div>
          </section>

          <section className="edit-form-card">
            <h2>Notas</h2>

            <div className="edit-form-group">
              <textarea
                rows={5}
                value={bet.notes}
                onChange={(e) =>
                  updateField('notes', e.target.value)
                }
              />
            </div>
          </section>

          {error && (
            <div className="edit-error">
              {error}
            </div>
          )}

          <div className="edit-actions">
            <button
              type="button"
              className="edit-cancel-button"
              onClick={() => navigate('/bets')}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="edit-save-button"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default EditBet
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Bets.css'

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

function Bets() {
  const navigate = useNavigate()
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    const savedBets = JSON.parse(localStorage.getItem('bets') || '[]')
    setBets(savedBets)
  }, [])

  function saveBets(updatedBets: Bet[]) {
    setBets(updatedBets)
    localStorage.setItem('bets', JSON.stringify(updatedBets))
  }

  function updateStatus(id: string, status: BetStatus) {
    const updatedBets = bets.map((bet) =>
      bet.id === id
        ? {
            ...bet,
            status,
          }
        : bet,
    )

    saveBets(updatedBets)
  }

  function deleteBet(id: string) {
    const confirmed = window.confirm(
      '¿Seguro que deseas eliminar esta apuesta?',
    )

    if (!confirmed) return

    const updatedBets = bets.filter((bet) => bet.id !== id)
    saveBets(updatedBets)
  }

  function getProfit(bet: Bet) {
    if (bet.status === 'won') {
      return bet.potentialProfit
    }

    if (bet.status === 'lost') {
      return -bet.stake
    }

    return 0
  }

  function getStatusText(status: BetStatus) {
    switch (status) {
      case 'won':
        return 'Ganada'
      case 'lost':
        return 'Perdida'
      case 'void':
        return 'Anulada'
      default:
        return 'Pendiente'
    }
  }

  return (
    <main className="bets-page">
      <div className="bets-container">
        <header className="bets-header">
          <div>
            <p className="bets-eyebrow">Historial</p>
            <h1>Mis apuestas</h1>
            <p>
              Consulta, actualiza y administra todas tus apuestas registradas.
            </p>
          </div>

          <div className="bets-header-actions">
            <button
              type="button"
              className="secondary-action"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="primary-action"
              onClick={() => navigate('/bets/new')}
            >
              + Nueva apuesta
            </button>
          </div>
        </header>

        <section className="bets-summary">
          <article>
            <span>Total registradas</span>
            <strong>{bets.length}</strong>
          </article>

          <article>
            <span>Pendientes</span>
            <strong>
              {bets.filter((bet) => bet.status === 'pending').length}
            </strong>
          </article>

          <article>
            <span>Ganadas</span>
            <strong className="positive">
              {bets.filter((bet) => bet.status === 'won').length}
            </strong>
          </article>

          <article>
            <span>Perdidas</span>
            <strong className="negative">
              {bets.filter((bet) => bet.status === 'lost').length}
            </strong>
          </article>
        </section>

        <section className="bets-panel">
          {bets.length === 0 ? (
            <div className="empty-bets">
              <h2>No tienes apuestas registradas</h2>
              <p>Registra tu primera apuesta para comenzar a analizarla.</p>

              <button
                type="button"
                className="primary-action"
                onClick={() => navigate('/bets/new')}
              >
                Registrar apuesta
              </button>
            </div>
          ) : (
            <div className="bets-table-wrapper">
              <table className="bets-history-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Mercado</th>
                    <th>Cuota</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Resultado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {bets
                    .slice()
                    .reverse()
                    .map((bet) => {
                      const profit = getProfit(bet)

                      return (
                        <tr key={bet.id}>
                          <td>
                            <div className="event-cell">
                              <strong>{bet.event}</strong>
                              <span>
                                {bet.league} · {bet.country}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="market-cell">
                              <strong>{bet.selection}</strong>
                              <span>{bet.market}</span>
                            </div>
                          </td>

                          <td>{bet.odds.toFixed(2)}</td>

                          <td>${bet.stake.toFixed(2)}</td>

                          <td>
                            <span className={`status ${bet.status}`}>
                              {getStatusText(bet.status)}
                            </span>
                          </td>

                          <td>
                            {bet.status === 'pending' ? (
                              <span className="neutral-result">—</span>
                            ) : bet.status === 'void' ? (
                              <span>$0.00</span>
                            ) : (
                              <span
                                className={
                                  profit >= 0 ? 'positive' : 'negative'
                                }
                              >
                                {profit >= 0 ? '+' : '-'}$
                                {Math.abs(profit).toFixed(2)}
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="bet-actions">
                              {bet.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    className="action-won"
                                    onClick={() =>
                                      updateStatus(bet.id, 'won')
                                    }
                                  >
                                    Ganada
                                  </button>

                                  <button
                                    type="button"
                                    className="action-lost"
                                    onClick={() =>
                                      updateStatus(bet.id, 'lost')
                                    }
                                  >
                                    Perdida
                                  </button>

                                  <button
                                    type="button"
                                    className="action-void"
                                    onClick={() =>
                                      updateStatus(bet.id, 'void')
                                    }
                                  >
                                    Anulada
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                className="action-delete"
                                onClick={() => deleteBet(bet.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Bets
import ResultsSync from '../../components/ResultsSync'
import './NewBet.css'
import { profit as ticketProfit } from '../../lib/tickets'
import { marketName } from '../../../shared/markets.mjs'
import { formatAmount } from '../../lib/money'
import { useBets, type Bet, type BetStatus } from '../../lib/bets'

import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import './Bets.css'





function Bets() {

  const navigate = useNavigate()

  const { bets, update, remove, reload } = useBets()

  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  async function updateStatus(id: string, status: BetStatus) {

    if (busy) return

    const bet = bets.find(item => item.id === id)

    if (!bet) return

    setBusy(true); setError('')

    try { await update({ ...bet, status, autoSettle:false, actualReturn:status==='pending'?null:status==='won'?bet.potentialReturn:status==='void'?bet.stake:0 }) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }

  }

  async function deleteBet(id: string) {

    if (busy || !window.confirm('¿Seguro que deseas eliminar esta apuesta?')) return

    setBusy(true); setError('')

    try { await remove(id) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }

  }



  function getProfit(bet: Bet) {

    if (bet.status === 'won') {

      return ticketProfit(bet)

    }



    if (bet.status === 'lost') {

      return ticketProfit(bet)

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



        <ResultsSync onUpdated={reload}/>
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



        {error && <p role="alert">{error}</p>}

        <section className="bets-panel" aria-busy={busy}>

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
                              <span className="ticket-badge">{bet.type==='parlay'?'Combinada':bet.type==='same-game'?'Mismo partido':'Simple'} · {bet.legs?.length||1} selecciones</span>
                              {!!bet.legs?.length&&<details className="ticket-legs"><summary>Ver selecciones</summary><ol>{bet.legs.map(leg=><li key={leg.id}>{leg.event}<small>{marketName(leg.market)} · {leg.selection}{leg.line!==null?` · línea ${leg.line}`:''}{leg.player?` · ${leg.player}`:''} · {({pending:'Pendiente',won:'Ganada',lost:'Perdida',void:'Nula','half-won':'Media ganada','half-lost':'Media perdida'} as Record<string,string>)[leg.status]}</small></li>)}</ol></details>}
                              {bet.settlementMethod==='automatic'&&<small>Actualizada con resultados</small>}

                              <span>

                                {bet.league} · {bet.country}

                              </span>

                            </div>

                          </td>



                          <td>

                            <div className="market-cell">

                              <strong>{bet.selection}</strong>

                              <span>{marketName(bet.market)}</span>

                            </div>

                          </td>



                          <td>{bet.odds.toFixed(2)}</td>



                          <td>{formatAmount(bet.stake)}</td>



                          <td>

                            <span className={`status ${bet.status}`}>

                              {getStatusText(bet.status)}

                            </span>

                          </td>



                          <td>

                            {bet.status === 'pending' ? (

                              <span className="neutral-result">—</span>

                            ) : bet.status === 'void' ? (

                              <span>{formatAmount(0)}</span>

                            ) : (

                              <span

                                className={

                                  profit >= 0 ? 'positive' : 'negative'

                                }

                              >

                                {profit >= 0 ? '+' : '-'}{formatAmount(Math.abs(profit))}

                              </span>

                            )}

                          </td>



                          <td>

                            <div className="bet-actions">

                              <button

                                type="button"

                                disabled={busy} className="action-edit"

                                onClick={() =>

                                  navigate(`/bets/${bet.id}/edit`)

                                }

                              >

                                Editar

                              </button>



                              {bet.status === 'pending' && (

                                <>

                                  <button

                                    type="button"

                                    disabled={busy} className="action-won"

                                    onClick={() =>

                                      updateStatus(bet.id, 'won')

                                    }

                                  >

                                    Ganada

                                  </button>



                                  <button

                                    type="button"

                                    disabled={busy} className="action-lost"

                                    onClick={() =>

                                      updateStatus(bet.id, 'lost')

                                    }

                                  >

                                    Perdida

                                  </button>



                                  <button

                                    type="button"

                                    disabled={busy} className="action-void"

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

                                disabled={busy} className="action-delete"

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
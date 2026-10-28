import { profit as ticketProfit } from '../../lib/tickets'
import { marketName } from '../../../shared/markets.mjs'
import { formatAmount } from '../../lib/money'
import { useBets, type Bet } from '../../lib/bets'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Analytics.css'


function Analytics() {
  const navigate = useNavigate()

  const { bets } = useBets()

  const [sportFilter, setSportFilter] = useState('all')
  const [marketFilter, setMarketFilter] = useState('all')
  const [leagueFilter, setLeagueFilter] = useState('all')

  const sports = [...new Set(bets.map((bet) => bet.sport))]
  const markets = [...new Set(bets.map((bet) => bet.market))]
  const leagues = [...new Set(bets.map((bet) => bet.league))]

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      const sportMatch =
        sportFilter === 'all' || bet.sport === sportFilter

      const marketMatch =
        marketFilter === 'all' || bet.market === marketFilter

      const leagueMatch =
        leagueFilter === 'all' || bet.league === leagueFilter

      return sportMatch && marketMatch && leagueMatch
    })
  }, [bets, sportFilter, marketFilter, leagueFilter])

  const resolvedBets = useMemo(() => {
    return filteredBets.filter(
      (bet) => bet.status === 'won' || bet.status === 'lost',
    )
  }, [filteredBets])

  const pendingBets = filteredBets.filter(
    (bet) => bet.status === 'pending',
  )

  const voidBets = filteredBets.filter(
    (bet) => bet.status === 'void',
  )

  const resolvedStake = resolvedBets.reduce(
    (total, bet) => total + bet.stake,
    0,
  )

  const totalStaked = filteredBets.reduce(
    (total, bet) => total + bet.stake,
    0,
  )

  const netProfit = resolvedBets.reduce((total, bet) => {
    if (bet.status === 'won') {
      return total + ticketProfit(bet)
    }

    if (bet.status === 'lost') {
      return total + ticketProfit(bet)
    }

    return total
  }, 0)

  const roi =
    resolvedStake > 0
      ? (netProfit / resolvedStake) * 100
      : 0

  const winningBets = resolvedBets.filter(
    (bet) => bet.status === 'won',
  )

  const losingBets = resolvedBets.filter(
    (bet) => bet.status === 'lost',
  )

  const winRate =
    resolvedBets.length > 0
      ? (winningBets.length / resolvedBets.length) * 100
      : 0

  const averageWinningOdds =
    winningBets.length > 0
      ? winningBets.reduce(
          (total, bet) => total + bet.odds,
          0,
        ) / winningBets.length
      : 0

  const averageLosingOdds =
    losingBets.length > 0
      ? losingBets.reduce(
          (total, bet) => total + bet.odds,
          0,
        ) / losingBets.length
      : 0

  const averageOdds =
    filteredBets.length > 0
      ? filteredBets.reduce(
          (total, bet) => total + bet.odds,
          0,
        ) / filteredBets.length
      : 0

  const streakStats = useMemo(() => {
    const ordered = resolvedBets
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      )

    let currentWin = 0
    let currentLoss = 0
    let maxWin = 0
    let maxLoss = 0

    ordered.forEach((bet) => {
      if (bet.status === 'won') {
        currentWin += 1
        currentLoss = 0

        if (currentWin > maxWin) {
          maxWin = currentWin
        }
      }

      if (bet.status === 'lost') {
        currentLoss += 1
        currentWin = 0

        if (currentLoss > maxLoss) {
          maxLoss = currentLoss
        }
      }
    })

    return {
      maxWin,
      maxLoss,
    }
  }, [resolvedBets])

  const maxDrawdown = useMemo(() => {
    let accumulatedProfit = 0
    let peak = 0
    let maximumDrawdown = 0

    const ordered = resolvedBets
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      )

    ordered.forEach((bet) => {
      if (bet.status === 'won') {
        accumulatedProfit += ticketProfit(bet)
      }

      if (bet.status === 'lost') {
        accumulatedProfit += ticketProfit(bet)
      }

      if (accumulatedProfit > peak) {
        peak = accumulatedProfit
      }

      const drawdown = peak - accumulatedProfit

      if (drawdown > maximumDrawdown) {
        maximumDrawdown = drawdown
      }
    })

    return maximumDrawdown
  }, [resolvedBets])

  function getMarketName(market: string) {
    const names: Record<string, string> = {
      'match-winner': 'Ganador del partido',
      'double-chance': 'Doble oportunidad',
      goals: 'Over / Under goles',
      btts: 'Ambos equipos anotan',
      corners: 'Corners',
      cards: 'Tarjetas',
      handicap: 'Hándicap',
      shots: 'Tiros',
      'shots-on-target': 'Tiros a puerta',
      other: 'Otro',
    }

    return names[market] || marketName(market)
  }

  function getSportName(sport: string) {
    const names: Record<string, string> = {
      football: 'Fútbol',
      basketball: 'Baloncesto',
      tennis: 'Tenis',
      baseball: 'Béisbol',
      other: 'Otro',
      mixed: 'Varios deportes',
    }

    return names[sport] || sport
  }

  function getConfidence(sampleSize: number) {
    if (sampleSize < 5) {
      return {
        label: 'Muestra insuficiente',
        className: 'confidence-very-low',
      }
    }

    if (sampleSize < 15) {
      return {
        label: 'Confianza baja',
        className: 'confidence-low',
      }
    }

    if (sampleSize < 30) {
      return {
        label: 'Confianza media',
        className: 'confidence-medium',
      }
    }

    return {
      label: 'Mayor confianza',
      className: 'confidence-high',
    }
  }

  function getGroupStats(groupBets: Bet[]) {
    const resolved = groupBets.filter(
      (bet) => bet.status === 'won' || bet.status === 'lost',
    )

    const staked = resolved.reduce(
      (total, bet) => total + bet.stake,
      0,
    )

    const profit = resolved.reduce((total, bet) => {
      if (bet.status === 'won') {
        return total + ticketProfit(bet)
      }

      if (bet.status === 'lost') {
        return total + ticketProfit(bet)
      }

      return total
    }, 0)

    const wins = resolved.filter(
      (bet) => bet.status === 'won',
    ).length

    return {
      count: groupBets.length,
      resolvedCount: resolved.length,
      staked,
      profit,
      roi:
        staked > 0
          ? (profit / staked) * 100
          : 0,
      winRate:
        resolved.length > 0
          ? (wins / resolved.length) * 100
          : 0,
    }
  }

  const marketStats = useMemo(() => {
    const groups: Record<string, Bet[]> = {}

    filteredBets.forEach((bet) => {
      if (!groups[bet.market]) {
        groups[bet.market] = []
      }

      groups[bet.market].push(bet)
    })

    return Object.entries(groups)
      .map(([market, groupBets]) => ({
        name: getMarketName(market),
        ...getGroupStats(groupBets),
      }))
      .sort((a, b) => b.roi - a.roi)
  }, [filteredBets])

  const leagueStats = useMemo(() => {
    const groups: Record<string, Bet[]> = {}

    filteredBets.forEach((bet) => {
      if (!groups[bet.league]) {
        groups[bet.league] = []
      }

      groups[bet.league].push(bet)
    })

    return Object.entries(groups)
      .map(([league, groupBets]) => ({
        name: league,
        ...getGroupStats(groupBets),
      }))
      .sort((a, b) => b.roi - a.roi)
  }, [filteredBets])

  const sportStats = useMemo(() => {
    const groups: Record<string, Bet[]> = {}

    filteredBets.forEach((bet) => {
      if (!groups[bet.sport]) {
        groups[bet.sport] = []
      }

      groups[bet.sport].push(bet)
    })

    return Object.entries(groups)
      .map(([sport, groupBets]) => ({
        name: getSportName(sport),
        ...getGroupStats(groupBets),
      }))
      .sort((a, b) => b.roi - a.roi)
  }, [filteredBets])

  const bookmakerStats = useMemo(() => {
    const groups: Record<string, Bet[]> = {}

    filteredBets
      .filter((bet) => bet.bookmaker.trim() !== '')
      .forEach((bet) => {
        if (!groups[bet.bookmaker]) {
          groups[bet.bookmaker] = []
        }

        groups[bet.bookmaker].push(bet)
      })

    return Object.entries(groups)
      .map(([bookmaker, groupBets]) => ({
        name: bookmaker,
        ...getGroupStats(groupBets),
      }))
      .sort((a, b) => b.roi - a.roi)
  }, [filteredBets])

  const oddsRanges = useMemo(() => {
    const ranges = [
      {
        name: '1.01 - 1.49',
        bets: filteredBets.filter(
          (bet) => bet.odds >= 1.01 && bet.odds < 1.5,
        ),
      },
      {
        name: '1.50 - 1.79',
        bets: filteredBets.filter(
          (bet) => bet.odds >= 1.5 && bet.odds < 1.8,
        ),
      },
      {
        name: '1.80 - 1.99',
        bets: filteredBets.filter(
          (bet) => bet.odds >= 1.8 && bet.odds < 2,
        ),
      },
      {
        name: '2.00 - 2.49',
        bets: filteredBets.filter(
          (bet) => bet.odds >= 2 && bet.odds < 2.5,
        ),
      },
      {
        name: '2.50+',
        bets: filteredBets.filter(
          (bet) => bet.odds >= 2.5,
        ),
      },
    ]

    return ranges
      .filter((range) => range.bets.length > 0)
      .map((range) => ({
        name: range.name,
        ...getGroupStats(range.bets),
      }))
  }, [filteredBets])

  return (
    <main className="analytics-page">
      <div className="analytics-container">
        <header className="analytics-header">
          <div>
            <p className="analytics-eyebrow">
              Análisis avanzado
            </p>

            <h1>Analytics</h1>

            <p>
              Descubre dónde obtienes tus mejores y peores resultados.
            </p>
          </div>

          <button
            type="button"
            className="analytics-back-button"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
        </header>

        <section className="analytics-filters">
          <div className="filter-group">
            <label htmlFor="sportFilter">
              Deporte
            </label>

            <select
              id="sportFilter"
              value={sportFilter}
              onChange={(e) =>
                setSportFilter(e.target.value)
              }
            >
              <option value="all">Todos</option>

              {sports.map((sport) => (
                <option
                  key={sport}
                  value={sport}
                >
                  {getSportName(sport)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="marketFilter">
              Mercado
            </label>

            <select
              id="marketFilter"
              value={marketFilter}
              onChange={(e) =>
                setMarketFilter(e.target.value)
              }
            >
              <option value="all">Todos</option>

              {markets.map((market) => (
                <option
                  key={market}
                  value={market}
                >
                  {getMarketName(market)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="leagueFilter">
              Liga
            </label>

            <select
              id="leagueFilter"
              value={leagueFilter}
              onChange={(e) =>
                setLeagueFilter(e.target.value)
              }
            >
              <option value="all">Todas</option>

              {leagues.map((league) => (
                <option
                  key={league}
                  value={league}
                >
                  {league}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="analytics-summary">
          <article>
            <span>Apuestas</span>
            <strong>{filteredBets.length}</strong>
          </article>

          <article>
            <span>Total apostado</span>
            <strong>{formatAmount(totalStaked)}</strong>
          </article>

          <article>
            <span>Profit</span>

            <strong
              className={
                netProfit > 0
                  ? 'positive'
                  : netProfit < 0
                    ? 'negative'
                    : ''
              }
            >
              {netProfit > 0 ? '+' : ''}
              {formatAmount(netProfit)}
            </strong>
          </article>

          <article>
            <span>ROI</span>

            <strong
              className={
                roi > 0
                  ? 'positive'
                  : roi < 0
                    ? 'negative'
                    : ''
              }
            >
              {roi > 0 ? '+' : ''}
              {roi.toFixed(2)}%
            </strong>
          </article>

          <article>
            <span>Win Rate</span>
            <strong>{winRate.toFixed(1)}%</strong>
          </article>
        </section>

        <section className="advanced-summary">
          <article>
            <span>Cuota promedio</span>
            <strong>{averageOdds.toFixed(2)}</strong>
          </article>

          <article>
            <span>Cuota promedio ganadora</span>
            <strong>
              {averageWinningOdds.toFixed(2)}
            </strong>
          </article>

          <article>
            <span>Cuota promedio perdedora</span>
            <strong>
              {averageLosingOdds.toFixed(2)}
            </strong>
          </article>

          <article>
            <span>Mayor racha ganadora</span>
            <strong className="positive">
              {streakStats.maxWin}
            </strong>
          </article>

          <article>
            <span>Mayor racha perdedora</span>
            <strong className="negative">
              {streakStats.maxLoss}
            </strong>
          </article>

          <article>
            <span>Máximo drawdown</span>
            <strong className="negative">
              -{formatAmount(maxDrawdown)}
            </strong>
          </article>

          <article>
            <span>Pendientes</span>
            <strong>{pendingBets.length}</strong>
          </article>

          <article>
            <span>Anuladas</span>
            <strong>{voidBets.length}</strong>
          </article>

          <article>
            <span>Apuestas resueltas</span>
            <strong>{resolvedBets.length}</strong>
          </article>

          <article>
            <span>Monto evaluado</span>
            <strong>{formatAmount(resolvedStake)}</strong>
          </article>
        </section>

        <section className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por mercado</h2>

              <p>
                Compara tus resultados según el tipo de apuesta.
              </p>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Mercado</th>
                    <th>Apuestas</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>Win Rate</th>
                    <th>Confianza</th>
                  </tr>
                </thead>

                <tbody>
                  {marketStats.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        No hay datos suficientes.
                      </td>
                    </tr>
                  ) : (
                    marketStats.map((item) => {
                      const confidence =
                        getConfidence(
                          item.resolvedCount,
                        )

                      return (
                        <tr key={item.name}>
                          <td>{item.name}</td>

                          <td>{item.count}</td>

                          <td
                            className={
                              item.profit >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {item.profit > 0 ? '+' : ''}
                            {formatAmount(item.profit)}
                          </td>

                          <td
                            className={
                              item.roi >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {item.roi > 0 ? '+' : ''}
                            {item.roi.toFixed(1)}%
                          </td>

                          <td>
                            {item.winRate.toFixed(1)}%
                          </td>

                          <td>
                            <span
                              className={`confidence-badge ${confidence.className}`}
                            >
                              {confidence.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por rango de cuotas</h2>

              <p>
                Identifica en qué cuotas obtienes mejores resultados.
              </p>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Cuotas</th>
                    <th>Apuestas</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>Win Rate</th>
                    <th>Confianza</th>
                  </tr>
                </thead>

                <tbody>
                  {oddsRanges.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        No hay datos suficientes.
                      </td>
                    </tr>
                  ) : (
                    oddsRanges.map((range) => {
                      const confidence =
                        getConfidence(
                          range.resolvedCount,
                        )

                      return (
                        <tr key={range.name}>
                          <td>{range.name}</td>

                          <td>{range.count}</td>

                          <td
                            className={
                              range.profit >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {range.profit > 0 ? '+' : ''}
                            {formatAmount(range.profit)}
                          </td>

                          <td
                            className={
                              range.roi >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {range.roi > 0 ? '+' : ''}
                            {range.roi.toFixed(1)}%
                          </td>

                          <td>
                            {range.winRate.toFixed(1)}%
                          </td>

                          <td>
                            <span
                              className={`confidence-badge ${confidence.className}`}
                            >
                              {confidence.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por deporte</h2>

              <p>
                Compara tu desempeño entre disciplinas.
              </p>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Deporte</th>
                    <th>Apuestas</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>Win Rate</th>
                    <th>Confianza</th>
                  </tr>
                </thead>

                <tbody>
                  {sportStats.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        No hay datos suficientes.
                      </td>
                    </tr>
                  ) : (
                    sportStats.map((sport) => {
                      const confidence =
                        getConfidence(
                          sport.resolvedCount,
                        )

                      return (
                        <tr key={sport.name}>
                          <td>{sport.name}</td>

                          <td>{sport.count}</td>

                          <td
                            className={
                              sport.profit >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {sport.profit > 0 ? '+' : ''}
                            {formatAmount(sport.profit)}
                          </td>

                          <td
                            className={
                              sport.roi >= 0
                                ? 'positive'
                                : 'negative'
                            }
                          >
                            {sport.roi > 0 ? '+' : ''}
                            {sport.roi.toFixed(1)}%
                          </td>

                          <td>
                            {sport.winRate.toFixed(1)}%
                          </td>

                          <td>
                            <span
                              className={`confidence-badge ${confidence.className}`}
                            >
                              {confidence.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por bookmaker</h2>

              <p>
                Compara los resultados según la casa de apuestas.
              </p>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Bookmaker</th>
                    <th>Apuestas</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>Win Rate</th>
                    <th>Confianza</th>
                  </tr>
                </thead>

                <tbody>
                  {bookmakerStats.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        No hay bookmakers registrados.
                      </td>
                    </tr>
                  ) : (
                    bookmakerStats.map(
                      (bookmaker) => {
                        const confidence =
                          getConfidence(
                            bookmaker.resolvedCount,
                          )

                        return (
                          <tr key={bookmaker.name}>
                            <td>
                              {bookmaker.name}
                            </td>

                            <td>
                              {bookmaker.count}
                            </td>

                            <td
                              className={
                                bookmaker.profit >= 0
                                  ? 'positive'
                                  : 'negative'
                              }
                            >
                              {bookmaker.profit > 0
                                ? '+'
                                : ''}
                              {formatAmount(bookmaker.profit)}
                            </td>

                            <td
                              className={
                                bookmaker.roi >= 0
                                  ? 'positive'
                                  : 'negative'
                              }
                            >
                              {bookmaker.roi > 0
                                ? '+'
                                : ''}
                              {bookmaker.roi.toFixed(
                                1,
                              )}
                              %
                            </td>

                            <td>
                              {bookmaker.winRate.toFixed(
                                1,
                              )}
                              %
                            </td>

                            <td>
                              <span
                                className={`confidence-badge ${confidence.className}`}
                              >
                                {confidence.label}
                              </span>
                            </td>
                          </tr>
                        )
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="analytics-panel league-panel">
          <div className="analytics-panel-header">
            <h2>Rendimiento por liga</h2>

            <p>
              Analiza qué competiciones generan mejores resultados.
            </p>
          </div>

          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Liga</th>
                  <th>Apuestas</th>
                  <th>Apostado</th>
                  <th>Profit</th>
                  <th>ROI</th>
                  <th>Win Rate</th>
                  <th>Confianza</th>
                </tr>
              </thead>

              <tbody>
                {leagueStats.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      No hay datos suficientes.
                    </td>
                  </tr>
                ) : (
                  leagueStats.map((league) => {
                    const confidence =
                      getConfidence(
                        league.resolvedCount,
                      )

                    return (
                      <tr key={league.name}>
                        <td>{league.name}</td>

                        <td>{league.count}</td>

                        <td>
                          {formatAmount(league.staked)}
                        </td>

                        <td
                          className={
                            league.profit >= 0
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {league.profit > 0 ? '+' : ''}
                          {formatAmount(league.profit)}
                        </td>

                        <td
                          className={
                            league.roi >= 0
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {league.roi > 0 ? '+' : ''}
                          {league.roi.toFixed(1)}%
                        </td>

                        <td>
                          {league.winRate.toFixed(1)}%
                        </td>

                        <td>
                          <span
                            className={`confidence-badge ${confidence.className}`}
                          >
                            {confidence.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Analytics
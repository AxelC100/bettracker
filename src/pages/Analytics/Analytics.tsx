import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Analytics.css'

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

function Analytics() {
  const navigate = useNavigate()

  const bets: Bet[] = JSON.parse(localStorage.getItem('bets') || '[]')

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

  const settledBets = filteredBets.filter(
    (bet) => bet.status === 'won' || bet.status === 'lost',
  )

  const totalStaked = filteredBets.reduce(
    (total, bet) => total + bet.stake,
    0,
  )

  const netProfit = filteredBets.reduce((total, bet) => {
    if (bet.status === 'won') {
      return total + bet.potentialProfit
    }

    if (bet.status === 'lost') {
      return total - bet.stake
    }

    return total
  }, 0)

  const roi =
    totalStaked > 0
      ? (netProfit / totalStaked) * 100
      : 0

  const wonBets = settledBets.filter(
    (bet) => bet.status === 'won',
  ).length

  const winRate =
    settledBets.length > 0
      ? (wonBets / settledBets.length) * 100
      : 0

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

    return names[market] || market
  }

  function getGroupStats(groupBets: Bet[]) {
    const resolved = groupBets.filter(
      (bet) => bet.status === 'won' || bet.status === 'lost',
    )

    const staked = groupBets.reduce(
      (total, bet) => total + bet.stake,
      0,
    )

    const profit = groupBets.reduce((total, bet) => {
      if (bet.status === 'won') {
        return total + bet.potentialProfit
      }

      if (bet.status === 'lost') {
        return total - bet.stake
      }

      return total
    }, 0)

    const wins = resolved.filter(
      (bet) => bet.status === 'won',
    ).length

    return {
      count: groupBets.length,
      staked,
      profit,
      roi: staked > 0 ? (profit / staked) * 100 : 0,
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
            <p className="analytics-eyebrow">Análisis avanzado</p>
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
            <label htmlFor="sportFilter">Deporte</label>

            <select
              id="sportFilter"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
            >
              <option value="all">Todos</option>

              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="marketFilter">Mercado</label>

            <select
              id="marketFilter"
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
            >
              <option value="all">Todos</option>

              {markets.map((market) => (
                <option key={market} value={market}>
                  {getMarketName(market)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="leagueFilter">Liga</label>

            <select
              id="leagueFilter"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
            >
              <option value="all">Todas</option>

              {leagues.map((league) => (
                <option key={league} value={league}>
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
            <strong>${totalStaked.toFixed(2)}</strong>
          </article>

          <article>
            <span>Ganancia / Pérdida</span>

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
              ${netProfit.toFixed(2)}
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

        <section className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por mercado</h2>
              <p>Compara tus resultados según el tipo de apuesta.</p>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Mercado</th>
                    <th>Apuestas</th>
                    <th>Apostado</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>Win Rate</th>
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
                    marketStats.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.count}</td>
                        <td>${item.staked.toFixed(2)}</td>

                        <td
                          className={
                            item.profit >= 0
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {item.profit > 0 ? '+' : ''}
                          ${item.profit.toFixed(2)}
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

                        <td>{item.winRate.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-header">
              <h2>Rendimiento por rango de cuotas</h2>
              <p>Identifica en qué cuotas obtienes mejores resultados.</p>
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
                  </tr>
                </thead>

                <tbody>
                  {oddsRanges.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        No hay datos suficientes.
                      </td>
                    </tr>
                  ) : (
                    oddsRanges.map((range) => (
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
                          ${range.profit.toFixed(2)}
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

                        <td>{range.winRate.toFixed(1)}%</td>
                      </tr>
                    ))
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
                </tr>
              </thead>

              <tbody>
                {leagueStats.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      No hay datos suficientes.
                    </td>
                  </tr>
                ) : (
                  leagueStats.map((league) => (
                    <tr key={league.name}>
                      <td>{league.name}</td>
                      <td>{league.count}</td>
                      <td>${league.staked.toFixed(2)}</td>

                      <td
                        className={
                          league.profit >= 0
                            ? 'positive'
                            : 'negative'
                        }
                      >
                        {league.profit > 0 ? '+' : ''}
                        ${league.profit.toFixed(2)}
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

                      <td>{league.winRate.toFixed(1)}%</td>
                    </tr>
                  ))
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
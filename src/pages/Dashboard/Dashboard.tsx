import { profit as ticketProfit } from '../../lib/tickets'
import { marketName } from '../../../shared/markets.mjs'
import { formatAmount } from '../../lib/money'
import { useBets, type Bet, type BetStatus } from '../../lib/bets'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'


function Dashboard() {
  const navigate = useNavigate()
  const { bets } = useBets()

  const settledBets = useMemo(
    () => bets.filter((bet) => bet.status === 'won' || bet.status === 'lost'),
    [bets],
  )

  const totalStaked = useMemo(
    () => bets.reduce((total, bet) => total + bet.stake, 0),
    [bets],
  )

  const netProfit = useMemo(() => {
    return bets.reduce((total, bet) => {
      if (bet.status === 'won') {
        return total + ticketProfit(bet)
      }

      if (bet.status === 'lost') {
        return total + ticketProfit(bet)
      }

      return total
    }, 0)
  }, [bets])

  const roi = useMemo(() => {
    const resolvedStake = settledBets.reduce((total,bet)=>total+bet.stake,0)
    return resolvedStake ? (netProfit / resolvedStake) * 100 : 0
  }, [netProfit, settledBets])

  const wonBets = bets.filter((bet) => bet.status === 'won').length

  const lostBets = bets.filter((bet) => bet.status === 'lost').length

  const winRate = useMemo(() => {
    const decidedBets = wonBets + lostBets

    if (decidedBets === 0) return 0

    return (wonBets / decidedBets) * 100
  }, [wonBets, lostBets])

  const averageOdds = useMemo(() => {
    if (bets.length === 0) return 0

    const totalOdds = bets.reduce((total, bet) => total + bet.odds, 0)

    return totalOdds / bets.length
  }, [bets])

  const marketPerformance = useMemo(() => {
    const markets: Record<
      string,
      {
        staked: number
        profit: number
      }
    > = {}
    
    settledBets.forEach((bet) => {
      if (!markets[bet.market]) {
        markets[bet.market] = {
          staked: 0,
          profit: 0,
        }
      }

      markets[bet.market].staked += bet.stake

      if (bet.status === 'won') {
        markets[bet.market].profit += ticketProfit(bet)
      }

      if (bet.status === 'lost') {
        markets[bet.market].profit += ticketProfit(bet)
      }
    })

    return Object.entries(markets)
      .map(([market, data]) => ({
        market,
        roi:
          data.staked > 0
            ? (data.profit / data.staked) * 100
            : 0,
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 4)
  }, [settledBets])
   const performanceData = useMemo(() => {
    let accumulatedProfit = 0

    return bets
      .filter((bet) => bet.status !== 'pending')
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      )
      .map((bet, index) => {
        if (bet.status === 'won') {
          accumulatedProfit += ticketProfit(bet)
        }

        if (bet.status === 'lost') {
          accumulatedProfit += ticketProfit(bet)
        }

        return {
          bet: index + 1,
          profit: Number(accumulatedProfit.toFixed(8)),
          event: bet.event,
        }
      })
  }, [bets])

  function getMarketName(market: string) {
    const marketNames: Record<string, string> = {
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

    return marketNames[market] || marketName(market)
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
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Resumen general</p>
          <h1>Dashboard</h1>

          <p className="dashboard-subtitle">
            Analiza tu rendimiento y controla tus apuestas.
          </p>
        </div>

        <button
          type="button"
          className="new-bet-button"
          onClick={() => navigate('/bets/new')}
        >
          + Nueva apuesta
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total apostado</span>
          <strong>{formatAmount(totalStaked)}</strong>
          <small>{bets.length} apuestas registradas</small>
        </article>

        <article className="stat-card">
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
            {formatAmount(netProfit)}
          </strong>

          <small>Beneficio neto</small>
        </article>

        <article className="stat-card">
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

          <small>Retorno sobre inversión</small>
        </article>

        <article className="stat-card">
          <span>Win Rate</span>
          <strong>{winRate.toFixed(1)}%</strong>

          <small>
            {wonBets} ganadas de {wonBets + lostBets}
          </small>
        </article>

        <article className="stat-card">
          <span>Cuota promedio</span>
          <strong>{averageOdds.toFixed(2)}</strong>
          <small>Apuestas registradas</small>
        </article>
      </section>

      <section className="dashboard-content">
        <article className="panel performance-panel">
          <div className="panel-header">
            <div>
              <h2>Rendimiento</h2>
              <p>Evolución de ganancias y pérdidas</p>
            </div>
          </div>

        <div className="performance-chart">
        {performanceData.length === 0 ? (
            <div className="chart-placeholder">
            <span>
                Registra apuestas finalizadas para visualizar tu rendimiento.
            </span>
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={260}>
            <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

                <XAxis
                dataKey="bet"
                tickFormatter={(value) => `#${value}`}
                />

                <YAxis />

                <Tooltip
                formatter={(value) => [formatAmount(Number(value)), 'Beneficio']}
                labelFormatter={(value) => `Apuesta #${value}`}
                />

                <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                />
            </LineChart>
            </ResponsiveContainer>
        )}
        </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Mejores mercados</h2>
              <p>Según tu ROI</p>
            </div>
          </div>

          {marketPerformance.length === 0 ? (
            <p className="empty-message">
              Aún no hay suficientes apuestas finalizadas.
            </p>
          ) : (
            <div className="market-list">
              {marketPerformance.map((market) => (
                <div
                  className="market-row"
                  key={market.market}
                >
                  <span>{getMarketName(market.market)}</span>

                  <strong
                    className={
                      market.roi >= 0
                        ? 'positive'
                        : 'negative'
                    }
                  >
                    {market.roi > 0 ? '+' : ''}
                    {market.roi.toFixed(1)}%
                  </strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel recent-bets">
        <div className="panel-header">
          <div>
            <h2>Apuestas recientes</h2>
            <p>Últimos registros realizados</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/bets')}
          >
            Ver todas
          </button>
        </div>

        <div className="bets-table-wrapper">
          <table className="bets-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Mercado</th>
                <th>Cuota</th>
                <th>Apuesta</th>
                <th>Resultado</th>
                <th>Ganancia</th>
              </tr>
            </thead>

            <tbody>
              {bets.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No hay apuestas registradas todavía.
                  </td>
                </tr>
              ) : (
                bets
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((bet) => {
                    const profit = getProfit(bet)

                    return (
                      <tr key={bet.id}>
                        <td>{bet.event}</td>

                        <td>{bet.selection}</td>

                        <td>{bet.odds.toFixed(2)}</td>

                        <td>{formatAmount(bet.stake)}</td>

                        <td>
                          <span className={`status ${bet.status}`}>
                            {getStatusText(bet.status)}
                          </span>
                        </td>

                        <td>
                          {bet.status === 'pending' ? (
                            '—'
                          ) : bet.status === 'void' ? (
                            formatAmount(0)
                          ) : (
                            <span
                              className={
                                profit >= 0
                                  ? 'positive'
                                  : 'negative'
                              }
                            >
                              {profit >= 0 ? '+' : '-'}{formatAmount(Math.abs(profit))}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
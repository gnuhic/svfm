import { fmtDollar, fmtVariance } from '@/lib/format'
import type { MonthlyActualsRow } from '@/calc/index'

type Props = {
  rows: MonthlyActualsRow[]
  netYearlyForecastVariance: number
}

export function ActualsQaRow({ rows, netYearlyForecastVariance }: Props) {
  const sumForecastMonthly = rows.reduce((s, r) => s + r.forecastNetVariance, 0)
  const sumActualEntered = rows.reduce((s, r) => {
    if (r.actualSalaryVariance === null) return s
    return s + r.actualSalaryVariance
  }, 0)

  const dec = rows[11]
  const eDec = dec?.cumulativeExpectedSpend ?? 0
  const fDec = dec?.cumulativeForecastedSpend ?? 0
  const cumulativeSpread = eDec - fDec

  const forecastMatch = Math.abs(sumForecastMonthly - netYearlyForecastVariance) < 0.05
  const spreadMatch = Math.abs(cumulativeSpread - sumForecastMonthly) < 0.05

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-800">Quality checks</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Workbook row 18: sum of monthly forecast variances equals net yearly variance; cumulative
        expected minus cumulative forecasted at December equals the sum of forecast variances.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Σ Monthly forecast variance
          </dt>
          <dd className="mt-1 tabular-nums text-zinc-900">{fmtVariance(sumForecastMonthly)}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Net yearly forecast variance
          </dt>
          <dd className="mt-1 tabular-nums text-zinc-900">{fmtVariance(netYearlyForecastVariance)}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Match</dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {forecastMatch ? 'Within tolerance' : 'Review inputs'}
          </dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Σ Entered actual variance
          </dt>
          <dd className="mt-1 tabular-nums text-zinc-900">{fmtVariance(sumActualEntered)}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            E(Dec) − F(Dec)
          </dt>
          <dd className="mt-1 tabular-nums text-zinc-900">{fmtVariance(cumulativeSpread)}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Spread vs Σ forecast
          </dt>
          <dd className="mt-1 font-medium text-zinc-900">
            {spreadMatch ? 'Within tolerance' : 'Review inputs'}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-zinc-400">
        Budgeted monthly spend (constant): {dec ? fmtDollar(dec.budgetedMonthlySpend) : '—'}.
      </p>
    </div>
  )
}

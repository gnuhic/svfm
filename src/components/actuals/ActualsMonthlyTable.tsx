import type { MonthlyActualsRow } from '@/calc/index'
import { fmtVariance, fmtDollar } from '@/lib/format'
import { monthAbbr } from '@/lib/monthLabels'
import { ActualVarianceCell } from './ActualVarianceCell'

type Props = { rows: MonthlyActualsRow[] }

function vsForecastLabel(diff: number | null): string {
  if (diff === null) return '—'
  if (diff > 0) return 'Smaller |variance| than forecast'
  if (diff < 0) return 'Larger |variance| than forecast'
  return 'Same magnitude as forecast'
}

export function ActualsMonthlyTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <caption className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-left">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-700">
            Monthly monitoring
          </span>
          <p className="mt-1 max-w-3xl text-xs font-normal text-zinc-500">
            Actual salary variance is entered as budgeted spend minus actual (same sign convention as
            forecast). Monthly difference is |forecast variance| − |actual variance|.
          </p>
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <th scope="col" className="px-4 py-2.5">
              Month
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Forecast net variance
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Actual variance
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Monthly difference
            </th>
            <th scope="col" className="px-4 py-2.5">
              vs forecast
            </th>
            <th scope="col" className="hidden text-right lg:table-cell lg:px-4 lg:py-2.5">
              Budgeted monthly
            </th>
            <th scope="col" className="hidden text-right xl:table-cell xl:px-4 xl:py-2.5">
              Forecasted monthly spend
            </th>
            <th scope="col" className="hidden text-right xl:table-cell xl:px-4 xl:py-2.5">
              Actual monthly spend
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className="border-b border-zinc-100 last:border-0">
              <th scope="row" className="whitespace-nowrap px-4 py-2 text-left font-medium text-zinc-800">
                {monthAbbr(r.month)}
              </th>
              <td className="px-4 py-2 text-right tabular-nums text-zinc-700">
                {fmtVariance(r.forecastNetVariance)}
              </td>
              <td className="px-4 py-2">
                <ActualVarianceCell
                  month={r.month}
                  value={r.actualSalaryVariance}
                  id={`actual-variance-${r.month}`}
                />
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-zinc-700">
                {r.monthlyDifference === null ? '—' : fmtVariance(r.monthlyDifference)}
              </td>
              <td className="max-w-[11rem] px-4 py-2 text-xs leading-snug text-zinc-500">
                {vsForecastLabel(r.monthlyDifference)}
              </td>
              <td className="hidden px-4 py-2 text-right tabular-nums text-zinc-600 lg:table-cell">
                {fmtDollar(r.budgetedMonthlySpend)}
              </td>
              <td className="hidden px-4 py-2 text-right tabular-nums text-zinc-600 xl:table-cell">
                {fmtDollar(r.forecastedMonthlySpend)}
              </td>
              <td className="hidden px-4 py-2 text-right tabular-nums text-zinc-600 xl:table-cell">
                {r.actualMonthlySpend === null ? '—' : fmtDollar(r.actualMonthlySpend)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

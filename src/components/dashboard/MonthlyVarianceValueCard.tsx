import type { MonthlyForecast } from '@/calc/index'
import { fmtVariance, varianceColour } from '@/lib/format'

type Props = { data: MonthlyForecast[] }

export function MonthlyVarianceValueCard({ data }: Props) {
  const monthlyVariance = data[0]?.netMonthlyVariance ?? 0

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 print:break-inside-avoid">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Monthly Variance Forecast</h3>
      <div className="flex h-[220px] items-center justify-center">
        <div className="space-y-2 text-center">
          <p className={`text-4xl font-bold tabular-nums ${varianceColour(monthlyVariance)}`}>
            {fmtVariance(monthlyVariance)}
          </p>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Per month</p>
        </div>
      </div>
    </div>
  )
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyActualsRow } from '@/calc/index'
import { fmtDollar } from '@/lib/format'
import { monthAbbr } from '@/lib/monthLabels'

type ChartRow = {
  label: string
  expected: number
  forecasted: number
  actual: number | null
}

type Props = { rows: MonthlyActualsRow[] }

function buildChartData(rows: MonthlyActualsRow[]): ChartRow[] {
  return rows.map((r) => ({
    label: monthAbbr(r.month),
    expected: r.cumulativeExpectedSpend,
    forecasted: r.cumulativeForecastedSpend,
    actual: r.cumulativeActualSpend,
  }))
}

function spendTick(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return sign + '$' + Math.round(abs / 1_000) + 'K'
  return sign + '$' + Math.round(abs)
}

export function CumulativeSpendChart({ rows }: Props) {
  const data = buildChartData(rows)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-700">Cumulative salary spend</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Expected follows the budget baseline. Forecasted applies the model variance path. Actual
        accumulates only while consecutive months from January include an entered variance (workbook
        logic).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={spendTick}
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            formatter={(value: unknown, name: string) => {
              const n = typeof value === 'number' ? value : NaN
              return [Number.isFinite(n) ? fmtDollar(n) : '—', name]
            }}
            labelStyle={{ fontWeight: 600, color: '#3f3f46' }}
            contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#e4e4e7' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-zinc-600">{value}</span>}
          />
          <Line
            type="monotone"
            name="Expected (budget)"
            dataKey="expected"
            stroke="#a1a1aa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            name="Forecasted"
            dataKey="forecasted"
            stroke="#52525b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            name="Actual"
            dataKey="actual"
            stroke="#18181b"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 3, fill: '#18181b', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

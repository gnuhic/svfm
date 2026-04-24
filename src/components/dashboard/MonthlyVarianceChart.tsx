import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { MonthlyForecast } from '@/calc/index'
import { fmtVariance } from '@/lib/format'
import { monthAbbr } from '@/lib/monthLabels'

type Props = { data: MonthlyForecast[] }

function kFmt(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return sign + '$' + Math.round(abs / 1_000) + 'K'
  return sign + '$' + Math.round(abs)
}

export function MonthlyVarianceChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 print:break-inside-avoid">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Monthly Variance Forecast</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: number) => monthAbbr(m)}
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={kFmt}
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <ReferenceLine y={0} stroke="#a1a1aa" strokeWidth={1} />
          <Tooltip
            formatter={(value: number) => [fmtVariance(value), 'Net monthly variance']}
            labelFormatter={(m: number) => monthAbbr(m)}
            contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#e4e4e7' }}
          />
          <Bar dataKey="netMonthlyVariance" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.netMonthlyVariance >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

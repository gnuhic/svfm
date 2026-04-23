import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { MonthlyForecast } from '@/calc/index'
import { monthAbbr } from '@/lib/monthLabels'

type Props = { data: MonthlyForecast[] }

function kFmt(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return sign + '$' + Math.round(abs / 1_000) + 'K'
  return sign + '$' + Math.round(abs)
}

export function CumulativeForecastChart({ data }: Props) {
  const yearEnd = data[data.length - 1]?.cumulativeForecast ?? 0
  const colour = yearEnd >= 0 ? '#10b981' : '#ef4444'
  const gradientId = 'cumGradient'

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Cumulative Forecast (YTD)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colour} stopOpacity={0.15} />
              <stop offset="95%" stopColor={colour} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value: number) => [kFmt(value), 'Cumulative variance']}
            labelFormatter={(m: number) => monthAbbr(m)}
            contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#e4e4e7' }}
          />
          <Area
            type="monotone"
            dataKey="cumulativeForecast"
            stroke={colour}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: colour, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

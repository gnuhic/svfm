import { fmtVariance, varianceColour } from '@/lib/format'
import { TraceableNumber } from './TraceableNumber'

type Props = {
  ytdVariance: number
  throughLabel: string
  breakdown: Array<{
    monthLabel: string
    value: number
    source: 'Actual' | 'Forecast'
  }>
}

export function YtdVarianceCard({ ytdVariance, throughLabel, breakdown }: Props) {
  const colour = varianceColour(ytdVariance)
  const tooltip = (
    <div className="space-y-1">
      {breakdown.map((line) => (
        <div key={line.monthLabel} className="flex justify-between gap-3">
          <span className="text-zinc-400">
            {line.monthLabel} ({line.source})
          </span>
          <span className="text-right tabular-nums text-zinc-200">{fmtVariance(line.value)}</span>
        </div>
      ))}
      <div className="my-1.5 border-t border-zinc-700" />
      <div className="flex justify-between gap-3">
        <span className="text-zinc-400">YTD total</span>
        <span className="text-right tabular-nums text-zinc-200">{fmtVariance(ytdVariance)}</span>
      </div>
    </div>
  )

  return (
    <div className="w-72 shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
        Variance YTD
      </p>
      <div className={`mt-3 text-3xl font-bold leading-none ${colour}`}>
        <TraceableNumber value={fmtVariance(ytdVariance)} tooltip={tooltip} />
      </div>
      <div className="mt-3 space-y-1 text-xs text-zinc-400">
        <p className="font-semibold">Through {throughLabel}</p>
      </div>
    </div>
  )
}

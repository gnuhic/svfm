import type { SummaryResult } from '@/calc/index'
import { fmtVariance, varianceColour } from '@/lib/format'
import { TraceableNumber } from './TraceableNumber'

type Props = { summary: SummaryResult }

/** Surplus / pressure on dark tooltip background (readable on zinc-900) */
function varianceColourTooltip(n: number) {
  if (n > 0) return 'text-emerald-300'
  if (n < 0) return 'text-red-300'
  return 'text-zinc-400'
}

function TRow({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span className={`text-right tabular-nums ${colour ?? 'text-zinc-200'}`}>{value}</span>
    </div>
  )
}

export function SummaryCard({ summary }: Props) {
  const net = summary.netYearlySalaryVariance
  const colour = varianceColour(net)

  const tooltip = (
    <div className="space-y-1">
      <TRow
        label="Vacancies"
        value={fmtVariance(summary.netVacancyImpact)}
        colour={varianceColourTooltip(summary.netVacancyImpact)}
      />
      <TRow
        label="Unplanned leave"
        value={fmtVariance(summary.netUnplannedLeaveImpact)}
        colour={varianceColourTooltip(summary.netUnplannedLeaveImpact)}
      />
      <TRow
        label="Planned leave"
        value={fmtVariance(summary.netPlannedLeaveImpact)}
        colour={varianceColourTooltip(summary.netPlannedLeaveImpact)}
      />
      <TRow
        label="Pay adjustments"
        value={fmtVariance(summary.netPayAdjustmentImpact)}
        colour={varianceColourTooltip(summary.netPayAdjustmentImpact)}
      />
      <div className="my-1.5 border-t border-zinc-700" />
      <TRow
        label="Net yearly"
        value={fmtVariance(net)}
        colour={varianceColourTooltip(net)}
      />
    </div>
  )

  return (
    <div className="w-72 shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
        Net Yearly Variance
      </p>
      <div className={`mt-3 text-3xl font-bold leading-none ${colour}`}>
        <TraceableNumber value={fmtVariance(net)} tooltip={tooltip} />
      </div>
      <p className="mt-3 text-xs text-zinc-400">Hover to see driver breakdown</p>
    </div>
  )
}

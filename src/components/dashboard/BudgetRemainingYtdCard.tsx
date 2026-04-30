import { fmtDollar, fmtVariance, varianceColour } from '@/lib/format'
import { TraceableNumber } from './TraceableNumber'

type Props = {
  totalAnnualBudget: number
  totalActualSpentYtd: number
  value: number
  throughLabel: string
}

export function BudgetRemainingYtdCard({
  totalAnnualBudget,
  totalActualSpentYtd,
  value,
  throughLabel,
}: Props) {
  const colour = varianceColour(value)
  const tooltip = (
    <div className="space-y-1">
      <div className="flex justify-between gap-3">
        <span className="text-zinc-400">Total annual budget</span>
        <span className="text-right tabular-nums text-zinc-200">{fmtDollar(totalAnnualBudget)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-zinc-400">Actuals spent (YTD inputs)</span>
        <span className="text-right tabular-nums text-zinc-200">-{fmtDollar(totalActualSpentYtd)}</span>
      </div>
      <div className="my-1.5 border-t border-zinc-700" />
      <div className="flex justify-between gap-3">
        <span className="text-zinc-400">Budget remaining YTD</span>
        <span className="text-right tabular-nums text-zinc-200">{fmtVariance(value)}</span>
      </div>
    </div>
  )

  return (
    <div className="w-72 shrink-0 rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Budget Remaining YTD</p>
      <div className={`mt-3 text-3xl font-bold leading-none ${colour}`}>
        <TraceableNumber value={fmtVariance(value)} tooltip={tooltip} />
      </div>
      <p className="mt-3 text-xs font-semibold text-zinc-400">Through {throughLabel}</p>
    </div>
  )
}

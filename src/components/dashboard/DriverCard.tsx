import { type ReactNode } from 'react'
import { fmtVariance, varianceColour } from '@/lib/format'
import { TraceableNumber } from './TraceableNumber'

type Props = {
  title: string
  description: string
  netImpact: number
  tooltip: ReactNode
}

export function DriverCard({ title, description, netImpact, tooltip }: Props) {
  const colour = varianceColour(netImpact)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
      <div className={`mt-3 text-xl font-bold leading-none ${colour}`}>
        <TraceableNumber value={fmtVariance(netImpact)} tooltip={tooltip} />
      </div>
      <p className="mt-2 text-xs text-zinc-400">Hover for breakdown</p>
    </div>
  )
}

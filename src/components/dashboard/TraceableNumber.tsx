import { type ReactNode } from 'react'

type Props = {
  value: string
  tooltip: ReactNode
}

export function TraceableNumber({ value, tooltip }: Props) {
  return (
    <span className="group/tn relative inline-block">
      <span className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
        {value}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2.5 w-64 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2.5 text-xs font-normal text-zinc-100 opacity-0 shadow-xl ring-1 ring-zinc-700/50 transition-opacity duration-150 group-hover/tn:visible group-hover/tn:opacity-100"
      >
        {tooltip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
      </span>
    </span>
  )
}

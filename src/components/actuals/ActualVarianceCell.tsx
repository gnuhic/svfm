import { useEffect, useState } from 'react'
import { useAppStore } from '@/state/store'
import { cn } from '@/lib/utils'

type Props = {
  month: number
  value: number | null
  id: string
}

function parseActualInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, '')
  if (t === '' || t === '-' || t === '.' || t === '-.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

export function ActualVarianceCell({ month, value, id }: Props) {
  const updateActual = useAppStore((s) => s.updateActual)
  const [draft, setDraft] = useState(() => (value === null ? '' : String(value)))

  useEffect(() => {
    setDraft(value === null ? '' : String(value))
  }, [value, month])

  const commit = () => {
    const parsed = parseActualInput(draft)
    if (Number.isNaN(parsed)) {
      setDraft(value === null ? '' : String(value))
      return
    }
    updateActual(month, parsed)
    setDraft(parsed === null ? '' : String(parsed))
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={`Actual salary variance, month ${month}`}
      placeholder="—"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className={cn(
        'w-full min-w-[6.5rem] rounded border border-zinc-300 bg-white px-2 py-1.5 text-right text-sm tabular-nums text-zinc-900',
        'placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500',
      )}
    />
  )
}

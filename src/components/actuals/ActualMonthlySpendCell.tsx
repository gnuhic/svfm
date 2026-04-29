import { useEffect, useState } from 'react'
import { useAppStore } from '@/state/store'
import { cn } from '@/lib/utils'

type Props = {
  month: number
  value: number | null
  forecastedMonthlySpend: number
  id: string
}

function parseInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, '')
  if (t === '' || t === '-' || t === '.' || t === '-.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

export function ActualMonthlySpendCell({ month, value, forecastedMonthlySpend, id }: Props) {
  const updateActual = useAppStore((s) => s.updateActual)
  const [draft, setDraft] = useState(() => (value === null ? '' : String(value)))

  useEffect(() => {
    setDraft(value === null ? '' : String(value))
  }, [value, month])

  const commit = () => {
    const parsedSpend = parseInput(draft)
    if (Number.isNaN(parsedSpend)) {
      setDraft(value === null ? '' : String(value))
      return
    }

    if (parsedSpend === null) {
      updateActual(month, null)
      setDraft('')
      return
    }

    const derivedVariance = forecastedMonthlySpend - parsedSpend
    updateActual(month, derivedVariance)
    setDraft(String(parsedSpend))
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      aria-label={`Actual monthly spend, month ${month}`}
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

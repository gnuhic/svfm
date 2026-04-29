const CA = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
const CA0 = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 })
const CA4 = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 4, minimumFractionDigits: 2 })

/** $1,234,568 — rounded to nearest dollar */
export function fmtDollar(n: number): string {
  return '$' + CA0.format(n)
}

/** $1,234,568 — no cents, for large budget figures */
export function fmtDollarRound(n: number): string {
  return '$' + CA0.format(n)
}

/** 29.29 — up to 4 decimal places, at least 2 */
export function fmtDecimal(n: number): string {
  return CA4.format(n)
}

/** 185 — integer, no decimals */
export function fmtInteger(n: number): string {
  return CA0.format(Math.round(n))
}

/** 3.00% — percentage already in display units (3 means 3%) */
export function fmtPct(n: number): string {
  return CA.format(n) + '%'
}

/**
 * Returns Tailwind text colour class based on the sign of a variance.
 * Positive variance = surplus (favourable) → green.
 * Negative variance = pressure (unfavourable) → red.
 */
export function varianceColour(n: number): string {
  if (n > 0) return 'text-emerald-700'
  if (n < 0) return 'text-red-700'
  return 'text-zinc-600'
}

/** "+ $26,042" / "− $70,000" — rounded to nearest dollar */
export function fmtVariance(n: number): string {
  return (n >= 0 ? '+ ' : '− ') + '$' + CA0.format(Math.abs(n))
}

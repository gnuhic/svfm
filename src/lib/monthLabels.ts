/** 1-based month index (1 = January) → short label for charts and tables */
const ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function monthAbbr(month: number): string {
  if (month < 1 || month > 12) return `M${month}`
  return ABBR[month - 1] as (typeof ABBR)[number]
}

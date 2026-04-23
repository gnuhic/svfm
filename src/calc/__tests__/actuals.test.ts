import { describe, it, expect } from 'vitest'
import { calcActuals } from '../actuals'
import { DEFAULTS, runModel } from '../index'

const { forecast } = runModel({
  fiscal: DEFAULTS.fiscal,
  vacancies: DEFAULTS.vacancies,
  unplannedLeave: DEFAULTS.unplannedLeave,
  plannedLeave: DEFAULTS.plannedLeave,
  payAdjustments: DEFAULTS.payAdjustments,
})

const BUDGET = DEFAULTS.fiscal.totalSalaryBudget

// Sample actuals from workbook (Jan–Apr entered, May–Dec blank)
const sampleActuals = [
  { month: 1, actualSalaryVariance: 5_000 },
  { month: 2, actualSalaryVariance: -8_000 },
  { month: 3, actualSalaryVariance: 2_000 },
  { month: 4, actualSalaryVariance: 4_500 },
  ...Array.from({ length: 8 }, (_, i) => ({ month: i + 5, actualSalaryVariance: null })),
]

describe('calcActuals', () => {
  it('returns exactly 12 rows', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    expect(rows).toHaveLength(12)
  })

  it('budgetedMonthlySpend is constant = totalSalaryBudget / 12', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    const expected = BUDGET / 12
    rows.forEach((r) => expect(r.budgetedMonthlySpend).toBeCloseTo(expected, 2))
  })

  it('forecastedMonthlySpend = budgeted − forecast net variance', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    rows.forEach((r, i) => {
      const expected = r.budgetedMonthlySpend - forecast.monthly[i]!.netMonthlyVariance
      expect(r.forecastedMonthlySpend).toBeCloseTo(expected, 4)
    })
  })

  it('actualMonthlySpend = budgeted − actualVariance when present', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    const jan = rows[0]!
    expect(jan.actualMonthlySpend).toBeCloseTo(BUDGET / 12 - 5_000, 2)
  })

  it('actualMonthlySpend is null when no actual entered', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    rows.slice(4).forEach((r) => expect(r.actualMonthlySpend).toBeNull())
  })

  it('monthlyDifference is null when no actual entered', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    rows.slice(4).forEach((r) => expect(r.monthlyDifference).toBeNull())
  })

  it('cumulativeExpectedSpend[m] = budgeted × m', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    rows.forEach((r) => {
      expect(r.cumulativeExpectedSpend).toBeCloseTo((BUDGET / 12) * r.month, 2)
    })
  })

  it('cumulativeForecastedSpend grows each month', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.cumulativeForecastedSpend).toBeGreaterThan(rows[i - 1]!.cumulativeForecastedSpend)
    }
  })

  it('cumulativeActualSpend is null for months after the last entered actual', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    rows.slice(4).forEach((r) => expect(r.cumulativeActualSpend).toBeNull())
  })

  it('cumulativeActualSpend[4] = sum of actual monthly spends for Jan–Apr', () => {
    const rows = calcActuals(forecast.monthly, BUDGET, sampleActuals)
    const budgeted = BUDGET / 12
    const expectedCumulative =
      (budgeted - 5_000) + (budgeted + 8_000) + (budgeted - 2_000) + (budgeted - 4_500)
    expect(rows[3]!.cumulativeActualSpend).toBeCloseTo(expectedCumulative, 2)
  })

  it('works with all nulls (no actuals entered)', () => {
    const noActuals = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      actualSalaryVariance: null,
    }))
    const rows = calcActuals(forecast.monthly, BUDGET, noActuals)
    rows.forEach((r) => {
      expect(r.actualMonthlySpend).toBeNull()
      expect(r.cumulativeActualSpend).toBeNull()
      expect(r.monthlyDifference).toBeNull()
    })
  })
})

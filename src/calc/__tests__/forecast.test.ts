import { describe, it, expect } from 'vitest'
import { calcForecast } from '../forecast'
import { DEFAULTS, runModel } from '../index'

const defaultSummary = runModel({
  fiscal: DEFAULTS.fiscal,
  vacancies: DEFAULTS.vacancies,
  unplannedLeave: DEFAULTS.unplannedLeave,
  plannedLeave: DEFAULTS.plannedLeave,
  payAdjustments: DEFAULTS.payAdjustments,
}).summary

describe('calcForecast', () => {
  it('returns exactly 12 monthly rows', () => {
    const result = calcForecast(defaultSummary)
    expect(result.monthly).toHaveLength(12)
  })

  it('months are numbered 1 through 12', () => {
    const result = calcForecast(defaultSummary)
    result.monthly.forEach((row, i) => expect(row.month).toBe(i + 1))
  })

  it('each monthly net variance = annual variance / 12', () => {
    const result = calcForecast(defaultSummary)
    const expected = defaultSummary.netYearlySalaryVariance / 12
    result.monthly.forEach((row) => expect(row.netMonthlyVariance).toBeCloseTo(expected, 4))
  })

  it('all monthly net variances are equal (flat distribution in V1)', () => {
    const result = calcForecast(defaultSummary)
    const first = result.monthly[0]!.netMonthlyVariance
    result.monthly.forEach((row) => expect(row.netMonthlyVariance).toBeCloseTo(first, 10))
  })

  it('cumulative forecast for December equals annual variance', () => {
    const result = calcForecast(defaultSummary)
    const dec = result.monthly[11]!
    expect(dec.cumulativeForecast).toBeCloseTo(26_041.67, 2)
  })

  it('cumulative forecast is strictly increasing (surplus scenario)', () => {
    const result = calcForecast(defaultSummary)
    for (let i = 1; i < result.monthly.length; i++) {
      expect(result.monthly[i]!.cumulativeForecast).toBeGreaterThan(result.monthly[i - 1]!.cumulativeForecast)
    }
  })

  it('annualDrivers totals match summary', () => {
    const result = calcForecast(defaultSummary)
    expect(result.annualDrivers.totalAnnualVariance).toBeCloseTo(26_041.67, 2)
  })

  it('default monthly net variance ≈ 2,170.14', () => {
    const result = calcForecast(defaultSummary)
    expect(result.monthly[0]!.netMonthlyVariance).toBeCloseTo(2_170.14, 2)
  })
})

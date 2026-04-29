import { describe, it, expect } from 'vitest'
import { deriveFiscalContext } from '../fiscalContext'
import { DEFAULTS } from '../index'

describe('deriveFiscalContext', () => {
  it('computes avgMonthlySalary as annualSalary / 12', () => {
    const result = deriveFiscalContext(DEFAULTS.fiscal)
    expect(result.avgMonthlySalary).toBeCloseTo(11_666.67, 2)
  })

  it('computes avgMonthlyOvertimeCost as residual budget / 12', () => {
    // (26,000,000 − 140,000 × 185) / 12 = 100,000 / 12 = 8,333.33
    const result = deriveFiscalContext(DEFAULTS.fiscal)
    expect(result.avgMonthlyOvertimeCost).toBeCloseTo(8_333.33, 2)
  })

  it('OT cost is zero when base salaries consume the full budget', () => {
    const result = deriveFiscalContext({
      totalSalaryBudget: 100,
      numberOfOfficers: 10,
      avgAnnualSalary: 10,
      overtimeRateMultiplier: 1,
    })
    expect(result.avgMonthlyOvertimeCost).toBe(0)
  })

  it('OT cost is negative when base salaries exceed the budget', () => {
    const result = deriveFiscalContext({
      totalSalaryBudget: 1_000,
      numberOfOfficers: 10,
      avgAnnualSalary: 200,
      overtimeRateMultiplier: 1,
    })
    expect(result.avgMonthlyOvertimeCost).toBeLessThan(0)
  })
})

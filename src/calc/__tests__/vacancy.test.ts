import { describe, it, expect } from 'vitest'
import { calcVacancy } from '../drivers/vacancy'
import { deriveFiscalContext, type FiscalContextInputs } from '../fiscalContext'
import { DEFAULTS } from '../index'

function fiscalFull(f: FiscalContextInputs) {
  return { ...deriveFiscalContext(f), numberOfOfficers: f.numberOfOfficers }
}

describe('calcVacancy', () => {
  it('computes avgVacantPositions as frequency % × officer count', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    // 0.03 × 185 = 5.55
    expect(result.avgVacantPositions).toBeCloseTo(5.55, 2)
  })

  it('computes positionMonths as avgVacantPositions × duration', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    // 5.55 × 6 = 33.3
    expect(result.positionMonths).toBeCloseTo(33.3, 2)
  })

  it('computes salaryAvoidance = positionMonths × avgMonthlySalary', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    // 33.3 × 11,666.67 = 388,500
    expect(result.salaryAvoidance).toBeCloseTo(388_500, 2)
  })

  it('computes coverageSalaryCosts = positionMonths × backfillRate × avgMonthlyOTCost', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    // 33.3 × 0.40 × 8,333.33 = 111,000
    expect(result.coverageSalaryCosts).toBeCloseTo(111_000, 2)
  })

  it('golden: net vacancy impact = 277,500', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    expect(result.netImpact).toBeCloseTo(277_500, 2)
  })

  it('net impact is positive (surplus) when salary avoidance exceeds coverage costs', () => {
    const result = calcVacancy(DEFAULTS.vacancies, fiscalFull(DEFAULTS.fiscal))
    expect(result.netImpact).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import { calcUnplannedLeave } from '../drivers/unplannedLeave'
import { DEFAULTS } from '../index'

describe('calcUnplannedLeave', () => {
  const fiscal = {
    avgMonthlySalary: DEFAULTS.fiscal.avgAnnualSalary / 12,
    overtimeRateMultiplier: DEFAULTS.fiscal.overtimeRateMultiplier,
  }

  it('avgVacantPositions equals officersOnLeave directly (not × headcount)', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.avgVacantPositions).toBe(DEFAULTS.unplannedLeave.officersOnLeave)
  })

  it('positionMonths = officersOnLeave × duration', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    // 2 × 6 = 12
    expect(result.positionMonths).toBe(12)
  })

  it('salaryAvoidance is always 0 (V1 lock)', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.salaryAvoidance).toBe(0)
  })

  it('coverageSalaryCosts = officersOnLeave × avgAnnualSalary × backfillRate × overtimeRateMultiplier', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    // 2 × 140,000 × 0.70 × 1 = 196,000
    expect(result.coverageSalaryCosts).toBeCloseTo(196_000, 2)
  })

  it('golden: net unplanned leave impact = −196,000', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.netImpact).toBeCloseTo(-196_000, 2)
  })

  it('net impact is always negative or zero in V1 (pure cost pressure)', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.netImpact).toBeLessThanOrEqual(0)
  })
})

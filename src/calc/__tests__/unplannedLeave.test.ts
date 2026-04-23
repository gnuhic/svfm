import { describe, it, expect } from 'vitest'
import { calcUnplannedLeave } from '../drivers/unplannedLeave'
import { deriveFiscalContext } from '../fiscalContext'
import { DEFAULTS } from '../index'

describe('calcUnplannedLeave', () => {
  const fiscal = deriveFiscalContext(DEFAULTS.fiscal)

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

  it('coverageSalaryCosts = positionMonths × backfillRate × avgMonthlyOTCost', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    // 12 × 0.70 × 8,333.33 = 70,000
    expect(result.coverageSalaryCosts).toBeCloseTo(70_000, 2)
  })

  it('golden: net unplanned leave impact = −70,000', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.netImpact).toBeCloseTo(-70_000, 2)
  })

  it('net impact is always negative or zero in V1 (pure cost pressure)', () => {
    const result = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
    expect(result.netImpact).toBeLessThanOrEqual(0)
  })
})

import { describe, it, expect } from 'vitest'
import { calcPlannedLeave } from '../drivers/plannedLeave'
import { deriveFiscalContext } from '../fiscalContext'
import { DEFAULTS } from '../index'

describe('calcPlannedLeave', () => {
  const fiscal = { ...deriveFiscalContext(DEFAULTS.fiscal), numberOfOfficers: DEFAULTS.fiscal.numberOfOfficers }

  it('officersAffected is locked to numberOfOfficers', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    expect(result.officersAffected).toBe(DEFAULTS.fiscal.numberOfOfficers)
  })

  it('avgVacantPositions = (officers × duration) / 12 — distinct from rows 17/18', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    // (185 × 1.9) / 12 = 351.5 / 12 = 29.2917
    expect(result.avgVacantPositions).toBeCloseTo(29.29, 2)
  })

  it('positionMonths = officers × duration directly (skips column H)', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    // 185 × 1.9 = 351.5
    expect(result.positionMonths).toBeCloseTo(351.5, 2)
  })

  it('positionMonths does NOT equal avgVacantPositions × duration', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    // If it incorrectly used H × D: 29.29 × 1.9 = 55.65 (wrong)
    expect(result.positionMonths).not.toBeCloseTo(result.avgVacantPositions * DEFAULTS.plannedLeave.durationMonthsPerOfficer, 0)
  })

  it('salaryAvoidance is always 0 (salary still paid during planned leave)', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    expect(result.salaryAvoidance).toBe(0)
  })

  it('golden: net planned leave impact = −146,458.33', () => {
    const result = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
    expect(result.netImpact).toBeCloseTo(-146_458.33, 2)
  })
})

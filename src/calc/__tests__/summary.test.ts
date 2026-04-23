import { describe, it, expect } from 'vitest'
import { calcSummary } from '../summary'
import { calcVacancy } from '../drivers/vacancy'
import { calcUnplannedLeave } from '../drivers/unplannedLeave'
import { calcPlannedLeave } from '../drivers/plannedLeave'
import { calcPayAdjustments } from '../drivers/payAdjustments'
import { deriveFiscalContext } from '../fiscalContext'
import { DEFAULTS } from '../index'

describe('calcSummary', () => {
  const fiscal = { ...deriveFiscalContext(DEFAULTS.fiscal), numberOfOfficers: DEFAULTS.fiscal.numberOfOfficers }
  const vacancy = calcVacancy(DEFAULTS.vacancies, fiscal)
  const unplannedLeave = calcUnplannedLeave(DEFAULTS.unplannedLeave, fiscal)
  const plannedLeave = calcPlannedLeave(DEFAULTS.plannedLeave, fiscal)
  const payAdjustments = calcPayAdjustments(DEFAULTS.payAdjustments)

  it('passes through each driver net impact unchanged', () => {
    const summary = calcSummary(vacancy, unplannedLeave, plannedLeave, payAdjustments)
    expect(summary.netVacancyImpact).toBeCloseTo(277_500, 2)
    expect(summary.netUnplannedLeaveImpact).toBeCloseTo(-70_000, 2)
    expect(summary.netPlannedLeaveImpact).toBeCloseTo(-146_458.33, 2)
    expect(summary.netPayAdjustmentImpact).toBeCloseTo(-35_000, 2)
  })

  it('golden: net yearly salary variance = 26,041.67', () => {
    const summary = calcSummary(vacancy, unplannedLeave, plannedLeave, payAdjustments)
    expect(summary.netYearlySalaryVariance).toBeCloseTo(26_041.67, 2)
  })

  it('net yearly variance equals the sum of the four driver impacts', () => {
    const summary = calcSummary(vacancy, unplannedLeave, plannedLeave, payAdjustments)
    const expected =
      summary.netVacancyImpact +
      summary.netUnplannedLeaveImpact +
      summary.netPlannedLeaveImpact +
      summary.netPayAdjustmentImpact
    expect(summary.netYearlySalaryVariance).toBeCloseTo(expected, 10)
  })
})

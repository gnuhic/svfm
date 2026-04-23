import type { VacancyResult } from './drivers/vacancy'
import type { UnplannedLeaveResult } from './drivers/unplannedLeave'
import type { PlannedLeaveResult } from './drivers/plannedLeave'
import type { PayAdjustmentResult } from './drivers/payAdjustments'

export type SummaryResult = {
  netVacancyImpact: number
  netUnplannedLeaveImpact: number
  netPlannedLeaveImpact: number
  netPayAdjustmentImpact: number
  netYearlySalaryVariance: number
}

/**
 * Section 4 of field spec. Rolls up the four driver net impacts.
 * Positive result = forecasted surplus. Negative = forecasted pressure.
 */
export function calcSummary(
  vacancy: VacancyResult,
  unplannedLeave: UnplannedLeaveResult,
  plannedLeave: PlannedLeaveResult,
  payAdjustments: PayAdjustmentResult,
): SummaryResult {
  const netVacancyImpact = vacancy.netImpact
  const netUnplannedLeaveImpact = unplannedLeave.netImpact
  const netPlannedLeaveImpact = plannedLeave.netImpact
  const netPayAdjustmentImpact = payAdjustments.netImpact
  return {
    netVacancyImpact,
    netUnplannedLeaveImpact,
    netPlannedLeaveImpact,
    netPayAdjustmentImpact,
    netYearlySalaryVariance:
      netVacancyImpact +
      netUnplannedLeaveImpact +
      netPlannedLeaveImpact +
      netPayAdjustmentImpact,
  }
}

import type { FiscalContextDerived } from '../fiscalContext'

export type PlannedLeaveDriverInputs = {
  durationMonthsPerOfficer: number
  backfillRate: number
}

export type PlannedLeaveResult = {
  officersAffected: number
  avgVacantPositions: number
  positionMonths: number
  salaryAvoidance: number
  coverageSalaryCosts: number
  netImpact: number
}

type FiscalNeeded = FiscalContextDerived & { numberOfOfficers: number }

/**
 * Workbook row 19. Two formulas differ from rows 17 and 18:
 *
 * Avg Vacant Positions = (Officers × Duration) / 12   — annualised FTE equivalent
 * Position Months      = Officers × Duration           — skips column H, uses raw inputs directly
 *
 * Officers Affected is locked to numberOfOfficers (V1 decision #1).
 * Salary Avoidance is locked at 0 — salary is still paid during planned leave (V1 decision #2).
 * Coverage Costs = Officers Affected × (Avg Planned Leave per Officer / 12) × Avg Annual Salary × Backfill Rate × OT Rate Multiplier
 */
export function calcPlannedLeave(
  inputs: PlannedLeaveDriverInputs,
  fiscal: FiscalNeeded,
): PlannedLeaveResult {
  const officersAffected = fiscal.numberOfOfficers
  const avgVacantPositions = (officersAffected * inputs.durationMonthsPerOfficer) / 12
  const positionMonths = officersAffected * inputs.durationMonthsPerOfficer
  const salaryAvoidance = 0
  const avgAnnualSalary = fiscal.avgMonthlySalary * 12
  const coverageSalaryCosts =
    officersAffected *
    (inputs.durationMonthsPerOfficer / 12) *
    avgAnnualSalary *
    inputs.backfillRate *
    fiscal.overtimeRateMultiplier
  return {
    officersAffected,
    avgVacantPositions,
    positionMonths,
    salaryAvoidance,
    coverageSalaryCosts,
    netImpact: salaryAvoidance - coverageSalaryCosts,
  }
}

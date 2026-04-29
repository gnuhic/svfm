import type { FiscalContextDerived } from '../fiscalContext'

export type UnplannedLeaveDriverInputs = {
  officersOnLeave: number
  durationMonths: number
  backfillRate: number
}

export type UnplannedLeaveResult = {
  avgVacantPositions: number
  positionMonths: number
  salaryAvoidance: number
  coverageSalaryCosts: number
  netImpact: number
}

/**
 * Workbook row 18.
 * Avg Vacant Positions = officersOnLeave directly (absolute count, NOT × officer headcount)
 * Salary Avoidance     = 0 (locked per V1 decision #2 — salary still typically paid)
 * Coverage Costs       = Officers On Leave × Avg Annual Salary × Backfill Rate × OT Rate Multiplier
 * Net Impact           = 0 − Coverage Costs    (always a cost pressure in V1)
 */
export function calcUnplannedLeave(
  inputs: UnplannedLeaveDriverInputs,
  fiscal: Pick<FiscalContextDerived, 'avgMonthlySalary' | 'overtimeRateMultiplier'>,
): UnplannedLeaveResult {
  const avgVacantPositions = inputs.officersOnLeave
  const positionMonths = avgVacantPositions * inputs.durationMonths
  const salaryAvoidance = 0
  const avgAnnualSalary = fiscal.avgMonthlySalary * 12
  const coverageSalaryCosts =
    inputs.officersOnLeave *
    avgAnnualSalary *
    inputs.backfillRate *
    fiscal.overtimeRateMultiplier
  return {
    avgVacantPositions,
    positionMonths,
    salaryAvoidance,
    coverageSalaryCosts,
    netImpact: salaryAvoidance - coverageSalaryCosts,
  }
}

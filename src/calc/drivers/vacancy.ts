import type { FiscalContextDerived } from '../fiscalContext'

export type VacancyDriverInputs = {
  frequencyPercent: number
  durationMonths: number
  backfillRate: number
}

export type VacancyResult = {
  avgVacantPositions: number
  positionMonths: number
  salaryAvoidance: number
  coverageSalaryCosts: number
  netImpact: number
}

type FiscalNeeded = FiscalContextDerived & {
  numberOfOfficers: number
  overtimeRateMultiplier: number
}

/**
 * Workbook row 17.
 * Avg Vacant Positions = Frequency % × Number of Officers   (percentage of the workforce)
 * Position Months      = Avg Vacant Positions × Duration
 * Salary Avoidance     = Position Months × Avg Monthly Salary
 * Coverage Costs       = Salary Avoidance × Backfill Rate × OT Rate Multiplier
 * Net Impact           = Salary Avoidance − Coverage Costs    (positive = surplus)
 */
export function calcVacancy(inputs: VacancyDriverInputs, fiscal: FiscalNeeded): VacancyResult {
  const avgVacantPositions = inputs.frequencyPercent * fiscal.numberOfOfficers
  const positionMonths = avgVacantPositions * inputs.durationMonths
  const salaryAvoidance = positionMonths * fiscal.avgMonthlySalary
  const coverageSalaryCosts = salaryAvoidance * inputs.backfillRate * fiscal.overtimeRateMultiplier
  return {
    avgVacantPositions,
    positionMonths,
    salaryAvoidance,
    coverageSalaryCosts,
    netImpact: salaryAvoidance - coverageSalaryCosts,
  }
}

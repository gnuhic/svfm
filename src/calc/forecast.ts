import type { SummaryResult } from './summary'

export type MonthlyForecast = {
  month: number
  vacancyImpact: number
  unplannedLeaveImpact: number
  plannedLeaveImpact: number
  payAdjustmentImpact: number
  netMonthlyVariance: number
  cumulativeForecast: number
}

export type ForecastResult = {
  annualDrivers: {
    vacancyImpact: number
    unplannedLeaveImpact: number
    plannedLeaveImpact: number
    payAdjustmentImpact: number
    totalAnnualVariance: number
  }
  monthly: MonthlyForecast[]
}

/**
 * Sections 5 and 6 of field spec. V1 distributes all driver variances evenly
 * across 12 months (flat distribution, no seasonality — V1 decision #7).
 *
 * Monthly Driver Variance = Annual Driver Variance / 12
 * Net Monthly Variance    = SUM of four monthly driver variances
 * Cumulative Forecast[m]  = SUM(Net Monthly Variance[1..m])
 */
export function calcForecast(summary: SummaryResult): ForecastResult {
  const annualDrivers = {
    vacancyImpact: summary.netVacancyImpact,
    unplannedLeaveImpact: summary.netUnplannedLeaveImpact,
    plannedLeaveImpact: summary.netPlannedLeaveImpact,
    payAdjustmentImpact: summary.netPayAdjustmentImpact,
    totalAnnualVariance: summary.netYearlySalaryVariance,
  }

  const mVacancy = summary.netVacancyImpact / 12
  const mUnplanned = summary.netUnplannedLeaveImpact / 12
  const mPlanned = summary.netPlannedLeaveImpact / 12
  const mPayAdj = summary.netPayAdjustmentImpact / 12
  const netMonthlyVariance = mVacancy + mUnplanned + mPlanned + mPayAdj

  let cumulative = 0
  const monthly: MonthlyForecast[] = []
  for (let m = 1; m <= 12; m++) {
    cumulative += netMonthlyVariance
    monthly.push({
      month: m,
      vacancyImpact: mVacancy,
      unplannedLeaveImpact: mUnplanned,
      plannedLeaveImpact: mPlanned,
      payAdjustmentImpact: mPayAdj,
      netMonthlyVariance,
      cumulativeForecast: cumulative,
    })
  }

  return { annualDrivers, monthly }
}

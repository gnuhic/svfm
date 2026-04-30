import type { MonthlyForecast } from './forecast'

export type ActualEntry = {
  month: number
  actualSalaryVariance: number | null
}

export type MonthlyActualsRow = {
  month: number
  forecastNetVariance: number
  actualSalaryVariance: number | null
  monthlyDifference: number | null
  budgetedMonthlySpend: number
  forecastedMonthlySpend: number
  actualMonthlySpend: number | null
  cumulativeExpectedSpend: number
  cumulativeForecastedSpend: number
  cumulativeActualSpend: number | null
}

/**
 * Section 7 of field spec. Computes the full actuals monitoring table.
 *
 * Budgeted Monthly Spend[m]     = totalSalaryBudget / 12  (constant)
 * Forecasted Monthly Spend[m]   = Budgeted − Forecast Net Variance[m]
 * Actual Monthly Spend[m]       = user-entered monthly spend input (null if no input)
 * Actual Variance[m]            = Forecasted Monthly Spend[m] − Actual Monthly Spend[m]
 * Monthly Difference[m]         = |forecast variance| − |actual variance|  (null if no actual)
 * Cumulative Expected Spend[m]  = Budgeted Monthly Spend × m
 * Cumulative Forecasted Spend   = running sum of Forecasted Monthly Spend
 * Cumulative Actual Spend       = running sum of Actual Monthly Spend (null when current month null)
 */
export function calcActuals(
  monthlyForecast: MonthlyForecast[],
  totalSalaryBudget: number,
  actuals: ActualEntry[],
): MonthlyActualsRow[] {
  const budgetedMonthlySpend = totalSalaryBudget / 12

  const actualByMonth = new Map(actuals.map((a) => [a.month, a.actualSalaryVariance]))

  const rows: MonthlyActualsRow[] = []
  let cumulativeForecasted = 0
  let cumulativeActual: number | null = 0

  for (let m = 1; m <= 12; m++) {
    const fc = monthlyForecast[m - 1]
    if (!fc) throw new Error(`Missing forecast for month ${m}`)

    const forecastNetVariance = fc.netMonthlyVariance
    const actualMonthlySpend = actualByMonth.get(m) ?? null

    const forecastedMonthlySpend = budgetedMonthlySpend - forecastNetVariance
    const actualSalaryVariance =
      actualMonthlySpend !== null ? forecastedMonthlySpend - actualMonthlySpend : null

    const monthlyDifference =
      actualSalaryVariance !== null
        ? Math.abs(forecastNetVariance) - Math.abs(actualSalaryVariance)
        : null

    cumulativeForecasted += forecastedMonthlySpend

    if (actualMonthlySpend !== null) {
      cumulativeActual = (cumulativeActual ?? 0) + actualMonthlySpend
    } else {
      cumulativeActual = null
    }

    rows.push({
      month: m,
      forecastNetVariance,
      actualSalaryVariance,
      monthlyDifference,
      budgetedMonthlySpend,
      forecastedMonthlySpend,
      actualMonthlySpend,
      cumulativeExpectedSpend: budgetedMonthlySpend * m,
      cumulativeForecastedSpend: cumulativeForecasted,
      cumulativeActualSpend: cumulativeActual,
    })
  }

  return rows
}

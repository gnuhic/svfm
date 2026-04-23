import { runModel, calcActuals } from '@/calc/index'
import type { ModelResults, MonthlyActualsRow } from '@/calc/index'
import type { AppData } from './types'

/**
 * Derives the full model results (drivers, summary, forecast) from raw inputs.
 * Called at render time — not stored. The calculation is fast enough that
 * recomputing on every relevant state change is not a performance concern for V1.
 */
export function selectModelResults(state: AppData): ModelResults {
  return runModel({
    fiscal: state.assumptions,
    vacancies: state.drivers.vacancies,
    unplannedLeave: state.drivers.unplannedLeave,
    plannedLeave: state.drivers.plannedLeave,
    payAdjustments: state.drivers.payAdjustments,
  })
}

/**
 * Derives the full actuals monitoring table (12 rows) from forecast + user-entered actuals.
 * Depends on selectModelResults, so both recompute together when inputs change.
 */
export function selectActualsRows(state: AppData): MonthlyActualsRow[] {
  const { forecast } = selectModelResults(state)
  return calcActuals(forecast.monthly, state.assumptions.totalSalaryBudget, state.actuals)
}

export type { ModelResults, MonthlyActualsRow }

import {
  deriveFiscalContext,
  type FiscalContextInputs,
  type FiscalContextDerived,
} from './fiscalContext'
import { calcVacancy, type VacancyDriverInputs, type VacancyResult } from './drivers/vacancy'
import {
  calcUnplannedLeave,
  type UnplannedLeaveDriverInputs,
  type UnplannedLeaveResult,
} from './drivers/unplannedLeave'
import {
  calcPlannedLeave,
  type PlannedLeaveDriverInputs,
  type PlannedLeaveResult,
} from './drivers/plannedLeave'
import {
  calcPayAdjustments,
  type PayAdjustmentInputs,
  type PayAdjustmentResult,
} from './drivers/payAdjustments'
import { calcSummary, type SummaryResult } from './summary'
import { calcForecast, type ForecastResult, type MonthlyForecast } from './forecast'
import { calcActuals, type ActualEntry, type MonthlyActualsRow } from './actuals'

export {
  deriveFiscalContext,
  calcVacancy,
  calcUnplannedLeave,
  calcPlannedLeave,
  calcPayAdjustments,
  calcSummary,
  calcForecast,
  calcActuals,
}

export type {
  FiscalContextInputs,
  FiscalContextDerived,
  VacancyDriverInputs,
  VacancyResult,
  UnplannedLeaveDriverInputs,
  UnplannedLeaveResult,
  PlannedLeaveDriverInputs,
  PlannedLeaveResult,
  PayAdjustmentInputs,
  PayAdjustmentResult,
  SummaryResult,
  ForecastResult,
  MonthlyForecast,
  ActualEntry,
  MonthlyActualsRow,
}

// ── Default values from workbook ────────────────────────────────────────────

export const DEFAULTS = {
  fiscal: {
    totalSalaryBudget: 26_000_000,
    numberOfOfficers: 185,
    avgAnnualSalary: 140_000,
  },
  vacancies: {
    frequencyPercent: 0.03,
    durationMonths: 6,
    backfillRate: 0.4,
  },
  unplannedLeave: {
    officersOnLeave: 2,
    durationMonths: 6,
    backfillRate: 0.7,
  },
  plannedLeave: {
    durationMonthsPerOfficer: 1.9,
    backfillRate: 0.05,
  },
  payAdjustments: {
    promotionsActingPayPressure: 20_000,
    stepProgressionImpact: 10_000,
    other: 5_000,
  },
} as const

// ── Model inputs / outputs ───────────────────────────────────────────────────

export type ModelInputs = {
  fiscal: FiscalContextInputs
  vacancies: VacancyDriverInputs
  unplannedLeave: UnplannedLeaveDriverInputs
  plannedLeave: PlannedLeaveDriverInputs
  payAdjustments: PayAdjustmentInputs
}

export type ModelResults = {
  fiscalDerived: FiscalContextDerived
  drivers: {
    vacancy: VacancyResult
    unplannedLeave: UnplannedLeaveResult
    plannedLeave: PlannedLeaveResult
    payAdjustments: PayAdjustmentResult
  }
  summary: SummaryResult
  forecast: ForecastResult
}

/**
 * Runs the full calculation pipeline from raw inputs to forecast.
 * Actuals are computed separately via calcActuals() since they depend on
 * user-entered monthly data that changes independently of driver inputs.
 */
export function runModel(inputs: ModelInputs): ModelResults {
  const fiscalDerived = deriveFiscalContext(inputs.fiscal)
  const fiscalFull = { ...fiscalDerived, numberOfOfficers: inputs.fiscal.numberOfOfficers }

  const vacancy = calcVacancy(inputs.vacancies, fiscalFull)
  const unplannedLeave = calcUnplannedLeave(inputs.unplannedLeave, fiscalDerived)
  const plannedLeave = calcPlannedLeave(inputs.plannedLeave, fiscalFull)
  const payAdjustments = calcPayAdjustments(inputs.payAdjustments)

  const summary = calcSummary(vacancy, unplannedLeave, plannedLeave, payAdjustments)
  const forecast = calcForecast(summary)

  return { fiscalDerived, drivers: { vacancy, unplannedLeave, plannedLeave, payAdjustments }, summary, forecast }
}

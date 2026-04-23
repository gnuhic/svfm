import type {
  FiscalContextInputs,
  VacancyDriverInputs,
  UnplannedLeaveDriverInputs,
  PlannedLeaveDriverInputs,
  PayAdjustmentInputs,
  ActualEntry,
} from '@/calc/index'
import { DEFAULTS } from '@/calc/index'

export { type ActualEntry }

export const SCHEMA_VERSION = '1.0'

// ── Core data shape (stored in localStorage and exported to JSON) ─────────────

export type AppData = {
  version: string
  serviceName: string
  fiscalYear: number
  assumptions: FiscalContextInputs
  drivers: {
    vacancies: VacancyDriverInputs
    unplannedLeave: UnplannedLeaveDriverInputs
    plannedLeave: PlannedLeaveDriverInputs
    payAdjustments: PayAdjustmentInputs
  }
  actuals: ActualEntry[]
}

export type LoadResult = { success: true } | { success: false; error: string }

// ── Default state (workbook defaults) ────────────────────────────────────────

export const DEFAULT_STATE: AppData = {
  version: SCHEMA_VERSION,
  serviceName: '',
  fiscalYear: new Date().getFullYear(),
  assumptions: { ...DEFAULTS.fiscal },
  drivers: {
    vacancies: { ...DEFAULTS.vacancies },
    unplannedLeave: { ...DEFAULTS.unplannedLeave },
    plannedLeave: { ...DEFAULTS.plannedLeave },
    payAdjustments: { ...DEFAULTS.payAdjustments },
  },
  actuals: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    actualSalaryVariance: null,
  })),
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import type { AppData, LoadResult } from './types'
import { SCHEMA_VERSION, DEFAULT_STATE } from './types'
import type {
  FiscalContextInputs,
  VacancyDriverInputs,
  UnplannedLeaveDriverInputs,
  PlannedLeaveDriverInputs,
  PayAdjustmentInputs,
} from '@/calc/index'

// ── Zod validation schema ────────────────────────────────────────────────────

const AppDataSchema = z.object({
  version: z.string(),
  serviceName: z.string(),
  fiscalYear: z.number().int().positive(),
  assumptions: z.object({
    totalSalaryBudget: z.number().positive(),
    numberOfOfficers: z.number().int().positive(),
    avgAnnualSalary: z.number().positive(),
  }),
  drivers: z.object({
    vacancies: z.object({
      frequencyPercent: z.number().min(0).max(1),
      durationMonths: z.number().positive(),
      backfillRate: z.number().min(0).max(1),
    }),
    unplannedLeave: z.object({
      officersOnLeave: z.number().int().min(0),
      durationMonths: z.number().positive(),
      backfillRate: z.number().min(0).max(1),
    }),
    plannedLeave: z.object({
      durationMonthsPerOfficer: z.number().positive(),
      backfillRate: z.number().min(0).max(1),
    }),
    payAdjustments: z.object({
      promotionsActingPayPressure: z.number().min(0),
      stepProgressionImpact: z.number().min(0),
      other: z.number().min(0),
    }),
  }),
  actuals: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        actualSalaryVariance: z.number().nullable(),
      }),
    )
    .length(12),
})

// ── Store type ────────────────────────────────────────────────────────────────

export type AppStore = AppData & {
  setServiceName: (name: string) => void
  setFiscalYear: (year: number) => void
  updateAssumptions: (patch: Partial<FiscalContextInputs>) => void
  updateVacancies: (patch: Partial<VacancyDriverInputs>) => void
  updateUnplannedLeave: (patch: Partial<UnplannedLeaveDriverInputs>) => void
  updatePlannedLeave: (patch: Partial<PlannedLeaveDriverInputs>) => void
  updatePayAdjustments: (patch: Partial<PayAdjustmentInputs>) => void
  updateActual: (month: number, variance: number | null) => void
  resetToDefaults: () => void
  loadFromJSON: (data: unknown) => LoadResult
  exportToJSON: () => AppData
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setServiceName: (name) => set({ serviceName: name }),

      setFiscalYear: (year) => set({ fiscalYear: year }),

      updateAssumptions: (patch) =>
        set((state) => ({ assumptions: { ...state.assumptions, ...patch } })),

      updateVacancies: (patch) =>
        set((state) => ({
          drivers: { ...state.drivers, vacancies: { ...state.drivers.vacancies, ...patch } },
        })),

      updateUnplannedLeave: (patch) =>
        set((state) => ({
          drivers: {
            ...state.drivers,
            unplannedLeave: { ...state.drivers.unplannedLeave, ...patch },
          },
        })),

      updatePlannedLeave: (patch) =>
        set((state) => ({
          drivers: {
            ...state.drivers,
            plannedLeave: { ...state.drivers.plannedLeave, ...patch },
          },
        })),

      updatePayAdjustments: (patch) =>
        set((state) => ({
          drivers: {
            ...state.drivers,
            payAdjustments: { ...state.drivers.payAdjustments, ...patch },
          },
        })),

      updateActual: (month, variance) =>
        set((state) => ({
          actuals: state.actuals.map((a) =>
            a.month === month ? { ...a, actualSalaryVariance: variance } : a,
          ),
        })),

      // Merge (not replace) to preserve action functions on the state object.
      resetToDefaults: () => set(DEFAULT_STATE),

      loadFromJSON: (data) => {
        const incoming = data as Record<string, unknown> | null
        const incomingVersion = incoming?.version

        if (incomingVersion && incomingVersion !== SCHEMA_VERSION) {
          return {
            success: false,
            error: `Incompatible schema version: the file uses version "${String(incomingVersion)}", this application expects "${SCHEMA_VERSION}".`,
          }
        }

        const result = AppDataSchema.safeParse(data)
        if (!result.success) {
          return {
            success: false,
            error:
              'Invalid configuration file. The file may be corrupted or missing required fields.',
          }
        }

        // Merge to preserve action functions.
        set(result.data)
        return { success: true }
      },

      // Explicitly pick data fields only — avoids fragile action-function stripping.
      exportToJSON: () => {
        const { version, serviceName, fiscalYear, assumptions, drivers, actuals } = get()
        return { version, serviceName, fiscalYear, assumptions, drivers, actuals }
      },
    }),
    {
      name: 'svfm-state',
      version: 1,
    },
  ),
)

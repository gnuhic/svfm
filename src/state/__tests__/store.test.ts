import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'
import { DEFAULT_STATE, SCHEMA_VERSION } from '../types'
import { selectModelResults, selectActualsRows } from '../selectors'

// Reset store and clear localStorage before every test.
beforeEach(() => {
  localStorage.clear()
  useAppStore.setState(DEFAULT_STATE)
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('version matches SCHEMA_VERSION', () => {
    expect(useAppStore.getState().version).toBe(SCHEMA_VERSION)
  })

  it('serviceName defaults to empty string', () => {
    expect(useAppStore.getState().serviceName).toBe('')
  })

  it('assumptions match workbook defaults', () => {
    const { assumptions } = useAppStore.getState()
    expect(assumptions.totalSalaryBudget).toBe(26_000_000)
    expect(assumptions.numberOfOfficers).toBe(185)
    expect(assumptions.avgAnnualSalary).toBe(140_000)
    expect(assumptions.overtimeRateMultiplier).toBe(1)
  })

  it('actuals array has exactly 12 entries', () => {
    expect(useAppStore.getState().actuals).toHaveLength(12)
  })

  it('all actuals default to null', () => {
    useAppStore.getState().actuals.forEach((a) => {
      expect(a.actualSalaryVariance).toBeNull()
    })
  })

  it('actuals months are numbered 1–12', () => {
    useAppStore.getState().actuals.forEach((a, i) => {
      expect(a.month).toBe(i + 1)
    })
  })
})

// ── setServiceName ────────────────────────────────────────────────────────────

describe('setServiceName', () => {
  it('updates the service name', () => {
    useAppStore.getState().setServiceName('London Police Service')
    expect(useAppStore.getState().serviceName).toBe('London Police Service')
  })

  it('allows empty string', () => {
    useAppStore.getState().setServiceName('LPS')
    useAppStore.getState().setServiceName('')
    expect(useAppStore.getState().serviceName).toBe('')
  })
})

// ── setFiscalYear ─────────────────────────────────────────────────────────────

describe('setFiscalYear', () => {
  it('updates the fiscal year', () => {
    useAppStore.getState().setFiscalYear(2027)
    expect(useAppStore.getState().fiscalYear).toBe(2027)
  })
})

// ── updateAssumptions ─────────────────────────────────────────────────────────

describe('updateAssumptions', () => {
  it('updates a single field without affecting others', () => {
    useAppStore.getState().updateAssumptions({ totalSalaryBudget: 30_000_000 })
    const { assumptions } = useAppStore.getState()
    expect(assumptions.totalSalaryBudget).toBe(30_000_000)
    expect(assumptions.numberOfOfficers).toBe(185)
    expect(assumptions.avgAnnualSalary).toBe(140_000)
    expect(assumptions.overtimeRateMultiplier).toBe(1)
  })

  it('can update multiple fields in one call', () => {
    useAppStore.getState().updateAssumptions({ numberOfOfficers: 200, avgAnnualSalary: 150_000 })
    const { assumptions } = useAppStore.getState()
    expect(assumptions.numberOfOfficers).toBe(200)
    expect(assumptions.avgAnnualSalary).toBe(150_000)
  })
})

// ── updateVacancies ───────────────────────────────────────────────────────────

describe('updateVacancies', () => {
  it('updates a vacancy field without touching other drivers', () => {
    useAppStore.getState().updateVacancies({ frequencyPercent: 0.05 })
    const { drivers } = useAppStore.getState()
    expect(drivers.vacancies.frequencyPercent).toBe(0.05)
    expect(drivers.vacancies.durationMonths).toBe(6)
    expect(drivers.unplannedLeave.officersOnLeave).toBe(2)
  })
})

// ── updateUnplannedLeave ──────────────────────────────────────────────────────

describe('updateUnplannedLeave', () => {
  it('updates an unplanned leave field without touching other drivers', () => {
    useAppStore.getState().updateUnplannedLeave({ officersOnLeave: 4 })
    const { drivers } = useAppStore.getState()
    expect(drivers.unplannedLeave.officersOnLeave).toBe(4)
    expect(drivers.vacancies.frequencyPercent).toBe(0.03)
  })
})

// ── updatePlannedLeave ────────────────────────────────────────────────────────

describe('updatePlannedLeave', () => {
  it('updates a planned leave field without touching other drivers', () => {
    useAppStore.getState().updatePlannedLeave({ durationMonthsPerOfficer: 2.5 })
    const { drivers } = useAppStore.getState()
    expect(drivers.plannedLeave.durationMonthsPerOfficer).toBe(2.5)
    expect(drivers.plannedLeave.backfillRate).toBe(0.05)
  })
})

// ── updatePayAdjustments ──────────────────────────────────────────────────────

describe('updatePayAdjustments', () => {
  it('updates a pay adjustment field without touching other drivers', () => {
    useAppStore.getState().updatePayAdjustments({ other: 15_000 })
    const { drivers } = useAppStore.getState()
    expect(drivers.payAdjustments.other).toBe(15_000)
    expect(drivers.payAdjustments.promotionsActingPayPressure).toBe(20_000)
  })
})

// ── updateActual ──────────────────────────────────────────────────────────────

describe('updateActual', () => {
  it('sets a monthly actual', () => {
    useAppStore.getState().updateActual(3, 5_500)
    const march = useAppStore.getState().actuals.find((a) => a.month === 3)
    expect(march?.actualSalaryVariance).toBe(5_500)
  })

  it('does not affect other months', () => {
    useAppStore.getState().updateActual(3, 5_500)
    const actuals = useAppStore.getState().actuals
    actuals
      .filter((a) => a.month !== 3)
      .forEach((a) => expect(a.actualSalaryVariance).toBeNull())
  })

  it('can clear an actual by setting null', () => {
    useAppStore.getState().updateActual(1, 10_000)
    useAppStore.getState().updateActual(1, null)
    const jan = useAppStore.getState().actuals.find((a) => a.month === 1)
    expect(jan?.actualSalaryVariance).toBeNull()
  })

  it('supports negative actuals (cost pressure months)', () => {
    useAppStore.getState().updateActual(2, -8_000)
    const feb = useAppStore.getState().actuals.find((a) => a.month === 2)
    expect(feb?.actualSalaryVariance).toBe(-8_000)
  })
})

// ── resetToDefaults ───────────────────────────────────────────────────────────

describe('resetToDefaults', () => {
  it('restores all assumptions to defaults', () => {
    useAppStore.getState().updateAssumptions({ totalSalaryBudget: 99_000_000 })
    useAppStore.getState().resetToDefaults()
    expect(useAppStore.getState().assumptions.totalSalaryBudget).toBe(26_000_000)
  })

  it('restores all driver fields to defaults', () => {
    useAppStore.getState().updateVacancies({ frequencyPercent: 0.1 })
    useAppStore.getState().resetToDefaults()
    expect(useAppStore.getState().drivers.vacancies.frequencyPercent).toBe(0.03)
  })

  it('clears all actuals', () => {
    useAppStore.getState().updateActual(1, 5_000)
    useAppStore.getState().resetToDefaults()
    useAppStore
      .getState()
      .actuals.forEach((a) => expect(a.actualSalaryVariance).toBeNull())
  })

  it('clears the service name', () => {
    useAppStore.getState().setServiceName('LPS')
    useAppStore.getState().resetToDefaults()
    expect(useAppStore.getState().serviceName).toBe('')
  })

  it('action functions still work after reset', () => {
    useAppStore.getState().resetToDefaults()
    useAppStore.getState().setServiceName('Post-reset')
    expect(useAppStore.getState().serviceName).toBe('Post-reset')
  })
})

// ── loadFromJSON ──────────────────────────────────────────────────────────────

describe('loadFromJSON', () => {
  const validPayload = {
    ...DEFAULT_STATE,
    serviceName: 'Toronto Police Service',
    assumptions: {
      totalSalaryBudget: 50_000_000,
      numberOfOfficers: 350,
      avgAnnualSalary: 145_000,
      overtimeRateMultiplier: 1,
    },
  }

  it('loads valid state and returns success', () => {
    const result = useAppStore.getState().loadFromJSON(validPayload)
    expect(result.success).toBe(true)
    expect(useAppStore.getState().serviceName).toBe('Toronto Police Service')
    expect(useAppStore.getState().assumptions.totalSalaryBudget).toBe(50_000_000)
  })

  it('preserves action functions after load', () => {
    useAppStore.getState().loadFromJSON(validPayload)
    useAppStore.getState().setServiceName('Changed after load')
    expect(useAppStore.getState().serviceName).toBe('Changed after load')
  })

  it('rejects payload with wrong schema version', () => {
    const result = useAppStore.getState().loadFromJSON({ ...validPayload, version: '9.9' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/version/i)
      expect(result.error).toContain('9.9')
    }
  })

  it('does not modify state when version is wrong', () => {
    useAppStore.getState().setServiceName('Original')
    useAppStore.getState().loadFromJSON({ ...validPayload, version: '9.9' })
    expect(useAppStore.getState().serviceName).toBe('Original')
  })

  it('rejects null input', () => {
    const result = useAppStore.getState().loadFromJSON(null)
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = useAppStore.getState().loadFromJSON({ version: SCHEMA_VERSION, serviceName: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects actuals array with wrong length', () => {
    const short = { ...validPayload, actuals: [{ month: 1, actualSalaryVariance: null }] }
    const result = useAppStore.getState().loadFromJSON(short)
    expect(result.success).toBe(false)
  })
})

// ── exportToJSON ──────────────────────────────────────────────────────────────

describe('exportToJSON', () => {
  it('returns data fields only (no functions)', () => {
    const exported = useAppStore.getState().exportToJSON()
    expect(typeof (exported as unknown as Record<string, unknown>)['setServiceName']).not.toBe('function')
  })

  it('exported data matches current state', () => {
    useAppStore.getState().setServiceName('LPS')
    const exported = useAppStore.getState().exportToJSON()
    expect(exported.serviceName).toBe('LPS')
    expect(exported.assumptions.totalSalaryBudget).toBe(26_000_000)
  })

  it('round-trips through JSON without data loss', () => {
    useAppStore.getState().setServiceName('Round-trip test')
    useAppStore.getState().updateActual(6, 3_000)
    const exported = useAppStore.getState().exportToJSON()

    useAppStore.getState().resetToDefaults()
    useAppStore.getState().loadFromJSON(JSON.parse(JSON.stringify(exported)))

    expect(useAppStore.getState().serviceName).toBe('Round-trip test')
    const june = useAppStore.getState().actuals.find((a) => a.month === 6)
    expect(june?.actualSalaryVariance).toBe(3_000)
  })
})

// ── Selectors ─────────────────────────────────────────────────────────────────

describe('selectModelResults', () => {
  it('returns the correct net yearly variance for defaults', () => {
    const results = selectModelResults(useAppStore.getState())
    expect(results.summary.netYearlySalaryVariance).toBeCloseTo(-202_941.67, 2)
  })

  it('reacts to assumption changes', () => {
    const before = selectModelResults(useAppStore.getState()).summary.netYearlySalaryVariance
    useAppStore.getState().updateAssumptions({ numberOfOfficers: 200 })
    const after = selectModelResults(useAppStore.getState()).summary.netYearlySalaryVariance
    expect(after).not.toBeCloseTo(before, 2)
  })
})

describe('selectActualsRows', () => {
  it('returns 12 rows', () => {
    expect(selectActualsRows(useAppStore.getState())).toHaveLength(12)
  })

  it('derives actual variance from entered monthly spend', () => {
    useAppStore.getState().updateActual(1, 5_000)
    const rows = selectActualsRows(useAppStore.getState())
    expect(rows[0]?.actualMonthlySpend).toBe(5_000)
    expect(rows[0]?.actualSalaryVariance).toBeCloseTo(rows[0]!.forecastedMonthlySpend - 5_000, 2)
  })
})

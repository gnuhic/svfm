/**
 * Parity tests: verify the calculation engine matches SVMP_2026.xlsx exactly.
 *
 * All expected values are taken directly from the workbook with default inputs.
 * Tolerance: 0.01 (two decimal places) per project plan Section 11.
 *
 * If any assertion here fails, the engine diverges from the workbook — stop and fix
 * before proceeding to later phases.
 */
import { describe, it, expect } from 'vitest'
import { DEFAULTS, runModel, calcActuals } from '../index'

const MODEL = runModel({
  fiscal: DEFAULTS.fiscal,
  vacancies: DEFAULTS.vacancies,
  unplannedLeave: DEFAULTS.unplannedLeave,
  plannedLeave: DEFAULTS.plannedLeave,
  payAdjustments: DEFAULTS.payAdjustments,
})

describe('Workbook parity — fiscal context (Inputs!A6:C11)', () => {
  it('1.4 avgMonthlySalary = 11,666.67', () => {
    expect(MODEL.fiscalDerived.avgMonthlySalary).toBeCloseTo(11_666.67, 2)
  })

  it('1.5 avgMonthlyOvertimeCost = 8,333.33', () => {
    expect(MODEL.fiscalDerived.avgMonthlyOvertimeCost).toBeCloseTo(8_333.33, 2)
  })
})

describe('Workbook parity — vacancies (row 17)', () => {
  it('H: avgVacantPositions = 5.55', () => {
    expect(MODEL.drivers.vacancy.avgVacantPositions).toBeCloseTo(5.55, 2)
  })

  it('I: positionMonths = 33.3', () => {
    expect(MODEL.drivers.vacancy.positionMonths).toBeCloseTo(33.3, 2)
  })

  it('J: salaryAvoidance = 388,500', () => {
    expect(MODEL.drivers.vacancy.salaryAvoidance).toBeCloseTo(388_500, 2)
  })

  it('K: coverageSalaryCosts = 111,000', () => {
    expect(MODEL.drivers.vacancy.coverageSalaryCosts).toBeCloseTo(111_000, 2)
  })

  it('L: netImpact = 277,500', () => {
    expect(MODEL.drivers.vacancy.netImpact).toBeCloseTo(277_500, 2)
  })
})

describe('Workbook parity — unplanned leave (row 18)', () => {
  it('H: avgVacantPositions = 2', () => {
    expect(MODEL.drivers.unplannedLeave.avgVacantPositions).toBe(2)
  })

  it('I: positionMonths = 12', () => {
    expect(MODEL.drivers.unplannedLeave.positionMonths).toBe(12)
  })

  it('J: salaryAvoidance = 0', () => {
    expect(MODEL.drivers.unplannedLeave.salaryAvoidance).toBe(0)
  })

  it('K: coverageSalaryCosts = 70,000', () => {
    expect(MODEL.drivers.unplannedLeave.coverageSalaryCosts).toBeCloseTo(70_000, 2)
  })

  it('L: netImpact = −70,000', () => {
    expect(MODEL.drivers.unplannedLeave.netImpact).toBeCloseTo(-70_000, 2)
  })
})

describe('Workbook parity — planned leave (row 19)', () => {
  it('B: officersAffected = 185 (locked to numberOfOfficers)', () => {
    expect(MODEL.drivers.plannedLeave.officersAffected).toBe(185)
  })

  it('H: avgVacantPositions = 29.29 (uses ×duration/12, not row-17 formula)', () => {
    expect(MODEL.drivers.plannedLeave.avgVacantPositions).toBeCloseTo(29.29, 2)
  })

  it('I: positionMonths = 351.5 (officers × duration, skips column H)', () => {
    expect(MODEL.drivers.plannedLeave.positionMonths).toBeCloseTo(351.5, 2)
  })

  it('J: salaryAvoidance = 0', () => {
    expect(MODEL.drivers.plannedLeave.salaryAvoidance).toBe(0)
  })

  it('K: coverageSalaryCosts = 146,458.33', () => {
    expect(MODEL.drivers.plannedLeave.coverageSalaryCosts).toBeCloseTo(146_458.33, 2)
  })

  it('L: netImpact = −146,458.33', () => {
    expect(MODEL.drivers.plannedLeave.netImpact).toBeCloseTo(-146_458.33, 2)
  })
})

describe('Workbook parity — pay adjustments (Inputs!A22:B26)', () => {
  it('3.4 netImpact = −35,000', () => {
    expect(MODEL.drivers.payAdjustments.netImpact).toBeCloseTo(-35_000, 2)
  })
})

describe('Workbook parity — summary (Inputs!A29:B35)', () => {
  it('4.1 net vacancy impact = 277,500', () => {
    expect(MODEL.summary.netVacancyImpact).toBeCloseTo(277_500, 2)
  })

  it('4.2 net unplanned leave impact = −70,000', () => {
    expect(MODEL.summary.netUnplannedLeaveImpact).toBeCloseTo(-70_000, 2)
  })

  it('4.3 net planned leave impact = −146,458.33', () => {
    expect(MODEL.summary.netPlannedLeaveImpact).toBeCloseTo(-146_458.33, 2)
  })

  it('4.4 net pay adjustment impact = −35,000', () => {
    expect(MODEL.summary.netPayAdjustmentImpact).toBeCloseTo(-35_000, 2)
  })

  it('4.5 ★ NET YEARLY SALARY VARIANCE = 26,041.67', () => {
    expect(MODEL.summary.netYearlySalaryVariance).toBeCloseTo(26_041.67, 2)
  })
})

describe('Workbook parity — forecast monthly spread (Forecast Model!)', () => {
  it('monthly net variance ≈ 2,170.14', () => {
    const { monthly } = MODEL.forecast
    monthly.forEach((row) => expect(row.netMonthlyVariance).toBeCloseTo(2_170.14, 2))
  })

  it('cumulative forecast values Jan–Dec match workbook (rounded to nearest 1)', () => {
    // Workbook: 2,170 / 4,340 / 6,510 / 8,681 / 10,851 / 13,021
    //         / 15,191 / 17,361 / 19,531 / 21,701 / 23,872 / 26,042
    const expected = [2_170, 4_340, 6_510, 8_681, 10_851, 13_021, 15_191, 17_361, 19_531, 21_701, 23_872, 26_042]
    MODEL.forecast.monthly.forEach((row, i) => {
      expect(row.cumulativeForecast).toBeCloseTo(expected[i]!, 0)
    })
  })
})

describe('Workbook parity — actuals monitoring (Actuals -- Monitoring!)', () => {
  const fiscal = DEFAULTS.fiscal
  const noActuals = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    actualSalaryVariance: null,
  }))
  const rows = calcActuals(MODEL.forecast.monthly, fiscal.totalSalaryBudget, noActuals)

  it('budgetedMonthlySpend = 2,166,666.67', () => {
    rows.forEach((r) => expect(r.budgetedMonthlySpend).toBeCloseTo(2_166_666.67, 2))
  })

  it('cumulativeExpectedSpend[12] = 26,000,000 (full budget)', () => {
    expect(rows[11]!.cumulativeExpectedSpend).toBeCloseTo(26_000_000, 2)
  })

  it('QA: sum of forecast variances = net yearly variance', () => {
    const sumForecast = rows.reduce((sum, r) => sum + r.forecastNetVariance, 0)
    expect(sumForecast).toBeCloseTo(26_041.67, 2)
  })
})

export type FiscalContextInputs = {
  totalSalaryBudget: number
  numberOfOfficers: number
  avgAnnualSalary: number
}

export type FiscalContextDerived = {
  avgMonthlySalary: number
  avgMonthlyOvertimeCost: number
}

/**
 * Derives the two computed fiscal values used by all driver calculations.
 *
 * avgMonthlyOvertimeCost is the residual budget (total minus base salaries)
 * divided monthly — a modelling simplification, not a measured OT figure.
 * Locked as derived in V1 (Section 14, decision #3).
 */
export function deriveFiscalContext(inputs: FiscalContextInputs): FiscalContextDerived {
  return {
    avgMonthlySalary: inputs.avgAnnualSalary / 12,
    avgMonthlyOvertimeCost:
      (inputs.totalSalaryBudget - inputs.avgAnnualSalary * inputs.numberOfOfficers) / 12,
  }
}

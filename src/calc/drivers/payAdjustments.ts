export type PayAdjustmentInputs = {
  promotionsActingPayPressure: number
  stepProgressionImpact: number
  other: number
}

export type PayAdjustmentResult = {
  totalPressure: number
  netImpact: number
}

/**
 * Users enter positive cost pressures; the formula negates the sum.
 * Sign convention preserved from workbook (V1 decision #5).
 * Net Impact = −(Promotions + Step Progression + Other)
 */
export function calcPayAdjustments(inputs: PayAdjustmentInputs): PayAdjustmentResult {
  const totalPressure =
    inputs.promotionsActingPayPressure + inputs.stepProgressionImpact + inputs.other
  return {
    totalPressure,
    netImpact: -totalPressure,
  }
}

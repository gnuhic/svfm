import { describe, it, expect } from 'vitest'
import { calcPayAdjustments } from '../drivers/payAdjustments'
import { DEFAULTS } from '../index'

describe('calcPayAdjustments', () => {
  it('totalPressure is the sum of all three positive inputs', () => {
    const result = calcPayAdjustments(DEFAULTS.payAdjustments)
    expect(result.totalPressure).toBe(35_000)
  })

  it('netImpact is the negated total pressure', () => {
    const result = calcPayAdjustments(DEFAULTS.payAdjustments)
    expect(result.netImpact).toBe(-35_000)
  })

  it('golden: net pay adjustment impact = −35,000', () => {
    const result = calcPayAdjustments(DEFAULTS.payAdjustments)
    expect(result.netImpact).toBeCloseTo(-35_000, 2)
  })

  it('positive inputs always produce a negative net impact', () => {
    const result = calcPayAdjustments({ promotionsActingPayPressure: 1, stepProgressionImpact: 1, other: 1 })
    expect(result.netImpact).toBeLessThan(0)
  })

  it('zero inputs produce zero net impact', () => {
    const result = calcPayAdjustments({ promotionsActingPayPressure: 0, stepProgressionImpact: 0, other: 0 })
    expect(result.netImpact).toBeCloseTo(0, 10)
  })
})

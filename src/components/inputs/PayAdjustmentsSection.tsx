import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/state/store'
import { calcPayAdjustments } from '@/calc/drivers/payAdjustments'
import { fmtDollar, fmtVariance, varianceColour } from '@/lib/format'
import {
  SectionCard, InputsPane, PreviewPane,
  InputField, CalcRow, CalcDivider, NetImpactRow, FieldGroup, DriverFormNote,
} from './shared'

const Schema = z.object({
  promotionsActingPayPressure: z
    .number({ invalid_type_error: 'Required' })
    .min(0, 'Must be ≥ 0'),
  stepProgressionImpact: z.number({ invalid_type_error: 'Required' }).min(0, 'Must be ≥ 0'),
  other: z.number({ invalid_type_error: 'Required' }).min(0, 'Must be ≥ 0'),
})
type FormValues = z.infer<typeof Schema>
type SectionDisclosureProps = { collapsed?: boolean; onToggle?: () => void }

function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export function PayAdjustmentsSection({ collapsed, onToggle }: SectionDisclosureProps) {
  const { drivers, updatePayAdjustments } = useAppStore()
  const { payAdjustments } = drivers

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { ...payAdjustments },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = form.watch((data) => {
      const result = Schema.safeParse(data)
      if (result.success) updatePayAdjustments(result.data)
    })
    return () => sub.unsubscribe()
  }, [form, updatePayAdjustments])

  const w = form.watch()
  const result = calcPayAdjustments({
    promotionsActingPayPressure: safeNum(
      w.promotionsActingPayPressure,
      payAdjustments.promotionsActingPayPressure,
    ),
    stepProgressionImpact: safeNum(w.stepProgressionImpact, payAdjustments.stepProgressionImpact),
    other: safeNum(w.other, payAdjustments.other),
  })

  const { errors } = form.formState

  return (
    <SectionCard
      title="Pay Adjustments"
      description="In-year salary pressures not captured in the vacancy or leave drivers."
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <InputsPane>
        <FieldGroup>
          <InputField
            id="pa-promotions"
            label="Promotions / acting pay pressure"
            unit="($)"
            step="500"
            min="0"
            {...form.register('promotionsActingPayPressure', { valueAsNumber: true })}
            error={errors.promotionsActingPayPressure?.message}
          />
          <InputField
            id="pa-stepProgression"
            label="Step progression timing impact"
            unit="($)"
            step="500"
            min="0"
            {...form.register('stepProgressionImpact', { valueAsNumber: true })}
            error={errors.stepProgressionImpact?.message}
          />
          <InputField
            id="pa-other"
            label="Other pay adjustments"
            unit="($)"
            step="500"
            min="0"
            {...form.register('other', { valueAsNumber: true })}
            error={errors.other?.message}
          />
        </FieldGroup>
        <DriverFormNote>
          Enter each amount as a positive cost pressure. The model negates the total to express
          the unfavourable variance — a $20,000 acting-pay entry produces a −$20,000 impact on the
          net surplus.
        </DriverFormNote>
      </InputsPane>

      <PreviewPane>
        <CalcRow
          label="Promotions / acting pay"
          value={fmtDollar(
            safeNum(w.promotionsActingPayPressure, payAdjustments.promotionsActingPayPressure),
          )}
        />
        <CalcRow
          label="Step progression"
          value={fmtDollar(safeNum(w.stepProgressionImpact, payAdjustments.stepProgressionImpact))}
        />
        <CalcRow
          label="Other"
          value={fmtDollar(safeNum(w.other, payAdjustments.other))}
        />
        <CalcRow label="Total pressure" value={fmtDollar(result.totalPressure)} />
        <CalcDivider />
        <NetImpactRow
          label="Net pay adjustment impact"
          value={fmtVariance(result.netImpact)}
          colourClass={varianceColour(result.netImpact)}
        />
      </PreviewPane>
    </SectionCard>
  )
}

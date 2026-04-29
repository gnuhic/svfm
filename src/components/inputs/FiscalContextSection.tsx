import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/state/store'
import { deriveFiscalContext } from '@/calc/fiscalContext'
import { fmtDollar, fmtInteger } from '@/lib/format'
import {
  SectionCard, InputsPane, PreviewPane,
  InputField, CalcRow, FieldGroup,
} from './shared'

const Schema = z.object({
  totalSalaryBudget: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  numberOfOfficers: z
    .number({ invalid_type_error: 'Required' })
    .int('Must be a whole number')
    .positive('Must be positive'),
  avgAnnualSalary: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  overtimeRateMultiplier: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
})
type FormValues = z.infer<typeof Schema>
type SectionDisclosureProps = { collapsed?: boolean; onToggle?: () => void }

function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export function FiscalContextSection({ collapsed, onToggle }: SectionDisclosureProps) {
  const { assumptions, updateAssumptions } = useAppStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { ...assumptions },
    mode: 'onChange',
  })

  // Persist valid changes to the store as the user types.
  useEffect(() => {
    const sub = form.watch((data) => {
      const result = Schema.safeParse(data)
      if (result.success) updateAssumptions(result.data)
    })
    return () => sub.unsubscribe()
  }, [form, updateAssumptions])

  // Live preview uses watched values; falls back to store values while invalid.
  const w = form.watch()
  const liveInputs = {
    totalSalaryBudget: safeNum(w.totalSalaryBudget, assumptions.totalSalaryBudget),
    numberOfOfficers: safeNum(w.numberOfOfficers, assumptions.numberOfOfficers),
    avgAnnualSalary: safeNum(w.avgAnnualSalary, assumptions.avgAnnualSalary),
    overtimeRateMultiplier: safeNum(w.overtimeRateMultiplier, assumptions.overtimeRateMultiplier),
  }
  const derived = deriveFiscalContext(liveInputs)
  const totalMonthlySalaryExpenditure =
    (liveInputs.numberOfOfficers * liveInputs.avgAnnualSalary) / 12

  const { errors } = form.formState

  return (
    <SectionCard
      title="Fiscal Context"
      description="Global assumptions that feed all four driver calculations."
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <InputsPane>
        <FieldGroup>
          <InputField
            id="totalSalaryBudget"
            label="Total salary budget"
            unit="($)"
            step="1000"
            min="0"
            {...form.register('totalSalaryBudget', { valueAsNumber: true })}
            error={errors.totalSalaryBudget?.message}
          />
          <InputField
            id="numberOfOfficers"
            label="Number of officers"
            unit="(headcount)"
            step="1"
            min="1"
            {...form.register('numberOfOfficers', { valueAsNumber: true })}
            error={errors.numberOfOfficers?.message}
          />
          <InputField
            id="avgAnnualSalary"
            label="Average annual salary per position"
            unit="($ — loaded with benefits)"
            step="1000"
            min="0"
            {...form.register('avgAnnualSalary', { valueAsNumber: true })}
            error={errors.avgAnnualSalary?.message}
          />
          <InputField
            id="overtimeRateMultiplier"
            label="Overtime rate multiplier"
            unit="(elevated rate paid for OT, if applicable)"
            step="0.1"
            min="0"
            {...form.register('overtimeRateMultiplier', { valueAsNumber: true })}
            error={errors.overtimeRateMultiplier?.message}
          />
        </FieldGroup>
      </InputsPane>

      <PreviewPane>
        <CalcRow
          label="Total monthly salary expenditure"
          value={fmtDollar(totalMonthlySalaryExpenditure)}
        />
        <CalcRow
          label="Average monthly salary variance based on total salary budget"
          value={fmtDollar(derived.avgMonthlyOvertimeCost)}
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Officers used in driver rows:{' '}
          <span className="font-semibold text-zinc-500">
            {fmtInteger(liveInputs.numberOfOfficers)}
          </span>
        </p>
      </PreviewPane>
    </SectionCard>
  )
}

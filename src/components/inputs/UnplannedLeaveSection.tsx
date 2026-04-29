import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/state/store'
import { deriveFiscalContext } from '@/calc/fiscalContext'
import { calcUnplannedLeave } from '@/calc/drivers/unplannedLeave'
import { fmtDollar, fmtDecimal, fmtVariance, varianceColour } from '@/lib/format'
import {
  SectionCard, InputsPane, PreviewPane,
  InputField, ReadOnlyField, CalcRow, CalcDivider, NetImpactRow, FieldGroup, DriverFormNote,
} from './shared'

const Schema = z.object({
  officersOnLeave: z
    .number({ invalid_type_error: 'Required' })
    .int('Must be a whole number')
    .min(0, 'Must be ≥ 0'),
  durationMonths: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  backfillPct: z
    .number({ invalid_type_error: 'Required' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
})
type FormValues = z.infer<typeof Schema>
type SectionDisclosureProps = { collapsed?: boolean; onToggle?: () => void }

function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export function UnplannedLeaveSection({ collapsed, onToggle }: SectionDisclosureProps) {
  const { assumptions, drivers, updateUnplannedLeave } = useAppStore()
  const { unplannedLeave } = drivers

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      officersOnLeave: unplannedLeave.officersOnLeave,
      durationMonths: unplannedLeave.durationMonths,
      backfillPct: unplannedLeave.backfillRate * 100,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = form.watch((data) => {
      const result = Schema.safeParse(data)
      if (result.success) {
        updateUnplannedLeave({
          officersOnLeave: result.data.officersOnLeave,
          durationMonths: result.data.durationMonths,
          backfillRate: result.data.backfillPct / 100,
        })
      }
    })
    return () => sub.unsubscribe()
  }, [form, updateUnplannedLeave])

  const w = form.watch()
  const derived = deriveFiscalContext(assumptions)
  const result = calcUnplannedLeave(
    {
      officersOnLeave: safeNum(w.officersOnLeave, unplannedLeave.officersOnLeave),
      durationMonths: safeNum(w.durationMonths, unplannedLeave.durationMonths),
      backfillRate: safeNum(w.backfillPct, unplannedLeave.backfillRate * 100) / 100,
    },
    derived,
  )

  const { errors } = form.formState

  return (
    <SectionCard
      title="Unplanned Leave"
      description="Disability, unpaid leave, and secondments. Salary avoidance is locked at $0 because pay often continues or is recovered."
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <InputsPane>
        <FieldGroup>
          <InputField
            id="ul-officersOnLeave"
            label="Officers on unplanned leave"
            unit="(average count at any time)"
            step="1"
            min="0"
            {...form.register('officersOnLeave', { valueAsNumber: true })}
            error={errors.officersOnLeave?.message}
          />
          <InputField
            id="ul-durationMonths"
            label="Average absence duration"
            unit="(months)"
            step="0.5"
            min="0"
            {...form.register('durationMonths', { valueAsNumber: true })}
            error={errors.durationMonths?.message}
          />
          <InputField
            id="ul-backfillPct"
            label="Overtime backfill rate"
            unit="(% of absences requiring OT coverage)"
            step="1"
            min="0"
            max="100"
            {...form.register('backfillPct', { valueAsNumber: true })}
            error={errors.backfillPct?.message}
          />
          <ReadOnlyField
            label="Salary avoidance"
            value="$0"
            note="locked — salary typically continues during unplanned leave"
          />
        </FieldGroup>
        <DriverFormNote>
          Unlike vacancies, unplanned leave usually does not generate salary avoidance because the
          employee continues to receive pay. The model therefore counts only the overtime backfill
          cost.
        </DriverFormNote>
      </InputsPane>

      <PreviewPane>
        <CalcRow label="Avg affected positions" value={fmtDecimal(result.avgVacantPositions)} />
        <CalcRow label="Position months" value={fmtDecimal(result.positionMonths)} />
        <CalcRow label="Salary avoidance" value="$0.00" muted />
        <CalcRow label="OT backfill cost" value={fmtDollar(result.coverageSalaryCosts)} />
        <CalcDivider />
        <NetImpactRow
          label="Net leave impact"
          value={fmtVariance(result.netImpact)}
          colourClass={varianceColour(result.netImpact)}
        />
      </PreviewPane>
    </SectionCard>
  )
}

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/state/store'
import { deriveFiscalContext } from '@/calc/fiscalContext'
import { calcPlannedLeave } from '@/calc/drivers/plannedLeave'
import { fmtDollar, fmtDecimal, fmtInteger, fmtVariance, varianceColour } from '@/lib/format'
import {
  SectionCard, InputsPane, PreviewPane,
  InputField, ReadOnlyField, CalcRow, CalcDivider, NetImpactRow, FieldGroup, DriverFormNote,
} from './shared'

const Schema = z.object({
  durationMonthsPerOfficer: z
    .number({ invalid_type_error: 'Required' })
    .positive('Must be positive'),
  backfillPct: z
    .number({ invalid_type_error: 'Required' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
})
type FormValues = z.infer<typeof Schema>

function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback
}

export function PlannedLeaveSection() {
  const { assumptions, drivers, updatePlannedLeave } = useAppStore()
  const { plannedLeave } = drivers

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      durationMonthsPerOfficer: plannedLeave.durationMonthsPerOfficer,
      backfillPct: plannedLeave.backfillRate * 100,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = form.watch((data) => {
      const result = Schema.safeParse(data)
      if (result.success) {
        updatePlannedLeave({
          durationMonthsPerOfficer: result.data.durationMonthsPerOfficer,
          backfillRate: result.data.backfillPct / 100,
        })
      }
    })
    return () => sub.unsubscribe()
  }, [form, updatePlannedLeave])

  const w = form.watch()
  const derived = deriveFiscalContext(assumptions)
  const result = calcPlannedLeave(
    {
      durationMonthsPerOfficer: safeNum(
        w.durationMonthsPerOfficer,
        plannedLeave.durationMonthsPerOfficer,
      ),
      backfillRate: safeNum(w.backfillPct, plannedLeave.backfillRate * 100) / 100,
    },
    { ...derived, numberOfOfficers: assumptions.numberOfOfficers },
  )

  const { errors } = form.formState

  return (
    <SectionCard
      title="Planned Leave"
      description="Vacation, training, scheduled leave, and statutory holidays. Officers affected is fixed to total headcount."
    >
      <InputsPane>
        <FieldGroup>
          <ReadOnlyField
            label="Officers affected"
            value={fmtInteger(assumptions.numberOfOfficers)}
            note="locked — all officers are subject to planned leave"
          />
          <InputField
            id="pl-durationMonthsPerOfficer"
            label="Average planned leave per officer"
            unit="(months per year)"
            step="0.1"
            min="0"
            {...form.register('durationMonthsPerOfficer', { valueAsNumber: true })}
            error={errors.durationMonthsPerOfficer?.message}
          />
          <InputField
            id="pl-backfillPct"
            label="Overtime backfill rate"
            unit="(% of leave requiring OT coverage)"
            step="1"
            min="0"
            max="100"
            {...form.register('backfillPct', { valueAsNumber: true })}
            error={errors.backfillPct?.message}
          />
          <ReadOnlyField
            label="Salary avoidance"
            value="$0"
            note="locked — salary is paid throughout planned leave"
          />
        </FieldGroup>
        <DriverFormNote>
          Officers affected is locked to total headcount. The avg FTE-equivalent vacant positions
          (column H) is calculated as Officers × Duration ÷ 12, which differs from the vacancy and
          unplanned leave drivers.
        </DriverFormNote>
      </InputsPane>

      <PreviewPane>
        <CalcRow
          label="Officers affected"
          value={fmtInteger(result.officersAffected)}
          muted
        />
        <CalcRow
          label="Avg FTE-equivalent positions"
          value={fmtDecimal(result.avgVacantPositions)}
        />
        <CalcRow label="Position months" value={fmtDecimal(result.positionMonths)} />
        <CalcRow label="Salary avoidance" value="$0.00" muted />
        <CalcRow label="OT backfill cost" value={fmtDollar(result.coverageSalaryCosts)} />
        <CalcDivider />
        <NetImpactRow
          label="Net planned leave impact"
          value={fmtVariance(result.netImpact)}
          colourClass={varianceColour(result.netImpact)}
        />
      </PreviewPane>
    </SectionCard>
  )
}

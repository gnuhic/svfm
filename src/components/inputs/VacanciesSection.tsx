import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/state/store'
import { deriveFiscalContext } from '@/calc/fiscalContext'
import { calcVacancy } from '@/calc/drivers/vacancy'
import { fmtDollar, fmtDecimal, fmtVariance, varianceColour } from '@/lib/format'
import {
  SectionCard, InputsPane, PreviewPane,
  InputField, CalcRow, CalcDivider, NetImpactRow, FieldGroup,
} from './shared'

// Form uses percentages (0–100). Store and calc engine use decimals (0–1).
const Schema = z.object({
  frequencyPct: z
    .number({ invalid_type_error: 'Required' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
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

export function VacanciesSection({ collapsed, onToggle }: SectionDisclosureProps) {
  const { assumptions, drivers, updateVacancies } = useAppStore()
  const { vacancies } = drivers

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      frequencyPct: vacancies.frequencyPercent * 100,
      durationMonths: vacancies.durationMonths,
      backfillPct: vacancies.backfillRate * 100,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = form.watch((data) => {
      const result = Schema.safeParse(data)
      if (result.success) {
        updateVacancies({
          frequencyPercent: result.data.frequencyPct / 100,
          durationMonths: result.data.durationMonths,
          backfillRate: result.data.backfillPct / 100,
        })
      }
    })
    return () => sub.unsubscribe()
  }, [form, updateVacancies])

  const w = form.watch()
  const derived = deriveFiscalContext(assumptions)
  const result = calcVacancy(
    {
      frequencyPercent: safeNum(w.frequencyPct, vacancies.frequencyPercent * 100) / 100,
      durationMonths: safeNum(w.durationMonths, vacancies.durationMonths),
      backfillRate: safeNum(w.backfillPct, vacancies.backfillRate * 100) / 100,
    },
    { ...derived, numberOfOfficers: assumptions.numberOfOfficers },
  )

  const { errors } = form.formState

  return (
    <SectionCard
      title="Vacancies"
      description="Positions left unfilled during the recruitment lag — a source of salary avoidance offset by overtime backfill costs."
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <InputsPane>
        <FieldGroup>
          <InputField
            id="vac-frequencyPct"
            label="Vacancy rate"
            unit="(% of officer headcount)"
            step="0.1"
            min="0"
            max="100"
            {...form.register('frequencyPct', { valueAsNumber: true })}
            error={errors.frequencyPct?.message}
          />
          <InputField
            id="vac-durationMonths"
            label="Average vacancy duration"
            unit="(months)"
            step="0.5"
            min="0"
            {...form.register('durationMonths', { valueAsNumber: true })}
            error={errors.durationMonths?.message}
          />
          <InputField
            id="vac-backfillPct"
            label="Overtime backfill rate"
            unit="(% of vacant positions covered by OT)"
            step="1"
            min="0"
            max="100"
            {...form.register('backfillPct', { valueAsNumber: true })}
            error={errors.backfillPct?.message}
          />
        </FieldGroup>
      </InputsPane>

      <PreviewPane>
        <CalcRow label="Avg vacant positions" value={fmtDecimal(result.avgVacantPositions)} />
        <CalcRow label="Position months" value={fmtDecimal(result.positionMonths)} />
        <CalcRow label="Salary avoidance" value={fmtDollar(result.salaryAvoidance)} />
        <CalcRow label="OT backfill cost" value={fmtDollar(result.coverageSalaryCosts)} />
        <CalcDivider />
        <NetImpactRow
          label="Net vacancy impact"
          value={fmtVariance(result.netImpact)}
          colourClass={varianceColour(result.netImpact)}
        />
      </PreviewPane>
    </SectionCard>
  )
}

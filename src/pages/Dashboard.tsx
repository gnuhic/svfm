import { useMemo, type ReactNode } from 'react'
import { useAppStore } from '@/state/store'
import { selectModelResults } from '@/state/selectors'
import type { AppData } from '@/state/types'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { DriverCard } from '@/components/dashboard/DriverCard'
import { YtdVarianceCard } from '@/components/dashboard/YtdVarianceCard'
import { MonthlyVarianceValueCard } from '@/components/dashboard/MonthlyVarianceValueCard'
import { CumulativeForecastChart } from '@/components/dashboard/CumulativeForecastChart'
import { fmtDollar, fmtDecimal, fmtInteger, fmtPct, fmtVariance } from '@/lib/format'
import { monthAbbr } from '@/lib/monthLabels'

function TipBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="mt-1 space-y-0.5 text-zinc-300">{children}</div>
    </div>
  )
}

function TipLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-left">
      <span className="text-zinc-400">{label}</span>
      <span className="shrink-0 text-right tabular-nums text-zinc-200">{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const version = useAppStore((s) => s.version)
  const serviceName = useAppStore((s) => s.serviceName)
  const fiscalYear = useAppStore((s) => s.fiscalYear)
  const assumptions = useAppStore((s) => s.assumptions)
  const drivers = useAppStore((s) => s.drivers)
  const actuals = useAppStore((s) => s.actuals)

  const appData: AppData = useMemo(
    () => ({ version, serviceName, fiscalYear, assumptions, drivers, actuals }),
    [version, serviceName, fiscalYear, assumptions, drivers, actuals],
  )

  const model = useMemo(() => selectModelResults(appData), [appData])
  const { fiscalDerived, drivers: d, summary, forecast } = model
  const { vacancies, unplannedLeave, plannedLeave, payAdjustments } = drivers
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat('en-CA', { month: 'long' }), [])
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const latestCompleteMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const latestCompleteYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const throughLabel = `${monthFormatter.format(new Date(latestCompleteYear, latestCompleteMonth - 1, 1))} ${latestCompleteYear}`
  const currentMonthLabel = monthFormatter.format(new Date(currentYear, currentMonth - 1, 1))
  const ytdBreakdown = useMemo(() => {
    const actualByMonth = new Map(actuals.map((entry) => [entry.month, entry.actualSalaryVariance]))

    return Array.from({ length: latestCompleteMonth }, (_, idx) => {
      const month = idx + 1
      const actualVariance = actualByMonth.get(month)
      const forecastVariance = forecast.monthly[month - 1]?.netMonthlyVariance ?? 0
      const value = actualVariance ?? forecastVariance
      return {
        monthLabel: monthAbbr(month),
        source: actualVariance === null ? ('Forecast' as const) : ('Actual' as const),
        value,
      }
    })
  }, [actuals, forecast.monthly, latestCompleteMonth])
  const ytdVariance = useMemo(() => {
    return ytdBreakdown.reduce((sum, line) => sum + line.value, 0)
  }, [ytdBreakdown])

  const vacancyTip = (
    <div className="space-y-3">
      <TipBlock title="Inputs">
        <TipLine label="Vacancy rate" value={fmtPct(vacancies.frequencyPercent * 100)} />
        <TipLine label="Officer count" value={fmtInteger(assumptions.numberOfOfficers)} />
        <TipLine label="Duration" value={`${fmtDecimal(vacancies.durationMonths)} mo`} />
        <TipLine label="Backfill (OT)" value={fmtPct(vacancies.backfillRate * 100)} />
      </TipBlock>
      <TipBlock title="Derived fiscal">
        <TipLine label="Avg monthly salary" value={fmtDollar(fiscalDerived.avgMonthlySalary)} />
        <TipLine
          label="Average monthly salary variance based on total salary budget"
          value={fmtDollar(fiscalDerived.avgMonthlyOvertimeCost)}
        />
      </TipBlock>
      <TipBlock title="Calculations">
        <TipLine label="Avg vacant positions" value={fmtDecimal(d.vacancy.avgVacantPositions)} />
        <TipLine label="Position-months" value={fmtDecimal(d.vacancy.positionMonths)} />
        <TipLine label="Salary avoidance" value={fmtDollar(d.vacancy.salaryAvoidance)} />
        <TipLine label="Coverage salary costs" value={fmtDollar(d.vacancy.coverageSalaryCosts)} />
        <TipLine label="Net" value={fmtVariance(d.vacancy.netImpact)} />
      </TipBlock>
      <p className="text-[10px] leading-snug text-zinc-500">
        Net = salary avoidance − coverage. Position-months = avg vacant positions × duration.
      </p>
    </div>
  )

  const unplannedTip = (
    <div className="space-y-3">
      <TipBlock title="Inputs">
        <TipLine label="Officers on leave" value={fmtInteger(unplannedLeave.officersOnLeave)} />
        <TipLine label="Duration" value={`${fmtDecimal(unplannedLeave.durationMonths)} mo`} />
        <TipLine label="Backfill (OT)" value={fmtPct(unplannedLeave.backfillRate * 100)} />
      </TipBlock>
      <TipBlock title="Model basis">
        <TipLine label="Salary avoidance" value={fmtDollar(0)} />
        <TipLine
          label="Average monthly salary variance based on total salary budget"
          value={fmtDollar(fiscalDerived.avgMonthlyOvertimeCost)}
        />
      </TipBlock>
      <TipBlock title="Calculations">
        <TipLine label="Avg vacant positions" value={fmtDecimal(d.unplannedLeave.avgVacantPositions)} />
        <TipLine label="Position-months" value={fmtDecimal(d.unplannedLeave.positionMonths)} />
        <TipLine label="Coverage salary costs" value={fmtDollar(d.unplannedLeave.coverageSalaryCosts)} />
        <TipLine label="Net" value={fmtVariance(d.unplannedLeave.netImpact)} />
      </TipBlock>
      <p className="text-[10px] leading-snug text-zinc-500">
        Avoidance locked at $0 (V1). Net = 0 − coverage. Avg vacant positions equals headcount on
        leave.
      </p>
    </div>
  )

  const plannedTip = (
    <div className="space-y-3">
      <TipBlock title="Inputs">
        <TipLine label="Officers affected" value={fmtInteger(d.plannedLeave.officersAffected)} />
        <TipLine label="Duration per officer" value={`${fmtDecimal(plannedLeave.durationMonthsPerOfficer)} mo`} />
        <TipLine label="Backfill (OT)" value={fmtPct(plannedLeave.backfillRate * 100)} />
      </TipBlock>
      <TipBlock title="Calculations">
        <TipLine
          label="Avg vacant positions (FTE)"
          value={fmtDecimal(d.plannedLeave.avgVacantPositions)}
        />
        <TipLine label="Position-months" value={fmtDecimal(d.plannedLeave.positionMonths)} />
        <TipLine label="Salary avoidance" value={fmtDollar(0)} />
        <TipLine label="Coverage salary costs" value={fmtDollar(d.plannedLeave.coverageSalaryCosts)} />
        <TipLine label="Net" value={fmtVariance(d.plannedLeave.netImpact)} />
      </TipBlock>
      <p className="text-[10px] leading-snug text-zinc-500">
        Officers affected = total sworn count (V1). Avg vacant positions = (officers × duration) ÷
        12. Position-months = officers × duration (workbook row 19).
      </p>
    </div>
  )

  const payTip = (
    <div className="space-y-3">
      <TipBlock title="Cost pressures (entered positive)">
        <TipLine label="Promotions / acting" value={fmtDollar(payAdjustments.promotionsActingPayPressure)} />
        <TipLine label="Step progression" value={fmtDollar(payAdjustments.stepProgressionImpact)} />
        <TipLine label="Other" value={fmtDollar(payAdjustments.other)} />
      </TipBlock>
      <TipBlock title="Result">
        <TipLine label="Total pressure" value={fmtDollar(d.payAdjustments.totalPressure)} />
        <TipLine label="Net impact" value={fmtVariance(d.payAdjustments.netImpact)} />
      </TipBlock>
      <p className="text-[10px] leading-snug text-zinc-500">
        Net = −sum(pressures). Negative net reflects unfavourable variance vs budget.
      </p>
    </div>
  )

  return (
    <div className="space-y-8 p-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Forecast summary</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Full-year salary variance by driver and flat monthly allocation. Positive totals indicate
          projected surplus relative to the salary budget; negative totals indicate pressure.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Fiscal year {fiscalYear}. Hover underlined figures for inputs and intermediate calculations.
        </p>
      </header>

      {!serviceName.trim() && (
        <p
          role="status"
          className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800"
        >
          Police service name is not set. Enter it in the header (or under Settings) so exports and
          printed materials identify the organization.
        </p>
      )}

      <section aria-labelledby="dash-variance-heading">
        <h2 id="dash-variance-heading" className="sr-only">
          Net variance and driver breakdown
        </h2>
        <p className="text-base font-semibold text-zinc-700">Current month: {currentMonthLabel}</p>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-4">
            <YtdVarianceCard
              ytdVariance={ytdVariance}
              throughLabel={throughLabel}
              breakdown={ytdBreakdown}
            />
            <SummaryCard summary={summary} />
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <DriverCard
              title="Vacancies"
              description="Hiring lag and overtime backfill on vacant positions."
              netImpact={d.vacancy.netImpact}
              tooltip={vacancyTip}
            />
            <DriverCard
              title="Unplanned leave"
              description="Disability, unpaid leave, secondments — coverage costs."
              netImpact={d.unplannedLeave.netImpact}
              tooltip={unplannedTip}
            />
            <DriverCard
              title="Planned leave"
              description="Scheduled leave and training — partial OT coverage."
              netImpact={d.plannedLeave.netImpact}
              tooltip={plannedTip}
            />
            <DriverCard
              title="Pay adjustments"
              description="Promotions, acting pay, step progression, and other pressures."
              netImpact={d.payAdjustments.netImpact}
              tooltip={payTip}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="dash-charts-heading" className="space-y-4">
        <h2 id="dash-charts-heading" className="text-sm font-semibold text-zinc-800">
          Monthly forecast
        </h2>
        <p className="text-xs text-zinc-500">
          V1 uses an even spread across twelve months (no seasonality weighting).
        </p>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <MonthlyVarianceValueCard data={forecast.monthly} />
          <CumulativeForecastChart data={forecast.monthly} />
        </div>
      </section>
    </div>
  )
}

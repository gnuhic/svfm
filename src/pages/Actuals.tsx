import { useMemo } from 'react'
import { useAppStore } from '@/state/store'
import { selectActualsRows, selectModelResults } from '@/state/selectors'
import type { AppData } from '@/state/types'
import { ActualsMonthlyTable } from '@/components/actuals/ActualsMonthlyTable'
import { CumulativeSpendChart } from '@/components/actuals/CumulativeSpendChart'
import { ActualsQaRow } from '@/components/actuals/ActualsQaRow'

export default function Actuals() {
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

  const rows = useMemo(() => selectActualsRows(appData), [appData])
  const netYearly = useMemo(() => selectModelResults(appData).summary.netYearlySalaryVariance, [appData])
  const hasAnyActual = useMemo(
    () => actuals.some((a) => a.actualSalaryVariance !== null),
    [actuals],
  )

  return (
    <div className="space-y-8 p-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Actuals</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Enter monthly actual salary variance to compare realized spend against the budget baseline
          and the forecast path. Figures follow the workbook “Actuals — Monitoring” layout for
          fiscal year {fiscalYear}.
        </p>
      </header>

      <section aria-labelledby="actuals-chart-heading" className="space-y-3">
        <h2 id="actuals-chart-heading" className="sr-only">
          Cumulative spend trajectories
        </h2>
        {!hasAnyActual && (
          <p
            role="status"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-600"
          >
            No monthly actual variances are entered yet. The actual cumulative spend line will
            appear once values are provided from January forward without gaps (per workbook logic).
          </p>
        )}
        <CumulativeSpendChart rows={rows} />
      </section>

      <section aria-labelledby="actuals-grid-heading" className="space-y-3">
        <h2 id="actuals-grid-heading" className="sr-only">
          Monthly variance grid
        </h2>
        <ActualsMonthlyTable rows={rows} />
      </section>

      <section aria-labelledby="actuals-qa-heading">
        <h2 id="actuals-qa-heading" className="sr-only">
          Quality checks
        </h2>
        <ActualsQaRow rows={rows} netYearlyForecastVariance={netYearly} />
      </section>
    </div>
  )
}

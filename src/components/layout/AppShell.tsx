import { useState } from 'react'
import NavTabs from './NavTabs'
import type { Page } from '@/types/app'
import Dashboard from '@/pages/Dashboard'
import Inputs from '@/pages/Inputs'
import Actuals from '@/pages/Actuals'
import Settings from '@/pages/Settings'
import { useAppStore } from '@/state/store'

const PAGE_COMPONENTS: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  inputs: Inputs,
  actuals: Actuals,
  settings: Settings,
}

export default function AppShell() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const ActivePage = PAGE_COMPONENTS[activePage]

  const serviceName = useAppStore((s) => s.serviceName)
  const setServiceName = useAppStore((s) => s.setServiceName)
  const fiscalYear = useAppStore((s) => s.fiscalYear)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Salary Variance Forecast Model
            </p>
            <p className="mt-1 text-xs tabular-nums text-zinc-500">Calendar fiscal year {fiscalYear}</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[14rem] sm:max-w-md sm:text-right">
            <label htmlFor="header-service-name" className="text-xs text-zinc-500">
              Police service
            </label>
            <input
              id="header-service-name"
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Enter service name"
              autoComplete="organization"
              className="mt-0.5 w-full rounded border border-zinc-600 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
      </header>

      <NavTabs active={activePage} onChange={setActivePage} />

      <main className="flex-1 bg-zinc-50" role="tabpanel">
        <div className="mx-auto max-w-7xl">
          <ActivePage />
        </div>
      </main>
    </div>
  )
}

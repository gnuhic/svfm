import { useState } from 'react'
import NavTabs from './NavTabs'
import type { Page } from '@/types/app'
import Dashboard from '@/pages/Dashboard'
import Inputs from '@/pages/Inputs'
import Actuals from '@/pages/Actuals'
import Settings from '@/pages/Settings'

const PAGE_COMPONENTS: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  inputs: Inputs,
  actuals: Actuals,
  settings: Settings,
}

export default function AppShell() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const ActivePage = PAGE_COMPONENTS[activePage]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              Salary Variance Forecast Model
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Service</p>
            <p className="text-sm font-medium text-zinc-200">Configure in Settings</p>
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

import { cn } from '@/lib/utils'
import type { Page } from '@/types/app'

const TABS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'actuals', label: 'Actuals' },
  { id: 'settings', label: 'Settings' },
]

interface NavTabsProps {
  active: Page
  onChange: (page: Page) => void
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="border-b border-zinc-200 bg-white print:hidden">
      <div className="mx-auto max-w-7xl px-6">
        <ul className="flex gap-0" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.id} role="presentation">
              <button
                role="tab"
                aria-selected={active === tab.id}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'px-5 py-3 text-sm font-medium tracking-wide transition-colors',
                  'border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1',
                  active === tab.id
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
                )}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  collapsed?: boolean
  onToggle?: () => void
}

export function SectionCard({
  title,
  description,
  children,
  collapsed = false,
  onToggle,
}: SectionCardProps) {
  const isCollapsible = typeof onToggle === 'function'

  return (
    <section className="overflow-hidden rounded border border-zinc-200 bg-white">
      {isCollapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex w-full items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-6 py-3.5 text-left"
        >
          <span>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-700">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </span>
          <span className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {collapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
      ) : (
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-700">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
      )}
      {!collapsed && <div className="flex divide-x divide-zinc-200">{children}</div>}
    </section>
  )
}

// ── InputsPane / PreviewPane ──────────────────────────────────────────────────

export function InputsPane({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 flex-1 p-6">{children}</div>
}

export function PreviewPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-72 shrink-0 bg-zinc-50 p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Calculated
      </p>
      {children}
    </div>
  )
}

// ── InputField ────────────────────────────────────────────────────────────────

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  unit?: string
  hint?: string
  error?: string
  id: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, unit, hint, error, id, className, ...rest }, ref) => (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-baseline gap-1.5 text-xs font-medium text-zinc-600">
        {label}
        {unit && <span className="font-normal text-zinc-400">{unit}</span>}
      </label>
      <input
        id={id}
        ref={ref}
        type="number"
        onWheel={(e) => e.currentTarget.blur()}
        className={cn(
          'w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900',
          'focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-0',
          'placeholder:text-zinc-400',
          error && 'border-red-400 focus:ring-red-500',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  ),
)
InputField.displayName = 'InputField'

// ── ReadOnlyField ─────────────────────────────────────────────────────────────

interface ReadOnlyFieldProps {
  label: string
  value: string
  note: string
}

export function ReadOnlyField({ label, value, note }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-600">{label}</p>
      <div className="flex items-center gap-2 rounded border border-zinc-200 bg-zinc-100 px-3 py-2">
        <span className="text-sm font-medium text-zinc-500">{value}</span>
        <span className="text-zinc-300">·</span>
        <span className="text-xs text-zinc-400 italic">{note}</span>
      </div>
    </div>
  )
}

// ── CalcRow ───────────────────────────────────────────────────────────────────

interface CalcRowProps {
  label: string
  value: string
  muted?: boolean
}

export function CalcRow({ label, value, muted = false }: CalcRowProps) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={cn('text-xs', muted ? 'text-zinc-400' : 'text-zinc-500')}>{label}</span>
      <span
        className={cn(
          'font-mono text-sm tabular-nums',
          muted ? 'text-zinc-400' : 'text-zinc-800',
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── CalcDivider ───────────────────────────────────────────────────────────────

export function CalcDivider() {
  return <hr className="my-2 border-zinc-200" />
}

// ── NetImpactRow ──────────────────────────────────────────────────────────────

interface NetImpactRowProps {
  label: string
  value: string
  colourClass: string
}

export function NetImpactRow({ label, value, colourClass }: NetImpactRowProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{label}</span>
      <span className={cn('font-mono text-base font-semibold tabular-nums', colourClass)}>
        {value}
      </span>
    </div>
  )
}

// ── FieldGroup ────────────────────────────────────────────────────────────────

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

// ── DriverFormNote ────────────────────────────────────────────────────────────

export function DriverFormNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
      {children}
    </p>
  )
}

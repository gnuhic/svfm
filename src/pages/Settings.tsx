import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEventHandler,
  type FocusEventHandler,
} from 'react'
import { toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { useAppStore } from '@/state/store'
import { SCHEMA_VERSION } from '@/state/types'
import Dashboard from '@/pages/Dashboard'
import { cn } from '@/lib/utils'

function downloadJson(filename: string, payload: string) {
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slugForFilename(name: string): string {
  const t = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return t.length > 0 ? t : 'configuration'
}

export default function Settings() {
  const fileInputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)

  const serviceName = useAppStore((s) => s.serviceName)
  const setServiceName = useAppStore((s) => s.setServiceName)
  const fiscalYear = useAppStore((s) => s.fiscalYear)
  const setFiscalYear = useAppStore((s) => s.setFiscalYear)
  const exportToJSON = useAppStore((s) => s.exportToJSON)
  const loadFromJSON = useAppStore((s) => s.loadFromJSON)
  const resetToDefaults = useAppStore((s) => s.resetToDefaults)

  const [importMessage, setImportMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportMessage, setReportMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [showReportSurface, setShowReportSurface] = useState(false)

  const dashboardReportRef = useRef<HTMLDivElement>(null)

  const clearImportMessage = useCallback(() => setImportMessage(null), [])
  const clearReportMessage = useCallback(() => setReportMessage(null), [])

  const handleExport = () => {
    clearImportMessage()
    const data = exportToJSON()
    const body = JSON.stringify(data, null, 2)
    const stamp = new Date().toISOString().slice(0, 10)
    const name = `svfm-${slugForFilename(serviceName)}-${data.fiscalYear}-${stamp}.json`
    downloadJson(name, body)
  }

  const handlePickImportFile = () => {
    clearImportMessage()
    fileRef.current?.click()
  }

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    clearImportMessage()
    void (async () => {
      try {
        const text = await file.text()
        const parsed: unknown = JSON.parse(text)
        const result = loadFromJSON(parsed)
        if (result.success) {
          setImportMessage({
            kind: 'success',
            text: 'Configuration loaded. All pages now reflect the imported file.',
          })
        } else {
          setImportMessage({ kind: 'error', text: result.error })
        }
      } catch {
        setImportMessage({
          kind: 'error',
          text: 'Could not read that file. Use a UTF-8 JSON file exported from this application.',
        })
      }
    })()
  }

  const handleReset = () => {
    clearImportMessage()
    const ok = window.confirm(
      'Reset all inputs, drivers, and actuals to workbook defaults? This cannot be undone.',
    )
    if (!ok) return
    resetToDefaults()
    setImportMessage({ kind: 'success', text: 'Defaults restored. Local configuration matches the model baseline.' })
  }

  const waitForPaint = async (frames = 2) => {
    for (let i = 0; i < frames; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  }

  const addImagePage = (pdf: jsPDF, title: string, canvas: HTMLCanvasElement, firstPage = false) => {
    if (!firstPage) pdf.addPage()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12

    pdf.setFontSize(14)
    pdf.text(title, margin, margin)

    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2 - 8
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
    const drawWidth = canvas.width * ratio
    const drawHeight = canvas.height * ratio
    const x = (pageWidth - drawWidth) / 2
    const y = margin + 4

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', x, y, drawWidth, drawHeight, undefined, 'FAST')
  }

  const handleGenerateReport = async () => {
    clearImportMessage()
    clearReportMessage()
    setIsGeneratingReport(true)
    setShowReportSurface(true)

    try {
      await waitForPaint(3)
      const targets: Array<{ title: string; element: HTMLDivElement | null }> = [
        { title: 'Dashboard', element: dashboardReportRef.current },
      ]

      if (targets.some((t) => !t.element)) {
        throw new Error('Report sections did not render in time. Please try again.')
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i]!
        const canvas = await toCanvas(target.element as HTMLDivElement, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#ffffff',
        })
        addImagePage(pdf, target.title, canvas, i === 0)
      }

      const stamp = new Date().toISOString().slice(0, 10)
      const filename = `svfm-report-${fiscalYear}-${stamp}.pdf`
      pdf.save(filename)
      setReportMessage({ kind: 'success', text: `Report generated: ${filename}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report.'
      setReportMessage({ kind: 'error', text: msg })
    } finally {
      setShowReportSurface(false)
      setIsGeneratingReport(false)
    }
  }

  const onFiscalYearBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    const n = Number(e.target.value)
    const current = useAppStore.getState().fiscalYear
    if (!Number.isInteger(n) || n < 1900 || n > 2200) {
      e.target.value = String(current)
      return
    }
    setFiscalYear(n)
  }

  return (
    <div className="space-y-8 p-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Save the full application state to a JSON file for backup or transfer between machines.
          Import replaces the current session. Data remains on this device unless you export it.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6" aria-labelledby="settings-identity-heading">
        <h2 id="settings-identity-heading" className="text-xs font-semibold uppercase tracking-widest text-zinc-700">
          Identity and year
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          The police service name also appears in the header on every page. Fiscal year labels
          dashboards and export filenames.
        </p>
        <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-service-name" className="text-xs font-medium text-zinc-600">
              Police service
            </label>
            <input
              id="settings-service-name"
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              autoComplete="organization"
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="settings-fiscal-year" className="text-xs font-medium text-zinc-600">
              Fiscal year (calendar)
            </label>
            <input
              id="settings-fiscal-year"
              type="number"
              min={1900}
              max={2200}
              step={1}
              defaultValue={fiscalYear}
              key={fiscalYear}
              onBlur={onFiscalYearBlur}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Export file format version: <span className="font-mono text-zinc-700">{SCHEMA_VERSION}</span>
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6" aria-labelledby="settings-io-heading">
        <h2 id="settings-io-heading" className="text-xs font-semibold uppercase tracking-widest text-zinc-700">
          File operations
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Export configuration
          </button>
          <button
            type="button"
            onClick={handlePickImportFile}
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
          >
            Import configuration…
          </button>
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={() => {
              void handleGenerateReport()
            }}
            disabled={isGeneratingReport}
            className={cn(
              'rounded border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
              isGeneratingReport
                ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400'
                : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50',
            )}
          >
            {isGeneratingReport ? 'Generating report…' : 'Generate report'}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Import checks the schema version. Files from a newer or older format are rejected with an
          explicit message.
        </p>
        {importMessage && (
          <p
            role="status"
            className={cn(
              'mt-4 rounded border px-3 py-2 text-sm',
              importMessage.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900',
            )}
          >
            {importMessage.text}
          </p>
        )}
        {reportMessage && (
          <p
            role="status"
            className={cn(
              'mt-3 rounded border px-3 py-2 text-sm',
              reportMessage.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900',
            )}
          >
            {reportMessage.text}
          </p>
        )}
      </section>

      {showReportSurface && (
        <div className="pointer-events-none fixed -left-[20000px] top-0 w-[1280px] bg-white p-6">
          <div ref={dashboardReportRef}>
            <Dashboard />
          </div>
        </div>
      )}
    </div>
  )
}

import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render errors so a failed chart or page does not blank the entire session without context.
 */
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SVFM]', error.message, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-6 py-16 text-center">
          <div className="max-w-md rounded-lg border border-zinc-300 bg-white px-8 py-10 shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">Application error</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              The interface stopped because of an unexpected error. You can reload the page. If
              the problem persists, export your configuration from Settings (if reachable) before
              clearing site data.
            </p>
            <pre className="mt-4 max-h-32 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-700">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="mt-6 w-full rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

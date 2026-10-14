import { Component, type ReactNode } from "react"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  children: ReactNode
  /** Rendered instead of the full-page message (use `null` to step down silently). */
  fallback?: ReactNode
  onError?: () => void
}

/** Friendly fallback for an unexpected render error. Answers live in sessionStorage, so they survive. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError?.()
  }
  render() {
    if (!this.state.failed) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback
    return (
      <section role="alert" className="mx-auto flex max-w-[640px] flex-col gap-6 border border-ink bg-paper p-6">
        <h1 className="heading-view m-0">Something slipped</h1>
        <p className="m-0 flex items-start gap-2 text-status-error">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
          Your answers are kept. Try again.
        </p>
        <Button type="button" onClick={() => this.setState({ failed: false })} className="w-fit">
          Try again
        </Button>
      </section>
    )
  }
}

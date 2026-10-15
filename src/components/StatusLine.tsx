import type { ReactNode } from "react"
import { cn } from "cn"

export type Tone = "success" | "warning" | "error" | "neutral"

const toneClass: Record<Tone, string> = {
  success: "text-status-success",
  warning: "text-status-warning",
  error: "text-status-error",
  neutral: "text-foreground",
}

/**
 * The single inline status area (no toasts). An `aria-live="polite"` region that stays mounted so
 * changes are announced. Pair `icon` with text: state is never colour alone.
 */
export function StatusLine({
  icon,
  tone = "neutral",
  children,
  className,
  id,
  alert,
}: {
  icon?: ReactNode
  tone?: Tone
  children?: ReactNode
  className?: string
  id?: string
  alert?: boolean
}) {
  return (
    <div
      id={id}
      role={alert ? "alert" : "status"}
      aria-live={alert ? "assertive" : "polite"}
      className={cn("flex min-h-6 items-start gap-2 text-base", toneClass[tone], className)}
    >
      {children ? (
        <>
          {icon && <span aria-hidden="true" className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
          <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
        </>
      ) : null}
    </div>
  )
}

/** Visually hidden live region for announcements with no visible line (tear result, saved). */
export function Announcer({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}

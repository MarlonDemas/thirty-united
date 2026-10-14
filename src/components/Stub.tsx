import type { ReactNode } from "react"
import { cn } from "cn"

/** The ruled mono table on the stub half: label above a tabular value, one ruled row each. */
export function Stub({
  rows,
  className,
}: {
  rows: { label: string; value: ReactNode; muted?: boolean }[]
  className?: string
}) {
  return (
    <dl className={cn("m-0 flex h-full flex-col", className)}>
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-0.5 border-t border-ink px-3 py-2 first:border-t-0 md:py-3 md:pr-5 md:pl-8">
          <dt className="data-label text-ink-2">{r.label}</dt>
          <dd className={cn("data-stub m-0 min-w-0 [overflow-wrap:anywhere]", r.muted && "text-muted-foreground")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

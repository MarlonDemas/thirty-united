import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full border border-line bg-panel-raised px-3 py-2 text-base text-foreground placeholder:text-moonlight disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-status-error",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

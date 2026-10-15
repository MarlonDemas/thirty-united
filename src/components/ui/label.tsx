import * as React from "react"
import { cn } from "cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 text-base leading-6 font-medium text-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

export { Label }

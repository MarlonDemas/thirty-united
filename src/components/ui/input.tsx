import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 border border-line bg-panel-raised px-3 text-base text-foreground placeholder:text-moonlight disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-status-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }

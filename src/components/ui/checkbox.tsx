import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center border border-line bg-panel-raised text-panel after:absolute after:-inset-3 data-checked:border-moonlight data-checked:bg-moonlight disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-status-error",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-5"
      >
        <CheckIcon aria-hidden="true" strokeWidth={2} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

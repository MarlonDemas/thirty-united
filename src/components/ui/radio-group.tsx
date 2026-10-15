"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "cn"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

/**
 * A square tile (not a dot) on panel-raised with a 1px line edge. Selected: a 2px moonlight edge (inset, no
 * layout shift) and the caller's filled icon, so the choice is never colour alone.
 * Children are the tile's icon and word.
 */
function RadioTile({ className, children, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-tile"
      className={cn(
        "group/tile relative flex min-h-14 min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border border-line bg-panel-raised px-4 text-center text-base font-medium text-foreground select-none hover:border-moonlight data-checked:border-moonlight data-checked:shadow-[inset_0_0_0_1px_var(--moonlight)] disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-6 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioTile }

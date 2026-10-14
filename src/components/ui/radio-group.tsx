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
 * A square ruled tile (not a dot): the selected tile fills with ink and flips its text to paper.
 * Children are the tile's icon and word.
 */
function RadioTile({ className, children, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-tile"
      className={cn(
        "group/tile relative flex min-h-14 min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border border-input bg-paper-raised px-4 text-center text-base font-medium text-ink select-none not-data-checked:hover:bg-rule-soft data-checked:bg-ink data-checked:text-paper data-checked:shadow-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-6 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioTile }

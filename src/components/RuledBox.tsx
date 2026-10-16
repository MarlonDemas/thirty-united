import type { ComponentProps } from "react"
import { cn } from "cn"

/**
 * One question group (components.md "Field group"): a fieldset with a 1 px top rule and a caps legend on it.
 * Focus within thickens the rule to 2 px moonlight, inset, so nothing shifts. No box.
 */
export function RuledBox({ legend, className, children, ...props }: ComponentProps<"fieldset"> & { legend?: string }) {
  return (
    <fieldset
      className={cn(
        "relative m-0 min-w-0 border-0 p-0 pt-3 shadow-[inset_0_1px_0_var(--line)] transition-shadow duration-[120ms] ease-out focus-within:shadow-[inset_0_2px_0_var(--moonlight)] forced-colors:border-t forced-colors:border-solid",
        className,
      )}
      {...props}
    >
      {legend && <legend className="label-group float-left mb-3 w-full p-0">{legend}</legend>}
      <div className="clear-left flex flex-col gap-4">{children}</div>
    </fieldset>
  )
}

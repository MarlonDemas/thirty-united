import type { ComponentProps } from "react"
import { cn } from "cn"

/**
 * One ruled box per question group: a fieldset whose legend is the label tab on the top rule.
 * Hover and focus fill the tab with ink; focus thickens the rule to 2px with an inset line
 * (no layout shift).
 */
export function RuledBox({ legend, className, children, ...props }: ComponentProps<"fieldset"> & { legend: string }) {
  return (
    <fieldset
      className={cn(
        "group/box relative m-0 min-w-0 border border-ink bg-paper px-5 pt-6 pb-6 md:px-6 focus-within:shadow-[inset_0_0_0_1px_var(--ink)] forced-colors:focus-within:outline-2",
        className,
      )}
      {...props}
    >
      <legend className="label-tab ml-[-1px] border border-ink bg-paper px-3 py-1.5 text-ink transition-[color,background-color,border-color] duration-[120ms] ease-out group-hover/box:bg-ink group-hover/box:text-paper group-focus-within/box:bg-ink group-focus-within/box:text-paper">
        {legend}
      </legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  )
}

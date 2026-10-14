import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Direction A: square, 1px ink rule, 48px target. Red only on the primary action.
const buttonVariants = cva(
  "group/button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border border-ink px-6 text-base font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-100 select-none active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "border-red bg-red text-paper-raised hover:border-red-pressed hover:bg-red-pressed active:bg-red-pressed",
        outline: "bg-paper-raised text-ink hover:bg-ink hover:text-paper",
        link: "min-h-12 whitespace-normal text-left border-transparent px-0 text-ink underline underline-offset-4 decoration-1 hover:decoration-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Button }

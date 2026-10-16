import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Direction D: square, 48px target. Shirt red only on the primary action, always with its 2px moonlight ring
// (shirt red on the panel is 2.20:1); focus adds the 3px ring 2px outside it.
const buttonVariants = cva(
  "group/button inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border px-6 text-base font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-100 select-none active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 forced-colors:disabled:opacity-100 aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "border-shirt-red bg-shirt-red text-foreground shadow-[0_0_0_2px_var(--moonlight)] hover:border-shirt-red-hover hover:bg-shirt-red-hover focus-visible:outline-offset-4 active:border-shirt-red-pressed active:bg-shirt-red-pressed disabled:border-line disabled:bg-panel-raised disabled:text-line disabled:opacity-100",
        outline: "border-line bg-transparent text-foreground hover:border-moonlight",
        link: "min-h-12 whitespace-normal text-left border-transparent px-0 text-foreground underline underline-offset-4 decoration-1 hover:decoration-2",
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

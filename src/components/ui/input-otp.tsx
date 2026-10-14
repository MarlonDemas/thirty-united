import * as React from "react"
import { cn } from "cn"
import { OTPInput, OTPInputContext } from "input-otp"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center has-disabled:opacity-60", containerClassName)}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-group" className={cn("flex items-center gap-2", className)} {...props} />
  )
}

function InputOTPSlot({
  index,
  className,
  invalid,
  ...props
}: React.ComponentProps<"div"> & { index: number; invalid?: boolean }) {
  const ctx = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = ctx?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-invalid={invalid || undefined}
      className={cn(
        "relative flex h-14 min-w-0 flex-1 items-center justify-center border border-input bg-paper-raised font-mono text-[1.75rem] leading-9 font-medium tabular-nums text-ink md:text-[2rem] data-[active=true]:border-2 data-[active=true]:outline-3 data-[active=true]:outline-offset-2 data-[active=true]:outline-ring data-[invalid]:border-2 data-[invalid]:border-status-error",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-7 w-px bg-ink" />
        </div>
      )}
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot }

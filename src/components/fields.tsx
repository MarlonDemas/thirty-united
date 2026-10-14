import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Field, FieldError, FieldDescription } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function OptionalTag() {
  return <span className="helper rounded-mark border border-rule-soft px-1.5 text-sm font-normal">optional</span>
}

type Common = {
  name: string
  label: string
  optional?: boolean
  helper?: string
  error?: string
  children?: ReactNode
}

/** Label above the field, optional tag instead of asterisks, helper and error tied by aria-describedby. */
function Shell({ name, label, optional, helper, error, children }: Common) {
  return (
    <Field data-invalid={!!error || undefined}>
      <Label htmlFor={`field-${name}`}>
        {label}
        {optional && <OptionalTag />}
      </Label>
      {children}
      {helper && <FieldDescription id={`help-${name}`}>{helper}</FieldDescription>}
      {error && <FieldError id={`err-${name}`}>{error}</FieldError>}
    </Field>
  )
}

const describedBy = (name: string, helper?: string, error?: string) =>
  [helper && `help-${name}`, error && `err-${name}`].filter(Boolean).join(" ") || undefined

export function TextField({
  reg,
  type = "text",
  autoComplete,
  inputMode,
  ...c
}: Common & {
  reg: UseFormRegisterReturn
  type?: string
  autoComplete?: string
  inputMode?: "text" | "email" | "tel" | "numeric"
}) {
  return (
    <Shell {...c}>
      <Input
        id={`field-${c.name}`}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!c.error || undefined}
        aria-describedby={describedBy(c.name, c.helper, c.error)}
        {...reg}
      />
    </Shell>
  )
}

export function TextAreaField({ reg, ...c }: Common & { reg: UseFormRegisterReturn }) {
  return (
    <Shell {...c}>
      <Textarea
        id={`field-${c.name}`}
        rows={3}
        aria-invalid={!!c.error || undefined}
        aria-describedby={describedBy(c.name, c.helper, c.error)}
        {...reg}
      />
    </Shell>
  )
}


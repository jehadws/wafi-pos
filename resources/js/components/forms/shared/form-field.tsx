"use client"

import { Label } from "@/components/ui/label"
import type { ReactNode } from "react"

interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export default function FormField({
  label,
  description,
  required = false,
  error,
  children,
  htmlFor,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label
        className={`text-sm font-medium ${required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}`}
        htmlFor={htmlFor}
      >
        {label}
      </Label>
      <div className="mt-2">{children}</div>
      {error
        ? <p className="text-sm text-destructive mt-1">{error}</p>
        : description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

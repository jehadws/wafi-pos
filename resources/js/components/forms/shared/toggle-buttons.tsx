"use client"

import { Button } from "@/components/ui/button"

interface ToggleButtonsProps {
  value: boolean
  onChange: (value: boolean) => void
  trueLabel?: string
  falseLabel?: string
  className?: string
}

export default function ToggleButtons({
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No",
  className = "",
}: ToggleButtonsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button type="button" variant={value ? "outline" : "default"} className="border" onClick={() => onChange(false)}>
        {falseLabel}
      </Button>
      <Button type="button" variant={value ? "default" : "outline"} className="border" onClick={() => onChange(true)}>
        {trueLabel}
      </Button>
    </div>
  )
}

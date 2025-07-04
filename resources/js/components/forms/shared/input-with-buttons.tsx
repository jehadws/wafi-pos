"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"

interface InputWithButtonsProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  onClear?: () => void
  onAdd?: () => void
  rightButtonLabel?: string
  showClearButton?: boolean
  showAddButton?: boolean
  className?: string
}

export default function InputWithButtons({
  value,
  onChange,
  placeholder,
  onClear,
  onAdd,
  rightButtonLabel,
  showClearButton = true,
  showAddButton = false,
  className = "",
}: InputWithButtonsProps) {
  return (
    <div className={`flex ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="rounded-r-none"
      />
      {showClearButton && (
        <Button type="button" variant="outline" className="rounded-l-none border-l-0" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
      {showAddButton && (
        <Button type="button" variant="outline" className="ml-1" onClick={onAdd}>
          {rightButtonLabel ? rightButtonLabel : <Plus className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )
}


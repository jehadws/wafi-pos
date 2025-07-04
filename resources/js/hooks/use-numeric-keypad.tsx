"use client"

import { useState } from "react"

interface UseNumericKeypadProps {
  onConfirm: (value: string) => void
  initialValue?: string | number
  title?: string
  maxLength?: number
  allowDecimal?: boolean
}

export function useNumericKeypad({
  onConfirm,
  initialValue = "",
  title = "Define Quantity",
  maxLength = 10,
  allowDecimal = false,
}: UseNumericKeypadProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openKeypad = () => setIsOpen(true)
  const closeKeypad = () => setIsOpen(false)

  const handleConfirm = (value: string) => {
    onConfirm(value)
    closeKeypad()
  }

  return {
    isOpen,
    openKeypad,
    closeKeypad,
    keypadProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      title,
      initialValue,
      onConfirm: handleConfirm,
      maxLength,
      allowDecimal,
    },
  }
}

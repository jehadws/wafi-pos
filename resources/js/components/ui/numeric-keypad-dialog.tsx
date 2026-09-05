"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { Delete } from "lucide-react"

interface NumericKeypadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  initialValue?: string | number
  onConfirm: (value: string) => void
  onCancel?: () => void
  maxLength?: number
  allowDecimal?: boolean
}

export function NumericKeypadDialog({
  open,
  onOpenChange,
  title,
  initialValue = "",
  onConfirm,
  maxLength = 10,
  allowDecimal = false,
}: NumericKeypadDialogProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState<string>("")

  useEffect(() => {
    if (open) {
      setValue(initialValue.toString())
    }
  }, [open, initialValue])

  const handleNumberClick = (num: string) => {
    if (value.length >= maxLength) return

    // Handle decimal point
    if (num === "." && (!allowDecimal || value.includes("."))) return

    // Prevent leading zeros (except for decimal numbers)
    if (value === "0" && num !== "." && allowDecimal) {
      setValue(num)
      return
    }

    setValue((prev) => prev + num)
  }

  const handleBackspace = () => {
    setValue((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setValue("")
  }

  const handleEnter = () => {
    onConfirm(value || "0")
    onOpenChange(false)
  }

  const keypadButtons = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">{t(title || 'Define Quantity')}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Display */}
        <div className="px-4 py-6">
          <div className="text-center">
            <div className="text-4xl font-light min-h-[3rem] flex items-center justify-center">
              {value || "0"}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="border-t">
          {/* Number rows */}
          {keypadButtons.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3">
              {row.map((num) => (
                <Button
                  key={num}
                  variant="ghost"
                  className="h-16 rounded-none border-e border-b last:border-e-0 text-lg font-medium hover:bg-gray-50"
                  onClick={() => handleNumberClick(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          ))}

          {/* Bottom row */}
          <div className="grid grid-cols-3">
            <Button
              variant="ghost"
              className="h-16 rounded-none border-e border-b text-lg font-medium hover:bg-gray-50"
              onClick={handleBackspace}
            >
              <Delete className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="h-16 rounded-none border-e border-b text-lg font-medium hover:bg-gray-50"
              onClick={() => handleNumberClick("0")}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-16 rounded-none border-e border-b text-lg font-medium hover:bg-gray-50 text-blue-600"
              onClick={handleEnter}
            >
              {t('Enter')}
            </Button>
          </div>

          {/* Decimal row (if enabled) */}
          {allowDecimal && (
            <div className="grid grid-cols-3">
              <Button
                variant="ghost"
                className="h-16 rounded-none border-e text-lg font-medium hover:bg-gray-50"
                onClick={handleClear}
              >
                {t('Clear')}
              </Button>
              <Button
                variant="ghost"
                className="h-16 rounded-none border-e text-lg font-medium hover:bg-gray-50"
                onClick={() => handleNumberClick(".")}
              >
                .
              </Button>
              <div className="h-16"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

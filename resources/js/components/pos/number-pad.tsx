"use client"

import type React from "react"

import { Delete, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NumberPadProps {
  onNumberClick: (num: string) => void
  onBackspace: () => void
  onConfirm: () => void
  handleFullPayment: () => void
}

interface NumberButtonProps {
  children: React.ReactNode
  onClick: () => void
}

function NumberButton({ children, onClick }: NumberButtonProps) {
  return (
    <Button variant="outline" size="lg" className="h-16 text-xl font-semibold bg-transparent text-foreground" onClick={onClick}>
      {children}
    </Button>
  )
}

export function NumberPad({ onNumberClick, onBackspace, onConfirm, handleFullPayment }: NumberPadProps) {
  const numbers = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
  ]

  return (
    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
      {/* Number rows */}
      {numbers.map((row, rowIndex) =>
        row.map((num) => (
          <NumberButton key={num} onClick={() => onNumberClick(num)}>
            {num}
          </NumberButton>
        )),
      )}

      {/* Bottom row */}
      <NumberButton onClick={onBackspace}>
        <Delete className="h-6 w-6" />
      </NumberButton>
      <NumberButton onClick={() => onNumberClick("0")}>0</NumberButton>
      <NumberButton onClick={onConfirm}>
        Enter
      </NumberButton>

      {/* Full Payment Button */}
      <div className="col-span-3">
        <Button
          onClick={handleFullPayment}
          className="w-full h-16 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
        >
          Full Payment
        </Button>
      </div>

    </div>
  )
}

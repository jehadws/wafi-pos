import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean // Cmd on Mac, Windows key on PC
}

interface KeyboardShortcutInputProps {
  value: string[]
  onChange?: (shortcut: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowSingleKeys?: boolean // Allow single keys like 'a', 'F1', etc.
  blockedKeys?: string[] // Keys to block (like 'Tab', 'Enter', etc.)
}

const MODIFIER_KEYS = ["Control", "Alt", "Shift", "Meta"]
const BLOCKED_KEYS_DEFAULT = ["Tab", "Enter", "Escape"]

// Format key names for display
const formatKeyName = (key: string): string => {
  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Backspace: "⌫",
    Delete: "Del",
    Insert: "Ins",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
    CapsLock: "Caps",
    NumLock: "Num",
    ScrollLock: "Scroll",
    PrintScreen: "PrtSc",
    Pause: "Pause",
    ContextMenu: "Menu",
  }

  return keyMap[key] || key
}

// Format the complete shortcut for display
const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push("Ctrl")
  if (shortcut.alt) parts.push("Alt")
  if (shortcut.shift) parts.push("Shift")
  if (shortcut.meta) parts.push(navigator.platform.includes("Mac") ? "Cmd" : "Win")

  parts.push(formatKeyName(shortcut.key))

  return parts.join(" + ")
}

// Check if shortcut is valid
const isValidShortcut = (shortcut: KeyboardShortcut, allowSingleKeys: boolean): boolean => {
  const hasModifier = shortcut.ctrl || shortcut.alt || shortcut.shift || shortcut.meta

  if (!allowSingleKeys && !hasModifier) {
    return false
  }

  // Function keys and special keys are always valid
  if (shortcut.key.startsWith("F") && shortcut.key.length <= 3) {
    return true
  }

  const specialKeys = ["Insert", "Delete", "Home", "End", "PageUp", "PageDown", "PrintScreen", "Pause"]
  if (specialKeys.includes(shortcut.key)) {
    return true
  }

  return true
}

export default function KeyboardShortcutInput({
  value,
  onChange,
  placeholder = "Press keys to set shortcut...",
  disabled = false,
  className,
  allowSingleKeys = false,
  blockedKeys = BLOCKED_KEYS_DEFAULT,
}: KeyboardShortcutInputProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentShortcut, setCurrentShortcut] = useState<string[]>(value || [])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentShortcut(value)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCapturing || disabled) return

    e.preventDefault()
    e.stopPropagation()

    const key = e.key

    // Skip modifier keys by themselves
    if (MODIFIER_KEYS.includes(key)) return

    // Skip blocked keys
    if (blockedKeys.includes(key)) return

    const shortcut: KeyboardShortcut = {
      key,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    }

    // Validate shortcut
    if (!isValidShortcut(shortcut, allowSingleKeys)) {
      return
    }

    setCurrentShortcut(shortcut)
    setIsCapturing(false)
    onChange?.(shortcut)
    inputRef.current?.blur()
  }

  const handleFocus = () => {
    if (!disabled) {
      setIsCapturing(true)
    }
  }

  const handleBlur = () => {
    setIsCapturing(false)
  }

  const handleClear = () => {
    setCurrentShortcut(null)
    onChange?.(null)
  }

  const displayValue = currentShortcut ? formatShortcut(currentShortcut) : ""

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={displayValue}
          placeholder={isCapturing ? "Press keys..." : placeholder}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly
          disabled={disabled}
          className={cn(
            "pr-20 cursor-pointer",
            isCapturing && "ring-2 ring-blue-500 border-blue-500",
            currentShortcut && "pr-16",
          )}
        />

        {/* Keyboard icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {currentShortcut && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Keyboard className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Status indicator */}
      {isCapturing && (
        <div className="absolute -bottom-6 left-0 right-0">
          <Badge variant="secondary" className="text-xs">
            Listening for keys...
          </Badge>
        </div>
      )}

      {/* Validation message */}
      {!allowSingleKeys && (
        <p className="text-xs text-muted-foreground mt-1">
          Shortcut must include at least one modifier key (Ctrl, Alt, Shift, or Cmd/Win)
        </p>
      )}
    </div>
  )
}

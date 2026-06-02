"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, X, Plus, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"


type ShortcutOption = {
  label: string;
  value: string;
};

interface MultiKeySelectorProps {
  value?: string[] | null
  onChange?: (keys: string[] | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxKeys?: number
  options: ShortcutOption[]
}

export default function MultiKeySelector({
  value = null,
  onChange,
  placeholder = "Select keys for shortcut...",
  disabled = false,
  className,
  maxKeys = 4,
  options,
}: MultiKeySelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const selectedKeys = value || []

  const getKeyLabel = (keyValue: string): string => {
    const option = options.find((opt) => opt.value === keyValue)
    return option?.label || keyValue
  }

  const handleKeySelect = (keyValue: string) => {
    if (selectedKeys.includes(keyValue)) {
      // Remove key if already selected
      const newKeys = selectedKeys.filter((k) => k !== keyValue)
      onChange?.(newKeys.length > 0 ? newKeys : null)
    } else if (selectedKeys.length < maxKeys) {
      // Add key if under limit
      const newKeys = [...selectedKeys, keyValue]
      onChange?.(newKeys)
    }
  }

  const handleKeyRemove = (keyValue: string) => {
    const newKeys = selectedKeys.filter((k) => k !== keyValue)
    onChange?.(newKeys.length > 0 ? newKeys : null)
  }

  const handleClear = () => {
    onChange?.(null)
  }

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatShortcut = (keys: string[]): string => {
    return keys.map(getKeyLabel).join(" + ")
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
              "w-full justify-between text-start font-normal",
              "h-9 px-4 py-2 has-[>svg]:px-3",
              !selectedKeys.length && "text-muted-foreground",
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Keyboard className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedKeys.length > 0 ? formatShortcut(selectedKeys) : placeholder}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selectedKeys.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Plus className="h-4 w-4" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t('Search')} value={searchQuery} onValueChange={setSearchQuery} />
            <CommandList>
              <CommandEmpty>No keys found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selectedKeys.includes(option.value)
                  const canSelect = !isSelected && selectedKeys.length < maxKeys

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleKeySelect(option.value)}
                      disabled={!isSelected && !canSelect}
                      className={cn("flex items-center justify-between", isSelected && "bg-accent")}
                    >
                      <div className="flex items-center gap-2">
                        <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                        <span>{option.label}</span>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}


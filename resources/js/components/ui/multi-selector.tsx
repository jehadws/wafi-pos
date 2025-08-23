"use client"

import * as React from "react"
import { X, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export interface Option {
  id: number
  name: string
  disabled?: boolean
}

interface MultiSelectorProps {
  options: Option[]
  value: number[]
  onChange: (value: number[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  maxItems?: number
}

export function MultiSelector({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No items found",
  className,
  disabled = false,
  maxItems,
}: MultiSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOptions = options.filter((option) => value.includes(option.id))
  const availableOptions = options.filter((option) => !value.includes(option.id))

  const filteredOptions = availableOptions.filter((option) =>
    option.name.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const handleSelect = (optionValue: number) => {
    if (maxItems && value.length >= maxItems) {
      return
    }
    onChange([...value, optionValue])
  }

  const handleRemove = (optionValue: number) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between min-h-10 h-auto p-2", disabled && "cursor-not-allowed opacity-50")}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge key={option.id.toString()} variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
                    {option.name}
                    <div
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.id)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() => handleRemove(option.id)}
                    >
                      <X className="h-3 w-3 text-white hover:text-gray-200" />
                    </div>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </div>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id.toString()}
                    value={option.id.toString()}
                    disabled={option.disabled}
                    onSelect={() => {
                      handleSelect(option.id)
                      setSearchValue("")
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value.includes(option.id) ? "opacity-100" : "opacity-0")} />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {maxItems && (
        <p className="text-xs text-muted-foreground mt-1">
          {value.length}/{maxItems} items selected
        </p>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownSearchProps {
  value: string
  onValueChange: (value: string) => void
  onSearch: (query: string) => void
  results: any[]
  onSelect: (item: any) => void
  placeholder?: string
  className?: string
}

export function DropdownSearch({
  value,
  onValueChange,
  onSearch,
  results,
  onSelect,
  placeholder = "Search...",
  className
}: DropdownSearchProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? <span className="truncate">{value}</span> : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={value}
            onValueChange={(newValue) => {
              onValueChange(newValue)
              onSearch(newValue)
            }}
          />
          <CommandList>
            <CommandEmpty>{!value ? "Type to search..." : "No results found."}</CommandEmpty>
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.sku} ${item.barcode}`}
                onSelect={() => {
                  onSelect(item)
                  setOpen(false)
                  onValueChange('')
                }}
              >
                <div className="grid gap-1 w-full">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                        <span>SKU: {item.sku}</span>
                        <span>Barcode: {item.barcode}</span>
                    </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

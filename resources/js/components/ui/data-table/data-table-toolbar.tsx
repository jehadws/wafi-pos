"use client"

import type { Table } from "@tanstack/react-table"
import { Filter, Plus, RefreshCw, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import type { FilterableColumn } from "./data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterableColumns?: FilterableColumn[]
  searchKey?: string
  bulkActions?: {
    label: string
    action: (selectedRows: TData[]) => void
  }[]
  onAddNew?: () => void
  onRefresh?: () => void
  customFilterDialog?: boolean
  onOpenCustomFilterDialog?: () => void
  // Server-side search props
  useServerSideSearch?: boolean
  onSearch?: (searchTerm: string) => void
  searchValue?: string
  isLoading?: boolean
}

/**
 * `daterangepicker` filter control — value is a `{ from?, to? }` DateRange
 * carried on the tanstack column-filter state; the engine serializes it to
 * the backend `{ startDate, endDate }` query-filter shape.
 */
function DateRangeFilterControl<TData>({ table, id, title }: { table: Table<TData>; id: string; title: string }) {
  const column = table.getColumn(id)
  if (!column) return null

  const value = column.getFilterValue() as DateRange | undefined

  return (
    <DateRangePicker
      className="w-auto"
      placeholder={title}
      dateRange={value}
      aria-label={title}
      onDateRangeChange={(range) => column.setFilterValue(range ?? undefined)}
    />
  )
}

/**
 * `text` filter control — debounced scalar string on the column-filter
 * state; an empty input clears the filter.
 */
function TextFilterControl<TData>({ table, id, title, placeholder }: { table: Table<TData>; id: string; title: string; placeholder?: string }) {
  const column = table.getColumn(id)
  const filterValue = (column?.getFilterValue() as string | undefined) ?? ''
  const [localValue, setLocalValue] = useState(filterValue)

  useEffect(() => {
    setLocalValue(filterValue)
  }, [filterValue])

  const handleChange = (value: string) => {
    setLocalValue(value)
    const timeout = setTimeout(() => {
      column?.setFilterValue(value === '' ? undefined : value)
    }, 300)
    return () => clearTimeout(timeout)
  }

  if (!column) return null

  return (
    <Input
      key={id}
      aria-label={title}
      placeholder={placeholder ?? title}
      value={localValue}
      onChange={(event) => handleChange(event.target.value)}
      className="h-9 w-[150px] lg:w-[200px]"
    />
  )
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchKey,
  bulkActions = [],
  onAddNew,
  onRefresh,
  onOpenCustomFilterDialog,
  customFilterDialog = false,
  useServerSideSearch = false,
  onSearch,
  searchValue = "",
  isLoading = false,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation();
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const isFiltered = table.getState().columnFilters.length > 0
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const handleApplyAction = () => {
    if (!selectedAction) return

    const action = bulkActions.find((a) => a.label === selectedAction)
    if (!action) return

    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    action.action(selectedRows)
    table.resetRowSelection();
    setSelectedAction(null)
  }

  // Debounced search for server-side search
  const debouncedSearch = useCallback(
    (value: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      const timeout = setTimeout(() => {
        if (onSearch) {
          onSearch(value)
        }
      }, 300) // 300ms delay

      setSearchTimeout(timeout)
    },
    [onSearch, searchTimeout],
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)

    if (useServerSideSearch) {
      debouncedSearch(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  // Update local search value when external searchValue changes
  useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        {onAddNew && (
          <Button onClick={onAddNew} size="sm" variant="outline" className="h-9">
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {searchKey && (
          <Input
            placeholder={t('Search')}
            value={localSearchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            // value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            // onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
            disabled={isLoading}
            className="h-9 w-[150px] lg:w-[250px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (onSearch) {
                  onSearch(localSearchValue)
                }
              }
            }}
          />
        )}
        {filterableColumns.length > 0 &&
          filterableColumns.map((column) => {
            if (!table.getColumn(column.id)) {
              return null
            }

            if (column.type === 'daterangepicker') {
              return <DateRangeFilterControl key={column.id} table={table} id={column.id} title={column.title} />
            }

            if (column.type === 'text') {
              return <TextFilterControl key={column.id} table={table} id={column.id} title={column.title} placeholder={column.placeholder} />
            }

            return (
              <DataTableFacetedFilter
                key={column.id}
                column={table.getColumn(column.id)}
                title={column.title}
                options={column.options}
              />
            )
          })}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-9 px-2 lg:px-3">
            {t('Reset')}
            <X className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedAction || ""} onValueChange={setSelectedAction}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder={t('Bulk Actions')} />
              </SelectTrigger>
              <SelectContent>
                {bulkActions.map((action) => (
                  <SelectItem key={action.label} value={action.label}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleApplyAction} disabled={!selectedAction} className="h-9">
              {t('Apply')}
            </Button>
          </div>
        )}
        {customFilterDialog && (
          <Button variant="outline" size="sm" className="h-9 px-2 lg:px-3" onClick={onOpenCustomFilterDialog}>
            <Filter className="me-2 h-4 w-4" />
            {t('Filters')}
          </Button>
        )}
        <DataTableViewOptions table={table} />
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}


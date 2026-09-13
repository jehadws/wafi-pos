"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { useTranslation } from "@/lib/i18n"


interface DataTableFacetedFilterOption {
  label: string
  value: string
}

/**
 * Toolbar filter controls. `select` renders a faceted multi-select
 * (legacy shape without `type` defaults to select); `daterangepicker`
 * renders a date-range popover whose value is a
 * `{ from?: Date; to?: Date }` range; `text` renders a debounced input
 * whose value is a scalar string. All of them resolve through the
 * tanstack `columnFilters` state — server pages wire no-op `filterFn`s
 * and translate the state into `queryFilters`.
 */
export type FilterableColumn =
  | {
      id: string
      title: string
      type?: 'select'
      options: DataTableFacetedFilterOption[]
    }
  | {
      id: string
      title: string
      type: 'daterangepicker'
      options?: DataTableFacetedFilterOption[]
    }
  | {
      id: string
      title: string
      type: 'text'
      options?: DataTableFacetedFilterOption[]
      placeholder?: string
    }

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[] | CustomPaginationData<TData>
  title?: string
  description?: string
  searchKey?: string
  filterableColumns?: FilterableColumn[]
  bulkActions?: {
    label: string
    action: (selectedRows: TData[]) => void
  }[]
  initialPageSize?: number
  onAddNew?: () => void
  onRefresh?: () => void
  customFilterDialog?: boolean
  onOpenCustomFilterDialog?: () => void

  // Custom pagination
  useCustomPagination?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void

  // Server side search
  useServerSideSearch?: boolean
  onSearch?: (searchTerm: string) => void
  searchValue?: string

  isLoading?: boolean

  // ── Engine hooks (backend-driven tables) — all optional, no-op when unset ──
  /**
   * Row-level class resolved per row (engine: `CrudEntryRow.$cssClass`
   * status colors). Returning `undefined` keeps the row class-free.
   */
  rowClassName?: (row: TData) => string | undefined
  /**
   * Observes resolved column-filter state (engine: translates faceted
   * filter selections into server-side `queryFilters`). Called on mount
   * with `[]` too.
   */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  /** Seeds the column-visibility state (engine: hides filter-only columns). */
  initialColumnVisibility?: VisibilityState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  searchKey,
  filterableColumns = [],
  bulkActions = [],
  onAddNew,
  onRefresh,
  initialPageSize = 10,
  customFilterDialog,
  onOpenCustomFilterDialog,
  useCustomPagination = false,
  onPageChange,
  onPageSizeChange,
  useServerSideSearch = false,
  onSearch,
  searchValue = "",
  isLoading = false,
  rowClassName,
  onColumnFiltersChange,
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility ?? {})
  const [rowSelection, setRowSelection] = React.useState({})

  // Observe resolved column-filter state for engine consumers (server-side
  // queryFilters). Filters themselves never client-filter server pages —
  // the engine wires a no-op filterFn on those columns.
  React.useEffect(() => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(columnFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters])


  // Determine if we're using custom pagination based on data structure
  const isCustomPagination = useCustomPagination || (data && typeof data === "object" && "current_page" in data)

  // Extract actual data array
  const tableData = React.useMemo(() => {
    if (isCustomPagination && data && typeof data === "object" && "data" in data) {
      return (data as unknown as CustomPaginationData<TData>).data as TData[]
    }
    return data as TData[]
  }, [data, isCustomPagination])

  // Get pagination data for custom pagination
  const customPaginationData = React.useMemo(() => {
    if (isCustomPagination && data && typeof data === "object" && "current_page" in data) {
      return data as unknown as CustomPaginationData<TData>
    }
    return undefined
  }, [data, isCustomPagination])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isCustomPagination ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    // enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: isCustomPagination,
  })

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold tracking-tight">{t(title)}</h2>}
          {description && <p className="text-muted-foreground">{t(description)}</p>}
        </div>
      )}
      <DataTableToolbar
        table={table}
        filterableColumns={filterableColumns}
        searchKey={searchKey}
        bulkActions={bulkActions}
        onAddNew={onAddNew}
        onRefresh={onRefresh}
        customFilterDialog={customFilterDialog}
        onOpenCustomFilterDialog={onOpenCustomFilterDialog}
        useServerSideSearch={useServerSideSearch}
        onSearch={onSearch}
        searchValue={searchValue}
        isLoading={isLoading}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={rowClassName?.(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('There is nothing to display...')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        useCustomPagination={isCustomPagination}
        customPaginationData={customPaginationData}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

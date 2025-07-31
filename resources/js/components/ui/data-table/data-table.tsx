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


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title?: string
  description?: string
  searchKey?: string
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})


  // Determine if we're using custom pagination based on data structure
  const isCustomPagination = useCustomPagination || (data && typeof data === "object" && "current_page" in data)

  // Extract actual data array
  const tableData = React.useMemo(() => {
    if (isCustomPagination && data && typeof data === "object" && "data" in data) {
      return (data as CustomPaginationData<TData>).data as TData[]
    }
    return data as TData[]
  }, [data, isCustomPagination])

  // Get pagination data for custom pagination
  const customPaginationData = React.useMemo(() => {
    if (isCustomPagination && data && typeof data === "object" && "current_page" in data) {
      return data as CustomPaginationData<TData>
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
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
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

"use client"

import type { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

import { Button } from "@/components/ui/button"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  useCustomPagination?: boolean
  customPaginationData?: CustomPaginationData<TData>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTablePagination<TData>({
  table,
  useCustomPagination = false,
  customPaginationData,
  onPageChange,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  // Use custom pagination data when available, otherwise fall back to table data
  const currentPage =
    useCustomPagination && customPaginationData
      ? customPaginationData.current_page
      : table.getState().pagination.pageIndex + 1

  const pageSize =
    useCustomPagination && customPaginationData ? customPaginationData.per_page : table.getState().pagination.pageSize

  const totalItems =
    useCustomPagination && customPaginationData ? customPaginationData.total : table.getFilteredRowModel().rows.length

  const totalPages =
    useCustomPagination && customPaginationData
      ? Math.ceil(customPaginationData.total / customPaginationData.per_page)
      : table.getPageCount()

  const selectedRowsCount = useCustomPagination
    ? 0 // Custom pagination doesn't support row selection typically
    : table.getFilteredSelectedRowModel().rows.length

  const canPreviousPage =
    useCustomPagination && customPaginationData
      ? customPaginationData.prev_page_url !== null
      : table.getCanPreviousPage()

  const canNextPage =
    useCustomPagination && customPaginationData ? customPaginationData.next_page_url !== null : table.getCanNextPage()

  const handleFirstPage = () => {
    if (useCustomPagination && onPageChange) {
      onPageChange(1)
    } else {
      table.setPageIndex(0)
    }
  }

  const handlePreviousPage = () => {
    if (useCustomPagination && onPageChange) {
      onPageChange(currentPage - 1)
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (useCustomPagination && onPageChange) {
      onPageChange(currentPage + 1)
    } else {
      table.nextPage()
    }
  }

  const handleLastPage = () => {
    if (useCustomPagination && onPageChange) {
      onPageChange(totalPages)
    } else {
      table.setPageIndex(table.getPageCount() - 1)
    }
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {useCustomPagination
          ? t('displaying {perPage} on {items} items', { perPage: Math.min(currentPage * pageSize, totalItems) - (currentPage - 1) * pageSize, items: totalItems })
          : t('{entries} entries selected', { entries: selectedRowsCount })}
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2" dir="ltr">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
            onClick={handleFirstPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">{t('Go to first page')}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">{t('Go to previous page')}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handleNextPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">{t('Go to next page')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
            onClick={handleLastPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">{t('Go to last page')}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


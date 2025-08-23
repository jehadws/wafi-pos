import axios from "axios"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { endOfToday, format, startOfToday } from "date-fns"
import { Printer, RotateCcw } from 'lucide-react'
import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { formatCurrency } from "@/utils/format"
import { usePage } from "@inertiajs/react"
import { SharedData } from "@/types"

type TFilter = {
  endDate: string
  startDate: string
}

type TData = {
  total: number
  summary: TSummary[]
}

type TSummary = {
  total: number
  label: string
}

const defaultData = {
  total: 0,
  summary: [],
}

export default function Component() {
  const { auth } = usePage<SharedData>().props;
  const [data, setData] = useState<TData>(defaultData);
  const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() })
  const [filters, setFilters] = useState<TFilter>({
    endDate: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
    startDate: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
  });


  const getData = async (filters: TFilter) => {
    try {
      const res = await axios.post('/api/reports/payment-types', filters);
      console.log("Data", res.data);
      setData(res.data)
    } catch (error) {
      console.error("Error fetching Orders:", error);
    }
  }

  useEffect(() => {
    getData(filters)
  }, [])

  return (
    <AppLayout breadcrumbs={[]}>
      <div className="min-h-screen p-6">

        <div className="rounded-lg shadow-sm">
          {/* Header */}
          <div className="py-6 rounded-t-lg">
            <h1 className="text-2xl font-semibold">Sales By Payment Types</h1>
            <p className="text-sm mt-1">Provide a report of the sales by payment types, for a specific period.</p>
          </div>

          <div className="">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-fit">
                <DateRangePicker
                  onDateRangeChange={(dateRange) => {
                    if (!dateRange) return
                    setDateRange(dateRange)
                    setFilters({ ...filters, startDate: format(dateRange?.from!, 'yyyy-MM-dd HH:mm:ss'), endDate: format(dateRange?.to!.setHours(23, 59, 59), 'yyyy-MM-dd HH:mm:ss') })
                  }}
                  dateRange={dateRange}
                />
              </div>
              <Button onClick={() => getData(filters)} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                Load
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>

          </div>

          {/* Report Info - Only show when customer is selected */}
          <div className="mb-6 space-y-1 text-sm text-muted-foreground dark:text-gray-400">
            <p>
              <span className="font-medium">Range :</span> {filters.startDate} — {filters.endDate}
            </p>
            <p>
              <span className="font-medium">Document :</span> Customer Statement
            </p>
            <p>
              <span className="font-medium">By :</span> {auth.user.username}
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Summary</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.summary.map((payment, i) => (
                  <TableRow key={i} className="dark:border-gray-700">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {payment.label}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                      {formatCurrency(payment.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow key={'total'} className="dark:border-gray-700">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                    {formatCurrency(data.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { Printer, RotateCcw, RefreshCcw } from 'lucide-react'
import { useState, useEffect } from "react"
import axios from "axios"
import { formatCurrency } from "@/utils/format"
import { toast } from "sonner"

interface MonthData {
  id: number
  month_taxes: number
  month_unpaid_orders: number
  month_unpaid_orders_count: number
  month_paid_orders: number
  month_paid_orders_count: number
  month_partially_paid_orders: number
  month_partially_paid_orders_count: number
  month_income: number
  month_discounts: number
  month_wasted_goods_count: number
  month_wasted_goods: number
  month_expenses: number
  total_wasted_goods: number
  total_unpaid_orders: number
  total_unpaid_orders_count: number
  total_paid_orders: number
  total_paid_orders_count: number
  total_partially_paid_orders: number
  total_partially_paid_orders_count: number
  total_income: number
  total_discounts: number
  total_taxes: number
  total_wasted_goods_count: number
  total_expenses: number
  month_of_year: number
  range_starts: string
  range_ends: string
  created_at: string | null
  updated_at: string | null
}

interface AnnualReportData {
  [key: string]: MonthData
}

export default function Component() {
  const [selectedYear, setSelectedYear] = useState("2025")
  const [reportData, setReportData] = useState<AnnualReportData>({})
  const [isLoading, setIsLoading] = useState(false)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getData = async () => {
    try {
      const res = await axios.post('/api/reports/annual-report', { year: selectedYear });
      console.log("Data", res.data);
      setReportData(res.data)
    } catch (error) {
      console.error("Error fetching Orders:", error);
    }
  }

  const handleLoadReport = async () => {
    setIsLoading(true)
    await getData()
    setIsLoading(false)
  }

  const recomputeData = async () => {
    try {
      const res = await axios.post('/api/reports/compute/yearly', { year: selectedYear });
      toast.success(res.data.message)
      if (res.data.success === "success") {
        toast.success(res.data.message)
      }
    } catch (error) {
      console.error("Error Recomputing report:", error);
      toast.error("Failed to recompute report")
    }
  }

  // Calculate totals for the "Total" row
  const totalSales = Object.values(reportData).reduce((sum, month) => sum + month.month_paid_orders, 0)
  const totalTaxes = Object.values(reportData).reduce((sum, month) => sum + month.month_taxes, 0)
  const totalExpenses = Object.values(reportData).reduce((sum, month) => sum + month.month_expenses, 0)
  const totalIncome = Object.values(reportData).reduce((sum, month) => sum + month.month_income, 0)

  useEffect(() => {
    getData()
  }, [])

  return (
    <AppLayout breadcrumbs={[]} >
      <div className="min-h-screen p-4">
        <div className="rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 rounded-t-lg">
            <h1 className="text-2xl font-semibold">Annual Report</h1>
            <p className="text-sm mt-1">
              Provides an overview over the sales during a specific period
            </p>
          </div>

          <div className="p-4">

            {/* Year Input and Action Buttons */}
            <div className="flex items-center gap-4 mb-6">
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-32"
              />
              <Button
                variant="outline"
                onClick={handleLoadReport}
                disabled={isLoading}
                className="flex items-center gap-2 bg-transparent dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Load'}
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button onClick={recomputeData} variant="outline" className="flex items-center gap-2 bg-transparent dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <RefreshCcw className="w-4 h-4" />
                Recompute
              </Button>
            </div>

            {/* Report Info */}
            <div className="mb-6 space-y-1 text-sm text-muted-foreground dark:text-gray-400">
              <p>
                <span className="font-medium">Date :</span> {new Date().toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Document :</span> Yearly Report
              </p>
              <p>
                <span className="font-medium">By :</span> jehad
              </p>
            </div>

            {/* Annual Report Table */}
            <div className="border rounded-lg overflow-hidden dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300"></TableHead> {/* Empty for Month column */}
                    <TableHead className="text-center dark:text-gray-300">Sales</TableHead>
                    <TableHead className="text-center dark:text-gray-300">Taxes</TableHead>
                    <TableHead className="text-center dark:text-gray-300">Expenses</TableHead>
                    <TableHead className="text-center dark:text-gray-300">Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-2 text-muted-foreground">Loading report...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {Object.values(reportData).map((month) => (
                        <TableRow key={month.id} className="dark:border-gray-700">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {monthNames[month.month_of_year - 1]}
                          </TableCell>
                          <TableCell className="text-center text-gray-800 dark:text-gray-200">
                            {formatCurrency(month.month_paid_orders)}
                          </TableCell>
                          <TableCell className="text-center text-gray-800 dark:text-gray-200">
                            {formatCurrency(month.month_taxes)}
                          </TableCell>
                          <TableCell className="text-center text-gray-800 dark:text-gray-200">
                            {formatCurrency(month.month_expenses)}
                          </TableCell>
                          <TableCell className="text-center text-gray-800 dark:text-gray-200">
                            {formatCurrency(month.month_income)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/30 dark:bg-gray-700/30 font-semibold border-t-2 dark:border-gray-600">
                        <TableCell className="text-gray-900 dark:text-gray-100">Total</TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100">
                          {formatCurrency(totalSales)}
                        </TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100">
                          {formatCurrency(totalTaxes)}
                        </TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100">
                          {formatCurrency(totalExpenses)}
                        </TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100">
                          {formatCurrency(totalIncome)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


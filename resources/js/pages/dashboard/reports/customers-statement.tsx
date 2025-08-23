import axios from "axios"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AppLayout from "@/layouts/app-layout"
import { endOfToday, format, startOfToday } from "date-fns"
import { CreditCard, DollarSign, Printer, RotateCcw, Search, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'
import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { formatCurrency } from "@/utils/format"
import { Badge } from "@/components/ui/badge"
import { usePage } from "@inertiajs/react"
import { SharedData } from "@/types"

type TFilter = {
  rangeEnds: string
  rangeStarts: string
}

interface CustomerStatement {
  purchases_amount: number
  owed_amount: number
  account_amount: number
  total_orders: number
  credit_limit_amount: number
  orders: Order[]
  wallet_transactions: any[]
}

export default function Component() {
  const { auth } = usePage<SharedData>().props;
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerStatement, setCustomerStatement] = useState<CustomerStatement | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomerList, setShowCustomerList] = useState(false)

  const [dateRange, setDateRange] = useState<DateRange>({ from: startOfToday(), to: endOfToday() })
  const [filters, setFilters] = useState<TFilter>({
    rangeEnds: format(endOfToday(), 'yyyy-MM-dd HH:mm:ss'),
    rangeStarts: format(startOfToday(), 'yyyy-MM-dd HH:mm:ss'),
  });

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomers([])
      setShowCustomerList(false)
      return
    }

    setIsSearching(true)
    try {
      const { data } = await axios.post('/api/customers/search', { search: query })

      setCustomers(data)
      setShowCustomerList(true)
    } catch (error) {
      console.error('Error searching customers:', error)
    } finally {
      if (selectedCustomer) {
        loadCustomerStatement()
      }
      setIsSearching(false)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchQuery(`${customer.first_name} ${customer.last_name || ''}`.trim())
    setShowCustomerList(false)
    setCustomerStatement(null)
  }

  const loadCustomerStatement = async () => {
    if (!selectedCustomer) return

    setIsLoading(true)
    try {
      const { data } = await axios.post(`/api/reports/customers-statement/${selectedCustomer.id}`, filters)
      setCustomerStatement(data)
    } catch (error) {
      console.error('Error loading customer statement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchCustomers(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  return (
    <AppLayout breadcrumbs={[]}>
      <div className="min-h-screen p-4">

        <div className="rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 rounded-t-lg">
            <h1 className="text-2xl font-semibold">Customers Statement</h1>
            <p className="text-sm mt-1">Display the complete customer statement.</p>
          </div>

          <div className="p-4">
            {/* Date Range and Action Buttons */}
            {/* Date Range and Load Button */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-fit">
                <DateRangePicker
                  onDateRangeChange={(dateRange) => {
                    if (!dateRange) return
                    setDateRange(dateRange)
                    setFilters({ ...filters, rangeStarts: format(dateRange?.from!, 'yyyy-MM-dd HH:mm:ss'), rangeEnds: format(dateRange?.to!.setHours(23, 59, 59), 'yyyy-MM-dd HH:mm:ss') })
                  }}
                  dateRange={dateRange}
                />
              </div>
              <Button onClick={() => loadCustomerStatement()} disabled={!selectedCustomer} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                Load
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>

            {/* Customer Search */}
            <div className="mb-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Customer Search Results */}
              {showCustomerList && customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.email} • {customer.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Info - Only show when customer is selected */}
            <div className="mb-6 space-y-1 text-sm text-muted-foreground dark:text-gray-400">
              <p>
                <span className="font-medium">Range :</span> {filters.rangeStarts} — {filters.rangeEnds}
              </p>
              <p>
                <span className="font-medium">Document :</span> Customer Statement
              </p>
              <p>
                <span className="font-medium">Customer :</span> {selectedCustomer ? `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}` : 'N/A'}
              </p>
              <p>
                <span className="font-medium">By :</span> {auth.user.username}
              </p>
            </div>

            {/* Summary Section - Only show when customer statement is loaded */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {/* Total Purchases Card */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Purchases</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(customerStatement?.purchases_amount || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Due Amount Card */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 dark:from-orange-950/50 dark:to-orange-900/50 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Due Amount</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(Math.abs(customerStatement?.owed_amount || 0))}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Wallet Balance</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(customerStatement?.account_amount || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Credit Limit Card */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 dark:from-purple-950/50 dark:to-purple-900/50 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Credit Limit</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(customerStatement?.credit_limit_amount || 0)}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Total Orders Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 dark:from-gray-800/50 dark:to-gray-700/50 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerStatement?.total_orders || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-500 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table - Only show when customer statement is loaded */}
            {customerStatement && customerStatement.orders.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3">
                  <h3 className="text-lg font-semibold text-center">Orders</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Order</TableHead>
                      <TableHead className="dark:text-gray-300">Type</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerStatement.orders.map((order) => (
                      <TableRow key={order.id} className="dark:border-gray-700">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {order.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {order.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Empty State */}
            {!selectedCustomer && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Customer Selected</h3>
                <p className="text-gray-500 dark:text-gray-400">Search and select a customer to view their statement.</p>
              </div>
            )}

            {/* Loading State */}
            {selectedCustomer && !customerStatement && isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading customer statement...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


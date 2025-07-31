"use client"

import { useEffect, useState } from "react"
import { Eye, Search, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/utils/format"
import axios from "axios"
import { cn } from "@/lib/utils"

interface SelectCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCustomer: Customer | null
  onViewCustomer: (customer: Customer) => void
  handleSelectCustomer: (customer: Customer) => void
}

export function SelectCustomerDialog({
  open,
  onOpenChange,
  selectedCustomer,
  handleSelectCustomer,
  onViewCustomer,
}: SelectCustomerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/customers/recently-active")
      setCustomers(res.data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) return
    setLoading(true)
    try {
      // /api/customers/search
      const res = await axios.post('/api/customers/search', { search: query })
      if (res.data) {
        setCustomers(res.data)
      }
    } catch (error) {
      console.error("Error searching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCustomers()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-[50vw] sm:max-w-[50vw] max-h-[90vh] w-[50vw] h-[90vh] flex flex-col")}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">Select Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {selectedCustomer && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Selected :</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {selectedCustomer.first_name} {selectedCustomer.last_name || ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full border"
                  onClick={() => onViewCustomer(selectedCustomer)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Customer"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading customers...</span>
              </div>
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <div key={customer.id} className="border rounded-md p-3 hover:bg-muted" onClick={() => handleSelectCustomer(customer)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name || ""}
                      </div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(+customer.purchases_amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 rounded-full border"
                        onClick={() => onViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4">
                {searchQuery ? "No customers found matching your search." : "No customers available."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


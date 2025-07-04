
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/utils/format"
import axios from "axios"
import { useEffect, useState } from "react"

interface CustomerDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("customer-account")
  const [activeSubTab, setActiveSubTab] = useState("orders")
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orders, setOrders] = useState<CustomerOrder[]>([])

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true)
    try {
      // /api/customers/73/orders
      const res = await axios.get(`/api/customers/${customer?.id}/orders`)
      setOrders(res.data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (open && customer && (activeTab === "customer-account" && activeSubTab === "orders")) {
      fetchCustomerOrders()
    }
  }, [open, activeTab, activeSubTab, customer])

  if (!customer) {
    return null
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">Customers</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          <Tabs defaultValue="customer-account" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-customer">New Customer</TabsTrigger>
              <TabsTrigger value="customer-account">Customer Account</TabsTrigger>
            </TabsList>

            <TabsContent value="customer-account" className="space-y-4">
              <div className="p-4 rounded-lg">
                <h3 className="font-medium mb-4">
                  Summary For : {customer.first_name} {customer.last_name || ""}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-500 text-white p-3 rounded-lg text-center">
                    <div className="text-sm font-medium">Purchases</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.purchases_amount)}</div>
                  </div>
                  <div className="bg-red-500 text-white p-3 rounded-lg text-center">
                    <div className="text-sm font-medium">Owed</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.owed_amount)}</div>
                  </div>
                  <div className="bg-blue-500 text-white p-3 rounded-lg text-center">
                    <div className="text-sm font-medium">Wallet Amount</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.account_amount)}</div>
                  </div>
                  <div className="bg-teal-500 text-white p-3 rounded-lg text-center">
                    <div className="text-sm font-medium">Credit Limit</div>
                    <div className="text-lg font-bold">{formatCurrency(customer.credit_limit_amount)}</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="orders" className="w-full" onValueChange={setActiveSubTab} value={activeSubTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="wallet-history">Wallet History</TabsTrigger>
                  <TabsTrigger value="coupons">Coupons</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                  <h4 className="font-medium px-2 mt-4">Last Purchases</h4>

                  {loadingOrders ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-gray-600">Loading orders...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 p-3 font-medium text-gray-700 text-center">
                        <div>Order</div>
                        <div>Options</div>
                      </div>

                      <div className="divide-y max-h-64 overflow-y-auto">
                        {orders.length > 0 ? (
                          orders.map((order) => (
                            <div key={order.id} className="grid grid-cols-2 p-3 items-center">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-800">Code: {order.code}</div>
                                <div className="text-sm text-gray-600">
                                  Total: {formatCurrency(order.total)} | Status: {order.human_status}
                                </div>
                                <div className="text-sm text-gray-600">Delivery: {order.human_delivery_status}</div>
                                <div className="text-sm text-gray-500">Date: {formatDate(order.created_at)}</div>
                              </div>
                              <div className="text-center">
                                <Button variant="outline" size="sm">
                                  Options
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500">No orders found for this customer.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700">Account Transaction</Button>
                  </div>
                </TabsContent>

                <TabsContent value="wallet-history" className="space-y-4">
                  <div className="text-center text-gray-500 p-8">Wallet history functionality coming soon.</div>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-4">
                  <div className="text-center text-gray-500 p-8">Coupons functionality coming soon.</div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4">
                  <div className="text-center text-gray-500 p-8">Rewards functionality coming soon.</div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="new-customer" className="space-y-4">
              <div className="text-center text-gray-500 p-8">New customer form coming soon.</div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

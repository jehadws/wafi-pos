import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { InertiaFormProps } from "@inertiajs/react"
import { ScrollArea } from "../ui/scroll-area"
import ConfirmationDialog from "../confirmation-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "../ui/separator"
import axios from "axios"
import { Input } from "../ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import OrderCard from "./order-card"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: InertiaFormProps<OrderFormValuesType>
}

export function OrdersDialog({ open, onOpenChange, form }: Props) {
  const [isOpenOrderOpen, setIsOpenOrderOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [loading, setLoading] = useState(false)
  const [onHoldOrders, setOnHoldOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 })
  const [unpaidOrders, setUnpaidOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 })
  const [partiallyPaidOrders, setPartiallyPaidOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 })


  const getOnHoldOrders = async (search?: string, page = 1) => {
    setLoading(true)
    try {
      const res = await axios.get("/api/crud/ns.hold-orders", {
        params: { search, page },
      })
      setOnHoldOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page })
      console.log("onHoldOrders", res.data)
    } catch (error) {
      console.error("Error fetching On Hold Orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUnpaidOrders = async (search?: string, page = 1) => {
    setLoading(true)
    try {
      const res = await axios.get("/api/crud/ns.unpaid-orders", {
        params: { search, page },
      })
      setUnpaidOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page })
      console.log("unpaidOrders", res.data.data)
    } catch (error) {
      console.error("Error fetching Unpaid Orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPartiallyPaidOrders = async (search?: string, page = 1) => {
    setLoading(true)
    try {
      const res = await axios.get("/api/crud/ns.partially-paid-orders", {
        params: { search, page },
      })
      console.log("partiallyPaidOrders", res.data.data)
      setPartiallyPaidOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page })
    } catch (error) {
      console.error("Error fetching Partially Paid Orders:", error)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    if (open) {
      getOnHoldOrders()
    }
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-[50vw] sm:max-w-[50vw] max-h-[90vh] w-[50vw] h-[90vh] flex flex-col")}>
          <DialogTitle>Orders</DialogTitle>
          <DialogDescription className="sr-only">Orders</DialogDescription>
          <Tabs defaultValue="on-hold" className={cn("flex-1")}>
            <TabsList>
              <TabsTrigger value="on-hold"
                onClick={() => {
                  setSearchQuery("")
                  getOnHoldOrders()
                }}
              >
                On Hold
              </TabsTrigger>
              <TabsTrigger value="unpaid"
                onClick={() => {
                  setSearchQuery("")
                  getUnpaidOrders()
                }}
              >
                Unpaid
              </TabsTrigger>
              <TabsTrigger value="partially-paid"
                onClick={() => {
                  setSearchQuery("")
                  getPartiallyPaidOrders()
                }}
              >
                Partially Paid
              </TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value={"on-hold"} className={cn("flex-1 flex flex-col")}>
              <div className="relative w-full flex flex-row items-center gap-2">
                <Input
                  placeholder="Search Orders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && getOnHoldOrders(searchQuery)}
                />
                <Button onClick={() => getOnHoldOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="flex-1 min-h-[150px]">
                    <div className="flex flex-col gap-3 flex-1">
                      {onHoldOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} form={form} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => getOnHoldOrders(searchQuery, Math.max(onHoldOrders.page - 1, 1))} />
                      </PaginationItem>
                      {Array.from({ length: onHoldOrders.lastPage }, (_, i) => i + 1)
                        .map(num =>
                          <PaginationItem key={num}>
                            <PaginationLink
                              onClick={() => setOnHoldOrders(prev => ({ ...prev, page: num }))}
                              isActive={num === onHoldOrders.page}
                            >
                              {num}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                      <PaginationItem>
                        <PaginationNext onClick={() => getOnHoldOrders(searchQuery, Math.min(onHoldOrders.page + 1, onHoldOrders.lastPage))} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}
              {loading && (
                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="unpaid" className={cn("flex-1 flex flex-col")}>
              <div className="relative w-full flex flex-row items-center gap-2">
                <Input
                  placeholder="Search Orders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && getUnpaidOrders(searchQuery)}
                />
                <Button onClick={() => getUnpaidOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="flex-1 min-h-[150px]">
                    <div className="flex flex-col gap-3">
                      {unpaidOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} form={form} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => getUnpaidOrders(searchQuery, Math.max(unpaidOrders.page - 1, 1))} />
                      </PaginationItem>
                      {Array.from({ length: unpaidOrders.lastPage }, (_, i) => i + 1)
                        .map(num =>
                          <PaginationItem key={num}>
                            <PaginationLink
                              onClick={() => setUnpaidOrders(prev => ({ ...prev, page: num }))}
                              isActive={num === unpaidOrders.page}
                            >
                              {num}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                      <PaginationItem>
                        <PaginationNext onClick={() => getUnpaidOrders(searchQuery, Math.min(unpaidOrders.page + 1, unpaidOrders.lastPage))} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}
              {loading && (
                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>


            <TabsContent value="partially-paid" className={cn("flex-1 flex flex-col")}>
              <div className="relative w-full flex flex-row items-center gap-2">
                <Input
                  placeholder="Search Orders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && getPartiallyPaidOrders(searchQuery)}
                />
                <Button onClick={() => getPartiallyPaidOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="flex-1 min-h-[150px]">
                    <div className="flex flex-col gap-3 h-full">
                      {partiallyPaidOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} form={form} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => getPartiallyPaidOrders(searchQuery, Math.max(partiallyPaidOrders.page - 1, 1))} />
                      </PaginationItem>
                      {Array.from({ length: partiallyPaidOrders.lastPage }, (_, i) => i + 1)
                        .map(num =>
                          <PaginationItem key={num}>
                            <PaginationLink
                              onClick={() => setPartiallyPaidOrders(prev => ({ ...prev, page: num }))}
                              isActive={num === partiallyPaidOrders.page}
                            >
                              {num}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                      <PaginationItem>
                        <PaginationNext onClick={() => getPartiallyPaidOrders(searchQuery, Math.min(partiallyPaidOrders.page + 1, partiallyPaidOrders.lastPage))} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}


              {loading && (
                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <ConfirmationDialog
            isOpen={isOpenOrderOpen}
            onClose={() => setIsOpenOrderOpen(false)}
            onConfirm={() => {
              setIsOpenOrderOpen(false)
            }}
            title="Confirm Your Action"
            description="The cart is not empty. Opening an order will clear your cart would you proceed?"
          />

        </DialogContent>
      </Dialog>
    </>
  )
}

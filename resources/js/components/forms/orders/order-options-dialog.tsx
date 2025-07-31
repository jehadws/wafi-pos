import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import axios from "axios";
import { useEffect, useState } from "react";

type Props = {
  options: { isOpen: boolean, id: number | null }
  setOptions: (value: { isOpen: boolean, id: number | null }) => void
}

export default function OrderOptionsDialog({ options, setOptions }: Props) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const handleFetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/orders/${options.id}`);
      console.log("Order", res.data);
      setOrder(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (options.id) {
      handleFetchOrder();
    }
  }, [options.id])

  return (
    <Dialog open={options.isOpen} onOpenChange={() => setOptions({ ...options, isOpen: false })}>
      <DialogContent className={cn("max-w-[70vw] sm:max-w-[70vw] w-[70vw] max-h-[80vh] sm:max-h-[80vh] h-[80vh] flex flex-col")}>
        <DialogTitle>Order Options</DialogTitle>
        <DialogDescription className="sr-only">Order Options</DialogDescription>
        <div>
          <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded border">
                <span className="font-medium">Sub Total</span>
                <span className="font-semibold">{formatCurrency(order?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/60 rounded  border border-primary">
                <span className="font-medium">Shipping</span>
                <span className="font-semibold">{formatCurrency(order?.shipping || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/60 rounded  border border-success">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{formatCurrency(order?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-danger/50 rounded border border-danger">
                <span className="font-medium">Change</span>
                <span className="font-semibold">{formatCurrency(order?.change || 0)}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-error/30 rounded border border-error/60">
                <span className="font-medium">Discount</span>
                <span className="font-semibold">{formatCurrency(order?.discount || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded border">
                <span className="font-medium">Coupons</span>
                <span className="font-semibold">{formatCurrency(order?.total_coupons || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded border">
                <span className="font-medium">Taxes</span>
                <span className="font-semibold">{formatCurrency(order?.tax_value || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-info/60 rounded border border-info">
                <span className="font-medium">Paid</span>
                <span className="font-semibold">{formatCurrency(order?.tendered || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Order Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">Customer</span>
                <span className="font-semibold">
                  {order?.customer.first_name} {order?.customer.last_name || ""}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">Type</span>
                <span className="font-semibold">{order?.type}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">Delivery Status</span>
                <span className="font-semibold">
                  {order?.delivery_status === "not-available" ? "Not Available" : order?.delivery_status}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">Processing Status</span>
                <span className="font-semibold">
                  {order?.process_status === "not-available" ? "Not Available" : order?.process_status}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">Payment Status</span>
                <span className="font-semibold">{order?.payment_status}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <div className="space-y-3">
              {order?.products?.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-muted rounded">
                  <div>
                    <div className="font-medium">
                      {product.name} (x{product.quantity})
                    </div>
                    <div className="text-sm">{product.unit_name}</div>
                  </div>
                  <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                </div>
              ))}
            </div>

            {/* Refunded Products */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Refunded Products</h3>
                <span className="text-sm font-medium ">All Refunds</span>
              </div>
              {order?.refunded_products?.length === 0 ? (
                <div className="p-3 rounded text-center">No refunded products</div>
              ) : (
                <div className="space-y-3">
                  {order?.refunded_products?.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm">{product.unit_name}</div>
                      </div>
                      <span className="font-semibold">{formatCurrency(product.total_price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-auto">
          <div className="flex w-full flex-row items-center justify-end mt-2">
            <Button onClick={() => { }} variant={"default"}>Print</Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}


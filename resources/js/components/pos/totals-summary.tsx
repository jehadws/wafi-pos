import { Separator } from "../ui/separator"

interface TotalsSummaryProps {
  subtotal: number
  tax: number
  discount: number
  total: number
  shipping: number
  customer: Customer | null
  orderType: OrderTypeObj | null
  onOpenDiscountDialog: () => void
  onOpenShippingDialog: () => void
  onOpenOrderTypeDialog: () => void
  onOpenSelectCustomerDialog: () => void
}

export default function TotalsSummary({
  subtotal,
  orderType,
  tax,
  shipping,
  discount,
  total,
  customer,
  onOpenDiscountDialog,
  onOpenShippingDialog,
  onOpenOrderTypeDialog,
  onOpenSelectCustomerDialog
}: TotalsSummaryProps) {
  return (
    <div className="border-t bg-card">
      <div className="grid grid-cols-3 border-b text-sm">
        <div className="col-span-2 border-r p-2">Product Taxes</div>
        <div className="text-right col-span-1 p-2">${tax.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-3 border-b text-sm">
        <div className="p-2 border-r underline decoration-dashed decoration-primary cursor-pointer underline-offset-4" onClick={onOpenSelectCustomerDialog}>
          Customer: {customer ? `${customer.first_name} ${customer.last_name}` : "N/A"}
        </div>
        <div className="p-2 border-r">Sub Total</div>
        <div className="text-right p-2">${subtotal.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-3 border-b text-sm">
        <div className="p-2 border-r underline decoration-dashed decoration-primary cursor-pointer underline-offset-4" onClick={onOpenOrderTypeDialog}>
          Type: {orderType ? orderType.label : "N/A"}
        </div>
        <div className="p-2 border-r">Discount</div>
        <div className="text-right p-2 underline decoration-dashed decoration-primary cursor-pointer underline-offset-4" onClick={onOpenDiscountDialog}>${discount.toFixed(2)}</div>
      </div>

      {orderType?.identifier === "delivery" && (
        <div className="grid grid-cols-3 border-b text-sm">
          <div></div>
          <div className="border-r border-l p-2 underline decoration-dashed decoration-primary cursor-pointer underline-offset-4" onClick={onOpenShippingDialog}>Shipping</div>
          <div className="text-right p-2">${shipping.toFixed(2)}</div>
        </div>
      )}
      <div className="grid grid-cols-3 bg-muted/30 text-sm font-medium">
        <div></div>
        <div className="border-r border-l p-2">Total</div>
        <div className="text-right p-2">${total.toFixed(2)}</div>
      </div>
    </div>
  )
}

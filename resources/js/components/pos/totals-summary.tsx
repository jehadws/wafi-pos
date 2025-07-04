interface TotalsSummaryProps {
  subtotal: number
  tax: number
  discount: number
  total: number
  customer: Customer | null
  orderType: OrderTypeObj | null
  onOpenDiscountDialog: () => void
}

export default function TotalsSummary({ subtotal, orderType, tax, discount, total, customer, onOpenDiscountDialog }: TotalsSummaryProps) {
  return (
    <div className="border-t bg-card">
      <div className="grid grid-cols-2 border-b p-3 text-sm">
        <div>Product Taxes</div>
        <div className="text-right">${tax.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 border-b p-3 text-sm">
        <div>Customer: {customer ? `${customer.first_name} ${customer.last_name}` : "N/A"}</div>
        <div className="text-right">Sub Total: ${subtotal.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 border-b p-3 text-sm">
        <div>Type: {orderType ? orderType.label : "N/A"}</div>
        <div className="text-right underline decoration-dashed decoration-primary cursor-pointer underline-offset-4" onClick={onOpenDiscountDialog}>Discount: ${discount.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-2 bg-muted/30 p-3 text-sm font-medium">
        <div>Total</div>
        <div className="text-right">${total.toFixed(2)}</div>
      </div>
    </div>
  )
}

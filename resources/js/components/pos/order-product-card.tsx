import { formatCurrency } from "@/utils/format"

export default function OrderProductCard({ orderProduct }: { orderProduct: TOrderProducts }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-medium">{orderProduct.name} (x{orderProduct.quantity})</span>
          <span className="font-medium text-muted-foreground">Unit: {orderProduct.unit.name}</span>
        </div>
        <span className="text-xl font-bold text-foreground">
          {formatCurrency(orderProduct.total_price)}
        </span>
      </div>
    </div>
  )
}

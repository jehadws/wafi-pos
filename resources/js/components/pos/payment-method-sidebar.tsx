import { cn } from "@/lib/utils"
import { PAYMENT_METHODS } from "./payment-gateway-dialog"

interface PaymentMethodSidebarProps {
  selectedTab: PaymentTypes | "payment-list"
  onTabSelect: (method: PaymentTypes | "payment-list") => void
  totalPayment: number
}

export function PaymentMethodSidebar({ selectedTab, onTabSelect, totalPayment }: PaymentMethodSidebarProps) {
  return (
    <div className="w-48 h-full border-r border-border">
      <div className="p-2 space-y-1">
        {Object.entries(PAYMENT_METHODS).map(([identifier, label]) => (
          <button
            key={identifier}
            onClick={() => onTabSelect(identifier)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm relative text-foreground",
              selectedTab === identifier
                ? "text-primary bg-primary/10 shadow-sm"
                : "hover:bg-muted/60",
            )}
          >
            {label}
          </button>
        ))}

        <button
          key={"list"}
          onClick={() => onTabSelect("payment-list")}
          className={cn(
            "w-full text-left px-3 py-2 rounded text-sm relative text-foreground",
            selectedTab === "payment-list"
              ? "text-primary bg-primary/10 shadow-sm"
              : "hover:bg-muted/60",
          )}
        >
          Payment List
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalPayment}
          </span>
        </button>
      </div>
    </div>
  )
}

import { ShoppingBasket, Bike } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface OrderTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectOrderType: (type: OrderTypeObj) => void
  orderType: OrderTypeObj | null
}

const OrderTypes = [
  {
    identifier: "takeaway",
    label: "Take Away",
    icon: "/images/groceries.png",
    selected: false
  },
  {
    identifier: "delivery",
    label: "Delivery",
    icon: "/images/delivery.png",
    selected: false
  }
]

export function OrderTypeDialog({ open, onOpenChange, orderType, onSelectOrderType }: OrderTypeDialogProps) {
  const handleSelectType = (type: "takeaway" | "delivery") => {
    if (type === "takeaway") {
      onSelectOrderType({ identifier: "takeaway", label: "Take Away", icon: "/images/groceries.png", selected: true })
    } else {
      onSelectOrderType({ identifier: "delivery", label: "Delivery", icon: "/images/delivery.png", selected: true })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">Define The Order Type</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border">
          {/* Take Away Option */}
          <button
            onClick={() => handleSelectType("takeaway")}
            className={cn("group relative flex flex-col items-center justify-center p-8 hover:bg-primary/80 transition-colors focus:outline-none focus:ring-blue-500",
              orderType?.identifier === "takeaway" ? "bg-primary" : "")}
          >
            <div className="mb-4 relative">
              {/* Shopping basket with groceries illustration */}
              <div className="relative">
                <ShoppingBasket className="h-16 w-16 text-white" />
                {/* Decorative food items */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full"></div>
                <div className="absolute -top-1 left-2 w-4 h-6 bg-green-400 rounded-t-full"></div>
                <div className="absolute top-1 right-1 w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="absolute -left-1 top-2 w-5 h-4 bg-yellow-300 rounded"></div>
              </div>
            </div>
            <span className="text-lg font-medium">Take Away</span>
          </button>

          {/* Delivery Option */}
          <button
            onClick={() => handleSelectType("delivery")}
            className={cn("group relative flex flex-col items-center justify-center p-8 hover:bg-primary/80 transition-colors focus:outline-none focus:ring-blue-500",
              orderType?.identifier === "delivery" ? "bg-primary" : "")}
          >
            <div className="mb-4 relative">
              {/* Delivery scooter illustration */}
              <div className="relative">
                <Bike className="h-16 w-16 text-red-500" />
                {/* Delivery person */}
                <div className="absolute -top-4 -left-2 w-6 h-6 bg-red-400 rounded-full"></div>
                <div className="absolute -top-2 -left-1 w-4 h-4 bg-pink-300 rounded-full"></div>
                {/* Delivery box */}
                <div className="absolute -right-3 -top-1 w-4 h-3 bg-red-500 rounded"></div>
              </div>
            </div>
            <span className="text-lg font-medium">Delivery</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


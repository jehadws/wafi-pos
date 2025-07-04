"use client"

import { useState } from "react"
import { ShoppingBasket, Bike } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface OrderTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectOrderType: (type: "takeaway" | "delivery") => void
}

export function OrderTypeDialog({ open, onOpenChange, onSelectOrderType }: OrderTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<"takeaway" | "delivery" | null>(null)

  const handleSelectType = (type: "takeaway" | "delivery") => {
    setSelectedType(type)
    onSelectOrderType(type)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-gray-800">Define The Order Type</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border">
          {/* Take Away Option */}
          <button
            onClick={() => handleSelectType("takeaway")}
            className="group relative flex flex-col items-center justify-center p-8 bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
            className="group relative flex flex-col items-center justify-center p-8 bg-gray-50 text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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


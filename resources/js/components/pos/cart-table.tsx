"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import CartItemComponent from "@/components/pos/cart-item"

interface CartTableProps {
  cart: CartProduct[]
  removeFromCart: (product: CartProduct) => void
  updateQuantity: (product: CartProduct, quantity: number) => void
  updatePrice: (product: CartProduct, price: number) => void
  updateDiscountPercentage: (product: CartProduct, price: number) => void
  clearCart: () => void
  removeSelectedItems: () => void
  selectedItems: string[]
  toggleItemSelection: (productId: string) => void
  selectAllItems: () => void
  deselectAllItems: () => void
}

export default function CartTable({
  cart,
  removeFromCart,
  updateQuantity,
  updatePrice,
  clearCart,
  updateDiscountPercentage,
  removeSelectedItems,
  selectedItems,
  toggleItemSelection,
  selectAllItems,
  deselectAllItems,
}: CartTableProps) {
  const allSelected = cart.length > 0 && selectedItems.length === cart.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < cart.length

  return (
    <div className="flex flex-col h-full">
      {cart.length > 0 && (
        <div className="border-b p-2 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected
                }
              }}
              onChange={() => {
                if (allSelected) {
                  deselectAllItems()
                } else {
                  selectAllItems()
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">
              {selectedItems.length > 0
                ? `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`
                : "Select items"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedItems.length > 0 && (
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={removeSelectedItems}>
                <Trash2 className="h-3 w-3 mr-1" />
                Remove Selected
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearCart}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-[150px]">
        {cart.length > 0 ? (
          <div className="pb-12">
            {cart.map((item) => (
              <div key={item._uuid} className="flex items-center  border-b">
                <div className="pl-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._uuid)}
                    onChange={() => toggleItemSelection(item._uuid)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <CartItemComponent
                    key={item.product_id}
                    item={item}
                    updatePrice={updatePrice}
                    updateDiscountPercentage={updateDiscountPercentage}
                    removeFromCart={removeFromCart}
                    updateQuantity={updateQuantity}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">No products added...</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

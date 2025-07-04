import type React from "react"

import { useState } from "react"
import { Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/utils/format"

interface CartItemProps {
  item: CartProduct
  removeFromCart: (product: CartProduct) => void
  updateQuantity: (product: CartProduct, quantity: number) => void
}

export default function CartItem({ item, removeFromCart, updateQuantity }: CartItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [quantityInput, setQuantityInput] = useState(item.quantity.toString())

  const handleIncrement = () => {
    updateQuantity(item, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item, item.quantity - 1)
    } else {
      removeFromCart(item)
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setQuantityInput(value)
  }

  const handleQuantityBlur = () => {
    const newQuantity = Number.parseInt(quantityInput)
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateQuantity(item, newQuantity)
    } else {
      // Reset to current quantity if invalid
      setQuantityInput(item.quantity.toString())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleQuantityBlur()
    } else if (e.key === "Escape") {
      setQuantityInput(item.quantity.toString())
      setIsEditing(false)
    }
  }

  return (
    <div className="grid grid-cols-14 text-sm h-14 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-10 h-10 flex flex-row items-center justify-start px-2 py-2">
        <div className="flex flex-col">
          <p className="font-medium text-[18px]">{item.name} -- {item.unit_name}</p>
          <div className="flex flex-row gap-4">
            <p className=" text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted underline-offset-3 decoration-1">
              Price: {formatCurrency(item.unit_price)}
            </p>
            <p className=" text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted underline-offset-3 decoration-1">
              Discount {item.discount_percentage}%: {formatCurrency(item.discount)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive ml-auto hover:text-destructive/80 hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            removeFromCart(item)
          }}
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="col-span-2 border-l flex items-center justify-center space-x-1 h-14">
        {isEditing ? (
          <Input
            type="text"
            value={quantityInput}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            onKeyDown={handleKeyDown}
            className="h-7 w-12 text-center p-1"
            autoFocus
          />
        ) : (
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span
              className="mx-2 min-w-[20px] text-center cursor-pointer"
              onClick={() => setIsEditing(true)}
              title="Click to edit quantity"
            >
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="col-span-2 text-center border-l h-14 flex items-center justify-center">${(item.price_without_tax * item.quantity).toFixed(2)}</div>
    </div>
  )
}

import type React from "react"

import { useState } from "react"
import { Trash2, Plus, Minus, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/utils/format"
import { useNumericKeypad } from "@/hooks/use-numeric-keypad"
import { NumericKeypadDialog } from "../ui/numeric-keypad-dialog"
import { usePage } from "@inertiajs/react"
import { toast } from "sonner"
import { useConfirmDialog } from "../providers/confirm-dialog-provider"

interface CartItemProps {
  item: CartProduct
  removeFromCart: (product: CartProduct) => void
  updateQuantity: (product: CartProduct, quantity: number) => void
  updatePrice: (product: CartProduct, price: number) => void
  updateDiscountPercentage: (product: CartProduct, price: number) => void
}

export default function CartItem({ item, updateDiscountPercentage, updatePrice, removeFromCart, updateQuantity }: CartItemProps) {
  const { options } = usePage<{ options: NsPosOptions }>().props;
  const confirm = useConfirmDialog();
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

  const handleChangePrice = (price: string) => {
    updatePrice(item, Number.parseFloat(price))
  }

  const handleChangePercentage = (discount: string) => {
    updateDiscountPercentage(item, Number.parseFloat(discount))

  }

  const discountKeypad = useNumericKeypad({
    onConfirm: handleChangePercentage,
    initialValue: "",
    title: "Product Discount",
    maxLength: 6,
    allowDecimal: true,
  });

  const priceKeypad = useNumericKeypad({
    onConfirm: handleChangePrice,
    initialValue: "",
    title: "Product Price",
    maxLength: 6,
    allowDecimal: true,
  });


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

  const allowQuantityModification = (product: CartProduct) => {
    return product.product_type === 'product';
  }

  const toggleMode = async (product: CartProduct, index: number) => {
    if (!options.ns_jgrem_allow_wholesale_price) {
      return toast('Unable to change the price mode. This feature has been disabled.');
    }

    if (product.mode === 'normal') {
      const ok = await confirm({
        title: `Are you sure you want to switch to ${product.mode} price?`,
        message: `The price of ${product.name} will be ${product.unit_price} ${product.unit_name} for all sales. You can change the price later.`,
        confirmText: "Yes",
        cancelText: "No",
      })
      if (ok) {
        // POS.updateProduct(product, { mode: 'wholesale' }, index);
      }
    } else {
      const ok = await confirm({
        title: `Are you sure you want to switch to ${product.mode} price?`,
        message: `The price of ${product.name} will be ${product.unit_price} ${product.unit_name} for all sales. You can change the price later.`,
        confirmText: "Yes",
        cancelText: "No",
      })
      if (ok) {
        // POS.updateProduct(product, { mode: 'normal' }, index);
      }
    }
  }

  return (
    <div className="grid grid-cols-14 text-sm h-14 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-10 h-10 flex flex-row items-center justify-start px-2 py-2">
        <div className="flex flex-col">
          <p className="font-medium text-[18px]">{item.name} -- {item.unit_name}</p>
          <div className="flex flex-row gap-4">
            <p onClick={() => priceKeypad.openKeypad()} className=" text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted underline-offset-3 decoration-1">
              Price: {formatCurrency(item.price_without_tax)}
            </p>
            <p onClick={() => discountKeypad.openKeypad()} className=" text-muted-foreground hover:text-primary hover:decoration-primary underline decoration-dotted underline-offset-3 decoration-1">
              Discount {item.discount_percentage}%: {formatCurrency(item.discount)}
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              removeFromCart(item)
            }}
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-6 w-6" />
          </Button>
          {options.ns_jgrem_allow_wholesale_price && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-green-500/80 hover:bg-green-500/10"
              onClick={(e) => {
                e.stopPropagation()
                // toggleMode(product, index)
              }}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Award className="h-6 w-6" />
            </Button>
          )}
        </div>
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
      <div className="col-span-2 text-center border-l h-14 flex items-center justify-center">${(item.total_price_without_tax).toFixed(2)}</div>
      <NumericKeypadDialog {...discountKeypad.keypadProps} />
      <NumericKeypadDialog {...priceKeypad.keypadProps} />
    </div>
  )
}

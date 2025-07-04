"use client"

import { useState } from "react"
import { Search, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { useNumericKeypad } from "@/hooks/use-numeric-keypad"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { NumericKeypadDialog } from "../ui/numeric-keypad-dialog"

interface SearchProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductSelected: (product: CartProduct) => void
}

export function SearchProductsDialog({
  open,
  onOpenChange,
  onProductSelected,
}: SearchProductsDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectProduct, setSelectProduct] = useState<Product>()
  const [quantities, setQuantities] = useState<UnitQuantity[]>()
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity>()
  const [quantity, setQuantity] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)


  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) return
    setLoading(true)

    try {
      const res = await axios.post('/api/products/search', { search: query })
      if (res.data) {
        setProducts(res.data)
      }
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUnit = (quantity: string) => {
    setIsOpen(false)
    setQuantity(quantity)
    if (selectedUnitQuantity && selectProduct) {
      if (selectedUnitQuantity?.quantity < parseInt(quantity)) {
        console.log("quantity exceeds stock")
        return toast.warning("Quantity exceeds stock")
      }

      console.log("add to cart")
      onProductSelected({
        product_id: selectedUnitQuantity.product_id,
        name: selectProduct.name,
        discount_type: "percentage",
        discount: 0,
        discount_percentage: 0,
        product_type: selectProduct.type,
        rate: 0,
        quantity: parseInt(quantity),
        tax_group_id: 0,
        tax_type: "inclusive",
        tax_value: selectedUnitQuantity.sale_price_tax,
        unit_id: selectedUnitQuantity.unit.id,
        unit_price: selectedUnitQuantity.sale_price,
        price_with_tax: selectedUnitQuantity.sale_price_with_tax,
        price_without_tax: selectedUnitQuantity.sale_price_without_tax,
        unit_name: selectedUnitQuantity.unit.name,
        total_price: selectedUnitQuantity.sale_price * parseInt(quantity),
        total_price_without_tax: selectedUnitQuantity.sale_price_without_tax * parseInt(quantity),
        total_price_with_tax: selectedUnitQuantity.sale_price_with_tax * parseInt(quantity),
        mode: "normal",
        unit_quantity_id: selectedUnitQuantity.id,
        total_tax_value: selectedUnitQuantity.sale_price_tax * parseInt(quantity),
        _uuid: `${selectProduct.id}-${selectedUnitQuantity.unit.id}-${Date.now()}`,
      })
    }
  }

  const quantityKeypad = useNumericKeypad({
    onConfirm: handleSelectUnit,
    initialValue: quantity,
    title: "Define Quantity",
    maxLength: 6,
    allowDecimal: false,
  })


  const handleClickOnProduct = async (product: Product) => {
    setSelectProduct(product)
    try {
      setLoading(true)
      const res = await axios.get(`/api/products/${product.id}/units/quantities`)
      console.log("quantities", res.data)
      if (res.data && res.data.length > 0) {
        setQuantities(res.data)
        if (res.data.length > 1) {
          setIsOpen(true)
        } else {
          // add to cart
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Search Products</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Product"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading products...</span>
                </div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="border rounded-md p-3 hover:bg-muted" onClick={() => handleClickOnProduct(product)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {product.name || ""}
                        </div>
                        <div className="text-sm text-gray-500">{product.type}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4">
                  There is nothing to display. Have you started the search?
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectProduct?.name} - Select Quantity</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {quantities?.map((quantity) => (
              <div
                onClick={() => {
                  quantityKeypad.openKeypad()
                  setSelectedUnitQuantity(quantity)
                }}
                key={quantity.id}
                className="grid relative border font-medium text-sm cursor-pointer hover:bg-accent min-h-[120px] items-end"
              >
                <div className="absolute inset-0 z-10">
                  <img src={quantity.unit.preview_url || '/placeholder.svg'} className="w-full h-full" />
                </div>
                <div className="p-2 bg-muted/70 z-40 text-center hover:bg-accent/80">
                  <div className="text-lg font-semibold">{quantity.unit.name} ({quantity.quantity})</div>
                  <div className="text-sm font-medium">${quantity.sale_price_without_tax.toFixed(2)}</div>
                </div>
              </div>

            ))}
          </div>
          <DialogFooter>
            <Button type="button">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NumericKeypadDialog {...quantityKeypad.keypadProps} />
    </>
  )
}


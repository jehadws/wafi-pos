import axios from "axios"
import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { NumericKeypadDialog } from "@/components/ui/numeric-keypad-dialog"
import { useNumericKeypad } from "@/hooks/use-numeric-keypad"
import { toast } from "sonner"

interface ProductCatalogProps {
  products: Product[]
  addToCart: (product: CartProduct) => void
  selectedProducts: CartProduct[]
}

export default function ProductCatalog({ products, addToCart, selectedProducts }: ProductCatalogProps) {
  const [loading, setLoading] = useState(false)
  const [quantities, setQuantities] = useState<UnitQuantity[]>()
  const [selectProduct, setSelectProduct] = useState<Product>()
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity>()
  const [isOpen, setIsOpen] = useState(false)
  const [quantity, setQuantity] = useState("")

  const handleSelectUnit = (quantity: string) => {
    if (+quantity < 1) {
      return toast.warning("Quantity cannot be 0")
    }

    // check remaining stock

    setIsOpen(false)
    setQuantity(quantity)

    // if quantity 0 show warning
    // if quanity - existing product quantity show warning
    if (selectedUnitQuantity && selectProduct) {
      if (selectedUnitQuantity?.quantity < parseInt(quantity)) {
        return toast.warning("Quantity exceeds stock")
      }

      let quantityInCart = 0;
      selectedProducts.map((product) => {
        if (product.product_id === selectProduct?.id) {
          quantityInCart += product.quantity
        }
      })

      if (quantityInCart + parseInt(quantity) > selectedUnitQuantity?.quantity) {
        return toast.warning(`Unable to add the product, there is not enough stock. Remaining ${selectedUnitQuantity?.quantity - quantityInCart}`)
      }

      addToCart({
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
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 w-full h-full md:grid-cols-4">
        {products.length > 0 && (
          products.map((product) => (
            <div key={product.id} className="bg-muted/50 p-1 flex flex-col hover:bg-muted w-full h-full border" onClick={() => handleClickOnProduct(product)}>
              <img
                src={product.preview_url || "/placeholder.svg"}
                alt={product.name}
                className="object-cover flex-1"
              />
              <h1 className="text-lg font-bold text-center">{product.name}</h1>
            </div>
          ))
        )}
      </div>
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
        </DialogContent>
      </Dialog>

      <NumericKeypadDialog {...quantityKeypad.keypadProps} />

      {loading && <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-muted/50">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>}
    </>
  )
}

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Printer, Settings, Trash2 } from "lucide-react"
import axios from "axios"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import FormField from "@/components/forms/shared/form-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SelectedProduct extends ProductSearchResult {
  times: number
  selectedUnitQuantity: UnitQuantity | null
}

interface ProductSearchProps {
  selectedProducts: SelectedProduct[]
  onProductsChange: (products: SelectedProduct[]) => void
  onPrint: () => void
}
export function ProductSearch({ selectedProducts, onProductsChange, onPrint }: ProductSearchProps) {
  const [times, setTimes] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity | null>(null)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const { data } = await axios.post("/api/products/search", { search: query })
      console.log(data)
      setSearchResults(data)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const addProduct = (product: ProductSearchResult) => {
    setSelectedProduct({
      ...product,
      times: 1,
      selectedUnitQuantity: null,
    })
    setIsOpen(true)
    setSearchResults([])
    setShowResults(false)
    setSearchQuery("")
  }

  const handleConfirm = () => {
    if (selectedProduct) {
      const product: SelectedProduct = {
        ...selectedProduct,
        times,
        selectedUnitQuantity,
      }
      setSelectedProduct(product)
      setIsOpen(false)

      const productIndex = selectedProducts.findIndex((p) => p?.selectedUnitQuantity?.id === product?.selectedUnitQuantity?.id)
      console.log("prodcut index", productIndex)
      console.log("product", product)
      console.log("selected products", selectedProducts)
      console.log("times", times)
      console.log("selected unit quantity", selectedUnitQuantity)

      if (productIndex !== -1) {
        const updatedProducts = [...selectedProducts]
        updatedProducts[productIndex] = product
        onProductsChange(updatedProducts)
      } else {
        onProductsChange([...selectedProducts, product])
      }
    }
  }

  const handleRemoveProduct = (product: SelectedProduct) => {
    const updatedProducts = selectedProducts.filter((p) => p?.selectedUnitQuantity?.id !== product?.selectedUnitQuantity?.id)
    onProductsChange(updatedProducts)
  }

  const handleOpenSettings = (product: SelectedProduct) => {
    setIsOpen(true)
    setSelectedProduct(product)
    setTimes(product.times)
    setSelectedUnitQuantity(product.selectedUnitQuantity)
  }

  return (
    <>
      <div className="w-80 p-4 space-y-4 border-r">
        <div>
          <h3 className="font-semibold mb-3">Products</h3>

          {/* Search Input */}
          <div className="relative bg-background">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
            <Input
              placeholder="Search Products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full bg-background left-0 right-0 border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 cursor-pointer border-b last:border-b-0"
                    onClick={() => addProduct(product)}
                  >
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs">
                      {product.barcode}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Products */}
        <div>
          <h4 className="font-medium mb-2">Included Products</h4>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product.selectedUnitQuantity?.id} className="p-3 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm">
                      {product.name} ({product.selectedUnitQuantity?.unit.name}) x{product.times}
                    </div>
                    <div className="text-xs text-gray-500">{product.barcode}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-6 h-6 p-0"
                      onClick={() => handleOpenSettings(product)}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-6 h-6 p-0"
                      onClick={() => handleRemoveProduct(product)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Print Button */}
        <Button
          onClick={onPrint}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={selectedProducts.length === 0}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Labels
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DialogTitle className="text-left">Settings</DialogTitle>
              </div>
            </div>
            <DialogDescription className="sr-only">Settings</DialogDescription>
          </DialogHeader>
          <div>

            <FormField
              label="Unit"
              htmlFor="unit"
              description="Choose the unit to apply for the item"
            >
              <Select
                value={selectedUnitQuantity?.id.toString()}
                onValueChange={(value) => setSelectedUnitQuantity(selectedProduct?.unit_quantities.find(unitQuantity => unitQuantity.id === +value)!)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.unit_quantities?.map((unitQuantity) => (
                    <SelectItem key={unitQuantity.id} value={unitQuantity.id.toString()}>{unitQuantity.unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Quantity"
              htmlFor="quantity"
              description="Define how many time the product will be printed"
            >
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={times}
                onChange={(e) => setTimes(+e.target.value)}
              />
            </FormField>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


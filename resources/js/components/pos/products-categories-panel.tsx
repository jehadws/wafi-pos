import { ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import EmptyState from '../empty-state'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { NumericKeypadDialog } from '../ui/numeric-keypad-dialog'
import { useNumericKeypad } from '@/hooks/use-numeric-keypad'
import { usePOS } from '@/hooks/usePOS'
import SelectUnitQuantityDialog from './select-unit-quantity-dialog'

type Props = {
  addToCart: (product: CartProduct) => void
  selectedProducts: CartProduct[]
}

export default function ProductsCategoriesPanel({
  addToCart,
  selectedProducts
}: Props) {
  const { addToCart: addProductToCart, openDialog, options, processingAddQueue } = usePOS();
  const [categories, setCategories] = useState<CategoryProduct[]>([])
  const [breadcrumb, setBreadcrumb] = useState<CategoryProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(false)

  const [selectProduct, setSelectProduct] = useState<Product>()
  const [selectedUnitQuantity, setSelectedUnitQuantity] = useState<UnitQuantity>()

  const loadCategories = async (parent?: CategoryProduct) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/categories/pos/${parent ? parent.id : ''}`)
      console.log("categories", res.data)
      setCategories(res.data.categories)
      setProducts(res.data.products)
      updateBreadCrumb(res.data.currentCategory);
    } catch (error) {
      console.log("error", error)
    } finally {
      setLoading(false)
    }
  }

  const updateBreadCrumb = (parent: CategoryProduct) => {
    if (parent) {
      const index = breadcrumb.filter(bread => bread.id === parent.id);

      /**
       * this means, we're trying to navigate
       * through something that has already been
       * added to the breadcrumb
       */
      if (index.length > 0) {
        let allow = true;
        const prior = breadcrumb.filter(bread => {
          if (bread.id === index[0].id && allow) {
            allow = false;
            return true;
          }

          return allow;
        });
        setBreadcrumb(prior);
      } else {
        setBreadcrumb([...breadcrumb, parent]);
      }

    } else {
      setBreadcrumb([]);
    }
  }

  const hasCategories = () => {
    return categories.length > 0;
  }
  const hasProducts = () => {
    return products.length > 0;
  }


  const handleQuantity = (quantity: string) => {
    if (+quantity < 1) {
      return toast.warning("Quantity cannot be 0")
    }

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
      const ProductData = {
        ...selectProduct, ...{
          unit_quantity_id: selectedUnitQuantity.id,
          unit_name: selectedUnitQuantity.unit.name,
          $quantities: () => selectedUnitQuantity
        },
        ...{ quantity: parseInt(quantity) }
      }
      addProductToCart(ProductData)

      addToCart({
        product_id: selectedUnitQuantity.product_id,
        name: selectProduct.name,
        discount_type: "percentage",
        discount: 0,
        discount_percentage: 0,
        product_type: selectProduct.type,
        rate: selectProduct.tax_group.taxes.reduce((acc, tax) => acc + +tax.rate, 0),
        quantity: parseInt(quantity),
        tax_group_id: +selectProduct.tax_group_id,
        tax_type: selectProduct.tax_type,
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
    onConfirm: handleQuantity,
    initialValue: "",
    title: "Define Quantity",
    maxLength: 6,
    allowDecimal: true,
  })


  const handleClickOnProduct = async (product: Product) => {
    setSelectProduct(product)
    try {
      if (product.id) {
        const quantity: UnitQuantity | null = await openDialog("selectQuantity")
        if (quantity) {
          setSelectedUnitQuantity(quantity)
          if (options.ns_pos_show_quantity !== false || !processingAddQueue) {
            quantityKeypad.openKeypad()
          } else {
            const quantity = 1;
            const ProductData = {
              ...selectProduct, ...{
                unit_quantity_id: quantity.id,
                unit_name: quantity.unit.name,
                $quantities: () => quantity
              },
              ...{ quantity }
            }
            /**
             * The stock should be handled differently
             * according to whether the stock management
             * is enabled or not.
             */
            if (quantity.stock_management === 'enabled' && product.type === 'materialized') {

              /**
               * If the stock management is enabled,
               * we'll pull updated stock from the server.
               * When a product is added product.id has the real product id
               * when a product is already on the cart product.id is not set but
               * product.product_id is defined
               */
              const holdQuantity = POS.getStockUsage(product.$original().id, data.unit_quantity_id) - (product.quantity || 0);

              /**
               * This checks if there is enough
               * quantity for product that has stock
               * management enabled
               */
              if (
                quantity > (
                  parseFloat(data.$quantities().quantity) -
                  /**
                   * We'll make sure to ignore the product quantity
                   * already added to the cart by substracting the
                   * provided quantity.
                   */
                  (holdQuantity)
                )
              ) {
                return toast.error('Unable to add the product, there is not enough stock. Remaining %s').replace('%s', (data.$quantities().quantity - holdQuantity).toString())
                  .subscribe();
              }
            }

            resolve({ quantity });
          }

          console.log("User confirmed delete ✅", quantity)
        } else {
          console.log("User canceled ❌")
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <div>
      <div className="flex items-center border-b">
        <Button
          variant="ghost"
          className="rounded-none cursor-pointer"
          size={"sm"}
          onClick={() => loadCategories()}
        >
          Home
        </Button>
        {breadcrumb.map((bread, index) => (
          <div className="flex items-center" key={bread.id}>
            <ChevronRight className="mx-1 h-4 w-4" />
            <Button
              variant="ghost"
              className="rounded-none cursor-pointer"
              size={"sm"}
              onClick={() => {
                loadCategories(bread)
              }}
            >
              {bread.name}
            </Button>
          </div>
        ))}
      </div>

      {hasCategories() ? (
        <ScrollArea className="w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-muted/50 p-1 flex flex-col hover:bg-muted w-full h-36 border" onClick={() => loadCategories(category)}>
                <img
                  src={category.preview_url || ""}
                  alt={category.name}
                  className="object-cover flex-1 max-h-28"
                />
                <h1 className="font-semibold text-center">{category.name}</h1>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : !hasCategories() && !hasProducts() && !loading ? (
        <EmptyState onCreateCategories={() => { }} />
      ) : (
        <ScrollArea className="w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="bg-muted/50 p-1 flex flex-col hover:bg-muted w-full h-36 border" onClick={() => handleClickOnProduct(product)}>
                <img
                  src={product.preview_url || "/placeholder.svg"}
                  alt={product.name}
                  className="object-cover flex-1 max-h-28"
                />
                <h1 className="font-semibold text-center">{product.name}</h1>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <SelectUnitQuantityDialog selectProduct={selectProduct} />
      <NumericKeypadDialog {...quantityKeypad.keypadProps} />

    </div>
  )
}


import { Frown, Home } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import ProductCatalog from './product-catalog'
import EmptyState from '../empty-state'
import { useState } from 'react'
import axios from 'axios'

type Props = {
  categories: CategoryProduct[]
  addToCart: (product: CartProduct) => void
  selectedProducts: CartProduct[]
}

export default function ProductsCategoriesPanel({
  categories,
  addToCart,
  selectedProducts
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryProduct | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])


  const handleClickOnCategory = async (category: CategoryProduct) => {
    try {
      setActiveCategory(category)
      const res = await axios.get(`/api/categories/pos/${category.id}`)
      if (res.data.products && res.data.products.length > 0) {
        setCategoryProducts(res.data.products)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex items-center border-b px-4 py-2">
        <Button variant="ghost" className="p-0" onClick={() => {
          setActiveCategory(null)
          setCategoryProducts([])
        }}>
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      {activeCategory ? (
        <ScrollArea className="flex-1">
          {categoryProducts.length > 0 ? (
            <ProductCatalog
              products={categoryProducts}
              selectedProducts={selectedProducts}
              addToCart={addToCart}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <Frown className="h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-semibold">No products in this category</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Looks like there is either no products in this category.
              </p>
            </div>
          )}
        </ScrollArea>
      ) : (
        <ScrollArea className="w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-4">
            {categories ? categories.map((category) => (
              <div key={category.id} className="bg-muted/50 p-1 flex flex-col hover:bg-muted w-full h-full border" onClick={() => handleClickOnCategory(category)}>
                <img
                  src={category.preview_url || ""}
                  alt={category.name}
                  className="object-cover flex-1"
                />
                <h1 className="text-lg font-bold text-center">{category.name}</h1>
              </div>
            )) : (
              <EmptyState onCreateCategories={() => { }} />
            )}
          </div>
        </ScrollArea>
      )}
    </>
  )
}


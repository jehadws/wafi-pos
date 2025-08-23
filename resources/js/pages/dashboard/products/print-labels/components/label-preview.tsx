import { LabelSettings } from "../page"

interface SelectedProduct extends ProductSearchResult {
  times: number
  selectedUnitQuantity: UnitQuantity | null
}

interface LabelPreviewProps {
  products: SelectedProduct[]
  settings: LabelSettings
}

export function LabelPreview({ products, settings }: LabelPreviewProps) {
  const generateLabels = () => {
    const labels = []
    for (const product of products) {
      for (let i = 0; i < product.times; i++) {
        labels.push(product)
      }
    }
    return labels
  }

  const labels = generateLabels()

  if (labels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">No products selected</p>
          <p className="text-sm text-gray-400">Search and add products to start creating labels</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col p-4 bg-muted"
      style={{
        padding: `${settings.verticalPadding}px ${settings.horizontalPadding}px`,
      }}
    >
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${settings.itemsPerRow}, 1fr)`,
        }}
      >
        {labels.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="border border-gray-300 p-3 bg-white"
            style={{
              minHeight: "120px",
            }}
          >
            {/* Store Name */}
            {settings.showStoreName && <div className="text-center text-black font-bold text-sm mb-2">ALWAFI</div>}

            {/* Product Info */}
            <div className="space-y-1 text-xs text-black">
              <div className="flex justify-between">
                <span className="font-medium">Product</span>
                {settings.showProductName && <span className="text-right">{product.name}</span>}
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Unit</span>
                <span className="text-right">{product.selectedUnitQuantity?.unit.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Barcode</span>
                <span className="text-right">{product.selectedUnitQuantity?.barcode}</span>
              </div>

              {settings.showProductPrice && (
                <div className="flex justify-between">
                  <span className="font-medium">Price</span>
                  <span className="text-right">ly{product.selectedUnitQuantity?.sale_price.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode */}
            <div className="mt-2 w-full flex flex-col items-center justify-center">
              <img
                style={{ height: settings.barcodeHeight + "px" }}
                src={`/storage/products/barcodes/${product.selectedUnitQuantity?.barcode}.png`}
                alt={product.selectedUnitQuantity?.barcode}
              />
              <div className="text-xs text-gray-500 text-center mt-1">{product.selectedUnitQuantity?.barcode}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


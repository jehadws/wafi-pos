"use client"

import { useState } from "react"
import { ProductSearch } from "./components/product-search"
import { LabelPreview } from "./components/label-preview"
import { LabelSettingsPanel } from "./components/label-settings"
import AppLayout from "@/layouts/app-layout"
import { formatCurrency } from "@/utils/format"

export interface LabelSettings {
  itemsPerRow: number
  verticalPadding: number
  horizontalPadding: number
  barcodeHeight: number
  documentSize: number
  showStoreName: boolean
  showBarcodeText: boolean
  showProductPrice: boolean
  showProductName: boolean
}

export interface LabelPrintingState {
  selectedProducts: ProductSearchResult[]
  settings: LabelSettings
  searchQuery: string
}


interface SelectedProduct extends ProductSearchResult {
  times: number
  selectedUnitQuantity: UnitQuantity | null
}

export default function LabelPrinter() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

  const [settings, setSettings] = useState<LabelSettings>({
    itemsPerRow: 1,
    verticalPadding: 16,
    horizontalPadding: 16,
    barcodeHeight: 30,
    documentSize: 800,
    showStoreName: true,
    showBarcodeText: true,
    showProductPrice: true,
    showProductName: true,
  })

  const handlePrint = () => {
    // Generate labels for printing
    const labels = []
    for (const product of selectedProducts) {
      for (let i = 0; i < product.times; i++) {
        labels.push(product)
      }
    }

    if (labels.length === 0) {
      alert("No products selected for printing")
      return
    }

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @media print {
              body { margin: 0; padding: ${settings.verticalPadding}px ${settings.horizontalPadding}px; }
              .no-print { display: none; }
              .page-break { page-break-after: always; }
            }
            body { font-family: Arial, sans-serif; }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(${settings.itemsPerRow}, 1fr);
              gap: 8px;
            }
            .label {
              border: 1px solid #ccc;
              padding: 12px;
              min-height: 120px;
              background: white;
            }
            .store-name { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
            .product-info { font-size: 12px; }
            .product-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .barcode { text-align: center; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labels
        .map(
          (product) => `
              <div class="label">
                ${settings.showStoreName ? '<div class="store-name">ALWAFI</div>' : ""}
                <div class="product-info">
                  <div class="product-row">
                    <span><strong>Product</strong></span>
                    ${settings.showProductName ? `<span>${product.name}</span>` : "<span></span>"}
                  </div>
                  <div class="product-row">
                    <span><strong>Unit</strong></span>
                    <span>${product.selectedUnitQuantity?.unit.name}</span>
                  </div>
                  <div class="product-row">
                    <span><strong>Barcode</strong></span>
                    <span>${product.barcode}</span>
                  </div>
                  ${settings.showProductPrice
              ? `
                    <div class="product-row">
                      <span><strong>Price</strong></span>
                      <span>${formatCurrency(product.selectedUnitQuantity?.sale_price!)}</span>
                    </div>
                  `
              : ""
            }
                </div>
                <div class="barcode">
                  <img
                    src="/storage/products/barcodes/${product.barcode}.png"
                    alt="${product.barcode}"
                    style="height: ${settings.barcodeHeight}px"
                  />
                  ${settings.showBarcodeText ? `<div style="font-size: 12px;">${product.barcode}</div>` : ""}
                </div>
              </div>
            `,
        )
        .join("")}
          </div>
        </body>
      </html>
    `

    // Open print dialog
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-1">
        {/* Product Search Sidebar */}
        <ProductSearch selectedProducts={selectedProducts} onProductsChange={setSelectedProducts} onPrint={handlePrint} />

        {/* Label Preview */}
        <LabelPreview products={selectedProducts} settings={settings} />

        {/* Settings Sidebar */}
        <LabelSettingsPanel settings={settings} onSettingsChange={setSettings} />
      </div>
    </AppLayout>
  )
}


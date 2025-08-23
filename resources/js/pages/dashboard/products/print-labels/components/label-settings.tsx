import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { LabelSettings } from "../page"

interface LabelSettingsProps {
  settings: LabelSettings
  onSettingsChange: (settings: LabelSettings) => void
}

export function LabelSettingsPanel({ settings, onSettingsChange }: LabelSettingsProps) {
  const updateSetting = (key: keyof LabelSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  return (
    <div className="w-80 p-4 space-y-6 border-l">
      <Button className="w-full">Apply Settings</Button>

      {/* Basic Settings */}
      <div>
        <h3 className="font-semibold mb-4">Basic Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemsPerRow" className="text-sm font-medium">
              Items Per Row
            </Label>
            <Input
              id="itemsPerRow"
              type="number"
              min="1"
              max="10"
              value={settings.itemsPerRow}
              onChange={(e) => updateSetting("itemsPerRow", Number.parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="verticalPadding" className="text-sm font-medium">
              Vertical Padding (pixels)
            </Label>
            <Input
              id="verticalPadding"
              type="number"
              min="0"
              value={settings.verticalPadding}
              onChange={(e) => updateSetting("verticalPadding", Number.parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="horizontalPadding" className="text-sm font-medium">
              Horizontal Padding (pixels)
            </Label>
            <Input
              id="horizontalPadding"
              type="number"
              min="0"
              value={settings.horizontalPadding}
              onChange={(e) => updateSetting("horizontalPadding", Number.parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="barcodeHeight" className="text-sm font-medium">
              Barcode Height (pixels)
            </Label>
            <Input
              id="barcodeHeight"
              type="number"
              min="20"
              max="100"
              value={settings.barcodeHeight}
              onChange={(e) => updateSetting("barcodeHeight", Number.parseInt(e.target.value) || 30)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="documentSize" className="text-sm font-medium">
              Document Size (pixels)
            </Label>
            <Input
              id="documentSize"
              type="number"
              min="100"
              value={settings.documentSize}
              onChange={(e) => updateSetting("documentSize", Number.parseInt(e.target.value) || 800)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Visibility Settings */}
      <div>
        <h3 className="font-semibold mb-4">Visibility Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showStoreName"
              checked={settings.showStoreName}
              onCheckedChange={(checked) => updateSetting("showStoreName", checked)}
            />
            <Label htmlFor="showStoreName" className="text-sm">
              Show Store Name
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showBarcodeText"
              checked={settings.showBarcodeText}
              onCheckedChange={(checked) => updateSetting("showBarcodeText", checked)}
            />
            <Label htmlFor="showBarcodeText" className="text-sm">
              Show Barcode Text
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showProductPrice"
              checked={settings.showProductPrice}
              onCheckedChange={(checked) => updateSetting("showProductPrice", checked)}
            />
            <Label htmlFor="showProductPrice" className="text-sm">
              Show Product Price
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showProductName"
              checked={settings.showProductName}
              onCheckedChange={(checked) => updateSetting("showProductName", checked)}
            />
            <Label htmlFor="showProductName" className="text-sm">
              Show Product Name
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}


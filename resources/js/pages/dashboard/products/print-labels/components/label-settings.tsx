import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { LabelSettings } from '../page';

interface LabelSettingsProps {
  settings: LabelSettings;
  onSettingsChange: (settings: LabelSettings) => void;
}

export function LabelSettingsPanel({ settings, onSettingsChange }: LabelSettingsProps) {
  const { t } = useTranslation();
  const updateSetting = (key: keyof LabelSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="w-80 space-y-6 border-l p-4">
      <Button className="w-full">{t('Apply Settings')}</Button>

      <div>
        <h3 className="mb-4 font-semibold">{t('Basic Settings')}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemsPerRow" className="text-sm font-medium">
              {t('Items Per Row')}
            </Label>
            <Input
              id="itemsPerRow"
              type="number"
              min="1"
              max="10"
              value={settings.itemsPerRow}
              onChange={(e) => updateSetting('itemsPerRow', Number.parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="verticalPadding" className="text-sm font-medium">
              {t('Vertical Padding (pixels)')}
            </Label>
            <Input
              id="verticalPadding"
              type="number"
              min="0"
              value={settings.verticalPadding}
              onChange={(e) => updateSetting('verticalPadding', Number.parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="horizontalPadding" className="text-sm font-medium">
              {t('Horizontal Padding (pixels)')}
            </Label>
            <Input
              id="horizontalPadding"
              type="number"
              min="0"
              value={settings.horizontalPadding}
              onChange={(e) => updateSetting('horizontalPadding', Number.parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="barcodeHeight" className="text-sm font-medium">
              {t('Barcode Height (pixels)')}
            </Label>
            <Input
              id="barcodeHeight"
              type="number"
              min="20"
              max="100"
              value={settings.barcodeHeight}
              onChange={(e) => updateSetting('barcodeHeight', Number.parseInt(e.target.value) || 30)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="documentSize" className="text-sm font-medium">
              {t('Document Size (pixels)')}
            </Label>
            <Input
              id="documentSize"
              type="number"
              min="100"
              value={settings.documentSize}
              onChange={(e) => updateSetting('documentSize', Number.parseInt(e.target.value) || 800)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold">{t('Visibility Settings')}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="showStoreName" checked={settings.showStoreName} onCheckedChange={(checked) => updateSetting('showStoreName', checked)} />
            <Label htmlFor="showStoreName" className="text-sm">
              {t('Show Store Name')}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="showBarcodeText"
              checked={settings.showBarcodeText}
              onCheckedChange={(checked) => updateSetting('showBarcodeText', checked)}
            />
            <Label htmlFor="showBarcodeText" className="text-sm">
              {t('Show Barcode Text')}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="showProductPrice"
              checked={settings.showProductPrice}
              onCheckedChange={(checked) => updateSetting('showProductPrice', checked)}
            />
            <Label htmlFor="showProductPrice" className="text-sm">
              {t('Show Product Price')}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="showProductName"
              checked={settings.showProductName}
              onCheckedChange={(checked) => updateSetting('showProductName', checked)}
            />
            <Label htmlFor="showProductName" className="text-sm">
              {t('Show Product Name')}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

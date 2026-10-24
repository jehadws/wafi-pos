import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { LabelSettings } from '../page';

interface LabelSettingsProps {
  settings: LabelSettings;
  onSettingsChange: (settings: LabelSettings) => void;
}

const SIZE_PRESETS: Array<[number, number]> = [
  [40, 25],
  [50, 30],
  [58, 40],
  [60, 40],
  [76, 50],
  [100, 60],
];

const clampSize = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  className?: string;
  onChange: (value: number) => void;
}

/** Keystroke-friendly number input: commits live while typing valid values, clamps on blur. */
function NumberField({ id, label, value, min, max, className, onChange }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) onChange(parsed);
        }}
        onBlur={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          const clamped = Number.isNaN(parsed) ? value : clampSize(parsed, min, max);
          onChange(clamped);
          setText(String(clamped));
        }}
        className={`mt-1 ${className ?? ''}`}
      />
    </div>
  );
}

export function LabelSettingsPanel({ settings, onSettingsChange }: LabelSettingsProps) {
  const { t } = useTranslation();
  const updateSetting = (key: keyof LabelSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const updateSize = (widthMm: number, heightMm: number) => {
    onSettingsChange({ ...settings, widthMm, heightMm });
  };

  // Custom stickers have no preset; match only exact sizes.
  const preset = SIZE_PRESETS.find(([w, h]) => w === settings.widthMm && h === settings.heightMm);
  const presetKey = preset ? `${preset[0]}x${preset[1]}` : 'custom';

  return (
    <div className="w-80 space-y-6 border-l p-4">
      <div>
        <h3 className="mb-4 font-semibold">{t('Label Size')}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="labelSizePreset" className="text-sm font-medium">
              {t('Sticker')}
            </Label>
            <Select
              value={presetKey}
              onValueChange={(value) => {
                if (value === 'custom') return;
                const [w, h] = value.split('x').map(Number);
                updateSize(w, h);
              }}
            >
              <SelectTrigger id="labelSizePreset" className="mt-1">
                <SelectValue placeholder={t('Custom size')} />
              </SelectTrigger>
              <SelectContent>
                {SIZE_PRESETS.map(([w, h]) => (
                  <SelectItem key={`${w}x${h}`} value={`${w}x${h}`}>
                    {w} × {h} mm
                  </SelectItem>
                ))}
                <SelectItem value="custom">{t('Custom size')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="labelWidthMm"
              label={t('Width (mm)')}
              value={settings.widthMm}
              min={15}
              max={120}
              onChange={(v) => updateSetting('widthMm', v)}
            />
            <NumberField
              id="labelHeightMm"
              label={t('Height (mm)')}
              value={settings.heightMm}
              min={15}
              max={120}
              onChange={(v) => updateSetting('heightMm', v)}
            />
          </div>

          <NumberField
            id="barcodeHeight"
            label={t('Barcode Height (mm)')}
            value={settings.barcodeHeightMm}
            min={4}
            max={40}
            onChange={(v) => updateSetting('barcodeHeightMm', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold">{t('Basic Settings')}</h3>
        <div className="space-y-4">
          <NumberField
            id="itemsPerRow"
            label={t('Items Per Row')}
            value={settings.itemsPerRow}
            min={1}
            max={10}
            onChange={(v) => updateSetting('itemsPerRow', v)}
          />

          <NumberField
            id="verticalPadding"
            label={t('Vertical Padding (pixels)')}
            value={settings.verticalPadding}
            min={0}
            max={200}
            onChange={(v) => updateSetting('verticalPadding', v)}
          />

          <NumberField
            id="horizontalPadding"
            label={t('Horizontal Padding (pixels)')}
            value={settings.horizontalPadding}
            min={0}
            max={200}
            onChange={(v) => updateSetting('horizontalPadding', v)}
          />
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

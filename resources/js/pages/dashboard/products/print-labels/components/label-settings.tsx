import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
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

  const visibility: Array<{ id: keyof LabelSettings; label: string }> = [
    { id: 'showStoreName', label: t('Show Store Name') },
    { id: 'showProductName', label: t('Show Product Name') },
    { id: 'showProductPrice', label: t('Show Product Price') },
    { id: 'showProductUnit', label: t('Show Product Unit') },
    { id: 'showBarcodeText', label: t('Show Barcode Text') },
  ];

  return (
    <div className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-s p-4">
      <Section title={t('Label Size')}>
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
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="font-mono">
                        {w} × {h} mm
                      </span>
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">
                        {w * 8} × {h * 8}
                      </span>
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="custom">{t('Custom size')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">{t('Millimetres × dots at 203 dpi.')}</p>
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
      </Section>

      <Section title={t('Preview Layout')}>
        <div className="space-y-4">
          <NumberField
            id="itemsPerRow"
            label={t('Items Per Row')}
            value={settings.itemsPerRow}
            min={1}
            max={10}
            onChange={(v) => updateSetting('itemsPerRow', v)}
          />

          <div className="grid grid-cols-2 gap-3">
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
          <p className="text-muted-foreground text-xs">{t('On-screen spacing only; it does not change what prints.')}</p>
        </div>
      </Section>

      <Section title={t('Printed Fields')}>
        <div className="space-y-1">
          {visibility.map((field) => (
            <label
              key={field.id}
              htmlFor={field.id}
              className="hover:bg-accent/50 flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors"
            >
              <span className="text-sm">{field.label}</span>
              <Checkbox id={field.id} checked={Boolean(settings[field.id])} onCheckedChange={(checked) => updateSetting(field.id, checked)} />
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

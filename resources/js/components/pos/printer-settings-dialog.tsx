'use client';

import { LabelPaper } from '@/components/pos/label-paper';
import { sampleLabel, sampleReceipt } from '@/components/pos/printing-samples';
import { ReceiptPaper } from '@/components/pos/receipt-paper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/lib/i18n';
import printingService, {
  DEFAULT_PRINTER_SETTINGS,
  LabelPreviewImage,
  PrinterEncoding,
  PrinterSettings,
  WindowsPrinter,
} from '@/services/printing-service';
import { AlertCircle, CheckCircle2, Eye, Loader2, Play, Printer, RefreshCw, Ruler, SlidersHorizontal, Tag, Wallet } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PrinterSettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const VIRTUAL_PRINTER = '127.0.0.1:9100';

const RECEIPT_WIDTHS = [42, 46, 48, 32];

const ENCODINGS: Array<{ value: PrinterEncoding; label: string; hint: string }> = [
  { value: 'cp864', label: 'CP864', hint: 'Arabic ESC/POS' },
  { value: 'cp1256', label: 'CP1256', hint: 'Windows Arabic' },
  { value: 'utf8', label: 'UTF-8', hint: 'Modern POS' },
  { value: 'cp437', label: 'CP437', hint: 'Safe ASCII' },
];

const LABEL_SIZES: Array<[number, number]> = [
  [50, 30],
  [60, 40],
  [76, 50],
];

function OptionRow({ primary, secondary }: { primary: ReactNode; secondary: ReactNode }) {
  return (
    <span className="flex w-full items-center justify-between gap-4">
      <span className="truncate">{primary}</span>
      <span className="text-muted-foreground shrink-0 font-mono text-xs">{secondary}</span>
    </span>
  );
}

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function PrinterField({
  name,
  label,
  value,
  printers,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  printers: WindowsPrinter[];
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const windowsDefault = printers.find((printer) => printer.isDefault)?.name;
  const isPickable = value === VIRTUAL_PRINTER || printers.some((printer) => printer.name === value);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('Windows default printer')}
          className="flex-1 font-mono text-sm"
        />
        {printers.length > 0 && (
          <Select value={isPickable ? value : ''} onValueChange={onChange}>
            <SelectTrigger className="w-[230px]" aria-label={t('Pick a detected printer')}>
              <SelectValue placeholder={t('Pick a detected printer')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VIRTUAL_PRINTER}>
                <OptionRow primary={t('Virtual printer')} secondary={VIRTUAL_PRINTER} />
              </SelectItem>
              {printers.map((printer) => (
                <SelectItem key={printer.name} value={printer.name}>
                  <OptionRow primary={printer.name} secondary={printer.isDefault ? t('Default') : printer.isOffline ? t('Offline') : printer.port} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange('')}>
          {t('Use Windows default')}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange(VIRTUAL_PRINTER)}>
          {t('Use virtual endpoint')}
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        {value.trim() === ''
          ? windowsDefault
            ? `${t('Prints on the Windows default printer')}: ${windowsDefault}`
            : t('Windows has no default printer configured. Set one in Settings > Printers & scanners.')
          : value.includes(':')
            ? t('Raw ESC/POS or TSPL bytes sent over TCP.')
            : t('Printed through the Windows spooler on this terminal.')}
      </p>
    </div>
  );
}

export function PrinterSettingsDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: PrinterSettingsDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [activeTab, setActiveTab] = useState('receipt');
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [printers, setPrinters] = useState<WindowsPrinter[]>([]);
  const [printingStatus, setPrintingStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingReceipt, setIsTestingReceipt] = useState(false);
  const [isTestingLabel, setIsTestingLabel] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);
  const [samplePreview, setSamplePreview] = useState<LabelPreviewImage | null>(null);

  // The dialog's label preview shows the server-rendered pixels the printer burns,
  // re-requested whenever a setting that changes the sticker is touched.
  const labelPreviewKey = JSON.stringify([
    isOpen && activeTab === 'label',
    settings.labelWidthMm,
    settings.labelHeightMm,
    settings.barcodeHeight,
    settings.showStoreNameOnLabel,
    settings.showPriceOnLabel,
    settings.showSkuOnLabel,
    settings.showBarcodeTextOnLabel,
  ]);

  useEffect(() => {
    if (!labelPreviewKey.startsWith('true')) return;

    let cancelled = false;
    const sample = sampleLabel();
    printingService
      .previewLabels([sample], {
        labelWidthMm: settings.labelWidthMm,
        labelHeightMm: settings.labelHeightMm,
        barcodeHeight: settings.barcodeHeight,
        showStoreNameOnLabel: settings.showStoreNameOnLabel,
        showPriceOnLabel: settings.showPriceOnLabel,
        showSkuOnLabel: settings.showSkuOnLabel,
        showBarcodeTextOnLabel: settings.showBarcodeTextOnLabel,
      })
      .then((result) => {
        if (!cancelled) setSamplePreview(result[printingService.previewKey(sample)] ?? null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelPreviewKey]);

  const checkAndFetchPrinters = async () => {
    setIsRefreshing(true);
    try {
      const [status] = await Promise.all([printingService.checkStatus(), printingService.loadSettings(true)]);
      setPrintingStatus(status.status === 'online' ? 'online' : 'offline');
      if (status.status === 'online') {
        setSettings(printingService.getSettings());
        setPrinters(await printingService.getPrinters(true));
      }
    } catch {
      setPrintingStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAndFetchPrinters();
    }
  }, [isOpen]);

  const handleSettingChange = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    printingService.saveSettings({ [key]: value }).catch((err: any) => {
      toast.error(err?.message || t('Failed to save printer settings.'));
    });

    // The cart reads the same option through the POS store, so keep it in sync:
    // otherwise toggling auto-print would only take effect after a reload.
    if (key === 'autoPrintOnSale') {
      const { options, defineOptions } = usePOS.getState();
      defineOptions({ ...options, [POS_OPTION_KEYS.printingAuto]: value ? 'yes' : 'no' });
    }
  };

  const handleTestReceipt = async (sample: 'arabic' | 'english') => {
    setIsTestingReceipt(true);
    try {
      const res = await printingService.testPrinter(settings.receiptPrinter, 'receipt', sample);
      toast.success(res.message || t('Test receipt sent to printer!'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to test printer.'));
    } finally {
      setIsTestingReceipt(false);
    }
  };

  const handleTestLabel = async () => {
    setIsTestingLabel(true);
    try {
      const res = await printingService.testPrinter(settings.labelPrinter, 'label');
      toast.success(res.message || t('Test label sent to printer!'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to test label printer.'));
    } finally {
      setIsTestingLabel(false);
    }
  };

  const handleTestDrawer = async () => {
    setIsTestingDrawer(true);
    const res = await printingService.openCashDrawer(settings.receiptPrinter);
    if (res.success) {
      toast.success(res.message || t('Cash drawer pulse sent.'));
    } else {
      toast.error(res.error || t('Failed to open cash drawer.'));
    }
    setIsTestingDrawer(false);
  };

  const printerReady = printingStatus === 'online';
  const labelSizeKey = `${settings.labelWidthMm}x${settings.labelHeightMm}`;
  const isPresetSize = LABEL_SIZES.some(([w, h]) => `${w}x${h}` === labelSizeKey);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Printer className="text-primary h-5 w-5" />
            {t('POS Thermal Printer Settings')}
          </DialogTitle>
          <DialogDescription>{t('Configure direct thermal receipt and barcode label printing for this terminal.')}</DialogDescription>
        </DialogHeader>

        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
            printingStatus === 'online'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : printingStatus === 'offline'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-muted/40 text-muted-foreground'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {printingStatus === 'online' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : printingStatus === 'offline' ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {printingStatus === 'online'
                  ? `${t('Printing is ready')} · ${printers.length} ${printers.length === 1 ? t('printer') : t('printers')}`
                  : printingStatus === 'offline'
                    ? t('Printing is unavailable')
                    : t('Checking printing...')}
              </div>
              <div className="text-muted-foreground/70 truncate text-xs opacity-80">
                {printingStatus === 'online'
                  ? t('Thermal receipts and labels print directly from the Subul backend.')
                  : t('The POS could not reach the printing service. Check your connection and refresh.')}
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={checkAndFetchPrinters} disabled={isRefreshing} className="h-8 shrink-0 gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receipt" className="gap-2">
                <Printer className="h-4 w-4" />
                {t('Receipt Printer')}
              </TabsTrigger>
              <TabsTrigger value="label" className="gap-2">
                <Tag className="h-4 w-4" />
                {t('Label / Barcode Printer')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receipt" className="space-y-4 pt-2">
              <SectionCard icon={<Printer className="h-3.5 w-3.5" />} title={t('Destination')}>
                <PrinterField
                  name="receiptPrinter"
                  label={t('Printer Destination')}
                  value={settings.receiptPrinter}
                  printers={printers}
                  onChange={(value) => handleSettingChange('receiptPrinter', value)}
                />
              </SectionCard>

              <SectionCard icon={<Ruler className="h-3.5 w-3.5" />} title={t('Paper & encoding')}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lineWidth">{t('Printable Width')}</Label>
                    <Select value={String(settings.lineWidth)} onValueChange={(val) => handleSettingChange('lineWidth', parseInt(val, 10))}>
                      <SelectTrigger id="lineWidth">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECEIPT_WIDTHS.map((width) => (
                          <SelectItem key={width} value={String(width)}>
                            <OptionRow primary={`${width} ${t('chars')}`} secondary={width === 32 ? '58 mm' : '80 mm'} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">{t('Characters that fit on one printed line.')}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="encoding">{t('Arabic / Code Page')}</Label>
                    <Select value={settings.encoding} onValueChange={(val: PrinterEncoding) => handleSettingChange('encoding', val)}>
                      <SelectTrigger id="encoding">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENCODINGS.map((encoding) => (
                          <SelectItem key={encoding.value} value={encoding.value}>
                            <OptionRow primary={encoding.label} secondary={encoding.hint} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      {t('CP864 and CP1256 print Arabic with the printer font. UTF-8 and CP437 send it as an image instead.')}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="copies">{t('Receipt Copies')}</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      max="5"
                      value={settings.copies}
                      onChange={(e) => handleSettingChange('copies', parseInt(e.target.value, 10) || 1)}
                    />
                    <p className="text-muted-foreground text-xs">{t('Sheets printed for each sale.')}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={<SlidersHorizontal className="h-3.5 w-3.5" />} title={t('Behaviour')}>
                <div className="divide-border divide-y">
                  <SwitchRow
                    title={t('Auto-Cut Paper')}
                    description={t('Sends ESC/POS partial cut command at receipt end.')}
                    checked={settings.cutPaper}
                    onChange={(checked) => handleSettingChange('cutPaper', checked)}
                  />
                  <SwitchRow
                    title={t('Open Cash Drawer')}
                    description={t('Kicks cash drawer pulse (ESC p 0 25 250) on sale.')}
                    checked={settings.openCashDrawer}
                    onChange={(checked) => handleSettingChange('openCashDrawer', checked)}
                  />
                  <SwitchRow
                    title={t('Show Tax Breakdown')}
                    description={t('Prints individual tax lines on receipt.')}
                    checked={settings.showTaxBreakdown}
                    onChange={(checked) => handleSettingChange('showTaxBreakdown', checked)}
                  />
                  <SwitchRow
                    title={t('Auto-Print on Sale Completion')}
                    description={t('Automatically triggers thermal print when order is paid.')}
                    checked={settings.autoPrintOnSale}
                    onChange={(checked) => handleSettingChange('autoPrintOnSale', checked)}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={<Play className="h-3.5 w-3.5" />} title={t('Test')}>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleTestReceipt('arabic')}
                    disabled={isTestingReceipt || !printerReady}
                    className="gap-2"
                  >
                    {isTestingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {t('Test Arabic Receipt')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleTestReceipt('english')}
                    disabled={isTestingReceipt || !printerReady}
                    className="gap-2"
                  >
                    {isTestingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {t('Test English Receipt')}
                  </Button>
                  <Button variant="secondary" onClick={handleTestDrawer} disabled={isTestingDrawer || !printerReady} className="gap-2">
                    {isTestingDrawer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    {t('Test Cash Drawer')}
                  </Button>
                </div>
                {!printerReady && <p className="text-muted-foreground text-xs">{t('Testing needs a connection to the printing backend.')}</p>}
              </SectionCard>
            </TabsContent>

            <TabsContent value="label" className="space-y-4 pt-2">
              <SectionCard icon={<Tag className="h-3.5 w-3.5" />} title={t('Destination')}>
                <PrinterField
                  name="labelPrinter"
                  label={t('Label Printer Destination')}
                  value={settings.labelPrinter}
                  printers={printers}
                  onChange={(value) => handleSettingChange('labelPrinter', value)}
                />
              </SectionCard>

              <SectionCard icon={<Ruler className="h-3.5 w-3.5" />} title={t('Sticker & protocol')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="labelSize">{t('Label Dimensions')}</Label>
                    <Select
                      value={isPresetSize ? labelSizeKey : ''}
                      onValueChange={(val) => {
                        const [w, h] = val.split('x').map(Number);
                        handleSettingChange('labelWidthMm', w);
                        handleSettingChange('labelHeightMm', h);
                      }}
                    >
                      <SelectTrigger id="labelSize">
                        <SelectValue placeholder={t('Custom size')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LABEL_SIZES.map(([w, h]) => (
                          <SelectItem key={`${w}x${h}`} value={`${w}x${h}`}>
                            <OptionRow primary={`${w} × ${h} mm`} secondary={`${w * 8} × ${h * 8} dots`} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">{t('Custom sizes are set on the Print Labels page.')}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="labelProtocol">{t('Printer Command Mode')}</Label>
                    <Select
                      value={settings.labelProtocol}
                      onValueChange={(val: 'auto' | 'escpos' | 'tspl') => handleSettingChange('labelProtocol', val)}
                    >
                      <SelectTrigger id="labelProtocol">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">{t('Auto-detect from printer driver')}</SelectItem>
                        <SelectItem value="escpos">ESC/POS</SelectItem>
                        <SelectItem value="tspl">TSPL</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">{t('The XP-D365B label printer expects TSPL.')}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={<Eye className="h-3.5 w-3.5" />} title={t('Label content')}>
                <div className="divide-border divide-y">
                  <SwitchRow
                    title={t('Show Store Name on Label')}
                    description={t('Small header line above the product name.')}
                    checked={settings.showStoreNameOnLabel}
                    onChange={(checked) => handleSettingChange('showStoreNameOnLabel', checked)}
                  />
                  <SwitchRow
                    title={t('Show Selling Price')}
                    description={t('Prints the price line under the barcode.')}
                    checked={settings.showPriceOnLabel}
                    onChange={(checked) => handleSettingChange('showPriceOnLabel', checked)}
                  />
                  <SwitchRow
                    title={t('Show SKU / Product Code')}
                    description={t('Adds the internal product code line.')}
                    checked={settings.showSkuOnLabel}
                    onChange={(checked) => handleSettingChange('showSkuOnLabel', checked)}
                  />
                  <SwitchRow
                    title={t('Show Barcode Text')}
                    description={t('Prints the readable number under the bars.')}
                    checked={settings.showBarcodeTextOnLabel}
                    onChange={(checked) => handleSettingChange('showBarcodeTextOnLabel', checked)}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={<Play className="h-3.5 w-3.5" />} title={t('Test')}>
                <Button variant="secondary" onClick={handleTestLabel} disabled={isTestingLabel || !printerReady} className="gap-2">
                  {isTestingLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {t('Send Test Label Print')}
                </Button>
                {!printerReady && <p className="text-muted-foreground text-xs">{t('Testing needs a connection to the printing backend.')}</p>}
              </SectionCard>
            </TabsContent>
          </Tabs>

          {/* Both previews render with these settings, so a change is visible before it reaches paper. */}
          <div className="bg-card self-start rounded-xl border p-3 lg:sticky lg:top-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{t('Live preview')}</span>
              <Badge variant="outline" className="font-mono">
                {activeTab === 'receipt' ? `${settings.lineWidth} ${t('chars')}` : `${settings.labelWidthMm} × ${settings.labelHeightMm} mm`}
              </Badge>
            </div>

            <div className="bg-muted/60 dark:bg-muted/30 flex justify-center overflow-x-auto rounded-lg p-4">
              {activeTab === 'receipt' ? (
                <ReceiptPaper data={sampleReceipt()} settings={settings} />
              ) : (
                <LabelPaper
                  label={sampleLabel()}
                  image={samplePreview}
                  options={{
                    widthMm: settings.labelWidthMm,
                    heightMm: settings.labelHeightMm,
                    barcodeHeightDots: settings.barcodeHeight,
                    showStoreName: settings.showStoreNameOnLabel,
                    showPrice: settings.showPriceOnLabel,
                    showSku: settings.showSkuOnLabel,
                    showBarcodeText: settings.showBarcodeTextOnLabel,
                  }}
                />
              )}
            </div>

            <p className="text-muted-foreground mt-3 text-center text-xs">
              {activeTab === 'receipt'
                ? t('Matches the bytes the backend sends to the printer.')
                : t('Matches the sticker the label printer receives.')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

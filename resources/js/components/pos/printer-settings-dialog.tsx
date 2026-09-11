'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import PrintAgentService, { PrinterSettings, WindowsPrinter } from '@/services/print-agent-service';
import { AlertCircle, CheckCircle2, Loader2, Play, Printer, RefreshCw, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PrinterSettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PrinterSettingsDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: PrinterSettingsDialogProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [settings, setSettings] = useState<PrinterSettings>(PrintAgentService.getSettings());
  const [printers, setPrinters] = useState<WindowsPrinter[]>([]);
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingReceipt, setIsTestingReceipt] = useState(false);
  const [isTestingLabel, setIsTestingLabel] = useState(false);

  const checkAndFetchPrinters = async () => {
    setIsRefreshing(true);
    try {
      const status = await PrintAgentService.checkStatus();
      if (status.status === 'online') {
        setAgentStatus('online');
        const list = await PrintAgentService.getPrinters();
        setPrinters(list);

        // Auto select default printer if not set
        if (!settings.receiptPrinter && list.length > 0) {
          const defaultP = list.find((p) => p.isDefault) || list[0];
          handleSettingChange('receiptPrinter', defaultP.name);
        }
        if (!settings.labelPrinter && list.length > 0) {
          const defaultP = list.find((p) => p.isDefault) || list[0];
          handleSettingChange('labelPrinter', defaultP.name);
        }
      } else {
        setAgentStatus('offline');
      }
    } catch {
      setAgentStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAndFetchPrinters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSettingChange = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    PrintAgentService.saveSettings(updated);
  };

  const handleTestReceipt = async (sample?: 'arabic' | 'english') => {
    setIsTestingReceipt(true);
    try {
      PrintAgentService.saveSettings(settings);
      const res = await PrintAgentService.testPrinter(settings.receiptPrinter, 'receipt', sample);
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
      PrintAgentService.saveSettings(settings);
      const res = await PrintAgentService.testPrinter(settings.labelPrinter, 'label');
      toast.success(res.message || t('Test label sent to printer!'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to test label printer.'));
    } finally {
      setIsTestingLabel(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Printer className="text-primary h-5 w-5" />
            {t('POS Thermal Printer Settings')}
          </DialogTitle>
          <DialogDescription>{t('Configure direct thermal receipt and barcode label printing via the local Windows Print Agent.')}</DialogDescription>
        </DialogHeader>

        {/* Print Agent Connection Status Banner */}
        <div
          className={`flex items-center justify-between rounded-lg border p-3 ${
            agentStatus === 'online'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : agentStatus === 'offline'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-muted/40 text-muted-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {agentStatus === 'online' ? (
              <CheckCircle2 className="text-primary h-5 w-5" />
            ) : agentStatus === 'offline' ? (
              <AlertCircle className="text-destructive h-5 w-5" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            <div>
              <div className="text-sm font-semibold">
                {agentStatus === 'online'
                  ? t('Print Agent Online (http://127.0.0.1:8189)')
                  : agentStatus === 'offline'
                    ? t('Print Agent Offline')
                    : t('Checking Print Agent...')}
              </div>
              <div className="text-xs opacity-80">
                {agentStatus === 'online'
                  ? t('Direct ESC/POS spooler connection is ready.')
                  : t('Run "start.bat" in the print-agent folder to start the background agent.')}
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={checkAndFetchPrinters} disabled={isRefreshing} className="h-8 gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </Button>
        </div>

        <Tabs defaultValue="receipt" className="w-full">
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

          {/* Receipt Settings Tab */}
          <TabsContent value="receipt" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="receiptPrinter">{t('Printer Destination')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-6 text-xs"
                    onClick={() => handleSettingChange('receiptPrinter', '127.0.0.1:9100')}
                  >
                    + {t('Use Virtual Printer (127.0.0.1:9100)')}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="receiptPrinter"
                    placeholder={t('e.g. XP-80C or 127.0.0.1:9100')}
                    value={settings.receiptPrinter}
                    onChange={(e) => handleSettingChange('receiptPrinter', e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  {printers.length > 0 && (
                    <Select value={settings.receiptPrinter} onValueChange={(val) => handleSettingChange('receiptPrinter', val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('Pick printer...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="127.0.0.1:9100">🖥️ Virtual (127.0.0.1:9100)</SelectItem>
                        {printers.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            🖨️ {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {t('Enter a Windows printer name (e.g. "XP-80C") or TCP endpoint (e.g. "127.0.0.1:9100").')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lineWidth">{t('Printable Width')}</Label>
                  <Select value={String(settings.lineWidth)} onValueChange={(val) => handleSettingChange('lineWidth', parseInt(val, 10))}>
                    <SelectTrigger id="lineWidth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="42">42 {t('Chars (76mm/80mm)')}</SelectItem>
                      <SelectItem value="46">46 {t('Chars (80mm)')}</SelectItem>
                      <SelectItem value="48">48 {t('Chars (Wide 80mm)')}</SelectItem>
                      <SelectItem value="32">32 {t('Chars (58mm)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="encoding">{t('Arabic / Code Page')}</Label>
                  <Select value={settings.encoding || 'cp864'} onValueChange={(val: any) => handleSettingChange('encoding', val)}>
                    <SelectTrigger id="encoding">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cp864">CP864 (Arabic ESC/POS)</SelectItem>
                      <SelectItem value="cp1256">CP1256 (Windows Arabic)</SelectItem>
                      <SelectItem value="utf8">UTF-8 (Modern POS)</SelectItem>
                      <SelectItem value="cp437">CP437 (Safe ASCII)</SelectItem>
                    </SelectContent>
                  </Select>
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
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Auto-Cut Paper')}</Label>
                    <p className="text-muted-foreground text-xs">{t('Sends ESC/POS partial cut command at receipt end.')}</p>
                  </div>
                  <Switch checked={settings.cutPaper} onCheckedChange={(checked) => handleSettingChange('cutPaper', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Open Cash Drawer')}</Label>
                    <p className="text-muted-foreground text-xs">{t('Kicks cash drawer pulse (ESC p 0 25 250) on sale.')}</p>
                  </div>
                  <Switch checked={settings.openCashDrawer} onCheckedChange={(checked) => handleSettingChange('openCashDrawer', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Show Tax Breakdown')}</Label>
                    <p className="text-muted-foreground text-xs">{t('Prints individual tax lines on receipt.')}</p>
                  </div>
                  <Switch checked={settings.showTaxBreakdown} onCheckedChange={(checked) => handleSettingChange('showTaxBreakdown', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('Auto-Print on Sale Completion')}</Label>
                    <p className="text-muted-foreground text-xs">{t('Automatically triggers thermal print when order is paid.')}</p>
                  </div>
                  <Switch checked={settings.autoPrintOnSale} onCheckedChange={(checked) => handleSettingChange('autoPrintOnSale', checked)} />
                </div>
              </div>

              {/* Test Buttons */}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleTestReceipt('arabic')}
                  disabled={isTestingReceipt || agentStatus !== 'online'}
                  className="gap-2"
                >
                  {isTestingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {t('Test Arabic Receipt')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleTestReceipt('english')}
                  disabled={isTestingReceipt || agentStatus !== 'online'}
                  className="gap-2"
                >
                  {isTestingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {t('Test English Receipt')}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Label Settings Tab */}
          <TabsContent value="label" className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="labelPrinter">{t('Label Printer Destination')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-6 text-xs"
                    onClick={() => handleSettingChange('labelPrinter', '127.0.0.1:9100')}
                  >
                    + {t('Use Virtual Printer (127.0.0.1:9100)')}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="labelPrinter"
                    placeholder={t('e.g. XP-365B or 127.0.0.1:9100')}
                    value={settings.labelPrinter}
                    onChange={(e) => handleSettingChange('labelPrinter', e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  {printers.length > 0 && (
                    <Select value={settings.labelPrinter} onValueChange={(val) => handleSettingChange('labelPrinter', val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('Pick printer...')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="127.0.0.1:9100">🖥️ Virtual (127.0.0.1:9100)</SelectItem>
                        {printers.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            🖨️ {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="labelSize">{t('Label Dimensions')}</Label>
                  <Select
                    value={`${settings.labelWidthMm}x${settings.labelHeightMm}`}
                    onValueChange={(val) => {
                      const [w, h] = val.split('x').map(Number);
                      handleSettingChange('labelWidthMm', w);
                      handleSettingChange('labelHeightMm', h);
                    }}
                  >
                    <SelectTrigger id="labelSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50x30">50 mm × 30 mm (Standard Product Tag)</SelectItem>
                      <SelectItem value="60x40">60 mm × 40 mm (Large Barcode Tag)</SelectItem>
                      <SelectItem value="76x50">76 mm × 50 mm (Wide Thermal Label)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="labelProtocol">{t('Printer Command Mode')}</Label>
                  <Select value={settings.labelProtocol} onValueChange={(val: 'escpos' | 'tspl') => handleSettingChange('labelProtocol', val)}>
                    <SelectTrigger id="labelProtocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escpos">ESC/POS (XP-80C / Thermal Receipt)</SelectItem>
                      <SelectItem value="tspl">TSPL / Label Mode (XP-365B / TSC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Label Toggles */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('Show Store Name on Label')}</Label>
                  <Switch
                    checked={settings.showStoreNameOnLabel}
                    onCheckedChange={(checked) => handleSettingChange('showStoreNameOnLabel', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('Show Selling Price')}</Label>
                  <Switch checked={settings.showPriceOnLabel} onCheckedChange={(checked) => handleSettingChange('showPriceOnLabel', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('Show SKU / Product Code')}</Label>
                  <Switch checked={settings.showSkuOnLabel} onCheckedChange={(checked) => handleSettingChange('showSkuOnLabel', checked)} />
                </div>
              </div>

              {/* Test Label Button */}
              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={handleTestLabel} disabled={isTestingLabel || agentStatus !== 'online'} className="gap-2">
                  {isTestingLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {t('Send Test Label Print')}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

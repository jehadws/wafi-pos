/**
 * POS printing service for React.
 *
 * Printing is a feature of the Subul backend, not a side-car process: every
 * call goes through the authenticated API client, and the terminal's printer
 * configuration is stored server-side as options so it is shared by every
 * cashier and browser on that machine.
 */

import { printingApi } from '@/api/printing';
import { i18n } from '@/lib/i18n';
import { hashKey, LabelPayload, labelPrintableKey } from '@/lib/label-layout';
import { Order } from '@/types/models/order';
import { formatDate } from '@/utils/format';

export interface WindowsPrinter {
  name: string;
  port: string;
  driver: string;
  isDefault: boolean;
  isOffline: boolean;
  status: number;
  labelProtocol?: 'auto' | 'escpos' | 'tspl';
}

export interface PrintingStatus {
  status: 'online' | 'offline';
  service?: string;
  version?: string;
  platform?: string;
  timestamp?: string;
}

export type PrinterEncoding = 'cp864' | 'cp1256' | 'utf8' | 'cp437';

export interface PrinterSettings {
  /** Empty means "print on the current Windows default printer". */
  receiptPrinter: string;
  labelPrinter: string;
  lineWidth: number;
  encoding: PrinterEncoding;
  cutPaper: boolean;
  openCashDrawer: boolean;
  showTaxBreakdown: boolean;
  autoPrintOnSale: boolean;
  copies: number;
  lineSpacing: number | null;
  labelWidthMm: number;
  labelHeightMm: number;
  labelProtocol: 'auto' | 'escpos' | 'tspl';
  barcodeHeight: number;
  showStoreNameOnLabel: boolean;
  showPriceOnLabel: boolean;
  showSkuOnLabel: boolean;
  showBarcodeTextOnLabel: boolean;
}

export interface FormattedReceiptData {
  storeName?: string;
  storeAddress?: string;
  storeCity?: string;
  storePhone?: string;
  storeEmail?: string;
  storePobox?: string;
  storeLogo?: string;
  orderCode?: string;
  date?: string;
  cashier?: string;
  customer?: string;
  orderType?: string;
  items: Array<{
    name: string;
    quantity: number | string;
    price?: number | string;
    total?: number | string;
  }>;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  taxes?: Array<{ name: string; rate: number; tax_value: number }>;
  total: number | string;
  tendered?: number | string;
  change?: number | string;
  paymentMethod?: string;
  payments?: Array<{ name: string; value: number | string }>;
  barcode?: string;
  qrCode?: string;
  footer?: string;
}

export interface LabelItemData {
  name: string;
  price?: number | string;
  barcode?: string;
  sku?: string;
  unit?: string;
  copies?: number;
  storeName?: string;
}

/** One server-rendered sticker: the exact pixels the printer burns, as a PNG. */
export interface LabelPreviewImage {
  widthDots: number;
  heightDots: number;
  overflow: boolean;
  image: string;
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  printer?: string;
  message?: string;
  error?: string;
  /** The printing API itself could not be reached, rather than the printer failing. */
  isOffline?: boolean;
}

/** Where builds before the integrated printing backend stored printer settings. */
const LEGACY_SETTINGS_KEY = 'pos_direct_printer_settings';

/** Matches the backend defaults, so the UI renders before settings are hydrated. */
export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  receiptPrinter: '',
  labelPrinter: '',
  lineWidth: 42,
  encoding: 'cp864',
  cutPaper: true,
  openCashDrawer: false,
  showTaxBreakdown: true,
  autoPrintOnSale: true,
  copies: 1,
  lineSpacing: null,
  labelWidthMm: 50,
  labelHeightMm: 30,
  labelProtocol: 'auto',
  barcodeHeight: 45,
  showStoreNameOnLabel: true,
  showPriceOnLabel: true,
  showSkuOnLabel: false,
  showBarcodeTextOnLabel: true,
};

export function receiptJobId(orderCode?: string | number | null): string {
  return `rcpt_${orderCode || 'job'}_${Date.now()}`;
}

export class PrintingService {
  private settings: PrinterSettings = { ...DEFAULT_PRINTER_SETTINGS };
  private hydration: Promise<PrinterSettings> | null = null;

  /**
   * The last hydrated settings. Synchronous so previews can lay out; call
   * loadSettings() first when the values are about to be shown or saved.
   */
  public getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  /** Read the terminal's stored settings, reusing one in-flight request. */
  public loadSettings(force = false): Promise<PrinterSettings> {
    if (force || !this.hydration) {
      this.hydration = printingApi
        .getSettings()
        .then(async (res: any) => {
          this.settings = { ...DEFAULT_PRINTER_SETTINGS, ...(res?.settings ?? {}) };
          await this.adoptLegacySettings();

          return this.settings;
        })
        .catch((err) => {
          this.hydration = null;
          throw err;
        });
    }

    return this.hydration;
  }

  /**
   * Builds before printing moved into the backend kept the terminal's printer
   * in this browser's localStorage. Upgrade once, on this machine's own terms:
   * the blob only wins while the server has no printer configured yet.
   */
  private async adoptLegacySettings(): Promise<void> {
    let legacy: Record<string, unknown> | null = null;

    try {
      const saved = localStorage.getItem(LEGACY_SETTINGS_KEY);
      legacy = saved ? JSON.parse(saved) : null;
    } catch {
      return;
    }

    if (!legacy) return;
    localStorage.removeItem(LEGACY_SETTINGS_KEY);

    const hasPrinter = Boolean(legacy.receiptPrinter || legacy.labelPrinter);
    const serverIsUnset = !this.settings.receiptPrinter && !this.settings.labelPrinter;
    if (!hasPrinter || !serverIsUnset) return;

    const patch: Partial<PrinterSettings> = {};
    for (const key of Object.keys(DEFAULT_PRINTER_SETTINGS) as Array<keyof PrinterSettings>) {
      if (key in legacy) (patch as Record<string, unknown>)[key] = legacy[key];
    }
    // Old builds persisted 'escpos' by default, which made TSPL-only label printers print nothing.
    if (patch.labelProtocol === 'escpos' && !legacy.labelPrinter) delete patch.labelProtocol;

    await this.saveSettings(patch).catch(() => undefined);
  }

  /** Persist changed settings and keep the local copy in sync with the server. */
  public async saveSettings(patch: Partial<PrinterSettings>): Promise<PrinterSettings> {
    const res: any = await printingApi.saveSettings(patch);
    this.settings = { ...this.settings, ...(res?.settings ?? patch) };
    this.hydration = Promise.resolve(this.settings);

    return this.settings;
  }

  public async checkStatus(): Promise<PrintingStatus> {
    try {
      const res: any = await printingApi.status();

      return res?.status ? res : { status: 'online', ...res };
    } catch {
      return { status: 'offline' };
    }
  }

  public async getPrinters(refresh = false): Promise<WindowsPrinter[]> {
    const res: any = await printingApi.printers(refresh);

    return Array.isArray(res?.printers) ? res.printers : [];
  }

  /**
   * Send a sample receipt or label to the configured printer. Throws with a
   * ready-to-toast message so the settings dialog can show the failure.
   */
  public async testPrinter(
    printer: string | undefined,
    type: 'receipt' | 'label' = 'receipt',
    sample: 'arabic' | 'english' | 'mixed' = 'mixed',
  ): Promise<any> {
    try {
      return await printingApi.test({ printer: printer || undefined, type, sample, lang: i18n.getLocale() });
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err));
    }
  }

  /**
   * A caller that may retry the same receipt passes its own jobId: the backend prints
   * a job id once and answers a repeat with the original result.
   */
  public async printReceipt(
    receiptData: FormattedReceiptData,
    overrides: Partial<PrinterSettings> = {},
    jobId: string = receiptJobId(receiptData.orderCode),
  ): Promise<PrintResult> {
    try {
      const res: any = await printingApi.printReceipt({
        printer: overrides.receiptPrinter || undefined,
        data: receiptData,
        config: this.receiptConfig(overrides),
        lang: i18n.getLocale(),
        jobId,
      });

      return { success: true, jobId, ...res };
    } catch (err: any) {
      return this.printFailure(jobId, err);
    }
  }

  public async printLabels(labels: LabelItemData[], overrides: Partial<PrinterSettings> = {}): Promise<PrintResult> {
    const jobId = `lbl_${Date.now()}`;

    try {
      const res: any = await printingApi.printLabels({
        printer: overrides.labelPrinter || undefined,
        labels,
        config: this.labelConfig(overrides),
        jobId,
      });

      return { success: true, jobId, ...res };
    } catch (err: any) {
      return this.printFailure(jobId, err);
    }
  }

  /**
   * Ask the backend to draw labels as the printer will burn them. Identical
   * labels are requested once; the result is keyed by labelPrintableKey so each
   * sticker on screen can find its own pixels. Null values mean the preview
   * endpoint was unreachable and callers should keep their local fallback.
   */
  public async previewLabels(labels: LabelPayload[], overrides: Partial<PrinterSettings> = {}): Promise<Record<string, LabelPreviewImage | null>> {
    const unique = new Map<string, LabelPayload>();
    for (const label of labels) {
      const key = this.previewKey(label);
      if (!unique.has(key)) unique.set(key, label);
    }

    const out: Record<string, LabelPreviewImage | null> = {};
    if (unique.size === 0) return out;

    try {
      const res: any = await printingApi.previewLabels({
        labels: [...unique.values()],
        config: this.labelConfig(overrides),
      });
      const previews: Array<LabelPreviewImage | null> = Array.isArray(res?.previews) ? res.previews : [];
      let index = 0;
      for (const key of unique.keys()) {
        out[key] = previews[index++] ?? null;
      }
    } catch {
      for (const key of unique.keys()) out[key] = null;
    }

    return out;
  }

  public previewKey(label: LabelPayload): string {
    return hashKey(labelPrintableKey(label));
  }

  /** Pulse the drawer (ESC p) on the receipt printer, which usually wires it. */
  public async openCashDrawer(printerName?: string): Promise<PrintResult> {
    try {
      const res: any = await printingApi.openDrawer({ printer: printerName || undefined });

      return { success: true, ...res };
    } catch (err: any) {
      return this.printFailure(undefined, err);
    }
  }

  /**
   * Print an order receipt: maps the POS Order onto the receipt payload and
   * lets the backend apply the terminal's stored printer configuration.
   *
   * Amounts travel as plain numbers: the backend owns the symbol, precision and
   * separators (`sb_currency_*`) and the language of the printed labels, so the
   * same order prints a SAR receipt in Riyadh and a $ receipt elsewhere.
   *
   * @param priceWithTax mirrors the "Show Price With Tax" POS option so printed
   *                     items match what the cashier saw on screen.
   */
  public async printOrderReceipt(
    order: Order,
    mode: string = 'sale',
    overrides: Partial<PrinterSettings> = {},
    priceWithTax: boolean = true,
    jobId?: string,
  ): Promise<PrintResult> {
    void mode;
    const orderRecord = order as unknown as Record<string, unknown>;
    const receiptData: FormattedReceiptData = {
      orderCode: order.code ?? String(order.id ?? Date.now()),
      date: formatDate(order.created_at ?? new Date().toISOString()),
      customer: order.customer ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim() : undefined,
      cashier: (orderRecord.user_username as string | undefined) ?? (orderRecord.cashier as string | undefined),
      items: (order.products ?? []).map((p: any) => ({
        name: p.name,
        quantity: p.quantity,
        price: priceWithTax ? (p.price_with_tax ?? p.unit_price ?? 0) : (p.price_without_tax ?? p.unit_price ?? 0),
        total: priceWithTax ? (p.total_price_with_tax ?? p.total_price ?? 0) : (p.total_price_without_tax ?? p.total_price ?? 0),
      })),
      subtotal: order.subtotal ?? 0,
      discount: order.discount || undefined,
      tax: order.tax_value || undefined,
      taxes: Array.isArray(order.taxes)
        ? order.taxes.map((tax: any) => ({
            name: tax.name ?? 'Tax',
            rate: tax.rate ?? 0,
            tax_value: tax.tax_value ?? 0,
          }))
        : undefined,
      total: order.total ?? 0,
      tendered: order.tendered || undefined,
      change: order.change ?? undefined,
      payments: Array.isArray(order.payments)
        ? order.payments.map((payment: any) => ({
            name: payment.label ?? payment.identifier,
            value: payment.value,
          }))
        : undefined,
      barcode: order.code,
    };

    return this.printReceipt(receiptData, overrides, jobId);
  }

  /**
   * Only keys the caller actually set travel as overrides; everything else is
   * resolved from the stored settings by the backend.
   */
  private receiptConfig(overrides: Partial<PrinterSettings>): Record<string, unknown> {
    return this.pickConfig(overrides, {
      lineWidth: 'lineWidth',
      encoding: 'encoding',
      lineSpacing: 'lineSpacing',
      cutPaper: 'cutPaper',
      openCashDrawer: 'openCashDrawer',
      showTaxBreakdown: 'showTaxBreakdown',
      copies: 'copies',
    });
  }

  private labelConfig(overrides: Partial<PrinterSettings>): Record<string, unknown> {
    return this.pickConfig(overrides, {
      labelWidthMm: 'widthMm',
      labelHeightMm: 'heightMm',
      barcodeHeight: 'barcodeHeight',
      labelProtocol: 'protocol',
      showStoreNameOnLabel: 'showStoreName',
      showPriceOnLabel: 'showPrice',
      showSkuOnLabel: 'showSku',
      showBarcodeTextOnLabel: 'showBarcodeText',
      lineWidth: 'lineWidth',
      encoding: 'encoding',
      lineSpacing: 'lineSpacing',
      cutPaper: 'cut',
      copies: 'copies',
    });
  }

  private pickConfig(overrides: Partial<PrinterSettings>, map: Record<string, string>): Record<string, unknown> {
    const config: Record<string, unknown> = {};

    for (const [settingKey, configKey] of Object.entries(map)) {
      const value = (overrides as Record<string, unknown>)[settingKey];
      if (value !== undefined) config[configKey] = value;
    }

    return config;
  }

  private printFailure(jobId?: string, err?: any): PrintResult {
    const isOffline = !err?.response;

    return { success: false, jobId, error: this.formatErrorMessage(err), isOffline };
  }

  public formatErrorMessage(err: any): string {
    if (!err?.response) {
      return err?.code === 'ECONNABORTED'
        ? 'Printing timed out. Check that the printer is powered on and responsive.'
        : 'The Subul printing service could not be reached. Reload the POS and try again.';
    }

    return err.response?.data?.message || err.message || 'Printer communication error';
  }
}

export default new PrintingService();

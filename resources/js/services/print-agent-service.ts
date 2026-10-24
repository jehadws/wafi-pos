/**
 * POS Print Agent Service for React
 * Communicates with the local Windows Print Agent (http://127.0.0.1:8189)
 * for direct thermal receipt and barcode label printing via ESC/POS & TSPL.
 */

import { Order } from '@/types/models/order';
import { formatCurrency, formatDate } from '@/utils/format';
import axios from 'axios';

export interface WindowsPrinter {
  name: string;
  port: string;
  driver: string;
  isDefault: boolean;
  isOffline: boolean;
  status: number;
  labelProtocol?: 'auto' | 'escpos' | 'tspl';
}

export interface PrintAgentStatus {
  status: 'online' | 'offline';
  service?: string;
  version?: string;
  uptimeSeconds?: number;
  timestamp?: string;
}

export interface PrinterSettings {
  agentUrl: string;
  receiptPrinter: string;
  labelPrinter: string;
  lineWidth: number; // 42 or 46 for 76mm/80mm 203 DPI
  encoding?: 'cp864' | 'cp1256' | 'utf8' | 'cp437';
  cutPaper: boolean;
  openCashDrawer: boolean;
  showTaxBreakdown: boolean;
  autoPrintOnSale: boolean;
  copies: number;
  labelWidthMm: number;
  labelHeightMm: number;
  labelProtocol: 'auto' | 'escpos' | 'tspl';
  barcodeHeight: number;
  showStoreNameOnLabel: boolean;
  showPriceOnLabel: boolean;
  showSkuOnLabel: boolean;
  showBarcodeTextOnLabel?: boolean;
  lineSpacing?: number | null;
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

export interface PrintResult {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
  isOffline?: boolean;
}

const SETTINGS_KEY = 'pos_direct_printer_settings';
const DEFAULT_ENCODING = 'cp864';
const NO_DEFAULT_PRINTER_ERROR = 'No default printer is set in Windows. Set one in Settings > Bluetooth & devices > Printers & scanners.';

// An empty receiptPrinter / labelPrinter means "use the current Windows default printer".
const DEFAULT_SETTINGS: PrinterSettings = {
  agentUrl: 'http://127.0.0.1:8189',
  receiptPrinter: '',
  labelPrinter: '',
  lineWidth: 42, // Safe 76mm 203 DPI width
  encoding: DEFAULT_ENCODING,
  cutPaper: true,
  openCashDrawer: false,
  showTaxBreakdown: true,
  autoPrintOnSale: true,
  copies: 1,
  labelWidthMm: 50,
  labelHeightMm: 30,
  labelProtocol: 'auto',
  barcodeHeight: 45,
  showStoreNameOnLabel: true,
  showPriceOnLabel: true,
  showSkuOnLabel: false,
  lineSpacing: null,
};

export class PrintAgentService {
  private settings: PrinterSettings;
  private cachedStatus: { status: PrintAgentStatus; timestamp: number } | null = null;
  private static STATUS_CACHE_TTL_MS = 3000;
  private cachedDefaultPrinter: { name: string; timestamp: number } | null = null;
  // The agent's printer lookup takes ~1s (PowerShell), so don't repeat it on every print.
  private static DEFAULT_PRINTER_CACHE_TTL_MS = 30000;

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  public loadSettings(): PrinterSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Older builds persisted 'escpos' as the default, which made TSPL-only label printers print nothing.
        if (parsed.labelProtocol === 'escpos') delete parsed.labelProtocol;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  public saveSettings(newSettings: Partial<PrinterSettings>): PrinterSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save printer settings to localStorage:', e);
    }
    return this.settings;
  }

  public getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  /**
   * Check if Print Agent is running with short timeout and caching
   */
  public async checkStatus(forceRefresh: boolean = false): Promise<PrintAgentStatus> {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && now - this.cachedStatus.timestamp < PrintAgentService.STATUS_CACHE_TTL_MS) {
      return this.cachedStatus.status;
    }

    try {
      const res = await axios.get(`${this.settings.agentUrl}/status`, { timeout: 1500 });
      const statusResult: PrintAgentStatus = res.data?.status ? res.data : { status: 'online', ...res.data };
      this.cachedStatus = { status: statusResult, timestamp: now };
      return statusResult;
    } catch {
      const offlineStatus: PrintAgentStatus = { status: 'offline' };
      this.cachedStatus = { status: offlineStatus, timestamp: now };
      return offlineStatus;
    }
  }

  /**
   * Discover all installed Windows printers
   */
  public async getPrinters(): Promise<WindowsPrinter[]> {
    try {
      const res = await axios.get(`${this.settings.agentUrl}/printers`, { timeout: 5000 });
      if (res.data && Array.isArray(res.data.printers)) {
        return res.data.printers;
      }
      return [];
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err));
    }
  }

  /**
   * Returns the configured printer, or the current Windows default when none is configured.
   * Resolves to '' when Windows has no default printer.
   */
  public async resolvePrinter(configured?: string): Promise<string> {
    if (configured) return configured;

    const now = Date.now();
    if (this.cachedDefaultPrinter && now - this.cachedDefaultPrinter.timestamp < PrintAgentService.DEFAULT_PRINTER_CACHE_TTL_MS) {
      return this.cachedDefaultPrinter.name;
    }

    const res = await axios.get(`${this.settings.agentUrl}/printers`, { timeout: 5000 });
    const printers: WindowsPrinter[] = Array.isArray(res.data?.printers) ? res.data.printers : [];
    const defaultPrinter = printers.find((p) => p.isDefault);
    if (!defaultPrinter) return '';

    this.cachedDefaultPrinter = { name: defaultPrinter.name, timestamp: now };
    return defaultPrinter.name;
  }

  /**
   * Send test receipt or test label
   */
  public async testPrinter(printerName?: string, type: 'receipt' | 'label' = 'receipt', sample?: 'arabic' | 'english' | 'mixed'): Promise<any> {
    let targetPrinter: string;
    try {
      targetPrinter = await this.resolvePrinter(printerName || (type === 'label' ? this.settings.labelPrinter : this.settings.receiptPrinter));
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err));
    }
    if (!targetPrinter) {
      throw new Error(NO_DEFAULT_PRINTER_ERROR);
    }

    try {
      const res = await axios.post(
        `${this.settings.agentUrl}/test`,
        {
          printer: targetPrinter,
          type,
          sample: sample || 'mixed',
          lineWidth: this.settings.lineWidth,
          encoding: this.settings.encoding || DEFAULT_ENCODING,
          lineSpacing: this.settings.lineSpacing,
          cutPaper: this.settings.cutPaper,
          openCashDrawer: this.settings.openCashDrawer,
          protocol: this.settings.labelProtocol,
        },
        { timeout: 6000 },
      );
      return res.data;
    } catch (err: any) {
      throw new Error(this.formatErrorMessage(err));
    }
  }

  /**
   * Print receipt directly to thermal printer
   */
  public async printReceipt(receiptData: FormattedReceiptData, options: Partial<PrinterSettings> = {}): Promise<PrintResult> {
    const jobId = `rcpt_${receiptData.orderCode || Date.now()}_${Date.now()}`;

    try {
      const targetPrinter = await this.resolvePrinter(options.receiptPrinter || this.settings.receiptPrinter);
      if (!targetPrinter) {
        return { success: false, jobId, error: NO_DEFAULT_PRINTER_ERROR };
      }

      const payload = {
        printer: targetPrinter,
        data: receiptData,
        config: {
          lineWidth: options.lineWidth || this.settings.lineWidth || 42,
          encoding: options.encoding || this.settings.encoding || DEFAULT_ENCODING,
          cutPaper: options.cutPaper ?? this.settings.cutPaper ?? true,
          openCashDrawer: options.openCashDrawer ?? this.settings.openCashDrawer ?? false,
          showTaxBreakdown: options.showTaxBreakdown ?? this.settings.showTaxBreakdown ?? true,
          copies: options.copies || this.settings.copies || 1,
        },
        jobId,
      };

      const res = await axios.post(`${this.settings.agentUrl}/print/receipt`, payload, { timeout: 5000 });
      return {
        success: true,
        jobId,
        ...res.data,
      };
    } catch (err: any) {
      const errorMsg = this.formatErrorMessage(err);
      const isOffline = !err.response || err.code === 'ECONNABORTED';
      return {
        success: false,
        jobId,
        error: errorMsg,
        isOffline,
      };
    }
  }

  /**
   * Pulse the cash drawer (ESC p kick) without printing a receipt.
   * Uses the receipt printer, which is typically wired to the drawer.
   */
  public async openCashDrawer(printerName?: string): Promise<PrintResult> {
    try {
      const targetPrinter = await this.resolvePrinter(printerName || this.settings.receiptPrinter);
      if (!targetPrinter) {
        return { success: false, error: NO_DEFAULT_PRINTER_ERROR };
      }

      const res = await axios.post(`${this.settings.agentUrl}/drawer/open`, { printer: targetPrinter }, { timeout: 4000 });
      return {
        success: true,
        ...res.data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: this.formatErrorMessage(err),
        isOffline: !err.response || err.code === 'ECONNABORTED',
      };
    }
  }

  /**
   * Print product barcode labels directly to label printer
   */
  public async printLabels(labels: LabelItemData[], options: Partial<PrinterSettings> = {}): Promise<PrintResult> {
    const jobId = `lbl_${Date.now()}`;

    try {
      const targetPrinter = await this.resolvePrinter(options.labelPrinter || this.settings.labelPrinter);
      if (!targetPrinter) {
        return { success: false, jobId, error: NO_DEFAULT_PRINTER_ERROR };
      }

      const payload = {
        printer: targetPrinter,
        labels,
        config: {
          widthMm: options.labelWidthMm || this.settings.labelWidthMm || 50,
          heightMm: options.labelHeightMm || this.settings.labelHeightMm || 30,
          lineWidth: options.lineWidth || this.settings.lineWidth || 36,
          encoding: options.encoding || this.settings.encoding || DEFAULT_ENCODING,
          protocol: options.labelProtocol || this.settings.labelProtocol || 'auto',
          barcodeHeight: options.barcodeHeight || this.settings.barcodeHeight || 45,
          showStoreName: options.showStoreNameOnLabel ?? this.settings.showStoreNameOnLabel ?? true,
          showPrice: options.showPriceOnLabel ?? this.settings.showPriceOnLabel ?? true,
          showSku: options.showSkuOnLabel ?? this.settings.showSkuOnLabel ?? false,
          showBarcodeText: options.showBarcodeTextOnLabel ?? this.settings.showBarcodeTextOnLabel ?? true,
          copies: options.copies || this.settings.copies || 1,
        },
        jobId,
      };

      const res = await axios.post(`${this.settings.agentUrl}/print/label`, payload, { timeout: 8000 });
      return {
        success: true,
        jobId,
        ...res.data,
      };
    } catch (err: any) {
      const errorMsg = this.formatErrorMessage(err);
      return {
        success: false,
        jobId,
        error: errorMsg,
        isOffline: !err.response || err.code === 'ECONNABORTED',
      };
    }
  }

  /**
   * Print an order receipt.
   * Maps the POS Order object to FormattedReceiptData and sends it to the agent.
   *
   * @param priceWithTax  mirrors the "Show Price With Tax" POS option so the
   *                      printed items match what the cashier saw on screen.
   *                      Defaults to true (dashboard callers have no POS
   *                      options and the historical behavior was with-tax).
   */
  public async printOrderReceipt(
    order: Order,
    mode: string = 'sale',
    options: Partial<PrinterSettings> = {},
    priceWithTax: boolean = true,
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
        price: formatCurrency(priceWithTax ? (p.price_with_tax ?? p.unit_price ?? 0) : (p.price_without_tax ?? p.unit_price ?? 0)),
        total: formatCurrency(priceWithTax ? (p.total_price_with_tax ?? p.total_price ?? 0) : (p.total_price_without_tax ?? p.total_price ?? 0)),
      })),
      subtotal: formatCurrency(order.subtotal ?? 0),
      discount: order.discount ? formatCurrency(order.discount) : undefined,
      tax: order.tax_value ? formatCurrency(order.tax_value) : undefined,
      taxes: Array.isArray(order.taxes)
        ? order.taxes.map((t: any) => ({
            name: t.name ?? 'Tax',
            rate: t.rate ?? 0,
            tax_value: t.tax_value ?? 0,
          }))
        : undefined,
      total: formatCurrency(order.total ?? 0),
      tendered: order.tendered ? formatCurrency(order.tendered) : undefined,
      change: order.change != null ? formatCurrency(order.change) : undefined,
      payments: Array.isArray(order.payments)
        ? order.payments.map((p: any) => ({
            name: p.label ?? p.identifier,
            value: formatCurrency(p.value),
          }))
        : undefined,
      barcode: order.code,
    };

    return this.printReceipt(receiptData, options);
  }

  public formatErrorMessage(err: any): string {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return 'Print Agent timed out. Please check if your printer is powered on and responsive.';
    }
    if (!err.response) {
      return 'Print Agent is not running. Please start the POS Print Agent (run "start.bat" in the print-agent folder).';
    }
    return err.response?.data?.error || err.response?.data?.message || err.message || 'Printer communication error';
  }
}

export default new PrintAgentService();

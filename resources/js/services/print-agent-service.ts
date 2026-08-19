/**
 * POS Print Agent Service for React
 * Communicates with the local Windows Print Agent (http://127.0.0.1:8189)
 * for direct thermal receipt and barcode label printing via ESC/POS & TSPL.
 */

import axios from 'axios';

export interface WindowsPrinter {
    name: string;
    port: string;
    driver: string;
    isDefault: boolean;
    isOffline: boolean;
    status: number;
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
    cutPaper: boolean;
    openCashDrawer: boolean;
    showTaxBreakdown: boolean;
    autoPrintOnSale: boolean;
    copies: number;
    labelWidthMm: number;
    labelHeightMm: number;
    labelProtocol: 'escpos' | 'tspl';
    barcodeHeight: number;
    showStoreNameOnLabel: boolean;
    showPriceOnLabel: boolean;
    showSkuOnLabel: boolean;
}

export interface FormattedReceiptData {
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    storeEmail?: string;
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

const SETTINGS_KEY = 'pos_direct_printer_settings';

const DEFAULT_SETTINGS: PrinterSettings = {
    agentUrl: 'http://127.0.0.1:8189',
    receiptPrinter: 'XP-80C',
    labelPrinter: 'XP-80C',
    lineWidth: 42, // Safe 76mm 203 DPI width
    cutPaper: true,
    openCashDrawer: false,
    showTaxBreakdown: true,
    autoPrintOnSale: true,
    copies: 1,
    labelWidthMm: 50,
    labelHeightMm: 30,
    labelProtocol: 'escpos',
    barcodeHeight: 45,
    showStoreNameOnLabel: true,
    showPriceOnLabel: true,
    showSkuOnLabel: false,
};

class PrintAgentService {
    private settings: PrinterSettings;

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
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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
     * Check if Print Agent is running
     */
    public async checkStatus(): Promise<PrintAgentStatus> {
        try {
            const res = await axios.get(`${this.settings.agentUrl}/status`, { timeout: 2000 });
            return res.data;
        } catch {
            return { status: 'offline' };
        }
    }

    /**
     * Discover all installed Windows printers
     */
    public async getPrinters(): Promise<WindowsPrinter[]> {
        try {
            const res = await axios.get(`${this.settings.agentUrl}/printers`, { timeout: 8000 });
            if (res.data && Array.isArray(res.data.printers)) {
                return res.data.printers;
            }
            return [];
        } catch (err: any) {
            throw new Error(this.formatErrorMessage(err));
        }
    }

    /**
     * Send test receipt or test label
     */
    public async testPrinter(printerName?: string, type: 'receipt' | 'label' = 'receipt'): Promise<any> {
        const targetPrinter = printerName || (type === 'label' ? this.settings.labelPrinter : this.settings.receiptPrinter);
        try {
            const res = await axios.post(`${this.settings.agentUrl}/test`, {
                printer: targetPrinter,
                type,
                lineWidth: this.settings.lineWidth,
                cutPaper: this.settings.cutPaper,
                openCashDrawer: this.settings.openCashDrawer,
                protocol: this.settings.labelProtocol
            }, { timeout: 12000 });
            return res.data;
        } catch (err: any) {
            throw new Error(this.formatErrorMessage(err));
        }
    }

    /**
     * Print receipt directly to thermal printer
     */
    public async printReceipt(receiptData: FormattedReceiptData, options: Partial<PrinterSettings> = {}): Promise<any> {
        const targetPrinter = options.receiptPrinter || this.settings.receiptPrinter;
        if (!targetPrinter) {
            throw new Error('No receipt printer selected. Please configure your printer in POS Settings.');
        }

        const payload = {
            printer: targetPrinter,
            data: receiptData,
            config: {
                lineWidth: options.lineWidth || this.settings.lineWidth || 42,
                cutPaper: options.cutPaper ?? this.settings.cutPaper ?? true,
                openCashDrawer: options.openCashDrawer ?? this.settings.openCashDrawer ?? false,
                showTaxBreakdown: options.showTaxBreakdown ?? this.settings.showTaxBreakdown ?? true,
                copies: options.copies || this.settings.copies || 1,
            },
            jobId: `rcpt_${receiptData.orderCode || Date.now()}_${Date.now()}`
        };

        try {
            const res = await axios.post(`${this.settings.agentUrl}/print/receipt`, payload, { timeout: 15000 });
            return res.data;
        } catch (err: any) {
            throw new Error(this.formatErrorMessage(err));
        }
    }

    /**
     * Print product barcode labels directly to label printer
     */
    public async printLabels(labels: LabelItemData[], options: Partial<PrinterSettings> = {}): Promise<any> {
        const targetPrinter = options.labelPrinter || this.settings.labelPrinter;
        if (!targetPrinter) {
            throw new Error('No label printer selected. Please configure your label printer in POS Settings.');
        }

        const payload = {
            printer: targetPrinter,
            labels,
            config: {
                widthMm: options.labelWidthMm || this.settings.labelWidthMm || 50,
                heightMm: options.labelHeightMm || this.settings.labelHeightMm || 30,
                lineWidth: options.lineWidth || this.settings.lineWidth || 36,
                protocol: options.labelProtocol || this.settings.labelProtocol || 'escpos',
                barcodeHeight: options.barcodeHeight || this.settings.barcodeHeight || 45,
                showStoreName: options.showStoreNameOnLabel ?? this.settings.showStoreNameOnLabel ?? true,
                showPrice: options.showPriceOnLabel ?? this.settings.showPriceOnLabel ?? true,
                showSku: options.showSkuOnLabel ?? this.settings.showSkuOnLabel ?? false,
                copies: options.copies || this.settings.copies || 1,
            },
            jobId: `lbl_${Date.now()}`
        };

        try {
            const res = await axios.post(`${this.settings.agentUrl}/print/label`, payload, { timeout: 20000 });
            return res.data;
        } catch (err: any) {
            throw new Error(this.formatErrorMessage(err));
        }
    }

    private formatErrorMessage(err: any): string {
        if (!err.response) {
            return 'Print Agent is not running. Please start the POS Print Agent (run "start.bat" in the print-agent folder).';
        }
        return err.response?.data?.error || err.response?.data?.message || err.message || 'Printer communication error';
    }
}

export default new PrintAgentService();

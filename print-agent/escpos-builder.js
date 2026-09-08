/**
 * ESC/POS Command Generator for Direct Thermal Receipt Printers
 * Supports 203 DPI Direct Thermal printers (58mm, 76mm, 80mm).
 * Configurable character width (default 42-46 chars/line for 76mm/80mm).
 * Full Arabic language support with glyph shaping, BiDi reordering, and multi-codepage handling.
 */

const iconv = require('iconv-lite');
const { encodeEscPosString, cleanCurrencyForCp437, processArabicLine, hasArabic } = require('./arabic-helper');

// Map of character-code-table names to the numeric value used by the
// ESC/POS "Select character code table" command (ESC t n).
const CODEPAGE_CODES = {
    cp437: 0, // USA / Standard Europe (Default on almost all printers)
    katakana: 1,
    cp850: 2, // Multilingual (Latin-1)
    cp860: 3, // Portuguese
    cp863: 4, // Canadian French
    cp865: 5, // Nordic
    cp1252: 16, // Windows-1252 (Western)
    cp866: 17, // Cyrillic #2
    cp852: 18, // Latin-2
    cp858: 19, // Euro Latin-1
    cp864: 40, // Arabic DOS / IBM864 (Standard Epson/ESC-POS table)
    cp1256: 36, // Windows-1256 (Arabic)
    cp1255: 35, // Windows-1255 (Hebrew)
    cp1254: 34, // Windows-1254 (Turkish)
    cp1257: 37, // Windows-1257 (Baltic)
    cp1258: 38, // Windows-1258 (Vietnamese)
    cp1251: 17, // Windows-1251 (Cyrillic)
};

function codepageCommand(name) {
    const key = String(name || '').toLowerCase().replace('-', '');
    if (key === 'utf8' || key === 'utf-8') {
        return []; // UTF-8 mode does not use standard 8-bit ESC t table
    }
    const code = CODEPAGE_CODES[key];
    if (code === undefined) {
        return [0x1B, 0x74, 0]; // Default fallback to table 0 (cp437)
    }
    return [0x1B, 0x74, code]; // ESC t n
}

class EscPosBuilder {
    constructor(options = {}) {
        this.buffer = [];
        this.lineWidth = options.lineWidth || 42; // Safe default for 76mm (203 DPI)
        // Default to cp864 for standard ESC/POS Arabic hardware printers,
        // or cp1256 / utf8 / cp437 based on config.
        this.encoding = options.encoding || options.codePage || 'cp864';
    }

    // Select the active character code table on the printer
    selectCodePage(name = this.encoding) {
        const cmd = codepageCommand(name);
        if (cmd && cmd.length > 0) {
            this._appendBytes(cmd);
        }
        return this;
    }

    // Low-level buffer helpers
    _appendBytes(bytes) {
        if (Array.isArray(bytes)) {
            this.buffer.push(...bytes);
        } else if (Buffer.isBuffer(bytes)) {
            for (const b of bytes) this.buffer.push(b);
        } else if (typeof bytes === 'number') {
            this.buffer.push(bytes);
        }
        return this;
    }

    _appendString(text) {
        // Route through arabic-helper so Arabic gets glyph shaping (joined forms)
        // and BiDi reordering (correct right-to-left reading order) before encoding.
        const buf = encodeEscPosString(String(text), this.encoding);
        for (const b of buf) this.buffer.push(b);
        return this;
    }

    // Initialize printer
    init() {
        this._appendBytes([0x1B, 0x40]); // ESC @ (Reset/Initialize)
        this.selectCodePage(this.encoding);
        return this;
    }

    // Text formatting
    setAlign(align = 'left') {
        let val = 0; // left
        if (align === 'center') val = 1;
        else if (align === 'right') val = 2;
        return this._appendBytes([0x1B, 0x61, val]); // ESC a n
    }

    setBold(enabled = true) {
        return this._appendBytes([0x1B, 0x45, enabled ? 1 : 0]); // ESC E n
    }

    setUnderline(enabled = true) {
        return this._appendBytes([0x1B, 0x2D, enabled ? 1 : 0]); // ESC - n
    }

    setInvert(enabled = true) {
        return this._appendBytes([0x1D, 0x42, enabled ? 1 : 0]); // GS B n
    }

    setTextSize(width = 1, height = 1) {
        // width: 1-8, height: 1-8
        const w = Math.max(1, Math.min(8, width)) - 1;
        const h = Math.max(1, Math.min(8, height)) - 1;
        const val = (w << 4) | h;
        return this._appendBytes([0x1D, 0x21, val]); // GS ! n
    }

    resetTextFormat() {
        this.setBold(false);
        this.setUnderline(false);
        this.setInvert(false);
        this.setTextSize(1, 1);
        this.setAlign('left');
        return this;
    }

    // Line spacing
    setDefaultLineSpacing() {
        return this._appendBytes([0x1B, 0x32]); // ESC 2 (1/6 inch, universally supported)
    }

    setCompactLineSpacing(dots = 24) {
        return this._appendBytes([0x1B, 0x33, dots]); // ESC 3 n
    }

    // Feed lines
    feed(lines = 1) {
        for (let i = 0; i < lines; i++) {
            this._appendBytes([0x0A]); // LF
        }
        return this;
    }

    // Print text line with newline
    line(text = '') {
        this._appendString(text);
        return this._appendBytes([0x0A]);
    }

    // Print line separator
    divider(char = '-') {
        return this.line(char.repeat(this.lineWidth));
    }

    doubleDivider() {
        return this.line('='.repeat(this.lineWidth));
    }

    dashedDivider() {
        const pattern = '- ';
        const count = Math.floor(this.lineWidth / 2);
        return this.line(pattern.repeat(count).padEnd(this.lineWidth, '-'));
    }

    // Print two-column key-value aligned line (e.g. Subtotal ....... $10.00)
    twoColumns(leftText, rightText, fillChar = ' ') {
        const leftFormatted = cleanCurrencyForCp437(String(leftText), this.encoding);
        const rightFormatted = cleanCurrencyForCp437(String(rightText), this.encoding);

        const leftProcessed = processArabicLine(leftFormatted);
        const rightProcessed = processArabicLine(rightFormatted);

        const leftLen = leftProcessed.length;
        const rightLen = rightProcessed.length;
        const spacesNeeded = this.lineWidth - leftLen - rightLen;

        if (spacesNeeded <= 0) {
            this._appendBytes(encodeEscPosString(leftProcessed, this.encoding));
            this._appendBytes([0x0A]);
            this.setAlign('right');
            this._appendBytes(encodeEscPosString(rightProcessed, this.encoding));
            this._appendBytes([0x0A]);
            this.setAlign('left');
        } else {
            const composite = leftProcessed + fillChar.repeat(spacesNeeded) + rightProcessed;
            this._appendBytes(encodeEscPosString(composite, this.encoding));
            this._appendBytes([0x0A]);
        }
        return this;
    }

    // Print three columns (e.g. Item | Qty | Total)
    threeColumns(col1, col2, col3, widths = [0.55, 0.20, 0.25]) {
        const w1 = Math.floor(this.lineWidth * widths[0]);
        const w2 = Math.floor(this.lineWidth * widths[1]);
        const w3 = this.lineWidth - w1 - w2;

        const c1 = processArabicLine(cleanCurrencyForCp437(String(col1), this.encoding)).substring(0, w1).padEnd(w1);
        const c2 = processArabicLine(cleanCurrencyForCp437(String(col2), this.encoding)).substring(0, w2).padStart(Math.floor(w2 / 2)).padEnd(w2);
        const c3 = processArabicLine(cleanCurrencyForCp437(String(col3), this.encoding)).substring(0, w3).padStart(w3);

        const composite = c1 + c2 + c3;
        this._appendBytes(encodeEscPosString(composite, this.encoding));
        this._appendBytes([0x0A]);
        return this;
    }

    /**
     * Print a table item row with word-wrapped product name without breaking price columns
     * Example:
     *   Delicious Fresh Hot   2x 5.00   10.00
     *   Coffee Latte
     */
    productRow(name, qty, unitPrice, total) {
        const qtyColWidth = 6;
        const totalColWidth = 14;
        const nameColWidth = this.lineWidth - qtyColWidth - totalColWidth;

        const cleanName = String(name || 'Item');
        const cleanUnitPrice = unitPrice ? cleanCurrencyForCp437(unitPrice, this.encoding) : null;
        const cleanTotal = cleanCurrencyForCp437(total, this.encoding);

        const words = cleanName.split(' ');
        const nameLines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + (currentLine ? ' ' : '') + word).length <= nameColWidth) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) nameLines.push(currentLine);
                if (word.length > nameColWidth) {
                    let rem = word;
                    while (rem.length > nameColWidth) {
                        nameLines.push(rem.substring(0, nameColWidth));
                        rem = rem.substring(nameColWidth);
                    }
                    currentLine = rem;
                } else {
                    currentLine = word;
                }
            }
        }
        if (currentLine) nameLines.push(currentLine);
        if (nameLines.length === 0) nameLines.push('');

        const qtyProcessed = String(qty).padStart(qtyColWidth);
        const totalProcessed = processArabicLine(cleanTotal).padStart(totalColWidth);
        const firstLineNameProcessed = processArabicLine(nameLines[0]).padEnd(nameColWidth);

        // First line contains first line of name + Qty + Total
        const firstLineComposite = firstLineNameProcessed + qtyProcessed + totalProcessed;
        this._appendBytes(encodeEscPosString(firstLineComposite, this.encoding));
        this._appendBytes([0x0A]);

        // Remaining lines of product name
        for (let i = 1; i < nameLines.length; i++) {
            const nextLineProcessed = processArabicLine(nameLines[i]).padEnd(nameColWidth);
            this._appendBytes(encodeEscPosString(nextLineProcessed, this.encoding));
            this._appendBytes([0x0A]);
        }

        // If unit price is given, print subtle detail line
        if (cleanUnitPrice) {
            const unitPriceProcessed = `  @ ${processArabicLine(cleanUnitPrice)}`;
            this._appendBytes(encodeEscPosString(unitPriceProcessed, this.encoding));
            this._appendBytes([0x0A]);
        }

        return this;
    }

    // Barcode (Code 128)
    barcode128(data, height = 60, width = 2, showText = true) {
        const text = String(data).trim();
        if (!text) return this;

        this.setAlign('center');
        this._appendBytes([0x1D, 0x68, Math.min(255, Math.max(20, height))]);
        this._appendBytes([0x1D, 0x77, Math.min(6, Math.max(1, width))]);
        this._appendBytes([0x1D, 0x48, showText ? 2 : 0]);
        this._appendBytes([0x1D, 0x66, 0]);

        const textBytes = Buffer.from(text, 'ascii');
        this._appendBytes([0x1D, 0x6B, 73, textBytes.length]);
        this._appendBytes(textBytes);
        this.feed(1);
        this.setAlign('left');
        return this;
    }

    // QR Code (Native ESC/POS 2D Barcode)
    qrCode(data, size = 5) {
        const text = String(data);
        const textBytes = Buffer.from(text, 'utf-8');
        const len = textBytes.length + 3;
        const pL = len % 256;
        const pH = Math.floor(len / 256);

        this.setAlign('center');
        this._appendBytes([0x1D, 0x28, 0x6B, 4, 0, 49, 65, 50, 0]);
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 67, Math.max(1, Math.min(16, size))]);
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 69, 49]);
        this._appendBytes([0x1D, 0x28, 0x6B, pL, pH, 49, 80, 48]);
        this._appendBytes(textBytes);
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 81, 48]);
        this.feed(1);
        this.setAlign('left');
        return this;
    }

    // Cash Drawer Kick (ESC p m t1 t2)
    cashDrawer(pin = 0) {
        return this._appendBytes([0x1B, 0x70, pin ? 1 : 0, 25, 250]);
    }

    // Paper Cut
    cut(partial = true) {
        this._appendBytes([0x1D, 0x56, partial ? 66 : 65, 3]);
        return this;
    }

    // Build the complete ESC/POS buffer
    toBuffer() {
        return Buffer.from(this.buffer);
    }
}

/**
 * Builds a complete ESC/POS receipt from structured JSON
 */
function buildReceiptEscPos(receiptData, config = {}) {
    const builder = new EscPosBuilder({
        lineWidth: config.lineWidth || 42,
        encoding: config.encoding || config.codePage || 'cp864',
    });

    builder.init();

    if (config.lineSpacing !== undefined && config.lineSpacing !== null) {
        builder.setCompactLineSpacing(Number(config.lineSpacing));
    }

    // 1. Store Header
    builder.setAlign('center');
    builder.setBold(true);
    builder.setTextSize(2, 2);
    builder.line(receiptData.storeName || 'Subul');
    builder.resetTextFormat();

    builder.setAlign('center');
    if (receiptData.storeAddress) builder.line(receiptData.storeAddress);
    if (receiptData.storeCity) builder.line(receiptData.storeCity);
    if (receiptData.storePobox) builder.line(`P.O.Box: ${receiptData.storePobox}`);
    if (receiptData.storePhone) builder.line(`Tel: ${receiptData.storePhone}`);
    if (receiptData.storeEmail) builder.line(receiptData.storeEmail);

    builder.dashedDivider();

    // 2. Order Info
    builder.setAlign('left');
    if (receiptData.orderCode) builder.twoColumns('Order:', receiptData.orderCode);
    if (receiptData.date) builder.twoColumns('Date:', receiptData.date);
    if (receiptData.cashier) builder.twoColumns('Cashier:', receiptData.cashier);
    if (receiptData.customer) builder.twoColumns('Customer:', receiptData.customer);
    if (receiptData.orderType) builder.twoColumns('Type:', String(receiptData.orderType).toUpperCase());

    builder.dashedDivider();

    // 3. Products Table
    const qtyCol = 6;
    const totalCol = 14;
    const nameCol = (config.lineWidth || 42) - qtyCol - totalCol;
    builder.setBold(true);
    builder.line('ITEM'.padEnd(nameCol) + 'QTY'.padStart(qtyCol) + 'TOTAL'.padStart(totalCol));
    builder.resetTextFormat();
    builder.divider('-');

    // Items
    if (Array.isArray(receiptData.items)) {
        for (const item of receiptData.items) {
            const name = item.name || 'Item';
            const qty = `${item.quantity || 1}x`;
            const unitPrice = item.price !== undefined ? `${item.price}` : null;
            const total = String(item.total !== undefined ? item.total : '');
            builder.productRow(name, qty, unitPrice, total);
        }
    }

    builder.dashedDivider();

    // 4. Summary Section
    if (receiptData.subtotal !== undefined) {
        builder.twoColumns('Subtotal', String(receiptData.subtotal));
    }

    if (receiptData.discount && Number(receiptData.discount) > 0) {
        builder.twoColumns('Discount', `-${receiptData.discount}`);
    }

    // Tax breakdown or total tax
    if (config.showTaxBreakdown && Array.isArray(receiptData.taxes) && receiptData.taxes.length > 0) {
        for (const tax of receiptData.taxes) {
            builder.twoColumns(`  ${tax.name} (${tax.rate}%)`, String(tax.tax_value));
        }
    } else if (receiptData.tax !== undefined && Number(receiptData.tax) > 0) {
        builder.twoColumns('Tax', String(receiptData.tax));
    }

    builder.doubleDivider();

    // Grand Total (Big & Bold)
    builder.setBold(true);
    builder.setTextSize(1, 2);
    builder.twoColumns('TOTAL', String(receiptData.total || '0.00'));
    builder.resetTextFormat();

    builder.divider('-');

    // 5. Payment Info
    if (receiptData.payments && Array.isArray(receiptData.payments) && receiptData.payments.length > 0) {
        for (const p of receiptData.payments) {
            builder.twoColumns(p.name || 'Paid', String(p.value || p.amount));
        }
    } else if (receiptData.tendered !== undefined) {
        builder.twoColumns('Tendered', String(receiptData.tendered));
    }

    if (receiptData.change !== undefined) {
        builder.twoColumns('Change', String(receiptData.change));
    }

    if (receiptData.paymentMethod) {
        builder.twoColumns('Method', String(receiptData.paymentMethod));
    }

    builder.dashedDivider();

    // 6. Optional Barcode / QR
    if (receiptData.barcode) {
        builder.barcode128(receiptData.barcode, 50, 2, true);
    } else if (receiptData.qrCode) {
        builder.qrCode(receiptData.qrCode, 4);
    }

    // 7. Footer Message
    builder.setAlign('center');
    if (receiptData.footer) {
        builder.line(receiptData.footer);
    } else {
        builder.line('Thank you for your business!');
    }
    builder.line('Powered by Subul');

    // 8. Kick Cash Drawer if requested (placed at end of print to avoid corrupting header on virtual/unsupported printers)
    if (config.openCashDrawer === true) {
        builder.cashDrawer();
    }

    // 9. Cut Paper
    if (config.cutPaper !== false) {
        builder.cut(true);
    } else {
        builder.feed(3);
    }

    return builder.toBuffer();
}

/**
 * Builds a minimal ESC/POS cash drawer kick buffer (no paper output).
 */
function buildDrawerKick(pin = 0) {
    const builder = new EscPosBuilder({});
    builder.init();
    builder.cashDrawer(pin);
    return builder.toBuffer();
}

module.exports = {
    EscPosBuilder,
    buildReceiptEscPos,
    buildDrawerKick
};

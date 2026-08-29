/**
 * ESC/POS Command Generator for Direct Thermal Receipt Printers
 * Supports 203 DPI Direct Thermal printers (58mm, 76mm, 80mm).
 * Configurable character width (default 42-46 chars/line for 76mm/80mm).
 */

class EscPosBuilder {
    constructor(options = {}) {
        this.buffer = [];
        this.lineWidth = options.lineWidth || 42; // Safe default for 76mm (203 DPI)
        this.encoding = options.encoding || 'cp437'; // 'cp437', 'cp850', 'cp1252', 'cp1256'
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
        const buf = Buffer.from(text, 'utf-8');
        for (const b of buf) this.buffer.push(b);
        return this;
    }

    // Initialize printer
    init() {
        return this._appendBytes([0x1B, 0x40]); // ESC @
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
        return this._appendBytes([0x1B, 0x32]); // ESC 2
    }

    setCompactLineSpacing() {
        return this._appendBytes([0x1B, 0x33, 24]); // ESC 3 24 (24 dots compact spacing)
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
        const left = String(leftText);
        const right = String(rightText);
        const spacesNeeded = this.lineWidth - left.length - right.length;
        if (spacesNeeded <= 0) {
            this.line(left);
            this.setAlign('right');
            this.line(right);
            this.setAlign('left');
        } else {
            this.line(left + fillChar.repeat(spacesNeeded) + right);
        }
        return this;
    }

    // Print three columns (e.g. Item | Qty | Total)
    threeColumns(col1, col2, col3, widths = [0.55, 0.20, 0.25]) {
        const w1 = Math.floor(this.lineWidth * widths[0]);
        const w2 = Math.floor(this.lineWidth * widths[1]);
        const w3 = this.lineWidth - w1 - w2;

        const c1 = String(col1).padEnd(w1);
        const c2 = String(col2).padStart(Math.floor(w2 / 2)).padEnd(w2);
        const c3 = String(col3).padStart(w3);

        return this.line(c1 + c2 + c3);
    }

    /**
     * Print a table item row with word-wrapped product name without breaking price columns
     * Example:
     *   Delicious Fresh Hot   2x 5.00   10.00
     *   Coffee Latte
     */
    productRow(name, qty, unitPrice, total) {
        const qtyColWidth = 6;  // e.g. " 2x "
        const totalColWidth = 10; // e.g. " 120.00"
        const nameColWidth = this.lineWidth - qtyColWidth - totalColWidth;

        const words = String(name).split(' ');
        const nameLines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + (currentLine ? ' ' : '') + word).length <= nameColWidth) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) nameLines.push(currentLine);
                // If a single word is longer than column width, force break it
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

        const qtyStr = String(qty).padStart(qtyColWidth);
        const totalStr = String(total).padStart(totalColWidth);

        // First line contains first line of name + Qty + Total
        this.line(nameLines[0].padEnd(nameColWidth) + qtyStr + totalStr);

        // Remaining lines of name
        for (let i = 1; i < nameLines.length; i++) {
            this.line(nameLines[i].padEnd(nameColWidth));
        }

        // If unit price is given, print subtle detail line
        if (unitPrice) {
            this.line(`  @ ${unitPrice}`);
        }

        return this;
    }

    // Barcode (Code 128)
    barcode128(data, height = 60, width = 2, showText = true) {
        const text = String(data).trim();
        if (!text) return this;

        this.setAlign('center');
        // Set barcode height (GS h n)
        this._appendBytes([0x1D, 0x68, Math.min(255, Math.max(20, height))]);
        // Set barcode width (GS w n) 2-6
        this._appendBytes([0x1D, 0x77, Math.min(6, Math.max(1, width))]);
        // Set HRI text position (GS H n) 0: none, 2: below
        this._appendBytes([0x1D, 0x48, showText ? 2 : 0]);
        // Set HRI font (GS f 0: Font A)
        this._appendBytes([0x1D, 0x66, 0]);

        // Code 128 (GS k 73 len data)
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

        // Function 165: Select QR Model 2 (GS ( k 4 0 49 65 50 0)
        this._appendBytes([0x1D, 0x28, 0x6B, 4, 0, 49, 65, 50, 0]);

        // Function 167: Set QR Module Size (GS ( k 3 0 49 67 size)
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 67, Math.max(1, Math.min(16, size))]);

        // Function 169: Set Error Correction Level M (GS ( k 3 0 49 69 49)
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 69, 49]);

        // Function 180: Store QR Data (GS ( k pL pH 49 80 48 data)
        this._appendBytes([0x1D, 0x28, 0x6B, pL, pH, 49, 80, 48]);
        this._appendBytes(textBytes);

        // Function 181: Print QR Code (GS ( k 3 0 49 81 48)
        this._appendBytes([0x1D, 0x28, 0x6B, 3, 0, 49, 81, 48]);
        this.feed(1);
        this.setAlign('left');
        return this;
    }

    // Cash Drawer Kick
    cashDrawer(pin = 0) {
        // ESC p m t1 t2 (m: 0 or 1, t1: 25, t2: 250)
        return this._appendBytes([0x1B, 0x70, pin ? 1 : 0, 25, 250]);
    }

    // Paper Cut
    cut(partial = true) {
        // Feed 3 lines then cut
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
    });

    builder.init();
    builder.setCompactLineSpacing();

    // 1. Kick Cash Drawer if requested
    if (config.openCashDrawer) {
        builder.cashDrawer();
    }

    // 2. Store Header
    builder.setAlign('center');
    builder.setBold(true);
    builder.setTextSize(2, 2);
    builder.line(receiptData.storeName || 'Wafi POS');
    builder.resetTextFormat();

    builder.setAlign('center');
    if (receiptData.storeAddress) builder.line(receiptData.storeAddress);
    if (receiptData.storePhone) builder.line(`Tel: ${receiptData.storePhone}`);
    if (receiptData.storeEmail) builder.line(receiptData.storeEmail);

    builder.dashedDivider();

    // 3. Order Info
    builder.setAlign('left');
    if (receiptData.orderCode) builder.twoColumns('Order:', receiptData.orderCode);
    if (receiptData.date) builder.twoColumns('Date:', receiptData.date);
    if (receiptData.cashier) builder.twoColumns('Cashier:', receiptData.cashier);
    if (receiptData.customer) builder.twoColumns('Customer:', receiptData.customer);
    if (receiptData.orderType) builder.twoColumns('Type:', String(receiptData.orderType).toUpperCase());

    builder.dashedDivider();

    // 4. Products Table
    // Header
    const qtyCol = 6;
    const totalCol = 10;
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

    // 5. Summary Section
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

    // 6. Payment Info
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

    // 7. Optional Barcode / QR
    if (receiptData.barcode) {
        builder.barcode128(receiptData.barcode, 50, 2, true);
    } else if (receiptData.qrCode) {
        builder.qrCode(receiptData.qrCode, 4);
    }

    // 8. Footer Message
    builder.setAlign('center');
    if (receiptData.footer) {
        builder.line(receiptData.footer);
    } else {
        builder.line('Thank you for your business!');
    }
    builder.line('Powered by Wafi POS');

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
 * Used by the /drawer/open endpoint to pulse the drawer without printing.
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

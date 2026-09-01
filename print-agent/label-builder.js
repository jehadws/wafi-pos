/**
 * Direct Thermal Label Command Generator
 * Supports 203 DPI Direct Thermal printers (50x30 mm, 60x40 mm, 76x50 mm).
 * Generates both ESC/POS Thermal Label and TSPL label formats with Arabic support.
 */

const { EscPosBuilder } = require('./escpos-builder');
const { processArabicLine, hasArabic, cleanCurrencyForCp437 } = require('./arabic-helper');

class LabelBuilder {
    /**
     * Builds a TSPL label command stream (Standard for dedicated Direct Thermal label printers)
     * e.g. Xprinter XP-365B, XP-420B, TSC, Zebra emulation.
     */
    static buildTsplLabel(labelData, config = {}) {
        const widthMm = config.widthMm || 50;
        const heightMm = config.heightMm || 30;
        const gapMm = config.gapMm || 2;
        const copies = config.copies || 1;

        let tspl = '';
        tspl += `SIZE ${widthMm} mm, ${heightMm} mm\r\n`;
        tspl += `GAP ${gapMm} mm, 0 mm\r\n`;
        tspl += `DIRECTION 1\r\n`;
        tspl += `CLS\r\n`;

        // Coordinate calculations (203 DPI = 8 dots/mm)
        const totalDotsW = widthMm * 8;
        let y = 16;

        // Store Name
        if (config.showStoreName !== false && labelData.storeName) {
            const cleanStore = hasArabic(labelData.storeName)
                ? processArabicLine(labelData.storeName)
                : labelData.storeName;
            tspl += `TEXT ${Math.floor(totalDotsW / 2)},${y},"1",0,1,1,[C]"${cleanStore.replace(/"/g, '')}"\r\n`;
            y += 24;
        }

        // Product Name
        if (labelData.name) {
            const cleanName = hasArabic(labelData.name)
                ? processArabicLine(labelData.name)
                : labelData.name;
            const shortName = String(cleanName).substring(0, 32).replace(/"/g, '');
            tspl += `TEXT ${Math.floor(totalDotsW / 2)},${y},"2",0,1,1,[C]"${shortName}"\r\n`;
            y += 30;
        }

        // Barcode (Code 128)
        if (labelData.barcode) {
            const barcodeHeight = config.barcodeHeight || 48;
            const barcodeReadable = config.showBarcodeText !== false ? 1 : 0;
            tspl += `BARCODE ${Math.floor(totalDotsW * 0.15)},${y},"128",${barcodeHeight},${barcodeReadable},0,2,4,"${labelData.barcode}"\r\n`;
            y += barcodeHeight + (barcodeReadable ? 28 : 10);
        }

        // Price & SKU
        if (labelData.price !== undefined && config.showPrice !== false) {
            const cleanPrice = cleanCurrencyForCp437(labelData.price, config.encoding || 'cp864');
            tspl += `TEXT ${Math.floor(totalDotsW / 2)},${y},"3",0,1,1,[C]"PRICE: ${cleanPrice}"\r\n`;
            y += 30;
        }

        if (labelData.sku && config.showSku) {
            tspl += `TEXT ${Math.floor(totalDotsW / 2)},${y},"1",0,1,1,[C]"SKU: ${labelData.sku}"\r\n`;
        }

        tspl += `PRINT ${copies}\r\n`;
        return Buffer.from(tspl, 'ascii');
    }

    /**
     * Builds an ESC/POS Direct Thermal Label
     * Optimized for standard 203 DPI receipt/label printers (like XP-80C / 76mm direct thermal).
     */
    static buildEscPosLabel(labelData, config = {}) {
        const builder = new EscPosBuilder({
            lineWidth: config.lineWidth || 36, // Centered safe label width
            encoding: config.encoding || config.codePage || 'cp864',
        });

        builder.init();
        if (config.lineSpacing !== undefined && config.lineSpacing !== null) {
            builder.setCompactLineSpacing(Number(config.lineSpacing));
        } else {
            builder.setDefaultLineSpacing();
        }

        // Top margin
        builder.feed(1);

        // 1. Store Name
        if (config.showStoreName !== false && labelData.storeName) {
            builder.setAlign('center');
            builder.setBold(true);
            builder.line(labelData.storeName);
            builder.resetTextFormat();
        }

        // 2. Product Name
        builder.setAlign('center');
        builder.setBold(true);
        builder.line(labelData.name || 'Product');
        builder.resetTextFormat();

        // 3. Unit / SKU if provided
        if (labelData.unit || (labelData.sku && config.showSku)) {
            const details = [
                labelData.unit ? `Unit: ${labelData.unit}` : '',
                labelData.sku && config.showSku ? `SKU: ${labelData.sku}` : ''
            ].filter(Boolean).join(' | ');
            builder.setAlign('center');
            builder.line(details);
        }

        // 4. Barcode (Code 128)
        if (labelData.barcode) {
            const barcodeHeight = config.barcodeHeight || 45;
            builder.barcode128(labelData.barcode, barcodeHeight, 2, config.showBarcodeText !== false);
        }

        // 5. Price (Big & Bold)
        if (labelData.price !== undefined && config.showPrice !== false) {
            builder.setAlign('center');
            builder.setBold(true);
            builder.setTextSize(2, 2);
            builder.line(String(labelData.price));
            builder.resetTextFormat();
        }

        // Feed & Cut
        if (config.cut !== false) {
            builder.feed(1);
            builder.cut(true);
        } else {
            builder.feed(2);
        }

        return builder.toBuffer();
    }

    /**
     * Master label builder dispatching between ESC/POS and TSPL
     */
    static buildLabel(labelData, config = {}) {
        if (config.protocol === 'tspl') {
            return this.buildTsplLabel(labelData, config);
        }
        return this.buildEscPosLabel(labelData, config);
    }
}

module.exports = LabelBuilder;

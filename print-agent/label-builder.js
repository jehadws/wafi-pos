/**
 * Direct Thermal Label Command Generator
 * Supports 203 DPI Direct Thermal printers (50x30 mm, 60x40 mm, 76x50 mm).
 * Generates both ESC/POS Thermal Label and TSPL label formats with Arabic support.
 */

const { EscPosBuilder } = require('./escpos-builder');
const { processArabicLine, hasArabic, cleanCurrencyForCp437 } = require('./arabic-helper');
const { renderTextBitmap } = require('./tspl-text-bitmap');

// 203 DPI thermal heads = 8 dots per mm. The preview in
// resources/js/pages/dashboard/products/print-labels mirrors these constants.
const DOTS_PER_MM = 8;
const TSPL_FONT_WIDTH_DOTS = { 1: 8, 2: 12, 3: 16 };
const TSPL_FONT_HEIGHT_DOTS = { 1: 16, 2: 24, 3: 32 };
const TSPL_ROW_GAP_DOTS = 8;
const TSPL_GAP_MAX_DOTS = 24;
const TSPL_MARGIN_DOTS = 8;

/**
 * Code128 bar pattern count in narrow-bar modules, used to pick a bar width that
 * fills the sticker instead of leaving a 25 mm barcode on a 60 mm label.
 */
function code128Modules(code) {
    const symbolCount = /^\d+$/.test(code) ? Math.ceil(code.length / 2) + 2 : code.length + 2;
    return symbolCount * 11 + 13;
}

/** Largest x-multiplication where the text still fits one line, capped per element role. */
function fitScale(font, text, printableWidth, cap) {
    const byWidth = Math.floor(printableWidth / (Math.max(1, text.length) * TSPL_FONT_WIDTH_DOTS[font]));
    return Math.min(cap, Math.max(1, byWidth));
}

/** Greedy word wrap into at most two lines; words longer than a line are hard-split. */
function wrapLabelLines(text, maxCharsPerLine) {
    if (!text || maxCharsPerLine <= 0) return [];
    if (text.length <= maxCharsPerLine) return [text];
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
        if (!word) continue;
        if (line && line.length + 1 + word.length <= maxCharsPerLine) {
            line = `${line} ${word}`;
            continue;
        }
        if (line) {
            lines.push(line);
            if (lines.length === 2) return lines;
        }
        line = word;
        while (line.length > maxCharsPerLine) {
            lines.push(line.slice(0, maxCharsPerLine));
            line = line.slice(maxCharsPerLine);
            if (lines.length === 2) return lines;
        }
    }
    if (line && lines.length < 2) lines.push(line);
    return lines.slice(0, 2);
}

class LabelBuilder {
    /**
     * Positions every enabled row of a TSPL label for the given sticker size.
     * Each element scales independently (store name <=x2, product name <=x3 with a
     * two-line wrap, price <=x2), then rows are spread evenly to fill the sticker.
     * Mirrored by resources/js/pages/dashboard/products/print-labels/label-layout.ts.
     */
    static layoutTsplLabel(labelData, config = {}) {
        const widthMm = Number(config.widthMm) || 50;
        const heightMm = Number(config.heightMm) || 30;
        const widthDots = Math.max(1, Math.round(widthMm * DOTS_PER_MM));
        const heightDots = Math.max(1, Math.round(heightMm * DOTS_PER_MM));
        const printableWidth = widthDots - TSPL_MARGIN_DOTS * 2;
        const availableHeight = heightDots - TSPL_MARGIN_DOTS * 2;

        const clean = (value) => String(value ?? '').replace(/"/g, '');
        const toAscii = (value) => (hasArabic(value) ? processArabicLine(value) : value);

        const drafts = [];
        if (config.showStoreName !== false && labelData.storeName) {
            const text = clean(toAscii(labelData.storeName));
            if (text) drafts.push({ kind: 'storeName', font: '1', text, scale: fitScale('1', text, printableWidth, 2) });
        }
        let nameDraft = null;
        if (labelData.name) {
            const text = clean(toAscii(labelData.name));
            if (text) {
                let scale = 1;
                for (const candidate of [3, 2, 1]) {
                    if (text.length <= Math.floor(printableWidth / (TSPL_FONT_WIDTH_DOTS['2'] * candidate)) * 2) {
                        scale = candidate;
                        break;
                    }
                }
                nameDraft = { kind: 'name', font: '2', text, scale };
                drafts.push(nameDraft);
            }
        }
        let barcode = null;
        if (labelData.barcode) {
            const readable = config.showBarcodeText !== false;
            barcode = {
                kind: 'barcode',
                code: clean(labelData.barcode),
                height: Math.max(8, Math.round(Number(config.barcodeHeight) || 48)),
                readableHeight: readable ? TSPL_FONT_HEIGHT_DOTS['2'] : 0,
            };
            drafts.push(barcode);
        }
        if (labelData.price !== undefined && labelData.price !== '' && config.showPrice !== false) {
            const text = clean(toAscii(cleanCurrencyForCp437(labelData.price, config.encoding || 'cp864')));
            if (text) drafts.push({ kind: 'price', font: '3', text, scale: fitScale('3', text, printableWidth, 2) });
        }
        if (labelData.sku && config.showSku) {
            drafts.push({ kind: 'sku', font: '1', text: `SKU: ${clean(labelData.sku)}`, scale: 1 });
        }

        const nameLinesAt = (scale) => wrapLabelLines(nameDraft.text, Math.floor(printableWidth / (TSPL_FONT_WIDTH_DOTS['2'] * scale)));
        const rowCount = () => (nameDraft ? drafts.length - 1 + nameLinesAt(nameDraft.scale).length : drafts.length);
        const blockHeight = () =>
            drafts.reduce((total, draft) => {
                if (draft.kind === 'barcode') return total + draft.height + draft.readableHeight;
                if (draft.kind === 'name') return total + nameLinesAt(draft.scale).length * TSPL_FONT_HEIGHT_DOTS['2'] * draft.scale;
                return total + TSPL_FONT_HEIGHT_DOTS[draft.font] * draft.scale;
            }, TSPL_ROW_GAP_DOTS * Math.max(0, rowCount() - 1));

        const degrade = () => {
            const store = drafts.find((draft) => draft.kind === 'storeName');
            if (store && store.scale > 1) {
                store.scale = 1;
                return true;
            }
            if (nameDraft && nameDraft.scale > 1) {
                nameDraft.scale -= 1;
                return true;
            }
            const price = drafts.find((draft) => draft.kind === 'price');
            if (price && price.scale > 1) {
                price.scale = 1;
                return true;
            }
            return false;
        };

        while (blockHeight() > availableHeight && degrade()) {
            // Step down the largest decorative scaling first.
        }
        if (barcode && blockHeight() > availableHeight) {
            // Last resort on a short sticker: shrink the bars rather than drop content.
            barcode.height = Math.max(32, barcode.height - (blockHeight() - availableHeight));
            if (blockHeight() > availableHeight) {
                barcode.height = Math.max(16, barcode.height - (blockHeight() - availableHeight));
            }
        }
        const overflow = blockHeight() > availableHeight;

        const rows = [];
        for (const draft of drafts) {
            if (draft.kind === 'barcode') {
                const narrow = Math.min(6, Math.max(1, Math.floor((printableWidth * 0.9) / code128Modules(draft.code))));
                rows.push({
                    type: 'barcode',
                    code: draft.code,
                    width: code128Modules(draft.code) * narrow,
                    height: draft.height,
                    readableHeight: draft.readableHeight,
                    narrow,
                });
            } else if (draft.kind === 'name') {
                for (const lineText of nameLinesAt(draft.scale)) {
                    rows.push({ type: 'text', font: draft.font, scale: draft.scale, text: lineText });
                }
            } else {
                const maxChars = Math.floor(printableWidth / (TSPL_FONT_WIDTH_DOTS[draft.font] * draft.scale));
                rows.push({ type: 'text', font: draft.font, scale: draft.scale, text: draft.text.substring(0, maxChars) });
            }
        }

        const rowAdvance = (row) => (row.type === 'barcode' ? row.height + row.readableHeight : row.height);
        for (const row of rows) {
            if (row.type !== 'barcode') {
                row.width = row.text.length * TSPL_FONT_WIDTH_DOTS[row.font] * row.scale;
                row.height = TSPL_FONT_HEIGHT_DOTS[row.font] * row.scale;
            }
        }
        const sumHeight = rows.reduce((total, row) => total + rowAdvance(row), 0);
        let gap = TSPL_ROW_GAP_DOTS;
        if (rows.length > 1) {
            const slack = availableHeight - sumHeight - TSPL_ROW_GAP_DOTS * (rows.length - 1);
            if (slack > 0) gap = Math.min(TSPL_ROW_GAP_DOTS + Math.floor(slack / (rows.length - 1)), TSPL_GAP_MAX_DOTS);
        }
        let y = TSPL_MARGIN_DOTS + Math.max(0, Math.floor((availableHeight - (sumHeight + gap * Math.max(0, rows.length - 1))) / 2));
        for (const row of rows) {
            row.x = Math.max(0, Math.floor((widthDots - row.width) / 2));
            row.y = y;
            y += rowAdvance(row) + gap;
        }

        return {
            widthDots,
            heightDots,
            scale: nameDraft ? nameDraft.scale : 1,
            rows,
            overflow,
            fontWidthDots: TSPL_FONT_WIDTH_DOTS,
            fontHeightDots: TSPL_FONT_HEIGHT_DOTS,
        };
    }

    /**
     * Builds a TSPL label command stream. Arabic rows are rasterized because TSPL
     * built-in fonts do not provide Arabic shaping or reliable Arabic code pages.
     */
    static buildTsplLabel(labelData, config = {}) {
        const widthMm = Number(config.widthMm) || 50;
        const heightMm = Number(config.heightMm) || 30;
        const gapMm = config.gapMm || 2;
        const copies = config.copies || 1;

        const layout = this.layoutTsplLabel(labelData, config);
        const { widthDots, rows } = layout;
        const printableWidth = widthDots - TSPL_MARGIN_DOTS * 2;
        const chunks = [
            Buffer.from(
                `SIZE ${widthMm} mm, ${heightMm} mm\r\nGAP ${gapMm} mm, 0 mm\r\nDIRECTION 1\r\nCLS\r\n`,
                'ascii',
            ),
        ];

        for (const row of rows) {
            if (row.type === 'barcode') {
                const readable = row.readableHeight ? 1 : 0;
                chunks.push(
                    Buffer.from(
                        `BARCODE ${row.x},${row.y},"128",${row.height},${readable},0,${row.narrow},${row.narrow * 2},"${row.code}"\r\n`,
                        'ascii',
                    ),
                );
            } else if (hasArabic(row.text)) {
                const bitmap = renderTextBitmap(row.text, printableWidth, row.height);
                const x = Math.max(TSPL_MARGIN_DOTS, Math.floor((widthDots - bitmap.widthBytes * 8) / 2));
                const y = row.y + Math.max(0, Math.floor((row.height - bitmap.height) / 2));
                chunks.push(
                    Buffer.from(`BITMAP ${x},${y},${bitmap.widthBytes},${bitmap.height},0,`, 'ascii'),
                    bitmap.data,
                    Buffer.from('\r\n', 'ascii'),
                );
            } else {
                chunks.push(
                    Buffer.from(`TEXT ${row.x},${row.y},"${row.font}",0,${row.scale},${row.scale},"${row.text}"\r\n`, 'ascii'),
                );
            }
        }

        chunks.push(Buffer.from(`PRINT ${copies}\r\n`, 'ascii'));
        return Buffer.concat(chunks);
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
        if (labelData.name) {
            builder.setAlign('center');
            builder.setBold(true);
            builder.line(labelData.name);
            builder.resetTextFormat();
        }

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

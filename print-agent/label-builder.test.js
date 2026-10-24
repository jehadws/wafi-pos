const assert = require('node:assert/strict');
const test = require('node:test');
const LabelBuilder = require('./label-builder');
const { processArabicLine } = require('./arabic-helper');
const { renderTextBitmap } = require('./tspl-text-bitmap');

function countBlackPixels(data) {
    let count = 0;
    for (const byte of data) {
        for (let bits = byte; bits; bits >>= 1) count += bits & 1;
    }
    return count;
}

test('rasterizes shaped Arabic text into a non-empty monochrome bitmap', () => {
    const bitmap = renderTextBitmap(processArabicLine('قهوة عربية'), 384, 48);

    assert.ok(bitmap.widthBytes > 0);
    assert.ok(bitmap.height > 0);
    assert.equal(bitmap.data.length, bitmap.widthBytes * bitmap.height);
    assert.ok(countBlackPixels(bitmap.data) > 100);
});

test('embeds Arabic rows as correctly framed TSPL bitmap data', () => {
    const output = LabelBuilder.buildTsplLabel(
        { storeName: 'Subul', name: 'قهوة عربية', barcode: '123456789012', price: '10.00 SAR' },
        { widthMm: 50, heightMm: 30, barcodeHeight: 48 },
    );
    const bitmapOffset = output.indexOf('BITMAP');
    assert.ok(bitmapOffset > 0);

    const header = output.subarray(bitmapOffset, bitmapOffset + 80).toString('ascii');
    const match = header.match(/^BITMAP (\d+),(\d+),(\d+),(\d+),0,/);
    assert.ok(match);

    const widthBytes = Number(match[3]);
    const height = Number(match[4]);
    const dataStart = bitmapOffset + Buffer.byteLength(match[0], 'ascii');
    const dataEnd = dataStart + widthBytes * height;
    assert.ok(countBlackPixels(output.subarray(dataStart, dataEnd)) > 100);
    assert.deepEqual([...output.subarray(dataEnd, dataEnd + 2)], [0x0d, 0x0a]);
    assert.ok(output.indexOf('BARCODE', dataEnd) > dataEnd);
    assert.ok(output.indexOf('PRINT', dataEnd) > dataEnd);
});

test('keeps Latin rows as native TSPL text', () => {
    const output = LabelBuilder.buildTsplLabel(
        { storeName: 'Subul', name: 'Arabic Coffee', barcode: '123456789012', price: '10.00 SAR' },
        { widthMm: 50, heightMm: 30, barcodeHeight: 48 },
    );

    assert.equal(output.indexOf('BITMAP'), -1);
    assert.ok(output.indexOf('TEXT') > 0);
});

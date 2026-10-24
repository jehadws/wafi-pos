<?php

use App\Services\Printing\ArabicTextFormatter;
use App\Services\Printing\LabelBuilder;
use App\Services\Printing\ReceiptBuilder;

beforeEach(function () {
    $this->formatter = new ArabicTextFormatter;
});

it('shapes and rasterizes Arabic text', function () {
    $visual = $this->formatter->visual('قهوة عربية');
    $bitmap = $this->formatter->rasterize('قهوة عربية', 384, 24);

    expect($visual)->not->toBe('قهوة عربية')
        ->and($bitmap['widthBytes'])->toBeGreaterThan(0)
        ->and($bitmap['height'])->toBeGreaterThan(0)
        ->and(strlen($bitmap['data']))->toBe($bitmap['widthBytes'] * $bitmap['height']);
});

it('builds receipt commands with rasterized Arabic and native barcode commands', function () {
    $receipt = (new ReceiptBuilder($this->formatter))->build([
        'storeName' => 'سبل | Subul',
        'orderCode' => 'ORD-42',
        'items' => [
            ['name' => 'قهوة عربية', 'quantity' => 2, 'price' => '18.00 SAR', 'total' => '36.00 SAR'],
        ],
        'subtotal' => '36.00 SAR',
        'total' => '36.00 SAR',
        'barcode' => '123456789012',
    ], ['encoding' => 'cp864', 'openCashDrawer' => true]);

    expect($receipt)->toStartWith("\x1B\x40\x1B\x74\x28")
        ->and($receipt)->toContain("\x1D\x76\x30")
        ->and($receipt)->toContain("\x1D\x6B\x49\x0C".'123456789012')
        ->and($receipt)->toContain("\x1B\x70\x00\x19\xFA")
        ->and($receipt)->toEndWith("\x1D\x56\x42\x03");
});

it('builds TSPL labels with Arabic bitmaps', function () {
    $label = (new LabelBuilder($this->formatter))->build([
        'storeName' => 'Subul',
        'name' => 'قهوة عربية',
        'barcode' => '123456789012',
        'price' => '18.00 SAR',
    ], [
        'protocol' => 'tspl',
        'widthMm' => 50,
        'heightMm' => 30,
        'copies' => 2,
    ]);

    expect($label)->toStartWith('SIZE 50 mm, 30 mm')
        ->and($label)->toContain('BITMAP ')
        ->and($label)->toContain('BARCODE ')
        ->and($label)->toEndWith("PRINT 2\r\n");
});

it('keeps the cash drawer byte contract', function () {
    $drawer = (new ReceiptBuilder($this->formatter))->drawer();

    expect(bin2hex($drawer))->toBe('1b401b74281b700019fa');
});

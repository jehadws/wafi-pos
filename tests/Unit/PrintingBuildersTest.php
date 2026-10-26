<?php

use App\Services\Printing\ArabicTextFormatter;
use App\Services\Printing\EscPosBuilder;
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

it('builds receipt commands with native code-page Arabic and native barcode commands', function () {
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
        ->and($receipt)->not->toContain("\x1D\x76\x30")
        ->and($receipt)->toContain("\x1D\x6B\x49\x0C".'123456789012')
        ->and($receipt)->toContain("\x1B\x70\x00\x19\xFA")
        ->and($receipt)->toEndWith("\x1D\x56\x42\x03");
});

it('draws Arabic from the printer font while the amount columns keep their place', function () {
    $builder = new EscPosBuilder($this->formatter, 42, 'cp864');
    $out = $builder->init()->productRow('قهوة عربية', '2', '18.00', '36.00 SAR')->toString();

    $row = substr(explode("\n", $out)[0], 5); // after ESC @ + ESC t 40

    expect(strlen($row))->toBe(42)
        ->and(substr($row, 22, 6))->toBe('     2')
        ->and(substr($row, 28))->toBe('     36.00 SAR');
});

it('prints Arabic right-hand values and amounts from the code page instead of question marks', function () {
    $builder = new EscPosBuilder($this->formatter, 42, 'cp864');
    $out = $builder->init()
        ->twoColumns('Customer:', 'محمد علي')
        ->productRow('Coffee', '2', '18.00 ر.س', '36.00 ر.س')
        ->toString();

    expect(substr($out, 5))->not->toContain('?')
        ->and(strlen(explode("\n", substr($out, 5))[0]))->toBe(42);
});

it('falls back to an image when the selected code page has no Arabic', function () {
    $builder = new EscPosBuilder($this->formatter, 42, 'utf8', 560);
    $out = $builder->init()->line('قهوة عربية')->toString();

    expect($out)->toContain("\x1D\x76\x30");
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

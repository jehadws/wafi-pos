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
        ->and($receipt)->toContain("\x1D\x6B\x49\x0E".'{B123456789012')
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

it('reads Arabic words after a Latin label in the order an Arabic reader expects', function () {
    $coffee = $this->formatter->visual('قهوة');
    $cup = $this->formatter->visual('كوب');

    expect($this->formatter->visual('Item: كوب قهوة'))->toBe('Item: '.$coffee.' '.$cup)
        ->and($this->formatter->visual('قهوة 25% كوب'))->toContain('25%');
});

it('mirrors brackets and keeps a percentage on the right side of its number', function () {
    expect($this->formatter->visual('ضريبة (15%)'))->toBe('(15%) '.$this->formatter->visual('ضريبة'));
});

it('joins lam and alef into the single ligature the code page draws', function () {
    expect($this->formatter->encode('لا', 'cp864'))->toBe(chr(0x9B))
        ->and($this->formatter->encode('لا حول', 'cp864'))->not->toContain('?');
});

it('draws Arabic-Indic digits and vowel marks from what the code page has', function () {
    $bytes = $this->formatter->encode('المجموع ١٢٫٥٠ ريال', 'cp864');

    expect($bytes)->not->toContain('?')
        ->and($bytes)->toContain('12.50')
        ->and($this->formatter->encode('بِسْمِ', 'cp864'))->not->toContain('?');
});

it('keeps the discount and tax lines when the amount carries a currency symbol', function () {
    $build = fn (array $receipt) => (new ReceiptBuilder($this->formatter))->build($receipt, ['encoding' => 'cp864']);

    $receipt = $build([
        'items' => [],
        'subtotal' => 'SAR 41.00',
        'discount' => 'SAR 5.00',
        'tax' => '$1.50',
        'total' => 'SAR 36.00',
    ]);

    $withoutDiscount = $build(['items' => [], 'discount' => 'SAR 0.00', 'total' => 'SAR 36.00']);

    expect($receipt)->toContain('Discount')->and($receipt)->toContain('Tax')
        ->and($withoutDiscount)->not->toContain('Discount');
});

it('puts the item header over the columns it names', function () {
    $lines = explode("\n", (new ReceiptBuilder($this->formatter))->build([
        'items' => [['name' => 'Coffee', 'quantity' => 2, 'price' => '18.00', 'total' => '36.00 SAR']],
        'total' => '36.00 SAR',
    ], ['encoding' => 'cp864', 'lineWidth' => 42]));

    // A line carries the format commands that were set before it, so read from its text.
    $printed = fn (string $lines, string $marker): string => substr($lines, (int) strpos($lines, $marker));
    $header = $printed((string) collect($lines)->first(fn ($line) => str_contains($line, 'ITEM')), 'ITEM');
    $row = $printed((string) collect($lines)->first(fn ($line) => str_contains($line, 'Coffee')), 'Coffee');

    expect(strlen($header))->toBe(42)
        ->and(substr($header, 22, 6))->toBe('   QTY')
        ->and(substr($header, 28))->toBe('         TOTAL')
        ->and(substr($row, 22, 6))->toBe('    2x')
        ->and(substr($row, 28))->toBe('     36.00 SAR');
});

it('shrinks the amount columns on a narrow receipt instead of dropping the name', function () {
    $lines = explode("\n", (new ReceiptBuilder($this->formatter))->build([
        'items' => [['name' => 'Coffee', 'quantity' => 2, 'total' => '36.00']],
        'total' => '36.00',
    ], ['encoding' => 'cp864', 'lineWidth' => 20]));

    $headerLine = (string) collect($lines)->first(fn ($line) => str_contains($line, 'ITEM'));
    $row = (string) collect($lines)->first(fn ($line) => str_contains($line, 'Coffee'));
    $header = substr($headerLine, (int) strpos($headerLine, 'ITEM'));

    expect($row)->not->toBe('')
        ->and($header)->toBe('ITEM       QTY TOTAL')
        ->and($row)->toBe('Coffee      2x 36.00');
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

it('burns label dots the way TSPL reads them', function () {
    $label = (new LabelBuilder($this->formatter))->build([
        'storeName' => 'Subul',
        'name' => 'قهوة عربية',
        'price' => '18.00 SAR',
    ], ['protocol' => 'tspl', 'widthMm' => 50, 'heightMm' => 30, 'copies' => 1]);

    $at = strpos($label, 'BITMAP ');
    preg_match('/^BITMAP \d+,\d+,(\d+),(\d+),0,/', substr((string) $label, (int) $at), $header);
    $firstRow = substr($label, (int) $at + strlen($header[0]), (int) $header[1]);

    // The raster begins with blank paper above the text, and TSPL reads blank as ones.
    expect($at)->not->toBeFalse()
        ->and($firstRow)->toBe(str_repeat("\xFF", (int) $header[1]));
});

it('names the code set before a Code 128 barcode, doubles a literal brace, and skips a code with nothing printable', function () {
    $bytes = (new EscPosBuilder($this->formatter))->barcode128('SRV{099')->toString();

    expect($bytes)->toContain("\x1D\x6B\x49".chr(10).'{BSRV{{099')
        ->and((new EscPosBuilder($this->formatter))->barcode128('فوترة')->toString())->not->toContain("\x1D\x6B");
});

it('keeps the cash drawer byte contract', function () {
    $drawer = (new ReceiptBuilder($this->formatter))->drawer();

    expect(bin2hex($drawer))->toBe('1b401b74281b700019fa');
});

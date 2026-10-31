<?php

use App\Services\Options;
use App\Services\Printing\ArabicTextFormatter;
use App\Services\Printing\EscPosBuilder;
use App\Services\Printing\LabelBuilder;
use App\Services\Printing\ReceiptBuilder;
use App\Services\Printing\ReceiptCurrency;
use Illuminate\Container\Container;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;

/**
 * Paper money is formatted from the store's own `sb_currency_*` options. A unit
 * test has no database to read them from, so they are handed over directly.
 */
class PrintedCurrencyOptions extends Options
{
    public function __construct( private readonly array $values = [] )
    {
    }

    public function get( string|array|null $key = null, mixed $default = null )
    {
        if ( $key === null ) {
            return $this->values;
        }

        return $this->values[ $key ] ?? $default;
    }
}

/**
 * The bytes init() writes before any text: ESC @ reset, FS . cancelling Chinese mode,
 * then ESC t 40 selecting PC864. Tests read printed lines from after this.
 */
const ESCPOS_INIT = "\x1B\x40\x1C\x2E\x1B\x74\x28";

beforeEach(function () {
    $this->formatter = new ArabicTextFormatter;

    // Receipt labels come from the translator, and a unit test runs without an
    // application. An empty loader answers every key with itself, which is what
    // an English receipt prints; the Arabic wording is covered by the API tests.
    $translator = new Translator(new ArrayLoader, 'en');
    Container::getInstance()->instance('translator', $translator);
});

/** A receipt builder reading its money settings from the given `sb_currency_*` values. */
function receiptBuilder(array $currencyOptions = []): ReceiptBuilder
{
    return new ReceiptBuilder(new ArabicTextFormatter, new ReceiptCurrency(new PrintedCurrencyOptions($currencyOptions), new ArabicTextFormatter));
}

it('shapes and rasterizes Arabic text', function () {
    $visual = $this->formatter->visual('قهوة عربية');
    $bitmap = $this->formatter->rasterize('قهوة عربية', 384, 24);

    expect($visual)->not->toBe('قهوة عربية')
        ->and($bitmap['widthBytes'])->toBeGreaterThan(0)
        ->and($bitmap['height'])->toBeGreaterThan(0)
        ->and(strlen($bitmap['data']))->toBe($bitmap['widthBytes'] * $bitmap['height']);
});

it('builds receipt commands with native code-page Arabic and native barcode commands', function () {
    $receipt = receiptBuilder()->build([
        'storeName' => 'سبل | Subul',
        'orderCode' => 'ORD-42',
        'items' => [
            ['name' => 'قهوة عربية', 'quantity' => 2, 'price' => '18.00 SAR', 'total' => '36.00 SAR'],
        ],
        'subtotal' => '36.00 SAR',
        'total' => '36.00 SAR',
        'barcode' => '123456789012',
    ], ['encoding' => 'cp864', 'openCashDrawer' => true]);

    expect($receipt)->toStartWith(ESCPOS_INIT)
        ->and($receipt)->not->toContain("\x1D\x76\x30")
        ->and($receipt)->toContain("\x1D\x6B\x49\x0E".'{B123456789012')
        ->and($receipt)->toContain("\x1B\x70\x00\x19\xFA")
        ->and($receipt)->toEndWith("\x1D\x56\x42\x03");
});

it('cancels Chinese mode and then names the Arabic code page the job asked for', function () {
    // FS . has to come first: while kanji mode is on the clone ignores ESC t entirely.
    $initFor = fn (string $encoding): string => substr(
        (new EscPosBuilder($this->formatter, 42, $encoding))->init()->toString(),
        0,
        7,
    );

    expect($initFor('cp864'))->toBe("\x1B\x40\x1C\x2E\x1B\x74\x28")
        ->and($initFor('cp1256'))->toBe("\x1B\x40\x1C\x2E\x1B\x74\x24")
        ->and($initFor('cp437'))->toBe("\x1B\x40\x1C\x2E\x1B\x74\x00")
        ->and($initFor('utf8'))->toStartWith("\x1B\x40\x1C\x2E")
        ->and(substr($initFor('utf8'), 4, 2))->not->toBe("\x1B\x74");
});

it('draws Arabic from the printer font while the amount columns keep their place', function () {
    $builder = new EscPosBuilder($this->formatter, 42, 'cp864');
    $out = $builder->init()->productRow('قهوة عربية', '2', '18.00', '36.00 SAR')->toString();

    $row = substr(explode("\n", $out)[0], strlen(ESCPOS_INIT)); // after init()

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

    expect(substr($out, strlen(ESCPOS_INIT)))->not->toContain('?')
        ->and(strlen(explode("\n", substr($out, strlen(ESCPOS_INIT)))[0]))->toBe(42);
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
    $build = fn (array $receipt) => receiptBuilder()->build($receipt, ['encoding' => 'cp864']);

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
    $lines = explode("\n", receiptBuilder()->build([
        'items' => [['name' => 'Coffee', 'quantity' => 2, 'price' => 18, 'total' => 36]],
        'total' => 36,
    ], ['encoding' => 'cp864', 'lineWidth' => 42]));

    // A line carries the format commands that were set before it, so read from its text.
    $printed = fn (string $lines, string $marker): string => substr($lines, (int) strpos($lines, $marker));
    $header = $printed((string) collect($lines)->first(fn ($line) => str_contains($line, 'Item')), 'Item');
    $row = $printed((string) collect($lines)->first(fn ($line) => str_contains($line, 'Coffee')), 'Coffee');

    expect(strlen($header))->toBe(42)
        ->and(substr($header, 22, 6))->toBe('   Qty')
        ->and(substr($header, 28))->toBe('         Total')
        ->and(substr($row, 22, 6))->toBe('    2x')
        ->and(substr($row, 28))->toBe('        $36.00')
        ->and(in_array('  @ $18.00', $lines, true))->toBeTrue();
});

it('shrinks the amount columns on a narrow receipt instead of dropping the name', function () {
    $lines = explode("\n", receiptBuilder()->build([
        'items' => [['name' => 'Coffee', 'quantity' => 2, 'total' => 36]],
        'total' => 36,
    ], ['encoding' => 'cp864', 'lineWidth' => 20]));

    $headerLine = (string) collect($lines)->first(fn ($line) => str_contains($line, 'Item'));
    $row = (string) collect($lines)->first(fn ($line) => str_contains($line, 'Coffee'));
    $header = substr($headerLine, (int) strpos($headerLine, 'Item'));

    expect($row)->not->toBe('')
        ->and($header)->toBe('Item       Qty Total')
        ->and($row)->toBe('Coffee      2x$36.00');
});

it('keeps an amount that outgrows its column inside the paper instead of wrapping it', function () {
    $rowFor = fn (array $config): string => (string) collect(explode("\n", receiptBuilder()->build([
        'items' => [['name' => 'Coffee Bean Blend', 'quantity' => 2, 'total' => 1234567890.12]],
        'total' => 1234567890.12,
    ], $config)))->first(fn ($line) => str_contains($line, 'Coffee'));

    $latin = $rowFor(['encoding' => 'cp864', 'lineWidth' => 32]);
    $arabic = $rowFor(['encoding' => 'cp864', 'lineWidth' => 32, 'direction' => 'rtl']);

    // 32 columns is the paper, 17 cells is the amount: the name column absorbs the
    // difference and wraps onto its own lines rather than the number breaking.
    expect($latin)->toBe('Coffee       2x$1,234,567,890.12')
        ->and($arabic)->toBe('$1,234,567,890.12'.'2x    '.'   Coffee');
});

it('formats every amount with the store currency settings', function () {
    $separated = receiptBuilder([
        'sb_currency_symbol' => 'SAR',
        'sb_currency_position' => 'after',
        'sb_currency_decimal_separator' => ',',
        'sb_currency_thousand_separator' => '.',
    ])->build(['items' => [], 'total' => 1234.5], ['encoding' => 'cp864']);

    // A precision of 0 is a deliberate setting, not a missing one.
    $withoutDecimals = receiptBuilder([
        'sb_currency_symbol' => 'SAR',
        'sb_currency_position' => 'after',
        'sb_currency_precision' => 0,
    ])->build(['items' => [], 'total' => 1234], ['encoding' => 'cp864']);

    expect($separated)->toContain('1.234,50SAR')
        ->and($withoutDecimals)->toContain('1,234SAR')
        ->and($separated)->not->toContain('$');
});

it('prints an Arabic currency symbol as its ISO code when the receipt is read left to right', function () {
    $currency = ['sb_currency_symbol' => 'ر.س', 'sb_currency_iso' => 'SAR'];

    $latin = receiptBuilder($currency)->build(['items' => [], 'total' => 36], ['encoding' => 'cp864']);
    $arabic = receiptBuilder($currency)->build(['items' => [], 'total' => 36], ['encoding' => 'cp864', 'direction' => 'rtl']);

    expect($latin)->toContain('SAR36.00')
        ->and($arabic)->not->toContain('SAR')
        ->and($arabic)->not->toContain('?');
});

it('mirrors the amount columns so a right-to-left receipt keeps its amounts at the left', function () {
    $lines = explode("\n", receiptBuilder()->build([
        'items' => [['name' => 'قهوة', 'quantity' => 2, 'price' => 18, 'total' => 36]],
        'subtotal' => 36,
        'total' => 36,
    ], ['encoding' => 'cp864', 'lineWidth' => 42, 'direction' => 'rtl']));

    $subtotal = (string) collect($lines)->first(fn ($line) => str_contains($line, 'Subtotal'));

    // Match the whole line: a loose '@' search would hit the ESC @ reset instead.
    $note = str_repeat(' ', 32).'$18.00 @';

    expect(strlen($subtotal))->toBe(42)
        ->and(substr($subtotal, 0, 6))->toBe('$36.00')
        ->and(substr($subtotal, -8))->toBe('Subtotal')
        // Mirrors the Latin receipt's indent: under the name column, not under the
        // amounts.
        ->and(in_array($note, $lines, true))->toBeTrue();
});

it('builds TSPL labels as one full-label bitmap', function () {
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
        ->and($label)->toContain('BITMAP 0,0,')
        ->and(substr_count($label, 'BITMAP '))->toBe(1)
        ->and($label)->not->toContain('BARCODE ')
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

it('prints the ESC/POS label as the same raster image instead of native text and barcode commands', function () {
    $bytes = (new LabelBuilder($this->formatter))->build([
        'storeName' => 'Subul',
        'name' => 'قهوة عربية',
        'barcode' => '123456789012',
        'price' => '18.00 SAR',
    ], ['protocol' => 'escpos', 'widthMm' => 50, 'heightMm' => 30, 'rasterWidth' => 576]);

    expect($bytes)->toStartWith(ESCPOS_INIT."\x1B\x61\x01\x1D\x76\x30\x00")
        ->and($bytes)->not->toContain("\x1D\x6B")
        ->and($bytes)->toEndWith("\x1D\x56\x42\x03");
});

it('scales a wide sticker down to a narrower print head', function () {
    $raster = new \App\Services\Printing\LabelRaster($this->formatter, (new LabelBuilder($this->formatter))->layout(...));
    $wide = $raster->render(['name' => 'Coffee', 'barcode' => '123456789012'], ['widthMm' => 60, 'heightMm' => 40]);
    $fitted = $raster->render(['name' => 'Coffee', 'barcode' => '123456789012'], ['widthMm' => 60, 'heightMm' => 40], 384);

    expect($wide['widthBytes'] * 8)->toBe(480)
        ->and($fitted['widthBytes'] * 8)->toBeLessThanOrEqual(384)
        ->and($fitted['height'])->toBeLessThan($wide['height']);
});

it('renders the identical pixels for both protocols and a decodable PNG for the preview', function () {
    $builder = new LabelBuilder($this->formatter);
    $raster = new \App\Services\Printing\LabelRaster($this->formatter, $builder->layout(...));
    $label = ['storeName' => 'Subul', 'name' => 'قهوة عربية', 'barcode' => '123456789012', 'price' => '18.00 SAR'];
    $config = ['widthMm' => 50, 'heightMm' => 30];

    $pixels = $raster->render($label, $config);
    $png = $raster->png($label, $config);

    expect(imagecreatefromstring($png))->not->toBeFalse()
        ->and(strlen($pixels['data']))->toBe($pixels['widthBytes'] * $pixels['height'])
        ->and($pixels['widthBytes'] * 8)->toBe(400)
        ->and($pixels['height'])->toBe(240);
});

it('draws barcode dots that a scanner can read back at any narrow width', function () {
    foreach (['kBBK5kHBIF-106', 'SpM32LgT-16', '123456789012', 'A1'] as $code) {
        expect(decodedBarcode($code))->toBe($code, "printed code {$code} does not decode from its dots");
    }
});

it('names the code set before a Code 128 barcode, doubles a literal brace, and skips a code with nothing printable', function () {
    $bytes = (new EscPosBuilder($this->formatter))->barcode128('SRV{099')->toString();

    expect($bytes)->toContain("\x1D\x6B\x49".chr(10).'{BSRV{{099')
        ->and((new EscPosBuilder($this->formatter))->barcode128('فوترة')->toString())->not->toContain("\x1D\x6B");
});

it('keeps the cash drawer byte contract', function () {
    $drawer = receiptBuilder()->drawer();

    expect(bin2hex($drawer))->toBe('1b401c2e1b74281b700019fa');
});

/**
 * Reads a printed code back out of the label's dots the way a scanner would: measure the
 * bar and space runs on a scanline, divide by the narrow module, match the width table.
 */
function decodedBarcode(string $code): ?string
{
    $formatter = new ArabicTextFormatter;
    $builder = new LabelBuilder($formatter);
    $raster = new App\Services\Printing\LabelRaster($formatter, $builder->layout(...));
    $config = ['widthMm' => 60, 'heightMm' => 40];
    $label = ['storeName' => 'Subul', 'name' => 'Coffee', 'barcode' => $code, 'price' => '1.00'];
    $pixels = $raster->render($label, $config);

    $barcode = null;
    foreach ($builder->layout($label, $config)['rows'] as $row) {
        if (($row['type'] ?? '') === 'barcode') {
            $barcode = $row;
        }
    }
    if ($barcode === null) {
        return null;
    }

    $offset = ($barcode['y'] + intdiv($barcode['height'], 2)) * $pixels['widthBytes'];
    $runs = [];
    for ($x = 0; $x < $pixels['widthBytes'] * 8; $x++) {
        $ink = (ord($pixels['data'][$offset + intdiv($x, 8)]) & (1 << (7 - $x % 8))) !== 0;
        if ($runs !== [] && $runs[count($runs) - 1]['ink'] === $ink) {
            $runs[count($runs) - 1]['length']++;
            continue;
        }
        $runs[] = ['ink' => $ink, 'length' => 1];
    }

    // Bare label around the bars reads as space, so a scanline always opens and closes with one.
    if (! $runs[0]['ink']) {
        array_shift($runs);
    }
    if (! $runs[count($runs) - 1]['ink']) {
        array_pop($runs);
    }

    $lengths = array_column($runs, 'length');
    $narrow = min($lengths);
    $patterns = App\Services\Printing\LabelRaster::patterns();

    for ($module = max(1, $narrow - 1); $module <= $narrow + 1; $module++) {
        $units = array_map(fn (int $length): int => (int) round($length / $module), $lengths);
        if (count($units) < 25 || count($units) % 6 !== 1 || implode('', array_slice($units, -7)) !== '2331112') {
            continue;
        }

        $values = [];
        foreach (array_chunk(array_slice($units, 0, -7), 6) as $symbol) {
            $value = array_search(implode('', $symbol), $patterns, true);
            if ($value === false) {
                continue 2;
            }
            $values[] = $value;
        }

        return code128Value($values);
    }

    return null;
}

/** Symbol values to text, refusing a code whose checksum does not add up. */
function code128Value(array $values): ?string
{
    $start = array_shift($values);
    $checksum = array_pop($values);
    $total = $start;
    foreach ($values as $position => $value) {
        $total += $value * ($position + 1);
    }
    if ($total % 103 !== $checksum) {
        return null;
    }

    return match ($start) {
        104 => implode('', array_map(fn (int $value): string => chr($value + 32), $values)),
        105 => implode('', array_map(fn (int $value): string => str_pad((string) $value, 2, '0', STR_PAD_LEFT), $values)),
        default => null,
    };
}

it('prints Arabic as an image in image mode so no printer code page is needed', function () {
    $builder = new EscPosBuilder($this->formatter, 42, 'image', 560);
    $out = $builder->init()
        ->productHeader('الصنف', 'الكمية', 'المجموع')
        ->productRow('Coffee', '1x', '10.00', '10.00')
        ->toString();

    // PC437 is pinned, and the Arabic header is a GS v 0 raster, never text bytes
    // that a printer on the wrong code page would draw as box characters.
    expect(substr($out, 0, 6))->toBe("\x1B\x40\x1C\x2E\x1B\x74")
        ->and($out)->toContain("\x1D\x76\x30")
        ->and($this->formatter->supportsCodePage('image'))->toBeFalse();
});

it('draws the whole receipt as one picture in image mode and keeps the barcode native', function () {
    $currency = new class($this->formatter) extends ReceiptCurrency {
        public function __construct(private $formatter)
        {
        }

        public function format(mixed $value, bool $rtl = false): ?string
        {
            $amount = ReceiptCurrency::parse($value);

            return $amount === null ? null : number_format($amount, 2);
        }
    };

    $receipt = [
        'storeName' => 'Subul',
        'items' => [
            ['name' => 'Nanshing Avalon 8-piece Comforter Set', 'quantity' => 1, 'price' => 67.72, 'total' => 67.72],
            ['name' => 'سيليكون طحالب اكريليم ابيض فيرم', 'quantity' => 3, 'price' => 10, 'total' => 30],
        ],
        'total' => 97.72,
        'barcode' => '261031-005',
    ];

    foreach (['ltr', 'rtl'] as $direction) {
        $out = (new ReceiptBuilder($this->formatter, $currency))
            ->build($receipt, ['encoding' => 'image', 'direction' => $direction]);

        // No receipt word travels as text: the store name and the Arabic item are in the bitmap.
        expect($out)->toContain("\x1D\x76\x30")
            ->and($out)->not->toContain('Subul')
            ->and($out)->not->toContain('Total')
            ->and($out)->toContain("\x1D\x6B\x49")
            ->and($out)->toEndWith("\x1D\x56\x42\x03");
    }
});

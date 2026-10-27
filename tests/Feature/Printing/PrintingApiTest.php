<?php

use App\Models\Option;
use App\Models\User;
use App\Services\Options;
use App\Services\Printing\PrinterService;
use App\Services\Printing\Transports\NullTransport;
use App\Services\Printing\Transports\TcpTransport;
use App\Services\Printing\Transports\TransportInterface;
use App\Services\Printing\Transports\WindowsSpoolTransport;
use Illuminate\Foundation\Testing\TestCase;

$windowsRows = [
    ['name' => 'XP-80C', 'port' => 'USB001', 'driver' => 'XP-80C', 'isDefault' => true, 'isOffline' => false, 'status' => 3, 'labelProtocol' => 'escpos', 'type' => 'windows'],
    ['name' => 'XP-D365B', 'port' => 'USB002', 'driver' => 'TSPL', 'isDefault' => false, 'isOffline' => false, 'status' => 3, 'labelProtocol' => 'tspl', 'type' => 'windows'],
];

/**
 * Replace the machine-facing half of printing (spooler lookup + transports) with a
 * recorder, so the endpoints run their real request/build/dispatch/response path
 * without touching Windows or attached hardware.
 */
function recordPrintingJobs(array $rows): NullTransport
{
    $transport = new NullTransport;

    app()->instance(PrinterService::class, new class($transport, $rows) extends PrinterService {
        public function __construct(private readonly TransportInterface $recorder, private readonly array $rows)
        {
            parent::__construct(new TcpTransport, new WindowsSpoolTransport);
        }

        public function printers(bool $refresh = false): array
        {
            return $this->rows;
        }

        public function transportFor(string $printer): TransportInterface
        {
            return $this->recorder;
        }
    });

    return $transport;
}

function posCashier(TestCase $case): User
{
    $user = User::factory()->create();
    $case->actingAs($user);

    return $user;
}

beforeEach(function () use ($windowsRows) {
    $this->transport = recordPrintingJobs($windowsRows);
});

it('reports the integrated printing service as online', function () {
    posCashier($this);

    $this->getJson('/api/printing/status')
        ->assertStatus(200)
        ->assertJson([
            'status' => 'online',
            'service' => 'Subul Integrated Printing',
            'platform' => PHP_OS_FAMILY,
        ])
        ->assertJsonPath('version', config('subul.version'));
});

it('lists windows printers with their detected label protocol', function () {
    posCashier($this);

    $this->getJson('/api/printing/printers')
        ->assertStatus(200)
        ->assertJsonCount(2, 'printers')
        ->assertJsonPath('count', 2)
        ->assertJsonPath('printers.0.name', 'XP-80C')
        ->assertJsonPath('printers.1.labelProtocol', 'tspl');
});

it('prints a receipt on every requested copy', function () {
    posCashier($this);

    $this->postJson('/api/printing/receipt', [
        'printer' => null,
        'jobId' => 'rcpt_http_1',
        'data' => [
            'storeName' => 'Subul',
            'orderCode' => 'ORD-11',
            'items' => [['name' => 'قهوة عربية', 'quantity' => 2, 'price' => '10.00', 'total' => '20.00']],
            'total' => '20.00',
        ],
        'config' => ['copies' => 2, 'encoding' => 'cp864', 'lineWidth' => 42, 'openCashDrawer' => true],
    ])->assertStatus(200)->assertJson([
        'success' => true,
        'jobId' => 'rcpt_http_1',
        'printer' => 'XP-80C',
        'copies' => 2,
        'message' => 'Receipt printed successfully (2 copies).',
    ]);

    $copy = $this->transport->jobs[0]['data'];
    expect(count($this->transport->jobs))->toBe(1)
        ->and($this->transport->jobs[0]['documentName'])->toBe('Subul Receipt ORD-11')
        ->and(substr_count($copy, "\x1B\x40"))->toBe(2)
        ->and($copy)->toContain("\x1B\x74\x28")
        ->and($copy)->not->toContain("\x1D\x76\x30");
});

it('answers a repeated job id with the original result instead of printing again', function () {
    posCashier($this);
    $payload = ['jobId' => 'rcpt_http_2', 'data' => ['total' => '5.00', 'items' => []]];

    $this->postJson('/api/printing/receipt', $payload)->assertStatus(200);
    $this->postJson('/api/printing/receipt', $payload)
        ->assertStatus(200)
        ->assertJson(['success' => true, 'jobId' => 'rcpt_http_2', 'duplicate' => true]);

    expect(count($this->transport->jobs))->toBe(1);
});

it('prints the store header and footer from the store options when the client sends none', function () {
    posCashier($this);
    app(Options::class)->set('sb_store_name', 'Corner Cafe');
    app(Options::class)->set('sb_store_phone', '0599 000 000');
    app(Options::class)->set('sb_invoice_receipt_footer', 'See you soon');

    $this->postJson('/api/printing/receipt', [
        'jobId' => 'rcpt_http_store',
        'data' => ['total' => '5.00', 'items' => []],
        'config' => ['encoding' => 'cp864'],
    ])->assertStatus(200);

    expect($this->transport->jobs[0]['data'])->toContain('Corner Cafe')
        ->and($this->transport->jobs[0]['data'])->toContain('Tel: 0599 000 000')
        ->and($this->transport->jobs[0]['data'])->toContain('See you soon')
        ->and($this->transport->jobs[0]['data'])->not->toContain('Thank you for your business!');
});

it('refuses a receipt without items or a total', function () {
    posCashier($this);

    $this->postJson('/api/printing/receipt', ['jobId' => 'rcpt_http_3', 'data' => ['storeName' => 'Subul']])
        ->assertStatus(422)
        ->assertJsonValidationErrors('data');

    expect($this->transport->jobs)->toBe([]);
});

it('answers 422 when windows has no default printer', function () {
    posCashier($this);
    recordPrintingJobs([['name' => 'XP-80C', 'isDefault' => false, 'labelProtocol' => 'escpos']]);

    $this->postJson('/api/printing/drawer', ['pin' => 0])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Windows has no default printer configured. Set one in Settings > Printers & scanners.');
});

it('prints product labels and counts every copy', function () {
    posCashier($this);

    $this->postJson('/api/printing/labels', [
        'printer' => 'XP-D365B',
        'jobId' => 'lbl_http_1',
        'labels' => [
            ['name' => 'Coffee', 'barcode' => '123456789012', 'price' => '12.00', 'copies' => 3],
            ['name' => 'شاي', 'barcode' => '223456789013', 'price' => '9.00'],
        ],
        'config' => ['widthMm' => 50, 'heightMm' => 30, 'protocol' => 'auto', 'copies' => 1],
    ])->assertStatus(200)->assertJson([
        'success' => true,
        'printer' => 'XP-D365B',
        'totalLabelsPrinted' => 4,
        'message' => '4 labels printed successfully.',
    ]);

    expect(count($this->transport->jobs))->toBe(1)
        ->and($this->transport->jobs[0]['data'])->toStartWith('SIZE 50 mm, 30 mm')
        ->and(substr_count($this->transport->jobs[0]['data'], 'SIZE 50 mm, 30 mm'))->toBe(2)
        ->and($this->transport->jobs[0]['documentName'])->toBe('Subul Labels');
});

it('rejects an empty label batch', function () {
    posCashier($this);

    $this->postJson('/api/printing/labels', ['printer' => 'XP-D365B', 'labels' => []])
        ->assertStatus(422)
        ->assertJsonValidationErrors('labels');

    expect($this->transport->jobs)->toBe([]);
});

it('prints one label per item even when the receipt prints three copies', function () {
    posCashier($this);

    $this->putJson('/api/printing/settings', ['copies' => 3, 'cutPaper' => false])->assertStatus(200);

    $this->postJson('/api/printing/labels', [
        'printer' => 'XP-D365B',
        'jobId' => 'lbl_http_2',
        'labels' => [['name' => 'Coffee', 'barcode' => '123456789012', 'price' => '12.00']],
        'config' => ['protocol' => 'tspl'],
    ])->assertStatus(200)->assertJson(['totalLabelsPrinted' => 1]);

    $this->postJson('/api/printing/labels', [
        'printer' => 'XP-80C',
        'jobId' => 'lbl_http_3',
        'labels' => [['name' => 'Coffee', 'price' => '12.00']],
        'config' => ['protocol' => 'escpos'],
    ])->assertStatus(200)->assertJson(['totalLabelsPrinted' => 1]);

    expect($this->transport->jobs[0]['data'])->toContain('PRINT 1')
        ->and($this->transport->jobs[1]['data'])->toContain("\x1D\x56");
});

it('rejects a receipt line width the builder cannot lay out', function () {
    posCashier($this);

    $this->postJson('/api/printing/receipt', [
        'jobId' => 'rcpt_http_9',
        'data' => ['total' => '5.00', 'items' => []],
        'config' => ['lineWidth' => 5],
    ])->assertStatus(422)->assertJsonValidationErrors('config.lineWidth');

    expect($this->transport->jobs)->toBe([]);
});

it('pulses the cash drawer with the legacy kick sequence', function () {
    posCashier($this);

    $this->postJson('/api/printing/drawer', ['printer' => 'XP-80C', 'pin' => 0])
        ->assertStatus(200)
        ->assertJson(['success' => true, 'printer' => 'XP-80C', 'message' => 'Cash drawer opened successfully.']);

    expect(bin2hex($this->transport->jobs[0]['data']))->toBe('1b401b74281b700019fa');
});

it('sends an arabic sample test receipt', function () {
    posCashier($this);

    $this->postJson('/api/printing/test', ['printer' => 'XP-80C', 'type' => 'receipt', 'sample' => 'arabic', 'lineWidth' => 42])
        ->assertStatus(200)
        ->assertJson([
            'success' => true,
            'printer' => 'XP-80C',
            'message' => 'Test receipt successfully sent to printer "XP-80C".',
        ]);

    expect($this->transport->jobs[0]['documentName'])->toBe('Subul Test Print');
});

it('sends a tspl test label when the protocol is auto', function () {
    posCashier($this);

    $this->postJson('/api/printing/test', ['printer' => 'XP-D365B', 'type' => 'label', 'protocol' => 'auto'])
        ->assertStatus(200);

    expect($this->transport->jobs[0]['data'])->toStartWith('SIZE 50 mm, 30 mm');
});

it('serves the default printing settings to a terminal that never saved any', function () {
    posCashier($this);

    $this->getJson('/api/printing/settings')
        ->assertStatus(200)
        ->assertJson([
            'success' => true,
            'settings' => [
                'receiptPrinter' => '',
                'labelPrinter' => '',
                'lineWidth' => 42,
                'encoding' => 'cp864',
                'cutPaper' => true,
                'openCashDrawer' => false,
                'copies' => 1,
                'labelWidthMm' => 50,
                'labelHeightMm' => 30,
                'labelProtocol' => 'auto',
                'showBarcodeTextOnLabel' => true,
            ],
        ]);
});

it('stores printing settings as options and reads them back casted', function () {
    posCashier($this);

    $this->putJson('/api/printing/settings', [
        'receiptPrinter' => 'XP-80C',
        'labelPrinter' => 'XP-D365B',
        'lineWidth' => 32,
        'cutPaper' => false,
        'openCashDrawer' => true,
        'lineSpacing' => 24,
    ])->assertStatus(200)->assertJsonPath('settings.receiptPrinter', 'XP-80C')
        ->assertJsonPath('settings.lineWidth', 32)
        ->assertJsonPath('settings.cutPaper', false)
        ->assertJsonPath('settings.openCashDrawer', true)
        ->assertJsonPath('settings.lineSpacing', 24);

    expect(sb()->option->get('sb_subul_printing_receipt_printer'))->toBe('XP-80C')
        ->and(sb()->option->get('sb_subul_printing_cut_paper'))->toBe('no')
        ->and(sb()->option->get('sb_subul_printing_cash_drawer'))->toBe('yes');

    $this->getJson('/api/printing/settings')
        ->assertJsonPath('settings.cutPaper', false)
        ->assertJsonPath('settings.labelWidthMm', 50);
});

it('prints on the configured receipt printer when the job names none', function () {
    posCashier($this);
    $this->putJson('/api/printing/settings', ['receiptPrinter' => 'XP-D365B', 'copies' => 2])->assertStatus(200);

    $this->postJson('/api/printing/receipt', [
        'jobId' => 'rcpt_http_configured',
        'data' => ['orderCode' => 'ORD-12', 'total' => '10.00', 'items' => []],
    ])->assertStatus(200)->assertJson(['printer' => 'XP-D365B', 'copies' => 2]);
});

it('clears the stored line spacing when the setting is set back to null', function () {
    posCashier($this);
    $this->putJson('/api/printing/settings', ['lineSpacing' => 30])->assertStatus(200);

    $this->putJson('/api/printing/settings', ['lineSpacing' => null])
        ->assertStatus(200)
        ->assertJsonPath('settings.lineSpacing', null);

    expect(Option::where('key', 'sb_subul_printing_line_spacing')->exists())->toBeFalse();
});

it('rejects a printing setting the builder cannot honour', function () {
    posCashier($this);

    $this->putJson('/api/printing/settings', ['encoding' => 'utf-99', 'copies' => 9])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['encoding', 'copies']);
});

it('keeps every printing endpoint behind authentication', function () {
    $this->getJson('/api/printing/status')->assertStatus(401);
    $this->postJson('/api/printing/receipt', ['data' => ['total' => '1.00']])->assertStatus(401);
    $this->getJson('/api/printing/settings')->assertStatus(401);
    $this->putJson('/api/printing/settings', ['lineWidth' => 42])->assertStatus(401);
});

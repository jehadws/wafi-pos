<?php

use App\Services\Printing\ArabicTextFormatter;
use App\Services\Printing\LabelBuilder;
use App\Services\Printing\PrintJobService;
use App\Services\Printing\PrinterService;
use App\Services\Printing\ReceiptBuilder;
use App\Services\Printing\Transports\NullTransport;
use App\Services\Printing\Transports\TcpTransport;
use App\Services\Printing\Transports\TransportInterface;
use App\Services\Printing\Transports\WindowsSpoolTransport;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Records every job instead of talking to hardware; fails on the nth send when asked. */
function jobTransport(?int $failOnSend = null): NullTransport
{
    return new class($failOnSend) extends NullTransport {
        public function __construct(private readonly ?int $failOnSend = null)
        {
        }

        public function send(string $printer, string $data, string $documentName): array
        {
            if ($this->failOnSend === count($this->jobs) + 1) {
                throw new RuntimeException('printer is offline');
            }

            return parent::send($printer, $data, $documentName);
        }
    };
}

/** Stands in for PrinterService so no job shells out to Windows or touches real printers. */
function printJobService(TransportInterface $transport): PrintJobService
{
    $formatter = new ArabicTextFormatter;
    $printers = new class($transport) extends PrinterService {
        public function __construct(private readonly TransportInterface $transport)
        {
            parent::__construct(new TcpTransport, new WindowsSpoolTransport);
        }

        public function resolveTarget(?string $printer): string
        {
            return $printer === null || $printer === '' ? 'XP-80C' : $printer;
        }

        public function transportFor(string $printer): TransportInterface
        {
            return $this->transport;
        }

        public function labelProtocol(string $printer): string
        {
            return 'tspl';
        }
    };

    return new PrintJobService(
        new ReceiptBuilder($formatter),
        new LabelBuilder($formatter),
        $printers,
    );
}

$receipt = [
    'storeName' => 'Subul',
    'orderCode' => 'ORD-7',
    'items' => [['name' => 'Coffee', 'quantity' => 1, 'price' => '12.00', 'total' => '12.00']],
    'total' => '12.00',
];

it('sends every receipt copy as one spool job', function () use ($receipt) {
    $transport = jobTransport();
    $result = printJobService($transport)->receipt(null, $receipt, ['copies' => 3], 'rcpt_1');
    $single = (new ReceiptBuilder(new ArabicTextFormatter))->build($receipt, ['copies' => 3]);

    expect($result)->toBe([
        'success' => true,
        'jobId' => 'rcpt_1',
        'printer' => 'XP-80C',
        'copies' => 3,
        'bytesWritten' => strlen($single) * 3,
        'message' => 'Receipt printed successfully (3 copies).',
    ])->and(count($transport->jobs))->toBe(1)
        ->and($transport->jobs[0]['data'])->toBe(str_repeat($single, 3))
        ->and($transport->jobs[0]['documentName'])->toBe('Subul Receipt ORD-7')
        ->and($transport->jobs[0]['printer'])->toBe('XP-80C');
});

it('clamps receipt copies to the supported range', function () use ($receipt) {
    $overLimit = printJobService(jobTransport())->receipt(null, $receipt, ['copies' => 99], 'rcpt_2');
    $underLimit = printJobService(jobTransport())->receipt(null, $receipt, ['copies' => 0], 'rcpt_3');

    expect($overLimit['copies'])->toBe(5)
        ->and($underLimit['copies'])->toBe(1);
});

it('replays a finished job id without touching the transport again', function () use ($receipt) {
    $transport = jobTransport();
    $service = printJobService($transport);
    $first = $service->receipt(null, $receipt, [], 'rcpt_4');

    $repeat = $service->receipt(null, $receipt, [], 'rcpt_4');

    expect($repeat)->toBe([...$first, 'duplicate' => true])
        ->and(count($transport->jobs))->toBe(1);
});

it('refuses a job id that is still printing', function () use ($receipt) {
    Cache::add('printing:jobs:rcpt_busy', ['status' => 'processing'], now()->addMinutes(10));

    printJobService(jobTransport())->receipt(null, $receipt, [], 'rcpt_busy');
})->throws(HttpException::class, 'Print job rcpt_busy is still printing.');

it('passes the printer failure through', function () use ($receipt) {
    printJobService(jobTransport(1))->receipt(null, $receipt, [], 'rcpt_5');
})->throws(RuntimeException::class, 'printer is offline');

it('accepts the same job id again after a failure', function () use ($receipt) {
    $failing = jobTransport(1);
    try {
        printJobService($failing)->receipt(null, $receipt, [], 'rcpt_6');
    } catch (RuntimeException) {
        // the guard has to be cleared for this job id
    }

    $retry = jobTransport();
    $result = printJobService($retry)->receipt(null, $receipt, [], 'rcpt_6');

    expect($result['success'])->toBeTrue()
        ->and(count($retry->jobs))->toBe(1);
});

it('prints every label with its own copy count in one spool job', function () {
    $transport = jobTransport();
    $result = printJobService($transport)->labels('XP-D365B', [
        ['name' => 'Coffee', 'barcode' => '123456789012', 'price' => '12.00', 'copies' => 3],
        ['name' => 'Tea', 'barcode' => '223456789013', 'price' => '9.00', 'copies' => 2],
    ], ['widthMm' => 50, 'heightMm' => 30], 'lbl_1');

    expect($result['printer'])->toBe('XP-D365B')
        ->and($result['totalLabelsPrinted'])->toBe(5)
        ->and($result['message'])->toBe('5 labels printed successfully.')
        ->and(count($transport->jobs))->toBe(1)
        ->and($transport->jobs[0]['data'])->toStartWith('SIZE 50 mm, 30 mm')
        ->and($transport->jobs[0]['data'])->toContain("PRINT 3\r\n")
        ->and($transport->jobs[0]['data'])->toEndWith("PRINT 2\r\n")
        ->and($transport->jobs[0]['documentName'])->toBe('Subul Labels');
});

it('opens the cash drawer on every call', function () {
    $transport = jobTransport();
    $service = printJobService($transport);
    $first = $service->drawer(null);
    $second = $service->drawer(null);

    expect($first)->toBe([
        'success' => true,
        'printer' => 'XP-80C',
        'message' => 'Cash drawer opened successfully.',
        'result' => [
            'success' => true,
            'printer' => 'XP-80C',
            'type' => 'null',
            'bytesWritten' => 10,
        ],
    ])->and(bin2hex($transport->jobs[0]['data']))->toBe('1b401b74281b700019fa')
        ->and($second['success'])->toBeTrue()
        ->and(count($transport->jobs))->toBe(2);
});

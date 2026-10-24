<?php

use App\Services\Printing\PrinterService;
use App\Services\Printing\Transports\TcpTransport;
use App\Services\Printing\Transports\WindowsSpoolTransport;

/**
 * PrinterService::printers() is stubbed so these assertions never shell out to
 * Windows or read the real machine's default printer.
 */
function stubbedPrinterService(array $rows): PrinterService
{
    return new class($rows) extends PrinterService {
        public function __construct(private readonly array $rows)
        {
            parent::__construct(new TcpTransport, new WindowsSpoolTransport);
        }

        public function printers(bool $refresh = false): array
        {
            return $this->rows;
        }
    };
}

$windowsRows = [
    ['name' => 'XP-80C', 'isDefault' => true, 'labelProtocol' => 'escpos', 'type' => 'windows'],
    ['name' => 'XP-D365B', 'isDefault' => false, 'labelProtocol' => 'tspl', 'type' => 'windows'],
];

it('falls back to the windows default printer when no target is given', function () use ($windowsRows) {
    $service = stubbedPrinterService($windowsRows);

    expect($service->resolveTarget(null))->toBe('XP-80C')
        ->and($service->resolveTarget('   '))->toBe('XP-80C')
        ->and($service->resolveTarget('Label Printer'))->toBe('Label Printer');
});

it('routes host:port targets over tcp and printer names over the spooler', function () use ($windowsRows) {
    $service = stubbedPrinterService($windowsRows);

    expect($service->isTcpTarget('127.0.0.1:9100'))->toBeTrue()
        ->and($service->isTcpTarget('tcp://192.168.1.50:9100'))->toBeTrue()
        ->and($service->isTcpTarget('XP-80C'))->toBeFalse()
        ->and($service->isTcpTarget('XP-80C:9100'))->toBeTrue()
        ->and($service->transportFor('127.0.0.1:9100'))->toBeInstanceOf(TcpTransport::class)
        ->and($service->transportFor('XP-80C'))->toBeInstanceOf(WindowsSpoolTransport::class);
});

it('picks the label protocol from the detected driver', function () use ($windowsRows) {
    $service = stubbedPrinterService($windowsRows);

    expect($service->labelProtocol('XP-D365B'))->toBe('tspl')
        ->and($service->labelProtocol('XP-80C'))->toBe('escpos')
        ->and($service->labelProtocol('127.0.0.1:9100'))->toBe('escpos')
        ->and($service->labelProtocol('Unknown Printer'))->toBe('escpos');
});

<?php

namespace App\Services\Printing;

use App\Services\Printing\Transports\TcpTransport;
use App\Services\Printing\Transports\TransportInterface;
use App\Services\Printing\Transports\WindowsSpoolTransport;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PrinterService
{
    private const CACHE_KEY = 'printing:windows-printers';

    public function __construct(
        private readonly TcpTransport $tcpTransport,
        private readonly WindowsSpoolTransport $windowsTransport,
    ) {
    }

    public function printers(bool $refresh = false): array
    {
        if ($refresh) {
            $this->invalidate();
        }

        return Cache::remember(self::CACHE_KEY, now()->addMinutes(10), fn () => $this->discoverWindowsPrinters());
    }

    public function invalidate(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function resolveTarget(?string $printer): string
    {
        $target = trim((string) $printer);
        if ($target !== '') {
            return $target;
        }

        $default = collect($this->printers())->firstWhere('isDefault', true);
        if (! $default) {
            throw new HttpException(422, __('Windows has no default printer configured. Set one in Settings > Printers & scanners.'));
        }

        return $default['name'];
    }

    public function transportFor(string $printer): TransportInterface
    {
        return $this->isTcpTarget($printer) ? $this->tcpTransport : $this->windowsTransport;
    }

    public function isTcpTarget(string $printer): bool
    {
        $target = preg_replace('/^tcp:\/\//i', '', trim($printer));

        return (bool) preg_match('/^[a-z0-9.-]+:\d{1,5}$/i', $target);
    }

    public function labelProtocol(string $printer): string
    {
        if ($this->isTcpTarget($printer)) {
            return 'escpos';
        }

        $match = collect($this->printers())->firstWhere('name', $printer);

        return $match['labelProtocol'] ?? 'escpos';
    }

    private function discoverWindowsPrinters(): array
    {
        if (PHP_OS_FAMILY !== 'Windows') {
            return [];
        }

        $script = <<<'POWERSHELL'
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$drivers = @{}
Get-PrinterDriver | ForEach-Object { $drivers[$_.Name] = $_.DataFile }
Get-CimInstance Win32_Printer |
    Select-Object Name, PortName, DriverName, Default, PrinterStatus, WorkOffline, @{n='DataFile';e={$drivers[$_.DriverName]}} |
    ConvertTo-Json -Compress
POWERSHELL;

        $process = PowerShell::run([
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy', 'Bypass',
            '-Command', $script,
        ], 10);

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'Failed to list Windows printers.');
        }

        $output = preg_replace('/^\xEF\xBB\xBF/', '', trim($process->getOutput()));
        if ($output === '') {
            return [];
        }

        $decoded = json_decode($output, true, flags: JSON_THROW_ON_ERROR);
        $printers = array_is_list($decoded) ? $decoded : [$decoded];

        return array_map(function (array $printer): array {
            $dataFile = str_replace('\\', '/', (string) ($printer['DataFile'] ?? ''));

            return [
                'name' => (string) $printer['Name'],
                'port' => (string) ($printer['PortName'] ?? ''),
                'driver' => (string) ($printer['DriverName'] ?? ''),
                'isDefault' => (bool) ($printer['Default'] ?? false),
                'isOffline' => (bool) ($printer['WorkOffline'] ?? false),
                'status' => $printer['PrinterStatus'] ?? null,
                'labelProtocol' => str_starts_with(strtolower(basename($dataFile)), 'tsc') ? 'tspl' : 'escpos',
                'type' => 'windows',
            ];
        }, $printers);
    }
}

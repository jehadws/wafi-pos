<?php

namespace App\Services\Printing;

use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class PrintJobService
{
    public function __construct(
        private readonly ReceiptBuilder $receiptBuilder,
        private readonly LabelBuilder $labelBuilder,
        private readonly PrinterService $printers,
    ) {
    }

    public function receipt(?string $printer, array $data, array $config, string $jobId): array
    {
        return $this->once($jobId, function () use ($printer, $data, $config, $jobId): array {
            $target = $this->printers->resolveTarget($printer);
            $transport = $this->printers->transportFor($target);
            $copies = max(1, min(5, (int) ($config['copies'] ?? 1)));
            // One spool job for every copy: each launch of the Windows transport costs a PowerShell start.
            $bytes = str_repeat($this->receiptBuilder->build($data, $config), $copies);
            $result = $transport->send($target, $bytes, 'Subul Receipt '.($data['orderCode'] ?? $jobId));

            return [
                'success' => true,
                'jobId' => $jobId,
                'printer' => $target,
                'copies' => $copies,
                'bytesWritten' => $result['bytesWritten'],
                'message' => "Receipt printed successfully ({$copies} ".($copies === 1 ? 'copy' : 'copies').').',
            ];
        });
    }

    public function labels(?string $printer, array $labels, array $config, string $jobId): array
    {
        return $this->once($jobId, function () use ($printer, $labels, $config, $jobId): array {
            $target = $this->printers->resolveTarget($printer);
            $transport = $this->printers->transportFor($target);
            $protocol = $config['protocol'] ?? 'auto';
            if ($protocol === 'auto') {
                $protocol = $this->printers->labelProtocol($target);
            }

            $printed = 0;
            $bytes = '';
            foreach ($labels as $label) {
                $copies = max(1, min(100, (int) ($label['copies'] ?? $config['copies'] ?? 1)));
                $bytes .= $this->labelBuilder->build($label, [...$config, 'protocol' => $protocol, 'copies' => $copies]);
                $printed += $copies;
            }

            $result = $transport->send($target, $bytes, 'Subul Labels');

            return [
                'success' => true,
                'jobId' => $jobId,
                'printer' => $target,
                'totalLabelsPrinted' => $printed,
                'bytesWritten' => $result['bytesWritten'],
                'message' => "{$printed} label".($printed === 1 ? '' : 's').' printed successfully.',
            ];
        });
    }

    public function drawer(?string $printer, int $pin = 0): array
    {
        $target = $this->printers->resolveTarget($printer);
        $bytes = $this->receiptBuilder->drawer($pin);
        $result = $this->printers->transportFor($target)->send($target, $bytes, 'Subul Cash Drawer');

        return [
            'success' => true,
            'printer' => $target,
            'message' => 'Cash drawer opened successfully.',
            'result' => $result,
        ];
    }

    /**
     * A job id prints at most once. Repeating a finished job returns its original
     * result, so a client retrying after a timeout cannot print a second receipt.
     */
    private function once(string $jobId, callable $callback): array
    {
        $key = 'printing:jobs:'.$jobId;
        if (! Cache::add($key, ['status' => 'processing'], now()->addMinutes(10))) {
            $existing = Cache::get($key);
            if (is_array($existing) && ($existing['status'] ?? null) === 'completed') {
                return [...$existing['result'], 'duplicate' => true];
            }

            throw new HttpException(409, "Print job {$jobId} is still printing.");
        }

        try {
            $result = $callback();
            Cache::put($key, ['status' => 'completed', 'result' => $result], now()->addMinutes(10));

            return $result;
        } catch (Throwable $exception) {
            Cache::forget($key);
            throw $exception;
        }
    }
}

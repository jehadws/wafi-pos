<?php

namespace App\Services\Printing;

use Illuminate\Support\Facades\Cache;
use RuntimeException;
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
            $bytes = $this->receiptBuilder->build($data, $config);
            $copies = max(1, min(5, (int) ($config['copies'] ?? 1)));
            $results = [];

            for ($copy = 1; $copy <= $copies; $copy++) {
                try {
                    $results[] = $transport->send($target, $bytes, 'Subul Receipt '.($data['orderCode'] ?? $jobId));
                } catch (Throwable $exception) {
                    throw new RuntimeException(
                        "Printed ".count($results)." of {$copies} receipt copies before failure: {$exception->getMessage()}",
                        0,
                        $exception,
                    );
                }
            }

            return [
                'success' => true,
                'jobId' => $jobId,
                'printer' => $target,
                'copies' => $copies,
                'bytesWritten' => array_sum(array_column($results, 'bytesWritten')),
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
            $bytesWritten = 0;
            foreach ($labels as $index => $label) {
                $copies = max(1, min(100, (int) ($label['copies'] ?? $config['copies'] ?? 1)));
                $labelConfig = [...$config, 'protocol' => $protocol, 'copies' => $copies];
                $bytes = $this->labelBuilder->build($label, $labelConfig);

                try {
                    $result = $transport->send($target, $bytes, 'Subul Label '.($index + 1));
                } catch (Throwable $exception) {
                    throw new RuntimeException(
                        "Printed {$printed} labels before failure: {$exception->getMessage()}",
                        0,
                        $exception,
                    );
                }

                $printed += $copies;
                $bytesWritten += $result['bytesWritten'];
            }

            return [
                'success' => true,
                'jobId' => $jobId,
                'printer' => $target,
                'totalLabelsPrinted' => $printed,
                'bytesWritten' => $bytesWritten,
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

    private function once(string $jobId, callable $callback): array
    {
        $key = 'printing:jobs:'.$jobId;
        if (! Cache::add($key, 'processing', now()->addMinutes(10))) {
            throw new HttpException(409, "Print job {$jobId} was already submitted.");
        }

        try {
            $result = $callback();
            Cache::put($key, 'completed', now()->addMinutes(10));

            return $result;
        } catch (Throwable $exception) {
            Cache::forget($key);
            throw $exception;
        }
    }
}

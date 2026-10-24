<?php

namespace App\Services\Printing\Transports;

class NullTransport implements TransportInterface
{
    public array $jobs = [];

    public function send(string $printer, string $data, string $documentName): array
    {
        $this->jobs[] = compact('printer', 'data', 'documentName');

        return [
            'success' => true,
            'printer' => $printer,
            'type' => 'null',
            'bytesWritten' => strlen($data),
        ];
    }
}

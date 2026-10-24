<?php

namespace App\Services\Printing\Transports;

interface TransportInterface
{
    public function send(string $printer, string $data, string $documentName): array;
}

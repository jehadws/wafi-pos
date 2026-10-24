<?php

namespace App\Services\Printing\Transports;

use RuntimeException;

class TcpTransport implements TransportInterface
{
    public function send(string $printer, string $data, string $documentName): array
    {
        $target = preg_replace('/^tcp:\/\//i', '', trim($printer));
        if (! preg_match('/^([a-z0-9.-]+):(\d{1,5})$/i', $target, $matches)) {
            throw new RuntimeException("Invalid TCP printer address: {$printer}");
        }

        $port = (int) $matches[2];
        if ($port < 1 || $port > 65535) {
            throw new RuntimeException("Invalid TCP printer port: {$port}");
        }

        $socket = @stream_socket_client(
            "tcp://{$matches[1]}:{$port}",
            $errorCode,
            $errorMessage,
            5,
            STREAM_CLIENT_CONNECT,
        );

        if ($socket === false) {
            throw new RuntimeException("Unable to connect to {$target}: {$errorMessage} ({$errorCode})");
        }

        stream_set_timeout($socket, 5);
        $written = 0;
        $length = strlen($data);

        while ($written < $length) {
            $bytes = fwrite($socket, substr($data, $written));
            if ($bytes === false || $bytes === 0) {
                fclose($socket);
                throw new RuntimeException("Unable to write print data to {$target}");
            }
            $written += $bytes;
        }

        fclose($socket);

        return [
            'success' => true,
            'printer' => $target,
            'type' => 'tcp',
            'bytesWritten' => $written,
        ];
    }
}

<?php

namespace App\Console\Commands;

use App\Models\License;
use App\Services\HwidService;
use App\Services\LicenseVerifierService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ActivateLicenseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:activate 
                            {--key= : The cryptographically signed license key}
                            {--hwid= : Custom hardware ID (defaults to local machine HWID)}
                            {--device= : Name or label for this terminal/server}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cryptographically verify and activate Subul license on this terminal/server';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $keyString = $this->option('key') ?: $this->ask('Enter cryptographically signed license key');
        if (empty($keyString)) {
            $this->error('A license key is required.');
            return 1;
        }

        $keyString = trim($keyString);
        $hwid = $this->option('hwid') ?: HwidService::generate();
        $deviceName = $this->option('device') ?: ($this->ask('Enter terminal device name', 'Main POS Terminal') ?: 'Main POS Terminal');

        $this->info("Verifying cryptographic signature against Public Key...");

        // Verify cryptographic signature (ZERO database lookup — purely mathematical RSA verification)
        $payload = LicenseVerifierService::verifyKey($keyString);

        if ($payload === null) {
            $this->error("❌ ACTIVATION FAILED: Invalid or forged license key.");
            $this->line("The provided key failed RSA cryptographic signature verification.");
            return 1;
        }

        $clientName = $payload['client'] ?? 'Retail Customer';
        $maxDevices = $payload['max_devices'] ?? 1;
        $keyId = $payload['key_id'] ?? 'SUBUL-KEY';

        // Record or update this hardware's verified activation
        $license = License::updateOrCreate(
            ['hwid' => $hwid],
            [
                'device_name'     => $deviceName,
                'client_name'     => $clientName,
                'license_payload' => $payload,
                'key_string'      => $keyString,
                'is_active'       => true,
                'activated_at'    => now(),
                'last_seen'       => now(),
            ]
        );

        // Invalidate license cache so changes take effect immediately
        Cache::forget("license_{$hwid}");

        $this->info("✓ Subul successfully activated for device: {$deviceName}");
        $this->table(
            ['Property', 'Verified Value'],
            [
                ['HWID', $hwid],
                ['Licensed To', $clientName],
                ['License Key ID', $keyId],
                ['Max Terminal Limit', (string) $maxDevices],
                ['Device Name', $deviceName],
                ['Activated At', now()->toDateTimeString()],
                ['Signature Status', 'VALID (RSA-2048 SHA-256)'],
            ]
        );

        return 0;
    }
}

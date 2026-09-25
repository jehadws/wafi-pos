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
        $maxDevices = (int) ($payload['max_devices'] ?? 1);
        $keyId = $payload['key_id'] ?? 'SUBUL-KEY';

        // ── Enforce per-key device limit ──────────────────────────────
        // All activations of the same key share the same signed payload,
        // so key_id + client + max_devices identify a unique license key.
        // Count distinct active machines already activated with it and
        // refuse to go over the signed limit. Reactivating a machine that
        // is already activated (same HWID) is always allowed and just
        // refreshes the row.
        $existing = License::where('hwid', $hwid)->first();

        if (!$existing || !$existing->is_active || $existing->key_string !== $keyString) {
            $activeDevices = License::where('is_active', true)
                ->where('key_string', $keyString)
                ->when($existing, function ($q) use ($existing) {
                    // Refreshing an existing machine should not count as a new seat
                    $q->where('hwid', '!=', $existing->hwid);
                })
                ->count();

            if ($activeDevices >= $maxDevices) {
                $this->error("❌ ACTIVATION FAILED: Device limit reached.");
                $this->line("This license key allows {$maxDevices} device(s) and {$activeDevices} are already activated.");
                $this->line("Deactivate an existing terminal first (php artisan pos:deactivate) or obtain a key with a higher device limit.");
                return 1;
            }
        }

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

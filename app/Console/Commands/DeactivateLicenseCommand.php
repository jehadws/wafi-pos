<?php

namespace App\Console\Commands;

use App\Models\License;
use App\Services\HwidService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class DeactivateLicenseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pos:deactivate 
                            {--hwid= : Custom hardware ID to deactivate}
                            {--all : Deactivate all licenses in the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deactivate and revoke POS license on this terminal and purge license cache';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hwid = $this->option('hwid') ?: HwidService::generate();
        $deactivateAll = (bool) $this->option('all');

        if ($deactivateAll) {
            $count = License::count();
            License::all()->each(function (License $license) {
                Cache::forget("license_{$license->hwid}");
                $license->delete();
            });
            $this->info("✓ Successfully deactivated all {$count} license record(s) and cleared license cache.");
            return 0;
        }

        $license = License::where('hwid', $hwid)->first();

        if (!$license) {
            Cache::forget("license_{$hwid}");
            $this->warn("No active license found in database for HWID: {$hwid}. Cache was purged.");
            return 0;
        }

        $deviceName = $license->device_name;
        $clientName = $license->client_name;

        $license->delete();
        Cache::forget("license_{$hwid}");

        $this->info("✓ Wafi POS license successfully revoked for device: {$deviceName}");
        $this->table(
            ['Property', 'Status'],
            [
                ['HWID', $hwid],
                ['Device Name', $deviceName ?: 'N/A'],
                ['Licensed To', $clientName ?: 'N/A'],
                ['License Status', 'DEACTIVATED (Locked)'],
                ['Cache Status', 'PURGED'],
            ]
        );

        return 0;
    }
}

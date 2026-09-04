<?php

namespace App\Http\Controllers;

use App\Models\License;
use App\Services\HwidService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ActivationController extends Controller
{
    use ApiResponse;

    /**
     * Render the activation fallback screen.
     */
    public function show()
    {
        $hwid = HwidService::generate();
        $license = License::where('hwid', $hwid)->first();

        return Inertia::render('activation', [
            'hwid'        => $hwid,
            'isActivated' => (bool) ($license && $license->isValid()),
            'deviceName'  => $license?->device_name,
        ]);
    }

    /**
     * Process license key activation from web UI.
     */
    public function activate(Request $request)
    {
        $request->validate([
            'license_key' => 'required|string|min:10',
            'device_name' => 'nullable|string|max:100',
        ]);

        $keyString = trim($request->license_key);
        $hwid = HwidService::generate();
        $deviceName = $request->device_name ?: 'POS Terminal';

        $exitCode = Artisan::call('pos:activate', [
            '--key'    => $keyString,
            '--hwid'   => $hwid,
            '--device' => $deviceName,
        ]);

        if ($exitCode !== 0) {
            $output = trim(Artisan::output());
            if ($request->expectsJson()) {
                return $this->error($output ?: 'License activation failed. Invalid key or maximum activations exceeded.');
            }

            return back()->withErrors([
                'license_key' => $output ?: 'License activation failed. Invalid key or maximum activations exceeded.',
            ]);
        }

        Cache::forget("license_{$hwid}");

        if ($request->expectsJson()) {
            return $this->success(null, 'License activated successfully.');
        }

        return redirect('/dashboard')->with('success', 'License activated successfully.');
    }
}

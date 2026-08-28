<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    protected $table = 'licenses';

    protected $fillable = [
        'hwid',
        'device_name',
        'client_name',
        'license_payload',
        'is_active',
        'activated_at',
        'last_seen',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'activated_at'    => 'datetime',
        'last_seen'       => 'datetime',
        'license_payload' => 'array',
    ];

    /**
     * The "booted" method of the model.
     * Automatically invalidates license cache when a license is created, updated, or deleted.
     */
    protected static function booted(): void
    {
        static::saved(function (License $license) {
            if ($license->hwid) {
                \Illuminate\Support\Facades\Cache::forget("license_{$license->hwid}");
            }
        });

        static::deleted(function (License $license) {
            if ($license->hwid) {
                \Illuminate\Support\Facades\Cache::forget("license_{$license->hwid}");
            }
        });
    }

    /**
     * Check whether this license is within the LAN-disconnection grace period.
     *
     * @param  int  $graceHours  Number of hours the device may operate without
     *                           reaching the central server (default 24h).
     * @return bool  true  = within grace period (normal operations)
     *               false = grace period expired (restricted mode)
     */
    public function isWithinGracePeriod(int $graceHours = 24): bool
    {
        if ($this->last_seen === null) {
            return false;
        }

        return $this->last_seen->diffInHours(now()) < $graceHours;
    }
}

<?php

namespace App\Services;

class HwidService
{
    /**
     * In-memory cache for current PHP lifecycle.
     */
    private static ?string $cachedHwid = null;

    /**
     * Generate a unique, deterministic SHA-256 hardware fingerprint for this machine.
     *
     * Combines MAC address, CPU ID, primary Disk serial number, and Motherboard serial number.
     * Works on both Windows and Linux OS families.
     *
     * @param bool $forceRefresh Force recalculation by executing hardware commands
     * @return string SHA-256 hash (64 hex characters)
     */
    public static function generate(bool $forceRefresh = false): string
    {
        if (!$forceRefresh) {
            if (self::$cachedHwid !== null) {
                return self::$cachedHwid;
            }

            try {
                $cached = \Illuminate\Support\Facades\Cache::get('pos_hwid_fingerprint');
                if (!empty($cached)) {
                    self::$cachedHwid = $cached;
                    return self::$cachedHwid;
                }
            } catch (\Throwable $e) {
                // In early boot or non-framework contexts, continue to raw generation
            }
        }

        $mac         = self::getMacAddress();
        $cpu         = self::getCpuId();
        $disk        = self::getDiskUuid();
        $motherboard = self::getMotherboardUuid();

        // Fallback entropy if hardware commands are restricted by environment.
        // Hostname is user-spoofable, so this fingerprint is NOT trustworthy as a
        // permanent machine identity — it is cached only for 1 hour (see below)
        // so that once real hardware queries succeed, the machine converges on
        // its stable hardware-derived HWID and must be re-activated for it.
        if ($mac === 'mac-default-unknown' && $cpu === 'cpu-default-unknown' && $disk === 'disk-default-unknown') {
            $fallback = gethostname() . '|' . php_uname('n') . '|' . php_uname('m') . '|' . php_uname('s');
            $hwid = hash('sha256', $fallback);
            self::$cachedHwid = $hwid;

            // Short-lived cache only: do NOT pin the fallback identity forever.
            try {
                \Illuminate\Support\Facades\Cache::put('pos_hwid_fingerprint', $hwid, 3600);
            } catch (\Throwable $e) {
                // Ignore if cache driver is not yet ready
            }

            return $hwid;
        }

        $raw = implode('|', [$mac, $cpu, $disk, $motherboard]);
        $hwid = hash('sha256', $raw);

        self::$cachedHwid = $hwid;

        try {
            \Illuminate\Support\Facades\Cache::forever('pos_hwid_fingerprint', $hwid);
        } catch (\Throwable $e) {
            // Ignore if cache driver is not yet ready
        }

        return $hwid;
    }

    /**
     * Retrieve MAC address.
     */
    public static function getMacAddress(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            @exec('getmac /fo csv /nh 2>nul', $output);
            if (!empty($output[0])) {
                $parts = explode(',', $output[0]);
                $mac = trim($parts[0] ?? '', '"');
                if (!empty($mac) && $mac !== 'N/A') {
                    return strtolower(str_replace('-', ':', $mac));
                }
            }
        } else {
            @exec("cat /sys/class/net/eth0/address 2>/dev/null || cat /sys/class/net/enp*/address 2>/dev/null || ip link show | awk '/ether/ {print $2; exit}'", $output);
            if (!empty($output[0])) {
                return trim($output[0]);
            }
        }

        return 'mac-default-unknown';
    }

    /**
     * Retrieve CPU processor identifier / serial number.
     */
    public static function getCpuId(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            @exec('wmic cpu get ProcessorId /value 2>nul', $output);
            foreach ($output as $line) {
                if (str_contains($line, 'ProcessorId=')) {
                    $id = trim(explode('=', $line)[1] ?? '');
                    if (!empty($id)) {
                        return $id;
                    }
                }
            }
            // Fallback for newer Windows where wmic might be deprecated: PowerShell
            @exec('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId" 2>nul', $psOutput);
            if (!empty($psOutput[0])) {
                return trim($psOutput[0]);
            }
        } else {
            @exec("grep -m1 'Serial' /proc/cpuinfo 2>/dev/null || grep -m1 'model name' /proc/cpuinfo 2>/dev/null", $output);
            if (!empty($output[0])) {
                return trim(explode(':', $output[0])[1] ?? '');
            }
        }

        return 'cpu-default-unknown';
    }

    /**
     * Retrieve Disk drive serial number / UUID.
     */
    public static function getDiskUuid(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            @exec('wmic diskdrive get SerialNumber /value 2>nul', $output);
            foreach ($output as $line) {
                if (str_contains($line, 'SerialNumber=')) {
                    $serial = trim(explode('=', $line)[1] ?? '');
                    if (!empty($serial)) {
                        return $serial;
                    }
                }
            }
            @exec('powershell -NoProfile -Command "(Get-CimInstance Win32_DiskDrive | Select-Object -First 1).SerialNumber" 2>nul', $psOutput);
            if (!empty($psOutput[0])) {
                return trim($psOutput[0]);
            }
        } else {
            @exec("blkid -s UUID -o value 2>/dev/null | head -1", $output);
            if (!empty($output[0])) {
                return trim($output[0]);
            }
        }

        return 'disk-default-unknown';
    }

    /**
     * Retrieve Motherboard serial number.
     */
    public static function getMotherboardUuid(): string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            @exec('wmic baseboard get SerialNumber /value 2>nul', $output);
            foreach ($output as $line) {
                if (str_contains($line, 'SerialNumber=')) {
                    $serial = trim(explode('=', $line)[1] ?? '');
                    if (!empty($serial) && !str_starts_with($serial, 'To be filled')) {
                        return $serial;
                    }
                }
            }
            @exec('powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber" 2>nul', $psOutput);
            if (!empty($psOutput[0])) {
                return trim($psOutput[0]);
            }
        } else {
            @exec("cat /sys/class/dmi/id/board_serial 2>/dev/null", $output);
            if (!empty($output[0])) {
                return trim($output[0]);
            }
        }

        return 'baseboard-default-unknown';
    }
}

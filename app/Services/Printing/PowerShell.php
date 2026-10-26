<?php

namespace App\Services\Printing;

use Symfony\Component\Process\Process;

/**
 * PowerShell's native launcher aborts with "Internal Windows PowerShell error…
 * 8009001d" before running a single cmdlet whenever SystemRoot is missing from
 * the environment, and a PHP worker spawned by a service or desktop shell can
 * inherit an incomplete one. The child is therefore given the Windows paths it
 * needs instead of trusting what was inherited.
 */
class PowerShell
{
    public static function run(array $arguments, int $timeout = 15): Process
    {
        $process = new Process([self::executable(), ...$arguments], null, self::environment());
        $process->setTimeout($timeout);
        $process->run();

        return $process;
    }

    public static function environment(): array
    {
        $root = self::systemRoot();
        $search = $root.'\\System32;'.$root.';'.$root.'\\System32\\WindowsPowerShell\\v1.0';
        $inherited = getenv('PATH');

        return [
            'SystemRoot' => $root,
            'windir' => $root,
            'COMSPEC' => $root.'\\System32\\cmd.exe',
            'PATH' => $inherited === false || $inherited === '' ? $search : $search.';'.$inherited,
        ];
    }

    public static function executable(): string
    {
        $candidate = self::systemRoot().'\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

        return is_executable($candidate) ? $candidate : 'powershell.exe';
    }

    private static function systemRoot(): string
    {
        foreach (['SystemRoot', 'SYSTEMROOT', 'windir', 'WINDIR'] as $key) {
            $value = trim((string) (getenv($key) ?: ($_SERVER[$key] ?? '')));
            if ($value !== '' && is_dir($value)) {
                return rtrim($value, '\\/');
            }
        }

        return 'C:\\Windows';
    }
}

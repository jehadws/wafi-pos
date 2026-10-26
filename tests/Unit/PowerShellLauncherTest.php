<?php

use App\Services\Printing\PowerShell;

/**
 * The real failure these guard against: PowerShell exits with "Internal Windows
 * PowerShell error… 8009001d" when the inherited environment has no SystemRoot,
 * which happens to a PHP worker spawned by a service or the desktop shell.
 */
function withStrippedWindowsRoot(callable $assertions): void
{
    $saved = [];
    foreach (['SystemRoot', 'SYSTEMROOT', 'windir', 'WINDIR'] as $key) {
        $saved[$key] = getenv($key);
        putenv($key.'=');
        unset($_SERVER[$key]);
    }

    try {
        $assertions();
    } finally {
        foreach ($saved as $key => $value) {
            putenv($value === false ? $key.'=' : $key.'='.$value);
            if ($value !== false) {
                $_SERVER[$key] = $value;
            }
        }
    }
}

it('still gives PowerShell a windows root when the inherited environment has none', function () {
    withStrippedWindowsRoot(function () {
        $environment = PowerShell::environment();

        expect($environment['SystemRoot'])->not->toBe('')
            ->and($environment['windir'])->toBe($environment['SystemRoot'])
            ->and($environment['COMSPEC'])->toBe($environment['SystemRoot'].'\\System32\\cmd.exe')
            ->and($environment['PATH'])->toContain('\\System32');
    });
});

it('launches powershell by absolute path when the windows root is resolvable', function () {
    $executable = PowerShell::executable();

    expect($executable)->toEndWith('powershell.exe')
        ->and(str_contains($executable, '\\'))->toBe(PHP_OS_FAMILY === 'Windows');
});

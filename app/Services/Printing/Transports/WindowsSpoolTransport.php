<?php

namespace App\Services\Printing\Transports;

use App\Services\Printing\PowerShell;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class WindowsSpoolTransport implements TransportInterface
{
    private const SCRIPT = <<<'POWERSHELL'
param(
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [Parameter(Mandatory=$true)][string]$DataPath,
    [Parameter(Mandatory=$true)][string]$DocName
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class SubulRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFOW
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr handle);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool StartDocPrinter(IntPtr handle, int level, [In] DOCINFOW info);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr handle);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr handle);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr handle);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr handle, IntPtr bytes, int count, out int written);

    public static int Send(string printerName, byte[] data, string documentName)
    {
        IntPtr printer = IntPtr.Zero;
        IntPtr unmanaged = IntPtr.Zero;
        try
        {
            if (!OpenPrinter(printerName.Normalize(), out printer, IntPtr.Zero))
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());

            var info = new DOCINFOW { pDocName = documentName, pDataType = "RAW" };
            if (!StartDocPrinter(printer, 1, info) || !StartPagePrinter(printer))
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());

            unmanaged = Marshal.AllocCoTaskMem(data.Length);
            Marshal.Copy(data, 0, unmanaged, data.Length);
            // PowerShell 5.1 compiles with the C# 5 provider: no inline `out int x` declarations.
            int written = 0;
            if (!WritePrinter(printer, unmanaged, data.Length, out written) || written != data.Length)
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());

            EndPagePrinter(printer);
            EndDocPrinter(printer);
            return written;
        }
        finally
        {
            if (unmanaged != IntPtr.Zero) Marshal.FreeCoTaskMem(unmanaged);
            if (printer != IntPtr.Zero) ClosePrinter(printer);
        }
    }
}
"@

# Without Stop, a failing Win32 call is a non-terminating error and PowerShell exits 0.
$ErrorActionPreference = 'Stop'

try {
    $bytes = [System.IO.File]::ReadAllBytes($DataPath)
    $written = [SubulRawPrinter]::Send($PrinterName, $bytes, $DocName)
    Write-Output $written
} catch {
    $message = $_.Exception.InnerException.Message
    if (-not $message) { $message = $_.Exception.Message }
    # Console stderr keeps the Win32 text alone; Write-Error would wrap it in script position noise.
    [Console]::Error.WriteLine($message)
    exit 1
}
POWERSHELL;

    public function send(string $printer, string $data, string $documentName): array
    {
        if (PHP_OS_FAMILY !== 'Windows') {
            throw new RuntimeException('Windows spool printing is only available on Windows.');
        }

        $scriptPath = storage_path('app/printing/raw-printer.ps1');
        File::ensureDirectoryExists(dirname($scriptPath));
        if (! File::exists($scriptPath) || File::get($scriptPath) !== self::SCRIPT) {
            File::put($scriptPath, self::SCRIPT);
        }

        // The job travels as a file: Windows runs the child through cmd.exe, whose
        // 8191-character command line cannot carry a raster receipt.
        $dataPath = storage_path('app/printing/job-'.Str::uuid().'.bin');
        File::put($dataPath, $data);

        try {
            $process = PowerShell::run([
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy', 'Bypass',
                '-File', $scriptPath,
                '-PrinterName', $printer,
                '-DataPath', $dataPath,
                '-DocName', $documentName,
            ], 15);
        } finally {
            File::delete($dataPath);
        }

        if (! $process->isSuccessful()) {
            $message = trim($process->getErrorOutput() ?: $process->getOutput());
            throw new RuntimeException($message ?: "Failed to print to {$printer}");
        }

        $written = (int) trim($process->getOutput());
        if ($written < 1) {
            throw new RuntimeException("The spooler accepted no bytes for \"{$printer}\": ".trim($process->getOutput() ?: $process->getErrorOutput()));
        }

        return [
            'success' => true,
            'printer' => $printer,
            'type' => 'windows',
            'bytesWritten' => $written,
        ];
    }
}

/**
 * Raw Printer Interface for Windows & Network (TCP / Virtual) Printers
 * Communicates with:
 * 1. Windows Print Spooler (winspool.drv) for physical USB/Driver printers (e.g. XP-80C)
 * 2. Direct TCP Sockets for virtual/network ESC/POS printers (e.g. 127.0.0.1:9100 or 192.168.1.100:9100)
 */

const { execFile, exec } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');
const os = require('os');

// PowerShell script with inline C# RawPrinterHelper using Unicode Win32 Spooler APIs (OpenPrinterW, DOCINFOW)
const RAW_PRINT_SCRIPT = `
param(
    [string]$PrinterName,
    [string]$Base64Data,
    [string]$DocName = "POS Print Job"
)

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFOW
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes, string docName)
    {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOW di = new DOCINFOW();
        bool bSuccess = false;

        di.pDocName = docName;
        di.pDataType = "RAW";

        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero))
        {
            if (StartDocPrinter(hPrinter, 1, di))
            {
                if (StartPagePrinter(hPrinter))
                {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);

                    int dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);

                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }

        if (!bSuccess)
        {
            int err = Marshal.GetLastWin32Error();
            throw new System.ComponentModel.Win32Exception(err);
        }
        return bSuccess;
    }
}
"@

try {
    $bytes = [System.Convert]::FromBase64String($Base64Data)
    [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes, $DocName)
    Write-Output "SUCCESS"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;

// Save script file in print-agent directory or temp
const scriptPath = path.join(__dirname, 'pos_raw_printer.ps1');
try {
    fs.writeFileSync(scriptPath, RAW_PRINT_SCRIPT, 'utf8');
} catch {
    const fallbackPath = path.join(os.tmpdir(), 'pos_raw_printer.ps1');
    fs.writeFileSync(fallbackPath, RAW_PRINT_SCRIPT, 'utf8');
}

class RawPrinter {
    /**
     * Parse if a printer string is a TCP / Network address (e.g. "127.0.0.1:9100", "tcp://192.168.1.50:9100")
     */
    static parseTcpAddress(target) {
        if (!target || typeof target !== 'string') return null;
        const clean = target.replace(/^tcp:\/\//i, '').trim();
        const match = clean.match(/^([\w\.-]+):(\d+)$/);
        if (match) {
            return {
                host: match[1],
                port: parseInt(match[2], 10)
            };
        }
        return null;
    }

    /**
     * Get list of all installed Windows printers
     */
    static getPrinters() {
        return new Promise((resolve, reject) => {
            // DataFile comes from the driver and is the only reliable hint at the printer's
            // command language: Seagull/TSC label drivers ship "tscED_*.ini".
            const script = `$d = @{}; Get-PrinterDriver | ForEach-Object { $d[$_.Name] = $_.DataFile }; Get-CimInstance Win32_Printer | Select-Object Name, PortName, DriverName, Default, PrinterStatus, WorkOffline, @{n='DataFile';e={$d[$_.DriverName]}} | ConvertTo-Json -Compress`;
            const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`;
            
            exec(cmd, { timeout: 8000, windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(`Failed to list printers: ${error.message}`));
                }

                try {
                    const trimmed = stdout.trim();
                    const parsed = trimmed ? JSON.parse(trimmed) : [];
                    const list = Array.isArray(parsed) ? parsed : [parsed];
                    
                    const formatted = list.map(p => ({
                        name: p.Name,
                        port: p.PortName,
                        driver: p.DriverName,
                        isDefault: Boolean(p.Default),
                        isOffline: Boolean(p.WorkOffline),
                        status: p.PrinterStatus,
                        labelProtocol: /^tsc/i.test(p.DataFile ? path.basename(String(p.DataFile)) : '') ? 'tspl' : 'escpos',
                        type: 'windows'
                    }));

                    resolve(formatted);
                } catch (parseError) {
                    reject(new Error(`Failed to parse printer list: ${parseError.message} (Raw: ${stdout})`));
                }
            });
        });
    }

    /**
     * Send raw bytes over direct TCP Socket (for virtual printers like 127.0.0.1:9100 or network POS printers)
     */
    static printTcpSocket(host, port, dataBuffer) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let isResolved = false;

            client.setTimeout(5000);

            client.connect(port, host, () => {
                client.write(dataBuffer, () => {
                    client.end();
                    if (!isResolved) {
                        isResolved = true;
                        resolve({ success: true, printer: `${host}:${port}`, type: 'tcp', bytesWritten: dataBuffer.length });
                    }
                });
            });

            client.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    client.destroy();
                    reject(new Error(`TCP Socket Error on ${host}:${port} - ${err.message}. Ensure your virtual printer is running.`));
                }
            });

            client.on('timeout', () => {
                if (!isResolved) {
                    isResolved = true;
                    client.destroy();
                    reject(new Error(`Connection to virtual/network printer ${host}:${port} timed out.`));
                }
            });
        });
    }

    /**
     * Send raw buffer (ESC/POS or TSPL) to a Windows printer by name or TCP address
     * @param {string} printerName - Exact Windows printer name (e.g. "XP-80C") OR TCP endpoint (e.g. "127.0.0.1:9100")
     * @param {Buffer} dataBuffer - Binary buffer containing ESC/POS or label commands
     * @param {string} docName - Optional document name in Windows Spooler
     */
    static printRaw(printerName, dataBuffer, docName = 'POS Print Job') {
        if (!printerName || typeof printerName !== 'string') {
            return Promise.reject(new Error('Printer name or TCP address must be specified.'));
        }

        if (!dataBuffer || !Buffer.isBuffer(dataBuffer) || dataBuffer.length === 0) {
            return Promise.reject(new Error('Print data buffer cannot be empty.'));
        }

        // 1. Check if it is a direct TCP Socket (e.g. 127.0.0.1:9100 or virtual printer)
        const tcp = this.parseTcpAddress(printerName);
        if (tcp) {
            return this.printTcpSocket(tcp.host, tcp.port, dataBuffer);
        }

        // 2. Windows Spooler RAW printing
        return new Promise((resolve, reject) => {
            const activeScript = fs.existsSync(scriptPath) ? scriptPath : path.join(os.tmpdir(), 'pos_raw_printer.ps1');
            if (!fs.existsSync(activeScript)) {
                fs.writeFileSync(activeScript, RAW_PRINT_SCRIPT, 'utf8');
            }

            const base64Data = dataBuffer.toString('base64');
            const args = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', activeScript,
                '-PrinterName', printerName,
                '-Base64Data', base64Data,
                '-DocName', docName
            ];

            execFile('powershell', args, { timeout: 10000, windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    const errMsg = (stderr || stdout || error.message).trim();
                    if (errMsg.includes('The printer name is invalid') || errMsg.includes('0x80004005') || errMsg.includes('Win32Exception')) {
                        return reject(new Error(`Printer "${printerName}" was not found in Windows. If it is a virtual/network printer, specify as "127.0.0.1:9100".`));
                    }
                    return reject(new Error(`Windows Print Spooler Error: ${errMsg}`));
                }

                if (stdout.includes('SUCCESS')) {
                    resolve({ success: true, printer: printerName, type: 'windows', bytesWritten: dataBuffer.length });
                } else {
                    reject(new Error(`Unexpected response from spooler: ${stdout.trim()}`));
                }
            });
        });
    }
}

module.exports = RawPrinter;

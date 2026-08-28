/**
 * Windows POS Local Print Agent
 * HTTP Server listening on 127.0.0.1:8189
 * Dispatches raw ESC/POS and TSPL print jobs directly to Windows Spooler.
 */

const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const RawPrinter = require('./raw-printer');
const { buildReceiptEscPos } = require('./escpos-builder');
const LabelBuilder = require('./label-builder');
const jobTracker = require('./job-tracker');

const PORT = process.env.POS_PRINT_AGENT_PORT || 8189;
const HOST = '127.0.0.1'; // Strictly local
const VERSION = '1.0.0';
const START_TIME = Date.now();

// Helper: send JSON response
function sendJson(res, statusCode, data) {
    const json = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-POS-Job-ID',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    res.end(json);
}

// Helper: parse JSON request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => {
            raw += chunk;
            if (raw.length > 5 * 1024 * 1024) { // 5MB limit
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (err) {
                reject(new Error(`Invalid JSON: ${err.message}`));
            }
        });
        req.on('error', reject);
    });
}

// Security: Check if request is from localhost
function isLocalRequest(req) {
    const ip = req.socket.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

const server = http.createServer(async (req, res) => {
    // 1. Security check
    if (!isLocalRequest(req)) {
        return sendJson(res, 403, { error: 'Forbidden: Print Agent only accepts local connections.' });
    }

    // 2. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-POS-Job-ID',
        });
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
    const pathname = parsedUrl.pathname;

    try {
        // GET /status or GET /health
        if (req.method === 'GET' && (pathname === '/status' || pathname === '/health' || pathname === '/')) {
            return sendJson(res, 200, {
                status: 'online',
                service: 'Wafi POS Windows Print Agent',
                version: VERSION,
                platform: process.platform,
                uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
                timestamp: new Date().toISOString(),
            });
        }

        // GET /printers
        if (req.method === 'GET' && pathname === '/printers') {
            const printers = await RawPrinter.getPrinters();
            return sendJson(res, 200, {
                success: true,
                count: printers.length,
                printers
            });
        }

        // POST /test
        if (req.method === 'POST' && pathname === '/test') {
            const body = await parseBody(req);
            const printerName = body.printer;
            const type = body.type || 'receipt'; // 'receipt' | 'label'

            if (!printerName) {
                return sendJson(res, 400, { error: 'Printer name is required in "printer" parameter.' });
            }

            let buffer;
            if (type === 'label') {
                buffer = LabelBuilder.buildLabel({
                    storeName: body.storeName || 'Wafi POS',
                    name: 'TEST PRODUCT 500ML',
                    price: '$9.99',
                    barcode: '123456789012',
                    sku: 'TEST-001',
                    unit: 'pcs'
                }, {
                    lineWidth: body.lineWidth || 36,
                    protocol: body.protocol || 'escpos'
                });
            } else {
                buffer = buildReceiptEscPos({
                    storeName: body.storeName || 'Wafi POS',
                    storeAddress: '123 Test Street, Suite 100',
                    storePhone: '+1 234 567 8900',
                    orderCode: 'TEST-ORDER-001',
                    date: new Date().toLocaleString(),
                    cashier: 'System Test',
                    orderType: 'takeaway',
                    items: [
                        { name: 'Thermal Direct Test Item', quantity: 1, price: '5.00', total: '5.00' },
                        { name: 'Direct ESC/POS 203 DPI', quantity: 2, price: '2.50', total: '5.00' }
                    ],
                    subtotal: '10.00',
                    total: '10.00',
                    tendered: '20.00',
                    change: '10.00',
                    barcode: 'TEST123456',
                    footer: 'Test print completed successfully!'
                }, {
                    lineWidth: body.lineWidth || 42,
                    cutPaper: body.cutPaper !== false,
                    openCashDrawer: body.openCashDrawer === true,
                });
            }

            const result = await RawPrinter.printRaw(printerName, buffer, 'POS Test Print');
            return sendJson(res, 200, {
                success: true,
                message: `Test ${type} successfully sent to printer "${printerName}".`,
                result
            });
        }

        // POST /print/receipt
        if (req.method === 'POST' && pathname === '/print/receipt') {
            const body = await parseBody(req);
            const printerName = body.printer;
            const receiptData = body.data || body;
            const config = body.config || {};
            const jobId = body.jobId || req.headers['x-pos-job-id'] || crypto.randomUUID();

            if (!printerName) {
                return sendJson(res, 400, { error: 'Printer name is required in "printer" parameter.' });
            }

            if (!receiptData || (!receiptData.items && !receiptData.total)) {
                return sendJson(res, 400, { error: 'Receipt data must contain items or total.' });
            }

            // Check duplicate
            if (body.jobId && jobTracker.isDuplicate(jobId)) {
                return sendJson(res, 409, {
                    error: 'Duplicate print job rejected.',
                    jobId,
                    message: 'This receipt was already sent for printing in the last few minutes.'
                });
            }

            jobTracker.register(jobId, { printer: printerName, orderCode: receiptData.orderCode });

            const buffer = buildReceiptEscPos(receiptData, {
                lineWidth: config.lineWidth || 42,
                cutPaper: config.cutPaper !== false,
                openCashDrawer: config.openCashDrawer === true,
                showTaxBreakdown: config.showTaxBreakdown === true,
            });

            const copies = Math.max(1, Math.min(5, config.copies || 1));
            const results = [];

            for (let i = 0; i < copies; i++) {
                const docName = `Receipt ${receiptData.orderCode || 'Sale'} [Copy ${i + 1}/${copies}]`;
                const r = await RawPrinter.printRaw(printerName, buffer, docName);
                results.push(r);
            }

            jobTracker.complete(jobId, { copies, results });

            return sendJson(res, 200, {
                success: true,
                jobId,
                printer: printerName,
                copies,
                message: `Receipt printed successfully on "${printerName}".`,
                bytesWritten: buffer.length * copies
            });
        }

        // POST /print/label
        if (req.method === 'POST' && pathname === '/print/label') {
            const body = await parseBody(req);
            const printerName = body.printer;
            const labels = Array.isArray(body.labels) ? body.labels : (body.data ? (Array.isArray(body.data) ? body.data : [body.data]) : [body]);
            const config = body.config || {};
            const jobId = body.jobId || crypto.randomUUID();

            if (!printerName) {
                return sendJson(res, 400, { error: 'Printer name is required in "printer" parameter.' });
            }

            if (labels.length === 0) {
                return sendJson(res, 400, { error: 'No label items provided for printing.' });
            }

            jobTracker.register(jobId, { printer: printerName, labelCount: labels.length });

            const printResults = [];
            for (let i = 0; i < labels.length; i++) {
                const item = labels[i];
                const itemCopies = item.copies || config.copies || 1;

                const buffer = LabelBuilder.buildLabel(item, {
                    widthMm: config.widthMm || 50,
                    heightMm: config.heightMm || 30,
                    lineWidth: config.lineWidth || 36,
                    protocol: config.protocol || 'escpos',
                    barcodeHeight: config.barcodeHeight || 45,
                    showStoreName: config.showStoreName !== false,
                    showBarcodeText: config.showBarcodeText !== false,
                    showPrice: config.showPrice !== false,
                    showSku: config.showSku === true,
                    copies: 1
                });

                for (let c = 0; c < itemCopies; c++) {
                    const docName = `Label ${item.name || item.barcode || 'Product'} [${i + 1}/${labels.length}]`;
                    const r = await RawPrinter.printRaw(printerName, buffer, docName);
                    printResults.push(r);
                }
            }

            jobTracker.complete(jobId, { totalLabelsPrinted: printResults.length });

            return sendJson(res, 200, {
                success: true,
                jobId,
                printer: printerName,
                totalLabelsPrinted: printResults.length,
                message: `Successfully printed ${printResults.length} label(s) on "${printerName}".`
            });
        }

        // 404
        return sendJson(res, 404, { error: `Endpoint not found: ${req.method} ${pathname}` });

    } catch (err) {
        console.error('Print Agent Error:', err);
        return sendJson(res, 500, {
            success: false,
            error: err.message || 'Internal Print Agent Error',
            details: String(err)
        });
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('====================================================');
        console.error(`  [NOTICE] POS Print Agent is ALREADY RUNNING!`);
        console.error(`  Port ${PORT} is already in use by a background instance.`);
        console.error(`  The Print Agent is healthy and ready to receive jobs.`);
        console.error(`  To restart it, run "stop.bat" first, then "start.bat".`);
        console.error('====================================================');
        process.exit(0);
    } else {
        console.error('Server Fatal Error:', err);
        process.exit(1);
    }
});

server.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(`  Wafi POS Direct Thermal Print Agent (Windows)`);
    console.log(`  Version: ${VERSION}`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log('====================================================');
    console.log('Available Endpoints:');
    console.log('  GET  /status          - Health check');
    console.log('  GET  /printers        - List Windows printers');
    console.log('  POST /test            - Send test print');
    console.log('  POST /print/receipt   - Print ESC/POS receipt');
    console.log('  POST /print/label     - Print product barcode label');
    console.log('====================================================');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nStopping POS Print Agent...');
    server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});

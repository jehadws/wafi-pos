#!/usr/bin/env node
// Sends a sample ESC/POS job (with Arabic UTF-8 text) to the emulator for testing.
// Usage: node test-send.js [port]

const net = require('net');
const port = parseInt(process.argv[2] || '9100', 10);

function bytes(...parts) {
  return Buffer.concat(parts.map(p =>
    Buffer.isBuffer(p) ? p : typeof p === 'string' ? Buffer.from(p, 'utf8') : Buffer.from(p)
  ));
}

const ESC = 0x1b, GS = 0x1d, LF = 0x0a;

const job = bytes(
  Buffer.from([ESC, 0x40]),                 // init
  Buffer.from([ESC, 0x61, 0x01]),           // center
  Buffer.from([GS, 0x21, 0x11]),            // double width/height
  Buffer.from([ESC, 0x45, 0x01]),           // bold on
  'وافي POS',
  Buffer.from([LF]),
  Buffer.from([GS, 0x21, 0x00]),            // normal size
  Buffer.from([ESC, 0x45, 0x00]),           // bold off
  'almotheda@gmail.com',
  Buffer.from([LF]),
  Buffer.from([ESC, 0x61, 0x00]),           // left align
  '------------------------------',
  Buffer.from([LF]),
  'Order:                260829-004',
  Buffer.from([LF]),
  'Customer:                  محمد سالم',
  Buffer.from([LF]),
  '------------------------------',
  Buffer.from([LF]),
  'قهوة عربية   1 x 18.00',
  Buffer.from([LF]),
  Buffer.from([ESC, 0x61, 0x01]),           // center
  'شكراً لتعاملكم معنا!',
  Buffer.from([LF]),
  Buffer.from([GS, 0x56, 0x00])             // cut
);

const socket = net.createConnection(port, '127.0.0.1', () => {
  socket.write(job);
  socket.end();
  console.log(`Sent ${job.length} bytes to 127.0.0.1:${port}`);
});
socket.on('error', (err) => console.error('Connection failed:', err.message));
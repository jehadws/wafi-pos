#!/usr/bin/env node
/**
 * Simple ESC/POS printer emulator
 * -------------------------------
 * Listens on a raw TCP port (like a real network thermal printer / JetDirect port),
 * accepts a print job as a stream of ESC/POS bytes, parses the commands, decodes
 * text (supporting UTF-8, CP864 Arabic DOS, CP1256, and CP437), and renders the receipt
 * as an HTML page you can watch live in your browser.
 *
 * Usage:
 *   node emulator.js [printerPort] [webPort]
 *   node emulator.js 9100 9101
 *
 * Then point your POS software at 127.0.0.1:9100 (raw/JetDirect printer),
 * and open http://127.0.0.1:9101 in your browser to see the receipt.
 */

const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const PRINTER_PORT = parseInt(process.argv[2] || '9100', 10);
const WEB_PORT = parseInt(process.argv[3] || '9101', 10);

const JOBS_DIR = path.join(__dirname, 'jobs');
if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR);

// ---------- CP864 Arabic Mapping ----------
const CP864_MAP = {};
try {
  const { CP864_BYTE_MAP } = require('./arabic-helper');
  for (const [unicode, byte] of Object.entries(CP864_BYTE_MAP)) {
    const u = parseInt(unicode, 10);
    // Prioritize standard forms over special hamzated forms
    if (u >= 0xFE89 && u <= 0xFE8C && CP864_MAP[byte]) continue;
    CP864_MAP[byte] = String.fromCharCode(u);
  }
} catch {
  // Fallback
}
// Clean Yeh overrides
CP864_MAP[0xF7] = String.fromCharCode(0xFEF1); // Yeh isolated
CP864_MAP[0xFE] = String.fromCharCode(0xFEF2); // Yeh final
CP864_MAP[0xFD] = String.fromCharCode(0xFEF3); // Yeh initial/medial

function decodeTextRun(buf, codepage = 0) {
  // 1) Try strict UTF-8 first
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return { text: decoder.decode(buf), mode: 'utf-8' };
  } catch (e) {
    // not valid UTF-8, fall through
  }

  // 2) If codepage is #40 (CP864 - Arabic DOS) or contains CP864 Arabic bytes
  let out = '';
  let hasArabicBytes = false;
  for (const b of buf) {
    if (b >= 0x20 && b <= 0x7e) {
      out += String.fromCharCode(b);
    } else if (CP864_MAP[b]) {
      out += CP864_MAP[b];
      hasArabicBytes = true;
    } else if (b === 0x0d) {
      // ignore CR
    } else {
      out += String.fromCharCode(b);
    }
  }

  if (hasArabicBytes || codepage === 40 || codepage === 22 || codepage === 28) {
    return { text: out, mode: 'cp864 (Arabic DOS)' };
  }

  // 3) If codepage is #36 (CP1256 - Windows Arabic)
  if (codepage === 36) {
    try {
      return { text: iconv.decode(buf, 'cp1256'), mode: 'cp1256 (Windows Arabic)' };
    } catch {
      // fallback
    }
  }

  // 4) Default Latin-1 / CP437 fallback
  try {
    return { text: iconv.decode(buf, 'cp437'), mode: 'cp437' };
  } catch {
    return { text: buf.toString('latin1'), mode: 'latin1' };
  }
}

// ---------- ESC/POS command parser ----------
function parseJob(buf) {
  const commands = [];
  const outputLines = [];
  let i = 0;

  let state = {
    align: 'left',
    bold: false,
    underline: false,
    sizeW: 1,
    sizeH: 1,
    codepage: 0,
  };

  let textBuf = [];

  function flushText() {
    if (textBuf.length === 0) return;
    const buf2 = Buffer.from(textBuf);
    const { text, mode } = decodeTextRun(buf2, state.codepage);
    outputLines.push({
      type: 'text',
      text,
      align: state.align,
      bold: state.bold,
      underline: state.underline,
      sizeW: state.sizeW,
      sizeH: state.sizeH,
      decodeMode: mode,
    });
    textBuf = [];
  }

  function addCmd(offset, bytes, name, details) {
    commands.push({
      offset: offset.toString(16).padStart(4, '0'),
      bytes: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
      name,
      details,
    });
  }

  while (i < buf.length) {
    const b = buf[i];
    const start = i;

    if (b === 0x1b) { // ESC
      const b1 = buf[i + 1];
      if (b1 === 0x40) { // ESC @  init
        flushText();
        state = { align: 'left', bold: false, underline: false, sizeW: 1, sizeH: 1, codepage: 0 };
        addCmd(start, buf.slice(i, i + 2), 'Initialize printer', 'ESC @');
        i += 2;
      } else if (b1 === 0x61) { // ESC a n  align
        flushText();
        const n = buf[i + 2];
        state.align = n === 1 ? 'center' : n === 2 ? 'right' : 'left';
        addCmd(start, buf.slice(i, i + 3), 'Select alignment', state.align);
        i += 3;
      } else if (b1 === 0x45) { // ESC E n  bold
        flushText();
        const n = buf[i + 2];
        state.bold = n !== 0;
        addCmd(start, buf.slice(i, i + 3), 'Emphasis', state.bold ? 'On' : 'Off');
        i += 3;
      } else if (b1 === 0x2d) { // ESC - n  underline
        flushText();
        const n = buf[i + 2];
        state.underline = n !== 0;
        addCmd(start, buf.slice(i, i + 3), 'Underline', state.underline ? 'On' : 'Off');
        i += 3;
      } else if (b1 === 0x74) { // ESC t n  select codepage
        flushText();
        const n = buf[i + 2];
        state.codepage = n;
        const codeName = n === 40 ? 'CP864 (Arabic DOS)' : n === 36 ? 'CP1256 (Windows Arabic)' : n === 0 ? 'CP437 (Standard USA)' : `Table #${n}`;
        addCmd(start, buf.slice(i, i + 3), 'Select character code table', codeName);
        i += 3;
      } else if (b1 === 0x70) { // ESC p m t1 t2  cash drawer pulse
        flushText();
        addCmd(start, buf.slice(i, i + 5), 'Generate drawer pulse', 'Cash drawer kick');
        i += 5;
      } else if (b1 === 0x21) { // ESC ! n  print mode
        flushText();
        const n = buf[i + 2];
        state.bold = !!(n & 0x08);
        addCmd(start, buf.slice(i, i + 3), 'Select print mode', `mode byte 0x${n.toString(16)}`);
        i += 3;
      } else if (b1 === 0x32) { // ESC 2 default line spacing
        flushText();
        addCmd(start, buf.slice(i, i + 2), 'Default line spacing', '1/6 inch (ESC 2)');
        i += 2;
      } else if (b1 === 0x33) { // ESC 3 n  line spacing
        flushText();
        const n = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Set line spacing', `${n} dots (informational, not rendered)`);
        i += 3;
      } else {
        // Unknown ESC sequence
        flushText();
        addCmd(start, buf.slice(i, i + 2), 'Unsupported ESC command', `Byte offset ${i}`);
        i += 2;
      }
    } else if (b === 0x1d) { // GS
      const b1 = buf[i + 1];
      if (b1 === 0x21) { // GS ! n  character size
        flushText();
        const n = buf[i + 2];
        state.sizeW = ((n >> 4) & 0x0f) + 1;
        state.sizeH = (n & 0x0f) + 1;
        addCmd(start, buf.slice(i, i + 3), 'Set character size', `${state.sizeW}x width, ${state.sizeH}x height`);
        i += 3;
      } else if (b1 === 0x42) { // GS B n  invert printing
        flushText();
        const n = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Invert print mode', n ? 'Inverted' : 'Normal');
        i += 3;
      } else if (b1 === 0x56) { // GS V  cut
        flushText();
        const m = buf[i + 2];
        let len = 3;
        if (m === 0x41 || m === 0x42 || m === 65 || m === 66) len = 4; // feed + cut variant
        addCmd(start, buf.slice(i, i + len), 'Cut paper', m % 2 === 0 ? 'Full cut' : 'Partial cut');
        i += len;
        outputLines.push({ type: 'cut' });
      } else if (b1 === 0x68) { // GS h n  barcode height
        flushText();
        const h = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Set barcode height', `${h} dots`);
        i += 3;
      } else if (b1 === 0x77) { // GS w n  barcode width
        flushText();
        const w = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Set barcode width', `module width ${w}`);
        i += 3;
      } else if (b1 === 0x48) { // GS H n  HRI text position
        flushText();
        const n = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Set HRI text position', `pos ${n}`);
        i += 3;
      } else if (b1 === 0x66) { // GS f n  HRI font
        flushText();
        const n = buf[i + 2];
        addCmd(start, buf.slice(i, i + 3), 'Set HRI font', `font ${n}`);
        i += 3;
      } else if (b1 === 0x6b) { // GS k  barcode
        flushText();
        const m = buf[i + 2];
        if (m >= 65 && m <= 73) {
          // GS k m len data
          const len = buf[i + 3];
          const data = buf.slice(i + 4, i + 4 + len).toString('ascii');
          addCmd(start, buf.slice(i, i + 4 + len), 'Print barcode', `type ${m} (Code 128), data "${data}"`);
          outputLines.push({ type: 'barcode', data });
          i += 4 + len;
        } else {
          // GS k m d1...dn NUL
          let j = i + 3;
          while (j < buf.length && buf[j] !== 0x00) j++;
          const data = buf.slice(i + 3, j).toString('latin1');
          addCmd(start, buf.slice(i, Math.min(j + 1, buf.length)), 'Print barcode', `type ${m}, data "${data}"`);
          outputLines.push({ type: 'barcode', data });
          i = j + 1;
        }
      } else if (b1 === 0x28 && buf[i + 2] === 0x6B) { // GS ( k  QR Code
        flushText();
        const pL = buf[i + 3];
        const pH = buf[i + 4];
        const len = pL + pH * 256;
        const fn = buf[i + 5];
        addCmd(start, buf.slice(i, i + 5 + len), '2D Barcode (QR Code)', `function ${fn}`);
        i += 5 + len;
      } else if (b1 === 0x76) { // GS v 0  raster bit image
        flushText();
        const xL = buf[i + 4], xH = buf[i + 5], yL = buf[i + 6], yH = buf[i + 7];
        const widthBytes = xL + xH * 256;
        const height = yL + yH * 256;
        const dataLen = widthBytes * height;
        addCmd(start, buf.slice(i, i + 8), 'Print raster image', `${widthBytes * 8}x${height}px`);
        outputLines.push({ type: 'image', w: widthBytes * 8, h: height });
        i += 8 + dataLen;
      } else {
        flushText();
        addCmd(start, buf.slice(i, i + 2), 'Unsupported GS command', `Byte offset ${i}`);
        i += 2;
      }
    } else if (b === 0x0a) { // LF
      flushText();
      addCmd(start, buf.slice(i, i + 1), 'Line feed', 'Advance one line');
      outputLines.push({ type: 'feed' });
      i += 1;
    } else if (b === 0x0d) { // CR — ignore
      i += 1;
    } else {
      textBuf.push(b);
      i += 1;
    }
  }
  flushText();

  return { commands, outputLines };
}

// ---------- Job storage / latest state ----------
let latestJob = null;
let jobCounter = 0;

function saveAndRenderJob(rawBuf) {
  jobCounter++;
  const { commands, outputLines } = parseJob(rawBuf);
  const job = {
    id: jobCounter,
    time: new Date().toISOString(),
    sizeBytes: rawBuf.length,
    commands,
    outputLines,
  };
  latestJob = job;
  fs.writeFileSync(path.join(JOBS_DIR, `job-${jobCounter}.json`), JSON.stringify(job, null, 2));
  console.log(`\n[job #${jobCounter}] ${rawBuf.length} bytes, ${commands.length} commands parsed`);
  const unsupported = commands.filter(c => c.name.startsWith('Unsupported'));
  if (unsupported.length) {
    console.log(`  ${unsupported.length} unsupported command(s):`);
    unsupported.forEach(c => console.log(`   offset 0x${c.offset}  bytes ${c.bytes}`));
  }
}

// ---------- TCP printer listener ----------
const printerServer = net.createServer((socket) => {
  const chunks = [];
  console.log(`[printer] connection from ${socket.remoteAddress}:${socket.remotePort}`);
  socket.on('data', (chunk) => chunks.push(chunk));
  socket.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (buf.length > 0) saveAndRenderJob(buf);
  });
  socket.on('error', (err) => console.log('[printer] socket error:', err.message));
});

printerServer.listen(PRINTER_PORT, '0.0.0.0', () => {
  console.log(`ESC/POS emulator listening on 0.0.0.0:${PRINTER_PORT}`);
  console.log(`Point your POS software's printer at 127.0.0.1:${PRINTER_PORT} (raw/JetDirect/TCP printer)`);
});

// ---------- Web viewer ----------
function renderHtml(job) {
  if (!job) {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#555">
      <h2>ESC/POS Emulator — waiting for a print job…</h2>
      <p>Send a job to 127.0.0.1:${PRINTER_PORT} and this page will refresh automatically.</p>
      </body></html>`;
  }

  let receiptHtml = '';
  for (const line of job.outputLines) {
    if (line.type === 'text') {
      const style = [
        `text-align:${line.align}`,
        line.bold ? 'font-weight:bold' : '',
        line.underline ? 'text-decoration:underline' : '',
        `font-size:${12 * line.sizeH}px`,
      ].filter(Boolean).join(';');
      receiptHtml += `<div style="direction:ltr;unicode-bidi:bidi-override;${style}">${escapeHtml(line.text)}</div>`;
    } else if (line.type === 'feed') {
      receiptHtml += `<div style="height:6px"></div>`;
    } else if (line.type === 'cut') {
      receiptHtml += `<div style="border-top:2px dashed #999;margin:10px 0;text-align:center;color:#999;font-size:11px">✂ cut</div>`;
    } else if (line.type === 'barcode') {
      receiptHtml += `<div style="text-align:center;margin:10px 0">
        <div style="font-family:monospace;letter-spacing:2px">||‖|‖||‖|‖|||‖|‖||</div>
        <div style="font-size:11px">${escapeHtml(line.data)}</div></div>`;
    } else if (line.type === 'image') {
      receiptHtml += `<div style="text-align:center;margin:10px 0;padding:10px;background:#eee;color:#999;font-size:11px">
        [image ${line.w}×${line.h}px — not rendered]</div>`;
    }
  }

  const commandRows = job.commands.map(c => `
    <tr style="${c.name.startsWith('Unsupported') ? 'background:#3a1f1f' : ''}">
      <td>0x${c.offset}</td><td>${c.bytes}</td><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.details)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="2">
<title>ESC/POS Emulator</title>
<style>
  body{font-family:sans-serif;background:#1b1e24;color:#ddd;margin:0;display:flex;height:100vh}
  .col{padding:20px;overflow-y:auto}
  .preview-col{flex:0 0 380px;display:flex;justify-content:center;background:#111}
  #receipt{width:320px;background:#fdfaf2;color:#111;padding:16px;font-family:'Courier New', 'Segoe UI', Tahoma, monospace;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.4);line-height:1.4;white-space:pre-wrap;direction:ltr;unicode-bidi:bidi-override}
  .cmd-col{flex:1}
  table{width:100%;border-collapse:collapse;font-size:12px}
  td,th{padding:5px 8px;border-bottom:1px solid #333;text-align:left}
  th{color:#888;text-transform:uppercase;font-size:10px}
  h2{font-size:14px;color:#aaa;font-weight:normal}
</style>
</head>
<body>
  <div class="col preview-col"><div id="receipt">${receiptHtml || '<i>empty job</i>'}</div></div>
  <div class="col cmd-col">
    <h2>Job #${job.id} · ${job.sizeBytes} bytes · ${job.commands.length} commands · ${job.time}</h2>
    <table>
      <tr><th>Offset</th><th>Bytes</th><th>Command</th><th>Details</th></tr>
      ${commandRows}
    </table>
  </div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const webServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderHtml(latestJob));
});

webServer.listen(WEB_PORT, '127.0.0.1', () => {
  console.log(`Web viewer:      http://127.0.0.1:${WEB_PORT}`);
});
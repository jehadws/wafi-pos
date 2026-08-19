# JGREM POS Windows Direct Thermal Print Agent

A lightweight, dedicated Windows background Print Agent designed for point-of-sale systems. It provides direct, fast thermal printing via native ESC/POS and TSPL command generation without relying on the web browser's `window.print()` dialog.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│               React POS Frontend (Web/SPA)              │
│  - Prepares structured receipt & barcode label JSON     │
│  - Provides live thermal receipt preview               │
│  - Interacts with PrintAgentService                     │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTP POST / GET (JSON)
                             │ http://127.0.0.1:8189
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Windows POS Print Agent (Node.js Daemon)        │
│  - Binds strictly to 127.0.0.1 (Localhost security)     │
│  - Discovers installed Windows printers via Win32 API   │
│  - Formats native binary ESC/POS & TSPL byte streams    │
│  - Manages print jobs and prevents duplicate printing   │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Raw Spooler Write (winspool.drv)
                             ▼
┌─────────────────────────────────────────────────────────┐
│      Windows Print Spooler (RAW Data Type)             │
│      Printer: XP-80C (USB001) / Direct Thermal          │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Direct USB / Serial / LAN
                             ▼
┌─────────────────────────────────────────────────────────┐
│     Thermal Printer (203 DPI, 76mm / 80mm ESC/POS)      │
│  - Instant printing without dialogs                     │
│  - Clean column alignment & word wrapping               │
│  - Code 128 barcodes & QR codes                         │
│  - Cash drawer kick & auto paper cut                    │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Target Hardware & Specifications

| Parameter | Value |
| :--- | :--- |
| **Printer Model** | XP-80C (or any ESC/POS direct thermal printer) |
| **Resolution** | 203 DPI (8 dots/mm) |
| **Print Method** | Direct Thermal |
| **Maximum Paper Width** | 76 mm / 80 mm |
| **Printable Width** | 72 mm (576 dots per line) |
| **Characters Per Line (Safe Default)** | **42 characters** (Font A: 12×24 dots) |
| **Alternative Line Widths** | 46 characters (Standard), 32 characters (58mm) |
| **Supported Barcode Types** | Code 128 (Subset B), QR Code Model 2 |
| **Label Sizes Supported** | 50×30 mm, 60×40 mm, 76×50 mm |

---

## 🚀 Quick Start & Installation on Windows

### 1. Manual / Interactive Start
Open the `print-agent` directory in File Explorer and double-click:
```bat
start.bat
```
This opens a console window and starts the agent at `http://127.0.0.1:8189`.

---

### 2. Install to Run Automatically in the Background with Windows
To run the Print Agent silently in the background on Windows startup (no console window visible):
1. Double-click:
   ```bat
   install-startup.bat
   ```
2. The installer will create a shortcut in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` pointing to `start-hidden.vbs`.
3. The agent starts immediately and will auto-start every time Windows boots.

---

### 3. Stop the Background Agent
To stop the agent if needed:
```bat
stop.bat
```

---

### 4. Remove from Windows Startup
```bat
uninstall-startup.bat
```

---

## 📡 REST API Reference

The agent listens on `http://127.0.0.1:8189` and only accepts connections originating from `127.0.0.1` / `localhost`.

### 1. Health & Status Check
**`GET /status`** or **`GET /health`**

#### Response:
```json
{
  "status": "online",
  "service": "JGREM POS Windows Print Agent",
  "version": "1.0.0",
  "platform": "win32",
  "uptimeSeconds": 142,
  "timestamp": "2026-08-19T00:25:01.838Z"
}
```

---

### 2. Discover Installed Windows Printers
**`GET /printers`**

#### Response:
```json
{
  "success": true,
  "count": 3,
  "printers": [
    {
      "name": "XP-80C",
      "port": "USB001",
      "driver": "XP-80C",
      "isDefault": true,
      "isOffline": false,
      "status": 3
    },
    {
      "name": "Microsoft Print to PDF",
      "port": "PORTPROMPT:",
      "driver": "Microsoft Print To PDF",
      "isDefault": false,
      "isOffline": false,
      "status": 3
    }
  ]
}
```

---

### 3. Print ESC/POS Receipt
**`POST /print/receipt`**

#### Request Payload:
```json
{
  "printer": "XP-80C",
  "jobId": "rcpt_ORD-1002_1771460000",
  "data": {
    "storeName": "JGREM POS",
    "storeAddress": "King Fahd Road, Suite 400",
    "storePhone": "+966 50 123 4567",
    "orderCode": "ORD-2026-0042",
    "date": "8/19/2026, 3:15 PM",
    "cashier": "Ahmed",
    "customer": "Khalid Al-Mansoor",
    "orderType": "Takeaway",
    "items": [
      {
        "name": "Espresso Double Shot",
        "quantity": 2,
        "price": "$3.50",
        "total": "$7.00"
      },
      {
        "name": "Croissant French Butter Extra Large",
        "quantity": 1,
        "price": "$4.50",
        "total": "$4.50"
      }
    ],
    "subtotal": "$11.50",
    "discount": "$1.00",
    "tax": "$1.58",
    "taxes": [
      { "name": "VAT", "rate": 15, "tax_value": 1.58 }
    ],
    "total": "$12.08",
    "tendered": "$20.00",
    "change": "$7.92",
    "barcode": "ORD-2026-0042",
    "footer": "Thank you for visiting us!"
  },
  "config": {
    "lineWidth": 42,
    "cutPaper": true,
    "openCashDrawer": false,
    "showTaxBreakdown": true,
    "copies": 1
  }
}
```

#### Response:
```json
{
  "success": true,
  "jobId": "rcpt_ORD-1002_1771460000",
  "printer": "XP-80C",
  "copies": 1,
  "message": "Receipt printed successfully on \"XP-80C\".",
  "bytesWritten": 482
}
```

---

### 4. Print Product Barcode Labels
**`POST /print/label`**

#### Request Payload:
```json
{
  "printer": "XP-80C",
  "labels": [
    {
      "name": "Organic Arabica Coffee Beans 250g",
      "price": "$14.50",
      "barcode": "628100123456",
      "sku": "COF-ARA-250",
      "unit": "Bag",
      "copies": 2,
      "storeName": "JGREM POS"
    }
  ],
  "config": {
    "widthMm": 50,
    "heightMm": 30,
    "lineWidth": 36,
    "protocol": "escpos",
    "barcodeHeight": 45,
    "showStoreName": true,
    "showPrice": true,
    "showSku": true
  }
}
```

#### Response:
```json
{
  "success": true,
  "jobId": "lbl_1771460000",
  "printer": "XP-80C",
  "totalLabelsPrinted": 2,
  "message": "Successfully printed 2 label(s) on \"XP-80C\"."
}
```

---

### 5. Send Test Print
**`POST /test`**

#### Request:
```json
{
  "printer": "XP-80C",
  "type": "receipt",
  "lineWidth": 42,
  "cutPaper": true
}
```

#### Response:
```json
{
  "success": true,
  "message": "Test receipt successfully sent to printer \"XP-80C\".",
  "result": {
    "success": true,
    "printer": "XP-80C",
    "bytesWritten": 348
  }
}
```

---

## 🔒 Security & Reliability Features

1. **Localhost Isolation**: The agent rejects any requests whose remote address is not `127.0.0.1` or `::1`.
2. **Double-Print Prevention (Idempotency)**: Print jobs are cached by `jobId` for 10 minutes in memory. Rapid double clicks by cashiers will safely reject duplicate jobs with HTTP 409.
3. **No Heavy Dependencies**: Built using pure Node.js standard libraries (`http`, `crypto`, `child_process`) and Windows `winspool.drv` via PowerShell. Zero `node-gyp` C++ compilation required.
4. **Smart Word Wrapping**: Table item descriptions automatically wrap to the next line without shifting or misaligning the Quantity and Total price columns.

import { formatCurrency, formatDate } from './format';

/**
 * NexoPOS-style thermal receipt template.
 * Used by order-card.tsx via react-to-print.
 */
export const InvoiceTemplate = (order: TOrder, orderProducts: TOrderProducts[]) => {
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${order.code}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      @page {
        size: 80mm auto;
        margin: 0;
      }

      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #000;
        background: #fff;
        width: 80mm;
        padding: 8mm 4mm;
      }

      .receipt {
        width: 100%;
      }

      /* ── Store Header ── */
      .store-header {
        text-align: center;
        margin-bottom: 6px;
      }

      .store-logo {
        max-width: 140px;
        max-height: 60px;
        display: block;
        margin: 0 auto 4px;
      }

      .store-name {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      /* ── Dividers ── */
      .divider {
        border: none;
        border-top: 1px dashed #000;
        margin: 6px 0;
      }

      .divider-solid {
        border: none;
        border-top: 1px solid #000;
        margin: 6px 0;
      }

      .divider-double {
        border: none;
        border-top: 3px double #000;
        margin: 6px 0;
      }

      /* ── Info rows ── */
      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        margin: 1px 0;
      }

      .info-label {
        font-weight: bold;
      }

      /* ── Products Table ── */
      .items-table {
        width: 100%;
        border-collapse: collapse;
      }

      .items-table thead tr {
        font-weight: bold;
        font-size: 11px;
        text-transform: uppercase;
      }

      .items-table thead td {
        padding: 3px 0;
        border-bottom: 1px dashed #000;
      }

      .items-table tbody tr {
        border-bottom: 1px dotted #ccc;
      }

      .items-table tbody td {
        padding: 4px 0;
        vertical-align: top;
        font-size: 11px;
      }

      .col-product {
        width: 55%;
      }

      .col-qty {
        width: 20%;
        text-align: center;
      }

      .col-total {
        width: 25%;
        text-align: right;
        font-weight: bold;
      }

      .item-name {
        font-weight: bold;
        word-break: break-word;
      }

      .item-unit-price {
        font-size: 10px;
        color: #333;
      }

      /* ── Summary ── */
      .summary {
        margin: 6px 0;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        padding: 1px 0;
      }

      .summary-row.total {
        font-size: 15px;
        font-weight: bold;
        margin-top: 4px;
        padding-top: 4px;
      }

      .summary-row.discount {
        color: #555;
      }

      /* ── Payment ── */
      .payment-section {
        margin: 6px 0;
      }

      .payment-title {
        font-weight: bold;
        font-size: 11px;
        text-transform: uppercase;
        margin-bottom: 2px;
      }

      /* ── Footer ── */
      .receipt-footer {
        text-align: center;
        font-size: 11px;
        margin-top: 8px;
        line-height: 1.6;
      }

      .receipt-footer .thank-you {
        font-weight: bold;
        font-size: 13px;
        margin-bottom: 2px;
      }
    </style>
  </head>
  <body>
    <div class="receipt">

      <!-- Store Header -->
      <div class="store-header">
        <div class="store-name">JGREM POS</div>
      </div>

      <hr class="divider">

      <!-- Order Info -->
      <div class="info-row">
        <span class="info-label">Order:</span>
        <span>${order.code}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span>${formatDate(order.created_at)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type:</span>
        <span>${order.type ? order.type.toUpperCase() : 'SALE'}</span>
      </div>
      ${order.customer_first_name ? `
      <div class="info-row">
        <span class="info-label">Customer:</span>
        <span>${order.customer_first_name} ${order.customer_last_name || ''}</span>
      </div>` : ''}
      ${order.user_username ? `
      <div class="info-row">
        <span class="info-label">Cashier:</span>
        <span>${order.user_username}</span>
      </div>` : ''}

      <hr class="divider">

      <!-- Products Table -->
      <table class="items-table">
        <thead>
          <tr>
            <td class="col-product">Product</td>
            <td class="col-qty">Qty</td>
            <td class="col-total">Total</td>
          </tr>
        </thead>
        <tbody>
          ${orderProducts.map((item) => `
          <tr>
            <td class="col-product">
              <div class="item-name">${item.name}</div>
              <div class="item-unit-price">${formatCurrency(item.price_with_tax)} / ${item.unit_name || 'unit'}</div>
            </td>
            <td class="col-qty">${item.quantity}</td>
            <td class="col-total">${formatCurrency(item.total_price_with_tax)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <hr class="divider">

      <!-- Summary -->
      <div class="summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${order.discount > 0 ? `
        <div class="summary-row discount">
          <span>Discount</span>
          <span>-${formatCurrency(order.discount)}</span>
        </div>` : ''}
        ${order.tax_value > 0 ? `
        <div class="summary-row">
          <span>Tax</span>
          <span>${formatCurrency(order.tax_value)}</span>
        </div>` : ''}
      </div>

      <hr class="divider-double">

      <div class="summary-row total">
        <span>TOTAL</span>
        <span>${formatCurrency(order.total)}</span>
      </div>

      <hr class="divider">

      <!-- Payment -->
      <div class="payment-section">
        <div class="payment-title">Payment</div>
        <div class="summary-row">
          <span>Tendered</span>
          <span>${formatCurrency(order.tendered)}</span>
        </div>
        <div class="summary-row">
          <span>Change</span>
          <span>${formatCurrency(order.change)}</span>
        </div>
      </div>

      <hr class="divider">

      <!-- Footer -->
      <div class="receipt-footer">
        <div class="thank-you">Thank you!</div>
        <div>Please come again</div>
        <div style="margin-top:6px; font-size:10px;">Powered by JGREM POS</div>
      </div>

    </div>
  </body>
</html>`;
};

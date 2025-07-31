import { formatCurrency, formatDate } from "./format"

export const InvoiceTemplate = (order: TOrder, orderProducts: TOrderProducts[]) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${order.code}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            background: #fff;
            padding: 20px;
          }

          .invoice-container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }

          .header {
            padding: 20px;
            text-align: center;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .subtitle {
            font-size: 14px;
            opacity: 0.9;
          }

          .info-section {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
          }

          .info-item {
            text-align: center;
            flex: 1;
            min-width: 120px;
          }

          .info-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 3px;
          }

          .info-value {
            font-weight: bold;
            color: #333;
          }

          .content {
            padding: 20px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .items-table th {
            background: #f1f5f9;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #e2e8f0;
          }

          .items-table th:last-child {
            text-align: right;
          }

          .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }

          .item-name {
            font-weight: 600;
            margin-bottom: 3px;
          }

          .item-details {
            font-size: 11px;
            color: #666;
          }

          .item-total {
            text-align: right;
            font-weight: 600;
          }

          .summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }

          .summary-row.total {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 16px;
          }

          .footer {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #e2e8f0;
          }

          .footer-line {
            margin: 2px 0;
          }

          @media print {
            body {
              padding: 0;
            }

            .invoice-container {
              border: none;
              border-radius: 0;
            }

            @page {
              margin: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="company-name">Jgrem POS</div>
            <div class="subtitle">Point of Sale System</div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-item">
              <div class="info-label">Date & Time</div>
              <div class="info-value">${formatDate(order.created_at)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Order Code</div>
              <div class="info-value">${order.code}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Order ID</div>
              <div class="info-value">#${order.id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Type</div>
              <div class="info-value">${order.type.toUpperCase()}</div>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderProducts
      .map(
        (item) => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      <div class="item-details">Qty: ${item.quantity} ${item.unit_name} | Unit: ${formatCurrency(item.price_with_tax)}</div>
                    </td>
                    <td class="item-total">${formatCurrency(item.total_price_with_tax)}</td>
                  </tr>
                `,
      )
      .join("")}
              </tbody>
            </table>

            <!-- Summary -->
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCurrency(order.subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>Tax</span>
                <span>${formatCurrency(order.tax_value)}</span>
              </div>
              <div class="summary-row">
                <span>Discount</span>
                <span>-${formatCurrency(order.discount)}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>${formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-line">Thank you!</div>
            <div class="footer-line">Customer: ${order.customer_first_name} ${order.customer_last_name}</div>
            <div class="footer-line">Served by: ${order.user_username}</div>
          </div>
        </div>
      </body>
    </html>`
}

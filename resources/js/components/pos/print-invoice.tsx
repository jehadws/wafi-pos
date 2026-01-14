'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { Printer } from 'lucide-react';

export interface InvoiceItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Invoice {
    id: string;
    date: string;
    orderReceipt: string;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    total: number;
    cash: number;
    paid: number;
    change: number;
}

interface SimplePrintInvoiceProps {
    invoice: Invoice;
}

export function SimplePrintInvoice({ invoice }: SimplePrintInvoiceProps) {
    const { t } = useTranslation();
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const formatCurrency = (amount: number) => `USD ${amount.toFixed(2)}`;
        const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

        const printDocument = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t('Invoice')} - ${invoice.orderReceipt}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
              padding: 40px;
            }

            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 10px;
              overflow: hidden;
            }

            .invoice-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }

            .company-name {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .invoice-subtitle {
              font-size: 18px;
              opacity: 0.9;
            }

            .invoice-info {
              display: flex;
              justify-content: space-between;
              padding: 25px 30px;
              background: #f8f9fa;
              border-bottom: 2px solid #e9ecef;
            }

            .info-section {
              text-align: center;
            }

            .info-label {
              font-size: 12px;
              color: #6c757d;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }

            .info-value {
              font-size: 16px;
              font-weight: bold;
              color: #495057;
            }

            .invoice-body {
              padding: 30px;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }

            .table-header {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
            }

            .table-header th {
              padding: 15px;
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 14px;
            }

            .table-header th:last-child {
              text-align: right;
            }

            .items-table tbody tr {
              border-bottom: 1px solid #e9ecef;
              transition: background-color 0.2s;
            }

            .items-table tbody tr:hover {
              background-color: #f8f9fa;
            }

            .items-table tbody tr:last-child {
              border-bottom: none;
            }

            .items-table td {
              padding: 15px;
              vertical-align: top;
            }

            .item-name {
              font-weight: 600;
              color: #495057;
              margin-bottom: 5px;
            }

            .item-details {
              font-size: 12px;
              color: #6c757d;
            }

            .item-total {
              text-align: right;
              font-weight: 600;
              color: #495057;
            }

            .summary-section {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 25px;
              margin-top: 20px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #dee2e6;
            }

            .summary-row:last-child {
              border-bottom: none;
              margin-top: 10px;
              padding-top: 15px;
              border-top: 2px solid #495057;
            }

            .summary-label {
              font-weight: 600;
              color: #495057;
            }

            .summary-value {
              font-weight: 600;
              color: #495057;
            }

            .total-row .summary-label,
            .total-row .summary-value {
              font-size: 18px;
              color: #28a745;
            }

            .payment-section {
              margin-top: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
              color: white;
            }

            .payment-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              text-align: center;
            }

            .payment-details {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
            }

            .payment-item {
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 6px;
            }

            .payment-label {
              font-size: 12px;
              opacity: 0.8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .payment-amount {
              font-size: 16px;
              font-weight: bold;
            }

            .invoice-footer {
              text-align: center;
              padding: 20px;
              background: #f8f9fa;
              color: #6c757d;
              font-size: 12px;
              border-top: 1px solid #e9ecef;
            }

            .footer-line {
              margin: 5px 0;
            }

            @media print {
              body {
                padding: 0;
              }

              .invoice-container {
                border: none;
                border-radius: 0;
                box-shadow: none;
              }

              @page {
                margin: 0.5in;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-name">NexoPOS</div>
              <div class="invoice-subtitle">${t('Point of Sale System')}</div>
            </div>

            <div class="invoice-info">
              <div class="info-section">
                <div class="info-label">${t('Date')} & ${t('Time')}</div>
                <div class="info-value">${formatDate(invoice.date)}</div>
              </div>
              <div class="info-section">
                <div class="info-label">${t('Order receipt')}</div>
                <div class="info-value">${invoice.orderReceipt}</div>
              </div>
              <div class="info-section">
                <div class="info-label">${t('Invoice')}</div>
                <div class="info-value">#${invoice.id}</div>
              </div>
            </div>

            <div class="invoice-body">
              <table class="items-table">
                <thead class="table-header">
                  <tr>
                    <th>${t('Product')}</th>
                    <th style="text-align: right;">${t('Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items
                      .map(
                          (item) => `
                    <tr>
                      <td>
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">${t('Quantity')}: ${item.quantity} | ${t('Unit Price')}: ${formatCurrency(item.price)}</div>
                      </td>
                      <td class="item-total">${formatCurrency(item.total)}</td>
                    </tr>
                  `,
                      )
                      .join('')}
                </tbody>
              </table>

              <div class="summary-section">
                <div class="summary-row">
                  <span class="summary-label">${t('Sub Total')}</span>
                  <span class="summary-value">${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">${t('Discount')}</span>
                  <span class="summary-value">-${formatCurrency(invoice.discount)}</span>
                </div>
                <div class="summary-row total-row">
                  <span class="summary-label">${t('Total')}</span>
                  <span class="summary-value">${formatCurrency(invoice.total)}</span>
                </div>
              </div>

              <div class="payment-section">
                <div class="payment-title">${t('Payment')}</div>
                <div class="payment-details">
                  <div class="payment-item">
                    <div class="payment-label">${t('Cash')}</div>
                    <div class="payment-amount">${formatCurrency(invoice.cash)}</div>
                  </div>
                  <div class="payment-item">
                    <div class="payment-label">${t('Paid')}</div>
                    <div class="payment-amount">${formatCurrency(invoice.paid)}</div>
                  </div>
                  <div class="payment-item">
                    <div class="payment-label">${t('Change')}</div>
                    <div class="payment-amount">${formatCurrency(invoice.change)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              <div class="footer-line">${t('Thank you for your business!')}</div>
              <div class="footer-line">${t('Generated by NexoPOS System')}</div>
              <div class="footer-line">127.0.0.1:9971/dashboard/pos</div>
            </div>
          </div>
        </body>
      </html>
    `;

        printWindow.document.write(printDocument);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    };

    return (
        <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {t('Print Invoice')}
        </Button>
    );
}

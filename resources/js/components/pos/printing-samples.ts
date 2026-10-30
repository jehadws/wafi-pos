import { LabelPayload } from '@/lib/label-layout';
import Settings from '@/lib/settings';
import { FormattedReceiptData } from '@/services/printing-service';

/**
 * A representative sale for the printer settings previews, so terminal options
 * (paper width, code page, tax lines) can be judged without printing to paper.
 */

const storeName = () => Settings.get()?.identification?.sb_store_name || 'Subul POS';

export function sampleReceipt(): FormattedReceiptData {
  return {
    storeName: storeName(),
    storeAddress: 'Al Olaya District',
    storeCity: 'Riyadh',
    storePhone: '011 000 0000',
    orderCode: 'SUL-000148',
    date: '24/10/2026 14:32',
    cashier: 'Jehad',
    customer: 'عميل نقدي',
    items: [
      { name: 'تمر مجدول 500 جم', quantity: 2, price: '18.75', total: '37.50' },
      { name: 'Arabic Dates - Medjool', quantity: 1, price: '21.00', total: '21.00' },
      { name: 'قهوة عربية', quantity: 3, price: '9.50', total: '28.50' },
    ],
    subtotal: '87.00',
    discount: '5.00',
    tax: '12.30',
    taxes: [{ name: 'VAT', rate: 15, tax_value: 12.3 }],
    total: '94.30',
    tendered: '100.00',
    change: '5.70',
    paymentMethod: 'Cash',
    barcode: 'SUL-000148',
    footer: 'Thank you for your business!',
  };
}

export function sampleLabel(): LabelPayload {
  return {
    storeName: storeName(),
    name: 'تمر مجدول 500 جم',
    price: '21.00',
    barcode: '6281000123456',
    sku: 'DM-500',
  };
}

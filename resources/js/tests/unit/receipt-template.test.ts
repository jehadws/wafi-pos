import { describe, expect, it } from 'vitest';
import { generateReceiptHtml } from '@/services/receipt-template';

describe('receipt-template service', () => {
    it('generates a complete HTML receipt string with order and products details', () => {
        const order = {
            code: 'ORD-9876',
            created_at: '2026-08-21T01:30:00Z',
            type: 'sale',
            customer_first_name: 'Jane',
            customer_last_name: 'Smith',
            user_username: 'cashier_bob',
            subtotal: 50,
            discount: 5,
            tax_value: 6.75,
            total: 51.75,
            tendered: 60,
            change: 8.25,
        };

        const products = [
            {
                name: 'Caramel Macchiato',
                price_with_tax: 25.875,
                unit_name: 'cup',
                quantity: 2,
                total_price_with_tax: 51.75,
            },
        ];

        const html = generateReceiptHtml(order, products);

        expect(html).toContain('Receipt - ORD-9876');
        expect(html).toContain('ORD-9876');
        expect(html).toContain('Jane Smith');
        expect(html).toContain('cashier_bob');
        expect(html).toContain('Caramel Macchiato');
        expect(html).toContain('Powered by Subul POS');
    });
});

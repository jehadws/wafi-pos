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

    it('renders with-tax item prices by default', () => {
        const order = {
            code: 'ORD-2',
            created_at: '2026-08-21T01:30:00Z',
            subtotal: 20,
            discount: 0,
            tax_value: 3,
            total: 26,
            tendered: 30,
            change: 4,
        };

        const products = [
            {
                name: 'Espresso',
                price_with_tax: 11.5,
                price_without_tax: 10,
                unit_name: 'cup',
                quantity: 2,
                total_price_with_tax: 23,
                total_price_without_tax: 20,
            },
        ];

        const html = generateReceiptHtml(order as any, products as any);

        // Historical behavior: item lines show the with-tax amounts
        expect(html).toContain('11.50');
        expect(html).toContain('23.00');
    });

    it('renders without-tax item prices when priceWithTax is false', () => {
        const order = {
            code: 'ORD-2',
            created_at: '2026-08-21T01:30:00Z',
            subtotal: 20,
            discount: 0,
            tax_value: 3,
            total: 26,
            tendered: 30,
            change: 4,
        };

        const products = [
            {
                name: 'Espresso',
                price_with_tax: 11.5,
                price_without_tax: 10,
                unit_name: 'cup',
                quantity: 2,
                total_price_with_tax: 23,
                total_price_without_tax: 20,
            },
        ];

        const html = generateReceiptHtml(order as any, products as any, false);

        // Item lines mirror the without-tax cart display
        expect(html).toContain('10.00');
        expect(html).toContain('20.00');
        expect(html).not.toContain('11.50');
        expect(html).not.toContain('23.00');
    });
});

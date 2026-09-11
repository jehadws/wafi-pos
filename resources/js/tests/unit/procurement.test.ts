import { buildProcurementPayload, calculateLineItemPrices, ProcurementGeneralData, ProcurementProductItem } from '@/services/procurement';
import { describe, expect, it } from 'vitest';

describe('procurement service', () => {
  describe('calculateLineItemPrices', () => {
    it('calculates total when purchase price changes', () => {
      const item: ProcurementProductItem = {
        product_id: 1,
        name: 'Test Product',
        purchase_price: 10,
        total_purchase_price: 20,
        quantity: 2,
        unit_id: 1,
      };

      const updated = calculateLineItemPrices(item, 'purchase_price', 15);
      expect(updated.purchase_price).toBe(15);
      expect(updated.total_purchase_price).toBe(30);
      expect(updated.gross_purchase_price).toBe(15);
      expect(updated.net_purchase_price).toBe(15);
    });

    it('calculates total when quantity changes', () => {
      const item: ProcurementProductItem = {
        product_id: 1,
        name: 'Test Product',
        purchase_price: 25,
        total_purchase_price: 25,
        quantity: 1,
        unit_id: 1,
      };

      const updated = calculateLineItemPrices(item, 'quantity', 4);
      expect(updated.quantity).toBe(4);
      expect(updated.total_purchase_price).toBe(100);
    });

    it('applies exclusive tax to gross/net/total/tax_value', () => {
      const item: ProcurementProductItem = {
        product_id: 1,
        name: 'Taxed Product',
        purchase_price: 100,
        total_purchase_price: 0,
        quantity: 2,
        unit_id: 1,
        tax_rate: 10,
        tax_type: 'exclusive',
      };

      const updated = calculateLineItemPrices(item, 'quantity', 2);
      expect(updated.net_purchase_price).toBe(100);
      expect(updated.gross_purchase_price).toBe(110);
      expect(updated.total_purchase_price).toBe(200);
      expect(updated.total_price).toBe(220);
      expect(updated.tax_value).toBeCloseTo(20, 5);
    });

    it('splits inclusive tax out of the purchase price', () => {
      const item: ProcurementProductItem = {
        product_id: 1,
        name: 'Inclusive Product',
        purchase_price: 110,
        total_purchase_price: 0,
        quantity: 1,
        unit_id: 1,
        tax_rate: 10,
        tax_type: 'inclusive',
      };

      const updated = calculateLineItemPrices(item, 'quantity', 1);
      expect(updated.net_purchase_price).toBe(100);
      expect(updated.gross_purchase_price).toBe(110);
      expect(updated.tax_value).toBeCloseTo(10, 5);
    });

    it('keeps tax fields at zero when no tax rate is set', () => {
      const item: ProcurementProductItem = {
        product_id: 1,
        name: 'No Tax',
        purchase_price: 50,
        total_purchase_price: 0,
        quantity: 3,
        unit_id: 1,
      };

      const updated = calculateLineItemPrices(item, 'purchase_price', 50);
      expect(updated.tax_value).toBe(0);
      expect(updated.gross_purchase_price).toBe(50);
      expect(updated.net_purchase_price).toBe(50);
      expect(updated.total_purchase_price).toBe(150);
    });
  });

  describe('buildProcurementPayload', () => {
    it('constructs correct API payload structure and formats dates', () => {
      const general: ProcurementGeneralData = {
        invoice_reference: 'INV-2026-001',
        delivery_time: '2026-08-25',
        invoice_date: '2026-08-20',
        automatic_approval: 1,
        delivery_status: 'delivered',
        payment_status: 'paid',
        provider_id: 5,
      };

      const products: ProcurementProductItem[] = [
        {
          product_id: 10,
          name: 'Product A',
          purchase_price: 50,
          purchase_price_edit: 50,
          gross_purchase_price: 50,
          net_purchase_price: 50,
          total_purchase_price: 100,
          total_price: 100,
          quantity: 2,
          unit_id: 1,
          tax_value: 0,
          tax_type: 'exclusive',
        },
      ];

      const payload = buildProcurementPayload('PO-AUG-01', general, products);

      expect(payload.name).toBe('PO-AUG-01');
      expect(payload.general.invoice_reference).toBe('INV-2026-001');
      expect(payload.general.delivery_time).toBe('2026-08-25');
      expect(payload.general.invoice_date).toBe('2026-08-20');
      expect(payload.general.provider_id).toBe(5);
      expect(payload.products).toHaveLength(1);
      expect(payload.products[0].product_id).toBe(10);
      expect(payload.products[0].quantity).toBe('2');
      expect(payload.products[0].total_purchase_price).toBe(100);
    });
  });
});

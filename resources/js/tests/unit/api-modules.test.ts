import { categoriesApi } from '@/api/categories';
import { customersApi } from '@/api/customers';
import * as http from '@/api/http';
import { ordersApi } from '@/api/orders';
import { productsApi } from '@/api/products';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('API Resource Modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ordersApi', () => {
    it('get fetches order by ID', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ id: 10, total: 100 } as any);
      const result = await ordersApi.get(10);
      expect(spy).toHaveBeenCalledWith('/orders/10', undefined);
      expect(result.id).toBe(10);
    });

    it('submit performs POST for new order (without ID)', async () => {
      const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ status: 'success' } as any);
      await ordersApi.submit({ total: 150, products: [] });
      expect(spy).toHaveBeenCalledWith('/orders', { total: 150, products: [] });
    });

    it('submit performs PUT for existing order (with ID)', async () => {
      const spy = vi.spyOn(http, 'put').mockResolvedValueOnce({ status: 'success' } as any);
      await ordersApi.submit({ id: 55, total: 150, products: [] });
      expect(spy).toHaveBeenCalledWith('/orders/55', { id: 55, total: 150, products: [] });
    });

    it('refund sends POST to /orders/:id/refund', async () => {
      const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ success: true } as any);
      await ordersApi.refund(10, { amount: 50 });
      expect(spy).toHaveBeenCalledWith('/orders/10/refund', { amount: 50 });
    });

    it('void sends POST to /orders/:id/void', async () => {
      const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ success: true } as any);
      await ordersApi.void(10, { reason: 'Customer cancelled' });
      expect(spy).toHaveBeenCalledWith('/orders/10/void', { reason: 'Customer cancelled' });
    });
  });

  describe('productsApi', () => {
    it('search posts query to /products/search', async () => {
      const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ products: [] } as any);
      await productsApi.search('Latte');
      expect(spy).toHaveBeenCalledWith('/products/search', { search: 'Latte', pos: true });
    });

    it('searchByBarcode fetches from /products/search/using-barcode/:barcode', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ product: { id: 1 } } as any);
      await productsApi.searchByBarcode('628100123');
      expect(spy).toHaveBeenCalledWith('/products/search/using-barcode/628100123');
    });

    it('getUnitQuantities fetches /products/:id/units/quantities', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce([] as any);
      await productsApi.getUnitQuantities(7);
      expect(spy).toHaveBeenCalledWith('/products/7/units/quantities');
    });
  });

  describe('customersApi', () => {
    it('search posts query to /customers/search', async () => {
      const spy = vi.spyOn(http, 'post').mockResolvedValueOnce([] as any);
      await customersApi.search('Ali');
      expect(spy).toHaveBeenCalledWith('/customers/search', { search: 'Ali' });
    });

    it('getGroup fetches /customers/:id/group', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ id: 2, name: 'Wholesale' } as any);
      const res = await customersApi.getGroup(15);
      expect(spy).toHaveBeenCalledWith('/customers/15/group');
      expect(res.name).toBe('Wholesale');
    });
  });

  describe('categoriesApi', () => {
    it('getAll fetches /categories', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce([] as any);
      await categoriesApi.getAll();
      expect(spy).toHaveBeenCalledWith('/categories');
    });

    it('getPosContent fetches /categories/pos/:parentId', async () => {
      const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ categories: [], products: [] } as any);
      await categoriesApi.getPosContent(3);
      expect(spy).toHaveBeenCalledWith('/categories/pos/3');
    });
  });
});

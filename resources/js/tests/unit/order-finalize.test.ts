import { buildReceiptOrder, submitAndFinalizeOrder } from '@/services/order-finalize';
import printingService from '@/services/printing-service';
import { Order } from '@/types/models/order';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/i18n', () => ({
  i18n: {
    translate: (key: string, params?: Record<string, any>) =>
      params ? key.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : key,
  },
}));

vi.mock('@/services/printing-service', () => ({
  default: {
    getSettings: vi.fn(() => ({ openCashDrawer: true })),
    loadSettings: vi.fn(() => Promise.resolve({ openCashDrawer: true })),
    openCashDrawer: vi.fn(() => Promise.resolve()),
    printOrderReceipt: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 1,
    code: 'LOCAL-001',
    total: 100,
    tendered: 100,
    payment_status: 'paid',
    payments: [{ identifier: 'cash-payment', value: 100 }],
    customer: { id: 10 },
    addresses: { billing: null, shipping: null },
    ...overrides,
  }) as unknown as Order;

const cashPayment = [{ identifier: 'cash-payment', value: 100 }] as any;
const bankPayment = [{ identifier: 'bank-payment', value: 100 }] as any;

const baseParams = (overrides: Record<string, any> = {}) => ({
  order: makeOrder(),
  orderData: makeOrder({ payment_status: 'paid' }),
  products: [{ id: 1, name: 'Burger Deluxe' }] as any,
  submitOrder: vi.fn(() => Promise.resolve({ data: { order: { id: 99, code: 'SRV-099' } } })),
  printOrderReceipt: vi.fn(() => Promise.resolve({ success: true })),
  resetCart: vi.fn(),
  onSuccess: vi.fn(),
  ...overrides,
});

describe('services/order-finalize.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (printingService.getSettings as any).mockReturnValue({ openCashDrawer: true });
    (printingService.loadSettings as any).mockResolvedValue({ openCashDrawer: true });
    (printingService.printOrderReceipt as any).mockImplementation(() => Promise.resolve({ success: true }));
  });

  describe('buildReceiptOrder', () => {
    it('enriches cart state with the server-assigned identity', () => {
      const order = makeOrder();
      const orderData = makeOrder({ payment_status: 'paid' });
      const products = [{ id: 1, name: 'Burger Deluxe' }] as any;
      const createdOrder = { data: { order: { id: 101, code: 'SRV-101' } } };

      const receipt = buildReceiptOrder(order, orderData, products, createdOrder);

      expect(receipt.id).toBe(101);
      expect(receipt.code).toBe('SRV-101');
      expect(receipt.payment_status).toBe('paid');
      expect(receipt.products).toEqual(products);
    });

    it('falls back to local identity when the server omits it', () => {
      const order = makeOrder();

      const receipt = buildReceiptOrder(order, order, [], undefined);

      expect(receipt.id).toBe(1);
      expect(receipt.code).toBe('LOCAL-001');
    });

    it('computes change only when tendered exceeds the paid amount', () => {
      const overpaid = makeOrder({ total: 100, tendered: 120, payments: cashPayment });
      expect(buildReceiptOrder(overpaid, overpaid, [], undefined).change).toBe(20);

      const exact = makeOrder({ total: 100, tendered: 100, payments: cashPayment });
      expect(buildReceiptOrder(exact, exact, [], undefined).change).toBe(0);
    });
  });

  describe('submitAndFinalizeOrder', () => {
    it('submits, prints for paid orders, resets the cart and closes', async () => {
      const p = baseParams();

      await submitAndFinalizeOrder(p);

      expect(p.submitOrder).toHaveBeenCalledWith(p.orderData);
      expect(p.printOrderReceipt).toHaveBeenCalledTimes(1);
      expect(printingService.openCashDrawer).not.toHaveBeenCalled();
      expect(p.resetCart).toHaveBeenCalledTimes(1);
      expect(p.onSuccess).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('The operation was successful.');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('does not print unpaid orders but still kicks the drawer for cash', async () => {
      const p = baseParams({
        orderData: makeOrder({ payment_status: 'unpaid' }),
      });

      await submitAndFinalizeOrder(p);

      expect(p.printOrderReceipt).not.toHaveBeenCalled();
      expect(printingService.openCashDrawer).toHaveBeenCalledTimes(1);
      expect(p.resetCart).toHaveBeenCalledTimes(1);
    });

    it('does not kick the drawer when no cash payment is present', async () => {
      const p = baseParams({
        order: makeOrder({ payments: bankPayment }),
        orderData: makeOrder({ payment_status: 'unpaid', payments: bankPayment }),
      });

      await submitAndFinalizeOrder(p);

      expect(printingService.openCashDrawer).not.toHaveBeenCalled();
      expect(p.resetCart).toHaveBeenCalledTimes(1);
    });

    it('kicks the drawer when printing is disabled by policy', async () => {
      const p = baseParams({
        printOrderReceipt: vi.fn(() => Promise.resolve(false)),
      });

      await submitAndFinalizeOrder(p);

      expect(printingService.openCashDrawer).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
      expect(p.resetCart).toHaveBeenCalledTimes(1);
      expect(p.onSuccess).toHaveBeenCalledTimes(1);
    });

    it('finalizes the sale when the stored printer settings cannot be read', async () => {
      (printingService.loadSettings as any).mockRejectedValueOnce(new Error('Network down'));
      const p = baseParams({
        printOrderReceipt: vi.fn(() => Promise.resolve(false)),
      });

      await submitAndFinalizeOrder(p);

      expect(p.resetCart).toHaveBeenCalledTimes(1);
      expect(p.onSuccess).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('surfaces a retry toast when printing fails and still finalizes', async () => {
      const p = baseParams({
        printOrderReceipt: vi.fn(() => Promise.resolve({ success: false, error: 'boom' })),
      });

      await submitAndFinalizeOrder(p);

      expect(toast.error).toHaveBeenCalledWith(
        'Order #SRV-099 saved, but receipt failed to print: boom',
        expect.objectContaining({
          action: expect.objectContaining({ onClick: expect.any(Function) }),
        }),
      );
      expect(printingService.openCashDrawer).toHaveBeenCalledTimes(1);
      expect(p.resetCart).toHaveBeenCalledTimes(1);
      expect(p.onSuccess).toHaveBeenCalledTimes(1);
    });

    it('uses the fallback printer message when the failure carries no error', async () => {
      const p = baseParams({
        printOrderReceipt: vi.fn(() => Promise.resolve({ success: false })),
      });

      await submitAndFinalizeOrder(p);

      expect(toast.error).toHaveBeenCalledWith('Order #SRV-099 saved, but receipt failed to print: Printer unavailable', expect.anything());
    });

    it('retry action reprints the receipt and reports success', async () => {
      (printingService.printOrderReceipt as any).mockResolvedValue({ success: true });
      const p = baseParams({
        printOrderReceipt: vi.fn(() => Promise.resolve({ success: false, error: 'boom' })),
      });

      await submitAndFinalizeOrder(p);

      const errorCall = (toast.error as any).mock.calls.find((c: any[]) => typeof c[0] === 'string' && c[0].includes('SRV-099'));
      expect(errorCall).toBeDefined();

      await errorCall[1].action.onClick();

      expect(printingService.printOrderReceipt).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Receipt printed successfully.');
    });

    it('aborts finalization when submission fails', async () => {
      const p = baseParams({
        submitOrder: vi.fn(() => Promise.reject(new Error('Network down'))),
      });

      await submitAndFinalizeOrder(p);

      expect(toast.error).toHaveBeenCalledWith('Network down');
      expect(p.printOrderReceipt).not.toHaveBeenCalled();
      expect(p.resetCart).not.toHaveBeenCalled();
      expect(p.onSuccess).not.toHaveBeenCalled();
    });

    it('falls back to a generic message for non-Error rejections', async () => {
      const p = baseParams({
        submitOrder: vi.fn(() => Promise.reject('weird')),
      });

      await submitAndFinalizeOrder(p);

      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
      expect(p.resetCart).not.toHaveBeenCalled();
    });
  });
});

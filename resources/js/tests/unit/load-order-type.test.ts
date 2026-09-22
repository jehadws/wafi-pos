/**
 * tests/unit/load-order-type.test.ts
 *
 * Regression coverage for loadOrder's order-type resolution.
 *
 * Historical bugs:
 *   1. The API can return `type` as a plain string identifier ("takeaway") OR
 *      as a full object ({ identifier, label, icon }). The old code compared
 *      `type.identifier === fullOrder.type` — when the API returned an object,
 *      that was always false (object !== string) so the type was silently lost.
 *   2. When loadOrder runs before defineTypes (e.g. opening a held order right
 *      after page load), get().types is [] and the .find() returned undefined.
 *      The fix falls back to ORDER_TYPE_MAP so the type is always resolved.
 */
import { ordersApi } from '@/api';
import { usePOS } from '@/hooks/usePOS';
import { PosOrder } from '@/types/models/order';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    ordersApi: { ...actual.ordersApi, getForPos: vi.fn() },
    customersApi: {
      get: vi.fn().mockResolvedValue({ id: 1, first_name: 'Test', last_name: 'Customer', addresses: [] }),
      getGroup: vi.fn().mockResolvedValue({ id: 1 }),
    },
    usersApi: { getPermissions: vi.fn().mockResolvedValue([]) },
    taxesApi: { getGroup: vi.fn().mockResolvedValue({}) },
  };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

const makeApiOrder = (typeValue: any): PosOrder => ({
  id: 42,
  code: 'ORD-42',
  total: 100,
  subtotal: 100,
  discount: 0,
  tax_value: 0,
  tendered: 0,
  change: 0,
  payment_status: 'unpaid',
  type: typeValue,
  products: [],
  payments: [],
  coupons: [],
  instalments: [],
  customer: { id: 1, first_name: 'Test', last_name: 'Customer', addresses: [], billing: null, shipping: null },
  shipping_address: null,
  billing_address: null,
});

const takeawayType = { identifier: 'takeaway', label: 'Take Away', icon: '/images/groceries.png', selected: false };
const deliveryType = { identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png', selected: false };

describe('loadOrder — order type resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePOS.setState({ types: [takeawayType, deliveryType] } as any);
  });

  it('resolves the type when the API returns a plain string identifier', async () => {
    vi.mocked(ordersApi.getForPos).mockResolvedValueOnce(makeApiOrder('takeaway'));
    await usePOS.getState().loadOrder(42);
    const { type } = usePOS.getState().order as any;
    expect(type).toBeDefined();
    expect(type.identifier).toBe('takeaway');
    expect(type.label).toBe('Take Away');
  });

  it('resolves the type when the API returns a full object (not just a string)', async () => {
    vi.mocked(ordersApi.getForPos).mockResolvedValueOnce(makeApiOrder({ identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png' }));
    await usePOS.getState().loadOrder(42);
    const { type } = usePOS.getState().order as any;
    expect(type).toBeDefined();
    expect(type.identifier).toBe('delivery');
    expect(type.label).toBe('Delivery');
  });

  it('falls back to ORDER_TYPE_MAP when types[] is empty (defineTypes not yet called)', async () => {
    usePOS.setState({ types: [] } as any);
    vi.mocked(ordersApi.getForPos).mockResolvedValueOnce(makeApiOrder('takeaway'));
    await usePOS.getState().loadOrder(42);
    const { type } = usePOS.getState().order as any;
    expect(type).toBeDefined();
    expect(type.identifier).toBe('takeaway');
  });

  it('leaves type undefined when the API returns null', async () => {
    vi.mocked(ordersApi.getForPos).mockResolvedValueOnce(makeApiOrder(null));
    await usePOS.getState().loadOrder(42);
    const { type } = usePOS.getState().order as any;
    expect(type).toBeUndefined();
  });
});

/**
 * constants/order-types.ts
 *
 * Static identifier → display metadata for the order types the POS offers
 * (mirrors OrdersService::getTypeOptions() and order-type-dialog.tsx).
 *
 * Shared by the POS boot page (pages/dashboard/pos.tsx) and the store's
 * reset() so every new cart starts with the same deterministic default
 * order type (see services/pos-defaults.ts::pickDefaultOrderType).
 */

export const ORDER_TYPE_MAP: Record<string, Omit<OrderTypeObj, 'selected'>> = {
  takeaway: { identifier: 'takeaway', label: 'Take Away', icon: '/images/groceries.png' },
  delivery: { identifier: 'delivery', label: 'Delivery', icon: '/images/delivery.png' },
};

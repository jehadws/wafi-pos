/**
 * types/cart-engine.ts
 *
 * Public types for services/cart-engine.ts — the consolidated cart &
 * pricing pipeline.
 */

import { Coupon } from '@/types/models/coupon';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';

/**
 * POS options as read by the cart engine.
 *
 * These mirror the raw session option keys consumed across the pricing/tax
 * pipeline (do NOT invent new shapes here without updating the engine):
 *
 * - `ns_jgrem_price_with_tax`: 'yes' | 'no'
 *     Whether catalog unit prices are tax-inclusive.
 * - `ns_jgrem_vat`: 'products_vat' | 'flat_vat' | 'variable_vat'
 *     Where VAT is computed: per product line, flat at order level, or
 *     variable at order level.
 */
export interface POSOptions {
    ns_jgrem_price_with_tax?: 'yes' | 'no' | string;
    ns_jgrem_vat?: 'products_vat' | 'flat_vat' | 'variable_vat' | string;
    /** Preserves the historical open-ended options bag. */
    [key: string]: any;
}

/** Everything the engine needs to compute a full cart snapshot. */
export interface CartDraft {
    products: OrderProduct[];
    coupons: Coupon[];
    order: Order;
}

/** Result of CartEngine.computeCart — a fully recomputed cart snapshot. */
export interface ComputedCart {
    products: OrderProduct[];
    order: Order;
    /** Coupons whose product/category constraints are still satisfied. */
    validCoupons: Coupon[];
    /** Coupons that no longer match any cart line and should be removed. */
    invalidCoupons: Coupon[];
}
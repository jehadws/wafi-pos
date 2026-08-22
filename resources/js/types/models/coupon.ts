/**
 * types/models/coupon.ts
 *
 * Coupon entity as attached to a POS order (`Order.coupons[]`).
 * Extracted from the inline anonymous type that previously lived in
 * types/models/order.ts so the cart engine can reference it directly.
 */

/** A product constraint attached to a coupon. */
export interface CouponProduct {
    product_id?: number;
    coupon_id?: number;
    product?: {
        name?: string;
        id?: number;
    };
}

/** A category constraint attached to a coupon. */
export interface CouponCategory {
    category_id?: number;
    coupon_id?: number;
    category?: {
        name?: string;
        id?: number;
    };
}

export interface Coupon {
    code?: string;
    type?: 'percentage_discount' | 'flat_discount';
    name: string;
    customer_coupon_id?: number;
    limit_usage?: number;
    minimum_cart_value?: number;
    maximum_cart_value?: number;
    customer_id?: number;
    value?: number;
    created_at?: string;
    usage?: number;
    active?: number;
    author?: number;
    products?: CouponProduct[];
    categories?: CouponCategory[];
    discount_value?: number;
}
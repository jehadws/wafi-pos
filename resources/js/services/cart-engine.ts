/**
 * services/cart-engine.ts
 *
 * Deterministic cart computation engine.
 * Pure functions — no Zustand, no side effects, no closures in state.
 *
 * Architecture:
 *   - computeCart(): Full cart recomputation
 *   - computeItem(): Single item recomputation
 *   - validateCoupons(): Coupon validation (product/category conditions)
 *   - computeCouponValue()/computeTotalCoupons(): order-level coupon totals
 *
 * All functions return NEW objects — inputs are never mutated.
 *
 * Consolidates logic from:
 *   - services/tax.ts (tax computation)
 *   - services/pricing.ts (price helpers)
 *   - services/order-builder.ts (product computation)
 *   - services/cart-calculator.ts (cart calculation utilities)
 *
 * Pure domain layer: no Zustand, no React, no DOM.
 */

import { OrderProduct } from '@/types/models/order-product';
import { Order } from '@/types/models/order';
import { ProductUnitQuantity } from '@/types/models/product-unit-quantity';
import { CartDraft, ComputedCart, POSOptions, Coupon } from '@/types/cart-engine';
import { rawCurrency } from '@/utils/format';
import { isVatDisabled, isPriceWithTax, POS_OPTION_KEYS } from '@/constants/pos-options';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// Section 1: Primitive Tax Math
// ---------------------------------------------------------------------------

/**
 * Price excluding tax from an inclusive (tax-in) price.
 * formula: value * 100 / (rate + 100)
 */
export function computeInclusive(value: number, rate: number): number {
    return math
        .chain(math.chain(value).divide(math.chain(rate).add(100).done()).done())
        .multiply(100)
        .done();
}

/**
 * Price including tax from an exclusive (tax-out) price.
 * formula: value / 100 * (rate + 100)
 */
export function computeExclusive(value: number, rate: number): number {
    return math.chain(value).divide(100).multiply(math.chain(rate).add(100).done()).done();
}

/**
 * VAT amount for a given price + rate + type.
 */
export function getTaxValue(type: string, value: number, rate: number): number {
    switch (type) {
        case 'inclusive':
            return value - computeInclusive(value, rate);
        case 'exclusive':
            return computeExclusive(value, rate) - value;
    }
    return 0;
}

/**
 * Returns the pre-tax amount for a given price, rate and tax type.
 */
export function getPriceWithoutTax(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return computeInclusive(value, rate);
    if (type === 'exclusive') return value;
    return value;
}

/**
 * Returns the post-tax amount for a given price, rate and tax type.
 */
export function getPriceWithTax(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return value;
    if (type === 'exclusive') return computeExclusive(value, rate);
    return value;
}

/**
 * Returns the VAT amount for a given price, rate and tax type.
 */
export function getVatValue(value: number, rate: number, type: string): number {
    if (type === 'inclusive') return value - getPriceWithoutTax(value, rate, type);
    if (type === 'exclusive') return getPriceWithTax(value, rate, type) - value;
    return 0;
}

export interface TaxGroupResult {
    taxes: any[];
    tax_value: number;
    price_with_tax: number;
    price_without_tax: number;
    [key: string]: any;
}

/**
 * Given a line total price, a tax_group object (with .taxes[]), and the
 * tax type (inclusive/exclusive), returns the split price + computed taxes.
 */
export function computeTaxForGroup(
    price: number,
    tax_group: any,
    tax_type: string,
): TaxGroupResult {
    let tax_value = 0;
    let price_with_tax = 0;
    let price_without_tax = 0;
    let taxes: any[] = [];

    if (price <= 0) {
        return {
            ...(tax_group ?? {}),
            taxes: [],
            tax_value: 0,
            price_with_tax: 0,
            price_without_tax: 0,
        };
    }

    if (tax_group) {
        taxes = tax_group.taxes.map((tax: any) => ({
            ...tax,
            tax_value: getVatValue(price, tax.rate, tax_type),
        }));
    }

    if (taxes.length > 0) {
        const rate = taxes
            .map((tax: any) => tax.rate)
            .reduce((b: number, a: number) => b + a, 0);
        tax_value = getVatValue(price, rate, tax_type);
        price_without_tax = getPriceWithoutTax(price, rate, tax_type);
        price_with_tax = getPriceWithTax(price, rate, tax_type);
    } else {
        price_with_tax = price;
        price_without_tax = price;
    }

    return {
        ...(tax_group ?? {}),
        taxes,
        tax_value,
        price_with_tax,
        price_without_tax,
    };
}

// ---------------------------------------------------------------------------
// Section 2: Price Resolution
// ---------------------------------------------------------------------------

/**
 * Returns the unit sale price for a product quantity entry,
 * respecting the price-basis option (Show Price With Tax).
 */
export function getSalePrice(
    item: ProductUnitQuantity | undefined,
    options: POSOptions,
): number {
    if (isPriceWithTax(options)) {
        return rawCurrency(item?.sale_price_with_tax);
    }
    return rawCurrency(item?.sale_price_without_tax);
}

/**
 * Returns the custom unit price for a product quantity entry,
 * respecting the price-basis option (Show Price With Tax).
 */
export function getCustomPrice(item: any, options: POSOptions): number {
    if (isPriceWithTax(options)) {
        return rawCurrency(item.custom_price_with_tax);
    }
    return rawCurrency(item.custom_price_without_tax);
}

/**
 * Returns the wholesale unit price for a product quantity entry,
 * respecting the price-basis option (Show Price With Tax).
 */
export function getWholesalePrice(item: any, options: POSOptions): number {
    if (isPriceWithTax(options)) {
        return rawCurrency(item.wholesale_price_with_tax);
    }
    return rawCurrency(item.wholesale_price_without_tax);
}

/**
 * Returns a specific price value from a quantities object by mode + type suffix.
 * e.g. getPrice(quantities, 'normal', 'with_tax') → quantities.sale_price_with_tax
 */
export function getPrice(quantities: any, mode: string, type: string): number {
    switch (mode) {
        case 'normal':
            return quantities['sale_price_' + type] ?? 0;
        case 'wholesale':
            return quantities['wholesale_price_' + type] ?? 0;
        case 'custom':
            return quantities['custom_price_' + type] ?? 0;
    }
    return 0;
}

/**
 * Returns the editable (user-facing) unit price for a product
 * based on its pricing mode.
 */
export function getProductUnitPrice(mode: string, quantities: any): number {
    switch (mode) {
        case 'custom':
            return quantities.custom_price_edit ?? 0;
        case 'normal':
            return quantities.sale_price_edit ?? 0;
        case 'wholesale':
            return quantities.wholesale_price_edit ?? 0;
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Section 3: Product-Level Computation
// ---------------------------------------------------------------------------

export interface TaxComputationResult {
    price_without_tax: number;
    tax_value: number;
    price_with_tax: number;
    total_tax_value: number;
}

/**
 * Computes all tax + price fields for a product using its current mode and
 * quantities. Returns a field patch — the caller applies it to its own clone,
 * so the input product is never mutated.
 */
function computeProductTaxValue(product: OrderProduct, options: POSOptions): Partial<OrderProduct> {
    const source = product.source ?? null;
    const quantities = product.quantities ?? null;

    // When VAT is globally disabled, every product behaves exactly like a
    // product without a tax group: it sells at the merchant-entered (edit)
    // price, with/without-tax prices collapse to it, and any per-product
    // tax group left on the catalog is ignored ("Disabled" must mean no
    // tax anywhere).
    const tax_group = isVatDisabled(options) ? null : source?.tax_group;

    let unitPrice: number;

    if (isVatDisabled(options)) {
        unitPrice =
            (product.mode === 'normal' || product.mode === 'wholesale') && quantities
                ? getProductUnitPrice(product.mode, quantities)
                : product.unit_price;
    } else if (product.mode === 'normal') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (quantities?.sale_price_with_tax ?? 0)
                : (quantities?.sale_price_without_tax ?? 0);
    } else if (product.mode === 'wholesale') {
        unitPrice =
            product.tax_type === 'inclusive'
                ? (quantities?.wholesale_price_with_tax ?? 0)
                : (quantities?.wholesale_price_without_tax ?? 0);
    } else {
        unitPrice = product.unit_price;
    }

    const lineSubtotal = math.chain(unitPrice).multiply(product.quantity).done();
    const lineAfterDiscount = math
        .chain(lineSubtotal)
        .subtract(product.discount || 0)
        .done();

    const result = computeTaxForGroup(lineAfterDiscount, tax_group, product.tax_type || '');

    return {
        tax_value: math.chain(result.tax_value).divide(product.quantity).done(),
        total_tax_value: result.tax_value,
        price_with_tax: math.chain(result.price_with_tax).divide(product.quantity).done(),
        price_without_tax: math.chain(result.price_without_tax).divide(product.quantity).done(),
        total_price_with_tax: result.price_with_tax,
        total_price_without_tax: result.price_without_tax,
    };
}

/**
 * Computes all derived fields (unit_price, total_price, tax fields) on a
 * single cart product. Returns a new object — never mutates the input.
 *
 * @param product  - The cart product to compute
 * @param options  - POS options (sb_subul_price_with_tax, etc.)
 */
export function computeProduct(product: OrderProduct, options: POSOptions): OrderProduct {
    const computed: OrderProduct = { ...product };

    // Clone the serializable quantities too, so nested writes on the computed
    // line can never leak back into the input (the old closure was shared).
    if (computed.quantities) {
        computed.quantities = { ...computed.quantities };
    }

    if (computed.product_type === 'product') {
        const quantities = computed.quantities ?? null;
        if (computed.mode === 'normal' && quantities) {
            // VAT disabled → sell at the merchant-entered (edit) price; the
            // with/without-tax display distinction is meaningless without tax.
            computed.unit_price = isVatDisabled(options)
                ? getProductUnitPrice('normal', quantities)
                : getSalePrice(quantities, options);
        } else if (computed.mode === 'wholesale' && quantities) {
            computed.unit_price = isVatDisabled(options)
                ? getProductUnitPrice('wholesale', quantities)
                : getWholesalePrice(quantities, options);
        }
        // For 'custom' mode: keep unit_price as-is (user-set price)
    }

    // Apply the tax patch to the clone — never to the caller's input.
    Object.assign(computed, computeProductTaxValue(computed, options));

    if (computed.total_tax_value === undefined) {
        computed.total_tax_value = math.chain(computed.tax_value).multiply(computed.quantity).done();
    }

    if (computed.price_with_tax !== undefined && computed.price_without_tax !== undefined) {
        computed.total_price_with_tax = math
            .chain(computed.price_with_tax)
            .multiply(computed.quantity)
            .done();
        computed.total_price_without_tax = math
            .chain(computed.price_without_tax)
            .multiply(computed.quantity)
            .done();
    }

    // total_price must reflect the actual amount the customer pays.
    // computeProductTaxValue() already split the price correctly into
    // total_price_with_tax / total_price_without_tax — use those instead of
    // re-deriving from unit_price (which can be pre-tax when
    // sb_subul_price_with_tax === 'no', leading to a subtotal that excludes tax).
    if (isPriceWithTax(options) && computed.total_price_with_tax !== undefined) {
        computed.total_price = computed.total_price_with_tax;
    } else if (!isPriceWithTax(options) && computed.total_price_with_tax !== undefined) {
        // Even when prices are stored/displayed without tax, the total that feeds
        // order.subtotal must still be the full (with-tax) amount so that the
        // final payable total is correct. The UI shows tax separately via
        // products_tax_value / tax_value rows.
        computed.total_price = computed.total_price_with_tax;
    } else {
        // Fallback: no tax group attached — raw unit_price math is correct.
        computed.total_price = math
            .chain(computed.unit_price)
            .multiply(computed.quantity)
            .subtract(computed.discount || 0)
            .done();
    }

    return computed;
}

/**
 * Recomputes all derived fields for every product in the array.
 * Returns a new array — never mutates the input.
 */
export function recomputeProducts(
    products: OrderProduct[],
    options: POSOptions,
): OrderProduct[] {
    return products.map((product) => computeProduct(product, options));
}

// ---------------------------------------------------------------------------
// Section 4: Order-Level Computation
// ---------------------------------------------------------------------------

/**
 * Sums per-product taxes into order.products_tax_value so the UI can show
 * a "Product Taxes" line in all VAT modes.
 *
 * NOTE: Do NOT add products_tax_value back into order.subtotal here.
 * total_price (and therefore order.subtotal) already reflects the full
 * payable amount (including tax) after the fix in computeProduct().
 * Adding it again would double-count the tax.
 */
export function sumProductsTaxes(
    order: Order,
    products: OrderProduct[],
    _options: POSOptions,
): Order {
    const next: Order = {
        ...order,
        products: products as any,
        total_products: products.length,
    };

    // Always aggregate per-product taxes so the UI tax row is populated
    // regardless of the active VAT mode (products_vat, flat_vat, etc.).
    const totalTaxValues = products.map((p: OrderProduct) => p.total_tax_value || 0);
    if (totalTaxValues.length > 0) {
        next.products_tax_value = totalTaxValues.reduce(
            (before: number, after: number) => before + after,
            0,
        );
    }

    return next;
}

/**
 * Computes order.subtotal from the given products array and delegates
 * per-product tax aggregation to sumProductsTaxes.
 *
 * Pure: returns a NEW order plus a products array in which "dynamic" lines
 * (percentage-based services) are replaced with clones carrying their
 * recomputed unit_price/total_price. Callers publish the returned products
 * back to the store explicitly — inputs are never mutated.
 */
export function sumProductsTotals(
    order: Order,
    products: OrderProduct[],
    options: POSOptions,
): { order: Order; products: OrderProduct[] } {
    const staticTotal = products
        .filter((p) => p.product_type !== 'dynamic')
        .map((p) => p.total_price);

    // With no dynamic lines there is nothing to recompute — return the input
    // array as-is so callers can skip the store write (identity unchanged).
    const hasDynamic = products.some((p) => p.product_type === 'dynamic');

    if (staticTotal.length > 0) {
        const productTotalValue = staticTotal.reduce((b: number, a: number) => b + a);

        const dynamicProducts = hasDynamic
            ? products.map((p) => {
                  if (p.product_type !== 'dynamic') return p;

                  const unit_price = (productTotalValue * (p.rate || 0)) / 100;
                  const total_price = unit_price * p.quantity;
                  return { ...p, unit_price, total_price };
              })
            : products;

        const dynamicProductValue = dynamicProducts
            .filter((p) => p.product_type === 'dynamic')
            .map((p) => p.total_price)
            .reduce((b: number, a: number) => b + a, 0);

        return {
            order: sumProductsTaxes(
                { ...order, subtotal: productTotalValue + dynamicProductValue },
                dynamicProducts,
                options,
            ),
            products: dynamicProducts,
        };
    }

    return {
        order: sumProductsTaxes({ ...order, subtotal: 0 }, products, options),
        products,
    };
}

/**
 * Accumulates order-level taxes from order.taxes into order.tax_value
 * depending on the POS VAT mode stored in options.
 * Pure: returns a new order — the input is never mutated.
 */
export function computeOrderTaxes(order: Order, options: POSOptions): Order {
    const posVat = options[POS_OPTION_KEYS.vat];

    if (['flat_vat', 'variable_vat'].includes(posVat) && order.taxes && order.taxes.length > 0) {
        const orderTaxTotal = order.taxes
            .map((tax: any) => tax.tax_value)
            .reduce((before: number, after: number) => before + after, 0);

        return { ...order, tax_value: order.tax_value + orderTaxTotal };
    }

    return order;
}

/**
 * Distributes a tax group's VAT across its sub-taxes and returns the updated order.
 * Calls computeOrderTaxes internally.
 * Pure: works on a clone of taxGroup and returns a new order — neither the
 * order nor the (often store-owned) taxGroup object is ever mutated.
 */
export function computeOrderTaxGroup(
    order: Order,
    taxGroup: any,
    options: POSOptions,
): Order {
    const group: any = { ...taxGroup, taxes: [...taxGroup.taxes] };

    const summarizedRates = group.taxes
        .map((tax: any) => parseFloat(tax.rate))
        .reduce((b: number, a: number) => b + a, 0);

    const currentVatValue = getVatValue(
        order.subtotal - order.discount,
        summarizedRates,
        order.tax_type as string,
    );

    group.taxes = group.taxes.map((_tax: any) => {
        const currentPercentage = math
            .chain(math.chain(_tax.rate).divide(summarizedRates).done())
            .multiply(100)
            .done();
        return {
            id: _tax.id,
            tax_id: _tax.tax_id,
            name: _tax.name,
            rate: parseFloat(_tax.rate),
            tax_value: math
                .chain(math.chain(currentVatValue).multiply(currentPercentage).done())
                .divide(100)
                .done(),
        };
    });

    if (group.taxes.length === 0) {
        // Caller is responsible for showing a warning toast.
        return order;
    }

    return computeOrderTaxes({ ...order, taxes: group.taxes, tax_group: group }, options);
}

// ---------------------------------------------------------------------------
// Section 5: Coupon Validation & Order-Level Discount Totals
// ---------------------------------------------------------------------------

/**
 * Validates coupons against cart contents.
 * Returns lists of valid and invalid coupons.
 */
export function validateCoupons(
    products: OrderProduct[],
    coupons: Coupon[],
    _options: POSOptions,
): { validCoupons: Coupon[]; invalidCoupons: Coupon[] } {
    const validCoupons: Coupon[] = [];
    const invalidCoupons: Coupon[] = [];

    for (const coupon of coupons) {
        const productMatch =
            coupon.products.length === 0 ||
            products.some((product) =>
                coupon.products.map((p) => p.product_id).includes(product.product_id || 0),
            );

        const categoryMatch =
            coupon.categories.length === 0 ||
            products.some((product) => {
                const source = product.source ?? null;
                return coupon.categories.map((c) => c.category_id).includes(source?.category_id || 0);
            });

        if (productMatch && categoryMatch) {
            validCoupons.push(coupon);
        } else {
            invalidCoupons.push(coupon);
        }
    }

    return { validCoupons, invalidCoupons };
}

/**
 * Computes the order-level value of a single coupon against the given
 * order subtotal.
 *
 * Coupon attribution is ORDER-LEVEL ONLY — coupons never reduce individual
 * product lines. Percentage coupons take a fraction of the order subtotal;
 * flat coupons subtract their raw value. This mirrors the live POS path
 * (usePOS.refreshCart) and the backend's __computeCouponValue
 * (app/Services/OrdersService.php:369-375). The backend may prefer a
 * precomputed `value` when persisting (OrdersService.php:358-362), but the
 * client always recomputes against the current subtotal.
 */
export function computeCouponValue(coupon: Coupon, subtotal: number): number {
    if (coupon.type === 'percentage_discount') {
        return (subtotal * coupon.discount_value) / 100;
    }
    return coupon.discount_value;
}

/**
 * Sums the order-level values of every VALID coupon (stacking additively,
 * same as the backend's __computeOrderCoupons, OrdersService.php:354-367).
 *
 * Only coupons that passed validateCoupons() (product/category conditions)
 * may be passed in — invalid coupons contribute nothing. The manual order
 * discount (order.discount) is independent and also stacks additively: the
 * caller composes the payable total as
 * subtotal + shipping − discount − total_coupons (usePOS.refreshCart).
 */
export function computeTotalCoupons(coupons: Coupon[], subtotal: number): number {
    return coupons.reduce((total, coupon) => total + computeCouponValue(coupon, subtotal), 0);
}

// ---------------------------------------------------------------------------
// Section 6: Main Entry Points
// ---------------------------------------------------------------------------

/**
 * Full cart recomputation — the primary API.
 * Input: draft cart + options
 * Output: computed cart with all derived fields populated
 */
export function computeCart(draft: CartDraft, options: POSOptions): ComputedCart {
    // 1. Compute all products
    const products = draft.products.map((p) => computeProduct(p, options));

    // 2. Validate coupons — validCoupons is the single source of truth for
    //    which coupons discount the order.
    const { validCoupons, invalidCoupons } = validateCoupons(products, draft.coupons, options);

    // 3. Compute order-level totals. Coupon attribution is ORDER-LEVEL ONLY:
    //    coupons never modify product lines (line discounts are manual only).
    //    Multiple coupons and the manual order discount (order.discount) stack
    //    additively; the caller composes the payable total as
    //    subtotal + shipping − discount − total_coupons. The authoritative
    //    recomputation happens server-side on save
    //    (app/Services/OrdersService.php:354-367,383-425).
    const { order: summedOrder, products: computedProducts } = sumProductsTotals(
        { ...draft.order },
        products,
        options,
    );
    let order = computeOrderTaxes(summedOrder, options);
    order = { ...order, total_coupons: computeTotalCoupons(validCoupons, order.subtotal) };

    return {
        products: computedProducts,
        order,
        validCoupons,
        invalidCoupons,
    };
}

/**
 * Single-item recomputation — for incremental updates.
 */
export function computeItem(item: OrderProduct, options: POSOptions): OrderProduct {
    return computeProduct(item, options);
}

// ---------------------------------------------------------------------------
// Section 7: Stock Usage Helper
// ---------------------------------------------------------------------------

/**
 * Returns total quantity of a given product+unit combination currently in the cart.
 */
export function getStockUsage(
    products: OrderProduct[],
    product_id: number,
    unit_quantity_id: number,
): number {
    const stocks = products
        .filter(
            (p) =>
                p.product_id === product_id &&
                p.unit_quantity_id === unit_quantity_id,
        )
        .map((p) => p.quantity);

    return stocks.length > 0 ? stocks.reduce((b: number, a: number) => b + a, 0) : 0;
}

// ---------------------------------------------------------------------------
// Section 8: Cart Calculator Utilities (from cart-calculator.ts)
// ---------------------------------------------------------------------------

/**
 * Calculates new tax value when price changes.
 */
export function calculateNewTaxValue(oldPriceWithoutTax: number, oldTaxValue: number, newPriceWithoutTax: number) {
    if (!oldPriceWithoutTax || oldPriceWithoutTax <= 0 || isNaN(oldPriceWithoutTax)) {
        return {
            taxRate: 0,
            newTaxValue: 0,
        };
    }

    const taxRate = oldTaxValue / oldPriceWithoutTax;
    const newTaxValue = newPriceWithoutTax * taxRate;

    return {
        taxRate: +(taxRate * 100).toFixed(2), // percent
        newTaxValue: +newTaxValue.toFixed(2), // rounded tax value
    };
}

/**
 * Calculates totals when quantity is updated.
 */
export function calculateTotalsForQuantityUpdate(product: OrderProduct, quantity: number, isPriceWithTax: boolean) {
    const lineSubtotal = product.unit_price * quantity;
    const discount_value =
        product.discount_type === 'percentage' ? ((product.discount_percentage || 0) / 100) * lineSubtotal : product.discount || 0;

    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
        totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
        const taxMultiplier = 1 + taxRate;
        const priceWithTax = totalBeforeTax;
        const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
        totalTaxValue = priceWithTax - priceWithoutTax;
    }

    const total_price_with_tax = totalBeforeTax + totalTaxValue;
    const total_price_without_tax = totalBeforeTax;

    return {
        discount: discount_value,
        quantity,
        total_tax_value: totalTaxValue,
        total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
        total_price_with_tax,
        total_price_without_tax,
    };
}

/**
 * Calculates totals when the unit price is updated.
 *
 * `price` is expressed in the DISPLAY basis the cashier sees and typed:
 * - "Show Price With Tax: yes" → the with-tax price
 * - "Show Price With Tax: no"  → the without-tax price
 * - VAT disabled               → the plain price (no tax to split; the rate is 0)
 *
 * Typing the currently displayed price must be a no-op, so the entered value
 * is converted to the product's own TAX basis for the custom recompute
 * (computeProductTaxValue reads `unit_price` through computeTaxForGroup):
 * - inclusive products are priced tax-in  → unit_price = the with-tax number
 * - exclusive products are priced tax-out → unit_price = the without-tax number
 */
export function calculateTotalsForPriceUpdate(product: OrderProduct, price: number, isPriceWithTax: boolean) {
    const oldTaxRate =
        product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    const price_without_tax = isPriceWithTax ? price / (1 + oldTaxRate) : price;
    const price_with_tax = price_without_tax * (1 + oldTaxRate);
    const unit_price = product.tax_type === 'inclusive' ? price_with_tax : price_without_tax;

    const discount_value = ((product.discount_percentage || 0) / 100) * unit_price * product.quantity;
    const totalAfterDiscount = unit_price * product.quantity - discount_value;
    const totalTaxValue =
        product.tax_type === 'inclusive'
            ? totalAfterDiscount - totalAfterDiscount / (1 + oldTaxRate)
            : totalAfterDiscount * oldTaxRate;

    return {
        discount: discount_value,
        unit_price,
        price_without_tax,
        price_with_tax,
        tax_value: product.quantity > 0 ? totalTaxValue / product.quantity : 0,
        total_tax_value: totalTaxValue,
        mode: 'custom' as const,
        total_price: totalAfterDiscount + totalTaxValue,
        total_price_with_tax: totalAfterDiscount + totalTaxValue,
        total_price_without_tax: totalAfterDiscount,
    };
}

/**
 * Calculates totals when discount percentage is updated.
 */
export function calculateTotalsForDiscountPercentageUpdate(product: OrderProduct, discountPercentage: number, isPriceWithTax: boolean) {
    const lineSubtotal = (product.price_without_tax || product.unit_price) * product.quantity;
    const discount_value = (discountPercentage / 100) * lineSubtotal;
    const totalBeforeTax = lineSubtotal - discount_value;

    let totalTaxValue = 0;
    const taxRate = product.price_without_tax > 0 ? product.tax_value / product.price_without_tax : 0;

    if (product.tax_type === 'exclusive') {
        totalTaxValue = totalBeforeTax * taxRate;
    } else if (product.tax_type === 'inclusive') {
        const taxMultiplier = 1 + taxRate;
        const priceWithTax = (product.price_with_tax * product.quantity) - discount_value;
        const priceWithoutTax = taxMultiplier > 0 ? priceWithTax / taxMultiplier : priceWithTax;
        totalTaxValue = priceWithTax - priceWithoutTax;
    } else {
        totalTaxValue = (product.tax_value || 0) * product.quantity;
    }

    const total_price_with_tax = product.price_with_tax * product.quantity - discount_value;
    const total_price_without_tax = totalBeforeTax;

    return {
        discount_percentage: discountPercentage,
        discount: discount_value,
        total_tax_value: totalTaxValue,
        total_price: isPriceWithTax ? total_price_with_tax : total_price_without_tax,
        total_price_without_tax,
        total_price_with_tax,
    };
}

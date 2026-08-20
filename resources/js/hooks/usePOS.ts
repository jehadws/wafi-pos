/**
 * hooks/usePOS.ts
 *
 * Facade store — composes all POS slices into a single Zustand store.
 *
 * PUBLIC API IS UNCHANGED: every `import { usePOS } from '@/hooks/usePOS'`
 * across the codebase continues to work without modification.
 *
 * Architecture:
 *   services/tax.ts          — pure tax math (no Zustand)
 *   services/pricing.ts      — pure pricing helpers (no Zustand)
 *   services/order-builder.ts— pure product computation (no Zustand)
 *   hooks/pos/use-pos-dialogs.ts   — dialog open/close slice
 *   hooks/pos/use-cart-store.ts    — cart products slice
 *   hooks/pos/use-payments-store.ts— payments slice
 *   hooks/pos/use-customer-store.ts— customer & coupon slice
 *   hooks/pos/use-pos-session.ts   — init / settings / permissions slice
 */

import { Customer } from '@/interfaces/customer';
import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';
import { OrderType } from '@/interfaces/order-type';
import { Payment } from '@/interfaces/payment';
import { PaymentType } from '@/interfaces/payment-type';
import { ProductUnitQuantity } from '@/interfaces/product-unit-quantity';

import { ordersApi, taxesApi } from '@/api';
import printAgentService from '@/services/print-agent-service';
import { isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { create } from 'zustand';

// Services (pure)
import {
    getPriceWithoutTax,
    getPriceWithTax,
    getVatValue,
    computeTaxForGroup,
    computeOrderTaxGroup,
    computeOrderTaxes,
    sumProductsTaxes,
    computeProductTax,
    proceedProductTaxComputation,
    computeCustomProductTax,
    computeNormalProductTax,
    computeWholesaleProductTax,
    computeProductTaxValue,
} from '@/services/tax';

import {
    getSalePrice,
    getCustomPrice,
    getWholesalePrice,
    getPrice,
    getProductUnitPrice,
    sumProductsTotals,
} from '@/services/pricing';

import {
    defineQuantities,
    getStockUsage,
    computeProduct,
    recomputeProducts,
} from '@/services/order-builder';

// Slices
import {
    createPosDialogsSlice,
    createCartSlice,
    createPaymentsSlice,
    createCustomerSlice,
    createSessionSlice,
} from '@/hooks/pos';

import { formatCurrency, rawCurrency } from '@/utils/format';
import * as math from 'mathjs';

const __ = (ns: any) => ns;

// ─────────────────────────────────────────────────────────────────────────────
// Default order factory
// ─────────────────────────────────────────────────────────────────────────────

const defaultOrder = (): Order => ({
    discount_type: null,
    title: '',
    discount: 0,
    register_id: undefined,
    discount_percentage: 0,
    subtotal: 0,
    total: 0,
    coupons: [],
    total_coupons: 0,
    tendered: 0,
    note: '',
    note_visibility: 'hidden',
    tax_group_id: undefined,
    tax_type: undefined,
    taxes: [],
    tax_group: {},
    payment_status: undefined,
    customer_id: undefined,
    change: 0,
    total_products: 0,
    shipping: 0,
    tax_value: 0,
    products_tax_value: 0,
    shipping_rate: 0,
    shipping_type: undefined,
    customer: undefined,
    type: undefined,
    products: [],
    instalments: [],
    payments: [],
    addresses: {
        shipping: undefined,
        billing: undefined,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const usePOS = create<any>((set, get) => ({
    // ── Core order state (not owned by any slice) ────────────────────────────
    order: defaultOrder(),
    isSubmitting: false,
    breadcrumbs: [] as any[],
    customers: [] as Customer[],

    // ── Compose slices ────────────────────────────────────────────────────────
    ...createPosDialogsSlice(set, get, {} as any),
    ...createCartSlice(set, get, {} as any),
    ...createPaymentsSlice(set, get, {} as any),
    ...createCustomerSlice(set, get, {} as any),
    ...createSessionSlice(set, get, {} as any),

    // ─────────────────────────────────────────────────────────────────────────
    // Pricing helpers (thin wrappers → pure functions, kept for API compat)
    // ─────────────────────────────────────────────────────────────────────────

    getSalePrice: (item: ProductUnitQuantity | undefined) =>
        getSalePrice(item, get().options),

    getCustomPrice: (item: any) =>
        getCustomPrice(item, get().options),

    getWholesalePrice: (item: any) =>
        getWholesalePrice(item, get().options),

    getPrice: (quantities: any, mode: string, type: string) =>
        getPrice(quantities, mode, type),

    getProductUnitPrice: (mode: string, quantities: any) =>
        getProductUnitPrice(mode, quantities),

    // ─────────────────────────────────────────────────────────────────────────
    // Tax helpers (thin wrappers → pure functions, kept for API compat)
    // ─────────────────────────────────────────────────────────────────────────

    getPriceWithoutTax: (value: number, rate: number, type: string) =>
        getPriceWithoutTax(value, rate, type),

    getPriceWithTax: (value: number, rate: number, type: string) =>
        getPriceWithTax(value, rate, type),

    getVatValue: (value: number, rate: number, type: string) =>
        getVatValue(value, rate, type),

    computeTaxForGroup: (price: number, tax_group: any, tax_type: string) =>
        computeTaxForGroup(price, tax_group, tax_type),

    computeOrderTaxGroup: (order: Order, taxGroup: any) =>
        computeOrderTaxGroup(order, taxGroup, get().options),

    computeOrderTaxes: (order: Order) =>
        computeOrderTaxes(order, get().options),

    sumProductsTaxes: (order: Order) =>
        sumProductsTaxes(order, get().products, get().options),

    computeProductTax: (product: OrderProduct) =>
        computeProductTax(product),

    proceedProductTaxComputation: (product: OrderProduct, price: number) =>
        proceedProductTaxComputation(product, price),

    computeCustomProductTax: (product: OrderProduct) =>
        computeCustomProductTax(product),

    computeNormalProductTax: (product: OrderProduct) =>
        computeNormalProductTax(product),

    computeWholesaleProductTax: (product: OrderProduct) =>
        computeWholesaleProductTax(product),

    computeProductTaxValue: (product: OrderProduct) =>
        computeProductTaxValue(product),

    // ─────────────────────────────────────────────────────────────────────────
    // Order-builder helpers (thin wrappers)
    // ─────────────────────────────────────────────────────────────────────────

    getStockUsage: (product_id: number, unit_quantity_id: number) =>
        getStockUsage(get().products, product_id, unit_quantity_id),

    defineQuantities: (product: any, units?: any[]) =>
        defineQuantities(product, units),

    computeProduct: (product: OrderProduct) =>
        computeProduct(product, get().options),

    // recomputeProducts is already provided by the cart slice.

    // ─────────────────────────────────────────────────────────────────────────
    // Cart orchestration (these need both cart + order state)
    // ─────────────────────────────────────────────────────────────────────────

    buildOrder: (order: Order) => {
        set({ order });
    },

    buildProducts: (products: OrderProduct[]) => {
        get().recomputeProducts(products);
        set({ products });
    },

    updateCart: (update: object) => {
        const current = get().order;
        const newOrder = { ...current, ...update };
        set({ order: newOrder });
        get().refreshCart();
    },

    sumProductsTotals: (order: Order) =>
        sumProductsTotals(order, get().products, get().options),

    refreshCart: async () => {
        get().checkCart();

        let order: Order = sumProductsTotals(
            { ...get().order },
            get().products,
            get().options,
        );

        const totalValue = order.coupons.map((customerCoupon: any) => {
            if (customerCoupon.type === 'percentage_discount') {
                customerCoupon.value = (order.subtotal * customerCoupon.discount_value) / 100;
                return customerCoupon.value;
            }
            customerCoupon.value = customerCoupon.discount_value;
            return customerCoupon.value;
        });

        order.total_coupons = 0;
        if (totalValue.length > 0) {
            order.total_coupons = totalValue.reduce(
                (before: number, after: number) => before + after,
            );
        }

        if (order.discount_type === 'percentage') {
            order.discount = (order.discount_percentage * order.subtotal) / 100;
        }

        if (order.discount > order.subtotal && order.total_coupons === 0) {
            order.discount = order.subtotal;
            toast.info(__('The discount has been set to the cart subtotal.'));
        }

        order.tax_value = 0;
        set({ order });

        try {
            const response = await get().computeTaxes();
            order = response['data'].order;
        } catch (exception: any) {
            if (exception !== false && exception.message !== undefined) {
                toast.error(
                    exception.message ||
                        __('An unexpected error has occurred while fecthing taxes.'),
                    { duration: 0 },
                );
            }
        }

        const taxType = order.tax_type;
        const tax_value = order.tax_value;

        if (taxType === 'exclusive') {
            const op1 = math
                .chain(order.subtotal)
                .add(order.shipping || 0)
                .add(tax_value)
                .done();
            order.total = math
                .chain(op1)
                .subtract(order.discount)
                .subtract(order.total_coupons)
                .done();
        } else {
            const op1 = math.chain(order.subtotal).add(order.shipping || 0).done();
            order.total = math
                .chain(op1)
                .subtract(order.discount)
                .subtract(order.total_coupons)
                .done();
        }

        set({ order });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Tax async orchestration
    // ─────────────────────────────────────────────────────────────────────────

    computeTaxes: async () => {
        let order: Order = get().order;
        const options = get().options;

        if (order.tax_group_id === undefined || order.tax_group_id === null) {
            order = computeOrderTaxes(order, options);
            return { data: { order }, status: 'success' };
        }

        const group = order.tax_group;

        if (group.id !== undefined) {
            if (group.id === order.tax_group_id) {
                order = computeOrderTaxGroup(order, group, options);
            }
            return { status: 'success', data: { tax: group, order } };
        }

        if (
            ![undefined, null].includes(order.tax_group_id as any) &&
            order.tax_group_id!.toString().length > 0
        ) {
            const tax = await taxesApi.getGroup(order.tax_group_id!);
            order = computeOrderTaxGroup(order, tax, options);
            return { status: 'success', data: { tax, order } };
        } else {
            throw { status: 'error', message: __('No tax group assigned to the order') };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Session / reset
    // ─────────────────────────────────────────────────────────────────────────

    reset: async () => {
        try {
            set({
                isSubmitting: false,
                order: defaultOrder(),
                products: [],
                customers: [],
                breadcrumbs: [],
                holdPopupEnabled: true,
            });
            await get().processInitialQueue();
        } catch (exception) {
            console.error(exception);
            throw exception;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Order submission
    // ─────────────────────────────────────────────────────────────────────────

    canProceedAsLaidAway: async (_order: Order) => {
        const minimalPaymentPercent = _order.customer.group.minimal_credit_payment;
        const firstPart = math.chain(_order.total).multiply(minimalPaymentPercent).done();
        let expected: any = math.chain(firstPart).divide(100).done();
        expected = parseFloat(expected);

        const result = await new Promise<{ order: Order }>((resolve, reject) => {
            if (window.confirm('Configure layaway payment?')) {
                resolve({ order: _order });
            } else {
                reject({ status: 'error', message: 'Layaway configuration canceled.' });
            }
        });

        if (result.order.instalments.length === 0 && result.order.tendered < expected) {
            const message = __(
                `Before saving this order, a minimum payment of {amount} is required`,
            ).replace('{amount}', formatCurrency(expected));
            toast.error(__('Unable to proceed'), { description: message });
            throw { status: 'error', message };
        } else {
            const paymentType = get().selectedPaymentType;
            const expectedSlice = result.order.instalments.filter(
                (payment) =>
                    payment.amount >= expected &&
                    isSameDay(payment.date, startOfDay(new Date())),
            );

            if (expectedSlice.length === 0) {
                return {
                    status: 'success',
                    message: __('Layaway defined'),
                    data: { order: result.order },
                };
            }

            const firstSlice = expectedSlice[0].amount;

            if (firstSlice > 0) {
                return new Promise((resolve, reject) => {
                    toast.info(__('Initial Payment'), {
                        description: __(
                            `In order to proceed, an initial payment of {amount} is required for the selected payment type "{paymentType}". Would you like to proceed ?`,
                        )
                            .replace('{amount}', formatCurrency(firstSlice))
                            .replace('{paymentType}', paymentType.label),
                        action: {
                            label: __('Proceed'),
                            onClick: () => {
                                const payment: Payment = {
                                    identifier: paymentType.identifier,
                                    label: paymentType.label,
                                    value: firstSlice,
                                    readonly: false,
                                    selected: true,
                                };
                                get().addPayment(payment);
                                expectedSlice[0].paid = true;
                                resolve({
                                    status: 'success',
                                    message: __('Layaway defined'),
                                    data: { order: result.order },
                                });
                            },
                        },
                        onDismiss: () =>
                            reject({
                                status: 'error',
                                message: __('The request was canceled'),
                            }),
                    });
                });
            } else {
                return {
                    status: 'success',
                    message: __('Layaway defined'),
                    data: { order: result.order },
                };
            }
        }
    },

    submitOrder: async (orderFields: object = {}) => {
        let order = { ...get().order, ...orderFields };

        const minimalPayment = order.customer?.group?.minimal_credit_payment || 0;

        if (order.payment_status !== 'hold') {
            if (
                order.payments.length === 0 &&
                order.total > 0 &&
                order.total > order.tendered
            ) {
                if (get().options.ns_orders_allow_partial === 'no') {
                    const message = __('Partially paid orders are disabled.');
                    toast.error(message);
                    throw { status: 'error', message };
                } else if (get().options.ns_orders_allow_unpaid === 'no') {
                    const message = __(
                        'Unpaid orders are not allowed. Please add at least one payment.',
                    );
                    toast.error(message);
                    throw { status: 'error', message };
                } else if (minimalPayment >= 0) {
                    const result = await get().canProceedAsLaidAway(order);
                    order = result.data.order;
                }
            }
        }

        if (!get().isSubmitting) {
            set({ isSubmitting: true });
            return get().proceedSubmitting(order);
        }

        const message = __('An order is currently being processed.');
        toast.error(message);
        throw { status: 'error', message };
    },

    proceedSubmitting: async (order: Order) => {
        const orderToSubmit = {
            ...order,
            coupons: order.coupons?.map((c: any) => ({
                ...c,
                coupon_id: c.coupon_id || c.id,
            })),
        };

        try {
            const submittedOrder = await ordersApi.submit(orderToSubmit);
            get().reset();
            set({ isSubmitting: false });

            const url = get().options.ns_jgrem_complete_sale_audio;
            if (url.length > 0) {
                new Audio(url).play();
            }
            return submittedOrder;
        } catch (error) {
            set({ isSubmitting: false });
            throw error;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Order loading
    // ─────────────────────────────────────────────────────────────────────────

    loadOrder: async (order_id: number) => {
        const order = await ordersApi.getForPos(order_id);

        const fullOrder: Order = { ...defaultOrder(), ...order };
        const products: OrderProduct[] = [];

        for (let i = 0; i < fullOrder.products.length; i++) {
            const orderProduct = fullOrder.products[i] as any;

            if (orderProduct.product === null) {
                orderProduct.product = {
                    mode: 'custom',
                    name: orderProduct.name,
                    unit_id: orderProduct.unit_id,
                    unit_quantities: [await defineQuantities(orderProduct)],
                };
            }

            orderProduct.$original = () => orderProduct.product;
            orderProduct.$quantities = () => {
                const unitQuantity = orderProduct.product.unit_quantities.filter(
                    (uq: any) =>
                        +uq.id === +orderProduct.unit_quantity_id || uq.id === undefined,
                )[0];

                if (orderProduct.mode === 'custom') {
                    unitQuantity.custom_price_edit = orderProduct.unit_price;
                    unitQuantity.custom_price_with_tax = orderProduct.price_with_tax;
                    unitQuantity.custom_price_without_tax = orderProduct.price_without_tax;
                    unitQuantity.custom_price_tax = orderProduct.tax_value;
                }

                return unitQuantity;
            };
            products.push(orderProduct);
        }

        (fullOrder as any).type = Object.values(get().types).filter(
            (type: any) => type.identifier === (fullOrder as any).type,
        )[0];

        fullOrder.addresses = {
            shipping: (order as any).shipping_address,
            billing: (order as any).billing_address,
        };

        delete (fullOrder as any).shipping_address;
        delete (fullOrder as any).billing_address;

        get().buildOrder(fullOrder);
        get().buildProducts(products);
        await get().selectCustomer(fullOrder.customer);

        return fullOrder;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Order field setters
    // ─────────────────────────────────────────────────────────────────────────

    setHoldPopupEnabled: (status = true) => {
        set({ holdPopupEnabled: status });
    },

    getHoldPopupEnabled: () => {
        return get().holdPopupEnabled;
    },

    setDiscount: (value: number, type: 'flat' | 'percentage' = 'flat') => {
        const order = get().order;
        order.discount = value;
        order.discount_type = type;
        if (type === 'percentage') {
            order.discount_percentage = value;
            order.discount = (value / 100) * order.subtotal;
        }
        set({ order });
        get().refreshCart();
    },

    setShipping: (value: number, shippingType: string = 'flat') => {
        const order = get().order;
        order.shipping = value;
        order.shipping_type = shippingType as any;
        set({ order });
        get().refreshCart();
    },

    setNote: (note: string, visibility: 'hidden' | 'visible' = 'hidden') => {
        const order = get().order;
        order.note = note;
        order.note_visibility = visibility;
        set({ order });
    },

    setOrderType: (type: OrderType) => {
        const order = get().order;
        order.type = type;
        if (type.identifier === 'takeaway') {
            order.shipping = 0;
        }
        set({ order });
        get().refreshCart();
    },

    updateAddress: (type: 'billing' | 'shipping', address: any) => {
        const order = get().order;
        order.addresses = { ...order.addresses, [type]: address };
        set({ order });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Receipt printing (stub — wired to print-agent-service in Step 3)
    // ─────────────────────────────────────────────────────────────────────────

    printOrderReceipt: (order: Order, mode: string) => {
        const { options } = get();

        if (options.ns_jgrem_printing_enabled_for === 'disabled') {
            return false;
        }

        const shouldPrint =
            options.ns_jgrem_printing_enabled_for === 'all_orders' ||
            (options.ns_jgrem_printing_enabled_for === 'partially_paid_orders' &&
                ['paid', 'partially_paid'].includes(order.payment_status)) ||
            (options.ns_jgrem_printing_enabled_for === 'only_paid_orders' &&
                ['paid'].includes(order.payment_status));

        if (!shouldPrint) return false;

        // Delegate to PrintAgentService — maps Order → FormattedReceiptData internally
        printAgentService
            .printOrderReceipt(order, mode, {
                autoPrintOnSale: options.ns_jgrem_printing_auto ?? true,
            })
            .catch((err: Error) => {
                // Non-blocking: print failures should not interrupt the sale flow
                console.error('[POS] Receipt print failed:', err.message);
            });
    },
}));

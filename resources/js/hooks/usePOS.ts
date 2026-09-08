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

import { Customer } from '@/types/models/customer';
import { Order } from '@/types/models/order';
import { OrderProduct } from '@/types/models/order-product';
import { OrderType } from '@/types/models/order-type';
import { Payment } from '@/types/models/payment';

import { POS_OPTION_KEYS, isPriceWithTax } from '@/constants/pos-options';
import { ORDER_TYPE_MAP } from '@/constants/order-types';
import { ordersApi, taxesApi } from '@/api';
import printAgentService from '@/services/print-agent-service';
import type { PrintResult } from '@/services/print-agent-service';
import { computeOrderTaxes, computeOrderTaxGroup } from '@/services/cart-engine';
import { sumProductsTotals } from '@/services/cart-engine';
import { defineQuantities } from '@/services/order-quantities';
import { executeOrderSubmission } from '@/services/order-submission';
import { pickDefaultOrderType } from '@/services/pos-defaults';

// Slices
import {
    createPosDialogsSlice,
    createCartSlice,
    createPaymentsSlice,
    createCustomerSlice,
    createSessionSlice,
} from '@/hooks/pos';
import type { POSStore } from '@/hooks/pos/pos-store-types';

export type { POSStore } from '@/hooks/pos/pos-store-types';

import { formatCurrency } from '@/utils/format';
import { isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { create } from 'zustand';
import * as math from 'mathjs';


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

export const usePOS = create<POSStore>((set, get) => ({
    // ── Core order state (not owned by any slice) ────────────────────────────
    order: defaultOrder(),
    isSubmitting: false,
    isRefreshing: false,
    refreshPending: false,
    breadcrumbs: [] as any[],
    customers: [] as Customer[],

    // ── Compose slices ────────────────────────────────────────────────────────
    ...createPosDialogsSlice(set, get, {} as any),
    ...createCartSlice(set, get, {} as any),
    ...createPaymentsSlice(set, get, {} as any),
    ...createCustomerSlice(set, get, {} as any),
    ...createSessionSlice(set, get, {} as any),

    // ─────────────────────────────────────────────────────────────────────────
    // Cart orchestration (needs both cart + order state)
    // ─────────────────────────────────────────────────────────────────────────

    buildOrder: (order: Order) => {
        set({ order });
    },

    buildProducts: (products: OrderProduct[]) => {
        const recomputed = get().recomputeProducts(products);
        set({ products: recomputed });
    },

    updateCart: (update: object) => {
        const current = get().order;
        const newOrder = { ...current, ...update };
        set({ order: newOrder });
        get().refreshCart();
    },

    refreshCart: async () => {
        if (get().isRefreshing) {
            set({ refreshPending: true });
            return;
        }

        set({ isRefreshing: true });

        try {
            do {
                set({ refreshPending: false });

                get().checkCart();

                const { order: summedOrder, products: reconciledProducts } = sumProductsTotals(
                    { ...get().order },
                    get().products,
                    (get().options ?? {}) as any,
                );

                // The engine returns recomputed objects instead of mutating
                // store state in place — publish dynamic-product (service
                // line) totals explicitly.
                set({ products: reconciledProducts });

                let order: Order = summedOrder;

                // Compute coupon totals immutably
                const totalValue = order.coupons.map((customerCoupon: any) => {
                    if (customerCoupon.type === 'percentage_discount') {
                        return (order.subtotal * customerCoupon.discount_value) / 100;
                    }
                    return customerCoupon.discount_value;
                });

                order = {
                    ...order,
                    total_coupons:
                        totalValue.length > 0
                            ? totalValue.reduce((before: number, after: number) => before + after, 0)
                            : 0,
                };

                if (order.discount_type === 'percentage') {
                    order = { ...order, discount: (order.discount_percentage * order.subtotal) / 100 };
                }

                if (order.discount > order.subtotal && order.total_coupons === 0) {
                    order = { ...order, discount: order.subtotal };
                    toast.info('The discount has been set to the cart subtotal.');
                }

                order = { ...order, tax_value: 0 };

                // Compute preliminary total so the payment dialog never
                // shows 0 while the async tax API is still in-flight.
                const prelimTotal = math
                    .chain(order.subtotal)
                    .add(order.shipping || 0)
                    .subtract(order.discount)
                    .subtract(order.total_coupons)
                    .done();
                order = { ...order, total: prelimTotal };

                set({ order });

                try {
                    const response = await get().computeTaxes();
                    order = response['data'].order;
                } catch (exception: any) {
                    if (exception !== false && exception.message !== undefined) {
                        toast.error(
                            exception.message ||
                                'An unexpected error has occurred while fetching taxes.',
                            { duration: 0 },
                        );
                    }
                }

                const taxType = order.tax_type;
                const tax_value = order.tax_value;

                let total: number;
                if (taxType === 'exclusive') {
                    const op1 = math
                        .chain(order.subtotal)
                        .add(order.shipping || 0)
                        .add(tax_value)
                        .done();
                    total = math
                        .chain(op1)
                        .subtract(order.discount)
                        .subtract(order.total_coupons)
                        .done();
                } else {
                    const op1 = math.chain(order.subtotal).add(order.shipping || 0).done();
                    total = math
                        .chain(op1)
                        .subtract(order.discount)
                        .subtract(order.total_coupons)
                        .done();
                }

                set({ order: { ...order, total } });
            } while (get().refreshPending);
        } finally {
            set({ isRefreshing: false, refreshPending: false });
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Tax async orchestration
    // ─────────────────────────────────────────────────────────────────────────

    computeTaxes: async () => {
        // Clone — the engine is pure and must never mutate the live store object.
        let order: Order = { ...get().order };
        const options = (get().options ?? {}) as any;

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
            throw new Error('No tax group assigned to the order');
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Session / reset
    // ─────────────────────────────────────────────────────────────────────────

    applyDefaultOrderType: () => {
        // Boot/reset default — never clobbers an explicit selection.
        if (get().order.type) return;

        const identifier = pickDefaultOrderType(get().options?.[POS_OPTION_KEYS.orderTypes]);
        const meta = identifier ? ORDER_TYPE_MAP[identifier] : undefined;
        if (!meta) return;

        set({ order: { ...get().order, type: { ...meta, selected: true } as OrderType } });
    },

    reset: async () => {
        try {
            // reset() creates a fresh order (no type, no customer); the boot
            // default order type is re-applied here because the boot-time
            // page effect only runs once per page load — without this, every
            // new cart after a sale/hold/void has no type while the default
            // customer IS re-assigned by the init queue below.
            set({
                isSubmitting: false,
                order: defaultOrder(),
                products: [],
                customers: [],
                breadcrumbs: [],
                holdPopupEnabled: true,
            });
            get().applyDefaultOrderType();
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
        const minimalPaymentPercent = (_order.customer as any)?.group?.minimal_credit_payment ?? 0;
        const firstPart = math.chain(_order.total).multiply(minimalPaymentPercent).done() as number;
        const expected: number = parseFloat(String(math.chain(firstPart).divide(100).done()));

        // window.confirm removed — it blocks the JS thread, cannot be styled, and is
        // suppressed in iframes/modern browsers. We now proceed directly and let the
        // PaymentGatewayDialog handle all layaway UI through the ConfirmationDialog.
        const result = { order: _order };
        const instalments = result.order.instalments ?? [];

        if (instalments.length === 0 && result.order.tendered < expected) {
            const message = `Before saving this order, a minimum payment of ${formatCurrency(expected)} is required`;
            toast.error('Unable to proceed', { description: message });
            throw new Error(message);
        } else {
            const paymentType = get().selectedPaymentType;
            if (!paymentType) {
                return { status: 'success', message: 'Layaway defined', data: { order: result.order } };
            }
            const expectedSlice = instalments.filter(
                (payment) =>
                    payment.amount >= expected &&
                    isSameDay(payment.date, startOfDay(new Date())),
            );

            if (expectedSlice.length === 0) {
                return {
                    status: 'success',
                    message: 'Layaway defined',
                    data: { order: result.order },
                };
            }

            const firstInstalment = expectedSlice[0];
            const firstSlice = firstInstalment.amount;

            if (firstSlice > 0) {
                return new Promise((resolve, reject) => {
                    toast.info('Initial Payment', {
                        description:
                            `In order to proceed, an initial payment of ${formatCurrency(firstSlice)} is required for the selected payment type "${paymentType.label}". Would you like to proceed?`,
                        action: {
                            label: 'Proceed',
                            onClick: () => {
                                const payment: Payment = {
                                    identifier: paymentType.identifier,
                                    label: paymentType.label,
                                    value: firstSlice,
                                    readonly: false,
                                    selected: true,
                                };
                                get().addPayment(payment);
                                const updatedInstalments = instalments.map((inst) =>
                                    inst === firstInstalment ? { ...inst, paid: true } : inst,
                                );
                                const updatedOrder = { ...result.order, instalments: updatedInstalments };
                                resolve({
                                    status: 'success',
                                    message: 'Layaway defined',
                                    data: { order: updatedOrder },
                                });
                            },
                        },
                        onDismiss: () =>
                            reject(new Error('The request was canceled')),
                    });
                });
            } else {
                return {
                    status: 'success',
                    message: 'Layaway defined',
                    data: { order: result.order },
                };
            }
        }
    },

    submitOrder: async (orderFields: object = {}) => {
        let order = { ...get().order, ...orderFields };

        if (order.payment_status !== 'hold') {
            if (
                order.payments.length === 0 &&
                order.total > 0 &&
                order.total > order.tendered
            ) {
                // Zero recorded payments is an UNPAID submission, not a partial
                // one — gate it on the unpaid policy, mirroring the backend guard
                // (OrdersService: $totalPayments === 0 → allow_unpaid) and
                // validateOrderForSubmission. Gating this case on allowPartial
                // produced the misleading "Partially paid orders are disabled."
                // toast when saving an order as Unpaid. Partial payments
                // (tendered > 0 below the total) are still rejected later in the
                // pipeline by validateOrderForSubmission.
                if (get().options[POS_OPTION_KEYS.allowUnpaid] === 'no') {
                    const message =
                        'Unpaid orders are not allowed. Please add at least one payment.';
                    toast.error(message);
                    throw new Error(message);
                }

                // canProceedAsLaidAway enforces customer-group minimum-payment
                // rules for credit/layaway orders. When the cashier explicitly
                // chooses "Unpaid" (payment_status === 'unpaid'), that intent
                // must be respected as-is — running the layaway guard produces
                // the misleading "minimum payment required" error for a path
                // that has nothing to do with instalments or credit groups.
                if (order.payment_status !== 'unpaid') {
                    const result = await get().canProceedAsLaidAway(order);
                    order = result.data.order;
                }
            }
        }

        if (!get().isSubmitting) {
            set({ isSubmitting: true });
            return get().proceedSubmitting(order);
        }

        const message = 'An order is currently being processed.';
        toast.error(message);
        throw new Error(message);
    },

    proceedSubmitting: async (order: Order) => {
        try {
            const submittedOrder = await executeOrderSubmission(order, get().options);
            get().reset();
            set({ isSubmitting: false });
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

            // Serializable source snapshot (replaces $original closure)
            orderProduct.source = {
                id: orderProduct.product?.id ?? orderProduct.product_id ?? 0,
                category_id: orderProduct.product?.category_id ?? 0,
                tax_type: orderProduct.product?.tax_type ?? orderProduct.tax_type ?? '',
                tax_group: orderProduct.product?.tax_group ?? null,
            };

            // Serializable quantities snapshot (replaces $quantities closure)
            const unitQuantity = (orderProduct.product?.unit_quantities ?? []).filter(
                (uq: any) =>
                    +uq.id === +orderProduct.unit_quantity_id || uq.id === undefined,
            )[0];

            if (unitQuantity) {
                const uq = { ...unitQuantity };
                if (orderProduct.mode === 'custom') {
                    uq.custom_price_edit = orderProduct.unit_price;
                    uq.custom_price_with_tax = orderProduct.price_with_tax;
                    uq.custom_price_without_tax = orderProduct.price_without_tax;
                    uq.custom_price_tax = orderProduct.tax_value;
                }
                orderProduct.quantities = uq;
            }
            products.push(orderProduct);
        }

        // The API can return `type` as either a plain string identifier
        // (e.g. "takeaway") or a full object ({ identifier, label, icon }).
        // Normalise to the identifier string first, then look up the full
        // OrderType object from the store's loaded types or — when defineTypes
        // hasn't run yet (e.g. loading a held order right after page load) —
        // fall back to the static ORDER_TYPE_MAP.
        const rawType: any = (fullOrder as any).type;
        const typeIdentifier: string | undefined =
            typeof rawType === 'string'
                ? rawType
                : typeof rawType === 'object' && rawType !== null
                  ? rawType.identifier
                  : undefined;

        const resolvedType =
            Object.values(get().types).find((t: any) => t.identifier === typeIdentifier) ??
            (typeIdentifier ? ORDER_TYPE_MAP[typeIdentifier] : undefined);

        (fullOrder as any).type = resolvedType ?? undefined;

        fullOrder.addresses = {
            shipping: (order as any).shipping_address,
            billing: (order as any).billing_address,
        };

        delete (fullOrder as any).shipping_address;
        delete (fullOrder as any).billing_address;

        get().buildOrder(fullOrder);
        get().buildProducts(products);
        // fullOrder.customer is guaranteed to be set by API at this point
        await get().selectCustomer(fullOrder.customer as Customer);

        return fullOrder;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Order field setters
    // ─────────────────────────────────────────────────────────────────────────

    setDiscount: (value: number, type: 'flat' | 'percentage' = 'flat') => {
        // ✅ Always spread — never mutate the reference from get()
        const current = get().order;
        const order: Order = {
            ...current,
            discount: type === 'percentage' ? (value / 100) * current.subtotal : value,
            discount_type: type,
            discount_percentage: type === 'percentage' ? value : current.discount_percentage,
        };
        set({ order });
        get().refreshCart();
    },

    setShipping: (value: number, shippingType: string = 'flat') => {
        // ✅ Spread first
        const order: Order = { ...get().order, shipping: value, shipping_type: shippingType as any };
        set({ order });
        get().refreshCart();
    },

    setNote: (note: string, visibility: 'hidden' | 'visible' = 'hidden') => {
        // ✅ Spread first
        const order: Order = { ...get().order, note, note_visibility: visibility };
        set({ order });
    },

    setOrderType: (type: OrderType) => {
        // ✅ Spread first
        const order: Order = {
            ...get().order,
            type,
            shipping: type.identifier === 'takeaway' ? 0 : get().order.shipping,
        };
        set({ order });
        get().refreshCart();
    },

    updateAddress: (type: 'billing' | 'shipping', address: any) => {
        // ✅ Spread first
        const current = get().order;
        const order: Order = { ...current, addresses: { ...current.addresses, [type]: address } };
        set({ order });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Receipt printing (stub — wired to print-agent-service in Step 3)
    // ─────────────────────────────────────────────────────────────────────────

    printOrderReceipt: (order: Order, mode?: string): Promise<PrintResult | false> => {
        const { options } = get();

        if (options[POS_OPTION_KEYS.printingEnabledFor] === 'disabled') {
            return Promise.resolve(false);
        }

        // Fall back to the configured printed document when the caller
        // doesn't explicitly request a mode.
        const resolvedMode = mode || (options[POS_OPTION_KEYS.printingDocument] as string) || 'sale';

        const shouldPrint =
            options[POS_OPTION_KEYS.printingEnabledFor] === 'all_orders' ||
            (options[POS_OPTION_KEYS.printingEnabledFor] === 'partially_paid_orders' &&
                ['paid', 'partially_paid'].includes(order.payment_status as string)) ||
            (options[POS_OPTION_KEYS.printingEnabledFor] === 'only_paid_orders' &&
                ['paid'].includes(order.payment_status as string));

        if (!shouldPrint) return Promise.resolve(false);

        // Delegate to PrintAgentService — maps Order → FormattedReceiptData internally.
        // Resolves with the print result so callers can surface retry affordances;
        // never rejects (print failures resolve with { success: false }).
        // The receipt mirrors the "Show Price With Tax" option so printed items
        // match what the cashier saw in the cart.
        return printAgentService.printOrderReceipt(
            order,
            resolvedMode,
            {
                autoPrintOnSale: options[POS_OPTION_KEYS.printingAuto] ?? true,
            },
            isPriceWithTax(options),
        );
    },
}));

import { Customer } from '@/interfaces/customer';
import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';
import { OrderType } from '@/interfaces/order-type';
import { Payment } from '@/interfaces/payment';
import { PaymentType } from '@/interfaces/payment-type';
import { ProductUnitQuantity } from '@/interfaces/product-unit-quantity';
import { customersApi, ordersApi, taxesApi, usersApi } from '@/api';
import { isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { create } from 'zustand';
// import Print from '@/libraries/print';
import Tax from '@/libraries/tax';
import { formatCurrency, rawCurrency } from '@/utils/format';
import * as math from 'mathjs';

const __ = (ns: any) => {
    return ns;
};

interface DialogMap {
    selectQuantity: UnitQuantity;
}
type DialogKey = keyof DialogMap;

interface POSState {
    products: OrderProduct[];
    breadcrumbs: any[];
    customers: Customer[];
    settings: { [key: string]: any };
    types: OrderType[];
    orderTypeProcessQueue: { identifier: string; promise: (selectedType: OrderType) => Promise<any> }[];
    paymentsType: PaymentType[];
    order: Order;
    screen: string;
    holdPopupEnabled: boolean;
    initialQueue: (() => Promise<any>)[];
    options: { [key: string]: any };
    visibleSection: 'cart' | 'grid' | 'both';
    isSubmitting: boolean;
    processingAddQueue: boolean;
    selectedPaymentType: PaymentType | null;
    userPermissions: { [key: string]: any }[];
    autoMerge: boolean;
    initialized: boolean;
    // print: Print;

    // dialogs
    openDialogs: Partial<Record<DialogKey, boolean>>;
    resolvers: Partial<{ [K in DialogKey]: (value: DialogMap[K] | null) => void }>;

    openDialog: <K extends DialogKey>(key: K) => Promise<DialogMap[K] | null>;
    closeDialog: <K extends DialogKey>(key: K, value?: DialogMap[K] | null) => void;
}

interface POSActions {
    initialize: () => void;
    reset: () => Promise<void>;
    getSalePrice: (item: ProductUnitQuantity | undefined) => number;
    getCustomPrice: (item: any) => number;
    getWholesalePrice: (item: any) => number;
    setHoldPopupEnabled: (status?: boolean) => void;
    getHoldPopupEnabled: () => boolean;
    processInitialQueue: () => Promise<void>;
    removeCoupon: (coupon: any) => void;
    pushCoupon: (coupon: any) => void;
    defineOptions: (options: any) => void;
    defineSettings: (settings: any) => void;
    changeVisibleSection: (section: 'cart' | 'grid' | 'both') => void;
    addPayment: (payment: Payment) => void;
    removePayment: (payment: Payment) => void;
    updateCustomerAccount: (payment: Payment) => void;
    getPriceWithoutTax: (value: number, rate: number, type: string) => number;
    getPriceWithTax: (value: number, rate: number, type: string) => number;
    getVatValue: (value: number, rate: number, type: string) => number;
    computeTaxes: () => Promise<any>;
    computeOrderTaxGroup: (order: Order, taxGroup: any) => Order;
    computeOrderTaxes: (order: Order) => Order;
    sumProductsTaxes: (order: Order) => Order;
    canProceedAsLaidAway: (_order: Order) => Promise<any>;
    submitOrder: (orderFields?: object) => Promise<any>;
    proceedSubmitting: (order: Order) => Promise<any>;
    defineQuantities: (product: any, units?: any[]) => Promise<any>;
    loadOrder: (order_id: number) => Promise<any>;
    buildOrder: (order: Order) => void;
    buildProducts: (products: OrderProduct[]) => void;
    printOrderReceipt: (order: Order, mode: string) => boolean;
    computePaid: () => void;
    setPaymentActive: (payment: PaymentType) => void;
    definedPaymentsType: (payments: PaymentType[]) => void;
    selectCustomer: (customer: Customer) => Promise<any>;
    updateCart: (update: object) => void;
    checkCart: () => void;
    sumProductsTotals: (order: Order) => Order;
    getStockUsage: (product_id: number, unit_quantity_id: number) => number;
    addToCart: (product: any) => Promise<void>;
    defineTypes: (types: OrderType[]) => void;
    userCan: (permission: string) => boolean;
    removeProductUsingIndex: (index: number) => Promise<void>;
    resumeRemovingProductUsingIndex: (index: number, products: OrderProduct[]) => void;
    removeProduct: (product: OrderProduct) => void;
    updateProduct: (product: OrderProduct, data: object, index?: number | null) => void;
    recomputeProducts: (products?: OrderProduct[] | null) => void;
    getProductUnitPrice: (mode: string, quantities: any) => number;
    computeProductTax: (product: OrderProduct) => OrderProduct;
    proceedProductTaxComputation: (
        product: OrderProduct,
        price: number,
    ) => { price_without_tax: number; tax_value: number; price_with_tax: number; total_tax_value: number };
    computeCustomProductTax: (product: OrderProduct) => OrderProduct;
    computeNormalProductTax: (product: OrderProduct) => OrderProduct;
    computeWholesaleProductTax: (product: OrderProduct) => OrderProduct;
    getPrice: (quantities: any, mode: string, type: string) => number;
    computeProduct: (product: OrderProduct) => void;
    computeProductTaxValue: (product: OrderProduct) => void;
    computeTaxForGroup: (price: number, tax_group: any, tax_type: string) => any;
    runPaymentQueue: () => Promise<any>;
    loadCustomer: (id: number) => Promise<any>;
    refreshCart: () => Promise<any>;
    setDiscount: (value: number, type?: 'flat' | 'percentage') => void;
    setShipping: (value: number, shippingType?: string) => void;
    setNote: (note: string, visibility?: 'hidden' | 'visible') => void;
    setOrderType: (type: OrderType) => void;
    updateAddress: (type: 'billing' | 'shipping', address: any) => void;
    clearCart: () => void;
    setAutoMerge: (enabled: boolean) => void;
}

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

export const usePOS = create<POSState & POSActions>((set, get) => ({
    // Initial State
    products: [],
    breadcrumbs: [],
    customers: [],
    settings: {},
    types: [],
    orderTypeProcessQueue: [],
    paymentsType: [],
    order: defaultOrder(),
    screen: '',
    holdPopupEnabled: true,
    initialQueue: [],
    options: {},
    visibleSection: 'both',
    isSubmitting: false,
    processingAddQueue: false,
    selectedPaymentType: null,
    userPermissions: [],
    autoMerge: false,
    initialized: false,
    // print: new Print({
    //   urls: (window as any).systemUrls,
    //   options: (window as any).systemOptions,
    // }),
    //
    // dialogs
    openDialogs: {},
    resolvers: {},

    openDialog: (key) => {
        return new Promise<any>((resolve) => {
            set((state) => ({
                openDialogs: { ...state.openDialogs, [key]: true },
                resolvers: { ...state.resolvers, [key]: resolve },
            }));
        });
    },

    closeDialog: (key, value = null) => {
        const { resolvers } = get();
        resolvers[key]?.(value as any);
        set((state) => {
            const newOpen = { ...state.openDialogs, [key]: false };
            const newResolvers = { ...state.resolvers, [key]: undefined };
            return { openDialogs: newOpen, resolvers: newResolvers };
        });
    },

    // Actions
    initialize: () => {
        // Guard: only run once. The store is a module-level singleton so this
        // survives React Strict Mode's double-mount/unmount cycles, unlike useRef.
        if (get().initialized) return;
        set({ initialized: true });

        const { orderTypeProcessQueue, initialQueue } = get();
        set({
            orderTypeProcessQueue: [
                ...orderTypeProcessQueue,
                // delivery, // Assuming delivery is an object with a specific structure
            ],
        });

        const newInitialQueue = [
            ...initialQueue,
            async () => {
                try {
                    const userPermissions = await usersApi.getPermissions();
                    set({ userPermissions });
                    return userPermissions;
                } catch (error) {
                    throw error;
                }
            },
            () => {
                const { options, order } = get();
                const newOrder = { ...order, tax_type: options.ns_jgrem_tax_type };

                if (options.ns_jgrem_tax_group !== false) {
                    newOrder.tax_group_id = options.ns_jgrem_tax_group;
                }
                set({ order: newOrder });

                return {
                    status: 'success',
                    message: 'tax group assignated',
                };
            },
            async () => {
                const { options } = get();
                if (options.ns_customers_default && options.ns_customers_default !== 'no' && options.ns_customers_default !== false) {
                    try {
                        const customer = await customersApi.get(options.ns_customers_default);
                        get().selectCustomer(customer);
                        return {
                            status: 'success',
                            message: __('The customer has been loaded'),
                        };
                    } catch (error) {
                        toast.error(__('An error has occured'), {
                            description: __(
                                'Unable to select the default customer. Looks like the customer no longer exists. Consider changing the default customer on the settings.',
                            ),
                            action: {
                                label: __('Read More'),
                                onClick: () => window.open('https://my.nexopos.com/en/documentation/troubleshooting/no-default-customer', '_blank'),
                            },
                        });
                        throw error;
                    }
                } else {
                    return {
                        status: 'success',
                        message: __('No default customer is selected.'),
                    };
                }
            },
        ];

        set({ initialQueue: newInitialQueue });

        get().refreshCart();

        window.addEventListener('resize', () => {
            // This needs the responsive library
            // get()._responsive.detect();
        });

        window.onbeforeunload = () => {
            if (get().products.length > 0) {
                return __('Some products has been added to the cart. Would you like to discard this order ?');
            }
        };
    },

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

    getSalePrice: (item) => {
        const { options } = get();
        let price = 0;

        if (options.ns_jgrem_price_with_tax === 'yes') {
            price = rawCurrency(item?.sale_price_with_tax);
        } else {
            price = rawCurrency(item?.sale_price_without_tax);
        }

        return price;
    },

    getCustomPrice: (item) => {
        const { options } = get();
        let customPrice = 0;
        if (options.ns_jgrem_price_with_tax === 'yes') {
            customPrice = rawCurrency(item.custom_price_with_tax);
        } else {
            customPrice = rawCurrency(item.custom_price_without_tax);
        }

        return customPrice;
    },

    getWholesalePrice: (item) => {
        const { options } = get();
        let wholeSalePrice = 0;
        if (options.ns_jgrem_price_with_tax === 'yes') {
            wholeSalePrice = rawCurrency(item.wholesale_price_with_tax);
        } else {
            wholeSalePrice = rawCurrency(item.wholesale_price_without_tax);
        }

        return wholeSalePrice;
    },

    setHoldPopupEnabled: (status = true) => {
        set({ holdPopupEnabled: status });
    },

    getHoldPopupEnabled: () => {
        return get().holdPopupEnabled;
    },

    processInitialQueue: async () => {
        const { initialQueue } = get();
        for (const queueItem of initialQueue) {
            try {
                await Promise.race([queueItem(), new Promise((_, timeoutReject) => setTimeout(() => timeoutReject(new Error('Timeout')), 60000))]);
            } catch (exception: any) {
                toast.error(exception.message);
                throw exception;
            }
        }
    },

    removeCoupon: (coupon) => {
        const order = get().order;
        const coupons = order.coupons;
        const index = coupons.indexOf(coupon);
        coupons.splice(index, 1);
        order.coupons = coupons;
        set({ order });
    },

    pushCoupon: (coupon) => {
        const order = get().order;

        order.coupons.forEach((_coupon) => {
            if (_coupon.code === coupon.code) {
                const message = __('This coupon is already added to the cart');
                toast.error(message);
                throw message;
            }
        });

        order.coupons.push(coupon);
        set({ order });
        get().refreshCart();
    },

    defineOptions: (options) => {
        set({ options });
    },

    defineSettings: (settings) => {
        set({ settings });
    },

    changeVisibleSection: (section) => {
        if (['both', 'cart', 'grid'].includes(section)) {
            if (['cart', 'both'].includes(section)) {
                get().refreshCart();
            }
            set({ visibleSection: section });
        }
    },

    addPayment: (payment) => {
        if (payment.value > 0) {
            const order = get().order;
            order.payments.push(payment);
            set({ order });
            get().computePaid();
        } else {
            toast.error('Invalid amount.');
        }
    },

    removePayment: (payment) => {
        if (payment.id !== undefined) {
            toast.error(__('Unable to delete a payment attached to the order.'));
            return;
        }

        const order = get().order;
        const index = order.payments.indexOf(payment);
        order.payments.splice(index, 1);
        set({ order });

        get().updateCustomerAccount(payment);
        get().computePaid();
    },

    updateCustomerAccount: (payment) => {
        if (payment.identifier === 'account-payment') {
            const customer = get().order.customer;
            customer.account_amount += payment.value;
            get().selectCustomer(customer);
        }
    },

    getPriceWithoutTax: (value, rate, type) => {
        if (type === 'inclusive') {
            return Tax.computeInclusive(value, rate);
        } else if (type === 'exclusive') {
            return value;
        }
        return value;
    },

    getPriceWithTax: (value, rate, type) => {
        if (type === 'inclusive') {
            return value;
        } else if (type === 'exclusive') {
            return Tax.computeExclusive(value, rate);
        }
        return value;
    },

    getVatValue: (value, rate, type) => {
        if (type === 'inclusive') {
            return value - get().getPriceWithoutTax(value, rate, type);
        } else if (type === 'exclusive') {
            return get().getPriceWithTax(value, rate, type) - value;
        }
        return 0;
    },

    computeTaxes: async () => {
        let order = get().order;

        if (order.tax_group_id === undefined || order.tax_group_id === null) {
            order = get().computeOrderTaxes(order);
            return { data: { order }, status: 'success' };
        }

        const group = order.tax_group;

        if (group.id !== undefined) {
            if (group.id === order.tax_group_id) {
                // computeOrderTaxGroup internally calls computeOrderTaxes,
                // so order.tax_value is correctly set after this call.
                order = get().computeOrderTaxGroup(order, group);
            }
            return { status: 'success', data: { tax: group, order } };
        }

        if (![undefined, null].includes(order.tax_group_id) && order.tax_group_id.toString().length > 0) {
            try {
                const tax = await taxesApi.getGroup(order.tax_group_id);
                // computeOrderTaxGroup internally calls computeOrderTaxes.
                order = get().computeOrderTaxGroup(order, tax);
                return { status: 'success', data: { tax, order } };
            } catch (error) {
                throw error;
            }
        } else {
            throw { status: 'error', message: __('No tax group assigned to the order') };
        }
    },


    computeOrderTaxGroup: (order, taxGroup) => {
        const summarizedRates = taxGroup.taxes.map((tax: any) => parseFloat(tax.rate)).reduce((b: number, a: number) => b + a, 0);
        const currentVatValue = get().getVatValue(order.subtotal - order.discount, summarizedRates, order.tax_type);

        taxGroup.taxes = taxGroup.taxes.map((_tax: any) => {
            const currentPercentage = math.chain(math.chain(_tax.rate).divide(summarizedRates).done()).multiply(100).done();
            return {
                id: _tax.id,
                tax_id: _tax.tax_id,
                name: _tax.name,
                rate: parseFloat(_tax.rate),
                tax_value: math.chain(math.chain(currentVatValue).multiply(currentPercentage).done()).divide(100).done(),
            };
        });

        if (taxGroup.taxes.length === 0) {
            toast.error(__("The selected tax group doesn't have any assigned sub taxes. This might cause wrong figures."), { duration: 0 });
            return order;
        }

        order.tax_group = order.tax_group || {};
        order.taxes = taxGroup.taxes;
        order.tax_group = taxGroup;

        return get().computeOrderTaxes(order);
    },

    computeOrderTaxes: (order) => {
        const { options } = get();
        const posVat = options.ns_jgrem_vat;

        if (['flat_vat', 'variable_vat'].includes(posVat) && order.taxes && order.taxes.length > 0) {
            order.tax_value += order.taxes.map((tax: any) => tax.tax_value).reduce((before: number, after: number) => before + after);
        }

        return order;
    },

    sumProductsTaxes: (order) => {
        const { products, options } = get();
        const posVat = options.ns_jgrem_vat;

        order.products = products;
        order.total_products = products.length;

        if (['products_vat'].includes(posVat)) {
            const totalTaxValue = products.map((product: OrderProduct) => product.total_tax_value);
            if (totalTaxValue.length > 0) {
                order.products_tax_value = totalTaxValue.reduce((before: number, after: number) => before + after);
            }
        }

        if (options.ns_jgrem_price_with_tax === 'no') {
            order.subtotal = math.chain(order.subtotal).add(order.products_tax_value).done();
        }

        return order;
    },

    canProceedAsLaidAway: async (_order) => {
        const minimalPaymentPercent = _order.customer.group.minimal_credit_payment;
        const firstPart = math.chain(_order.total).multiply(minimalPaymentPercent).done();
        let expected: any = math.chain(firstPart).divide(100).done();
        expected = parseFloat(expected);

        // Replace Popup.show with a promise-based toast confirmation
        const result = await new Promise<{ order: Order }>((resolve, reject) => {
            // This is a placeholder for a proper modal implementation
            // Using a simple confirm for now.
            if (window.confirm('Configure layaway payment?')) {
                // Here you would open a modal to configure installments
                // For now, we\'ll just resolve with the order.
                resolve({ order: _order });
            } else {
                reject({ status: 'error', message: 'Layaway configuration canceled.' });
            }
        });

        if (result.order.instalments.length === 0 && result.order.tendered < expected) {
            const message = __(`Before saving this order, a minimum payment of {amount} is required`).replace('{amount}', formatCurrency(expected));
            toast.error(__('Unable to proceed'), { description: message });
            throw { status: 'error', message };
        } else {
            const paymentType = get().selectedPaymentType;
            const expectedSlice = result.order.instalments.filter(
                (payment) => payment.amount >= expected && isSameDay(payment.date, startOfDay(new Date())),
            );

            if (expectedSlice.length === 0) {
                return { status: 'success', message: __('Layaway defined'), data: { order: result.order } };
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
                                resolve({ status: 'success', message: __('Layaway defined'), data: { order: result.order } });
                            },
                        },
                        onDismiss: () => reject({ status: 'error', message: __('The request was canceled') }),
                    });
                });
            } else {
                return { status: 'success', message: __('Layaway defined'), data: { order: result.order } };
            }
        }
    },

    submitOrder: async (orderFields = {}) => {
        let order = {
            ...get().order,
            ...orderFields,
        };

        const minimalPayment = order.customer?.group?.minimal_credit_payment || 0;

        if (order.payment_status !== 'hold') {
            if (order.payments.length === 0 && order.total > 0 && order.total > order.tendered) {
                if (get().options.ns_orders_allow_partial === 'no') {
                    const message = __('Partially paid orders are disabled.');
                    toast.error(message);
                    throw { status: 'error', message };
                } else if (get().options.ns_orders_allow_unpaid === 'no') {
                    // partial is allowed but unpaid orders are not — must provide at least one payment
                    const message = __('Unpaid orders are not allowed. Please add at least one payment.');
                    toast.error(message);
                    throw { status: 'error', message };
                } else if (minimalPayment >= 0) {
                    try {
                        const result = await get().canProceedAsLaidAway(order);
                        order = result.data.order;
                    } catch (exception) {
                        throw exception;
                    }
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

    proceedSubmitting: async (order) => {
        // Ensure coupons have coupon_id for the backend
        const orderToSubmit = {
            ...order,
            coupons: order.coupons?.map((c: any) => ({
                ...c,
                coupon_id: c.coupon_id || c.id
            }))
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

    defineQuantities: async (product, units = []) => {
        const unit = units.filter((u) => u.id === product.unit_id);
        const quantities = {
            unit: unit[0] || {},
            sale_price_with_tax: product.mode === 'normal' ? parseFloat(product.price_with_tax) : 0,
            sale_price_without_tax: product.mode === 'normal' ? parseFloat(product.price_without_tax) : 0,
            sale_price: product.mode === 'normal' ? parseFloat(product.unit_price) : 0,
            sale_price_tax: product.mode === 'normal' ? product.tax_value : 0,
            sale_price_edit: 0,
            wholesale_price_with_tax: product.mode === 'wholesale' ? parseFloat(product.price_with_tax) : 0,
            wholesale_price_without_tax: product.mode === 'wholesale' ? parseFloat(product.price_without_tax) : 0,
            wholesale_price: product.mode === 'wholesale' ? parseFloat(product.unit_price) : 0,
            wholesale_price_tax: product.mode === 'wholesale' ? product.tax_value : 0,
            wholesale_price_edit: 0,
            custom_price_with_tax: product.mode === 'custom' ? parseFloat(product.price_with_tax) : 0,
            custom_price_without_tax: product.mode === 'custom' ? parseFloat(product.price_without_tax) : 0,
            custom_price: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
            custom_price_tax: product.mode === 'custom' ? product.tax_value : 0,
            custom_price_edit: product.mode === 'custom' ? parseFloat(product.unit_price) : 0,
        };

        if (['inclusive', 'exclusive'].includes(product.tax_type)) {
            try {
                if (product.tax_group_id) {
                    const taxGroup = await taxesApi.getGroup(product.tax_group_id);
                    ['sale', 'wholesale', 'custom'].forEach((label) => {
                        quantities[label + '_price_tax'] = taxGroup.taxes
                            .map((tax: any) => get().getVatValue(quantities[label + '_price'], tax.rate, product.tax_type))
                            .reduce((b: number, a: number) => b + a, 0);
                        quantities['gross_' + label + '_price'] = quantities[label + '_price'] + quantities[label + '_price_tax'];
                        quantities['net_' + label + '_price'] = quantities[label + '_price'] - quantities[label + '_price_tax'];
                    });
                    return quantities;
                } else {
                    quantities.sale_price_tax = 0;
                    quantities.wholesale_price_tax = 0;
                    quantities.sale_price_without_tax = product.unit_price;
                    return quantities;
                }
            } catch (exception) {
                toast.error(__('An error has occurred while computing the product.'));
                throw exception;
            }
        }

        return quantities;
    },

    loadOrder: async (order_id) => {
        try {
            const order = await ordersApi.getForPos(order_id);

            const fullOrder = { ...defaultOrder(), ...order };
            const products: OrderProduct[] = [];

            for (let i = 0; i < fullOrder.products.length; i++) {
                const orderProduct = fullOrder.products[i];

                if (orderProduct.product === null) {
                    orderProduct.product = {
                        mode: 'custom',
                        name: orderProduct.name,
                        unit_id: orderProduct.unit_id,
                        unit_quantities: [await get().defineQuantities(orderProduct)],
                    };
                }

                orderProduct.$original = () => orderProduct.product;
                orderProduct.$quantities = () => {
                    const unitQuantity = orderProduct.product.unit_quantities.filter(
                        (uq: any) => +uq.id === +orderProduct.unit_quantity_id || uq.id === undefined,
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

            fullOrder.type = Object.values(get().types).filter((type: any) => type.identifier === fullOrder.type)[0];
            fullOrder.addresses = {
                shipping: order.shipping_address,
                billing: order.billing_address,
            };

            delete fullOrder.shipping_address;
            delete fullOrder.billing_address;

            get().buildOrder(fullOrder);
            get().buildProducts(products);
            await get().selectCustomer(fullOrder.customer);

            return fullOrder;
        } catch (error) {
            throw error;
        }
    },

    buildOrder: (order) => {
        set({ order });
    },

    buildProducts: (products) => {
        get().recomputeProducts(products);
        set({ products });
    },

    printOrderReceipt: (order, mode) => {
        const { options, print } = get();

        if (options.ns_jgrem_printing_enabled_for === 'disabled') {
            return false;
        }

        if (
            options.ns_jgrem_printing_enabled_for === 'all_orders' ||
            (options.ns_jgrem_printing_enabled_for === 'partially_paid_orders' && ['paid', 'partially_paid'].includes(order.payment_status)) ||
            (options.ns_jgrem_printing_enabled_for === 'only_paid_orders' && ['paid'].includes(order.payment_status))
        ) {
            print.process(order.id, 'sale', mode);
        } else {
            return false;
        }
    },

    computePaid: () => {
        const order = get().order;
        order.tendered = 0;

        if (order.payments.length > 0) {
            order.tendered = order.payments.map((p: any) => p.value).reduce((b: number, a: number) => a + b);
        }

        if (order.tendered >= order.total) {
            order.payment_status = 'paid';
        } else if (order.tendered > 0 && order.tendered < order.total) {
            order.payment_status = 'partially_paid';
        }

        order.change = order.tendered - order.total;
        set({ order });
    },

    setPaymentActive: (payment) => {
        const payments = get().paymentsType.map((p) => ({
            ...p,
            selected: p.identifier === payment.identifier,
        }));
        set({ paymentsType: payments });
    },

    definedPaymentsType: (payments) => {
        set({ paymentsType: payments });
    },

    selectCustomer: async (customer) => {
        const { order } = get();
        const billing = { ...(customer.billing || {}) };

        if (billing.id !== undefined) {
            delete billing.id;
        }

        const newOrder = {
            ...order,
            customer,
            customer_id: customer.id,
            addresses: { ...order.addresses, billing },
        };

        set({ order: newOrder });

        if (customer.group === undefined || customer.group === null) {
            try {
                const group = await customersApi.getGroup(customer.id);
                const finalOrder = { ...newOrder, customer: { ...customer, group } };
                set({ order: finalOrder });
                return finalOrder;
            } catch (error) {
                throw error;
            }
        } else {
            return newOrder;
        }
    },

    updateCart: (update) => {
        const current = get().order;
        const newOrder = { ...current, ...update };
        set({ order: newOrder });
        get().refreshCart();
    },

    refreshCart: async () => {
        get().checkCart();

        let order = get().sumProductsTotals(get().order);

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
            order.total_coupons = totalValue.reduce((before: number, after: number) => before + after);
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
                toast.error(exception.message || __('An unexpected error has occurred while fecthing taxes.'), { duration: 0 });
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
            order.total = math.chain(op1).subtract(order.discount).subtract(order.total_coupons).done();
        } else {
            const op1 = math
                .chain(order.subtotal)
                .add(order.shipping || 0)
                .done();
            order.total = math.chain(op1).subtract(order.discount).subtract(order.total_coupons).done();
        }

        set({ order });
    },

    checkCart: () => {
        const { order, products } = get();
        const unmatchedConditions: any[] = [];

        order.coupons.forEach((coupon: any) => {
            let isProductValid = true;
            if (coupon.products.length > 0) {
                isProductValid =
                    products.filter((product) => coupon.products.map((p: any) => p.product_id).includes(product.product_id)).length > 0;
                if (!isProductValid && unmatchedConditions.indexOf(coupon) === -1) {
                    unmatchedConditions.push(coupon);
                }
            }

            let isCategoryValid = true;
            if (coupon.categories.length > 0) {
                isCategoryValid =
                    products.filter((product) => coupon.categories.map((p: any) => p.category_id).includes(product.$original().category_id))
                        .length > 0;
                if (!isCategoryValid && unmatchedConditions.indexOf(coupon) === -1) {
                    unmatchedConditions.push(coupon);
                }
            }
        });

        unmatchedConditions.forEach((coupon) => {
            toast.error(
                __('The coupons "%s" has been removed from the cart, as it\'s required conditions are no more meet.').replace('%s', coupon.name),
                {
                    duration: 6000,
                },
            );
            get().removeCoupon(coupon);
        });
    },

    sumProductsTotals: (order) => {
        const { products } = get();
        const total = products.filter((product) => product.product_type !== 'dynamic').map((product) => product.total_price);

        if (total.length > 0) {
            const productTotalValue = total.reduce((b: number, a: number) => b + a);
            let dynamicProductValue = 0;
            const dynamicProducts = products
                .filter((product) => product.product_type === 'dynamic')
                .map((product) => {
                    product.unit_price = (productTotalValue * (product.rate || 0)) / 100;
                    product.total_price = product.unit_price * product.quantity;
                    return product.total_price;
                });

            if (dynamicProducts.length > 0) {
                dynamicProductValue = dynamicProducts.reduce((b: number, a: number) => b + a);
            }
            order.subtotal = productTotalValue + dynamicProductValue;
        } else {
            order.subtotal = 0;
        }

        order = get().sumProductsTaxes(order);
        return order;
    },

    getStockUsage: (product_id, unit_quantity_id) => {
        const stocks = get()
            .products.filter((product) => product.product_id === product_id && product.unit_quantity_id === unit_quantity_id)
            .map((product) => product.quantity);

        if (stocks.length > 0) {
            return stocks.reduce((b: number, a: number) => b + a, 0);
        }

        return 0;
    },

    addToCart: async (product) => {
        const productData = {};
        let cartProduct: OrderProduct = {
            product_id: product.id || product.product_id || 0,
            name: product.name,
            discount_type: product.discount_type || 'percentage',
            discount: product.discount || 0,
            discount_percentage: product.discount_percentage || 0,
            product_type: product.product_type || 'product',
            rate: product.rate || 0,
            quantity: product.quantity || 0,
            tax_group_id: product.tax_group_id,
            tax_type: product.tax_type || undefined,
            tax_value: product.tax_value || 0,
            unit_id: product.unit_id || 0,
            unit_price: product.unit_price || 0,
            price_with_tax: product.price_with_tax || 0,
            price_without_tax: product.price_without_tax || 0,
            unit_name: product.unit_name || '',
            total_price: product.total_price || 0,
            total_price_without_tax: product.total_price_without_tax || 0,
            total_price_with_tax: product.total_price_with_tax || 0,
            total_tax_value: product.total_tax_value || 0,
            mode: product.mode || 'normal',
            order_id: product.order_id || null,
            $original: product.$original || (() => product),
            $quantities: product.$quantities || undefined,
            unit_quantity_id: product.unit_quantity_id || 0,
            _uuid: product._uuid || `${product.id || product.product_id}-${product.unit_id}-${Date.now()}`,
        };

        set({ processingAddQueue: true });

        // The addToCartQueue logic needs to be adapted.

        // For now, we'll just assume it resolves.

        set({ processingAddQueue: false });

        cartProduct = { ...cartProduct, ...productData };

        const products = get().products;
        let newProducts: OrderProduct[];

        if (get().autoMerge) {
            const existingIndex = products.findIndex(
                (p) =>
                    p.product_id === cartProduct.product_id &&
                    p.tax_group_id === cartProduct.tax_group_id &&
                    p.unit_id === cartProduct.unit_id &&
                    p.unit_quantity_id === cartProduct.unit_quantity_id,
            );

            if (existingIndex >= 0) {
                newProducts = products.map((p, i) =>
                    i === existingIndex ? { ...p, quantity: p.quantity + cartProduct.quantity } : p,
                );
            } else {
                newProducts = [cartProduct, ...products];
            }
        } else {
            newProducts = [cartProduct, ...products];
        }

        get().recomputeProducts(newProducts);
        set({ products: newProducts });
        get().refreshCart();

        const url = get().options.ns_jgrem_new_item_audio;
        if (url && url.length > 0) {
            new Audio(url).play();
        }
    },

    defineTypes: (types) => {
        set({ types });
    },

    userCan: (permission) => {
        const { userPermissions } = get();
        return userPermissions.some((p) => p.namespace === permission);
    },

    removeProductUsingIndex: async (index) => {
        const products = get().products;
        const product = products[index];

        if (product.id) {
            try {
                await usersApi.checkPermission('nexopos.pos.delete-order-product');
                get().resumeRemovingProductUsingIndex(index, products);
            } catch (exception: any) {
                toast.error(__('Forbidden Action'), { description: __('You are not allowed to remove this product.') });
            }
        } else {
            get().resumeRemovingProductUsingIndex(index, products);
        }
    },

    resumeRemovingProductUsingIndex: (index, products) => {
        const newProducts = products.filter((_, i) => i !== index);
        set({ products: newProducts });
    },

    removeProduct: (product) => {
        const products = get().products;
        const newProducts = products.filter((p) => p !== product);
        set({ products: newProducts });
        get().refreshCart();
    },

    updateProduct: (product, data, index = null) => {
        const products = get().products;
        const resolvedIndex = index === null ? products.indexOf(product) : index;
        const finalIndex = resolvedIndex === -1 ? 0 : resolvedIndex;

        const newProducts = products.map((p, i) => (i === finalIndex ? { ...p, ...data } : p));

        get().recomputeProducts(newProducts);
        set({ products: newProducts });
        get().refreshCart();
    },

    recomputeProducts: (products = null) => {
        products?.forEach((product: any) => {
            get().computeProduct(product);
        });
    },

    getProductUnitPrice: (mode, quantities) => {
        switch (mode) {
            case 'custom':
                return quantities.custom_price_edit;
            case 'normal':
                return quantities.sale_price_edit;
            case 'wholesale':
                return quantities.wholesale_price_edit;
        }
        return 0;
    },

    computeProductTax: (product) => {
        switch (product.mode) {
            case 'custom':
                return get().computeCustomProductTax(product);
            case 'normal':
                return get().computeNormalProductTax(product);
            case 'wholesale':
                return get().computeWholesaleProductTax(product);
            default:
                return product;
        }
    },

    proceedProductTaxComputation: (product, price) => {
        const originalProduct = product.$original();
        const taxGroup = originalProduct.tax_group;

        let price_without_tax = price;
        let tax_value = 0;
        let price_with_tax = price;
        let total_tax_value = 0;

        if (taxGroup !== undefined && taxGroup !== null && taxGroup.taxes !== undefined) {
            let summarizedRates = 0;

            if (taxGroup.taxes.length > 0) {
                summarizedRates = taxGroup.taxes.map((r: any) => r.rate).reduce((b: number, a: number) => b + a);
            }

            const lineSubtotal = math.chain(price).multiply(product.quantity).done();
            const lineAfterDiscount = math
                .chain(lineSubtotal)
                .subtract(product.discount || 0)
                .done();

            const result = get().computeTaxForGroup(lineAfterDiscount, taxGroup, originalProduct.tax_type);

            total_tax_value = result.tax_value;

            tax_value = math.chain(total_tax_value).divide(product.quantity).done();
            price_with_tax = math.chain(result.price_with_tax).divide(product.quantity).done();
            price_without_tax = math.chain(result.price_without_tax).divide(product.quantity).done();
        }

        return {
            price_without_tax,
            tax_value,
            price_with_tax,
            total_tax_value,
        };
    },

    computeCustomProductTax: (product) => {
        const quantities = product.$quantities();
        const result = get().proceedProductTaxComputation(product, quantities?.custom_price_edit);

        quantities.custom_price_without_tax = result.price_without_tax;
        quantities.custom_price_with_tax = result.price_with_tax;
        quantities.custom_price_tax = result.tax_value;

        product.tax_value = result.tax_value;
        product.total_tax_value = result.total_tax_value;

        product.$quantities = () => {
            return quantities as ProductUnitQuantity;
        };

        return product;
    },

    computeNormalProductTax: (product) => {
        const quantities = product.$quantities();
        const result = get().proceedProductTaxComputation(product, quantities.sale_price_edit);

        quantities.sale_price_without_tax = result.price_without_tax;
        quantities.sale_price_with_tax = result.price_with_tax;
        quantities.sale_price_tax = result.tax_value;

        product.tax_value = result.tax_value;
        product.total_tax_value = result.total_tax_value;

        product.$quantities = () => {
            return quantities as ProductUnitQuantity;
        };

        return product;
    },

    computeWholesaleProductTax: (product) => {
        const quantities = product.$quantities();
        const result = get().proceedProductTaxComputation(product, quantities.wholesale_price_edit);

        quantities.wholesale_price_without_tax = result.price_without_tax;
        quantities.wholesale_price_with_tax = result.price_with_tax;
        quantities.wholesale_price_tax = result.tax_value;

        product.tax_value = result.tax_value;
        product.total_tax_value = result.total_tax_value;

        product.$quantities = () => {
            return quantities as ProductUnitQuantity;
        };

        return product;
    },

    getPrice: (quantities, mode, type) => {
        switch (mode) {
            case 'normal':
                return quantities['sale_price_' + type];
            case 'wholesale':
                return quantities['wholesale_price_' + type];
            case 'custom':
                return quantities['custom_price_' + type];
        }
        return 0;
    },

    computeProduct: (product) => {
        if (product.product_type === 'product') {
            if (product.mode === 'normal' && product.$quantities) {
                // Only read from $quantities when available (i.e. loaded from the catalogue)
                product.unit_price = get().getSalePrice(product.$quantities());
            } else if (product.mode === 'wholesale' && product.$quantities) {
                product.unit_price = get().getWholesalePrice(product.$quantities());
            }
            // For 'custom' mode: always keep product.unit_price as-is (user-set price)
        }

        // get().computeDiscount(product);
        get().computeProductTaxValue(product);

        const unitPrice = product.unit_price;
        product.total_price = math
            .chain(unitPrice)
            .multiply(product.quantity)
            .subtract(product.discount || 0)
            .done();

        if (product.total_tax_value === undefined) {
            product.total_tax_value = math.chain(product.tax_value).multiply(product.quantity).done();
        }

        if (product.price_with_tax !== undefined && product.price_without_tax !== undefined) {
            product.total_price_with_tax = math.chain(product.price_with_tax).multiply(product.quantity).done();
            product.total_price_without_tax = math.chain(product.price_without_tax).multiply(product.quantity).done();
        }

        product;
    },

    computeProductTaxValue: (product) => {
        const tax_group = product.$original().tax_group;
        let unitPrice;

        if (product.mode === 'normal') {
            if (product.tax_type === 'inclusive') {
                unitPrice = product.$quantities?.().sale_price_with_tax;
            } else {
                unitPrice = product.$quantities?.().sale_price_without_tax;
            }
        } else if (product.mode === 'wholesale') {
            if (product.tax_type === 'inclusive') {
                unitPrice = product.$quantities?.().wholesale_price_with_tax;
            } else {
                unitPrice = product.$quantities?.().wholesale_price_without_tax;
            }
        } else {
            unitPrice = product.unit_price;
        }

        const lineSubtotal = math.chain(unitPrice).multiply(product.quantity).done();
        const lineAfterDiscount = math
            .chain(lineSubtotal)
            .subtract(product.discount || 0)
            .done();
        const result = get().computeTaxForGroup(lineAfterDiscount, tax_group, product.tax_type || '');

        product.tax_value = math.chain(result.tax_value).divide(product.quantity).done();
        product.total_tax_value = result.tax_value;
        product.price_with_tax = math.chain(result.price_with_tax).divide(product.quantity).done();
        product.price_without_tax = math.chain(result.price_without_tax).divide(product.quantity).done();
        product.total_price_with_tax = result.price_with_tax;
        product.total_price_without_tax = result.price_without_tax;
    },

    computeTaxForGroup: (price, tax_group, tax_type) => {
        let tax_value = 0;
        let price_with_tax = 0;
        let price_without_tax = 0;
        let taxes: any[] = [];

        if (price <= 0) {
            return {
                ...tax_group,
                taxes: [],
                tax_value: 0,
                price_with_tax: 0,
                price_without_tax: 0,
            };
        }

        if (tax_group) {
            taxes = tax_group.taxes.map((tax: any) => ({
                ...tax,
                tax_value: get().getVatValue(price, tax.rate, tax_type),
            }));
        }

        if (taxes.length > 0) {
            const rate = taxes.map((tax: any) => tax.rate).reduce((b: number, a: number) => b + a, 0);
            tax_value = get().getVatValue(price, rate, tax_type);
            price_without_tax = get().getPriceWithoutTax(price, rate, tax_type);
            price_with_tax = get().getPriceWithTax(price, rate, tax_type);
        } else {
            price_with_tax = price;
            price_without_tax = price;
        }

        return {
            ...tax_group,
            taxes,
            tax_value,
            price_with_tax,
            price_without_tax,
        };
    },

    runPaymentQueue: async () => {
        // const queues = [];
        //
        // for (const queue of queues) {
        //   try {
        //     const promise = new queue(get().order);
        //     await promise.run();
        //   } catch (exception: any) {
        //     console.log(exception);
        //     return false;
        //   }
        // }
    },

    loadCustomer: async (id) => {
        try {
            const customer = await customersApi.get(id);
            get().selectCustomer(customer);
            return customer;
        } catch (error) {
            throw error;
        }
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
        order.addresses = {
            ...order.addresses,
            [type]: address,
        };
        set({ order });
    },

    clearCart: () => {
        set({ products: [] });
        get().refreshCart();
    },

    setAutoMerge: (enabled: boolean) => {
        set({ autoMerge: enabled });
    },
}));

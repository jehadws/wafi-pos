import { Customer } from '@/interfaces/customer';
import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';
import { OrderType } from '@/interfaces/order-type';
import { Payment } from '@/interfaces/payment';
import { PaymentType } from '@/interfaces/payment-type';
import axios from 'axios';
import * as math from 'mathjs';
import { toast } from 'sonner';

// Translation function (placeholder - would be imported from i18n)
const __ = (key: string) => key;

// Comprehensive POS Settings Interface based on pos redo.md
export interface POSSettings {
    // Layout settings
    ns_jgrem_layout: 'grocery_shop' | 'clothing_shop';

    // Audio settings
    ns_jgrem_complete_sale_audio: string | 'disabled';
    ns_jgrem_new_item_audio: string | 'disabled';

    // Printing settings
    ns_jgrem_printing_document: 'invoice' | 'receipt';
    ns_jgrem_printing_enabled_for: 'disabled' | 'all_orders' | 'partially_paid_orders' | 'only_paid_orders';
    ns_jgrem_printing_gateway: 'default';

    // Register settings
    ns_jgrem_registers_enabled: 'yes' | 'no';
    ns_jgrem_idle_counter: 'disabled' | '5min' | '10min' | '15min' | '20min' | '30min';
    ns_jgrem_disbursement: 'yes' | 'no';
    ns_jgrem_registers_default_change_payment_type: number;

    // VAT settings
    ns_jgrem_vat: 'disabled' | 'flat_vat' | 'variable_vat' | 'products_vat';
    ns_jgrem_tax_group: number | null;
    ns_jgrem_tax_type: 'inclusive' | 'exclusive' | false;

    // Keyboard shortcuts
    ns_jgrem_keyboard_cancel_order: string[];
    ns_jgrem_keyboard_hold_order: string[];
    ns_jgrem_keyboard_create_customer: string[];
    ns_jgrem_keyboard_payment: string[];
    ns_jgrem_keyboard_shipping: string[];
    ns_jgrem_keyboard_note: string[];
    ns_jgrem_keyboard_order_type: string[];
    ns_jgrem_keyboard_fullscreen: string[];
    ns_jgrem_keyboard_quick_search: string[];
    ns_jgrem_keyboard_toggle_merge: string[];
    ns_jgrem_amount_shortcut: number | null;

    // Feature toggles
    ns_jgrem_show_quantity: boolean;
    ns_jgrem_items_merge: boolean;
    ns_jgrem_allow_wholesale_price: boolean;
    ns_jgrem_allow_decimal_quantities: boolean;
    ns_jgrem_quick_product: boolean;
    ns_jgrem_quick_product_default_unit: number;
    ns_jgrem_unit_price_ediable: boolean;
    ns_jgrem_price_with_tax: boolean;
    ns_jgrem_order_types: string[];
    ns_jgrem_numpad: 'default' | 'advanced';
    ns_jgrem_force_autofocus: boolean;
    ns_jgrem_hide_exhausted_products: boolean;
    ns_jgrem_hide_empty_categories: boolean;

    // Order settings
    ns_orders_allow_partial: 'yes' | 'no';
    ns_orders_allow_unpaid: 'yes' | 'no';
}

// Define quantities interface for better type safety
interface ProductQuantities {
    unit: any;
    sale_price_with_tax: number;
    sale_price_without_tax: number;
    sale_price: number;
    sale_price_tax: any;
    sale_price_edit: number;
    wholesale_price_with_tax: number;
    wholesale_price_without_tax: number;
    wholesale_price: number;
    wholesale_price_tax: number;
    wholesale_price_edit: number;
    custom_price_with_tax: number;
    custom_price_without_tax: number;
    custom_price: number;
    custom_price_tax: number;
    custom_price_edit: number;
    [key: string]: any; // Allow dynamic access
}

// Extend OrderProduct to include _uuid for cart management
interface CartOrderProduct extends OrderProduct {
    _uuid: string;
}

/**
 * POSManager class handles all POS operations including cart management,
 * tax calculations, order totals, and business logic with high precision using mathjs.
 * This replaces the broken logic in the old usePOS hook.
 */
export class POSManager {
    private settings: POSSettings;
    private orderTypes: OrderType[];
    private paymentTypes: PaymentType[];
    private userPermissions: { [key: string]: any }[];
    private isSubmitting: boolean;
    private processingAddQueue: boolean;

    constructor(settings: POSSettings) {
        this.settings = settings;
        this.orderTypes = [];
        this.paymentTypes = [];
        this.userPermissions = [];
        this.isSubmitting = false;
        this.processingAddQueue = false;
    }

    /**
     * Update POS settings
     */
    updateSettings(settings: POSSettings) {
        this.settings = settings;
    }

    /**
     * Get current POS settings
     */
    getSettings(): POSSettings {
        return this.settings;
    }

    /**
     * Set order types
     */
    setOrderTypes(types: OrderType[]) {
        this.orderTypes = types;
    }

    /**
     * Set payment types
     */
    setPaymentTypes(payments: PaymentType[]) {
        this.paymentTypes = payments;
    }

    /**
     * Set user permissions
     */
    setUserPermissions(permissions: { [key: string]: any }[]) {
        this.userPermissions = permissions;
    }

    /**
     * Check if user has permission
     */
    userCan(permission: string): boolean {
        return this.userPermissions.some((p) => p.namespace === permission);
    }

    /**
     * Check if feature is enabled based on settings
     */
    isFeatureEnabled(feature: keyof POSSettings): boolean {
        const value = this.settings[feature];
        if (typeof value === 'string') {
            return value === 'yes' || value === 'enabled';
        }
        return Boolean(value);
    }

    /**
     * Add a product to the cart with quantity and unit handling
     * Respects ns_jgrem_items_merge setting for combining similar items
     */
    addToCart(order: Order, product: any, quantity: number, unitQuantity: any): Order {
        const cartItem: CartOrderProduct = this.createCartItem(product, quantity, unitQuantity);

        if (this.settings.ns_jgrem_items_merge) {
            // Check for existing item to merge
            const existingIndex = order.products.findIndex(
                (p: any) => p.product_id === cartItem.product_id && p.unit_quantity_id === cartItem.unit_quantity_id,
            );

            if (existingIndex !== -1) {
                // Merge quantities
                const existing = order.products[existingIndex] as CartOrderProduct;
                const newQuantity = existing.quantity + cartItem.quantity;
                return this.updateProductQuantity(order, existing._uuid, newQuantity);
            }
        }

        // Add new item
        const newProducts = [...order.products, cartItem];

        // Play audio if enabled
        if (this.settings.ns_jgrem_new_item_audio && this.settings.ns_jgrem_new_item_audio !== 'disabled') {
            try {
                new Audio(this.settings.ns_jgrem_new_item_audio).play();
            } catch (e) {
                // Ignore audio errors
            }
        }

        return this.recalculateOrder({ ...order, products: newProducts });
    }

    /**
     * Update quantity of an existing cart item
     */
    updateProductQuantity(order: Order, productUuid: string, newQuantity: number): Order {
        if (newQuantity <= 0) {
            return this.removeFromCart(order, productUuid);
        }

        const updatedProducts = order.products.map((product: any) => {
            if (product._uuid === productUuid) {
                const updatedProduct = { ...product, quantity: newQuantity };
                return this.calculateProductTotals(updatedProduct);
            }
            return product;
        });

        return this.recalculateOrder({ ...order, products: updatedProducts });
    }

    /**
     * Remove a product from the cart
     */
    removeFromCart(order: Order, productUuid: string): Order {
        const newProducts = order.products.filter((p: any) => p._uuid !== productUuid);
        return this.recalculateOrder({ ...order, products: newProducts });
    }

    /**
     * Remove product by index with permission check
     */
    async removeProductUsingIndex(order: Order, index: number): Promise<Order> {
        const product = order.products[index];

        if (product.id) {
            try {
                await axios.post(`/api/users/check-permission/`, {
                    permission: 'nexopos.pos.delete-order-product',
                });
                return this.removeFromCartByIndex(order, index);
            } catch (exception: any) {
                toast.error(__('Forbidden Action'), {
                    description: __('You are not allowed to remove this product.'),
                });
                throw exception;
            }
        } else {
            return this.removeFromCartByIndex(order, index);
        }
    }

    /**
     * Remove product by index
     */
    private removeFromCartByIndex(order: Order, index: number): Order {
        const newProducts = [...order.products];
        newProducts.splice(index, 1);
        return this.recalculateOrder({ ...order, products: newProducts });
    }

    /**
     * Apply discount to the entire order
     */
    applyOrderDiscount(order: Order, discountAmount: number, discountType: 'flat' | 'percentage'): Order {
        const updatedOrder = {
            ...order,
            discount: discountType === 'percentage' ? math.multiply(order.subtotal, math.divide(discountAmount, 100)) : discountAmount,
            discount_type: discountType,
        };
        return this.recalculateOrder(updatedOrder);
    }

    /**
     * Apply shipping cost
     */
    applyShipping(order: Order, shippingAmount: number): Order {
        return this.recalculateOrder({ ...order, shipping: shippingAmount });
    }

    /**
     * Add a payment to the order
     */
    addPayment(order: Order, payment: Payment): Order {
        const updatedOrder = { ...order, payments: [...order.payments, payment] };
        return this.recalculateOrder(updatedOrder);
    }

    /**
     * Select customer for the order
     */
    async selectCustomer(order: Order, customer: Customer): Promise<Order> {
        const billing = { ...((customer as any).billing || {}) };

        if (billing.id !== undefined) {
            delete billing.id;
        }

        let updatedCustomer = customer;

        // Load customer group if not present
        if (customer.group === undefined || customer.group === null) {
            try {
                const response = await axios.get(`/api/customers/${customer.id}/group`);
                updatedCustomer = { ...customer, group: response.data };
            } catch (error) {
                throw error;
            }
        }

        const newOrder = {
            ...order,
            customer: updatedCustomer,
            customer_id: customer.id,
            addresses: { ...order.addresses, billing },
        };

        return this.recalculateOrder(newOrder);
    }

    /**
     * Load customer by ID
     */
    async loadCustomer(id: number): Promise<Customer> {
        try {
            const { data: customer } = await axios.get(`/api/customers/${id}`);
            return customer;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Load existing order for editing
     */
    async loadOrder(orderId: number): Promise<Order> {
        try {
            const { data: order } = await axios.get(`/api/orders/${orderId}/pos`);

            const defaultOrder = this.createDefaultOrder();
            const fullOrder = { ...defaultOrder, ...order };
            const products: CartOrderProduct[] = [];

            for (let i = 0; i < fullOrder.products.length; i++) {
                const orderProduct = fullOrder.products[i];

                if (orderProduct.product === null) {
                    orderProduct.product = {
                        mode: 'custom',
                        name: orderProduct.name,
                        unit_id: orderProduct.unit_id,
                        unit_quantities: [await this.defineQuantities(orderProduct)],
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

                products.push({ ...orderProduct, _uuid: `${orderProduct.product_id}-${Date.now()}-${i}` });
            }

            fullOrder.type = this.orderTypes.find((type: any) => type.identifier === fullOrder.type) || undefined;
            fullOrder.addresses = {
                shipping: (order as any).shipping_address,
                billing: (order as any).billing_address,
            };

            delete (fullOrder as any).shipping_address;
            delete (fullOrder as any).billing_address;

            return this.recalculateOrder({ ...fullOrder, products });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Submit order with validation
     */
    async submitOrder(order: Order, orderFields: object = {}): Promise<any> {
        const finalOrder = { ...order, ...orderFields };

        const minimalPayment = finalOrder.customer?.group?.minimal_credit_payment || 0;

        if (finalOrder.payment_status !== 'hold') {
            if (finalOrder.payments.length === 0 && finalOrder.total > 0 && finalOrder.total > finalOrder.tendered) {
                if (this.settings.ns_orders_allow_partial === 'no') {
                    const message = __('Partially paid orders are disabled.');
                    toast.error(message);
                    throw { status: 'error', message };
                } else if (minimalPayment >= 0) {
                    try {
                        const result = await this.canProceedAsLaidAway(finalOrder);
                        finalOrder.instalments = result.data.order.instalments;
                    } catch (exception) {
                        throw exception;
                    }
                }
            }
        }

        if (this.isSubmitting) {
            const message = __('An order is currently being processed.');
            toast.error(message);
            throw { status: 'error', message };
        }

        this.isSubmitting = true;
        try {
            return await this.proceedSubmitting(finalOrder);
        } finally {
            this.isSubmitting = false;
        }
    }

    /**
     * Process order submission
     */
    private async proceedSubmitting(order: Order): Promise<any> {
        const method = order.id !== undefined ? 'put' : 'post';

        try {
            const response = await axios[method](`/api/orders${order.id !== undefined ? '/' + order.id : ''}`, order);

            // Play completion audio
            if (this.settings.ns_jgrem_complete_sale_audio && this.settings.ns_jgrem_complete_sale_audio !== 'disabled') {
                try {
                    new Audio(this.settings.ns_jgrem_complete_sale_audio).play();
                } catch (e) {
                    // Ignore audio errors
                }
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if order can proceed as layaway
     */
    private async canProceedAsLaidAway(order: Order): Promise<any> {
        const minimalPaymentPercent = order.customer?.group?.minimal_credit_payment || 0;
        const firstPart = math.multiply(order.total, minimalPaymentPercent);
        let expected: any = math.divide(firstPart, 100);
        expected = parseFloat(expected);

        // Simplified layaway logic - in real implementation this would show a modal
        if (order.instalments && order.instalments.length === 0 && order.tendered < expected) {
            const message = __('Before saving this order, a minimum payment of {amount} is required').replace(
                '{amount}',
                this.formatCurrency(expected),
            );
            toast.error(__('Unable to proceed'), { description: message });
            throw { status: 'error', message };
        }

        return { status: 'success', message: __('Layaway defined'), data: { order } };
    }

    /**
     * Define quantities for a product with tax calculations
     */
    async defineQuantities(product: any, units: any[] = []): Promise<ProductQuantities> {
        const unit = units.filter((u) => u.id === product.unit_id);
        const quantities: ProductQuantities = {
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
                    const { data: taxGroup } = await axios.get(`/api/taxes/groups/${product.tax_group_id}`);
                    ['sale', 'wholesale', 'custom'].forEach((label) => {
                        quantities[label + '_price_tax'] = taxGroup.taxes
                            .map((tax: any) => this.getVatValue(quantities[label + '_price'], tax.rate, product.tax_type))
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
    }

    /**
     * Print order receipt based on settings
     */
    printOrderReceipt(order: Order, mode: string): boolean {
        if (this.settings.ns_jgrem_printing_enabled_for === 'disabled') {
            return false;
        }

        const statusMatches =
            this.settings.ns_jgrem_printing_enabled_for === 'all_orders' ||
            (this.settings.ns_jgrem_printing_enabled_for === 'partially_paid_orders' &&
                ['paid', 'partially_paid'].includes(order.payment_status || 'unpaid')) ||
            (this.settings.ns_jgrem_printing_enabled_for === 'only_paid_orders' && ['paid'].includes(order.payment_status || 'unpaid'));

        if (statusMatches) {
            // In a real implementation, this would integrate with a printing service
            // print.process(order.id, 'sale', mode);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Check if decimal quantities are allowed
     */
    allowDecimalQuantities(): boolean {
        return this.settings.ns_jgrem_allow_decimal_quantities;
    }

    /**
     * Check if wholesale prices are allowed
     */
    allowWholesalePrice(): boolean {
        return this.settings.ns_jgrem_allow_wholesale_price;
    }

    /**
     * Get allowed order types
     */
    getAllowedOrderTypes(): string[] {
        return this.settings.ns_jgrem_order_types;
    }

    /**
     * Check if autofocus is forced
     */
    forceAutofocus(): boolean {
        return this.settings.ns_jgrem_force_autofocus;
    }

    /**
     * Check if quantity should be shown
     */
    showQuantity(): boolean {
        return this.settings.ns_jgrem_show_quantity;
    }

    /**
     * Get default unit for quick products
     */
    getQuickProductDefaultUnit(): number {
        return this.settings.ns_jgrem_quick_product_default_unit;
    }

    /**
     * Check if unit price is editable
     */
    unitPriceEditable(): boolean {
        return this.settings.ns_jgrem_unit_price_ediable;
    }

    /**
     * Get numpad type
     */
    getNumpadType(): 'default' | 'advanced' {
        return this.settings.ns_jgrem_numpad;
    }

    /**
     * Check if exhausted products should be hidden
     */
    hideExhaustedProducts(): boolean {
        return this.settings.ns_jgrem_hide_exhausted_products;
    }

    /**
     * Check if empty categories should be hidden
     */
    hideEmptyCategories(): boolean {
        return this.settings.ns_jgrem_hide_empty_categories;
    }

    /**
     * Calculate all order totals (subtotal, tax, discount, total)
     */
    public recalculateOrder(order: Order): Order {
        let updatedOrder = { ...order };

        // Step 1: Calculate product-level totals
        updatedOrder.products = updatedOrder.products.map((product: any) => this.calculateProductTotals(product));

        // Step 2: Calculate subtotal (sum of all product totals)
        const subtotal = updatedOrder.products.reduce((sum: number, product: any) => math.add(sum, this.getDisplayPrice(product)), 0);
        updatedOrder.subtotal = subtotal;

        // Step 3: Calculate product-level taxes
        updatedOrder.products_tax_value = updatedOrder.products.reduce((sum: number, product: any) => math.add(sum, product.total_tax_value || 0), 0);

        // Step 4: Apply order-level tax based on VAT settings
        updatedOrder = this.applyOrderTax(updatedOrder);

        // Step 5: Apply discounts and shipping
        const discountAmount =
            order.discount_type === 'percentage' ? math.multiply(subtotal, math.divide(order.discount_percentage || 0, 100)) : order.discount || 0;

        const beforeTotal = math.subtract(math.add(subtotal, order.shipping || 0), discountAmount);

        // Step 6: Final total calculation based on tax type
        if (this.settings.ns_jgrem_vat === 'products_vat') {
            // Tax is already included in product prices
            updatedOrder.total = beforeTotal;
        } else if (order.tax_type === 'inclusive') {
            updatedOrder.total = beforeTotal;
        } else {
            updatedOrder.total = math.add(beforeTotal, updatedOrder.tax_value || 0);
        }

        // Step 7: Calculate change and payment status
        const tendered = updatedOrder.payments.reduce((sum: number, payment: Payment) => math.add(sum, payment.value), 0);
        updatedOrder.tendered = tendered;
        updatedOrder.change = math.subtract(tendered, updatedOrder.total);

        if (tendered >= updatedOrder.total) {
            updatedOrder.payment_status = 'paid';
        } else if (tendered > 0) {
            updatedOrder.payment_status = 'partially_paid';
        } else {
            updatedOrder.payment_status = 'unpaid';
        }

        return updatedOrder;
    }

    /**
     * Apply tax to the order based on settings
     */
    private applyOrderTax(order: Order): Order {
        let updatedOrder = { ...order };
        updatedOrder.tax_value = 0;

        if (this.settings.ns_jgrem_vat === 'disabled') {
            return updatedOrder;
        }

        if (this.settings.ns_jgrem_tax_group) {
            // Apply tax group to order
            updatedOrder = this.applyTaxGroup(updatedOrder, this.settings.ns_jgrem_tax_group);
        }

        return updatedOrder;
    }

    /**
     * Apply tax group calculations
     */
    private applyTaxGroup(order: Order, taxGroupId: number): Order {
        // This would typically fetch tax group from API, but for now we'll assume it's passed
        // Implementation would calculate distributed tax rates across the order
        return order; // Placeholder
    }

    /**
     * Calculate totals for a single product
     */
    private calculateProductTotals(product: any): CartOrderProduct {
        const unitPrice = product.unit_price;
        const lineSubtotal = math.multiply(unitPrice, product.quantity);

        // Apply product discount
        const discountAmount =
            product.discount_type === 'percentage'
                ? math.multiply(lineSubtotal, math.divide(product.discount_percentage || 0, 100))
                : product.discount || 0;

        const afterDiscount = math.subtract(lineSubtotal, discountAmount);

        // Calculate tax for this product
        const taxResult = this.calculateProductTax(product, afterDiscount);

        return {
            ...product,
            total_price: this.getDisplayPrice(product),
            total_price_with_tax: taxResult.price_with_tax,
            total_price_without_tax: taxResult.price_without_tax,
            total_tax_value: taxResult.total_tax_value,
            tax_value: taxResult.tax_value,
        };
    }

    /**
     * Calculate tax for a single product
     */
    private calculateProductTax(
        product: any,
        price: number,
    ): {
        price_with_tax: number;
        price_without_tax: number;
        tax_value: number;
        total_tax_value: number;
    } {
        let taxRate = 0;

        if (product.tax_group?.taxes) {
            taxRate = product.tax_group.taxes.reduce((sum: number, tax: any) => math.add(sum, tax.rate), 0);
        }

        const taxAmount = math.multiply(price, math.divide(taxRate, 100));

        if (product.tax_type === 'inclusive') {
            return {
                price_with_tax: price,
                price_without_tax: math.subtract(price, taxAmount),
                tax_value: math.divide(taxAmount, product.quantity),
                total_tax_value: taxAmount,
            };
        } else {
            return {
                price_with_tax: math.add(price, taxAmount),
                price_without_tax: price,
                tax_value: math.divide(taxAmount, product.quantity),
                total_tax_value: taxAmount,
            };
        }
    }

    /**
     * Get the display price for a product based on settings
     */
    private getDisplayPrice(product: any): number {
        return this.settings.ns_jgrem_price_with_tax ? product.total_price_with_tax : product.total_price_without_tax;
    }

    /**
     * Create a cart item from product data
     */
    private createCartItem(product: any, quantity: number, unitQuantity: any): CartOrderProduct {
        return {
            product_id: product.id,
            name: product.name,
            quantity: quantity,
            unit_id: unitQuantity.unit_id,
            unit_name: unitQuantity.unit.name,
            unit_price: this.getProductUnitPrice(product, unitQuantity),
            price_with_tax: unitQuantity.sale_price_with_tax,
            price_without_tax: unitQuantity.sale_price_without_tax,
            tax_value: unitQuantity.sale_price_tax,
            total_price: 0, // Will be calculated
            total_price_with_tax: 0,
            total_price_without_tax: 0,
            total_tax_value: 0,
            mode: 'normal', // Could be wholesale, custom based on settings
            discount_type: 'percentage',
            discount: 0,
            discount_percentage: 0,
            tax_group_id: product.tax_group_id,
            tax_type: product.tax_type,
            product_type: product.product_type || 'product',
            unit_quantity_id: unitQuantity.id,
            _uuid: `${product.id}-${Date.now()}`,
        };
    }

    /**
     * Get unit price based on mode and settings
     */
    private getProductUnitPrice(product: any, unitQuantity: any): number {
        if (this.settings.ns_jgrem_price_with_tax) {
            return unitQuantity.sale_price_with_tax;
        } else {
            return unitQuantity.sale_price_without_tax;
        }
    }

    /**
     * Get price based on mode and type
     */
    private getPrice(quantities: ProductQuantities, mode: string, type: string): number {
        return quantities[`${mode}_price_${type}`] || 0;
    }

    /**
     * Get VAT value calculation
     */
    private getVatValue(value: number, rate: number, type: string): number {
        if (type === 'inclusive') {
            return math.subtract(value, this.getPriceWithoutTax(value, rate, type));
        } else if (type === 'exclusive') {
            return math.subtract(this.getPriceWithTax(value, rate, type), value);
        }
        return 0;
    }

    /**
     * Get price without tax
     */
    private getPriceWithoutTax(value: number, rate: number, type: string): number {
        if (type === 'inclusive') {
            return math.divide(value, math.add(1, math.divide(rate, 100)));
        } else if (type === 'exclusive') {
            return value;
        }
        return value;
    }

    /**
     * Get price with tax
     */
    private getPriceWithTax(value: number, rate: number, type: string): number {
        if (type === 'inclusive') {
            return value;
        } else if (type === 'exclusive') {
            return math.multiply(value, math.add(1, math.divide(rate, 100)));
        }
        return value;
    }

    /**
     * Format currency (placeholder - would use actual formatting utility)
     */
    private formatCurrency(amount: number): string {
        return amount.toFixed(2);
    }

    /**
     * Create default order
     */
    private createDefaultOrder(): Order {
        return {
            discount_type: 'flat',
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
            tax_type: 'exclusive',
            taxes: [],
            tax_group: {},
            payment_status: 'unpaid',
            customer_id: undefined,
            change: 0,
            total_products: 0,
            shipping: 0,
            tax_value: 0,
            products_tax_value: 0,
            shipping_rate: 0,
            shipping_type: 'flat',
            customer: undefined,
            type: undefined,
            products: [],
            instalments: [],
            payments: [],
            addresses: {
                shipping: undefined,
                billing: undefined,
            },
        } as any;
    }

    /**
     * Validate if order can be submitted
     */
    validateOrder(order: Order): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (order.products.length === 0) {
            errors.push('Cart is empty');
        }

        if (!order.customer_id) {
            errors.push('No customer selected');
        }

        if (!order.type) {
            errors.push('No order type selected');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Get stock usage for a product
     */
    getStockUsage(products: OrderProduct[], productId: number, unitQuantityId: number): number {
        const stocks = products
            .filter((product) => product.product_id === productId && product.unit_quantity_id === unitQuantityId)
            .map((product) => product.quantity);

        if (stocks.length > 0) {
            return stocks.reduce((b: number, a: number) => b + a, 0);
        }

        return 0;
    }

    /**
     * Check cart for coupon validation
     */
    checkCart(order: Order): Order {
        const unmatchedConditions: any[] = [];

        order.coupons.forEach((coupon: any) => {
            let isProductValid = true;
            if (coupon.products.length > 0) {
                isProductValid =
                    order.products.filter((product) => coupon.products.map((p: any) => p.product_id).includes(product.product_id)).length > 0;
                if (!isProductValid && unmatchedConditions.indexOf(coupon) === -1) {
                    unmatchedConditions.push(coupon);
                }
            }

            let isCategoryValid = true;
            if (coupon.categories.length > 0) {
                isCategoryValid =
                    order.products.filter((product) => coupon.categories.map((c: any) => c.category_id).includes(product.$original?.().category_id))
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
            this.removeCoupon(order, coupon);
        });

        return order;
    }

    /**
     * Remove coupon from order
     */
    removeCoupon(order: Order, coupon: any): Order {
        const coupons = order.coupons.filter((c: any) => c.code !== coupon.code);
        return this.recalculateOrder({ ...order, coupons });
    }

    /**
     * Push coupon to order
     */
    pushCoupon(order: Order, coupon: any): Order {
        order.coupons.forEach((_coupon) => {
            if (_coupon.code === coupon.code) {
                const message = __('This coupon is already added to the cart');
                toast.error(message);
                throw message;
            }
        });

        const updatedOrder = { ...order, coupons: [...order.coupons, coupon] };
        return this.recalculateOrder(updatedOrder);
    }
}

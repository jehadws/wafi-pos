import { Customer } from '@/interfaces/customer';
import { Order } from '@/interfaces/order';
import { POSManager, POSSettings } from '@/lib/pos/pos-manager';

/**
 * Safe migration hook that gradually introduces POSManager
 * while maintaining backward compatibility with existing code
 */
export const usePOSManager = () => {
    // Default settings - can be loaded from API or props
    const defaultSettings: POSSettings = {
        ns_jgrem_layout: 'grocery_shop',
        ns_jgrem_complete_sale_audio: 'disabled',
        ns_jgrem_new_item_audio: 'disabled',
        ns_jgrem_printing_document: 'receipt',
        ns_jgrem_printing_enabled_for: 'all_orders',
        ns_jgrem_printing_gateway: 'default',
        ns_jgrem_registers_enabled: 'no',
        ns_jgrem_idle_counter: 'disabled',
        ns_jgrem_disbursement: 'no',
        ns_jgrem_registers_default_change_payment_type: 1,
        ns_jgrem_vat: 'disabled',
        ns_jgrem_tax_group: null,
        ns_jgrem_tax_type: false,
        ns_jgrem_keyboard_cancel_order: [],
        ns_jgrem_keyboard_hold_order: [],
        ns_jgrem_keyboard_create_customer: [],
        ns_jgrem_keyboard_payment: [],
        ns_jgrem_keyboard_shipping: [],
        ns_jgrem_keyboard_note: [],
        ns_jgrem_keyboard_order_type: [],
        ns_jgrem_keyboard_fullscreen: [],
        ns_jgrem_keyboard_quick_search: [],
        ns_jgrem_keyboard_toggle_merge: [],
        ns_jgrem_amount_shortcut: null,
        ns_jgrem_show_quantity: true,
        ns_jgrem_items_merge: false,
        ns_jgrem_allow_wholesale_price: true,
        ns_jgrem_allow_decimal_quantities: false,
        ns_jgrem_quick_product: true,
        ns_jgrem_quick_product_default_unit: 2,
        ns_jgrem_unit_price_ediable: false,
        ns_jgrem_price_with_tax: true,
        ns_jgrem_order_types: ['takeaway', 'delivery'],
        ns_jgrem_numpad: 'default',
        ns_jgrem_force_autofocus: true,
        ns_jgrem_hide_exhausted_products: false,
        ns_jgrem_hide_empty_categories: false,
        ns_orders_allow_partial: 'yes',
        ns_orders_allow_unpaid: 'yes',
    };

    const posManager = new POSManager(defaultSettings);

    // Expose POSManager methods with safe error handling
    return {
        // Settings management
        updateSettings: (settings: Partial<POSSettings>) => {
            try {
                const currentSettings = posManager.getSettings();
                const newSettings = { ...currentSettings, ...settings };
                posManager.updateSettings(newSettings);
                return newSettings;
            } catch (error) {
                console.error('Error updating POS settings:', error);
                throw error;
            }
        },

        getSettings: () => {
            try {
                return posManager.getSettings();
            } catch (error) {
                console.error('Error getting POS settings:', error);
                return defaultSettings;
            }
        },

        // Order management (with safe fallbacks)
        addToCart: (order: Order, product: any, quantity: number, unitQuantity: any) => {
            try {
                return posManager.addToCart(order, product, quantity, unitQuantity);
            } catch (error) {
                console.error('Error adding to cart:', error);
                throw error;
            }
        },

        updateProductQuantity: (order: Order, productUuid: string, newQuantity: number) => {
            try {
                return posManager.updateProductQuantity(order, productUuid, newQuantity);
            } catch (error) {
                console.error('Error updating product quantity:', error);
                throw error;
            }
        },

        removeFromCart: (order: Order, productUuid: string) => {
            try {
                return posManager.removeFromCart(order, productUuid);
            } catch (error) {
                console.error('Error removing from cart:', error);
                throw error;
            }
        },

        applyOrderDiscount: (order: Order, discountAmount: number, discountType: 'flat' | 'percentage') => {
            try {
                return posManager.applyOrderDiscount(order, discountAmount, discountType);
            } catch (error) {
                console.error('Error applying discount:', error);
                throw error;
            }
        },

        applyShipping: (order: Order, shippingAmount: number) => {
            try {
                return posManager.applyShipping(order, shippingAmount);
            } catch (error) {
                console.error('Error applying shipping:', error);
                throw error;
            }
        },

        addPayment: (order: Order, payment: any) => {
            try {
                return posManager.addPayment(order, payment);
            } catch (error) {
                console.error('Error adding payment:', error);
                throw error;
            }
        },

        // Customer management
        selectCustomer: async (order: Order, customer: Customer) => {
            try {
                return await posManager.selectCustomer(order, customer);
            } catch (error) {
                console.error('Error selecting customer:', error);
                throw error;
            }
        },

        loadCustomer: async (id: number) => {
            try {
                return await posManager.loadCustomer(id);
            } catch (error) {
                console.error('Error loading customer:', error);
                throw error;
            }
        },

        // Order processing
        submitOrder: async (order: Order, orderFields: object = {}) => {
            try {
                return await posManager.submitOrder(order, orderFields);
            } catch (error) {
                console.error('Error submitting order:', error);
                throw error;
            }
        },

        loadOrder: async (orderId: number) => {
            try {
                return await posManager.loadOrder(orderId);
            } catch (error) {
                console.error('Error loading order:', error);
                throw error;
            }
        },

        validateOrder: (order: Order) => {
            try {
                return posManager.validateOrder(order);
            } catch (error) {
                console.error('Error validating order:', error);
                return { valid: false, errors: ['Validation error occurred'] };
            }
        },

        // Settings checkers (convenience methods)
        allowDecimalQuantities: () => posManager.allowDecimalQuantities(),
        allowWholesalePrice: () => posManager.allowWholesalePrice(),
        forceAutofocus: () => posManager.forceAutofocus(),
        showQuantity: () => posManager.showQuantity(),
        unitPriceEditable: () => posManager.unitPriceEditable(),
        getAllowedOrderTypes: () => posManager.getAllowedOrderTypes(),
        getNumpadType: () => posManager.getNumpadType(),

        // Utility methods
        printOrderReceipt: (order: Order, mode: string) => {
            try {
                return posManager.printOrderReceipt(order, mode);
            } catch (error) {
                console.error('Error printing receipt:', error);
                return false;
            }
        },

        // Direct access to POSManager for advanced operations
        manager: posManager,
    };
};

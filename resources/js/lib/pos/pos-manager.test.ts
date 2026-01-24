import { Order } from '@/interfaces/order';
import { POSManager, POSSettings } from '@/lib/pos/pos-manager';

/**
 * Basic test suite for POSManager to ensure it works correctly
 * Run this to verify functionality before integration
 */
export const testPOSManager = () => {
    console.log('🧪 Starting POSManager tests...');

    // Test settings
    const testSettings: POSSettings = {
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

    const manager = new POSManager(testSettings);

    // Test 1: Settings management
    console.log('✅ Test 1: Settings management');
    const currentSettings = manager.getSettings();
    if (currentSettings.ns_jgrem_layout === 'grocery_shop') {
        console.log('   ✓ Settings loaded correctly');
    } else {
        console.log('   ✗ Settings not loaded correctly');
        return false;
    }

    // Test 2: Feature checks
    console.log('✅ Test 2: Feature checks');
    if (manager.showQuantity() === true && manager.forceAutofocus() === true) {
        console.log('   ✓ Feature checks work correctly');
    } else {
        console.log('   ✗ Feature checks failed');
        return false;
    }

    // Test 3: Order creation and validation
    console.log('✅ Test 3: Order creation and validation');
    const emptyOrder: Order = {
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

    const validation = manager.validateOrder(emptyOrder);
    if (!validation.valid && validation.errors.includes('Cart is empty')) {
        console.log('   ✓ Order validation works correctly');
    } else {
        console.log('   ✗ Order validation failed');
        return false;
    }

    // Test 4: Cart operations
    console.log('✅ Test 4: Cart operations');
    const testProduct = {
        id: 1,
        name: 'Test Product',
        tax_group_id: null,
        tax_type: 'exclusive',
        product_type: 'product',
    };

    const testUnitQuantity = {
        id: 1,
        unit_id: 1,
        unit: { id: 1, name: 'Piece', identifier: 'piece' },
        sale_price_with_tax: 10,
        sale_price_without_tax: 10,
        sale_price_tax: 0,
    };

    try {
        const orderWithProduct = manager.addToCart(emptyOrder, testProduct, 2, testUnitQuantity);
        if (orderWithProduct.products.length === 1 && orderWithProduct.products[0].quantity === 2) {
            console.log('   ✓ Product added to cart correctly');
        } else {
            console.log('   ✗ Product not added correctly');
            return false;
        }

        // Test quantity update
        const productUuid = (orderWithProduct.products[0] as any)._uuid;
        const updatedOrder = manager.updateProductQuantity(orderWithProduct, productUuid, 5);
        if (updatedOrder.products[0].quantity === 5) {
            console.log('   ✓ Product quantity updated correctly');
        } else {
            console.log('   ✗ Product quantity not updated correctly');
            return false;
        }

        // Test removal
        const removedOrder = manager.removeFromCart(updatedOrder, productUuid);
        if (removedOrder.products.length === 0) {
            console.log('   ✓ Product removed from cart correctly');
        } else {
            console.log('   ✗ Product not removed correctly');
            return false;
        }
    } catch (error) {
        console.log('   ✗ Cart operations failed:', error);
        return false;
    }

    // Test 5: Order calculations
    console.log('✅ Test 5: Order calculations');
    const orderWithCalculations = manager.addToCart(emptyOrder, testProduct, 3, testUnitQuantity);
    const calculatedOrder = manager.applyOrderDiscount(orderWithCalculations, 2, 'flat');
    const finalOrder = manager.applyShipping(calculatedOrder, 5);

    if (finalOrder.subtotal === 30 && finalOrder.total === 33) {
        // 30 + 5 shipping - 2 discount = 33
        console.log('   ✓ Order calculations work correctly');
    } else {
        console.log('   ✗ Order calculations failed. Expected total: 33, got:', finalOrder.total);
        return false;
    }

    console.log('🎉 All POSManager tests passed! The system is ready for integration.');
    return true;
};

// Auto-run tests in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Uncomment to run tests automatically
    // setTimeout(() => testPOSManager(), 1000);
}

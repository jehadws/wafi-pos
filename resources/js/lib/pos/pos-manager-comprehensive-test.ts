import { Customer } from '@/interfaces/customer';
import { Order } from '@/interfaces/order';
import { OrderProduct } from '@/interfaces/order-product';
import { Payment } from '@/interfaces/payment';
import { POSManager, POSSettings } from '@/lib/pos/pos-manager';

/**
 * Comprehensive test suite for POSManager
 * Tests all functionality with edge cases and real-world scenarios
 */
const comprehensivePOSManagerTest = async () => {
    console.log('🧪 Running Comprehensive POSManager Tests...\n');

    const testResults = {
        passed: 0,
        failed: 0,
        total: 0,
    };

    const runTest = async (name: string, testFn: () => boolean | Promise<boolean>) => {
        testResults.total++;
        try {
            console.log(`🧪 ${name}`);
            const result = await testFn();
            if (result) {
                console.log('   ✅ PASSED\n');
                testResults.passed++;
            } else {
                console.log('   ❌ FAILED\n');
                testResults.failed++;
            }
            return result;
        } catch (error: any) {
            console.log(`   ❌ ERROR: ${error.message}\n`);
            testResults.failed++;
            return false;
        }
    };

    // Test data
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

    const createTestOrder = (): Order =>
        ({
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
        }) as any;

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
        sale_price_with_tax: 12.5, // $10 + $2.50 tax
        sale_price_without_tax: 10.0,
        sale_price_tax: 2.5,
        wholesale_price_with_tax: 11.0,
        wholesale_price_without_tax: 10.0,
        wholesale_price_tax: 1.0,
    };

    const testCustomer: Customer = {
        id: 1,
        name: 'Test Customer',
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        billing: {
            id: 1,
            address: '123 Test St',
            city: 'Test City',
            country: 'Test Country',
        },
        group: {
            id: 1,
            name: 'Default',
            minimal_credit_payment: 0,
        },
    } as any;

    // Initialize POSManager
    const manager = new POSManager(defaultSettings);

    // ===== SETTINGS TESTS =====
    await runTest('Settings Initialization', () => {
        const settings = manager.getSettings();
        return settings.ns_jgrem_layout === 'grocery_shop' && settings.ns_jgrem_price_with_tax === true && settings.ns_jgrem_items_merge === false;
    });

    await runTest('Settings Update', () => {
        const newSettings = { ...defaultSettings, ns_jgrem_items_merge: true };
        manager.updateSettings(newSettings);
        const updated = manager.getSettings();
        return updated.ns_jgrem_items_merge === true;
    });

    await runTest('Settings Checkers', () => {
        return (
            manager.showQuantity() === true &&
            manager.forceAutofocus() === true &&
            manager.allowDecimalQuantities() === false &&
            manager.allowWholesalePrice() === true &&
            manager.unitPriceEditable() === false
        );
    });

    // Reset settings for other tests
    manager.updateSettings(defaultSettings);

    // ===== ORDER VALIDATION TESTS =====
    await runTest('Empty Order Validation', () => {
        const emptyOrder = createTestOrder();
        const validation = manager.validateOrder(emptyOrder);
        return !validation.valid && validation.errors.includes('Cart is empty');
    });

    await runTest('Order with Customer Validation', () => {
        const orderWithCustomer = { ...createTestOrder(), customer_id: 1 };
        const validation = manager.validateOrder(orderWithCustomer);
        return !validation.valid && validation.errors.includes('Cart is empty');
    });

    await runTest('Complete Order Validation', () => {
        const completeOrder = {
            ...createTestOrder(),
            customer_id: 1,
            products: [{ product_id: 1, name: 'Test', quantity: 1, _uuid: 'test-1' } as any],
        };
        const validation = manager.validateOrder(completeOrder);
        return validation.valid && validation.errors.length === 0;
    });

    // ===== CART OPERATIONS TESTS =====
    await runTest('Add Product to Empty Cart', () => {
        const order = createTestOrder();
        const result = manager.addToCart(order, testProduct, 2, testUnitQuantity);
        return result.products.length === 1 && result.products[0].quantity === 2 && (result.products[0] as any).product_id === 1;
    });

    await runTest('Cart Item Merging Disabled', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity);
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);

        // Should have 2 separate items since merging is disabled
        return order.products.length === 2;
    });

    await runTest('Cart Item Merging Enabled', () => {
        manager.updateSettings({ ...defaultSettings, ns_jgrem_items_merge: true });
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity);
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);

        // Should merge into single item with quantity 3
        const result = order.products.length === 1 && order.products[0].quantity === 3;
        manager.updateSettings(defaultSettings); // Reset
        return result;
    });

    await runTest('Update Product Quantity', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);
        const productUuid = (order.products[0] as any)._uuid;

        const updatedOrder = manager.updateProductQuantity(order, productUuid, 5);
        return updatedOrder.products[0].quantity === 5;
    });

    await runTest('Remove Product by Quantity 0', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);
        const productUuid = (order.products[0] as any)._uuid;

        const updatedOrder = manager.updateProductQuantity(order, productUuid, 0);
        return updatedOrder.products.length === 0;
    });

    await runTest('Remove Product from Cart', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);
        const productUuid = (order.products[0] as any)._uuid;

        const removedOrder = manager.removeFromCart(order, productUuid);
        return removedOrder.products.length === 0;
    });

    // ===== CALCULATION TESTS =====
    await runTest('Basic Price Calculation (With Tax)', () => {
        const order = manager.addToCart(createTestOrder(), testProduct, 1, testUnitQuantity);
        // 1 item at $12.50 = $12.50 subtotal and total
        return order.subtotal === 12.5 && order.total === 12.5;
    });

    await runTest('Basic Price Calculation (Without Tax)', () => {
        manager.updateSettings({ ...defaultSettings, ns_jgrem_price_with_tax: false });
        const order = manager.addToCart(createTestOrder(), testProduct, 1, testUnitQuantity);
        // 1 item at $10.00 = $10.00 subtotal and total
        const result = order.subtotal === 10.0 && order.total === 10.0;
        manager.updateSettings(defaultSettings); // Reset
        return result;
    });

    await runTest('Multiple Items Calculation', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);
        order = manager.addToCart(order, { ...testProduct, id: 2, name: 'Test Product 2' }, 3, testUnitQuantity);

        // 2 items at $12.50 + 3 items at $12.50 = $62.50 total
        return order.subtotal === 62.5 && order.total === 62.5 && order.products.length === 2;
    });

    await runTest('Flat Discount Calculation', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity); // $25.00
        const discountedOrder = manager.applyOrderDiscount(order, 5.0, 'flat');

        return discountedOrder.subtotal === 25.0 && discountedOrder.total === 20.0;
    });

    await runTest('Percentage Discount Calculation', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity); // $25.00
        const discountedOrder = manager.applyOrderDiscount(order, 10, 'percentage'); // 10% off

        return discountedOrder.subtotal === 25.0 && discountedOrder.total === 22.5; // $25 - $2.50 = $22.50
    });

    await runTest('Shipping Cost Calculation', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity); // $12.50
        const orderWithShipping = manager.applyShipping(order, 3.0);

        return orderWithShipping.subtotal === 12.5 && orderWithShipping.total === 15.5;
    });

    await runTest('Complete Order Calculation', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity); // $25.00
        order = manager.applyOrderDiscount(order, 2.5, 'flat'); // -$2.50
        order = manager.applyShipping(order, 5.0); // +$5.00

        // $25.00 - $2.50 + $5.00 = $27.50
        return order.subtotal === 25.0 && order.total === 27.5;
    });

    // ===== PAYMENT TESTS =====
    await runTest('Payment Processing', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity); // $12.50

        const payment: Payment = { identifier: 'cash', label: 'Cash', value: 15.0, selected: true, readonly: false };
        const orderWithPayment = manager.addPayment(order, payment);

        return orderWithPayment.tendered === 15.0 && orderWithPayment.change === 2.5 && orderWithPayment.payment_status === 'paid';
    });

    await runTest('Partial Payment', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity); // $12.50

        const payment: Payment = { identifier: 'cash', label: 'Cash', value: 10.0, selected: false, readonly: false };
        const orderWithPayment = manager.addPayment(order, payment);

        return orderWithPayment.tendered === 10.0 && orderWithPayment.change === 0 && orderWithPayment.payment_status === 'partially_paid';
    });

    // ===== CUSTOMER TESTS =====
    await runTest('Customer Selection', async () => {
        const order = createTestOrder();
        const orderWithCustomer = await manager.selectCustomer(order, testCustomer);

        return orderWithCustomer.customer_id === 1 && orderWithCustomer.customer?.id === 1;
    });

    // ===== STOCK TESTS =====
    await runTest('Stock Usage Calculation', () => {
        const products: OrderProduct[] = [
            { product_id: 1, unit_quantity_id: 1, quantity: 2, _uuid: '1' } as any,
            { product_id: 1, unit_quantity_id: 1, quantity: 3, _uuid: '2' } as any,
            { product_id: 2, unit_quantity_id: 1, quantity: 1, _uuid: '3' } as any,
        ];

        const stockUsage1 = manager.getStockUsage(products, 1, 1); // Product 1, unit 1
        const stockUsage2 = manager.getStockUsage(products, 2, 1); // Product 2, unit 1

        return stockUsage1 === 5 && stockUsage2 === 1; // 2 + 3 = 5, and 1 respectively
    });

    // ===== COUPON TESTS =====
    await runTest('Coupon Application', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity); // $25.00

        const coupon = { code: 'TEST10', value: 2.5 };
        const orderWithCoupon = manager.pushCoupon(order, coupon);

        return orderWithCoupon.coupons.length === 1 && orderWithCoupon.coupons[0].code === 'TEST10';
    });

    await runTest('Duplicate Coupon Prevention', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);

        const coupon = { code: 'TEST10', value: 2.5 };
        let orderWithCoupon = manager.pushCoupon(order, coupon);

        try {
            orderWithCoupon = manager.pushCoupon(orderWithCoupon, coupon); // Should throw
            return false; // Should not reach here
        } catch (error) {
            return orderWithCoupon.coupons.length === 1; // Should still have only 1 coupon
        }
    });

    await runTest('Coupon Removal', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 2, testUnitQuantity);

        const coupon = { code: 'TEST10', value: 2.5 };
        let orderWithCoupon = manager.pushCoupon(order, coupon);
        orderWithCoupon = manager.removeCoupon(orderWithCoupon, coupon);

        return orderWithCoupon.coupons.length === 0;
    });

    // ===== EDGE CASES =====
    await runTest('Zero Quantity Handling', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 1, testUnitQuantity);
        const productUuid = (order.products[0] as any)._uuid;

        const zeroQuantityOrder = manager.updateProductQuantity(order, productUuid, 0);
        return zeroQuantityOrder.products.length === 0;
    });

    await runTest('Negative Quantity Handling', () => {
        let order = createTestOrder();
        order = manager.addToCart(order, testProduct, 3, testUnitQuantity);
        const productUuid = (order.products[0] as any)._uuid;

        const negativeQuantityOrder = manager.updateProductQuantity(order, productUuid, -1);
        return negativeQuantityOrder.products.length === 0;
    });

    await runTest('Invalid Product UUID', () => {
        const order = createTestOrder();
        const invalidUuidOrder = manager.updateProductQuantity(order, 'invalid-uuid', 5);
        return invalidUuidOrder.products.length === 0; // Should not add anything
    });

    // ===== SUMMARY =====
    console.log('📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📊 Total: ${testResults.total}`);

    const successRate = (testResults.passed / testResults.total) * 100;
    console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%\n`);

    if (testResults.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! POSManager is ready for production.');
        console.log('✅ Core business logic verified');
        console.log('✅ Settings integration working');
        console.log('✅ Cart operations stable');
        console.log('✅ Calculations accurate');
        console.log('✅ Edge cases handled');
        console.log('✅ Error handling robust\n');
    } else {
        console.log('⚠️  Some tests failed. Please review and fix before integration.');
    }

    return testResults.failed === 0;
};

// Export for use in other files
export { comprehensivePOSManagerTest };

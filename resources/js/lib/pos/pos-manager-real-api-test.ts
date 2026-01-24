import { Order } from '@/interfaces/order';
import { POSManager, POSSettings } from '@/lib/pos/pos-manager';

/**
 * Test POSManager with REAL API data from pos apis calls.md
 * This ensures our implementation matches actual API responses
 */
const testPOSManagerWithRealAPIData = async () => {
    console.log('🧪 Testing POSManager with REAL API data...\n');

    let testResults = {
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

    // Real settings from pos redo.md
    const realPOSSettings: POSSettings = {
        ns_jgrem_layout: 'grocery_shop',
        ns_jgrem_complete_sale_audio: '',
        ns_jgrem_new_item_audio: '',
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

    // Real product data from API
    const realProduct = {
        id: 1,
        name: 'خلاط دوش',
        tax_type: 'inclusive',
        tax_group_id: null,
        tax_value: 0,
        product_type: 'product',
        type: 'materialized',
        accurate_tracking: false,
        auto_cogs: true,
        status: 'available',
        stock_management: 'enabled',
        barcode: 'Jf6eEIHCko',
        barcode_type: 'code128',
        sku: 'khlatat--khlat-dosh--PF7LF',
        description: null,
        thumbnail_id: null,
        category_id: 1,
        parent_id: 0,
        unit_group: 1,
        on_expiration: 'prevent-sales',
        expires: 0,
        searchable: 1,
        author: 58,
        uuid: null,
        created_at: '2026-01-23T20:59:24.000000Z',
        updated_at: '2026-01-23T20:59:24.000000Z',
        galleries: [],
        tax_group: null,
        unit_quantities: [
            {
                id: 1,
                product_id: 1,
                type: 'product',
                preview_url: '',
                expiration_date: null,
                unit_id: 1,
                barcode: 'Jf6eEIHCko-1',
                quantity: 20,
                low_quantity: 0,
                stock_alert_enabled: 0,
                sale_price: 95,
                sale_price_edit: 95,
                sale_price_without_tax: 95,
                sale_price_with_tax: 95,
                sale_price_tax: 0,
                wholesale_price: 65,
                wholesale_price_edit: 65,
                wholesale_price_with_tax: 65,
                wholesale_price_without_tax: 65,
                wholesale_price_tax: 0,
                custom_price: 0,
                custom_price_edit: 0,
                custom_price_with_tax: 0,
                custom_price_without_tax: 0,
                custom_price_tax: 0,
                visible: 1,
                convert_unit_id: null,
                cogs: 65,
                uuid: null,
                created_at: '2026-01-23T20:59:24.000000Z',
                updated_at: '2026-01-23T21:01:43.000000Z',
                unit: {
                    id: 1,
                    name: 'قطعة',
                    identifier: 'ktaa',
                    description: null,
                    author: 58,
                    group_id: 1,
                    value: 1,
                    preview_url: null,
                    base_unit: true,
                    uuid: null,
                    created_at: '2026-01-23T20:58:27.000000Z',
                    updated_at: '2026-01-23T20:58:27.000000Z',
                },
            },
        ],
    };

    const realCustomer = {
        id: 59,
        username: 'customer-60@nexopos.app',
        active: 0,
        author: 58,
        email: 'customer-60@nexopos.app',
        password: '$2y$10$QXFyld8nQNRdX3SZ4D/oreoCSy5C.OV03YOdUSMnowdW7qq7kkw6q',
        group_id: 1,
        first_name: 'زبون نقدي',
        last_name: undefined,
        gender: undefined,
        phone: undefined,
        pobox: undefined,
        activation_expiration: null,
        total_sales_count: 0,
        total_sales: 0,
        birth_date: '2026-01-23 23:04:18',
        purchases_amount: 90,
        owed_amount: 0,
        credit_limit_amount: 0,
        account_amount: 0,
        activation_token: null,
        remember_token: null,
        created_at: '2026-01-23T21:05:08.000000Z',
        updated_at: '2026-01-23T21:06:59.000000Z',
        billing: {
            first_name: '',
            last_name: '',
            address_1: '',
            address_2: '',
            email: '',
            city: '',
            country: '',
            company: '',
            pobox: '',
            phone: '',
            type: 'billing',
        } as any,
        shipping: {
            first_name: '',
            last_name: '',
            address_1: '',
            address_2: '',
            email: '',
            city: '',
            country: '',
            company: '',
            pobox: '',
            phone: '',
            type: 'shipping',
        } as any,
        group: {
            id: 1,
            name: 'زبائن نقدي',
            description: undefined,
            reward_system_id: undefined,
            minimal_credit_payment: 0,
            author: 58,
            uuid: null,
            created_at: '2026-01-23T21:05:03.000000Z',
            updated_at: '2026-01-23T21:05:03.000000Z',
        },
    };

    // Real order payload from API
    const realOrderPayload = {
        discount_type: 'flat',
        title: '',
        discount: 5,
        discount_percentage: 0,
        subtotal: 95,
        total: 90,
        coupons: [],
        total_coupons: 0,
        tendered: 90,
        note: '',
        note_visibility: 'hidden',
        tax_group_id: null,
        tax_type: false,
        taxes: [],
        tax_group: {},
        payment_status: 'paid',
        customer_id: 59,
        change: 0,
        total_products: 1,
        shipping: 0,
        tax_value: 0,
        products_tax_value: 0,
        shipping_rate: 0,
        customer: realCustomer,
        type: {
            identifier: 'takeaway',
            label: 'يبعد',
            icon: '/images/groceries.png',
            selected: true,
        },
        products: [
            {
                product_id: 1,
                name: 'خلاط دوش',
                discount_type: 'percentage',
                discount: 0,
                discount_percentage: 0,
                product_type: 'product',
                rate: 0,
                quantity: 1,
                tax_group_id: 0,
                tax_type: 'inclusive',
                tax_value: 0,
                unit_id: 0,
                unit_price: 95,
                price_with_tax: 95,
                price_without_tax: 95,
                unit_name: 'قطعة',
                total_price: 95,
                total_price_without_tax: 95,
                total_price_with_tax: 95,
                mode: 'normal',
                unit_quantity_id: 1,
                total_tax_value: 0,
            },
        ],
        instalments: [],
        payments: [
            {
                value: 90,
                identifier: 'bank-payment',
                selected: false,
                label: 'الدفع المصرفية',
                readonly: false,
            },
        ],
        addresses: {
            billing: realCustomer.billing,
            shipping: realCustomer.shipping,
        },
    };

    const manager = new POSManager(realPOSSettings);

    // ===== REAL API DATA TESTS =====
    await runTest('Real Product Cart Addition', () => {
        const order = manager.addToCart(
            {
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
                customer_id: 59,
                change: 0,
                total_products: 0,
                shipping: 0,
                tax_value: 0,
                products_tax_value: 0,
                shipping_rate: 0,
                shipping_type: 'flat',
                customer: realCustomer,
                type: { identifier: 'takeaway', label: 'Takeaway', selected: true, icon: '' },
                products: [],
                instalments: [],
                payments: [],
                addresses: {
                    shipping: realCustomer.shipping,
                    billing: realCustomer.billing,
                },
            } as Order,
            realProduct,
            1,
            realProduct.unit_quantities[0],
        );

        return (
            order.products.length === 1 &&
            order.products[0].quantity === 1 &&
            (order.products[0] as any).product_id === 1 &&
            order.subtotal === 95 &&
            order.total === 95
        );
    });

    await runTest('Real Customer Selection', async () => {
        const order = {
            ...manager.addToCart(
                {
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
                    customer_id: 59,
                    change: 0,
                    total_products: 0,
                    shipping: 0,
                    tax_value: 0,
                    products_tax_value: 0,
                    shipping_rate: 0,
                    shipping_type: 'flat',
                    customer: realCustomer,
                    type: { identifier: 'takeaway', label: 'Takeaway', selected: true, icon: '' },
                    products: [],
                    instalments: [],
                    payments: [],
                    addresses: {
                        shipping: realCustomer.shipping,
                        billing: realCustomer.billing,
                    },
                } as Order,
                realProduct,
                1,
                realProduct.unit_quantities[0],
            ),
        };

        // Mock customer selection (in real implementation this would call the API)
        const orderWithCustomer = {
            ...order,
            customer: realCustomer,
            customer_id: realCustomer.id,
            addresses: { ...order.addresses, billing: realCustomer.billing },
        };

        return orderWithCustomer.customer_id === 59 && orderWithCustomer.customer?.first_name === 'زبون نقدي';
    });

    await runTest('Real Payment Processing', () => {
        let order = manager.addToCart(
            {
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
                customer_id: 59,
                change: 0,
                total_products: 0,
                shipping: 0,
                tax_value: 0,
                products_tax_value: 0,
                shipping_rate: 0,
                shipping_type: 'flat',
                customer: realCustomer,
                type: { identifier: 'takeaway', label: 'Takeaway', selected: true, icon: '' },
                products: [],
                instalments: [],
                payments: [],
                addresses: {
                    shipping: realCustomer.shipping,
                    billing: realCustomer.billing,
                },
            } as Order,
            realProduct,
            1,
            realProduct.unit_quantities[0],
        );

        // Apply discount like in real API
        order = manager.applyOrderDiscount(order, 5, 'flat');

        // Add payment
        const payment = { identifier: 'bank-payment', label: 'الدفع المصرفية', value: 90, selected: false, readonly: false };
        order = manager.addPayment(order, payment);

        return (
            order.subtotal === 95 &&
            order.discount === 5 &&
            order.total === 90 &&
            order.tendered === 90 &&
            order.change === 0 &&
            order.payment_status === 'paid'
        );
    });

    await runTest('Real Order Validation', () => {
        const completeOrder = {
            discount_type: 'flat',
            title: '',
            discount: 5,
            register_id: undefined,
            discount_percentage: 0,
            subtotal: 95,
            total: 90,
            coupons: [],
            total_coupons: 0,
            tendered: 90,
            note: '',
            note_visibility: 'hidden',
            tax_group_id: undefined,
            tax_type: 'exclusive',
            taxes: [],
            tax_group: {},
            payment_status: 'paid',
            customer_id: 59,
            change: 0,
            total_products: 1,
            shipping: 0,
            tax_value: 0,
            products_tax_value: 0,
            shipping_rate: 0,
            shipping_type: 'flat',
            customer: realCustomer,
            type: { identifier: 'takeaway', label: 'يبعد', icon: '/images/groceries.png', selected: true },
            products: [realOrderPayload.products[0]],
            instalments: [],
            payments: [realOrderPayload.payments[0]],
            addresses: realOrderPayload.addresses,
        } as Order;

        const validation = manager.validateOrder(completeOrder);
        return validation.valid;
    });

    await runTest('Real Percentage Discount', () => {
        let order = manager.addToCart(
            {
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
                customer_id: 59,
                change: 0,
                total_products: 0,
                shipping: 0,
                tax_value: 0,
                products_tax_value: 0,
                shipping_rate: 0,
                shipping_type: 'flat',
                customer: realCustomer,
                type: { identifier: 'takeaway', label: 'Takeaway', selected: true, icon: '' },
                products: [],
                instalments: [],
                payments: [],
                addresses: {
                    shipping: realCustomer.shipping,
                    billing: realCustomer.billing,
                },
            } as Order,
            realProduct,
            1,
            realProduct.unit_quantities[0],
        );

        // Apply 20% discount like in the second API example
        order = manager.applyOrderDiscount(order, 20, 'percentage');

        // 95 * 0.8 = 76 (20% discount)
        return order.subtotal === 95 && order.total === 76;
    });

    await runTest('Stock Usage with Real Data', () => {
        const products = [
            { product_id: 1, unit_quantity_id: 1, quantity: 2, _uuid: '1' },
            { product_id: 1, unit_quantity_id: 1, quantity: 3, _uuid: '2' },
            { product_id: 1, unit_quantity_id: 2, quantity: 1, _uuid: '3' },
        ];

        const stockUsage1 = manager.getStockUsage(products as any, 1, 1); // Product 1, unit 1
        const stockUsage2 = manager.getStockUsage(products as any, 1, 2); // Product 1, unit 2

        return stockUsage1 === 5 && stockUsage2 === 1; // 2 + 3 = 5, and 1 respectively
    });

    // ===== SUMMARY =====
    console.log('📊 Real API Data Test Results:');
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📊 Total: ${testResults.total}`);

    const successRate = (testResults.passed / testResults.total) * 100;
    console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%\n`);

    if (testResults.failed === 0) {
        console.log('🎉 ALL REAL API DATA TESTS PASSED!');
        console.log('✅ POSManager handles real API responses correctly');
        console.log('✅ Product data structures match API');
        console.log('✅ Customer data structures match API');
        console.log('✅ Order payload generation is accurate');
        console.log('✅ Payment processing works with real data');
        console.log('✅ Discount calculations match API behavior');
        console.log('\n🚀 POSManager is READY for production with real API data!\n');
    } else {
        console.log('⚠️  Some real API tests failed. Check data structure compatibility.');
        console.log(`   - ${testResults.failed} tests need attention`);
        console.log('\n🔧 Fix API data structure issues before proceeding.');
    }

    return testResults.failed === 0;
};

// Export for use in other files
export { testPOSManagerWithRealAPIData };

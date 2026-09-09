import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePOS } from '@/hooks/usePOS';
import { usersApi } from '@/api';
import { POS_OPTION_KEYS } from '@/constants/pos-options';

describe('use-cart-store (Zustand Cart Slice)', () => {
    beforeEach(() => {
        usePOS.getState().reset();
    });

    it('adds a new product to cart correctly', async () => {
        const store = usePOS.getState();
        const product = {
            id: 1,
            name: 'Cold Brew Coffee',
            unit_price: 15,
            price_with_tax: 15,
            price_without_tax: 15,
            total_price: 15,
            quantity: 1,
            mode: 'normal',
        };

        await store.addToCart(product);

        const updatedProducts = usePOS.getState().products;
        expect(updatedProducts).toHaveLength(1);
        expect(updatedProducts[0].name).toBe('Cold Brew Coffee');
        expect(updatedProducts[0].quantity).toBe(1);
    });

    it('merges identical products when autoMerge is enabled', async () => {
        const store = usePOS.getState();
        store.setAutoMerge(true);

        const product = {
            id: 2,
            product_id: 2,
            name: 'Croissant',
            unit_price: 10,
            price_with_tax: 10,
            price_without_tax: 10,
            total_price: 10,
            quantity: 1,
            unit_id: 1,
            unit_quantity_id: 1,
        };

        await usePOS.getState().addToCart(product);
        await usePOS.getState().addToCart(product);

        const updatedProducts = usePOS.getState().products;
        expect(updatedProducts).toHaveLength(1);
        expect(updatedProducts[0].quantity).toBe(2);
    });

    it('removes a product from the cart', async () => {
        const product = {
            id: 3,
            name: 'Espresso',
            unit_price: 12,
            price_with_tax: 12,
            quantity: 1,
        };

        await usePOS.getState().addToCart(product);
        expect(usePOS.getState().products).toHaveLength(1);

        const cartProduct = usePOS.getState().products[0];
        usePOS.getState().removeProduct(cartProduct);

        expect(usePOS.getState().products).toHaveLength(0);
    });

    it('updates product quantity and attributes in the cart', async () => {
        const product = {
            id: 4,
            name: 'Tea',
            unit_price: 8,
            price_with_tax: 8,
            quantity: 1,
        };

        await usePOS.getState().addToCart(product);
        const cartProduct = usePOS.getState().products[0];

        usePOS.getState().updateProduct(cartProduct, { quantity: 3 });

        expect(usePOS.getState().products[0].quantity).toBe(3);
    });

    it('clears all products from the cart', async () => {
        await usePOS.getState().addToCart({ id: 5, name: 'Item 1', unit_price: 10, quantity: 1 });
        await usePOS.getState().addToCart({ id: 6, name: 'Item 2', unit_price: 20, quantity: 1 });

        expect(usePOS.getState().products).toHaveLength(2);

        usePOS.getState().clearCart();
        expect(usePOS.getState().products).toHaveLength(0);
    });

    it('cart product state is JSON-serializable after add and update', async () => {
        const store = usePOS.getState();
        await store.addToCart({
            id: 7,
            name: 'Serializable Item',
            unit_price: 25,
            price_with_tax: 25,
            price_without_tax: 25,
            total_price: 25,
            quantity: 1,
            category_id: 3,
            tax_type: 'inclusive',
            quantities: { sale_price_edit: 25 },
        });

        usePOS.getState().updateProduct(usePOS.getState().products[0], { quantity: 4 });

        const products = usePOS.getState().products;
        expect(products).toHaveLength(1);

        // No function properties may exist anywhere in the cart line
        const findFunctions = (obj: any): string[] =>
            Object.entries(obj).flatMap(([key, value]) =>
                typeof value === 'function'
                    ? [key]
                    : value !== null && typeof value === 'object'
                      ? findFunctions(value)
                      : [],
            );
        expect(findFunctions(products[0])).toEqual([]);

        // Round-trip must preserve computed values
        const revived = JSON.parse(JSON.stringify(products[0]));
        expect(revived.quantity).toBe(4);
        expect(revived.unit_price).toBe(products[0].unit_price);
        expect(revived.source.category_id).toBe(3);
    });

    it('generates unique _uuids even when Date.now() is identical for rapid adds', async () => {
        usePOS.getState().setAutoMerge(false);
        const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
        try {
            const product = {
                id: 8,
                name: 'Rapid Item',
                unit_price: 5,
                quantity: 1,
                unit_id: 1,
                unit_quantity_id: 1,
            };

            await usePOS.getState().addToCart(product);
            await usePOS.getState().addToCart(product);

            const uuids = usePOS.getState().products.map((p) => p._uuid);
            expect(uuids).toHaveLength(2);
            expect(new Set(uuids).size).toBe(2);
        } finally {
            dateSpy.mockRestore();
        }
    });

    it('re-applies the default order type after reset (takeaway when both types are enabled)', async () => {
        vi.spyOn(usersApi, 'getPermissions').mockResolvedValue([]);
        usePOS.setState({ options: { [POS_OPTION_KEYS.orderTypes]: ['takeaway', 'delivery'] } } as any);

        await usePOS.getState().reset();

        expect(usePOS.getState().order.type?.identifier).toBe('takeaway');
    });

    it('re-applies the single enabled order type after reset', async () => {
        vi.spyOn(usersApi, 'getPermissions').mockResolvedValue([]);
        usePOS.setState({ options: { [POS_OPTION_KEYS.orderTypes]: ['delivery'] } } as any);

        await usePOS.getState().reset();

        expect(usePOS.getState().order.type?.identifier).toBe('delivery');
    });

    it('applies the default order type when the POS session initializes', () => {
        vi.spyOn(usersApi, 'getPermissions').mockResolvedValue([]);
        usePOS.setState({
            initialized: false,
            // Simulate a fresh boot: no type selected yet (e.g. after a wipe).
            order: { ...usePOS.getState().order, type: undefined },
            options: { [POS_OPTION_KEYS.orderTypes]: ['delivery', 'takeaway'] },
        } as any);

        usePOS.getState().initialize();

        expect(usePOS.getState().order.type?.identifier).toBe('takeaway');
    });

    it('prices a scanned product line from quantities + source (barcode scan payload contract)', async () => {
        // Payload shape built by addProductWithUnit (pos-system) from the
        // /products/search/using-barcode response. The engine derives the
        // unit price from `quantities` and the tax split from
        // `source.tax_group` on recompute — a line without them is priced 0.
        await usePOS.getState().addToCart({
            order_id: null,
            product_id: 1,
            name: 'Twin Comforter Sets',
            product_type: 'product',
            rate: 16,
            quantity: 1,
            tax_group_id: 1,
            tax_type: 'inclusive',
            quantities: {
                id: 1, unit_id: 1, quantity: 775,
                sale_price: 86.45, sale_price_edit: 86.45,
                sale_price_without_tax: 74.5259, sale_price_with_tax: 86.45,
                sale_price_tax: 11.9241,
                unit: { id: 1, name: 'Piece' },
            },
            source: {
                id: 1, category_id: 1, tax_type: 'inclusive',
                tax_group: {
                    id: 1, name: 'GST',
                    taxes: [{ id: 1, name: 'SGST', rate: 8 }, { id: 2, name: 'CGST', rate: 8 }],
                },
            },
            unit_id: 1,
            unit_price: 86.45,
            price_with_tax: 86.45,
            price_without_tax: 74.5259,
            unit_name: 'Piece',
            mode: 'normal',
            unit_quantity_id: 1,
            _uuid: 'scan-1-1',
        } as any);

        const [line] = usePOS.getState().products;

        // Unit price follows the price basis (option off → without tax).
        expect(line.unit_price).toBeCloseTo(74.5259, 3);
        // Tax split from source.tax_group (GST 8% + 8% on the inclusive 86.45).
        expect(line.price_with_tax).toBeCloseTo(86.45, 3);
        expect(line.price_without_tax).toBeCloseTo(74.5259, 3);
        expect(line.total_tax_value).toBeCloseTo(11.9241, 3);
        // The payable total is always the with-tax amount.
        expect(line.total_price).toBeCloseTo(86.45, 3);
    });
});

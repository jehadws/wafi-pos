/**
 * services/product-units.ts
 *
 * Unit-quantity resolution for POS product clicks.
 *
 * The category content payload (GET /api/categories/pos/{id}) already
 * hydrates `product.unit_quantities` — including the `unit` relation,
 * stock quantity and sale prices — everything the cart needs. Resolving
 * units from that payload skips the per-click
 * GET /api/products/{id}/units/quantities round-trip and makes
 * add-to-cart instantaneous.
 *
 * The units API applies the backend `visible()` scope
 * (ProductService::getProductUnitQuantities → ProductUnitQuantity::scopeVisible)
 * which the category payload's eager load does not — so the preloaded
 * units are filtered the same way to keep the unit list identical to what
 * the API would have returned. Products that arrive WITHOUT
 * `unit_quantities` (e.g. from search or older payloads) still hit the API.
 */

import { productsApi } from '@/api';

/**
 * Mirrors ProductUnitQuantity::scopeVisible (`where visible = true`).
 * A missing/null flag counts as visible — older payloads predate the column.
 */
export function isUnitQuantityVisible(unitQuantity: UnitQuantity): boolean {
    return (
        unitQuantity.visible === undefined ||
        unitQuantity.visible === null ||
        Boolean(unitQuantity.visible)
    );
}

/**
 * Resolves the sellable unit quantities for a product, preferring the
 * payload loaded with the category content over a network round-trip.
 */
export async function resolveProductUnitQuantities(product: Product): Promise<UnitQuantity[]> {
    if (Array.isArray(product.unit_quantities)) {
        return product.unit_quantities.filter(isUnitQuantityVisible);
    }
    return productsApi.getUnitQuantities(product.id);
}

/**
 * services/stock.ts
 *
 * Pure domain stock validation rules for POS cart operations.
 */

export interface StockValidationResult {
    allowed: boolean;
    available: number;
    reason?: string;
}

/**
 * Validates whether the requested quantity can be added or updated in the cart.
 *
 * @param availableQuantity - Available inventory from the product/unit quantity object.
 * @param requestedQuantity - Desired new quantity or quantity to add.
 * @param currentCartQuantity - Quantity already present in cart (for new additions).
 */
export function validateStockAvailability(
    availableQuantity: number | null | undefined,
    requestedQuantity: number,
    currentCartQuantity = 0,
): StockValidationResult {
    if (requestedQuantity <= 0) {
        return { allowed: false, available: 0, reason: 'Quantity must be greater than zero.' };
    }

    // Unlimited stock if availableQuantity is explicitly null/undefined (e.g. non-stock tracked service)
    if (availableQuantity === null || availableQuantity === undefined) {
        return { allowed: true, available: Infinity };
    }

    const available = Number(availableQuantity);

    if (available <= 0) {
        return { allowed: false, available: 0, reason: 'Product is out of stock.' };
    }

    const totalNeeded = currentCartQuantity + requestedQuantity;
    if (totalNeeded > available) {
        const remaining = Math.max(0, available - currentCartQuantity);
        return {
            allowed: false,
            available,
            reason: `Not enough stock. Available: ${remaining} (in cart: ${currentCartQuantity}, total stock: ${available})`,
        };
    }

    return { allowed: true, available };
}

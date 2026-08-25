# CartEngine Implementation Plan

## Executive Summary

**Problem:** Pricing logic scattered across 4 modules (817 lines), closures leaking into state, unpredictable mutations blocking serialization and testing.

**Solution:** Single deterministic `CartEngine` with pure functions, immutable data, zero closures.

**Risk Level:** Medium (touches revenue-critical code, but has existing test coverage)

**Estimated Effort:** 2-3 days with phased verification

---

## Phase 0: Type Definitions & Architecture Setup

**Goal:** Define the new serializable data structures BEFORE touching existing code.

### Step 0.1: Create Type Definitions

**File:** `resources/js/types/cart-engine.ts`

```typescript
import { OrderProduct } from './models/order-product';
import { Order } from './models/order';
import { ProductUnitQuantity } from './models/product-unit-quantity';
import { TaxGroup } from './models/tax';

/**
 * Serializable snapshot of the catalog product a cart line came from.
 * Replaces the former $original: () => any closure.
 */
export interface OrderProductSource {
    id: number;
    category_id: number;  // For coupon category validation
    tax_type: string;
    tax_group: TaxGroup | null;
}

/**
 * Input to CartEngine.computeCart()
 */
export interface CartDraft {
    products: OrderProduct[];
    coupons: Coupon[];
    order: Order;
}

/**
 * Output from CartEngine.computeCart()
 */
export interface ComputedCart {
    products: OrderProduct[];
    order: Order;
    validCoupons: Coupon[];
    invalidCoupons: Coupon[];
}

/**
 * POS configuration options (tax mode, pricing display, etc.)
 */
export interface POSOptions {
    ns_jgrem_price_with_tax: 'yes' | 'no';
    ns_jgrem_vat: 'flat_vat' | 'variable_vat' | 'products_vat';
    [key: string]: any;  // Preserve existing flexibility
}
```

### Step 0.2: Extend OrderProduct Type

**File:** `resources/js/types/models/order-product.ts`

Add NEW fields alongside existing closure fields (don't remove yet):

```typescript
export interface OrderProduct extends Product {
    // ... existing fields ...
    
    // NEW: Serializable replacements for closures (Phase 4 will switch to these)
    /**
     * Serializable snapshot of the unit quantity row this line was added from.
     * Replaces $quantities() closure.
     */
    quantities?: ProductUnitQuantity;
    
    /**
     * Serializable snapshot of the source catalog product.
     * Replaces $original() closure.
     */
    source?: OrderProductSource;
    
    // LEGACY: Will be removed in Phase 4
    /** @deprecated Use quantities field instead */
    $quantities?: () => ProductUnitQuantity;
    /** @deprecated Use source field instead */
    $original?: () => any;
}
```

### Step 0.3: Define Coupon Type

**File:** `resources/js/types/models/coupon.ts` (new file)

```typescript
export interface Coupon {
    id: number;
    name: string;
    code: string;
    type: 'percentage_discount' | 'flat_discount' | 'product_discount';
    value: number;
    products: Array<{ product_id: number }>;
    categories: Array<{ category_id: number }>;
    minimum_cart_value?: number;
    maximum_cart_value?: number;
    limit_usage?: number;
    [key: string]: any;
}
```

**Verification:** `npm run types` — should have 0 NEW errors

---

## Phase 1: Build CartEngine Core (No Behavior Changes)

**Goal:** Create the new engine with ALL logic consolidated, but keep closures working.

### Step 1.1: Create CartEngine File

**File:** `resources/js/services/cart-engine.ts`

**Strategy:** Copy logic from existing 4 modules into one file. Keep identical behavior.

```typescript
/**
 * services/cart-engine.ts
 *
 * Deterministic cart computation engine.
 * Pure functions — no Zustand, no side effects, no closures.
 * 
 * Architecture:
 *   - computeCart(): Full cart recomputation
 *   - computeItem(): Single item recomputation
 *   - applyCoupons(): Coupon validation and application
 * 
 * All functions return NEW objects — inputs are never mutated.
 */

import { OrderProduct } from '@/types/models/order-product';
import { Order } from '@/types/models/order';
import { ProductUnitQuantity } from '@/types/models/product-unit-quantity';
import { CartDraft, ComputedCart, POSOptions, OrderProductSource } from '@/types/cart-engine';
import * as math from 'mathjs';

// ---------------------------------------------------------------------------
// Section 1: Primitive Tax Math (from tax.ts)
// ---------------------------------------------------------------------------

export function computeInclusive(value: number, rate: number): number { ... }
export function computeExclusive(value: number, rate: number): number { ... }
export function getTaxValue(type: string, value: number, rate: number): number { ... }
export function computeTaxForGroup(price: number, tax_group: any, tax_type: string): TaxGroupResult { ... }

// ---------------------------------------------------------------------------
// Section 2: Price Resolution (from pricing.ts)
// ---------------------------------------------------------------------------

export function getSalePrice(item: ProductUnitQuantity | undefined, options: POSOptions): number { ... }
export function getWholesalePrice(item: any, options: POSOptions): number { ... }
export function getCustomPrice(item: any, options: POSOptions): number { ... }

// ---------------------------------------------------------------------------
// Section 3: Product-Level Computation (from order-builder.ts + tax.ts)
// ---------------------------------------------------------------------------

/**
 * Core product computation — returns a NEW OrderProduct object.
 * Handles: unit price resolution, tax computation, discount application, total calculation.
 */
export function computeProduct(product: OrderProduct, options: POSOptions): OrderProduct {
    const computed: OrderProduct = { ...product };
    
    // Clone quantities if present (prevents mutation of input)
    if (computed.quantities) {
        computed.quantities = { ...computed.quantities };
    }
    
    // Resolve unit price based on mode
    if (computed.product_type === 'product') {
        if (computed.mode === 'normal' && computed.quantities) {
            computed.unit_price = getSalePrice(computed.quantities, options);
        } else if (computed.mode === 'wholesale' && computed.quantities) {
            computed.unit_price = getWholesalePrice(computed.quantities, options);
        }
        // Custom mode: keep user-set unit_price
    }
    
    // Compute tax fields
    computeProductTaxValue(computed);
    
    // Compute totals
    computed.total_price = math.chain(computed.unit_price)
        .multiply(computed.quantity)
        .subtract(computed.discount || 0)
        .done();
    
    // ... (rest of computation)
    
    return computed;
}

/**
 * Tax computation — mutates the passed product object (internal helper).
 * Call-sites pass a fresh clone.
 */
function computeProductTaxValue(product: OrderProduct): void {
    const tax_group = product.source?.tax_group ?? product.$original?.()?.tax_group;
    // ... (tax computation logic)
}

// ---------------------------------------------------------------------------
// Section 4: Order-Level Computation (from tax.ts + pricing.ts)
// ---------------------------------------------------------------------------

/**
 * Aggregates products into order totals.
 */
export function sumProductsTotals(order: Order, products: OrderProduct[], options: POSOptions): Order { ... }
export function computeOrderTaxGroup(order: Order, taxGroup: any, options: POSOptions): Order { ... }
export function computeOrderTaxes(order: Order, options: POSOptions): Order { ... }

// ---------------------------------------------------------------------------
// Section 5: Coupon Validation & Application
// ---------------------------------------------------------------------------

/**
 * Validates coupons against cart contents and applies discounts.
 */
export function validateCoupons(
    products: OrderProduct[],
    coupons: Coupon[],
    options: POSOptions,
): { validCoupons: Coupon[]; invalidCoupons: Coupon[] } { ... }

// ---------------------------------------------------------------------------
// Section 6: Main Entry Points
// ---------------------------------------------------------------------------

/**
 * Full cart recomputation — the primary API.
 * Input: draft cart + options
 * Output: computed cart with all derived fields populated
 */
export function computeCart(draft: CartDraft, options: POSOptions): ComputedCart {
    // 1. Compute all products
    const products = draft.products.map(p => computeProduct(p, options));
    
    // 2. Validate coupons
    const { validCoupons, invalidCoupons } = validateCoupons(products, draft.coupons, options);
    
    // 3. Apply coupon discounts to products
    const productsWithCoupons = applyCouponDiscounts(products, validCoupons);
    
    // 4. Compute order-level totals
    let order = sumProductsTotals({ ...draft.order }, productsWithCoupons, options);
    order = computeOrderTaxes(order, options);
    
    return {
        products: productsWithCoupons,
        order,
        validCoupons,
        invalidCoupons,
    };
}

/**
 * Single-item recomputation — for incremental updates.
 */
export function computeItem(item: OrderProduct, options: POSOptions): OrderProduct {
    return computeProduct(item, options);
}
```

### Step 1.2: Write Comprehensive Tests

**File:** `resources/js/tests/unit/cart-engine.test.ts`

```typescript
import { computeCart, computeItem, validateCoupons } from '@/services/cart-engine';
import { OrderProduct } from '@/types/models/order-product';

describe('services/cart-engine.ts', () => {
    describe('computeItem', () => {
        it('computes normal mode pricing with tax-inclusive', () => { ... });
        it('computes wholesale mode pricing', () => { ... });
        it('computes custom mode pricing (user-set price)', () => { ... });
        it('applies percentage discounts correctly', () => { ... });
        it('applies flat discounts correctly', () => { ... });
        it('handles products without tax groups', () => { ... });
        it('never mutates the input product', () => { ... });
    });
    
    describe('computeCart', () => {
        it('computes multi-item cart totals', () => { ... });
        it('aggregates taxes across products', () => { ... });
        it('handles dynamic products (percentage-based)', () => { ... });
    });
    
    describe('validateCoupons', () => {
        it('validates product-specific coupons', () => { ... });
        it('validates category-specific coupons', () => { ... });
        it('rejects coupons when conditions not met', () => { ... });
    });
    
    describe('immutability', () => {
        it('computeItem returns new object', () => { ... });
        it('computeCart returns new objects throughout', () => { ... });
        it('nested quantities object is cloned', () => { ... });
    });
});
```

**Verification:** 
- `npm run test` — all existing tests + new tests pass
- `npm run types` — 0 new errors

---

## Phase 2: Migrate Consumers (One at a Time)

**Goal:** Switch each consumer to use CartEngine, verify at each step.

### Step 2.1: Migrate use-cart-store.ts

**Changes:**

```typescript
// BEFORE
import { recomputeProducts } from '@/services/order-builder';

// AFTER
import { computeItem } from '@/services/cart-engine';

// In recomputeProducts method:
recomputeProducts: (products = null) => {
    const options = get().options ?? {};
    const items = products ?? get().products;
    return items.map(item => computeItem(item, options));
},

// In updateProduct:
updateProduct: (product, data, index = null) => {
    const products = get().products;
    const resolvedIndex = index === null ? products.indexOf(product) : index;
    const finalIndex = resolvedIndex === -1 ? 0 : resolvedIndex;
    
    const newProducts = products.map((p, i) => 
        i === finalIndex ? { ...p, ...data } : p
    );
    
    const recomputed = get().recomputeProducts(newProducts);
    set({ products: recomputed });
    get().refreshCart();
},
```

**Verification:** Run cart operations manually, `npm run test`

### Step 2.2: Migrate usePOS.ts

**Changes:**

```typescript
// BEFORE
import { computeOrderTaxGroup, computeOrderTaxes } from '@/services/tax';
import { sumProductsTotals } from '@/services/pricing';
import { defineQuantities } from '@/services/order-builder';

// AFTER
import { computeCart } from '@/services/cart-engine';
// Keep defineQuantities for now (async API call)

// In refreshCart:
refreshCart: () => {
    const { products, order, options } = get();
    
    const result = computeCart(
        { products, coupons: order.coupons, order },
        options ?? {}
    );
    
    set({
        products: result.products,
        order: result.order,
    });
    
    // Handle invalid coupons
    if (result.invalidCoupons.length > 0) {
        result.invalidCoupons.forEach(coupon => {
            toast.error(`Coupon "${coupon.name}" is no longer valid`);
            get().removeCoupon(coupon);
        });
    }
},
```

**Verification:** Run full POS flow, `npm run test`

### Step 2.3: Migrate pos-system.tsx

**Current usage (line 147):**
```typescript
const quantities = product.$quantities ? product.$quantities() : null;
const stockCheck = validateStockAvailability(quantities?.quantity, quantity, 0);
```

**After migration:**
```typescript
const quantities = product.quantities ?? null;
const stockCheck = validateStockAvailability(quantities?.quantity, quantity, 0);
```

**But wait:** `product.quantities` doesn't exist yet. This is why Phase 4 must come first.

**Strategy:** Skip this migration in Phase 2. Do it in Phase 4 after serializable fields are populated.

### Step 2.4: Migrate cart-item.tsx

**Current usage (line 60):**
```typescript
const quantities = item.$quantities ? item.$quantities() : null;
```

**Same issue:** Can't migrate until Phase 4.

**Decision:** Phase 2 only migrates the STORE consumers (use-cart-store.ts, usePOS.ts). Component consumers wait for Phase 4.

---

## Phase 3: Delete Deprecated Modules

**Goal:** Remove old modules now that CartEngine is the single source of truth.

**Prerequisites:**
- All store consumers migrated to CartEngine
- All tests passing
- Manual POS verification complete

**Files to delete:**
- `resources/js/services/cart-calculator.ts`
- `resources/js/services/pricing.ts`
- `resources/js/services/tax.ts`
- `resources/js/services/order-builder.ts`

**Keep for now:**
- Test files (will be archived, not deleted)
- `defineQuantities` function (async API call, move to separate file)

**Verification:**
- `npm run test` — only CartEngine tests remain
- `npm run types` — 0 errors
- Manual POS testing — all operations work

---

## Phase 4: Replace Closures with Serializable Snapshots

**Goal:** Eliminate `$quantities` and `$original` closures completely.

### Step 4.1: Update OrderProduct Type

**Remove deprecated fields:**

```typescript
export interface OrderProduct extends Product {
    // ... existing fields ...
    
    /**
     * Serializable snapshot of the unit quantity row.
     */
    quantities?: ProductUnitQuantity;
    
    /**
     * Serializable snapshot of the source catalog product.
     */
    source?: OrderProductSource;
    
    // REMOVED: $quantities and $original
}
```

### Step 4.2: Update CartEngine to Populate Snapshots

**In computeProduct:**

```typescript
export function computeProduct(product: OrderProduct, options: POSOptions): OrderProduct {
    const computed: OrderProduct = { ...product };
    
    // Ensure quantities is cloned
    if (computed.quantities) {
        computed.quantities = { ...computed.quantities };
    }
    
    // If source is missing, build it from closure (temporary backward compat)
    if (!computed.source && product.$original) {
        const original = product.$original();
        computed.source = {
            id: original.id,
            category_id: original.category_id,
            tax_type: original.tax_type,
            tax_group: original.tax_group,
        };
    }
    
    // ... rest of computation
}
```

### Step 4.3: Update Add-to-Cart Flow

**File:** `resources/js/hooks/pos/use-cart-store.ts`

```typescript
addToCart: async (product) => {
    let cartProduct: OrderProduct = {
        // ... existing fields ...
        
        // NEW: Populate serializable snapshots
        quantities: product.$quantities ? product.$quantities() : product.quantities,
        source: {
            id: product.id || product.product_id,
            category_id: product.category_id,
            tax_type: product.tax_type,
            tax_group: product.tax_group,
        },
    };
    
    // ... rest of logic
},
```

### Step 4.4: Update Order Loading Flow

**File:** `resources/js/hooks/usePOS.ts`

**Current (lines 434-447):**
```typescript
orderProduct.$original = () => orderProduct.product;
orderProduct.$quantities = () => {
    const unitQuantity = orderProduct.product.unit_quantities.filter(...)[0];
    // ... mutation logic
    return unitQuantity;
};
```

**New:**
```typescript
// Resolve unit quantity once
const unitQuantity = orderProduct.product.unit_quantities.filter(
    (uq: any) => +uq.id === +orderProduct.unit_quantity_id || uq.id === undefined,
)[0];

// Sync custom-mode price fields
if (orderProduct.mode === 'custom' && unitQuantity) {
    unitQuantity.custom_price_edit = orderProduct.unit_price;
    unitQuantity.custom_price_with_tax = orderProduct.price_with_tax;
    unitQuantity.custom_price_without_tax = orderProduct.price_without_tax;
    unitQuantity.custom_price_tax = orderProduct.tax_value;
}

// Populate serializable snapshots
orderProduct.quantities = unitQuantity;
orderProduct.source = {
    id: orderProduct.product.id,
    category_id: orderProduct.product.category_id,
    tax_type: orderProduct.product.tax_type,
    tax_group: orderProduct.product.tax_group,
};
```

### Step 4.5: Update Component Consumers

**File:** `resources/js/components/pos/cart-item.tsx`

```typescript
// BEFORE
const quantities = item.$quantities ? item.$quantities() : null;

// AFTER
const quantities = item.quantities ?? null;
```

**File:** `resources/js/components/pos/pos-system.tsx`

```typescript
// BEFORE
const quantities = product.$quantities ? product.$quantities() : null;

// AFTER
const quantities = product.quantities ?? null;
```

**File:** `resources/js/components/pos/products-categories-panel.tsx`

```typescript
// BEFORE
$quantities: () => selectedUnitQuantity,

// AFTER
quantities: selectedUnitQuantity,
```

### Step 4.6: Update Coupon Validation

**File:** `resources/js/hooks/pos/use-cart-store.ts` (line 212)

```typescript
// BEFORE
.includes(product.$original?.()?.category_id),

// AFTER
.includes(product.source?.category_id),
```

**Verification:**
- `npm run test` — all tests pass
- `npm run types` — 0 errors
- Manual POS test: add items, change quantities/prices/modes, apply coupons, switch wholesale

---

## Phase 5: Final Cleanup & Verification

### Step 5.1: Remove Closure Fields from Types

**Delete from:**
- `resources/js/types/models/order-product.ts`
- `resources/js/types/models/product.ts`
- `resources/js/types/pos.d.ts`

### Step 5.2: Update Remaining Tests

**Files:**
- `cart-calculator.test.ts` → delete (functionality in cart-engine.test.ts)
- `pricing.test.ts` → delete (functionality in cart-engine.test.ts)
- `tax.test.ts` → delete (functionality in cart-engine.test.ts)
- `order-builder.test.ts` → delete (functionality in cart-engine.test.ts)

### Step 5.3: Comprehensive Manual Testing

**Test scenarios:**

1. **Add products to cart**
   - Normal pricing mode
   - Wholesale pricing mode
   - Custom pricing mode
   - Multiple quantities
   - Different unit types

2. **Update cart items**
   - Change quantity
   - Change price (custom mode)
   - Apply percentage discount
   - Apply flat discount
   - Switch normal ↔ wholesale

3. **Apply coupons**
   - Product-specific coupon
   - Category-specific coupon
   - Invalid coupon rejection

4. **Tax scenarios**
   - Tax-inclusive pricing
   - Tax-exclusive pricing
   - Multiple tax groups
   - Products without tax

5. **Order operations**
   - Load existing order
   - Save draft order
   - Complete checkout

6. **Edge cases**
   - Empty cart
   - Single item
   - Large quantities
   - Zero-price items

### Step 5.4: Performance Verification

**Measure:**
- Cart recomputation time (should be < 10ms for 50 items)
- Memory usage (no leaks from cloned objects)
- TypeScript compilation time

---

## Risk Mitigation

### Rollback Plan

Each phase creates a git commit. If issues found:

1. **Phase 0-1:** Delete cart-engine.ts, revert type changes
2. **Phase 2:** Revert consumer imports
3. **Phase 3:** Restore deleted module files from git
4. **Phase 4:** Revert type changes, restore closure usage

### Testing Strategy

- **Unit tests:** Run after every file change
- **Integration tests:** Run after each phase
- **Manual testing:** Run after Phases 2, 3, 4, 5
- **Regression testing:** Compare cart totals before/after refactoring

### Feature Flags (Optional)

Consider a feature flag to toggle between old and new engines during transition:

```typescript
const USE_CART_ENGINE = true;

function recomputeProducts(products: OrderProduct[], options: POSOptions): OrderProduct[] {
    if (USE_CART_ENGINE) {
        return products.map(p => computeItem(p, options));
    }
    // Legacy path
    return legacyRecomputeProducts(products, options);
}
```

---

## Timeline

| Phase | Duration | Milestone |
|-------|----------|-----------|
| 0 | 2 hours | Types defined, 0 new type errors |
| 1 | 1 day | CartEngine built, tests passing |
| 2 | 4 hours | Store consumers migrated |
| 3 | 1 hour | Old modules deleted |
| 4 | 4 hours | Closures replaced, components updated |
| 5 | 2 hours | Final verification, manual testing |

**Total: 2-3 days**

---

## Success Criteria

✅ All existing tests pass  
✅ 0 new TypeScript errors  
✅ CartEngine is the single source of truth for cart math  
✅ No closures in OrderProduct type  
✅ Cart state is JSON-serializable  
✅ All POS operations work correctly  
✅ Performance is acceptable (< 10ms for 50 items)  

---

## Open Questions

1. **Async `defineQuantities` function** — Should this stay in CartEngine or move to a separate API module?
   - **Recommendation:** Move to `resources/js/api/taxes.ts` since it makes network calls

2. **Coupon discount application** — Should CartEngine apply discounts to products or return discount amounts?
   - **Recommendation:** Return discount amounts, let the store decide how to apply

3. **Error handling** — How should CartEngine handle invalid data?
   - **Recommendation:** Return gracefully degraded results (zero tax, no discount) and log warnings

---

## Next Steps

1. Review this plan
2. Clarify open questions
3. Start Phase 0 (type definitions)
4. Verify at each phase before proceeding

Ready to begin Phase 0?

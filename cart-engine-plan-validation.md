# Plan Validation — Candidate 1: POS Cart & Pricing Pipeline (CartEngine)

> **Verdict: Directionally sound, NOT executable as written.**
> The phase skeleton (types → engine → migrate consumers → delete modules) is correct and the
> addition of `pos-system.tsx` as a consumer is a genuine catch. However, verification against the
> codebase found **4 blocking factual errors** and **6 significant gaps** that must be resolved
> before implementation.

Every claim below was verified against the current tree (`resources/js/**`) on commit `048f1df`.

---

## ✅ What the plan gets RIGHT (verified)

| Claim | Verification |
|---|---|
| All 4 target modules exist | `services/cart-calculator.ts` (106 ln), `pricing.ts` (121 ln), `tax.ts` (423 ln), `order-builder.ts` (164 ln) |
| Consumer list | Import scan confirms exactly 3 production consumers: `hooks/pos/use-cart-store.ts` ← `recomputeProducts`; `hooks/usePOS.ts` ← `defineQuantities`, `sumProductsTotals`, `computeOrderTaxGroup`, `computeOrderTaxes`; `components/pos/pos-system.tsx` ← 3 × `CartCalculator.calculate*` |
| Adding pos-system.tsx was critical | Correct — it imports `CartCalculator` directly and would break on deletion |
| Internal mutation must be rewritten | Real and **understated**: `tax.ts` does `order.tax_value +=` (cumulative — calling twice double-counts), mutates `taxGroup.taxes`, `order.taxes/tax_group`, and quantity objects; `pricing.ts` also mutates (`order.subtotal`, dynamic-product fields). The plan only calls out tax functions. |
| `$quantities` closure replacement is worthwhile | Yes — closures are non-serializable (break persistence/devtools), and the one in `usePOS.loadOrder()` has side effects (mutates `unitQuantity.custom_price_*` on every call) |
| Verification commands exist | `npm run test` → `vitest run`; `npm run types` → `tsc --noEmit`. Both present in package.json |
| Phase ordering | Sound |

---

## 🔴 BLOCKING ERRORS (plan fails as written)

### B1. Phase 0 references a `Coupon` type that doesn't exist
There is no `types/models/coupon.ts`. Coupons are an **inline anonymous type** inside
`Order.coupons` (`types/models/order.ts` L23–54). Phase 0 must first extract a `Coupon`
interface (or use `Order['coupons'][number]`).

Related: `ComputedCart.validCoupons / invalidCoupons` implies coupon-validation logic lives in
CartEngine, but today that logic lives in `use-cart-store.checkCart()` (product/category matching,
L188–227) and inline in `usePOS.refreshCart()` (`total_coupons` computation, L154–168). The plan
never states this logic moves — as written, nothing produces those two arrays.

### B2. Phase 0 `POSOptions` shape doesn't match reality
Plan proposes `{ tax_inclusive: boolean; tax_type: string }`. Actual code reads stringly-typed
option keys everywhere:
- `options.ns_jgrem_price_with_tax === 'yes' | 'no'` (pricing.ts L26, tax.ts L198)
- `options.ns_jgrem_vat === 'flat_vat' | 'variable_vat' | 'products_vat'` (tax.ts L164, L184)

The proposed named fields are unused/misleading. Either keep `[key: string]: any` with the real
keys documented, or add an explicit mapping adapter — but don't ship fields nothing reads.

### B3. Phase 1 `defineQuantities` signature is wrong
Actual signature (`order-builder.ts` L31):
```ts
defineQuantities(product: any, units: any[] = []): Promise<any>
```
It takes a **product** (+ optional units array for unit-name resolution), calls
`taxesApi.getGroup(product.tax_group_id)` when a tax group exists, and returns the flat
mode-keyed quantities object. The plan's `defineQuantities(units: ProductUnitQuantity[])`
matches nothing in the codebase.

### B4. Phase 3 breaks the build: the 4 test files are consumers too
These files import the modules directly and will fail collection after deletion:
- `tests/unit/cart-calculator.test.ts`
- `tests/unit/pricing.test.ts`
- `tests/unit/tax.test.ts`
- `tests/unit/order-builder.test.ts`

The plan lists running them as a "regression gate" but never migrates them.
**Fix:** port these 4 suites onto `cart-engine.test.ts` *before* Phase 3 deletion — that porting
IS the behavioral-regression mechanism. (Note: `tests/unit/use-cart-store.test.ts` does NOT import
the services directly — no changes needed there.)

---

## 🟠 SIGNIFICANT GAPS

### G1. Dual, incompatible tax semantics must be reconciled explicitly
- `cart-calculator.ts`: tax via **ratio** (`tax_value / price_without_tax`) with `.toFixed(2)`
  rounding (L12–18).
- `tax.ts`: tax via **rate formulas** through mathjs, no rounding (`computeTaxForGroup`,
  `getVatValue`).

Same inputs can yield different outputs. "Consolidate" silently changes behavior on one side.
The plan needs an explicit decision on which semantics wins for quantity/price/discount updates,
with golden-value tests pinned from **both** modules pre-merge.

### G2. CartEngine's 3-method interface doesn't cover its own consumer table
Consumers need at minimum: `computeProduct`/`recomputeProducts`, `sumProductsTotals`,
`computeOrderTaxGroup`, `computeOrderTaxes`, and the 3 CartCalculator update-calculators.
Additionally these exports have **zero production callers** (test-covered only) — decide per
function whether to absorb, drop, or keep internal: `getStockUsage`, `getPrice`,
`getProductUnitPrice`, `getCustomPrice`, `computeProductTax` (+ the three per-mode variants),
and primitives (`getVatValue`, `getPriceWithoutTax`, `getPriceWithTax`, `computeInclusive`,
`computeExclusive`, deprecated `Tax` class shim).

### G3. pos-system.tsx pattern mismatch
Its 3 call sites produce a **partial patch** passed to `updateProduct(product, updatedValues)`,
which spread-merges in the store (`use-cart-store.updateProduct` L167–177).
`computeItem(item, options): OrderProduct` returns a full product. Migration must either expose
patch-style methods on CartEngine or restructure those handlers — unaddressed.

### G4. Phase 4 scope is underestimated ~3×, and two claims are factually wrong
- **"$quantities is set by tax.ts"** — false. It is *created* in `usePOS.loadOrder()`
  (L435–449, side-effecting closure) and in `products-categories-panel.tsx`
  (`$quantities: () => selectedUnitQuantity`); `tax.ts` merely reassigns it after mutation.
- **"$original is used in use-cart-store.ts for price rollback"** — incomplete/misleading. Real
  usages: coupon **category validation** (`checkCart`: `product.$original?.()?.category_id`),
  tax_group/tax_type lookups throughout `tax.ts` (`proceedProductTaxComputation` L224,
  `computeProductTaxValue` L328), fallback creation in `addToCart`
  (`$original: product.$original || (() => product)`). Replacing `$original` with
  `originalPrice?: number` **breaks category validation** — you need a snapshot of the original
  product (id / category_id / tax_group / tax_type), not a price.
- **Proposed shape `{ [unitId]: { price, quantity, label } }` doesn't match
  `ProductUnitQuantity`** — a flat object with ~17 mode-prefixed fields (`sale_price_with_tax`,
  `wholesale_price_edit`, `custom_price_tax`, …). Consumers read mode-specific fields
  (`cart-item.tsx` normal↔wholesale switching, stock checks in `pos-system.tsx`).
- Files touched by Phase 4 beyond the services: `usePOS.ts`, `use-cart-store.ts`,
  `cart-item.tsx`, `pos-system.tsx`, `products-categories-panel.tsx`, plus 3 type files
  (`types/models/order-product.ts`, `types/models/product.ts`, `types/pos.d.ts`).

### G5. "Shallow clone + recompute" reproduces an existing immutability bug
Today `computeProduct` shallow-clones but shares the `$quantities` closure; tax functions then
mutate the *shared* underlying quantities object (`computeCustomProductTax` writes
`quantities.custom_price_without_tax = …` etc.) — so `recomputeProducts` already mutates nested
input state despite its docstring claiming otherwise. A shallow clone in CartEngine preserves
this bug. Genuine immutability requires cloning/replacing the quantities object too.

### G6. Sync `computeCart` vs async server round-trip
Current `refreshCart` calls the **server** mid-pipeline (`get().computeTaxes()` →
`taxesApi.getGroup` / order-level tax fetch, usePOS.ts L182–193). A sync
`computeCart(draft, options)` must clarify what stays server-side vs. moves client-side, or the
totals pipeline changes behavior.

---

## 🟡 Minor
- CartCalculator has 4 statics, not 3 (`calculateNewTaxValue` is an internal helper used by
  `calculateTotalsForPriceUpdate`) — external call sites are 3, so nearly right.
- Verification omits `npm run lint` (eslint runs with `--max-warnings 0`).
- Manual test checklist should add: **loadOrder / resume held order** (where the closures are
  born) and **normal↔wholesale toggle** (`cart-item.tsx`).

---

## Recommended revision

1. **Keep Phases 0–3**, with fixes:
   - Extract a real `Coupon` type from `Order.coupons` (Phase 0).
   - Fix `POSOptions` to the actual option keys (`ns_jgrem_price_with_tax`, `ns_jgrem_vat`).
   - Fix `defineQuantities(product, units?)` signature and return shape.
   - Expand the CartEngine surface to cover everything the consumer table imports.
   - Add an explicit step between migration and deletion: **port the 4 test suites onto
     `cart-engine.test.ts`**.
   - Decide the tax-semantics question (ratio+rounding vs rate-formula) with pinned golden values.
2. **Split Phase 4 into a separate follow-up PR.** It is a cross-cutting data-model redesign
   (8+ files, side-effecting closures, category-validation dependency on `$original`) — bundling
   it into this consolidation multiplies risk. In this PR keep `$quantities`/`$original` typed
   as-is; do the serializable-quantities redesign after the engine lands, with its own migration
   checklist (files listed in G4).
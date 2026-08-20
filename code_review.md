# Frontend Code Review — SOLID Violations, Bugs & Best Practices

## Summary

After a full audit of the `resources/js` frontend, here are the **critical issues**, ranked by severity and grouped by principle.

---

## 🔴 Critical Bugs

### 1. Direct State Mutation (usePOS.ts & setters)
**Files**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/usePOS.ts#L658-L698), [`use-payments-store.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/pos/use-payments-store.ts#L84-L88)

The setter methods mutate the `order` object **directly before calling `set()`**. Zustand requires immutable updates — if the same object reference is passed to `set`, React won't re-render.

```ts
// ❌ BAD — mutates the retrieved reference
setDiscount: (value, type = 'flat') => {
    const order = get().order;   // gets the current reference
    order.discount = value;      // ← MUTATES IN PLACE
    order.discount_type = type;  // ← MUTATES IN PLACE
    set({ order });              // same reference = no re-render guarantee
}

// ❌ Also bad — updateCustomerAccount mutates customer directly
updateCustomerAccount: (payment) => {
    const customer = get().order.customer;
    customer.account_amount += payment.value;  // ← MUTATION
}
```

**Fix**: Always spread before mutating:
```ts
setDiscount: (value, type = 'flat') => {
    const order = { ...get().order };   // ✅ shallow copy first
    order.discount = value;
    set({ order });
}
```

---

### 2. Race Condition in `refreshCart`
**File**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources\js\hooks\usePOS.ts#L312-L386)

`refreshCart` is `async` but has **no concurrency guard**. Multiple calls (e.g., rapid product additions) can run in parallel, and the last one to resolve wins — leading to stale/incorrect totals.

```ts
// Multiple concurrent calls can interleave:
refreshCart: async () => {
    // ... sync work
    set({ order });           // first call sets here
    const response = await get().computeTaxes();  // first call awaits
    // second call may overwrite 'order' during this await ↑
    order = response['data'].order;
    set({ order });           // first call overwrites second call's state
}
```

**Fix**: Add an `isRefreshing` flag or cancel the previous call with `AbortController`.

---

### 3. `canProceedAsLaidAway` Uses `window.confirm`
**File**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/usePOS.ts#L447-L522)

`window.confirm()` is a **blocking, non-accessible, browser-native modal** that:
- Blocks the JS event loop
- Looks completely out of place in a React app
- Cannot be styled or translated
- Will be suppressed in many embedded/iframe contexts

```ts
// ❌ Never use window.confirm in a React SPA
const result = await new Promise((resolve, reject) => {
    if (window.confirm('Configure layaway payment?')) {
```

---

### 4. `removeSelectedItems` Mutates State Multiple Times
**File**: [`pos-system.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/pos-system.tsx#L154-L170)

Calls `removeProduct` in a loop — each call triggers `refreshCart()` (an async API call). For 10 selected products, this fires 10 async tax recalculations simultaneously.

```ts
// ❌ Fires N async refreshCart() calls
productsToRemove.forEach((id) => {
    const product = products.find(...);
    if (product) removeProduct(product);  // ← each call → refreshCart()
});
```

---

### 5. Unsafe `.toFixed(2)` on Potentially `undefined`
**File**: [`cart-item.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/cart-item.tsx#L220)

```tsx
// ❌ Will throw if total_price_without_tax is undefined/NaN
${item.total_price_without_tax.toFixed(2)}
```

The `total_price_without_tax` field on `OrderProduct` is a required `number`, but at runtime products freshly added to cart may not have it computed yet.

---

### 6. Missing `catch` in `loadCategories`
**File**: [`products-categories-panel.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/products-categories-panel.tsx#L33-L44)

```ts
} catch (error) {
    // ← EMPTY! Errors silently swallowed
} finally {
```

Silent failures = impossible to debug in production.

---

## 🟠 SOLID Violations

### S — Single Responsibility Principle

#### `usePOS.ts` — God Store (partially improved but still problematic)
**File**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/usePOS.ts)

The 732-line file is still a **"facade" that re-exports 40+ pure functions as thin wrappers on the store**. These wrappers add zero value — they exist only for backward compatibility:

```ts
// ❌ These 15 tax wrappers are pure functions — they don't need to live on the store
getPriceWithoutTax: (value, rate, type) => getPriceWithoutTax(value, rate, type),
getPriceWithTax: (value, rate, type) => getPriceWithTax(value, rate, type),
getVatValue: (value, rate, type) => getVatValue(value, rate, type),
// ... 12 more identical pass-throughs
```

Every component that needs tax math should **import directly from `@/services/tax`**, not from the store.

#### `pos-system.tsx` — Massive Orchestration Component
**File**: [`pos-system.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/pos-system.tsx)

458 lines doing:
- Barcode scanning logic
- Quantity/price/discount management
- Customer selection logic
- Keyboard shortcuts
- Cart selection
- Dialog state for 8 different dialogs
- Debounced search

This is 6+ responsibilities in one component.

#### `OrdersDialog.tsx` — Mixed Data Fetching + UI
**File**: [`orders-dialog.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/orders-dialog.tsx)

Contains 3 nearly identical fetch functions (`getOnHoldOrders`, `getUnpaidOrders`, `getPartiallyPaidOrders`) that should live in a custom hook or the API layer.

---

### O — Open/Closed Principle

#### Payment Methods Hardcoded
**File**: [`payment-gateway-dialog.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/payment-gateway-dialog.tsx#L17-L23)

```ts
// ❌ Adding a new payment type = modifying this file
export const PAYMENT_METHODS: Record<PaymentTypes, string> = {
    'cash-payment': 'Cash Payment',
    'bank-payment': 'Bank Payment',
    'customer-payment': 'Customer Payment',
};
```

Payment types are already defined in the store (`paymentsType` from `use-payments-store.ts`), yet the component hardcodes a separate local list. These two sources can drift out of sync.

#### Tab Error Detection Logic
**File**: [`product-form-fields.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/pages/dashboard/products/product-form-fields.tsx#L63-L93)

Adding a new tab requires modifying `ProductFormFields` AND adding a new `form.errors?.xxx_error` check. Not extensible.

---

### L — Liskov Substitution Principle

#### `OrderProduct extends Product` — Broken Abstraction
**File**: [`order-product.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/interfaces/order-product.ts)

`OrderProduct` extends `Product`, but overrides several fields with different optionality:
- `Product.mode` is **required** (`'normal' | 'wholesale' | 'custom'`)
- `OrderProduct.mode` is **optional** (`mode?: ...`)
- `Product.$original` is typed as `any`, `OrderProduct.$original` is `() => any`

These contradictions mean code written against `Product` cannot safely accept `OrderProduct`.

---

### I — Interface Segregation Principle

#### `ProductFormFieldsProps.form: any`
**File**: [`product-form-fields.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/pages/dashboard/products/product-form-fields.tsx#L28-L31)

```ts
interface ProductFormFieldsProps {
    form: any;  // ❌ 'any' defeats TypeScript entirely
}
```

The `form` object should have a typed interface so each tab gets only the shape it needs.

#### Store Slices Typed as `StateCreator<any>`
**Files**: all files in [`hooks/pos/`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/pos/)

```ts
// ❌ 'any' loses all cross-slice type safety
export const createCartSlice: StateCreator<any, [], [], CartSlice> = (set, get) => ({
```

The `get()` call returns `any`, meaning TypeScript cannot catch when a slice accesses a property that doesn't exist on another slice.

---

### D — Dependency Inversion Principle

#### `use-cart-store.ts` Imports `usersApi` Directly
**File**: [`use-cart-store.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/pos/use-cart-store.ts#L15-L16)

```ts
import { usersApi } from '@/api';
// ... used to check permission in removeProductUsingIndex
```

A cart store (low-level module) directly depends on a concrete API module. Permission checking should be **injected** or delegated to a higher layer.

#### `use-pos-session.ts` Registers `window.beforeunload`
**File**: [`use-pos-session.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/pos/use-pos-session.ts#L136-L143)

```ts
// ❌ Business logic adds a DOM side-effect directly, no cleanup
window.addEventListener('beforeunload', (e) => { ... });
```

No cleanup (`removeEventListener`) is ever called. In development (Strict Mode double-mount), this registers the listener **twice**. It also makes the store tightly coupled to the browser environment.

---

## 🟡 Best Practice Violations

### 1. `.jsx` File in a TypeScript Project
**File**: [`Sidebar.jsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/Sidebar.jsx)

This is the only `.jsx` file in the entire project. It has no types (e.g., `menus` is untyped). Should be `.tsx`.

### 2. `any[]` in Core Types
**File**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/usePOS.ts#L94-L96)

```ts
type POSStoreCoreState = {
    breadcrumbs: any[];  // ❌
    customers: Customer[];
};
```

`breadcrumbs` is typed as `any[]`. A `Breadcrumb` interface should be defined.

### 3. `products.map()` Used for Side Effects
**File**: [`pos-system.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/pos-system.tsx#L190-L194)

```ts
// ❌ .map() is for transformations, not side effects
products.map((product) => {
    if (product.product_id === selectedProduct.product.id) {
        quantityInCart += product.quantity;
    }
});
```

Should use `.forEach()` or `.reduce()`.

### 4. Magic String Keys Throughout
Many places use plain strings for option keys like `'ns_jgrem_price_with_tax'`, `'ns_orders_allow_partial'` without a central constants file. A single typo silently evaluates to `undefined`.

### 5. `new Audio(url).play()` Without Error Handling
**Files**: [`usePOS.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/usePOS.ts#L575-L578), [`use-cart-store.ts`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/pos/use-cart-store.ts#L129-L132)

```ts
// ❌ .play() returns a Promise that can reject (autoplay policy)
new Audio(url).play();
```

Modern browsers block autoplay. The returned Promise should be caught.

### 6. Duplicate `use-mobile.ts` + `use-mobile.tsx`
**Directory**: [`hooks/`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/hooks/)

There are **two files** with the same logical name: `use-mobile.ts` and `use-mobile.tsx`. One is likely a leftover and should be deleted.

### 7. Throw non-Error objects
**Files**: multiple locations in `usePOS.ts`

```ts
// ❌ Throwing plain objects loses stack traces
throw { status: 'error', message: 'No tax group assigned to the order' };
```

Always throw `Error` instances so stack traces are preserved.

### 8. `categories.tsx` is essentially empty
**File**: [`components/pos/categories.tsx`](file:///c:/Users/jehad/Desktop/projects/pos/app/resources/js/components/pos/categories.tsx) (160 bytes)

A 160-byte component file is a likely dead/stub file that should either be completed or deleted.

---

## Priority Fix Order

| Priority | Issue | File |
|----------|-------|------|
| 🔴 P0 | Direct state mutation in setters | `usePOS.ts`, `use-payments-store.ts` |
| 🔴 P0 | Race condition in `refreshCart` | `usePOS.ts` |
| 🔴 P1 | `window.confirm` in store | `usePOS.ts` |
| 🔴 P1 | `removeSelectedItems` N-async problem | `pos-system.tsx` |
| 🔴 P1 | `window.beforeunload` listener leak | `use-pos-session.ts` |
| 🟠 P2 | Remove 15 pass-through store wrappers | `usePOS.ts` |
| 🟠 P2 | `form: any` prop typing | `product-form-fields.tsx` |
| 🟠 P2 | `StateCreator<any>` slices | `hooks/pos/*.ts` |
| 🟠 P2 | Payment method duplication | `payment-gateway-dialog.tsx` |
| 🟡 P3 | `Sidebar.jsx` → `.tsx` | `Sidebar.jsx` |
| 🟡 P3 | Magic option key strings → constants | whole codebase |
| 🟡 P3 | `.map()` used for side effects | `pos-system.tsx` |
| 🟡 P3 | `new Audio().play()` unhandled promise | `usePOS.ts`, `use-cart-store.ts` |
| 🟡 P3 | Delete duplicate `use-mobile` files | `hooks/` |
| 🟡 P3 | Throw `Error` instead of plain objects | `usePOS.ts` |

# Wafi POS Frontend — Refactoring Handoff & Structural Plan

> **Status of this pass:** complete and verified. `tsc --noEmit`: **274 errors before → 274 after** (the only diff is one pre-existing error whose union members print in a different order). Everything is committed as `5598b75` and shipped alongside this doc as `wafi-pos-api-layer-refactor.patch` — apply it on a clean `main` with `git am < wafi-pos-api-layer-refactor.patch`.

---

## 1. What was done in this pass: the API layer

**Problem solved:** 48 files called `axios.get/post/put/delete` directly (~95 call sites). Endpoint URLs, error handling, and response unwrapping were copy-pasted everywhere — UI components depended on the transport layer (Dependency Inversion violation).

**What now exists** — `resources/js/api/`:

| Module | Covers |
|---|---|
| `http.ts` | Shared axios instance: `baseURL: '/api'`, `X-Requested-With` header, and a **real response interceptor** (401/419 → `/login`, 403 → `/errors/access-denied?back=…`). Exports `get/post/put/del` helpers that resolve with the unwrapped body. |
| `orders.ts` | `get` (abortable), `getForPos`, `getProducts`, `getPayments`, `refund`, `void`, `submit` (POST/PUT switch) |
| `customers.ts` | `get`, `getOrders`, `getGroup`, `getRecentlyActive`, `search`, `getGroups`, `applyCoupon` |
| `products.ts` | `getAll`, `search`, `searchByBarcode`, `getUnitQuantities`, `createAdjustment` |
| `categories.ts` | `getAll`, `getPosContent` |
| `taxes.ts` | `getGroups`, `getGroup` |
| `users.ts` | `getAll`, `getPermissions`, `checkPermission`, `createToken`, `deleteToken` |
| `crud.ts` | `list(table, params)`, `remove(table, id)` — the generic `/api/crud/ns.*` endpoints |
| `transactions.ts` | accounting: rules CRUD, accounts, actions, category-identifier, configurations, reset-defaults |
| `medias.ts` | `upload` (FormData + progress/signal passthrough), `list<T>`, `bulkDelete` |
| `procurements.ts` | `searchProduct`, `searchProcurementProduct`, `getUnitGroupUnits` |
| `units.ts` | `getAll` |
| `reports.ts` | all 13 `/api/reports/*` endpoints |
| `settings.ts` | `update(section, data)` — one typed method for all 7 settings sections |
| `index.ts` | barrel export |

**Also fixed along the way:**

- **Copy-paste bug:** `customers/create.tsx` component was named `CreateProductPage` → renamed `CreateCustomerPage`.
- **Dead code:** the commented-out interceptor block in `app.tsx` removed — it's now implemented for real in `api/http.ts`.
- Debug `console.log`s removed on every call site touched (47 files still have some — see §5).

### ⚠️ Backend bug to confirm (not caused by the refactor, surfaced by it)

`accounting/rules/page.tsx` deleted rules via `axios.delete(\`/transactions/rules/${id}\`)` — **missing the `/api` prefix**, and no matching route exists in `routes/api/transactions.php`. The new `transactionsApi.deleteRule()` targets the corrected URL (`/api/transactions/rules/{id}`, flagged with a `FIXME` comment), but **the backend route needs to be added or the feature confirmed dead**.

### Deliberately untouched

- `services/print-agent-service.ts` — talks to the local Windows Print Agent (own base URL, own timeouts), not the Laravel API. Correctly stays on its own axios calls.
- `use-order.ts` keeps its `axios` import for `axios.isCancel()` only.

---

## 2. Next lever: split `usePOS.ts` (1,489 lines, ~60 members)

The store currently mixes **7 reasons to change**. Recommended target structure — extract in this order, keeping `usePOS` as a re-exporting facade until callers are migrated (no big-bang):

### Step 1 — pure functions first (zero risk, immediately testable)

Pull into `resources/js/services/` as pure, dependency-free functions. They take data in and return data out — no `get()`/`set()`:

- `services/tax.ts` ← `getVatValue`, `getPriceWithoutTax`, `getPriceWithTax`, `computeTaxForGroup`, `computeOrderTaxGroup`, `computeOrderTaxes`, `sumProductsTaxes`, `computeProductTax*`, `proceedProductTaxComputation`, `computeCustomProductTax`, `computeNormalProductTax`, `computeWholesaleProductTax`, `computeProductTaxValue`
- `services/pricing.ts` ← `getSalePrice`, `getCustomPrice`, `getWholesalePrice`, `getPrice`, `getProductUnitPrice`, `sumProductsTotals`
- `services/order-builder.ts` ← `buildOrder`, `buildProducts`, `computeProduct`, `recomputeProducts`, `defineQuantities`, `getStockUsage`

You already have the pattern: `services/cart-calculator.ts`. Merge `libraries/tax.ts` into `services/tax.ts` at the same time (they're duplicates-in-spirit).

### Step 2 — focused stores

- `hooks/pos/use-pos-dialogs.ts` ← `openDialogs`, `resolvers`, `openDialog`, `closeDialog` (fully self-contained, easiest first store)
- `hooks/pos/use-cart-store.ts` ← `products`, `addToCart`, `removeProduct*`, `updateProduct`, `checkCart`, `clearCart`, `setAutoMerge`
- `hooks/pos/use-payments-store.ts` ← `addPayment`, `removePayment`, `updateCustomerAccount`, `computePaid`, `setPaymentActive`, `definedPaymentsType`, `runPaymentQueue`, `selectedPaymentType`
- `hooks/pos/use-customer-store.ts` ← `selectCustomer`, `loadCustomer`, `pushCoupon`, `removeCoupon`
- `hooks/pos/use-pos-session.ts` ← `initialize`, `processInitialQueue`, `defineOptions`, `defineSettings`, `userCan`, `userPermissions`, `screen`, `visibleSection`

### Step 3 — submission pipeline

`submitOrder` / `proceedSubmitting` / `canProceedAsLaidAway` → `services/order-submission.ts`, built on `ordersApi.submit`. Printing (`printOrderReceipt`) → extend `services/print-agent-service.ts`.

**Rule of thumb while extracting:** a function may leave the store as soon as it only needs its *arguments*; if it reads other state, pass that state in as a parameter. That mechanical rule is what breaks the closure-tangling that makes the file scary to touch today.

---

## 3. Create/edit form deduplication

`users/create.tsx` (671 lines) vs `users/edit.tsx` (665 lines) are near-identical but structurally divergent — every field/validation change is made twice and they drift. Same pattern in customers, products, coupons.

**Proposal per entity** (e.g. `features/users/`):

```
features/users/
  user-schema.ts        # Zod schema: one source of truth for validation
  use-user-form.ts      # shared hook: defaults, dirty-tracking, submit mapping
  user-form-fields.tsx  # the ~30 shared field components
```
…then `create.tsx` and `edit.tsx` become thin wrappers (different defaults + different submit endpoint). The project already ships `@hookform/resolvers` — Zod plugs straight in.

**Order:** users → customers → products → coupons (coupons' create/edit already share their data-loading via the new API clients — cheapest win).

---

## 4. Type-safety checklist (fix as you touch, not all at once)

Current debt: **114 `: any`**, **17 `as any`**, **65 `@ts-ignore` / `@ts-nocheck`**, plus the pre-existing 274 `tsc` errors.

Recommended policy for every PR that touches a file:

1. No *new* `any` / `@ts-ignore` — the API layer is the firewall: type responses there first (replace the deliberate `any` returns in `api/*.ts` with real DTOs from `interfaces/`, e.g. `ordersApi.getForPos` is `any` today with a TODO because `usePOS.loadOrder` depends on loose access — type it during the usePOS split).
2. Fix the `any`s in the file you're touching.
3. Kill the worst ambient-type bugs: `types/module.d.ts` `Customer` declares `purchases_amount`/`owed_amount`/`account_amount` **twice with different types** (`string` and `number`) — that's a real bug factory.

**Verification ritual:** run `npm run types` before and after; error count must never go up. Save the sorted error list (`tsc --noEmit | grep "error TS" | sort`) and diff.

---

## 5. `console.log` cleanup

47 files still contain `console.log` (down from 61 — this pass removed them on every touched call site). Sweep plan: delete debug `console.log` outright; keep `console.error` in `catch` blocks only until a proper logger/toast policy is decided. One grep gives the list:

```bash
grep -rln 'console\.log' resources/js --include='*.ts*'
```

---

## 6. Folder consolidation

Three folders do overlapping jobs:

| Today | Move to |
|---|---|
| `libraries/tax.ts` | `services/tax.ts` (merge with the usePOS extraction) |
| `utils/format.ts`, `utils/order.ts` | keep in `utils/` — pure formatting helpers |
| `utils/print.tsx` | `services/` (it's a service, not a util) |
| `lib/utils.ts` (`cn` etc.) | keep — shadcn convention |
| `lib/settings.ts`, `lib/i18n` | keep |

End state: **`lib/`** = framework/app wiring, **`utils/`** = pure helpers, **`services/`** = domain logic + I/O, **`api/`** = HTTP boundary, **`hooks/`** = state. Then delete `libraries/`.

---

## 7. Suggested sequencing (by leverage)

1. ✅ ~~API layer~~ — done this pass.
2. usePOS Step 1 (pure tax/pricing/order-builder extraction) — biggest maintainability win per hour.
3. usePOS Steps 2–3 (focused stores) — do dialogs store first to prove the pattern.
4. Zod schemas + shared form hook for users create/edit.
5. Type-safety + console.log cleanup riding along each PR above.

Each step is independently mergeable and verifiable with the `npm run types` parity check.

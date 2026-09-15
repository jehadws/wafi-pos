# Architecture Rules

For anyone — human or AI agent — modifying, improving, or refactoring this codebase. Find the layer you're touching, follow its rules, then run the verification loop before finishing.

These rules exist because this repo has a recurring failure mode: a change in one surface silently breaks another — catalog price vs cart price vs printed receipt, options read as raw strings, entity types defined twice. The invariants below are enforced by convention and tests, and the compiler catches only part of it, so treat "it still runs" as insufficient evidence of correctness.

## Stack in one breath

Laravel API + Inertia v2 / React 19 / TypeScript (strict) SPA. Zustand for state. `mathjs` for money math. Vitest + Playwright for tests. Tailwind 4 + shadcn/radix primitives.

## Layer map (`resources/js`)

| Layer | Owns | Rule |
|---|---|---|
| `types/models/` | Entity shapes: `Order`, `OrderProduct`, `OrderType`, `Customer`, `Tax`, … | **Single source of truth.** Import explicitly (`@/types/models/order`). New entities land here and in `index.ts`. |
| `types/module.d.ts`, `types/pos.d.ts` | Legacy global ambient types | **Frozen.** Guarded by `tests/unit/module-dts.test.ts`, which runs tsc over it with `skipLibCheck` disabled — keep it compiling clean. Add nothing here; migrate a global to `types/models/` when you edit a file that uses one. |
| `constants/pos-options.ts` | Option-key **registry** + price/tax-basis accessors | The only path to POS option values: `POS_OPTION_KEYS` for keys; `isPosOptionEnabled`, `isPriceWithTax`, `isVatDisabled`, `resolveUnitDisplayPrice`, `getPosOption` for reads. A raw `'sb_…'` literal outside this file is a bug. |
| `services/` | Domain logic, framework-free | `cart-engine.ts` is the computation core (tax, pricing, totals, coupons). Services import no Zustand, React, or DOM. |
| `hooks/pos/` | POS stores | `usePOS.ts` facade + five slices (`use-pos-dialogs`, `use-cart-store`, `use-payments-store`, `use-customer-store`, `use-pos-session`), typed by `pos-store-types.ts`. `use-register-store` is a separate companion store for cash-register sessions. |
| `hooks/` | UI-level hooks | Effects, keyboard, debounce, selection. Store access through `usePOS` selectors. |
| `api/` | Resource clients (`ordersApi`, `taxesApi`, …) exported from `index.ts` | Components and hooks call `*Api` clients; HTTP, endpoint URLs, and error shaping stay here. |
| `components/tables/crud-table/` | Backend-driven table engine: `crud-table-page`, `columns-builder`, `row-actions-menu`, `bulk-actions`, `use-crud-table`, `use-action-executor`, popup registry | Render + user intent; columns/actions/config come from `GET /api/crud/{ns}/config` + `CrudEntry::$actions`; computation/state in `use-crud-table`/`use-action-executor`. |
| `components/pos/`, `components/settings/` | POS & settings screens | Render + user intent; computation goes to services, state to the store. |
| `components/ui/` | shadcn/radix primitives | Edit only to change the primitive itself. |
| `utils/` | Formatting (`formatCurrency`, `formatDate`, `rawCurrency`) | Reads settings through `lib/settings`; see **Options & settings**. |
| `lib/` | Singletons & platform glue: `settings`, `i18n`, `utils` | All UI strings through `useTranslation` from `@/lib/i18n`. |
| `pages/` | Inertia route pages (`dashboard/**`) | Compose features; hold little logic. Lists render through the single generic `pages/crud/list.tsx` — controllers call `XCrud::table()`; no per-page React list shells. |
| `resources/js/tests/{unit,integration}` and root `tests/e2e` | Vitest unit/integration, Playwright e2e | `cart-engine.test.ts` guards the tax math — extend it when touching the engine. |

## Ripple map — what moves together

The fastest way to break this app is to change one of these and miss its siblings:

| You change… | You must check… |
|---|---|
| An entity in `types/models/` | cart-engine, order services (`order-quantities`, `order-finalize`, `order-submission`, `express-checkout`), `print-agent-service`, `pos-store-types.ts`, and the tests. The same-named legacy global in `module.d.ts` does **not** update with it. |
| How prices display | All four surfaces must agree: catalog tiles/unit pickers (`resolveUnitDisplayPrice`), cart lines (cart-engine), order totals (`sumProductsTotals` / `refreshCart`), printed receipts (`printOrderReceipt` → `print-agent-service`). |
| A POS option | Backend tab (`app/Settings/pos/*.php`) + `getPayload()` in `PosSettings.php` + `POS_OPTION_KEYS` + settings UI (`components/settings/pos/`) + every read site. |
| A store slice | `pos-store-types.ts` (shared `POSStore` type), the facade's orchestration, and that slice's test. |
| A CRUD's `getColumns()` / `setActions()` / query filters | The table contract tests (`CrudTableConfigContractTest`, `CrudEntryActionsContractTest`) and the affected page(s) — the generic engine renders whatever the CUD serializes. |

## Store rules (invariant)

- A slice writes only its own state. Cross-slice effects go through that slice's actions or facade orchestration. One known violation exists — the session slice writes `order.tax_type` / `order.tax_group_id` during `initialize()`; mirror it through the same file if you must, extend it never.
- Update `order` by spread-and-set — `{ ...get().order, field }` — followed by `refreshCart()` whenever totals may move. Totals are derived by `refreshCart`; components never hand-compute them.
- Async cart work flows through the facade's refresh guard (`isRefreshing` / `refreshPending`); call `refreshCart()` rather than reimplementing the queuing.

## Cart engine rules (invariant)

- `services/cart-engine.ts` is **pure** domain math: no store, React, or DOM imports; deterministic output.
- Contract: "inputs are never mutated" — and it is enforced now. `computeProduct` clones before applying the `computeProductTaxValue` patch; `sumProductsTotals`, `sumProductsTaxes`, `computeOrderTaxes`, and `computeOrderTaxGroup` all return new objects. Callers publish returned arrays back to the store explicitly (see `refreshCart`). The purity tests in `cart-engine.test.ts` fail the suite if this regresses.
- Reuse the tax primitives (`computeInclusive`, `computeExclusive`, `getTaxValue`, `getPriceWithoutTax`, `getPriceWithTax`) instead of re-deriving formulas. Money math uses `mathjs` chains (`math.chain(...)`) to match engine precision; plain `+` / `*` on money drifts.
- The `calculateTotalsFor*Update` functions are pure and return field patches — apply the patch to a cloned product, then `refreshCart()`. `sumProductsTotals` returns `{ order, products }`; publish the returned products with `set({ products })` exactly like `refreshCart` does.

## Price basis rules (invariant)

"Show Price With Tax", global VAT mode, and per-product tax type interact to produce the **price basis** — the number the customer sees. The basis must resolve identically everywhere; it is read only through the `constants/pos-options.ts` accessors. When touching pricing, test the matrix: price-with-tax on/off × VAT disabled on/off × inclusive/exclusive product × currency precision 0.

Precision 0 is a valid setting — resolve it with `resolveCurrencyPrecision`, and keep falsy-value traps (`|| 2`) off it.

## Options & settings

- Backend: settings pages are `SettingsPage` subclasses (`app/Settings/PosSettings.php`), with tab definitions in `app/Settings/pos/*.php`. `getPayload()` whitelists which `sb_*` keys reach the frontend; `Helper::kvToJsOptions` shapes their choices.
- Frontend: every key read in TS belongs in `POS_OPTION_KEYS` (the registry covers all backend POS keys). ESLint bans raw `'sb_…'` literals outside `constants/pos-options.ts`, `components/settings/**`, `pages/dashboard/settings/**`, `types/**`, and `tests/**` — a typo in runtime code is a lint error now.
- `lib/settings.ts` is a process-wide singleton. `Settings.get()` throws before initialization, and the format utils fall back silently to `$` / UTC defaults — an initialization-order bug shows up as wrong currency, never as an error. Hydrate (`Settings.set` / `sync()`) before first render, and preserve that order when touching the bootstrap.
- Form & settings payload contract: Forms submit tab-grouped dictionaries `{[main]: v, [tabId]: {field: v}}`. Server-side (`SbForms::getFlatForm`), empty strings `''` and `null` values are dropped while `0` and `'0'` are preserved.
- Conditional fields: Defined server-side (e.g. `pos/registers.php`, `pos/vat.php`); the frontend receives the evaluated field list.

## Backend-driven forms engine (Plan B)

- **Architecture**: Dashboard CRUD and Settings forms are powered by the backend-driven engine (`resources/js/components/forms/config-form/`):
  - `CrudFormPage`: Generic page shell for CRUD create/edit flows (`useCrudForm`).
  - `SettingsFormPage`: Generic page shell for settings tabs (`useSettingsForm`).
  - `ConfigForm` + `FieldRenderer`: Controlled component translating backend field definitions (`CrudForm` / `SettingForm`) to UI primitives. Dynamic dropdown options use `option-loader.ts` with support for `refresh.watch` sibling field watchers.
  - `SbCrudForm`: Dynamic inline modal for nested foreign entity creation.
- **Source of truth**: The PHP backend defines fields, types, options, and validations. `CrudService::getFormConfig()` normalizes tabs so every tab carries a string `identifier`.
- **Form coverage & exceptions**:
  - Migrated to engine: 14 CRUD resources (categories, taxes, tax groups, units, unit groups, coupons, customer groups, rewards, roles, accounting transactions, accounting accounts, payment types, cash registers, providers) and all 8 settings resources — every form renders through the single `crud/form` Inertia shell with `initialConfig` (controller one-liner: `XCrud::form()` / `XCrud::form($entry)`).
  - Hand-crafted pages retained: `products` (sanctioned bespoke exception due to multi-level variations tree), `procurements/products/edit.tsx` (dedicated endpoint — bespoke by recorded decision, `docs/plans/backend-driven-leftovers/08` L8.3), and `customers` / `users` / `procurements` (blocked: duplicate field names across tabs collide in `SbForms::getFlatForm` later-tab-wins flattening — tracked in `docs/plans/backend-driven-leftovers/08`, enforced by the `CrudFormConfigContractTest` unique-field-name contract with a 3-Crud allowlist).
- **Payload contract**: Flattened submissions mirror `SbForms::getFlatForm`. Empty strings `''` and `null` are omitted on submit, while `0`, `'0'`, and `false` are preserved. Validation errors return 422 with `tabId.fieldName` or `fieldName` keys surfaced inline in both CRUD and settings pages.

## Backend-driven tables engine

- **Rendering spine**: a controller list method is a one-liner — `return XCrud::table();` (scope sub-lists with `queryParams`, e.g. `['customer_id' => …]`). `CrudService::table()` renders the **single** generic list page `resources/js/pages/crud/list.tsx` with `initialConfig` traveling once from the controller; there are no per-page React list shells.
- **Engine** (`components/tables/crud-table/`): `use-crud-table` owns entries/config state (server pagination, search, sort via `GET /api/crud/{ns}`), `columns-builder` maps backend columns to tanstack `ColumnDef`s, `row-actions-menu` + `use-action-executor` render and execute `CrudEntry::$actions` (GOTO → `router.visit`; GET/DELETE → confirm-then-call, toast, refresh), `bulk-actions` posts to `POST /crud/{ns}/bulk-actions`, and the popup registry (`action-popup-registry.tsx`) resolves POPUP components by `namespace::identifier`.
- **Payload contract**: list requests carry `page`, `per_page` (default 20), `search`, `active` + `direction` (sort), and `queryFilters` (URL-encoded JSON built by the toolbar; daterange filters serialize to the backend's `{ startDate, endDate }` shape, both bounds required). **JSON-only toast rule**: GET/DELETE action toasts display a `message` only when the response body is JSON — HTML answers (`redirect()->back()`) stay silent; failures surface as `toast.error(getApiErrorMessage(...))`, with 401/403/419 handled globally by `api/http.ts`.
- **Coverage & exceptions**: every dashboard CRUD list renders through the engine. Sanctioned exceptions: `products` (bespoke list page — tables B3.b-analog), `medias` manager and `accounting/rules` (not CRUD-table-backed resources). Unregistered POPUP keys fall back to navigating to `action.url` with a dev-time warning — `sb.products::sb.quantities` intentionally relies on this to reach the product edit page.

## Types rules (invariant)

- Import entities by path from `types/models/`.
- Two known divergences to respect when touching order code: the global `OrderType` is a string union while the model `OrderType` is an object (`loadOrder` normalizes both — keep that shim working); the global `Order` and model `Order` disagree on the `payment_status` union.
- `POSOptions` (`types/cart-engine.ts`) carries an index signature (`[key: string]: any`), so option typos compile inside the engine — the registry accessors are the guard.

## Backend (Laravel)

- Routes: per-resource files in `routes/api/*.php`, registered from `routes/api.php` / `routes/web-base.php` equivalents.
- Controllers in `app/Http/Controllers/**`; business logic in `app/Services/**`; settings pages in `app/Settings/**`; extension points via `App\Classes\Hook` filters.
- Tests: Pest under root `tests/` — run `php artisan test`.

## Verification loop

1. Frontend: `npm run types && npm run lint && npm run test` — the suite includes the ambient-type guard (`module-dts.test.ts`: tsc with `skipLibCheck` off) and the option-registry integrity tests.
2. Backend: `php artisan test`
3. Checkout-critical flows: `npm run test:e2e`
4. New or changed UI strings: `npm run translation:check` — `lang/` files are pipeline-managed (`scripts/translation/`); regenerate through the scripts rather than hand-editing generated output.
5. Formatting: `npm run format` (Prettier; ESLint runs with zero warnings allowed).

## Known debt — mirror it correctly, extend it never

1. The ambient globals (`module.d.ts`, `pos.d.ts`) remain a second type system: legacy pages consume globals while POS code imports `types/models/`. Migrate opportunistically; the guard test keeps the file compiling clean in the meantime.
2. `Transaction` and `TransactionHistory` in `module.d.ts` are identical twins — merge candidate when the accounting pages move to `types/models/`.
3. Format utils still fall back to `$` / UTC defaults in production when settings are missing (by design: a crash is worse); development builds emit a one-time warning.
4. `POSOptions` (`types/cart-engine.ts`) keeps its `[key: string]: any` index signature so the engine accepts the raw options record — the registry accessors are the guard, so read options through them.
5. `app/Forms/*` (`ProcurementForm`, `UserProfileForm`, `POSAddressesForm`) inherit from `SettingsPage` but are registered exclusively via `App\Providers\FormsProvider` on the `sb.forms` Hook filter rather than `app/Settings/` autoloading.
6. The `app/Fields/*` classes and `/api/fields/*` routes are an unconsumed extension surface in the Inertia SPA; retained for module/custom compatibility, with no active SPA consumers.
7. Products form (`resources/js/pages/dashboard/products/`): Retained as a sanctioned bespoke exception (Plan B §B3.b) due to `ProductCrud`'s multi-level variations tree (`{main, variations: [{tabs, selling_group, groups: {product_subitems}}]}`), dynamic unit conversions, and composite grouped subitems. Standard backend-driven `ConfigForm` covers 14 CRUD resources (categories, taxes, tax groups, units, unit groups, coupons, customer groups, rewards, roles, accounting transactions, accounting accounts, payment types, cash registers, providers) and all 8 settings resources. Still hand-written: **customers, users, procurements** (blocked: duplicate field names across tabs collide in `SbForms::getFlatForm` later-tab-wins flattening — tracked in `docs/plans/backend-driven-leftovers/08`; enforced by the `CrudFormConfigContractTest` unique-field-name allowlist), `procurements/products/edit.tsx` (dedicated endpoint, not the generic crud API — bespoke by recorded decision, `08` L8.3), and this sanctioned **products** exception.
8. Products **list** page (`resources/js/pages/dashboard/products/page.tsx`): retained as the sanctioned bespoke exception for tables (B3.b-analog) — its hand-built rows carry no `$actions`, so the action executor cannot render there without forcing the crud-list round-trip onto the page. Unregistered POPUP actions intentionally fall back to navigation (dev-time warning) until a component is registered in `action-popup-registry.tsx`; `sb.products::sb.quantities` relies on that fallback.
9. `ConfigForm` root-key-sniffs `(config.form as Record)['rules']` to activate the rules editor — contained to `RewardSystemCrud` today; converting it to a registry-driven custom field is optional future work (analysis in `docs/plans/backend-driven-leftovers/05`).


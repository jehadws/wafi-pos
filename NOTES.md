# Notes & User Context

## Workspace Overview
- **Project:** Subul (Laravel backend + Inertia/React/TypeScript frontend + Print Agent).
- **Core Stacks:** PHP / Laravel, React, TypeScript, TailwindCSS, Vite, Vitest / Playwright / PHPUnit.
- **Current Development Focus:** Architectural refactoring, frontend cleanups, POS state management decomposition (`usePOS`), testing, issue triage & automation.

## Identified Potential Loops
- **Price surface drift** — changing how prices display without updating all four surfaces (catalog tiles, cart lines, order totals, printed receipts) causes silent divergence. Caught by `resolveUnitDisplayPrice` and the cart-engine purity tests.
- **Type duplication** — `module.d.ts` globals and `types/models/` co-exist. Editing one without the other (e.g. `Order.payment_status`) silently breaks code that uses the other path. The guard test (`module-dts.test.ts`) catches compilation breaks but not semantic drift.
- **Settings two-pipe gap** — general settings flow via Inertia prop; POS settings flow via `OrdersController` hand-built options. A new POS setting must be added to both pipes or it goes missing in one context.
- **Store cross-slice writes** — one known violation exists (session slice writes `order.tax_type`/`order.tax_group_id` during `initialize()`). Adding more cross-slice writes without going through the facade creates hard-to-trace state bugs.

## Canonical Terminology & Entities
- **Order** — a sales transaction; carries `OrderProduct[]`, a customer, payment status, and tax info.
- **OrderProduct** — a line item on an order; links a product unit quantity to a quantity and computed price/tax.
- **OrderType** — string union (`'takeaway' | 'delivery' | 'dine-in'`); the model `OrderType` is an object (loaded by `loadOrder` via a shim).
- **Customer** — an account that can be attached to orders; carries a credit balance.
- **Tax / TaxGroup** — a tax rate or a named group of rates applied to products or orders.
- **Product / ProductUnitQuantity** — a product SKU and its saleable unit variants.
- **Procurement** — a stock-in event; links to `ProcurementProduct` rows (batches).
- **CashRegister / RegisterSession** — a POS terminal opened/closed by a cashier; tracks cash-in/out.
- **Transaction / TransactionActionRule** — accounting entries and the automation rules that generate them.
- **TransactionAccount** — a chart-of-accounts node (credit/debit bucket).
- **POS Option (`sb_*` key)** — a runtime setting accessed exclusively through `POS_OPTION_KEYS` registry and the `isPosOptionEnabled` / `getPosOption` accessors.


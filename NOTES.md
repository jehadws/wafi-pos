# Project Notes

Working context for humans and agents. The enforceable rules live in
[`docs/agents/architecture.md`](docs/agents/architecture.md); desktop internals
live in [`docs/Desktop-App.md`](docs/Desktop-App.md).

## Stack

- **Backend:** PHP 8.2+, Laravel 12, SQLite (`pdo_sqlite`), Sanctum, Inertia v2,
  Pest. No MySQL, no Reverb, no external queue daemon — the queue is
  database-backed.
- **Frontend:** React 19, TypeScript strict, Vite 6, Zustand, Tailwind 4,
  shadcn/radix primitives, `mathjs` for money math, `numeral` for formatting.
- **Tests:** Vitest (unit/integration), Playwright (checkout and table flows),
  Pest (backend contracts).
- **Desktop:** Electron shell in `../electron/` with a bundled FrankenPHP
  runtime and an Inno Setup installer.

## Recurring failure loops

1. **Price surface drift** — prices render in four places: catalog tiles/unit
   pickers, cart lines, order totals, printed receipts. They must resolve
   through the same accessors (`resolveUnitDisplayPrice`, cart-engine totals,
   printing service). Change one and the others silently disagree.
2. **Ambient vs model types** — `types/module.d.ts` globals and
   `types/models/` co-exist. Editing one does not update the other; the guard
   test (`module-dts.test.ts`) only proves the ambient file compiles.
3. **Settings drift** — POS options travel through three pipes: the general
   Inertia prop, the POS runtime payload built by `OrdersController`, and
   backend-driven form definitions. A new option must be added to its settings
   tab, `PosSettings::getPayload()`, `POS_OPTION_KEYS`, the settings UI, and
   every read site — or it goes missing in one context.
4. **Store cross-slice writes** — one known violation exists: the session slice
   writes `order.tax_type` / `order.tax_group_id` during `initialize()`. Route
   new cross-slice effects through the facade instead of copying it.
5. **Desktop runtime drift** — the shell supplies the database path, storage
   path, cache/session/queue drivers, app key and base URL through the child
   environment. Browser assumptions (`.env`, `storage/`, a fixed port) do not
   hold in a packaged install. Adding an env-dependent feature means adding it
   to `electron/src/main/service-manager.ts` too.
6. **Installer payload leaks** — the packaged Laravel tree must never contain a
   developer `.env`, the dev `database.sqlite`, sessions, uploads or
   `public/storage`. `electron/scripts/check-clean-install.mjs` is the gate;
   adjust the `electron-builder.yml` filter rather than weakening it.

## Canonical terminology

- **Terminal** — one licensed Windows install of the POS, bound to a hardware ID.
- **License** — a signed key stored against the machine's HWID; the dashboard
  and mutating sale routes are blocked until one is active.
- **Order** — a sales transaction; carries `OrderProduct[]`, a customer,
  payment status and tax info.
- **OrderProduct** — a line item linking a product unit quantity to a quantity
  and computed price/tax.
- **OrderType** — string union (`'takeaway' | 'delivery' | 'dine-in'`); the
  model `OrderType` is an object (`loadOrder` normalizes both).
- **Customer** — an account attachable to orders; carries a credit balance.
- **Tax / TaxGroup** — a rate or a named group of rates applied to products or
  orders.
- **Product / ProductUnitQuantity** — a SKU and its saleable unit variants.
- **Procurement** — a stock-in event; links to `ProcurementProduct` batches.
- **CashRegister / RegisterSession** — a terminal opened and closed by a
  cashier; tracks cash in/out.
- **Transaction / TransactionActionRule** — accounting entries and the rules
  that generate them.
- **TransactionAccount** — a chart-of-accounts node (credit/debit bucket).
- **POS option (`sb_*` key)** — a runtime setting read only through
  `POS_OPTION_KEYS` and the `isPosOptionEnabled` / `getPosOption` accessors.

## Where things live

| Concern | Location |
|---|---|
| POS store and slices | `resources/js/hooks/pos/`, facade `hooks/usePOS.ts` |
| Cart, tax, totals math | `resources/js/services/cart-engine.ts` |
| Option registry and price basis | `resources/js/constants/pos-options.ts` |
| Backend-driven forms | `resources/js/components/forms/config-form/`, `app/Crud/`, `app/Settings/` |
| Backend-driven tables | `resources/js/components/tables/crud-table/` |
| Printing | `app/Services/Printing/`, `resources/js/services/printing-service.ts` |
| Desktop shell | `../electron/src/main/` |
| Installer | `../electron/installer/setup.iss` |

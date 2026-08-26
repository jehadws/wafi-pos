# Settings System Improvement Plan

## Context

The settings audit (`docs/settings-audit.md`) found 5 backend bugs, ~15 dead settings, inconsistent type handling, and missing wiring. The user wants every setting to actually control the app and wants dead settings (logos, audio, layout, registers, dark mode) implemented. Cash registers and clothing layout are deferred to the final phase since they require building new subsystems.

---

## Phase 1 — Fix backend bugs (highest priority)

These are silent failures — settings saved but not enforced.

### 1a. Fix payment-policy type-comparison bugs

**Files:** `app/Services/OrdersService.php`

- **:968** — `get('ns_orders_allow_partial', true) === false` → change to compare string: `get('ns_orders_allow_partial', 'yes') !== 'yes'`
- **:973** — fix key name: `'ns_orders_allow_incomplete'` → `'ns_orders_allow_unpaid'`, same string comparison
- **:823** — `get('ns_orders_strict_instalments', 'no') === true` → `get('ns_orders_strict_instalments', 'no') === 'yes'`

### 1b. Fix currency precision default conflict

**Files:** `app/Settings/GeneralSettings.php` (:187)

- Change form default from `'0'` to `'2'` to match `Options::setDefault` and `format.ts` fallback

### 1c. Remove orphan option `ns_jgrem_printing_auto`

**Files:** `app/Http/Controllers/Dashboard/OrdersController.php`

- Add `'ns_jgrem_printing_auto' => ns()->option->get('ns_jgrem_printing_auto', 'yes')` to the options array so it's actually sent and configurable

**Files:** `resources/js/components/settings/pos/printing-tab.tsx`

- Add a toggle for `ns_jgrem_printing_auto` in the printing tab

**Files:** `app/Settings/pos/printing.php` + `PosSettings.php` getPayload/getOptions

- Add `ns_jgrem_printing_auto` to the settings definition

---

## Phase 2 — Wire dead settings to existing runtime code

### 2a. Wire store logos into receipts & print

**Files:** `resources/js/components/pos/print-invoice.tsx`, `resources/js/pages/dashboard/orders/receipt/page.tsx`

- Read `generalSettings.identification.ns_store_square_logo` and render as `<img>` in the receipt header (alongside store name/address)

### 2b. Wire `ns_jgrem_new_item_audio`

**Files:** `resources/js/hooks/use-cart-store.ts` (or wherever items are added)

- Import `playSound` from `resources/js/utils/sound.ts`
- On successful item add, call `playSound(options[POS_OPTION_KEYS.newItemAudio])` if value is set

### 2c. Wire `ns_jgrem_printing_document`

**Files:** `resources/js/hooks/usePOS.ts` (`printOrderReceipt`, line ~550)

- Read `options[POS_OPTION_KEYS.printingDocument]` and pass as the `mode` argument to `printAgentService.printOrderReceipt(order, options[...].printingDocument, ...)`

### 2d. Wire date formats into format.ts

**Files:** `resources/js/utils/format.ts`

- Lines 88, 125: replace hardcoded `{ ns_date_format: 'Y-m-d', ns_datetime_timezone: 'UTC' }` with `Settings.get().date` values
- The Settings singleton is already available in this file (`import Settings from '@/lib/settings'`)

### 2e. Implement order code types

**Files:** `app/Services/OrdersService.php` (`generateOrderCode`, :1489)

- Read `ns_orders_code_type` and branch:
    - `'date_sequential'` — current behavior (existing)
    - `'number_sequential'` — global sequential counter (no date prefix)
    - `'random_code'` — generate a random alphanumeric code (e.g. `Str::random(8)`)

### 2f. Wire `ns_default_theme` — restore dark mode toggle

**Files:** `resources/js/app.tsx` (or a new ThemeProvider wrapper)

- On app init, read `generalSettings.identification.ns_default_theme` from the Settings singleton
- Add/remove `dark` class on `document.documentElement` based on value
- CSS is already present (`app.css:8` variant + `:188` dark block)

**Files:** `resources/js/components/settings/general/identification-tab.tsx`

- No change needed — the dark/light toggle is already wired to save `ns_default_theme`

---

## Phase 3 — Clean up orphan / dead keys from backend

### 3a. Remove orphan backend-only options from `OrdersController.php`

These are sent to POS but have no settings UI and no consumers:

- `ns_jgrem_order_sms` (:205)
- `ns_jgrem_sound_enabled` (:206)
- `ns_customers_credit_enabled` (:230)
- Customer constraint keys (:232-235) — move to `CustomersSettings` if they belong there
- Invoice keys (:237-241) — move to `InvoiceSettings` if not already there

### 3b. Fix quotation_expiration label

**Files:** `resources/js/pages/dashboard/settings/orders.tsx` (:182)

- Change description from "Quotations will get deleted..." to "Hold orders older than the selected period will be cleared." to match actual behavior in `ClearHoldOrdersJob`

---

## Phase 4 — Dark mode full implementation

The CSS is in place. This phase adds runtime toggle.

### 4a. Create a theme hook

**New file:** `resources/js/hooks/use-theme.ts`

- `useTheme()` reads `ns_default_theme` from Settings singleton
- `setTheme(value: 'dark' | 'light')` toggles `document.documentElement.classList` and persists to backend via `settingsApi.update('general', ...)`
- Export `ThemeProvider` component for app.tsx

### 4b. Wire into app

**Files:** `resources/js/app.tsx`

- Wrap app in `<ThemeProvider>`, initial theme from Inertia props

### 4c. Sync on settings save

**Files:** `resources/js/components/settings/general/use-general-settings.ts`

- After save, call `setTheme()` to update the live UI immediately

---

## Phase 5 — Store logo persistence

Logos are already saved to options (media picker in identification-tab). Need to ensure the media picker uploads and stores a URL, then render in receipts.

### 5a. Verify media picker saves URLs

**Files:** `resources/js/components/settings/general/file-picker.tsx` + `identification-tab.tsx`

- Ensure the media picker outputs a URL string that persists correctly

### 5b. Render logos in receipts

**Files:** `resources/js/components/pos/print-invoice.tsx`, `resources/js/pages/dashboard/orders/receipt/page.tsx`

- Add logo `<img>` in receipt header, using the URL from settings

---

## Phase 6 — Cash registers (new subsystem, deferred)

This requires building a full register open/close workflow:

- Register model already exists (`App\Crud\RegisterCrud`)
- Settings toggle `ns_jgrem_registers_enabled` already saves
- `ns_jgrem_idle_counter` and `ns_jgrem_disbursement` already save
- Need: register-open dialog on POS load, register-close flow, cash count, and idle-timeout auto-lock

**Scope:** Defer to a separate implementation session.

---

## Phase 7 — Clothing layout (new subsystem, deferred)

`ns_jgrem_layout = clothing_shop` is saved but needs a distinct product-grid layout for the POS screen. Currently only `grocery_shop` layout exists.

**Scope:** Defer to a separate implementation session.

---

## Files to modify (Phases 1–5)

| File                                                               | Changes                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `app/Services/OrdersService.php`                                   | Fix 3 type-comparison bugs (:823, :968, :973); implement order code types (:1489) |
| `app/Settings/GeneralSettings.php`                                 | Fix currency precision default (:187)                                             |
| `app/Http/Controllers/Dashboard/OrdersController.php`              | Add `printing_auto` to options; remove orphan keys                                |
| `app/Settings/pos/printing.php`                                    | Add `ns_jgrem_printing_auto` field                                                |
| `app/Settings/PosSettings.php`                                     | Add to getPayload + getOptions                                                    |
| `resources/js/utils/format.ts`                                     | Wire date format from Settings singleton                                          |
| `resources/js/hooks/use-cart-store.ts`                             | Play `new_item_audio` on item add                                                 |
| `resources/js/hooks/usePOS.ts`                                     | Pass `printing_document` option as print mode                                     |
| `resources/js/components/pos/print-invoice.tsx`                    | Render store logos                                                                |
| `resources/js/pages/dashboard/orders/receipt/page.tsx`             | Render store logos                                                                |
| `resources/js/pages/dashboard/settings/orders.tsx`                 | Fix quotation description label                                                   |
| `resources/js/components/settings/pos/printing-tab.tsx`            | Add printing_auto toggle                                                          |
| `resources/js/app.tsx`                                             | Add ThemeProvider                                                                 |
| `resources/js/hooks/use-theme.ts`                                  | **New** — dark mode hook                                                          |
| `resources/js/components/settings/general/use-general-settings.ts` | Sync theme on save                                                                |

## Verification

1. **Backend bugs:** Create an order with unpaid/no-pay and confirm `ns_orders_allow_unpaid=no` now throws a 422 on the server (not just frontend)
2. **Date format:** Change `ns_date_format` to `d.m.Y`, verify all dates update across the dashboard
3. **Logos:** Set a square logo, check receipt page and print-invoice both show it
4. **New item audio:** Set audio to "Ding", add a product in POS, verify sound plays
5. **Printing document:** Switch to "Invoice", complete a sale, verify the print payload uses invoice mode
6. **Order code types:** Set to "Random Code", place an order, verify the code is random; switch to "Number Sequential", verify global counter
7. **Dark mode:** Set `ns_default_theme` to "dark", verify POS and dashboard switch to dark; restart browser and confirm it persists
8. **Printing auto:** Toggle off, complete a sale, verify no auto-print

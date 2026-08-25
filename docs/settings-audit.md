# Settings Audit — General, POS, Orders

*Audited 2026-08-25. Every claim cites file:line.*

## 1. How the settings system works end-to-end

**Storage.** All three groups store their values as rows in the `Option` model's table (key/value, `user_id = null`), accessed via `ns()->option->get()` server-side (`app/Services/Options.php:18-80`). Defaults live in `Options::setDefault()` (`app/Services/Options.php:29-51`). A separate migration exists for `nexopos_orders_settings` but the active code path uses the plain options table.

**Definition.** Each group is a `SettingsPage` subclass with `IDENTIFIER` + `AUTOLOAD=true`, autoloaded through the `ns.settings` hook filter (`app/Providers/SettingsPageProvider.php:30-45`):
- General: `app/Settings/GeneralSettings.php`
- POS: `app/Settings/PosSettings.php`
- Orders: `app/Settings/OrdersSettings.php`

Each class exposes two payloads: `getPayload()` (current values) and `getOptions()` (select choices).

**Read paths (two different pipes):**
1. *Settings pages*: `GET /dashboard/settings/{identifier}` → `SettingsController::getSettings` (`app/Http/Controllers/Dashboard/SettingsController.php:20`) → `SettingsPage::renderForm()` which returns `{payload, options}` (`app/Services/SettingsPage.php:109-110`).
2. *POS runtime*: `GET /dashboard/pos` builds a flat `options` object with ~40 keys, each read individually with an inline default (`app/Http/Controllers/Dashboard/OrdersController.php:200-255`), passed via Inertia to `resources/js/pages/dashboard/pos.tsx:19`, which pushes it into the Zustand store via `defineOptions` (`resources/js/hooks/pos/use-pos-session.ts:156`).
3. *General settings (every page)*: shared Inertia prop `'settings' => (new GeneralSettings)->getPayload()` (`app/Http/Middleware/HandleInertiaRequests.php:85`), captured client-side into a singleton `Settings.set()` (`resources/js/app.tsx:12`, `resources/js/lib/settings.ts:59-61`), consumed by `format.ts` and receipt/print components.

**Write path.** All groups save through one endpoint: `POST /api/settings/{identifier}` → `SettingsController::saveSettingsForm` (`routes/api/settings.php:7`) → `SettingsPage::saveForm`. Frontend callers: `use-general-settings.ts:67`, `use-pos-settings.ts:60`, `pages/dashboard/settings/orders.tsx:59`.

---

## 2. General settings (`app/Settings/GeneralSettings.php`)

| Setting | Type/Default | Defined | Read where | Status |
|---|---|---|---|---|
| `ns_store_name` | text, 'JgremPOS' | Identification tab (:39) | Receipt page (`orders/receipt/page.tsx:11`), `print-invoice.tsx:58`, POS title (`OrdersController.php:194`) | **ALIVE** |
| `ns_store_address` / `_city` / `_phone` / `_email` | text | :46-69 | `print-invoice.tsx:59-60` (address+phone only) | **PARTIAL** — city/email/pobox/fax/additional never rendered |
| `ns_store_square_logo` / `_rectangle_logo` | media | :88-99 | No consumer found | **DEAD** |
| `ns_store_language` | select, 'en' | :100 | `LoadLangMiddleware.php:24,36` (backend locale) | **ALIVE** (backend only) |
| `ns_default_theme` | dark/light | :107 | Only `DoctorService.php:47` demo seed. Dark mode was removed in commit ac7e3dc | **DEAD/STALE** |
| `ns_currency_symbol/position/thousand_separator/decimal_separator/precision` | text/select | Currency tab (:127-196) | Frontend `utils/format.ts:25-33` via Settings singleton; backend `AppServiceProvider.php:168` (precision) | **ALIVE** |
| `ns_currency_iso` / `ns_currency_prefered` | text/select | :134-172 | `AppServiceProvider.php:173-174` only | **PARTIAL** — not used in frontend formatting |
| `ns_date_format` / `ns_datetime_format` / `ns_datetime_timezone` | select | Date tab (:207-244) | ⚠️ `format.ts:88` hardcodes `{ ns_date_format: 'Y-m-d', ns_datetime_timezone: 'UTC' }` — the Settings values are **not wired in** | **BROKEN** (saved, never applied) |
| `ns_registration_enabled` | yes/no, 'no' | Registration tab (:255) | `SignUpRequest.php:22`, `RegistrationMiddleware.php:19` | **ALIVE** |
| `ns_registration_role` | role id | :265 | Registration flow (role assignment) | **ALIVE** |
| `ns_registration_validated` | yes/no | :272 | Validation flow | **ALIVE** |
| `ns_recovery_enabled` | switch, 'no' | :282 | `PasswordRecoveryMiddleware.php:19` | **ALIVE** |

## 3. POS settings (`app/Settings/PosSettings.php`)

Runtime consumers get values from the flat `options` object built in `OrdersController.php:200-255`.

| Setting | Type/Default | Defined (tab file) | Read where | Status |
|---|---|---|---|---|
| `ns_jgrem_layout` | grocery/clothing | layout.php | No consumer found | **DEAD** |
| `ns_jgrem_complete_sale_audio` | audio url | layout.php | `services/order-submission.ts:73-77` (plays after sale) | **ALIVE** |
| `ns_jgrem_new_item_audio` | audio url | layout.php | Key registered (`constants/pos-options.ts:25`) but never played | **DEAD** |
| `ns_jgrem_printing_document` | invoice/receipt | printing.php | Persisted + typed (`pos.d.ts:128`) but `printOrderReceipt` takes `mode` from caller, not this setting | **PARTIAL** |
| `ns_jgrem_printing_enabled_for` | disabled/all/partial/paid | printing.php | `usePOS.ts:536-547` gates auto-print | **ALIVE** |
| `ns_jgrem_printing_gateway` | 'default' | printing.php | No branching consumer | **DEAD** (single option) |
| *(no key)* `ns_jgrem_printing_auto` | — | **not in any UI** | Referenced `usePOS.ts:552` via `POS_OPTION_KEYS.printingAuto`; never sent by backend → always `undefined` → falls back to `true` | **ORPHAN** (consumed, never configured/sent) |
| `ns_jgrem_registers_enabled` | yes/no, 'no' | registers.php | Sent to POS (`OrdersController.php:212`) but no component branches on it | **DEAD** (frontend) |
| `ns_jgrem_idle_counter` | min/0 | registers.php | Sent, never consumed | **DEAD** |
| `ns_jgrem_disbursement` | yes/no | registers.php | Sent, never consumed | **DEAD** |
| `ns_jgrem_registers_default_change_payment_type` | payment type id | registers.php | Sent, never consumed | **DEAD** |
| `ns_jgrem_vat` | disabled/flat/variable/products | vat.php | `cart-engine.ts:457,521-523` (order tax modes); `secondary-navigation.tsx:23` | **ALIVE** |
| `ns_jgrem_tax_group` / `ns_jgrem_tax_type` | id / inclusive-exclusive | vat.php | `use-pos-session.ts:90-93` assigns to new order | **ALIVE** |
| `ns_jgrem_keyboard_*` (10 actions) | key arrays | shortcuts.php | `hooks/use-pos-shortcuts.ts:58-83` | **ALIVE** |
| `ns_jgrem_amount_shortcut` | number | shortcuts.php | Registered in constants; no verified consumer | **PARTIAL** |
| `ns_jgrem_show_quantity` | yes/no→bool | features.php | Sent as bool (`OrdersController.php:220`); typed boolean (`pos.d.ts:151`) | **ALIVE** |
| `ns_jgrem_items_merge` | yes/no→bool | features.php | `pos.tsx:28-30` → `setAutoMerge` | **ALIVE** |
| `ns_jgrem_allow_wholesale_price` | yes/no→bool | features.php | Sent as bool; typed boolean | **ALIVE** (POS gating) |
| `ns_jgrem_allow_decimal_quantities` | yes/no→bool | features.php | Sent as bool | **ALIVE** |
| `ns_jgrem_quick_product` (+`_default_unit`) | yes/no, unit id | features.php | Sent (`OrdersController.php:207-208`), unit dialog `select-unit-quantity-dialog.tsx:31` | **ALIVE** |
| `ns_jgrem_unit_price_ediable` | yes/no→bool | features.php | Sent as bool | **ALIVE** |
| `ns_jgrem_price_with_tax` | yes/no (string) | features.php | `cart-engine.ts:165,176,187,472` — price resolution core | **ALIVE** (most critical) |
| `ns_jgrem_order_types` | string[] | features.php | `pos.tsx:46-55` auto-select; `order-type-dialog.tsx:17`; backend filter (`OrdersController.php:196-199`) | **ALIVE** |
| `ns_jgrem_numpad` | default/advanced | features.php | Typed; numpad component selection | **ALIVE** |
| `ns_jgrem_force_autofocus` | yes/no→bool | features.php | Sent as bool | **ALIVE** |
| `ns_jgrem_hide_exhausted_products` | yes/no | features.php | Sent; typed string | **ALIVE** |
| `ns_jgrem_hide_empty_categories` | yes/no, 'yes' | features.php | Sent; product category filtering | **ALIVE** |

**Orphan options** — sent by backend, editable nowhere: `ns_jgrem_order_sms` (`OrdersController.php:205`), `ns_jgrem_sound_enabled` (:206), `ns_customers_credit_enabled` (:230), customer constraints (:232-235), `ns_invoice_receipt_template/logo/footer/merge/display` (:237-241).

## 4. Orders settings (`app/Settings/OrdersSettings.php`)

| Setting | Type/Default | Defined | Read where | Status |
|---|---|---|---|---|
| `ns_orders_code_type` | sequential/random/number | orders/general.php:28 | ⚠️ `generateOrderCode` has `@todo we need to be able to change the code format` and hardcodes date+counter (`app/Services/OrdersService.php:1486-1511`) | **DEAD** |
| `ns_orders_allow_unpaid` | yes/no | general.php:38 | Frontend gate `order-submission.ts:34`; menu filter `MenusFilter.php:37` | **ALIVE (FE)** |
| `ns_orders_allow_partial` | yes/no | general.php:48 | Frontend `order-submission.ts:40`; backend `OrdersService.php:968` | **BROKEN (BE)** — see below |
| `ns_orders_strict_instalments` | yes/no | general.php:58 | Backend `OrdersService.php:823` | **BROKEN** — see below |
| `ns_orders_quotation_expiration` | days/never | general.php:68 | `Jobs/ClearHoldOrdersJob.php:44-55` (hold-order cleanup, not quotations) | **PARTIAL/MISLABELED** |

### Confirmed backend bugs

1. **`strict_instalments` never triggers** — `OrdersService.php:823`: `ns()->option->get('ns_orders_strict_instalments', 'no') === true`. The stored value is the string `'yes'`/`'no'`, so strict comparison against boolean `true` is always false.
2. **Backend partial/unpaid guards never fire** — `OrdersService.php:968`: `$this->optionsService->get('ns_orders_allow_partial', true) === false`. Stored value is `'no'`, compared to boolean `false` → never equal. Same pattern at :973 with `ns_orders_allow_incomplete` — **a key that doesn't exist anywhere** (the real key is `ns_orders_allow_unpaid`). Server-side enforcement currently relies entirely on the frontend check in `order-submission.ts`.
3. **Frontend/backend type mismatch** — `OrdersController.php:202-203` sends `allow_unpaid`/`allow_partial` as raw `'yes'/'no'` strings, while neighbouring booleans (:220-230) are coerced. The frontend compares against `'no'` strings, which works, but is inconsistent with every other toggle.

## 5. Findings summary

- **Dead settings (saved, zero consumers):** `ns_store_square_logo`, `ns_store_rectangle_logo`, `ns_default_theme`, `ns_jgrem_layout`, `ns_jgrem_new_item_audio`, `ns_jgrem_printing_gateway`, all four register-tab settings, `ns_orders_code_type`, plus orphan backend-sent keys (`printing_auto`, `order_sms`, `sound_enabled`, invoice keys…).
- **Broken wiring:** date formats (hardcoded in `format.ts:88`), backend payment-policy guards (type-comparison bugs + wrong key name), order code format.
- **Two-pipe inconsistency:** General reaches the client via the `settings` Inertia prop; POS/Orders reach the client only via the hand-built `options` object in `OrdersController.php` — adding a POS setting requires touching 4 files (tab php, payload php, options php, OrdersController).
- **Duplicate defaults:** e.g. currency precision defaults to `'0'` in the form (`GeneralSettings.php:187`), `2` in `Options::setDefault` (`Options.php:39`), and `2` again in `format.ts:13`.

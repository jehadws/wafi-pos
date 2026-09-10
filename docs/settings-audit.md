# Settings Audit — General, POS, Orders

*Re-audited 2026-09-08 (supersedes the 2026-08-25 audit). Every claim cites file:line against the current code.*

## 1. How the settings system works end-to-end

**Storage.** All three groups store their values as rows in the `Option` model's table (key/value, `user_id = null`), accessed via `sb()->option->get()` server-side (`app/Services/Options.php`). Defaults live in `Options::setDefault()` (`app/Services/Options.php:29-51`). A separate migration exists for `subul_orders_settings` but the active code path uses the plain options table.

**Definition.** Each group is a `SettingsPage` subclass with `IDENTIFIER` + `AUTOLOAD=true`, autoloaded through the `ns.settings` hook filter (`app/Providers/SettingsPageProvider.php:30-45`):
- General: `app/Settings/GeneralSettings.php`
- POS: `app/Settings/PosSettings.php`
- Orders: `app/Settings/OrdersSettings.php`
- Invoices: `app/Settings/InvoiceSettings.php`

Each class exposes two payloads: `getPayload()` (current values) and `getOptions()` (select choices).

**Read paths (two different pipes):**
1. *Settings pages*: `GET /dashboard/settings/{identifier}` → `SettingsController::getSettings` → `SettingsPage::renderForm()` which returns `{payload, options}` (`app/Services/SettingsPage.php`).
2. *POS runtime*: `GET /dashboard/pos` builds a flat `options` object with ~50 keys, each read individually with an inline default (`app/Http/Controllers/Dashboard/OrdersController.php:200-257`), passed via Inertia to `resources/js/pages/dashboard/pos.tsx`, which pushes it into the Zustand store via `defineOptions` (`resources/js/hooks/pos/use-pos-session.ts:161`). The key→store mapping lives in `resources/js/constants/pos-options.ts`.
3. *General settings (every page)*: shared Inertia prop `'settings' => (new GeneralSettings)->getPayload()` (`app/Http/Middleware/HandleInertiaRequests.php:95`), captured client-side into a singleton `Settings.set()` (`resources/js/lib/settings.ts:61`, wired in `resources/js/app.tsx`), consumed by `utils/format.ts` and the receipt/print components.

**Write path.** All groups save through one endpoint: `POST /api/settings/{identifier}` → `SettingsController::saveSettingsForm` (`routes/api/settings.php`) → `SettingsPage::saveForm`. Frontend callers: `use-general-settings.ts`, `use-pos-settings.ts`, `pages/dashboard/settings/orders.tsx`.

---

## 2. General settings (`app/Settings/GeneralSettings.php`)

| Setting | Type/Default | Defined | Read where | Status |
|---|---|---|---|---|
| `sb_store_name` | text, 'Subul' | Identification tab (:40) | Receipt page (`orders/receipt/page.tsx:10`), `print-invoice.tsx`, POS title (`OrdersController.php`) | **ALIVE** |
| `sb_store_address` / `_city` / `_phone` / `_email` / `_pobox` | text | :47-72 | Thermal preview + ESC/POS print agent + POS print dialog (via `FormattedReceiptData`) and the receipt-page header | **ALIVE** — all five fields rendered since #8 |
| `sb_store_square_logo` | media | :89-90 | `app-logo-icon.tsx:12` (fallback `/logo.svg`), `print-invoice.tsx:62` | **ALIVE** |
| `sb_store_rectangle_logo` | media | :95-96 | Editable only (`identification-tab.tsx:93-94`); no runtime consumer | **EDIT-BUT-UNCONSUMED** — see findings |
| `sb_store_language` | select, 'en' | :101-102 | `LoadLangMiddleware.php` (backend locale) | **ALIVE** (backend only) |
| `sb_default_theme` | dark/light | :108-109 | `use-appearance.tsx:46-48` `getConfiguredTheme()` (fallback 'system'), editable in `identification-tab.tsx:119-126` | **ALIVE** |
| `sb_currency_symbol/position/thousand_separator/decimal_separator/precision` | text/select | Currency tab (:127-196) | Frontend `utils/format.ts:24-26` via Settings singleton; backend `AppServiceProvider.php:168-172` | **ALIVE** |
| `sb_currency_iso` / `sb_currency_prefered` | text/select | :135-136 / :158-159 | `AppServiceProvider.php:173-174`; frontend `lib/settings.ts:20-22` | **ALIVE** |
| `sb_date_format` / `sb_datetime_format` / `sb_datetime_timezone` | select | Date tab (:209+) | `format.ts:62-97` (`formatDate`) and `format.ts:99+` (`formatDateTime`) read `Settings.get()` and apply the stored values, with inline fallbacks used only when settings are unavailable | **ALIVE** |

---

## 3. POS settings (`app/Settings/PosSettings.php`)

**Corrected 2026-09-09** (see `docs/plans/pos-settings-enforcement.md`): the table below
separates *delivered* (present in the boot payload, editable in settings) from
*enforced* (changes POS behavior). The previous "Features … ALIVE" row was wrong —
`sb_subul_unit_price_ediable` and `sb_subul_numpad` were delivered but enforced nowhere.

| Setting | Enforced at | Status |
|---|---|---|
| `sb_subul_layout` | `products-categories-panel.tsx:24` (`clothing_shop` badges) | ALIVE |
| `sb_subul_new_item_audio` / `sb_subul_complete_sale_audio` | `use-cart-store.ts:144` / `order-submission.ts:73` | ALIVE |
| `sb_subul_printing_document` / `_enabled_for` / `_auto` | `usePOS.ts:601-627` | ALIVE |
| `sb_subul_printing_gateway` | `usePOS.printOrderReceipt` — port of NexoPOS `libraries/print.ts:48`: `'default'` → web printing; non-default → warned + falls back until a module system provides gateway handlers | ALIVE (wired 2026-09-09, T4) |
| `sb_subul_registers_enabled` / `_idle_counter` / `_disbursement` | `use-register-session.ts:52-111`, `pos-system.tsx:104`, `register-session-dialog.tsx:40` | ALIVE |
| `sb_subul_registers_default_change_payment_type` | `CashRegistersService::saveOrderChange:333` (BE) | ALIVE (BE) |
| `sb_subul_vat` / `_tax_group` / `_tax_type` | `cart-engine.ts` + `quick-product-popup.tsx:71` | ALIVE |
| `sb_subul_price_with_tax` | `isPriceWithTax` accessors (cart-engine + UI) | ALIVE |
| `sb_subul_order_types` | server-filtered payload (`OrdersController.php:196-199`) + `usePOS.ts:290` | ALIVE |
| `sb_subul_show_quantity` | 7 call sites (panel, search dialog, barcode) | ALIVE |
| `sb_subul_items_merge` | `pages/dashboard/pos.tsx:37` (payload bool-coerced at `OrdersController.php:229`) | ALIVE |
| `sb_subul_allow_wholesale_price` | `cart-item.tsx:196` | ALIVE |
| `sb_subul_allow_decimal_quantities` | numpad decimal handling (3 sites) | ALIVE |
| `sb_subul_quick_product` / `_default_unit` | `secondary-navigation.tsx:35` / `quick-product-popup.tsx:72` | ALIVE |
| `sb_subul_force_autofocus` | `pos-system.tsx:159` | ALIVE |
| `sb_subul_hide_exhausted_products` / `_hide_empty_categories` | BE `CategoryController.php:312/329`, `ProductService` POS visibility | ALIVE (BE) |
| `sb_subul_unit_price_ediable` | `cart-item.tsx` price link + `cart-table.tsx` keypad guard (wired 2026-09-09, T1; payload default normalized to `'yes'`) | **WAS DEAD → fixed** |
| `sb_subul_numpad` | `resolveNumpadVariant` (`pos-options.ts`) → `NumericKeypadDialog variant` in cart keypads + search dialog — "advanced" ports NexoPOS `ns-numpad-plus` (explicit `.` key, full-width Enter) | ALIVE (wired 2026-09-09, T4) |
| `sb_subul_keyboard_*` / `sb_subul_amount_shortcut` | `use-pos-shortcuts.ts` (via `POS_OPTION_KEYS` since T3), `payment-gateway-dialog.tsx:82` | ALIVE |

**Registry note:** `POS_OPTION_KEYS.keyboardShortcuts` (`sb_subul_keyboard_shortcuts`)
is not a runtime option — it is the `MultiKeySelector` choices list for the settings UI
(`shortcuts-tab.tsx:26`). A dead-key guard test in `pos-options.test.ts` now fails the
suite when a registered key has no runtime consumer outside the backend-enforced
allowlist.

**Removed since the last audit:** `sb_subul_order_sms` and `sb_subul_sound_enabled` no longer appear anywhere in the codebase (previously backend-sent orphans; the keys were dropped).

**Customer keys on the POS payload** (`OrdersController.php:217,232-237`): `sb_customers_default` (walk-in default, `pos-defaults.ts`), `sb_customers_credit_enabled` (coerced to bool), rewards/valid-email/unique-phone/default-group constraints. `sb_customers_credit_enabled` is editable in `app/Settings/customers/general.php:61-64` ("Enable Credit & Account").

---

## 4. Orders settings (`app/Settings/OrdersSettings.php`)

| Setting | Type/Default | Defined | Read where | Status |
|---|---|---|---|---|
| `sb_orders_code_type` | date_sequential/random/number | :27, :49 | `OrdersService::generateOrderCode` (`app/Services/OrdersService.php:1489-1499`) switches on `random_code` / `number_sequential` / default date-sequential | **ALIVE** |
| `sb_orders_allow_unpaid` | yes/no, 'yes' | :28, :54 | Frontend gate `order-submission.ts`; backend `OrdersService.php:973-976` (`!== 'yes'`); POS payload `OrdersController.php:205-206` (defaults intentionally match the enforcement layer) | **ALIVE (FE+BE)** |
| `sb_orders_allow_partial` | yes/no, 'yes' | :29, :58 | Frontend `order-submission.ts`; backend `OrdersService.php:968-971` (`!== 'yes'`) | **ALIVE (FE+BE)** |
| `sb_orders_strict_instalments` | yes/no, 'no' | :30, :62 | Backend `OrdersService.php:823` (`=== 'yes'`); POS payload `OrdersController.php:231` (bool-coerced) | **ALIVE** |
| `sb_orders_quotation_expiration` | days/never | :31, :66 | `ClearHoldOrdersJob` — scheduled daily via `bootstrap/app.php` (`withSchedule`) since #9 | **ALIVE** — deletes `PAYMENT_HOLD` orders after N days; `'never'`/non-numeric keeps them |

**Previously-reported backend bugs are fixed:**
1. `strict_instalments` now compares the stored string: `=== 'yes'` (`OrdersService.php:823`).
2. The partial/unpaid guards now use string comparison and the real keys — `sb_orders_allow_partial` (:968) and `sb_orders_allow_unpaid` (:973), both `!== 'yes'` with a `'yes'` default. The phantom `sb_orders_allow_incomplete` key is gone.
3. `OrdersController.php:202-206` still sends `allow_partial`/`allow_unpaid` as raw `'yes'/'no'` strings while neighbouring booleans are coerced (:222-232) — deliberate per the inline comment (defaults must match the enforcement layer), though the mixed typing remains a consistency wart.

---

## 5. Findings summary (2026-09-08)

- **POS corrections (2026-09-09):** the §3 "Features … ALIVE" row was wrong — `sb_subul_unit_price_ediable` and `sb_subul_numpad` were delivered but enforced nowhere, and `sb_subul_printing_gateway` had no runtime consumer either. Unit-price gating is now wired and the payload default normalized (T1); a dead-key guard test in `pos-options.test.ts` fails the suite when a registered key has no runtime consumer outside the backend-enforced allowlist (T2). Details and remaining work: `docs/plans/pos-settings-enforcement.md`.
- **Edit-but-unconsumed (1):** `sb_store_rectangle_logo` — editable in the identification tab (`identification-tab.tsx:93-94`, `GeneralSettings.php:95-96`) but rendered by nothing. The square logo IS consumed (`app-logo-icon.tsx:12`, `print-invoice.tsx:62`). **Decision: wontfix for now** — no current surface needs a wide logo; revisit if a wide-header surface (PDF invoice header, login screen, email templates) is added, then wire it as a fallback chain like the receipt logo does (`orders/receipt/page.tsx:12`).
- **Truly orphan keys: none.** The last audit's orphans (`order_sms`, `sound_enabled`, invoice receipt keys, customer constraints, register-tab settings) are either removed from the codebase or fully wired (§3).
- **Partial rendering (fixed, #8):** store city/email/pobox now render on every receipt surface (thermal preview, ESC/POS print agent, POS print dialog payload, receipt page header).
- **Quotation-expiration semantics (fixed, #9):** the job was never scheduled anywhere and its `empty()` guard proceeded on `'never'` (→ `addDays('never')` = delete every held order). It is now scheduled daily (`bootstrap/app.php` `withSchedule`), the guard keeps held orders on `'never'`/non-numeric values, and the setting is relabeled **Hold Order Expiration** (no quotation order type exists — the job deletes `PAYMENT_HOLD` orders).
- **Two-pipe inconsistency (structural, unchanged):** General reaches the client via the `settings` Inertia prop (`HandleInertiaRequests.php:95`); POS/Orders reach the client only via the hand-built `options` object (`OrdersController.php:200-257`) — adding a POS setting still requires touching the tab PHP, payload PHP, options PHP, and `OrdersController.php` (+ `pos-options.ts`).
- **Duplicate defaults (fixed, #10):** currency precision now falls back to `2` everywhere — DB seed (`Options.php:39`), settings form (`GeneralSettings.php:187`), frontend (`format.ts`, via `resolveCurrencyPrecision`), backend binding (`AppServiceProvider.php:168`). An explicit precision of `0` is honored client-side instead of being coerced to 2 by the old `|| 2` shorthand (`format.ts`, `print-invoice.tsx` — the latter now reuses the shared formatter).

### Changelog vs the 2026-08-25 audit
Fixed since then: instalment/payment-policy guards (string comparisons + real keys), date formats in `format.ts`, `sb_orders_code_type`, `sb_default_theme`, audio + layout + printing-gateway + register-tab + keyboard-shortcut settings, invoice receipt settings (new `InvoiceSettings` group + `settings/invoices.tsx` page), `sb_customers_credit_enabled`, `sb_store_square_logo`, `sb_currency_iso/prefered` frontend reads, currency-precision defaults + zero-precision handling (second pass, #10), store city/email/pobox receipt rendering (second pass, #8), hold-order expiration scheduling + guard + relabel (second pass, #9). Removed: `sb_subul_order_sms`, `sb_subul_sound_enabled`. Remaining: rectangle logo (wontfix), two-pipe architecture (#11 covers the dead scheduler side — only the hold-order job is scheduled so far).
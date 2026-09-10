# POS Settings Enforcement Plan — dead options & registry hygiene

*Audited 2026-09-09. Trigger: "Editable Unit Price" disabled in POS Settings → Features,
yet unit prices remained editable at the POS. This plan corrects the POS section of
`docs/settings-audit.md` (2026-09-08), which conflated "delivered to the frontend" with
"enforced at runtime".*

## 1. Context

Every POS option follows one path: settings tab PHP (`app/Settings/pos/*.php`) →
POS boot payload (`app/Http/Controllers/Dashboard/OrdersController.php:200-257`) →
`resources/js/constants/pos-options.ts` registry → runtime consumer. A link can break
at the last hop: the key is registered, delivered, displayed in settings — and enforced
nowhere. That class of bug is invisible to types (the payload is a loose record) and
was invisible to the previous audit.

## 2. Audit method

1. Enumerated all keys from three sources: `POS_OPTION_KEYS` (40 keys), the settings
   tabs, and the boot payload.
2. Counted runtime consumers per accessor (components/hooks/services/pages, excluding
   tests and the settings UI) plus raw-literal leaks.
3. Classified each key as **enforced (FE)**, **enforced (BE)**, or **dead** — delivered
   but with zero runtime consumers.

## 3. Audit matrix

| Status | Options |
|---|---|
| ✅ Enforced (FE) | `price_with_tax` (via `isPriceWithTax`), `tax_type`, `tax_group`, `vat`, `show_quantity` (7 sites), `items_merge` (payload bool-coerced, `pages/dashboard/pos.tsx:37` correct), `allow_wholesale_price` (`cart-item.tsx:196`), `allow_decimal_quantities`, `amount_shortcut` (`payment-gateway-dialog.tsx:82`), `order_types` (server-filtered payload `OrdersController.php:196-199` + default picker `usePOS.ts:290`), `new_item_audio` (`use-cart-store.ts:144`), `complete_sale_audio` (`order-submission.ts:73`), `allow_partial` / `allow_unpaid` (FE `order-submission.ts` + BE `OrdersService.php:968/973`), `default_customer` (`services/pos-defaults.ts`), `registers_enabled`, `idle_counter`, `disbursement` (`use-register-session.ts`, `pos-system.tsx:104`, `register-session-dialog.tsx:40`), `layout` (`products-categories-panel.tsx:24`), `printing_enabled_for`, `printing_document`, `printing_auto` (`usePOS.ts:601-627`), `quick_product` (`secondary-navigation.tsx:35`), `quick_product_default_unit` (`quick-product-popup.tsx:72`), `force_autofocus` (`pos-system.tsx:159`), `keyboard_*` ×10 (`use-pos-shortcuts.ts:103-133`) |
| ✅ Enforced (BE) | `hide_exhausted_products` + `hide_empty_categories` (`CategoryController::applyHideProducts:312` / `applyHideCategories:329`, `ProductService` POS visibility), `registers_default_change_payment_type` (`CashRegistersService::saveOrderChange:333`) |
| ❌ Dead — delivered, never enforced | **G1** `sb_subul_unit_price_ediable` — zero consumers; **G2** `sb_subul_numpad` — "Advanced" numpad exists only in the settings form (`features-tab.tsx:127-130`); **G3** `sb_subul_printing_gateway` — zero runtime consumers (harmless today: single choice `'default'`) |
| ⚠️ Hygiene | `use-pos-shortcuts.ts` reads `o.sb_subul_keyboard_*` via property access, bypassing the registry; the ESLint raw-literal ban cannot see property access. `POS_OPTION_KEYS.keyboardShortcuts` (`sb_subul_keyboard_shortcuts`) is misclassified in the registry — it is the `MultiKeySelector` choices list for the settings UI (see `shortcuts-tab.tsx:26`), never part of the POS boot payload. |

**G1 detail — three-way default conflict:** `Options::setDefault` seeds `'yes'`
(`app/Services/Options.php:41`), the boot payload defaults to `'no'`
(`OrdersController.php:211`), and the settings switch sees `null` until first save.

## 4. Tickets

### T1 — Wire "Editable Unit Price" (the reported bug; FE) ✅ done 2026-09-09
- [x] `resources/js/components/pos/cart-item.tsx`: gate the `Price:` link on
      `isPosOptionEnabled(options, POS_OPTION_KEYS.unitPriceEditable)`; when off render
      the same "Price: …" content as a non-interactive `<span>` (no keypad via either
      the centralized `onOpenPriceKeypad` path or the local fallback).
- [x] `resources/js/components/pos/cart-table.tsx`: early-return the `type === 'price'`
      branch in `handleKeypadConfirm` when the option is off (defense in depth).
- [x] Do NOT gate `updateProductPrice` in `pos-system.tsx` — the wholesale toggle
      reuses it and "Allow Wholesale Price" is a separate option.
- [x] `app/Http/Controllers/Dashboard/OrdersController.php:211`: default `'no'` →
      `'yes'` (align with seed + settings switch).
- [x] Tests: `resources/js/tests/integration/cart-item-price-edit.test.tsx` (6 tests,
      CartItem + CartTable): option `'no'` → price renders as inert text, no keypad,
      discount link still interactive; `'yes'` → centralized keypad opens and applies
      `updatePrice(item, …)`, fallback keypad opens too. Note: the cart-table keypad
      pre-fills with the line's current price — typing the shown price is a no-op.

### T2 — Dead-key guard test (prevents recurrence) ✅ done 2026-09-09
- [x] `resources/js/tests/unit/pos-options.test.ts` → new `POS_OPTION_KEYS registry
      integrity` describe: scans runtime source (components/hooks/services/pages/
      utils/lib/api/constants) for `POS_OPTION_KEYS.<key>` usage; fails listing any
      key with zero consumers unless allowlisted: `hideEmptyCategories`,
      `hideExhaustedProducts`, `registerChangePaymentType` (BE-enforced),
      `keyboardShortcuts` (settings-UI choices list).

### T3 — Registry hygiene ✅ done 2026-09-09 (found more than planned)
- [x] `resources/js/hooks/use-pos-shortcuts.ts`: raw `o.sb_subul_keyboard_*` property
      reads → `POS_OPTION_KEYS` accessors.
- [x] ESLint `no-restricted-syntax`: added
      `MemberExpression[property.name=…/property.value=…]` selectors for
      `sb_(subul|orders|customers)_*` — the string-literal ban couldn't see property
      access. **The new rule immediately caught 7 more bypasses** (the audit's manual
      grep under-counted), all migrated to the registry:
      `order-type-dialog.tsx` (`order_types`), `pos-system.tsx:181`,
      `products-categories-panel.tsx:165`, `search-products-dialog.tsx:132,180`
      (`allow_decimal_quantities`, `quick_product_default_unit`),
      `secondary-navigation.tsx:31` (`vat`), `select-unit-quantity-dialog.tsx:43`
      (`quick_product_default_unit`).

### T4 — NexoPOS port ✅ done 2026-09-09
Reference implementation: `../nexoPos/resources/ts/components/ns-numpad-plus.vue`
(advanced keypad), `ns-pos-quantity-popup.vue:17-18` (option swap),
`libraries/print.ts:48` (gateway switch). **All dead POS options are now wired — the
"hide the option" fallback was not needed.**
- [x] `constants/pos-options.ts`: new `resolveNumpadVariant(options)` accessor
      ('default' | 'advanced' from `sb_subul_numpad`, garbage-tolerant).
- [x] `components/ui/numeric-keypad-dialog.tsx`: new `variant` prop — "advanced" ports
      `ns-numpad-plus`: explicit `.` key next to 0, backspace in the bottom row,
      full-width Enter; default layout untouched. The `.` key respects
      `allowDecimal` (so quantity keypads stay integral per
      `sb_subul_allow_decimal_quantities`).
- [x] Wired at every POS keypad call site: `cart-table.tsx` (centralized),
      `cart-item.tsx` (both fallbacks), `search-products-dialog.tsx` (quantity) —
      broader than NexoPOS, which only swaps the quantity popup.
- [x] `usePOS.printOrderReceipt`: printing-gateway switch ported from
      `print.ts:48` — `'default'` → web printing as before; a non-default gateway
      warns and falls back to default (no frontend module-gateway handlers exist yet).
- [x] Tests: `tests/unit/numeric-keypad-dialog.test.tsx` (variant resolution,
      advanced decimal typing + Enter, inert `.` when decimals off, default layout
      unchanged); dead-key allowlist no longer carries `numpad` / `printingGateway`.

### T5 — Docs ✅ done 2026-09-09
- [x] `docs/settings-audit.md` §3 rewritten with an "Enforced at" column (delivered vs
      enforced), corrected Features/Printing-gateway rows, registry note for
      `keyboardShortcuts`, and a 2026-09-09 corrections bullet in the findings summary.

**Order:** T1 → T2 → T3 → T5 (T4 decided within the batch).

## 5. Verification loop (2026-09-09 run)

1. `npm run types` — pass; `npm run lint` (`--max-warnings 0`) — pass (after fixing the
   7 violations the new rule surfaced); `npm run test` — **34 files / 264 tests pass**,
   including the 6 new price-gate tests and the dead-key guard.
2. `php artisan test` — 13 failures in stock auth feature tests
   (`AuthenticationTest`, `EmailVerificationTest`, …, `BadMethodCallException`);
   verified **pre-existing** by stashing the OrdersController change and re-running
   (`AuthenticationTest` still fails at HEAD). Unrelated to this work.
3. `npm run translation:check` — not needed (no new UI strings).
4. `npm run format` — **skipped deliberately**: the repo at HEAD is not prettier-clean
   (untouched files fail `--check` too), so a global write would create an unrelated
   repo-wide diff. Revisit as its own cleanup task.
5. **Post-T4 re-run (same day):** `npm run types` pass, `npm run lint` pass,
   `npm run test` — **35 files / 269 tests pass** (5 new keypad-variant tests; the
   dead-key guard no longer allowlists `numpad` / `printingGateway`).

## 6. Status

- [x] T1, [x] T2, [x] T3, [x] T4, [x] T5, [ ] T6 (backlog — deliberate)
- **T6 note:** until it lands, `sale_price_edit` enforcement is UI-only (the API does
  not reject crafted price edits when the setting is off).



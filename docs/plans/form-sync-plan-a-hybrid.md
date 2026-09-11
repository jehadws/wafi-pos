# Form Synchronization — Plan A: Hybrid (modal-scoped generic renderer)

*Status: **draft for decision** — see `form-sync-comparison.md`. Prepared 2026-09-10 against commit `7013387`. Every claim cites `file:line` verified on that commit. Companion plan: `form-sync-plan-b-backend-driven.md`.*

## 1. Goal

Close every **verified** frontend/backend form gap without replacing the hand-written pages:

1. Build **one** small generic renderer (`ConfigForm`) whose only job is rendering a backend form definition **inside modal dialogs** — the inline "create a related entity" use case the backend expresses with `component: 'sbCrudForm'`.
2. Wire it into the live surfaces that reference it.
3. Fix each existing page's field gaps by hand (transactions, coupons, settings tabs, product groups tab).
4. Sweep the functional bugs and type debt.

This strategy exists because the React frontend **never consumes** backend form definitions today: `resources/js/api/crud.ts:13-20` exposes only `list`/`remove`; there are **zero** frontend callers of `/form-config`, `/config`, or `/api/fields/*`; the `src`/`optionAttributes` props `ProductsController.php:367-390` passes to the product page are ignored. The hand-crafted pages are also *richer* than the config language (coupon code generator, transaction-type icon modal, bespoke product tabs), so a full config-driven migration would regress UX.

## 2. Verified codebase facts (the contract this plan codes against)

### 2.1 The three backend definition systems + Forms

| System | Classes | Read API | Submit API | Frontend consumption today |
|---|---|---|---|---|
| CRUD | `app/Crud/*Crud.php` (37) extends `CrudService`; form via `getForm($entry)`; builder `app/Classes/CrudForm.php`; field factory `app/Classes/CrudInput.php` (`FormInput extends CrudInput`, `FormInput.php:5-8`) | `GET /api/crud/{ns}/form-config/{id?}` (`routes/api/crud.php:10`) → `CrudService::getFormConfig()` (`CrudService.php:1216-1300`) → `{form, labels, links, submitMethod, namespace, optionAttributes, queryParams, title, description, src}` | `POST /api/crud/{ns}`, `PUT /api/crud/{ns}/{id}` (`CrudController.php:95-117`) | **None** (list/delete only via `crudApi`) |
| Settings | `app/Settings/*Settings.php` (11) extends `SettingsPage`; tab includes in `app/Settings/{module}/*.php`; builder `SettingForm` | Inertia: `renderForm()` (`SettingsPage.php:67-112`) → `{title, description, identifier, payload, options}`; API: `GET /api/settings/{identifier}` → `getForm()` definition incl. values (`routes/api/settings.php:8`, `SettingsController.php:44-53`) | `POST /api/settings/{identifier}` → `saveForm`; **a `null` value deletes the option** (`SettingsPage.php:155-162`) | Hand-written pages consume `{payload, options}` only |
| Fields | `app/Fields/*Fields.php` (21) extends `FieldsService` | `GET /api/fields/{resource}/{identifier?}` (`routes/api/fields.php:6`) | n/a | **Zero consumers.** Login, cash-register, payment, refund dialogs are hand-written. The 4 Transaction-Fields `sbCrudForm` references (`DirectTransactionFields.php:46`, `EntityTransactionFields.php:48`, `ReccurringTransactionFields.php:46`, `ScheduledTransactionFields.php:53`) are moot until something consumes this API |
| Forms | `app/Forms/`: `ProcurementForm` (extends SettingsPage, `IDENTIFIER 'sb.procurement'`, form = `{main, columns, products, tabs.general}`, `sbCrudForm provider_id` at `procurement/general.php:63-65`), `UserProfileForm`, `POSAddressesForm` | resolved via `sb.settings` hook filter (no direct instantiation found — **verify in A7**) | settings save path | None (procurement create/edit are hand-written) |

### 2.2 Payload contract (critical — drives everything)

`CrudPostRequest/CrudPutRequest::getPlainData` → `SbForms::getFlatForm` (`app/Traits/SbForms.php:120-172`):

- Body shape: `{ [mainFieldName]: value, [tabIdentifier]: { [fieldName]: value }, ...extraKeys }`.
- **Empty strings and `null` are dropped** (`! empty($value) || (int) $value === 0`); `0`/`'0'` survive. Consequence: a CRUD PUT cannot *clear* a field by sending `''` — it is omitted and the old value stays. The renderer must document this; do not "fix" it silently.
- Keys that are not tab identifiers pass through untouched (`variations` for products, `rules` for rewards).
- Tabs listed in `getTabsRelations()` are skipped (relation tabs handled separately).
- Server validation rules come from `SbForms::extractValidation` (`SbForms.php:61-82`), keyed `{mainName}` and `{tabId}.{fieldName}` — 422 errors arrive with those key shapes. `Rule::` objects appear inside validation arrays (`CouponCrud.php:202-205`).
- Products are special: `ProductCrud::getForm()` returns a custom `{main, id, tabs}` shape; submission goes to `/api/products` with `{name, variations: [{identification, groups, units, expiracy, taxes, images, $primary}]}` and product-specific validation (`extractProductValidaton`, `SbForms.php:21-56`).

### 2.3 Field-type dictionary (`CrudInput.php`)

| Factory | `type` sent | Extra keys |
|---|---|---|
| `text`/`password`/`email`/`number`/`tel`/`hidden`/`date` | same name | — |
| `select` / `searchSelect` | `select` / `search-select` | `options`, `component`, `props`, `refresh` |
| `textarea` | `textarea` | — |
| `checkbox` | `checkbox` | built on the *text* shape — no `options` key (`CrudInput.php:132-140`) |
| `multiselect` / `inlineMultiselect` / `selectAudio` / `switch` | `multiselect` / `inline-multiselect` / `select-audio` / `switch` | `options` |
| `media` | `media` | — |
| `ckeditor` | `ckeditor` | — |
| `datetime` | `datetimepicker` | — |
| `daterange` | `daterangepicker` | — |
| `custom` | *(no type)* | `{label, component}` only |
| `refreshConfig(url, watch, data)` | — | `{url, watch, data}` (`CrudInput.php:114-117`) |

Option shape everywhere: `{label, value}[]` (`Helper::toJsOptions/kvToJsOptions/boolToOptions`). Options may carry `disabled: true` (`WorkersSettings.php:39-50` disables the `yes` choice).

### 2.4 Custom components referenced by backend definitions

| Component name | Where referenced | Meaning |
|---|---|---|
| `sbCrudForm` | see inventory §7 | search-select that can open the referenced CRUD's form in a modal to create/pick an entity |
| `sbCreateCoupons` | `RewardSystemCrud.php:193` (`coupon_id`) | same mechanics, target `CouponCrud` |
| `sbProductGroup` | `ProductCrud.php:392` (groups tab `component`) | dedicated sub-items editor (not a generic field case) |

Note: the original audit's "15 fields" count included 4 Fields-system fields with no frontend consumer and misattributed `TransactionAccountCrud.sub_category_id` (it is a plain `search-select` with a `refresh` config, `TransactionAccountCrud.php:181-194` — a *target* of SbCrudForm elsewhere, not a `sbCrudForm` consumer itself).

### 2.5 Frontend state of play (verified)

- **No generic renderer exists.** `components/forms/shared/form-field.tsx` is a label/description/error layout wrapper only; there is no `case 'select'`-style mapper anywhere.
- UI primitives available: `select`, `multi-selector`, `multi-key-selector`, `keyboard-shortcut-input`, `dropdown-search`, `date-picker`, `date-range-picker`, `checkbox`, `switch`, `radio-group`, `toggle-group`, `dialog`, `command`, `popover`, `input`, `textarea`.
- `http.ts`: axios instance `baseURL: '/api'`, helpers `get/post/put/del` unwrap `response.data`; interceptors handle 419/401/403.
- Existing pages already implement some "missing features" by hand: accounts create/edit implement the sub-account **refresh** (`accounts/create.tsx:80-89`, tested in `api-transactions.test.ts:41-45`); POS shortcuts render all 10 fields via `MultiKeySelector` (`shortcuts-tab.tsx`); layout tab renders both audio settings as plain `Select`s (`layout-tab.tsx:41-84`). The original audit's "Shortcuts tab broken" / "Layout tab broken" claims are **wrong**.

### 2.6 Page-by-page gap inventory (create/edit forms)

| Page (resources/js/pages/dashboard/…) | Backend form | Verified gaps |
|---|---|---|
| `products/` (bespoke: `product-form-fields.tsx` + `components/forms/product-form/*`) | `ProductCrud::getForm` (6 tabs) | **Groups tab missing** (5 of 6 rendered); `groups_product_subitems` typed `[]` never populated (`product-form/types.ts:50`); `buildTransform` sends `groups: { ...data.groups_product_subitems }` and `images: { ...data.images }` — arrays spread into objects (`use-product-form.ts:70,85`; works only because PHP json-decodes numeric-key objects back to arrays); `identification_stock_management` defaults `?? false` but type+backend require `'enabled'|'disabled'` (`use-product-form.ts:27` vs `ProductCrud.php:346-355` default `'enabled'`); `images-tab.tsx:88` value prop commented out; dead code `types.ts:5-45`; `groups_error` never set |
| `categories/` | `ProductCategoryCrud::getForm` (custom array shape) | description is `<Textarea>`; backend sends `type: 'ckeditor'` (`category-form-fields.tsx:90` vs `ProductCategoryCrud.php:182`) |
| `customers/coupons/` | `CouponCrud::getForm` | missing `valid_until` (datetime, `CouponCrud.php:226-231`), `valid_hours_start` (244-249), `valid_hours_end` (250-255); renders an **extra** `description` field the backend form does not define (`coupon-form-fields.tsx:88-102`); min/max/limit/usage fields present |
| `accounting/transactions/` | `TransactionCrud::getForm` | missing `group_id` (Users Group select, `TransactionCrud.php:177-189`) and `scheduled_date` (datetime, `270-275`) in create **and** edit; account select is a plain Select — no inline create |
| `accounting/accounts/` | `TransactionAccountCrud::getForm` | field parity OK; refresh OK; missing inline create (SbCrudForm) for `sub_category_id` |
| `orders/payments-types/` | `PaymentTypeCrud::getForm` | field parity OK; UI bug: priority Input is labeled `t('Label')` (`create.tsx:129-138`); error path uses `alert(errors.error)` (`create.tsx:63-65`) |
| `customers/rewards-system/` | `RewardSystemCrud::getForm` (custom shape w/ `rules` + `ruleForm`) | field parity OK incl. rules rows; ~10 `@ts-expect-error` + `as any` per file |
| `users/roles/` | `RolesCrud::getForm` | parity OK (name/namespace/description) |
| `customers/`, `units/`, `taxes/`, `providers/`, `procurements/`, `users/` | respective Cruds / `ProcurementForm` | hand-written; no inline-create for `group_id` (customers `CustomerCrud.php:225-233`), unit `group_id` (`UnitCrud.php:164-169`), provider (`procurement/general.php:63-65`) |
| settings pages (`settings/*.tsx` + `components/settings/**`) | `SettingsPage` subclasses | `registers-tab.tsx` renders only `sb_subul_registers_enabled`; backend `pos/registers.php:22-61` conditionally adds `idle_counter`, `disbursement`, `default_change_payment_type` (`sbCrudForm`) when registers are on — **verify where idle/disbursement UI lives** (types declare them, tab doesn't render them); `customers.tsx` missing `sb_customers_default` (live consumer: `services/pos-defaults.ts`); `accounting.tsx` renders 2 of the backend's 6 keys — the 4 orders fields are defined in `app/Settings/accounting/orders.php` which **no tab includes** (`AccountingSettings.php:26-35` only includes `general.php`) and `getPayload/getOptions` (39-58) don't expose them |
| POS dialogs, auth, cash-register, refunds | `app/Fields/*` | hand-written; Fields API unused (see §2.1) |

## 3. Architecture (new code only — nothing existing is replaced)

```
resources/js/
├─ types/forms.ts                        # FormConfig / FormTab / FormField / Option / RefreshConfig types
├─ api/crud.ts                           # + formConfig(ns, id?), create(ns, data), update(ns, id, data)
└─ components/forms/config-form/
   ├─ config-form.tsx                    # renders main + Tabs from a form definition (modal-scoped)
   ├─ field-renderer.tsx                 # type → component switch (table §4)
   ├─ parse-validation.ts                # Laravel-rule subset parser
   ├─ registry.ts                        # component name → React component (sbCrudForm, sbCreateCoupons)
   └─ sb-crud-form.tsx                   # search-select + “+” modal (create via referenced form-config)
```

Data flow: hand-written page keeps its own `useForm` → for a `sbCrudForm` field it renders `<SbCrudForm field={…} value onChange/>` → on "+", SbCrudForm lazily `crudApi.formConfig(ns)` (or uses the `props` already embedded server-side in settings/fields definitions) → renders `ConfigForm` in a `Dialog` → submit to `config.links.post/put` with `submitMethod` → payload assembled per §2.2 → on success: append `{label, value}` from `optionAttributes` to the options list, select it, close.

## 4. Field-type mapping (ConfigForm `field-renderer.tsx`)

| Backend `type` | Component in v1 | Notes |
|---|---|---|
| `text`, `password`, `email`, `number`, `tel`, `date` | `<Input type={type}>` | `number`/`tel` inputMode |
| `hidden` | `<Input type="hidden">` | value still participates in payload |
| `textarea` | `<Textarea>` | — |
| `select` | `<Select>` from `field.options`; honor `option.disabled` | — |
| `search-select` (no `component`) | `DropdownSearch`/`Select` from `field.options` | options are server-computed |
| `search-select` + `component: 'sbCrudForm' \| 'sbCreateCoupons'` | `<SbCrudForm>` (registry) | §6 |
| `multiselect` | `<MultiSelector>` | value: array of ids |
| `inline-multiselect` | `<MultiKeySelector>` | (not needed by A's modal targets today; mapping included so the registry is complete) |
| `select-audio` | `<Select>` | audio preview nice-to-have — deferred |
| `switch` | `ToggleButtons` (or `RadioGroup`) from `field.options` | backend sends explicit options; never assume booleans |
| `checkbox` | `<Checkbox>` + label | text-shaped value |
| `media` | media picker reusing the `general/file-picker.tsx` pattern + `mediasApi` | — |
| `ckeditor` | `<Textarea>` **documented downgrade** (flagged in code comment) | real editor needs a dependency decision (@tiptap/react) — out of A scope |
| `datetimepicker` | `<Input type="datetime-local">` (or `DatePicker` + time) | — |
| `daterangepicker` | `<DateRangePicker>` | no live consumer today; included for completeness |
| `custom` | `registry[name]` → error boundary if unregistered | — |

## 5. Phases & tickets

### A0 — Groundwork (½ day)
- [x] **A0.1** `resources/js/api/crud.ts`: add `formConfig(ns, id?)` → `get(`/crud/${ns}/form-config${id ? `/${id}` : ''}`)`; `create(ns, data)` → `post`; `update(ns, id, data)` → `put`. Acceptance: typed responses; existing `list`/`remove` untouched.
- [x] **A0.2** `resources/js/types/forms.ts`: mirror §2.1–2.3 shapes exactly. Tolerate both `CrudForm::form()` output and custom array shapes (`ProductCategoryCrud.php:145-190`, `RewardSystemCrud.php:165-219`). Acceptance: `npm run types` green with a fixture typed against a real `ProductCategoryCrud` config.

### A1 — ConfigForm + SbCrudForm (3–5 days)
- [x] **A1.1** `parse-validation.ts` — parse the subset actually emitted by the Cruds used in modals: `required`, `numeric`, `min:X`, `max:X`, `email`; unknown rules ignored (server stays authoritative). Return `{required, rules[]}`; unit-test each.
- [x] **A1.2** `field-renderer.tsx` — the §4 table as a typed switch; `FormField` wrapper for label/description/required-asterisk/error; forward `disabled`; respect `field.errors` key.
- [x] **A1.3** `config-form.tsx` — props: `{config: FormConfig, values, onFieldChange(key, value), errors, onSubmit, submitting, submitLabel?}`; renders main field + `Tabs` (per `tabs`), assembles payload `{[main]: v, [tabId]: {…}}` on submit. Keys: `tabId.field`.
- [x] **A1.4** `sb-crud-form.tsx` — behavior spec in §6. Acceptance: integration test covers create-then-select with mocked `crudApi`.
- [x] **A1.5** `registry.ts` — maps `sbCrudForm`/`sbCreateCoupons` → SbCrudForm; unregistered name → visible dev-warning + hidden trigger.
- [x] **A1.6** Shared error util `resources/js/utils/form-errors.ts` — `mapServerErrors(axiosError): Record<string,string>` preserving dot keys; adopt in SbCrudForm first (pages adopt in A5). **[done — deviation]** the repo already has `utils/api-errors.ts::extractValidationErrors` + `getApiErrorMessage`; no duplicate `form-errors.ts` was created — the modal maps 422 bags through the existing utils.
- [x] **A1.7** Tests: `tests/unit/config-form.test.tsx` (type mapping snapshot incl. hidden/ckeditor-downgrade/disabled option), `tests/integration/sb-crud-form.test.tsx` (open modal → fill → submit → option appended & selected; 403 hides "+" button).

### A2 — Wire SbCrudForm into live surfaces (2–3 days; each row independent)

| # | File(s) | Field | Backend ref |
|---|---|---|---|
| 1 | `components/forms/product-form/identification-tab.tsx:31-46` | category_id | `ProductCategoryCrud` (`ProductCrud.php:282-291`) |
| 2 | `components/forms/product-form/units-tab.tsx` + `selling-group-card.tsx:12-13` | unit_group; unit_id (resolves the “create unit” TODO) | `UnitGroupCrud` / `UnitCrud` (`ProductCrud.php:398-407,183-193`) |
| 3 | `pages/dashboard/customers/customer-form-fields.tsx` | group_id | `CustomerGroupCrud` (`CustomerCrud.php:225-233`) |
| 4 | `pages/dashboard/units/unit-form-fields.tsx:61-65` | group_id | `UnitGroupCrud` (`UnitCrud.php:164-169`) |
| 5 | `pages/dashboard/accounting/transactions/create.tsx` + `edit.tsx` | account_id | `TransactionAccountCrud` (`TransactionCrud.php:190-199`) |
| 6 | `pages/dashboard/accounting/accounts/create.tsx` + `edit.tsx` | sub_category_id | keep existing refresh (`create.tsx:80-89`); add inline create of sub-accounts |
| 7 | `pages/dashboard/procurements/create.tsx` + `edit.tsx` | provider_id | `ProviderCrud` (`app/Forms/procurement/general.php:63-65`) |
| 8 | `pages/dashboard/customers/rewards-system/create.tsx` + `edit.tsx` | coupon_id | `CouponCrud` via `sbCreateCoupons` (`RewardSystemCrud.php:190-200`) |

Acceptance per row: field renders options (server-provided), “+” opens modal with the referenced form, submit creates the entity, new option selected, `translation:check` passes for any new string.

### A3 — Field-parity fixes in existing pages (2–3 days)
- [x] **A3.1 Transactions** (`accounting/transactions/create.tsx`, `edit.tsx`): add `general.group_id` (select; options = users roles — same source the backend uses at `TransactionCrud.php:187`, `Role::get()`; **verify** how the page can obtain them: extend `transactionsApi.getConfigurations()` payload or a new Inertia prop) and `general.scheduled_date` (`<Input type="datetime-local">`). Update form state, payload, and edit hydration. Acceptance: created transaction persists both fields; edit round-trips.
- [x] **A3.2 Coupons** (`customers/coupons/coupon-form-fields.tsx`, `use-coupon-form.ts`): add `valid_until` (DatePicker), `valid_hours_start`/`valid_hours_end` (`<Input type="time">`). Decide the extra `description` field: **check `subul_coupons` schema** (migrations) — if the column exists keep it and add it to `CouponCrud::getForm` (backend + frontend stay in sync); if not, remove it from the frontend (default: backend is source of truth).
- [x] **A3.3 Payment types** (`orders/payments-types/create.tsx:129-138`, `edit.tsx`): fix the priority field's label (`t('Label')` → `t('Priority')`); replace `alert(errors.error)` with `toast.error` + inline errors.
- [x] **A3.4 POS settings — registers tab** (`components/settings/pos/registers-tab.tsx`): add `sb_subul_registers_default_change_payment_type` as `<SbCrudForm>` (target `PaymentTypeCrud`; note options use the **label** attribute, `pos/registers.php:59`), shown only when `sb_subul_registers_enabled === 'yes'` (mirrors the backend conditional at `pos/registers.php:22`). Extend `components/settings/pos/types.ts` payload/options + `use-pos-settings.ts` defaults. Also **verify** where `sb_subul_idle_counter`/`sb_subul_disbursement` settings UI lives (declared in `types.ts:90-94`, absent from `registers-tab.tsx`) — render here if orphaned. This key is backend-enforced (`CashRegistersService::saveOrderChange:333`) and settings-only in `POS_OPTION_KEYS` — no registry change, but respect the dead-key guard test.
- [x] **A3.5 Customers settings** (`pages/dashboard/settings/customers.tsx`): add `sb_customers_default` (`SbCrudForm`, target `CustomerCrud`); requires backend: expose the key in `CustomersSettings::getPayload()`/`getOptions()` (today only 3 keys, `CustomersSettings.php:33-37`). Runtime consumer exists: `services/pos-defaults.ts`.
- [x] **A3.6 Accounting settings — orders section**: backend first — include `accounting/orders.php` as a second tab in `AccountingSettings.php:26-35` **and** add the 4 keys to `getPayload()`/`getOptions()` (`AccountingSettings.php:39-58`; options from `$accounts['revenues'|'assets'|'expenses']`). Frontend — add an "Orders" section to `settings/accounting.tsx` with the 4 selects (revenues / cash / unpaid / COGS), reusing the existing `Command`+`Popover` pattern; upgrade to `SbCrudForm` where the field carries `props: TransactionAccountCrud::getFormConfig()` (`accounting/orders.php:7,15-16`). Acceptance: all 4 options persist and round-trip.

### A4 — Product Groups tab (2–3 days)
- [x] **A4.1** Contract (`ProductCrud.php:364-393`): groups tab = one `hidden` field `product_subitems`; row shape `{_quantity_toggled, _price_toggled, _unit_toggled, id, name, unit_quantity_id, unit_quantity, product_id, parent_id, unit_id, unit, quantity, unit_quantities, sale_price}`; tab-level `component: 'sbProductGroup'`. Confirm the backend gates sub-items on `type === 'grouped'` before rendering.
- [x] **A4.2** New `components/forms/product-form/groups-tab.tsx`: rows = product search-select (`DropdownSearch` + `productsApi`) → unit-quantity select (row's `unit_quantities`) → quantity → per-row toggles; add/remove rows; visible only when `identification_type === 'grouped'`.
- [x] **A4.3** Wire state: type `groups_product_subitems` properly (`types.ts:50` is a `[]` literal today), render the tab in `product-form-fields.tsx` (add to `Tab` union + `TabsTrigger`), hydrate on edit from `product.sub_items` (verify the edit payload returns them — `ProductCrud.php:370-389` shapes them).
- [x] **A4.4** Fix `buildTransform` (`use-product-form.ts:56-89`): send `groups: data.groups_product_subitems` and `images: data.images` as **arrays** (remove object spreads at lines 70/85 — they serialize arrays as `{0: …}` objects and only work because PHP json-decodes numeric-key objects back to arrays). Confirm `ProductService` accepts arrays (Pest test or manual PUT).
- [x] **A4.5** Delete dead code: `types.ts:5-45` commented block; remove `groups_error` from `ProductFormData`+defaults (tab-level error never set nor rendered) or set it during A4 validation — choose **remove**.

### A5 — Functional bug fixes (½ day)
- [x] **A5.1** `images-tab.tsx:88`: restore `value={form.data.images[0] || ''}`.
- [x] **A5.2** `use-product-form.ts:27`: `identification_stock_management: product.stock_management === 'disabled' ? 'disabled' : 'enabled'` (backend default `'enabled'`, `ProductCrud.php:355`; server may return `0/1/true/false` — normalize once in `editDefaults`).
- [x] **A5.3** Unify server-error mapping: adopt `utils/form-errors.ts::mapServerErrors` (A1.6) in transactions/accounts/roles/payments-types/rewards pages, replacing the ad-hoc `key.replace(/\./g,'_')` dance (`transactions/create.tsx:64-68`) which currently drops nested errors while JSX reads dot keys (`create.tsx:194`).

### A6 — Type-safety & cleanup sweep (1–2 days)
- [x] **A6.1** Precise form-type alias (e.g. `resources/js/types/inertia-form.ts` — `AppForm<T>` matching the actual `useForm()` return: data/setData/errors/setError/clearErrors/transform/put/post/processing) and remove the ~35 `@ts-expect-error Inertia form type` suppressions (`roles/create.tsx:26`, rewards create/edit, customers/user/coupon hooks, …).
- [x] **A6.2** Remove `as any`: `selling-group-card.tsx` (4×), `use-product-form.ts` (2×), `use-customer-form.ts` (2×), `use-user-form.ts` (2×), `use-coupon-form.ts` (2×), `orders/order-details-tab.tsx` (3×), `rewards-system/create.tsx`+`edit.tsx` (18×) — real types; many resolve via A6.1.
- [x] **A6.3** Delete every `console.error('Validation errors:', …)` artifact (confirmed at `transactions/create.tsx:71`, `roles/create.tsx:49`, `accounts/create.tsx:62`, `use-product-form.ts:175`, `payments-types/create.tsx:62`; sweep the rest by grep).
- [x] **A6.4** Delete `stock-adjustment/page.tsx:191-198` commented-out procurement-history block.
- [x] **A6.5** Add `refunded_products` to the Order type used by `order-details-tab.tsx:119,144,147`; re-run the ambient-type guard (`module-dts.test.ts`).

### A7 — Backend hygiene + verification tasks (1 day)
- [x] **A7.1** Verify how `app/Forms/*` (`ProcurementForm`, `UserProfileForm`, `POSAddressesForm`) are registered (no direct instantiation found; suspected `sb.settings` hook filter). Document; no behavior change.
- [x] **A7.2** `SuppliesDeliveriesSettings` (include file `supplies-deliveries/general.php`, no frontend page): decide **populate or remove from autoload**; record the decision here.
- [x] **A7.3** Workers `yes`-disabled option: confirm `settings/workers.tsx` respects `option.disabled` on the `sb_workers_enabled` select (`WorkersSettings.php:39-50` disables `yes`).
- [x] **A7.4** Conditional fields (`pos/registers.php:22`, `pos/vat.php`) are **server-resolved** — the frontend receives the final field list; document, no frontend change.
- [x] **A7.5** Document the Fields system disposition (`app/Fields/*` + `/api/fields/*` unconsumed by the SPA) in `docs/agents/architecture.md` "Known debt" — decision: leave as extension surface; no consumers in Plan A.
- [x] **A7.6** Document the payload contract (§2.2, incl. empty-string-omission semantics) near `docs/agents/architecture.md` so future forms don't rediscover it.

### A8 — Verification loop (per `docs/agents/architecture.md`)
- [x] `npm run types && npm run lint && npm run test`
- [x] `php artisan test` (after A3.5/A3.6 backend touches)
- [x] `npm run translation:check` (all new UI strings; `lang/` is pipeline-managed)
- [x] `npm run format`
- [x] e2e spot-checks (`npm run test:e2e`): product create with inline category create; transaction create (group_id/scheduled_date); settings saves (registers/customers/accounting). Checkout-critical: keys touched in A3 are consumed at POS (`pos-defaults.ts`, `CashRegistersService`) — run the checkout e2e suite.

## 6. SbCrudForm — detailed behavior spec

Props: `{ field: SearchSelectFieldDef; value: string | number | ''; onChange(value, createdEntry?); disabled?: boolean }` where `field.props` may already be a full form-config (settings/fields definitions embed it server-side) or absent (then `{namespace}` is required and the config is fetched lazily).

1. Renders label/description (via `FormField`) + a `Select`/`DropdownSearch` populated from `field.options` (server-computed) + a "+" trigger (hidden when `disabled` or when the form-config probe 403s — `getFormConfig` runs `allowedTo(read)`, `CrudService.php:1226`).
2. On "+": resolve config (embedded `props` or `crudApi.formConfig(namespace)`), open `Dialog` with `ConfigForm`; submit uses `config.links.post` / `config.links.put` (id-substituted) with `config.submitMethod`, payload assembled per §2.2.
3. Success: build `{label, value}` from the created entry using `config.optionAttributes` (fallback chain `label → name`), append to options, `onChange(value, entry)`, close, toast success.
4. Failure: `mapServerErrors` → inline errors inside the modal; HTTP/permission errors surface as toasts (never `alert`).
5. `field.refresh` (`{url, watch, data}`, `CrudInput.php:114-117`): supported — when the watched parent key changes, re-fetch options from `url` with `data`. (Accounts page keeps its manual implementation; A2 row 6 switches only the inline-create affordance.)
6. i18n: all new labels through `useTranslation`; RTL-safe (existing primitives are).
7. A11y: dialog focus trap via `ui/dialog`; trigger `aria-label` = `t('Create new') + ' ' + label`.

## 7. Explicitly out of scope for A

- Full CKEditor (dependency decision — @tiptap/react — tracked separately).
- Audio-preview UI for `select-audio` (values already save/load fine).
- Consuming `/api/fields/*` anywhere.
- Any page's wholesale conversion to config-driven rendering (that is Plan B).
- A generic client-side Laravel-rule engine beyond the §4 subset (server validation + `mapServerErrors` remains the authority).

## 8. Effort & sequencing summary

| Phase | Effort | Depends on |
|---|---|---|
| A0 groundwork | ½ d | — |
| A1 renderer + SbCrudForm | 3–5 d | A0 |
| A2 wiring (8 rows) | 2–3 d | A1 |
| A3 parity (6 tickets) | 2–3 d | A1 (only A3.4–A3.6); A3.1–A3.3 independent |
| A4 product groups tab | 2–3 d | — |
| A5 bug fixes | ½ d | — |
| A6 cleanup | 1–2 d | — |
| A7 backend hygiene | 1 d | — |
| A8 verification | continuous | all |

**Total ≈ 12–18 focused days.** Parallelizable: A4/A5/A6/A7 while A1/A2 proceed.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Embedded `props` (`*Crud::getFormConfig()`) inside settings/fields definitions bloats Inertia payloads and can nest configs | SbCrudForm prefers lazy `formConfig(ns)` fetch; use embedded `props` as cache; never nest a modal inside a modal's own sbCrudForm field |
| Backend drops `''`/`null` on submit (§2.2) — "clear a field" silently no-ops on PUT | Documented contract; modal forms only create; page-level clears handled with explicit sentinels where required |
| 403/permission states on form-config (`allowedTo` inside `getFormConfig`) | Probe on first open; hide "+" permanently; never block plain select |
| Option label attribute differs per resource (`label` for payment types vs `name` for most) | Derive display label from `optionAttributes`, fallback `label → name` |
| `switch` fields carry mixed option value styles (`'enabled'/'disabled'`, `'1'/'0'`, booleans) | Renderer always renders from `field.options`; value normalizers live beside each page's `editDefaults`, not in the renderer |
| Translation pipeline churn | Batch new strings per phase; run `translation:check` before each PR |

## 10. Acceptance criteria (Plan A done = all true)

1. Every field in every verified-gap row of §2.6 either renders with the right value or is a recorded wontfix in this file.
2. All 8 A2 surfaces support inline create of their related entity.
3. Product create/edit renders 6/6 tabs; groups round-trip through `/api/products` as arrays.
4. `grep -r "ts-expect-error" resources/js` returns 0 in form hooks; `console.error('Validation errors'` returns 0.
5. `npm run types && npm run lint && npm run test`, `php artisan test`, `translation:check` all green.

<!-- END-A -->







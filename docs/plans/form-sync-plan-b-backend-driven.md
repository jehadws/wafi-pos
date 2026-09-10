# Form Synchronization — Plan B: Full backend-driven form system

*Status: **draft for decision** — see `form-sync-comparison.md`. Prepared 2026-09-10 against commit `7013387`. Facts (payload contract, field dictionary, page inventory) are identical to Plan A §2 and are **not repeated here** — read `form-sync-plan-a-hybrid.md` §2 first. This plan supersedes hand-written forms with config-driven rendering.*

## 1. Goal

Make the backend the **single source of truth** for every dashboard form: one generic engine renders `*Crud::getFormConfig()` / `SettingsPage` definitions / (optionally) `FieldsService` definitions directly. Hand-written field JSX is retired page by page. Every future field lands in PHP once and appears in the UI without a React change.

Non-goals (kept from Plan A): POS runtime surfaces (`components/pos/**`) stay hand-written; checkout flows untouched.

## 2. Principles

1. **Parity before elegance** — a page migrates only when the engine can reproduce every current behavior (fields, defaults, errors, redirects, UX affordances). No silent field loss.
2. **Escape hatches are first-class** — a `custom` component registry and a `group` (repeatable rows) renderer exist from day one, because the backend already uses them (`sbProductGroup` `ProductCrud.php:392`, selling-group rows `ProductCrud.php:428-476`, gallery rows `ProductCrud.php:545+`).
3. **The server owns the payload shape** — the engine assembles `{[main]: v, [tabId]: {…}}` exactly per `SbForms::getFlatForm` (`SbForms.php:120-172`), including the empty-string-omission semantics.
4. **Feature flag per page** — each migration is reversible behind a per-page flag (route-level or prop-level) until the parity checklist passes.

## 3. Target architecture

```
resources/js/
├─ types/forms.ts                    # FormConfig/FormField/Option/RefreshConfig/GroupField (full B spec)
├─ api/
│  ├─ crud.ts                        # + formConfig/create/update (as A0.1)
│  ├─ settings.ts                    # + get(identifier) → GET /api/settings/{id} (definition incl. values)
│  └─ fields.ts                      # + get(resource, identifier?) → GET /api/fields/{resource}/{id?}
└─ components/forms/engine/
   ├─ config-form.tsx                # full renderer: main + tabs + notices + footer + custom tab component
   ├─ field-renderer.tsx             # every type in §4
   ├─ group-renderer.tsx             # repeatable rows: fields[], closable, label, per-row field overrides
   ├─ option-loader.ts               # static options | optionAttributes+crudApi.list | refresh(watch) loader
   ├─ validation.ts                  # client-side Laravel-rule subset engine (shared with A)
   ├─ registry.tsx                   # custom components: sbCrudForm, sbCreateCoupons, sbProductGroup, …
   ├─ use-crud-form.ts               # fetch config → hydrate → track dirty → submit → map errors
   ├─ use-settings-form.ts           # fetch definition → hydrate payload/options → save (null deletes)
   └─ pages/
      ├─ crud-form-page.tsx          # generic create/edit page shell (FormHeader + ConfigForm)
      └─ settings-form-page.tsx      # generic settings page shell
```

Data flow (CRUD): route page (`dashboard/{module}/create`) mounts `CrudFormPage` with `namespace` (+ `id` for edit) → `useCrudForm` fetches `formConfig` → renders tabs → submit to `links.post/put` per `submitMethod` → on success follow the response's `redirect` (same contract the current pages honor: `res?.redirect && router.visit(res.redirect)`) → 422s mapped to `tabId.field` keys via the shared `mapServerErrors`.

Data flow (settings): page mounts `SettingsFormPage` with `identifier` → `useSettingsForm` fetches `GET /api/settings/{identifier}` (`SettingsController.php:44-53` returns `getForm()` — the definition **with current values**) → save posts the nested payload to `POST /api/settings/{identifier}`; `null` deletes an option (`SettingsPage.php:155-162`).

Inertia compatibility: current controllers render pages with `{payload, options}` props. Migration keeps those props as the initial hydration source (fast first paint) and uses the API definition only as the **field-map**; when a page has no controller changes available, the engine can run in "fetch-only" mode.

## 4. Field-type support matrix (full — superset of Plan A §4)

| `type` | Component | B-specific requirements |
|---|---|---|
| text/password/email/number/tel/date/hidden | Input | same as A |
| textarea | Textarea | — |
| select / search-select (plain) | Select / DropdownSearch | honors `option.disabled` |
| search-select + sbCrudForm / sbCreateCoupons | SbCrudForm (as A §6) | lazy config fetch + embedded-props cache |
| multiselect | MultiSelector | array values |
| **inline-multiselect** | MultiKeySelector | POS shortcuts wave — mapping must produce the exact `string[]` shape `use-pos-shortcuts.ts` consumes |
| **select-audio** | AudioSelect | Select + play-preview button (new small component; audio choices already shipped as options) |
| switch | ToggleButtons | — |
| checkbox | Checkbox | text-shaped value (no options key — `CrudInput.php:132-140`) |
| **media** | MediaField | file-picker + `mediasApi` upload + preview; used by category `preview_url`, product images |
| **ckeditor** | RichTextEditor | **requires a dependency decision** (@tiptap/react recommended). Sanitization: store HTML as today (category description). Must be decided before the categories migration |
| datetimepicker | datetime-local Input | — |
| **daterangepicker** | DateRangePicker | used by query filters on table Cruds (`CustomerAccountCrud.php:187-189`, `OrderCrud.php:140-142`) — no form usage today; table-filter support optional |
| custom | registry | — |
| **group** (field type) | GroupRenderer | rows from `field.groups`, each `{fields, closable, label}`; per-row overrides (`disabled` on unit_id, `ProductCrud.php:463-465`); add-row from `field.fields` + `field.options`; nested validation keys `variations.*.units.selling_group.*.unit_id` (`SbForms.php:36-48`) |
| tab-level `component` | registry | `sbProductGroup` (`ProductCrud.php:392`) renders the whole groups tab |
| tab `show` callable | already server-resolved | engine ignores unknown keys |

## 5. Backend readiness work (before any wave)

- [ ] **B5.1 Contract tests (Pest)**: for every autoloaded Crud + SettingsPage, assert `getFormConfig()`/`getForm()` shape — keys present, field `type` ∈ known set, `options` shape `{label, value}[]`, and **no closures leaking into JSON** (`show` must never survive into API responses — verify what `getFormConfig` actually serializes).
- [ ] **B5.2 Permissions**: `getFormConfig` runs `allowedTo(read/update)` (`CrudService.php:1220-1226`) — decide the 403 JSON shape and an engine "read-only" fallback rendering.
- [ ] **B5.3 `optionAttributes` audit**: each target Crud must return attribute names that match its list columns (e.g. `PaymentType` uses `label`, not `name` — `pos/registers.php:59`). Fix mismatches in PHP, never in JS.
- [ ] **B5.4 Payload-size check**: settings definitions embed full nested form-configs (`props`); measure Inertia payload after each wave; if heavy, add a `?light=1` mode to `getFormConfig` that strips `props` (engine fetches lazily anyway).
- [ ] **B5.5 Error-shape confirmation**: assert 422 bags use `{tabId}.{field}` keys end-to-end for a nested sample (transactions) and `variations.*.…` for products.

## 6. Migration waves

### Wave 1 — CRUD pages with simple parity (≈ 11 pages, 1–2 d each)

| Page (FE) | Namespace | Notes / expected wins |
|---|---|---|
| `users/roles/create+edit` | `sb.roles` | trivial; first end-to-end proof |
| `orders/payments-types/create+edit` | `sb.payments-types` | fixes the priority-label bug by construction |
| `units/create+edit` | `sb.units` | group_id gains inline create free |
| `taxes/create+edit` | `sb.taxes` | verify TaxCrud shape first |
| taxes groups | `TaxesGroupCrud` | — |
| `customers/groups/create+edit` | `CustomerGroupCrud` | — |
| `accounting/accounts/create+edit` | `sb.transactions-accounts` | refresh config via option-loader; parity with the manual implementation + its unit test |
| `accounting/transactions/create+edit` | `sb.transactions` | **wins**: group_id + scheduled_date appear automatically |
| `customers/coupons/create+edit` | `sb.coupons` | **wins**: valid_until/hours fields; decide extra description (as A3.2); keep the code-generator button via a `custom` registry component |
| `customers/rewards-system/create+edit` | `sb.rewards-system` | custom shape `{main, rules, ruleForm, tabs}` — engine needs root-key passthrough + a rules row editor registered as `custom` |
| `categories/create+edit` | `sb.products-categories` | needs the ckeditor decision; page keeps its 3-column layout via page-shell slots |

### Wave 2 — Settings pages (≈ 9 pages, 1–2 d each)

Order: `accounting` (wins the 4 orders fields by construction — after backend wires `orders.php` + payload/options), `customers` (wins `sb_customers_default`), `workers`, `reports`, `orders`, `invoices`, `general` (7 tabs incl. media), `pos` (6 tabs — inline-multiselect + select-audio + conditional registers fields all driven by config), `reset` last (destructive confirmation UX may stay hand-written permanently — decided at its parity gate).

### Wave 3 — Product form (spike, then decide; 3–5 d + ½ d spike)

`ProductCrud` is the hardest object: custom `{main, id, tabs}` shape, `group` field with per-row overrides, `sbProductGroup` tab component, bespoke `/api/products` payload (`variations[0].…`), transform logic (`use-product-form.ts:56-89`). Two options, decided after the spike:
- **B3.a migrate** — engine gains `id`-root + variations payload assembly + `sbProductGroup` registry component (reusing Plan A A4's groups-tab work as the custom component).
- **B3.b keep bespoke** — document the product form as the sanctioned exception; still delete its dead code and fix its bugs (A4/A5 tickets apply regardless).

### Wave 4 — Forms & Fields (optional, decision-gated)

`ProcurementForm`/`UserProfileForm`/`POSAddressesForm` (verify registration first) and the 21 `app/Fields/*` resources. Consume only if a concrete UI need appears (cash-register dialogs, refunds modal); otherwise document as extension surface (same disposition as A7.5).

## 7. Per-page parity gate (blocking checklist, applied to every migrated page)

1. **Field census**: list every backend field (from the contract test output) — all render, none dropped.
2. **Value round-trip**: create → list shows it; edit → change every field → save → reload → verify.
3. **Server errors**: force a 422 (e.g. duplicate coupon code) → errors land inline on the right fields.
4. **Empty semantics**: save with untouched empty fields → no accidental value writes (§2.2 omission rules).
5. **Permissions**: as a role lacking create/update, page renders read-only or navigates per existing behavior.
6. **UX affordances preserved**: any hand-written nicety (generate-code, icon modal, layout) is re-registered as a `custom` component before cutover.
7. **i18n + RTL**: `translation:check` clean; visual RTL pass on one page per wave.
8. **Flag flip**: page served by the engine for 1 sprint before the hand-written JSX is deleted.

## 8. Deprecation plan

- After each wave's flags have been on for a sprint: delete the page's hand-written field JSX and its `use-*-form` hook; keep page shells + breadcrumbs.
- `components/forms/shared/*` stays (used by remaining pages + POS).
- The ambient-type guard and option-registry tests continue to run; form-related `module.d.ts` entries retire as pages migrate.

## 9. Test & QA strategy

- **Engine unit tests**: renderer mapping (§4 full matrix), payload assembly (incl. empty-omission), validation subset, option-loader (static/list/refresh), group renderer add/remove/override.
- **Contract tests**: B5.1 Pest suite is the engine's fixture generator — CI fails when a PHP form change breaks a rendered field.
- **Integration**: one full create→edit→error→save cycle per wave against mocked APIs.
- **E2E (Playwright)**: one happy-path + one validation-error path per migrated page; product/POS suites untouched unless Wave 3 migrates products.
- **Visual**: side-by-side screenshots old vs engine page for one page per wave (manual, recorded in the parity PR).

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **UX regression** — hand-crafted layouts (3-column category page, coupon tabs w/ icons, settings multi-section cards) get flattened by a generic renderer | Page shells accept slot props (header/footer/section layout); custom components for every bespoke behavior; per-page parity gate item 6 blocks cutover |
| `show` callables / Hook filters make definitions dynamic — engine caches stale shapes | Contract tests (B5.1) + engine refetches config per mount; no long-lived config caching client-side |
| Payload bloat from embedded `getFormConfig()` props | B5.4 `light` mode + lazy fetch |
| Redirect semantics differ (`redirect()->back()` vs JSON `{redirect}`) | Engine submits via axios (`crudApi`) which receives JSON; verify `submitRequest` returns JSON redirect on `expectsJson` — add a Pest assertion (B5.5) |
| Client rule engine drift vs Laravel rules | Engine validates only the documented subset; server remains authoritative; mismatch = bug ticket against `validation.ts` |
| Big-bang temptation | Waves + flags + per-page gates; each wave ships independently valuable fixes |
| i18n volume (every label already translated server-side via `__()`, but new engine chrome strings add up) | Reuse existing keys; `translation:check` in CI per wave |
| Maintenance cost of two rendering systems during migration | Time-boxed: waves must complete or be explicitly cancelled; the flag mechanism guarantees a clean abort point |

## 11. Effort & sequencing

| Stage | Effort |
|---|---|
| B0 groundwork (api clients, types — same as A0) | ½ d |
| B1–B2 engine core (renderer, group, registry, hooks, error mapping) | 5–8 d |
| B5 backend readiness | 1–2 d |
| Wave 1 (11 CRUD pages) | 11–22 d |
| Wave 2 (9 settings pages) | 9–18 d |
| Wave 3 product spike + (maybe) migration | ½ d + 3–5 d |
| Wave 4 fields/forms | 0 d (documented) → 5–10 d if consumed |
| Deprecation sweeps + QA per wave | 3–5 d |

**Total ≈ 30–60 focused days** (≈ 6–12 weeks calendar at 1 dev), vs Plan A's 12–18 days. B delivers zero user-facing fixes until the first wave lands (≈ week 2–3); A delivers fixes from week 1.

## 12. Exit criteria (Plan B done = all true)

1. Every Wave 1–2 page passes its parity gate and serves from the engine.
2. Product decision recorded (B3.a or B3.b) and executed.
3. Contract-test suite green for all autoloaded Cruds + SettingsPages.
4. Hand-written form JSX for migrated pages deleted; `grep ts-expect-error` → 0 in form code; `console.error('Validation errors'` → 0.
5. All verification-loop commands green (`types`, `lint`, `test`, `php artisan test`, `translation:check`, `test:e2e`).

<!-- END-B -->




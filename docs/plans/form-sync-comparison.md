# Form Synchronization — Plan Comparison & Decision Record

*Status: **decision pending**. Companions: `form-sync-plan-a-hybrid.md` (A), `form-sync-plan-b-backend-driven.md` (B). Prepared 2026-09-10 against commit `7013387`. The fact base both plans share — including several **corrections** to the original audit — lives in Plan A §2 and is not duplicated here.*

## 1. TL;DR

- **Plan A** fixes every *verified user-facing gap* in 12–18 days by building a small modal-scoped renderer and patching pages by hand. Zero UX regression risk. Leaves the two-systems status quo.
- **Plan B** makes the backend the single source of truth for all dashboard forms in 30–60 days. Eliminates the sync problem *class* permanently, but carries real UX-regression risk and delivers its first user-facing fix ~week 2–3.
- **A is a strict subset of B's foundation.** Choosing A does not burn B: A's `types/forms.ts`, `config-form/`, `sb-crud-form.tsx`, `crudApi` extensions, and error util are exactly B's B0/B1/B2 core. If form churn later justifies B, you start B at Wave 1 with the engine already built.

## 2. Decision matrix

| Criterion | A — Hybrid | B — Backend-driven |
|---|---|---|
| Time to first user-facing fix | week 1 (A3 items can go first) | ~week 2–3 (engine must exist first) |
| Total effort | 12–18 d | 30–60 d |
| Closes the audit's verified gaps | ✅ all | ✅ all (via waves) |
| Prevents *future* desync | ❌ — new fields still need hand-FE work | ✅ — PHP field = UI field |
| UX regression risk | none (nothing replaced) | medium — parity gate exists but generic layouts flatten bespoke UX |
| Behavioral regression risk | low | medium — payload assembly, redirects, permission states all re-plumbed |
| Test burden | focused (renderer + flows) | heavy (contract suite + per-page gates + e2e per page) |
| New dependency decisions | none (ckeditor deferred) | ckeditor RichTextEditor required for categories wave |
| Fits repo patterns (`docs/agents/architecture.md`) | strongly (hand-written pages + `{payload, options}` is today's pattern) | introduces a new architecture paradigm |
| Reversibility | each ticket independent & revertible | per-page flags; wave abort points |
| Fields system (`/api/fields/*`) | documented as unused | optionally consumed (Wave 4, decision-gated) |
| Ongoing maintenance | every form change = PHP + TSX | form change = PHP only (after migration) |

## 3. Effort side-by-side

| Work item | A | B |
|---|---|---|
| API clients + types | ½ d (A0) | ½ d (B0, same code) |
| Generic renderer | 3–5 d (A1, modal-scoped) | 5–8 d (B1–B2, full engine + group + hooks) |
| Backend readiness / contract tests | — (only A7 doc tasks) | 1–2 d (B5) |
| Inline-create wiring | 2–3 d (A2, 8 surfaces) | free via SbCrudForm in engine |
| Field-parity fixes | 2–3 d (A3) | free "by construction" per migrated page |
| Product groups tab | 2–3 d (A4) | spike ½ d + 3–5 d if migrated (B3.a) or reuse A4 (B3.b) |
| Settings gaps (registers/customers/accounting) | 2–3 d (A3.4–A3.6, incl. backend halves) | free after Wave 2 (backend halves still required) |
| Bug fixes + cleanup + hygiene | 2.5–3.5 d (A5–A7) | same tickets apply (A4/A5/A6/A7 are plan-agnostic) |
| Page migrations | — | 20–40 d (Waves 1–2) |
| **Total** | **12–18 d** | **30–60 d** |

## 4. Original-audit item → plan coverage map

*(C = corrected claim; every item from the audit is accounted for.)*

| Audit item | Verdict after verification | Plan A ticket | Plan B ticket |
|---|---|---|---|
| sb.transactions form "missing" | exists; missing `group_id` + `scheduled_date` | A3.1 | Wave 1 (auto) |
| sb.roles form "missing" | exists; **parity OK** (C) | none | Wave 1 (optional migration) |
| sb.payments-types "missing" | exists; priority mislabeled `Label`; `alert()` errors | A3.3 | Wave 1 (auto) |
| sb.rewards-system "missing" | exists; parity OK incl. rules rows; 18× ts-any | A6.1/A6.2 | Wave 1 (auto) |
| sb.transactions-accounts "missing" | exists; refresh already implemented+tested; inline create missing | A2 row 6 | Wave 1 (auto) |
| `sbCrudForm` component missing | ✅ real; count corrected (≈10 live + 4 unconsumed Fields refs; TransactionAccountCrud misattributed) | A1/A2 | B1–B2 |
| `sbCreateCoupons` | **not in audit** — discovered | A1.5 registry | Wave 1 |
| `sbProductGroup` | **not in audit** — discovered | A4 | Wave 3 |
| Product "Groups" tab missing | ✅ real (5/6 tabs) | A4 | Wave 3 |
| Category ckeditor → Textarea | ✅ real | deferred (documented downgrade) | Wave 1 + dependency decision |
| Coupon missing valid_until; extra description | ✅ real (+ also valid_hours_start/end) | A3.2 | Wave 1 (auto) + A3.2 decision |
| inline-multiselect "Shortcuts tab broken" | **wrong** — tab works via MultiKeySelector (C) | none | §4 mapping (for completeness) |
| select-audio "Layout tab broken" | **wrong** — plain Selects work (C) | none | AudioSelect + preview (optional) |
| `custom` type unimplemented | real but no live form consumer | A1.5 registry | §4 registry |
| `hidden` not rendered | moot for hand-written pages (C) | A1.2 renderer | §4 |
| daterangepicker unused | ✅ true — zero form consumers today | out of scope | §4 optional (table filters) |
| checkbox unused in forms | ✅ true | A1.2 renderer | §4 |
| Client validation unimplemented | ✅ partially true (server errors surface; no client parsing) | A1.1 + A1.6 + A5.3 | validation.ts |
| refresh config unsupported | **wrong** — implemented manually + tested (C) | A2 row 6 (inline create only) | option-loader |
| disabled state | options may carry `disabled` (`WorkersSettings.php:39-50`) | A1.2 + A7.3 | §4 |
| server-side options | already consumed everywhere | n/a | n/a |
| Accounting orders tab unwired | ✅ real — backend include missing **and** payload/options missing **and** FE section missing | A3.6 | Wave 2 + backend half |
| Conditional field display | server-resolved — no FE logic needed (C) | A7.4 | same |
| SuppliesDeliveriesSettings empty | ✅ include file, no FE page | A7.2 decision | Wave 2 or removal |
| Workers yes-disabled | ✅ real option flag | A7.3 verify | §4 |
| 35+ @ts-expect-error | ✅ real | A6.1 | A6.1 |
| as-any list | ✅ real | A6.2 | A6.2 |
| Dead code (types.ts, stock-adjustment) | ✅ real | A4.5/A6.4 | same |
| images-tab value commented | ✅ real | A5.1 | A5.1 |
| stock_management boolean default | ✅ real (backend default `'enabled'`) | A5.2 | A5.2 |
| buildTransform array-spread | **not in audit** — discovered | A4.4 | A4.4 |
| console.error artifacts | ✅ real | A6.3 | A6.3 |
| create-unit TODO | ✅ real | A2 row 2 | A2 row 2 or Wave 1 |
| refunded_products type | ✅ real | A6.5 | A6.5 |
| Fields system unused (not in audit) | discovered — zero FE consumers | A7.5 document | Wave 4 decision |
| Error-key mapping inconsistency (not in audit) | discovered — dot/underscore mixup drops errors | A1.6/A5.3 | engine does it by construction |
| registers idle/disbursement UI location | **not in audit** — verify task | A3.4 verify | Wave 2 |

## 5. Recommendation

**Execute A now.** Rationale:

1. Every user-facing defect (missing transaction fields, coupon validity, settings gaps, groups tab, inline creates) is fixed within A's first 2–3 weeks.
2. A's artifacts are B's foundation — nothing is thrown away if B is later justified.
3. The repo's architecture docs and existing settings-audit docs both treat hand-written pages + `{payload, options}` as the working pattern; B overturns that without a forcing problem.
4. B's main payoff (new PHP fields appear without FE work) only matters if forms churn frequently — if that turns out true (modules ecosystem, frequent schema changes), schedule B starting at Wave 1 with the A-built engine.

**Trigger conditions for revisiting B:** (a) a module ships forms exclusively in PHP and expects UI parity; (b) >1 form regression per month traced to hand-written page drift; (c) a second frontend client needs the same forms.

## 6. Decision checklist (answer before picking)

1. How often will dashboard forms change in the next 6 months? (rarely → A; constantly → B)
2. Is the product form's bespoke UX negotiable? (no → B must take option B3.b)
3. Is a rich-text dependency acceptable now? (no → A defers ckeditor cleanly)
4. Who maintains this in 12 months — one dev (A is safer) or a team that benefits from a contract-tested engine (B pays off)?
5. Do modules/plugins inject fields via `Hook::filter('*@getForm')` into surfaces the SPA renders? (yes → B's contract tests become essential)

<!-- END-C -->


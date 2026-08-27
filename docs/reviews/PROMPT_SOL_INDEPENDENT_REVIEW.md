# PROMPT — Independent review: schema-driven document lines

> For **Sol**. Run this **after** Flash lands the five outstanding items from
> `claude/REVIEW_VALIDATION_DIFF.md`.
> Repo: `restaurant-saas-web`. You are reviewing, not implementing. Change no code.

---

## 0. The one rule that makes this worth doing

**Do not read any existing review document until Part 3.**

`claude/REVIEW_*.md` and `docs/reviews/LAYOUT_AUDIT_2026-08-21.md` are off-limits during Parts 1
and 2. If you read them first you will confirm them, and a confirmation is worth nothing here —
this review exists precisely because the same eyes have looked at this code repeatedly.

Form your findings from **the code and the specs**. Then, and only then, reconcile.

Read for context first, and only these:

- `claude/PROMPT_FORM_VIEW.md` — what was specified
- `PROJECT.md`, `CONVENTIONS.md`, `DECISIONS.md` (D12, D13, D84, D98 especially), `REVIEW.md`

---

## 1. Scope

The schema-driven lines feature, as it now stands:

- `src/types/lineSchema.ts`, `src/hooks/useDocumentLines.ts`
- `SchemaLineGrid`, `SchemaLineFormView`, `SchemaDocumentLinesCard`
- The four schemas and their pages: purchase invoices, purchase returns, waste documents, fixed assets

Out of scope: المخزن (stock balances) and الجرد (physical count) — deliberately excluded from the
abstraction. Do not propose folding them in.

---

## 2. Where to look — nobody has examined these

Most prior review effort went into the schema *configs*. These areas have had none:

### 2.1 `useDocumentLines`

Dirty tracking, save semantics, error state, what happens on a failed save, whether two views
mutating the same state can race. This hook is now the single source of truth for four documents —
a defect here is a defect everywhere.

### 2.2 Stale closures in the schema factories

The schemas are factories (`createXLineSchema(deps)`) called inside `useMemo`, with page handlers
and lookups injected. **Check every dependency array.** A missing dep means `onClick` handlers and
`options` functions capture stale state and silently operate on old data; an over-broad dep means
the schema rebuilds every render and the grid remounts. This is the highest-probability real bug
in the current design and it is invisible in a build.

### 2.3 Dead code from the migration

Four pages had their imperative `validateLineForm` / `handleSaveLine` / line-form state removed.
Find what was left orphaned: unused state, unused imports, helpers with no callers, i18n keys no
longer referenced, CSS classes no longer rendered.

### 2.4 Grid regression, by diff

Phase B refactored the grid across all four documents in one pass. `git diff` the pre-refactor
rendering against the current one, per document, and list every behavioural difference you can
establish from source — not just visual, but disabled states, keyboard handling, what happens on
blur, and the order of operations on save.

### 2.5 `onDependencyChange` dispatch

`uomId` declares `dependsOn: ['materialId']` and carries the handler. Confirm the dispatch runs
handlers belonging to the **dependent** fields when their dependency changes — not on the changed
field itself. Trace the actual call path.

### 2.6 Edge cases nobody has named

- Zero lines; exactly one line.
- Deleting the currently selected line while in Form view — what becomes of `?line=<id>`?
- Prev / next at the first and last line.
- A `?line=<id>` in the URL that does not exist, or belongs to another document.
- Switching documents while Form view is active.
- Unsaved edits plus browser back.

### 2.7 Contracts

- **D12** — do both views surface backend errors only through `translateApiError`? Is the server
  `message` rendered anywhere?
- **i18n parity** — every key added by this feature present in **both** `en` and `ar`. List gaps
  in both directions, plus keys defined and never used.
- **RTL** — logical properties throughout; and specifically, does `ChevronLeft` mean *previous* in
  Arabic? Establish it from code and layout direction, and say plainly if it can only be settled
  in a browser.
- **CONVENTIONS** — BEM, `--color-*` only, no hardcoded hex, no hardcoded user-facing strings.

---

## 3. Reconciliation — only after Parts 1 and 2 are written down

Now read `claude/REVIEW_*.md`. Produce a three-way split:

| Bucket | Meaning |
|---|---|
| **Confirmed** | You found it independently and the prior review found it |
| **New** | You found it, prior review did not — *this is the value of this exercise* |
| **Disputed / missed** | Prior review raised it, you did not. For each: did you miss it, or do you believe it is wrong? Say which, with reasoning |

The third bucket matters as much as the second. Prior reviews contain judgment calls that may not
survive contact with the code — for example the claim that purchase-return `unitCost` should be
`readOnly`, or that the dependency dispatch is inverted. If the code says otherwise, say so.

---

## 4. Verification

**Try to install a browser first** — `npx playwright install chromium`, or check whether Chromium
already exists on the system. Flash's attempt failed on network isolation; your environment may
differ. Do not assume it will fail without trying.

- **If you get a browser:** run the manual list in `claude/REVIEW_FORM_VIEW_PHASES_BD.md` §5
  across all four documents in both directions, and report observed results.
- **If you do not:** say so in one line, mark every runtime claim **unverified**, and hand back a
  numbered checklist — each item one observable yes/no.

Per D98, `npm run build` is not verification and must not be presented as one.

---

## 5. Deliverable

**One** file: `docs/reviews/INDEPENDENT_REVIEW_<YYYY-MM-DD>.md`. Nothing else in the repo changes.

```
## 1. What I read, and what I could not
## 2. Findings
| ID | Severity | Area | file:line | Finding | Why it matters | Fix sketch |
## 3. Reconciliation
### Confirmed | ### New | ### Disputed or missed
## 4. Verification
Browser available? Results, or the checklist.
## 5. Assessment
Is this abstraction carrying its weight, or has it become a framework? (D13/D84)
## 6. Open questions
```

Severity per `REVIEW.md`: **block** / **warn** / **nit**. Sort by severity.

**Cap: 25 findings.** If you have more, you are reporting noise — merge patterns and keep the
representative `file:line`, with the full list in an appendix.

---

## 6. How this review fails

- Reading the prior reviews first. It makes the whole exercise a rubber stamp.
- Re-litigating settled design. Master-detail, the four-document scope, the two exclusions, and
  D98's verification standard are decided. Review the execution, not the decisions.
- Padding the count. Twenty real findings beat forty with fifteen restyled duplicates.
- Presenting inference as observation. If it needs a browser and you do not have one, say so.
- Recommending a rewrite. If the abstraction genuinely is not carrying its weight, say that in §5
  with evidence — but the default expectation is targeted fixes.

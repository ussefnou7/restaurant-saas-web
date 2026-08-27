# PROMPT — Form view for document lines (schema-driven)

> New feature. Four gated phases. **Phase A is a paper exercise and must come first** — it
> answers whether the whole design holds, before any UI is written.
> Target repo: `restaurant-saas-web`. No backend change is expected.

---

## 1. What this is, and what it is not

Document lines currently have one view: the grid. It works well — fast tabular entry, inline
edit, delete, row actions — and **it stays exactly as it is**.

The addition is a second view of the same lines: **Form view**, which opens *one* line as a full
field form and can perform every action the grid can.

**This is not the accordion that was removed in Phase 5.** That failed because it lived *inside*
a horizontally scrolling table — `colSpan` rows, a sticky panel that needed a `ResizeObserver`
to size, tab order across a scrolled viewport, two sticky elements competing. Form view replaces
the table region instead of nesting inside it, so none of those problems exist. Do not
reintroduce any of that machinery.

### The real payoff

The grid can only show as many fields as fit in a row. Form view has no such ceiling — so it is
where fields that *cannot* fit the grid finally live. The schema must support fields rendered in
the form only.

---

## 2. Scope

**In:** purchase invoices, purchase returns, waste documents, fixed assets — four documents that
share the same line-editing shape.

**Out, deliberately:** **المخزن** (stock balances — not document lines at all) and **الجرد**
(physical count — lines carry counted vs. system quantity and variance, different semantics).
These keep their own components.

**Do not stretch the schema to cover them.** If the config grows a way to express the count
screen's variance logic, it has stopped being a config and become a small framework nobody will
understand in six months. Per D13, the abstraction is justified here only because four real
callers exist on day one — that justification does not extend to the two that differ.

---

## 3. The core constraint

**Both views render from one field schema and share one state hook.** They are not two
components that happen to display the same data.

If they are built independently they will drift — a field added to the grid and forgotten in the
form, validation that differs between them, a value one view can save and the other cannot edit.
That class of bug surfaces months later, when nobody remembers there are two copies.

There is precedent in this codebase: **D84** — one config-driven report shell with a single
`useReportData(reportConfig)` hook, justified because six reports shipped at once. Same threshold,
same shape.

### Sketch

```ts
type LineFieldType =
  | 'text' | 'number' | 'money' | 'date'
  | 'select' | 'lookup' | 'textarea' | 'computed';

interface LineField {
  key: string;
  labelKey: string;                       // i18n key — never a literal string
  type: LineFieldType;
  required?: boolean;
  readOnly?: boolean | ((line: Line) => boolean);
  compute?: (line: Line) => unknown;      // derived; never editable
  validate?: (value: unknown, line: Line) => string | null;   // returns an errorCode
  showIn?: Array<'grid' | 'form'>;        // default: both
  gridWidth?: string;                     // grid only
  options?: SelectOptionsSource;          // select / lookup
}

interface LineSchema {
  fields: LineField[];
  actions: LineAction[];
  canDelete?: (line: Line) => boolean;
}
```

Two details that are not incidental:

- **`labelKey`, not `label`.** A schema that accepts raw strings will get raw strings, and the
  no-hardcoded-text convention dies quietly.
- **`validate` returns an errorCode, not a message.** D12 says user-facing text comes only from
  `translateApiError` via `errorCode` + `params`. Client-side validation must follow the same
  contract or the app ends up with two error systems.

### State

One `useDocumentLines(schema)` hook owns the lines, dirty state, validation, and save. Both
views consume it; **neither view owns state.**

This also settles a question that would otherwise need answering: switching views with unsaved
edits just works, because the edits live in the hook, not in the view. Do not add save/discard
prompts on view switch.

---

## 4. Behaviour

- A **Grid / Form** toggle in the lines card header.
- Clicking a row in Grid view switches to Form view with that line selected.
- Form view **replaces the table region**. It shows the selected line as a field grid, with
  **prev / next** navigation, a position indicator (`بند 2 من 5`), and a picker to jump directly
  to a line.
- Adding a line in Form view opens a blank form; saving appends it.
- Every action available in the grid — maintenance, dispose, delete — is available in the form,
  rendered from the same `actions` config, not re-implemented.
- The selected line and active view go in the URL: `?view=form&line=<id>`. Deep-linkable and
  refresh-safe, consistent with D51's preference for deep-linkable screens over tabs.

---

## 5. Phases

### Phase A — describe, don't build *(do this first, report, stop)*

Write the `LineSchema` type and the **four configs**, derived from what the existing code
actually does. **Change no rendering.** The deliverable is a document, not a feature.

Answer:

1. Can each of the four documents be fully described by the schema? List every field of every
   document, its type, and whether the schema as sketched can express it.
2. What is the **union of field types** actually needed? The sketch above is a guess. If purchase
   invoice lines need a discount/tax interaction, or waste lines need a conditional reason field,
   say so now — that changes the type before any UI depends on it.
3. Which fields exist today **only** because they fit the grid, and which fields are missing
   because they *didn't* fit? The second list is the feature's justification — name it.
4. Where does validation live today per document, and does moving it into the schema change any
   current behaviour?
5. Does anything need a custom renderer? **One custom renderer is a warning; two in the same
   document means that document does not belong in the abstraction.** Say which, plainly.

**Then stop.** Phase B does not start until this is reviewed.

### Phase B — grid renders from the schema

Refactor the existing grid to render from the config. **Zero visual or behavioural change** —
this is the highest-risk step in the whole feature, because the grid works today and users
depend on it.

Migrate **one document at a time**, verifying each before the next. Report any behaviour that
changed, before being asked.

### Phase C — build Form view

From the same schema and the same hook. This is where `showIn: ['form']` fields first appear.

### Phase D — wire it up

Toggle, row-click entry, URL params, prev/next, line picker.

---

## 6. Constraints

- Plain CSS, BEM, `--color-*` tokens only, `lucide-react` outline icons.
- Zero hardcoded user-facing strings; every key in **both** `en` and `ar`.
- Logical CSS properties throughout; the layout must work under `dir="rtl"`.
- Errors surface only via `translateApiError`.
- Nothing goes inside the lines table's horizontal scroll container.
- **Do not cite `npm run build` as verification** (D98). Mark unverified and hand back a
  console-executable checklist.

---

## 7. How this goes wrong

- Building Form view first and retrofitting the schema afterwards. The schema has to come from
  all four documents at once or it will fit one and fight three.
- Silently regressing the grid in Phase B. It is the mode people actually use all day.
- Letting the schema absorb المخزن or الجرد.
- Answering Phase A's questions in code instead of in the report. They are judgment questions;
  they need sentences.

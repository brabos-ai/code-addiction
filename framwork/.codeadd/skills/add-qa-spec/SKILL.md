---
name: add-qa-spec
description: Generate a code-free QA/E2E specification (reachability intent, UX acceptance criteria, functional E2E scenarios, capture states, target viewports, a11y expectations) from about.md + design.md + plan-*.md, and author the _tests/screens.json screen catalog by read-merge-write. Loaded by add.plan's qa-pipeline QA-Spec step.
---

# QA/E2E Specification — Case Generation Rubric

> **LANG:** Respond in user's native language. Tech terms in English.

## When to Use

- `add.plan`'s `qa-pipeline`-gated QA-Spec step (STEP 10.0), to produce `plan-qa-spec.md` AND author `_tests/screens.json` before consolidation.

## When NOT to Use

- Contract test cases (input/output pairs from RFs/RNs) — that's `add-test-specification`.
- Judging/scoring an implementation against a rubric — that's `add-qa`.

## Inputs

- `about.md` — RF/RN + acceptance criteria.
- `design.md` — UX contract (layout/hierarchy/spacing/tokens/state). Resolve SF-level `${SF_DIR}/design.md` first; fall back to `${FEATURE_DIR}/design.md` (legacy path).
- Area `plan-*.md` (plan-database.md, plan-backend.md, plan-frontend.md) — technical contracts, if they exist.
- `FEATURE_DIR/_tests/screens.json` — the existing catalog (scaffolded by `add.qa-setup`, or written by a previous plan run). Absent on a first run.
- `docs/qa/config.json` — default viewport set (required to resolve the viewports column).

## QA/E2E Case Generation

Emit **one row per surface/subfeature that `design.md` declares** — never skip a declared screen (the run's coverage gate treats a declared-but-unspecced screen as a blocker). Per surface, derive:

- **Reachability intent** — route (`path`) OR non-route open-recipe intent (e.g. "opened via the New-entry button on /entries"). Record the intent only — real selectors are finalized post-implementation by `@e2e-agent`, which merges this intent with the rendered DOM. You DO write the intent into `screens.json` (see Screen Catalog below); you do NOT invent selectors.
- **UX acceptance criteria** — tied to `design.md` (layout/hierarchy/spacing/tokens/state).
- **Functional E2E scenarios** — given/when/then per acceptance criterion. **CRUD heuristic:** when a surface manages a data entity (a form that persists, or a listing), enumerate create / read / update / delete / list as distinct scenarios. Where `about.md` has no acceptance criterion for an operation, still list it and mark the row a **gap** — never invent the criterion.
- **Capture states** — the UI states to screenshot for the surface, from the canonical vocabulary: `default`, `empty`, `filled`, `submitted`, `list`, `detail`, `created`, `updated`, `deleted`, `error`, `success`. A data-entity surface typically yields `empty,filled,list`. A single-state surface uses `default`. These map 1:1 to the screenshot files `<screen>.<state>.<viewport>.png`.
- **Target viewports** — default from `docs/qa/config.json`; per-surface override when the design demands it.
- **a11y expectations** — which surfaces carry explicit a11y acceptance (labels, focus trap, contrast, keyboard nav, etc.).

## Output 1 — `plan-qa-spec.md`

Write to `docs/features/${FEATURE_ID}/plan-qa-spec.md` under a `## QA/E2E Specification` heading:

| ID | surface | SF | reachability | viewports | capture states | UX acceptance | functional scenario | a11y |
|----|---------|----|--------------|-----------|----------------|---------------|---------------------|------|
| QA01 | entry-form | SF01 | modal (open via New-entry) | mobile,desktop | empty,filled,list | fields render + width rule | submit persists entry + list shows it | labels + focus trap |

## Output 2 — Screen Catalog (`_tests/screens.json`)

You OWN this file when dispatched by `add.plan` STEP 10.0. (`add.qa-setup` STEP 8 only scaffolds it at setup time, before any plan exists.) One catalog entry per row of the table above.

### Entry shape

```json
{
  "feature": "<feature-id>",
  "screens": [
    { "id": "login", "sf": "SF02", "name": "Login", "kind": "route",
      "path": "/login", "auth": false,
      "design": "docs/features/<id>-.../subfeatures/SF02-.../design.md",
      "expect": "what a correct render looks like" },
    { "id": "entry-form", "sf": "SF01", "name": "Entry form", "kind": "modal",
      "open": [{ "goto": "/entries" }, { "click": "role=button[name=New entry]" }],
      "auth": true,
      "design": "docs/features/<id>-.../subfeatures/SF01-.../design.md",
      "expect": "modal open with all fields visible" }
  ]
}
```

| Field | Rule |
|-------|------|
| `id` | stable kebab surface id — matches the `surface` column of your table |
| `sf` | the subfeature the surface belongs to (`SF01`, …); the merge key together with `id` |
| `name` | human label |
| `kind` | `route` \| `modal` \| `overlay` \| `portal` |
| `path` | route surfaces only |
| `open` | non-route surfaces only — ordered recipe, each step exactly one of `{"goto":"<path>"}`, `{"click":"<selector>"}`, `{"fill":["<selector>","<value>"]}`, `{"select":["<selector>","<value>"]}`, `{"wait":"<selector \| ms>"}`. Playwright role/testid syntax — never brittle CSS |
| `auth` | true when the surface requires an authenticated session |
| `design` | the `design.md` path actually used for that screen (SF-level when it exists, feature-level fallback) |
| `expect` | one line describing a correct render |

Route surfaces keep `path`; non-route surfaces declare `kind` + `open`. Both forms coexist in one catalog.

### Read-merge-write (MANDATORY)

The catalog is **feature-wide** while a plan run is scoped to **one SF** — so it is NEVER rewritten from scratch. Merge by `sf` + `id`:

1. Read the existing file. Absent → start from `{"feature":"<feature-id>","screens":[]}`.
2. Entries whose `sf` is OUT of this run's scope are preserved **byte-identically** — never reorder, reformat, or "clean up" them.
3. An in-scope entry (same `sf` AND same `id`) is **replaced** by the newly derived one.
4. A newly derived in-scope entry with no match is **appended**.
5. An in-scope entry whose screen no longer exists in the consolidated design.md is **removed** (out-of-scope entries stay untouchable — rule 2 above).

Store reachability INTENT only. If a design doc is missing or thin, list the screen with a note rather than inventing a route — flag it as a gap for the user.

## Rules

- Code-free only — no implementation code, no test scripts. The `screens.json` `open` recipe is reachability intent, not a test: never hand-write selectors you have not observed; `@e2e-agent` finalizes them post-implementation.
- Keep `plan-qa-spec.md` under ~15 lines (tabular). `screens.json` has no line budget — it carries one entry per declared screen.
- Flag missing UX acceptance / thin design as **gaps** — never invent content.
- Each row maps to one surface/subfeature; do not merge unrelated surfaces into one row.
- Emit a row for **every** screen `design.md` declares — an omitted declared screen becomes a coverage `blocker` at run time.
- `capture states` uses the canonical vocabulary only; single-state screens use `default`. Do not invent a passing CRUD scenario for an operation `about.md` does not cover — mark it a gap.
- Every `plan-qa-spec.md` row has a matching `screens.json` entry (same `sf` + `id`) and vice versa for in-scope surfaces — the two outputs are one specification in two shapes.
- NEVER rewrite `screens.json` wholesale — out-of-scope SF entries survive byte-identically.

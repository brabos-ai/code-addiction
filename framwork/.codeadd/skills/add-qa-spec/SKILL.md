---
name: add-qa-spec
description: Generate a code-free QA/E2E specification (reachability intent, UX acceptance criteria, functional E2E scenarios, capture states, target viewports, a11y expectations) from about.md + design.md + plan-*.md. Loaded by add.plan's qa-pipeline QA-Spec step.
---

# QA/E2E Specification — Case Generation Rubric

> **LANG:** Respond in user's native language. Tech terms in English.

## When to Use

- `add.plan`'s `qa-pipeline`-gated QA-Spec step (STEP 10.0), to produce `plan-qa-spec.md` before consolidation.

## When NOT to Use

- Contract test cases (input/output pairs from RFs/RNs) — that's `add-test-specification`.
- Judging/scoring an implementation against a rubric — that's `add-qa`.

## Inputs

- `about.md` — RF/RN + acceptance criteria.
- `design.md` — UX contract (layout/hierarchy/spacing/tokens/state).
- Area `plan-*.md` (plan-database.md, plan-backend.md, plan-frontend.md) — technical contracts, if they exist.
- `FEATURE_DIR/_tests/screens.json` — catalog scaffold, if it exists.
- `docs/qa/config.json` — default viewport set (required to resolve the viewports column).

## QA/E2E Case Generation

Emit **one row per surface/subfeature that `design.md` declares** — never skip a declared screen (the run's coverage gate treats a declared-but-unspecced screen as a blocker). Per surface, derive:

- **Reachability intent** — route (`path`) OR non-route open-recipe intent (e.g. "opened via the New-entry button on /entries"). Record the intent only — the concrete `screens.json` `open` recipe is finalized later by the authoring step, which merges this intent with real selectors. Do NOT write `screens.json`.
- **UX acceptance criteria** — tied to `design.md` (layout/hierarchy/spacing/tokens/state).
- **Functional E2E scenarios** — given/when/then per acceptance criterion. **CRUD heuristic:** when a surface manages a data entity (a form that persists, or a listing), enumerate create / read / update / delete / list as distinct scenarios. Where `about.md` has no acceptance criterion for an operation, still list it and mark the row a **gap** — never invent the criterion.
- **Capture states** — the UI states to screenshot for the surface, from the canonical vocabulary: `default`, `empty`, `filled`, `submitted`, `list`, `detail`, `created`, `updated`, `deleted`, `error`, `success`. A data-entity surface typically yields `empty,filled,list`. A single-state surface uses `default`. These map 1:1 to the screenshot files `<screen>.<state>.<viewport>.png`.
- **Target viewports** — default from `docs/qa/config.json`; per-surface override when the design demands it.
- **a11y expectations** — which surfaces carry explicit a11y acceptance (labels, focus trap, contrast, keyboard nav, etc.).

## Output Format

Write to `docs/features/${FEATURE_ID}/plan-qa-spec.md` under a `## QA/E2E Specification` heading:

| ID | surface | SF | reachability | viewports | capture states | UX acceptance | functional scenario | a11y |
|----|---------|----|--------------|-----------|----------------|---------------|---------------------|------|
| QA01 | entry-form | SF01 | modal (open via New-entry) | mobile,desktop | empty,filled,list | fields render + width rule | submit persists entry + list shows it | labels + focus trap |

## Rules

- Code-free only — no implementation code, no selectors, no test scripts.
- Keep the document under ~15 lines (tabular).
- Flag missing UX acceptance / thin design as **gaps** — never invent content.
- Each row maps to one surface/subfeature; do not merge unrelated surfaces into one row.
- Emit a row for **every** screen `design.md` declares — an omitted declared screen becomes a coverage `blocker` at run time.
- `capture states` uses the canonical vocabulary only; single-state screens use `default`. Do not invent a passing CRUD scenario for an operation `about.md` does not cover — mark it a gap.

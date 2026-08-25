# add-qa — Coordinator Reference

Loaded by `/add.review` at its QA merge step (STEP 10.2), and by nothing else. `@ux-agent` and `@qa-agent` must NOT load this file: both emit `type` + root cause only, and routing needs the merged, deduped set plus a global order that no single judge can see.

## Merge Rules (coordinator, at the merge step)

The two judges return independent finding sets; the coordinator merges them in order:

1. **Dedupe key** `(screen, state, viewport, symptom)` — on collision keep ONE finding, merge the evidence.
2. **Domain precedence** — a visual symptom keeps `@ux-agent`'s wording; a behavioural one keeps `@qa-agent`'s; a visual symptom with a functional root cause keeps BOTH the root cause and the visual description.
3. **Severity** — the HIGHER of the two survives; the losing judge's rationale is kept as a note, never dropped.
4. **Contradiction** — when the judges disagree on whether something is a finding at all, report it ONCE at the LOWER severity with both positions stated verbatim. Silent omission of a contradicted finding is hard-banned.

Coverage blockers (the coordinator's own coverage reconciliation) enter as coordinator findings and bypass dedupe (no judge produced a competing version).

## Fix Routing (coordinator, immediately after the merge)

Routing turns each merged finding into a dispatch target for `/add.build`. It is a **deterministic lookup** on `type` + root cause — there is no confidence score. The **coordinator** derives it after the merge (never a judge — routing needs the merged, deduped set and the global order). Every finding gets a `route`.

### Routing rules

| type + root cause | Route | Target class |
|---|---|---|
| functional / `missing-implementation` (backend or data) | `@backend-agent` (+ `@database-agent` if a schema change) | api, schema |
| functional / `missing-implementation` (UI) | `@frontend-agent` | component |
| functional / `contract-mismatch` | `@backend-agent` → `@frontend-agent` | api-contract |
| functional / `selector-drift` | `@e2e-agent` | test-file |
| functional / `spec-defect` | `@e2e-agent` | test-file |
| functional / `data-seed` | **user (manual)** | env-config |
| functional / `env-boot` | **user (manual)** | env-config |
| functional / `regression` | route by the underlying cause, flagged `regression` | varies |
| ux / `contract-violated` | `@frontend-agent` | component |
| ux / `contract-inadequate` | `@ux-agent` | design-spec |
| a11y (markup / semantics / heading order) | `@frontend-agent` | component |
| a11y (contrast / token) | `@frontend-agent` (usage) or `@ux-agent` (contract) | component, design-spec |
| `spec-gap` | `@ux-agent` | design-spec |
| coverage blocker | `@e2e-agent` | test-file |

### The `ux` two-value classification (the one place routing is judgement, not lookup)

- `contract-violated` — the rendered value contradicts a declared dimension → `@frontend-agent`.
- `contract-inadequate` — the contract declares nothing covering the observed problem → `@ux-agent`.

A `ux` or `spec-gap` finding routed to `@ux-agent` MUST cite the missing or wrong contract line (for `spec-gap`, the named missing dimension is that citation). Without the citation the route is **presented, never dispatched**.

### Capability validation (hard rule)

- `@e2e-agent` may only be routed to `test-file`.
- `@ux-agent` may only be routed to `design-spec`.
- `@qa-agent` is never a route (read-only).
- Implementation agents (`@backend-agent`, `@frontend-agent`, `@database-agent`) may not be routed to `design-spec`.

An invalid route is a **schema violation**, not a warning — do not write the report with it.

### Dependency ordering

Fixed by layer: `@database-agent → @backend-agent → @frontend-agent → @e2e-agent`. `@ux-agent` and user routes are unordered (no code dependency).

### `## Fix Routing` template

```markdown
## Fix Routing
| Order | Agent | Findings | Target class | Blocked by |
|---|---|---|---|---|
| 1 | @database-agent | F3 | schema | — |
| 2 | @backend-agent | F1, F3 | api | @database-agent |
| 3 | @frontend-agent | F1, F2 | component, api-contract | @backend-agent |
| 4 | @e2e-agent | F5 | test-file | @frontend-agent |
| — | @ux-agent | F4 | design-spec | — |
| — | user (manual) | F6 (data-seed: authSeed) | env-config | — |
```

A finding may appear under more than one agent when its route is a chain — each slice states what that agent owns. Counts in summaries are **involvement, not ownership**: count distinct findings.

### Contract-amendment trail (required — else the audit self-heals)

A fix wave that amends `design.md` (a `design-spec` route) MUST append to `design.md`'s `## Design Review` the originating `run-NNN` + finding ID. Because `qa-validation` frontmatter records `judged-contract`, when the next run's hash differs the report states *"contract amended since run-NNN"* and lists the amended dimensions. A criterion that flipped to green **only because the contract was amended** is NEVER reported as a fix.

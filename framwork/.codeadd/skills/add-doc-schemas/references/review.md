# Review Category — Schemas & Voice

Category file for review docs (audit reports, diagnose reports, QA validation reports). Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns review-specific schemas and notation.

**Schemas in this category:** `audit-report`, `diagnose-report`, `qa-validation`.

## Shared Notation

### Finding & Evidence Discipline

Both schemas require findings or hypotheses to be **grounded in evidence** — file:line refs, log lines, metrics, or measurements. A finding without evidence is an opinion.

- **Evidence reference forms:** `path/to/file.ts:42` for code, `log: <log line> @ <timestamp or context>` for logs, `metric: <name> <value> at <window>` for metrics.
- **Severity / likelihood ratings** (`low` / `medium` / `high`) MUST be tied to the evidence supporting them. A `high` rating without supporting evidence is an opinion in disguise.
- **Recommendations / hypotheses** MUST point at the finding(s) or evidence item(s) they are derived from. Drift between a recommendation and its evidence is the most common review-doc failure mode.

### Hypothesis Notation (diagnose-report specifically)

Each hypothesis carries:

1. **Mechanism** — the proposed causal chain in factual terms
2. **Likelihood** — `low` / `medium` / `high`, tied to evidence
3. **Test** — the observation, measurement, or experiment that would confirm or falsify the hypothesis

A hypothesis without a test is speculation.

## Schemas

### audit-report

For `/add.audit` (creates `docs/audit/<date>.md`).

- **Frontmatter:** `id: AUDIT-<date>`, `type: audit-report`, `related: []` (link to relevant feature/product/PRD if applicable)
- **Sections:** TL;DR · Findings · Risks · Recommendations
- **Depth floor:**
  - **Findings** — per finding: area, severity, observation, evidence (file:line or metric). No finding without evidence per Finding & Evidence Discipline above.
  - **Risks** — per risk: probability, impact, the finding(s) that support it.
  - **Recommendations** — actionable items with owner and rough effort.
- **Compression:** Findings = table `area | severity | finding | evidence`. Risks = table `risk | prob | impact | supporting findings`. Recommendations = `- [ ] action — owner — effort`.
- **Hard bans:** narrative analysis without evidence, subjective severity ratings, recommendations without owners.

### diagnose-report

For `/add.diagnose` (creates `docs/diagnose/<slug>.md`).

- **Frontmatter:** `id: DIAG-<slug>`, `type: diagnose-report`, `related: []`
- **Sections:** TL;DR · Symptom · Hypotheses · Evidence · Recommended Route
- **Depth floor:**
  - **Symptom** — same shape as the Symptom Notation in `references/fix.md`: when / where / impact / detection.
  - **Hypotheses** — per hypothesis: mechanism, likelihood, test that would confirm or falsify. Use Hypothesis Notation above.
  - **Evidence** — per item: source (log, metric, code ref), observation, which hypothesis it supports or rules out.
  - **Recommended Route** — a single sentence + target command (`/add.hotfix` | `/add.new` | `extend` | `no-action`), grounded in the evidence.
- **Compression:** Hypotheses = table `hypothesis | likelihood | test`. Evidence = bullets `source → observation → supports/refutes`.
- **Hard bans:** speculation presented as conclusion, recommended fix without an evidence chain.

### review

For `/add.review` — the **feature-level aggregate** written at
`docs/features/<feature-id>/review-NNN.md`, flat at the feature-directory root.
It is the delivery receipt `/add.done` STEP 4.0 gates on: that step reads the
**highest-numbered** one and nothing else.

Distinct from `qa-validation`, which stays per scope under
`_tests/run-NNN/`. Both are written every run: one review round produces ONE
`review-NNN.md` covering every in-scope subfeature, plus one
`qa-validation-NNN.md` per scope. The aggregate never replaces the per-scope
reports — `qa-evidence.sh validate` / `working-baseline` / `previous` and
`/add.done` all bind to those.

- **ID:** `<feature-id>-review-NNN` — a **per-feature sequence**, starting `001`, allocated as the highest existing `review-NNN.md` in the feature directory plus one. Per feature, NOT per scope: a round produces one consolidated document, so mirroring `qa-validation`'s per-scope sequences would leave "the highest" undefined across independent sequences and force `/add.done` into a loop. See `{{skill:add-id-convention/SKILL.md}}`.
- **Frontmatter:** `id: <feature-id>-review-NNN`, `type: review`, `created`, `feature: <feature-id>`, `branch`, `status: open | finalized`. `status` starts `open` and is set to `finalized` by `/add.build` exactly once, when it has appended its resolution annex.
- **Sections:** TOC · Quality Gate Report · Spec Compliance Audit · Code Review Summary · Product Validation · QA Judgement · Fix Routing · Resolution Annex. **`## TOC` is required** — 7 H2 sections, so the universal >3-H2 TOC rule applies.
- **Mandatory line:** `> **QA baseline:** <value>` immediately under the date/branch header. Emit `none` when no working run exists; NEVER omit it. `/add.done` BLOCKS on its absence and never infers a baseline. **Format:** `<value>` is `none`, or one or more `<scope>:<run>` entries — `scope` is `feature` or `SFxx`, `run` is `run-NNN` — with multiple entries separated exactly as `qa-evidence.sh` accepts (comma-joined, e.g. `feature:run-001,SF02:run-003`). `qa-evidence.sh` is the sole authority for this shape: `<value>` is its stdout, verbatim, never authored, reformatted, or hand-assembled.
- **Depth floor:**
  - **Quality Gate Report** — one row per gate (Build, Spec Compliance, Code Review Score, Product Validation, Validation Gates, QA Judgement) plus a bold `**Overall**` row. `Overall = PASSED` only when every gate is PASSED or SKIPPED. `/add.done` parses the `| **Overall** |` row, so its literal shape is load-bearing.
  - **QA Judgement** — per-scope roll-up: scope, run-NNN, severity counts, and a relative link to that scope's `qa-validation-NNN.md`. `⊘ NOT SET UP` when the `/add.qa-setup` receipt gate is unmet.
  - **Fix Routing** — the **union** of every in-scope `qa-validation-NNN.md`'s Fix Routing rows plus the code-review, build-failure and validation-gate findings. Columns: `Scope | ID | Severity | Area | Route | File | Symptom | Blocked by`. Ordered by severity precedence, then `database → backend → frontend → e2e`. Every row is scope-qualified and there is **no dedup rule** — two subfeatures reporting one symptom are two rows with two fix sites, and merging them loses a fix site.
  - **Resolution Annex** — empty on write. `/add.build` appends one row per routed ID it worked: `ID | Route | Outcome (resolved / failed / not-mine / disputed) | Files | Note`. **Append-only**: never rewrite or remove an existing row, never re-add an ID already present.
- **Compression:** every section a table; findings referenced by ID rather than restated between Fix Routing and the annex.
- **Hard bans:** overwriting an existing `review-NNN.md` (allocate the next number instead), a missing or inferred `> **QA baseline:**` line, a filesystem path in place of the `<scope>:<run>` baseline form (e.g. `_tests/run-001` instead of `feature:run-001`), any "fix applied" claim in a section other than the Resolution Annex (the review routes findings, the build applies them), a Fix Routing row without a `Scope`, deduplicating rows across scopes, setting `status: finalized` before the annex is written, and re-setting `status` on an already-finalized document.

### qa-validation

For `/add.review`'s QA judgement (creates working evidence at `<scope>/_tests/run-NNN/qa-validation-NNN.md` + sibling assets). `/add.done` may copy the complete schema-valid run unchanged to immutable delivery evidence at `<scope>/_tests/final/run-NNN/`. Final placement preserves the original report ID, run identity, findings, and relative links; it is reviewed evidence, not a pass certificate. Agent-judged, **dual-judge** QA audit — two specialist judges per subfeature (`@ux-agent` review mode owns the judgement axes; `@qa-agent` owns functional delivery + deterministic conformance + ALL a11y + failure forensics), read-PNG by default; the `playwright` plugin adds live browser driving. It is an **audit, not a gate** — it documents findings, it never fixes. Full rubric/template live in the default-shipped `add-qa` skill; this is the doc-schema contract.

- **ID:** `<feature-id>-qa-validation-NNN` — a **per-scope sequence**, NOT a global prefix. Numbering starts `001`; allocation uses the union of working `_tests/run-NNN/` and final `_tests/final/run-NNN/` IDs for that scope. The complete run shares the same `NNN`. See `{{skill:add-id-convention/SKILL.md}}` (per-scope sequence IDs).
- **Frontmatter:** `id: <feature-id>-qa-validation-NNN`, `type: qa-validation`, `created`, `feature: <feature-id>`, `scope: [<SFxx>, ...]`, `method`, `specs: { about, design }`, `viewports: [...]`, `judged-contract: sha256:<design.md provenance hash>` (the contract hash the run judged against — lets the next run detect an amended contract), `judged-tree: sha256:<working-tree fingerprint>` (the fingerprint of the tree that produced this evidence — the next invocation compares its own fingerprint against it to decide whether evidence capture can be SKIPPED; a report without it forces a recapture). (`updated`/`related` optional — reports are append-only per run, not edited.)
- **Sections:** TOC · TL;DR · Summary · Coverage (contract-anchored, vs design.md) · Functional delivery (vs about.md) · Findings · Responsiveness · Accessibility · Fix Routing · Clean screens · Not covered / caveats. **`## TOC` is required** — the report carries 9+ H2 sections, so the universal >3-H2 TOC rule applies.
- **Depth floor:**
  - **Summary** — severity counts (blocker / major / minor / polish) plus per-judge counts (`@ux-agent` / `@qa-agent` / coordinator coverage).
  - **Functional delivery** — one row per acceptance criterion / RF tested: result (met / not met / partial) + evidence. Per Finding & Evidence Discipline, no result without evidence.
  - **Coverage** — one row per screen `design.md` declares: states captured, viewports, judged (yes/no), gap. A reachable, in-contract screen with no evidence is a `blocker`, not a "not covered" note. Coverage is the coordinator's reconciliation, computed once and shared to both judges — never a judge's finding.
  - **Findings** — per finding: severity, `type: ux | functional | a11y | spec-gap`, screen, viewport, the related criterion (functional) or contract dimension (ux/conformance) or axe rule (a11y), concrete evidence (screenshot path, measured-value-vs-declared-set, and/or log line), observed, expected, fix hint. A **`type: functional`** finding additionally carries **exactly one `root cause`** from the fixed taxonomy (`missing-implementation | contract-mismatch | selector-drift | spec-defect | data-seed | env-boot | regression`), citing the evidence that grounds it. A **`type: ux`** conformance finding carries exactly one of `contract-violated | contract-inadequate`. A **`type: spec-gap`** finding names the exact contract dimension that was never declared. Every finding also carries a **REQUIRED `route`** — `**Route:** @agent-a → @agent-b · target: <target class>` (an ordered chain is allowed). The coordinator derives the route from `type` + root cause (never a judge); see the routing rules in `{{skill:add-qa/SKILL.md}}`.
  - **Check outcomes** — a declared dimension whose verification method did not run (computed-style capture absent, axe absent, a state never reached) is recorded **`unverifiable`** with the reason — never as passing, never silently omitted.
  - **Fix Routing** — the ordered dispatch plan `/add.build` consumes, and the rows `review-NNN.md` unions into its own table: a table `Order | Agent | Findings | Target class | Blocked by`. Layer order is fixed `@database-agent → @backend-agent → @frontend-agent → @e2e-agent`; `@ux-agent` and user (manual) routes are unordered (`—`). A finding may appear under more than one agent when its route is a chain; counts are involvement, not ownership. The section is REQUIRED — a report without it predates routing and must be regenerated by re-running `/add.review`, never consumed by a fallback path.
  - **Not covered** — screens/criteria skipped, auth not seeded, flows unreachable, no pixel-diff baseline. Silent omission is banned.
- **Compression:** Summary + Functional-delivery = tables; Findings = `### [SEVERITY · type] screen @viewport` blocks.
- **Hard bans:** a finding without evidence (screenshot path or log line), a functional result without a tested criterion, a `type: functional` finding without a root cause, a finding without a `route`, a route whose agent cannot write the declared target class (capability-invalid), recording a not-run check as passing instead of `unverifiable`, dropping unreached screens/criteria silently, a reachable, in-contract screen missing from the Coverage table, any "fix applied" claim (QA documents, it does not fix), pass/fail gating language (it is an audit).

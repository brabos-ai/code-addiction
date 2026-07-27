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

### qa-validation

For `/add.qa` (creates `<scope>/_tests/run-NNN/qa-validation-NNN.md` + `_tests/run-NNN/screenshots/`). Agent-judged, **dual-judge** QA audit — two specialist judges per subfeature (`@ux-agent` review mode owns the judgement axes; `@qa-agent` owns functional delivery + deterministic conformance + ALL a11y + failure forensics), read-PNG by default; the `playwright` plugin adds live browser driving. It is an **audit, not a gate** — it documents findings, it never fixes. Full rubric/template live in the default-shipped `add-qa` skill; this is the doc-schema contract.

> Migration: legacy `_qa-report/` projects keep their old reports in place; new runs write under `_tests/`.

- **ID:** `<feature-id>-qa-validation-NNN` — a **per-scope sequence**, NOT a global prefix. Numbering starts `001` and increments per scope (SF folder when scoped, feature folder otherwise); the screenshot `run-NNN` shares the same `NNN`. See `{{skill:add-id-convention/SKILL.md}}` (per-scope sequence IDs).
- **Frontmatter:** `id: <feature-id>-qa-validation-NNN`, `type: qa-validation`, `created`, `feature: <feature-id>`, `scope: [<SFxx>, ...]`, `method`, `specs: { about, design }`, `viewports: [...]`, `judged-contract: sha256:<design.md provenance hash>` (the contract hash the run judged against — lets the next run detect an amended contract). (`updated`/`related` optional — reports are append-only per run, not edited.)
- **Sections:** TOC · TL;DR · Summary · Coverage (contract-anchored, vs design.md) · Functional delivery (vs about.md) · Findings · Responsiveness · Accessibility · Fix Routing · Clean screens · Not covered / caveats. **`## TOC` is required** — the report carries 9+ H2 sections, so the universal >3-H2 TOC rule applies.
- **Depth floor:**
  - **Summary** — severity counts (blocker / major / minor / polish) plus per-judge counts (`@ux-agent` / `@qa-agent` / coordinator coverage).
  - **Functional delivery** — one row per acceptance criterion / RF tested: result (met / not met / partial) + evidence. Per Finding & Evidence Discipline, no result without evidence.
  - **Coverage** — one row per screen `design.md` declares: states captured, viewports, judged (yes/no), gap. A reachable, in-contract screen with no evidence is a `blocker`, not a "not covered" note. Coverage is the coordinator's reconciliation, computed once and shared to both judges — never a judge's finding.
  - **Findings** — per finding: severity, `type: ux | functional | a11y | spec-gap`, screen, viewport, the related criterion (functional) or contract dimension (ux/conformance) or axe rule (a11y), concrete evidence (screenshot path, measured-value-vs-declared-set, and/or log line), observed, expected, fix hint. A **`type: functional`** finding additionally carries **exactly one `root cause`** from the fixed taxonomy (`missing-implementation | contract-mismatch | selector-drift | spec-defect | data-seed | env-boot | regression`), citing the evidence that grounds it. A **`type: ux`** conformance finding carries exactly one of `contract-violated | contract-inadequate`. A **`type: spec-gap`** finding names the exact contract dimension that was never declared. Every finding also carries a **REQUIRED `route`** — `**Route:** @agent-a → @agent-b · target: <target class>` (an ordered chain is allowed). The coordinator derives the route from `type` + root cause (never a judge); see the routing rules in `{{skill:add-qa/SKILL.md}}`.
  - **Check outcomes** — a declared dimension whose verification method did not run (computed-style capture absent, axe absent, a state never reached) is recorded **`unverifiable`** with the reason — never as passing, never silently omitted.
  - **Fix Routing** — the ordered dispatch plan `/add.build qa` consumes: a table `Order | Agent | Findings | Target class | Blocked by`. Layer order is fixed `@database-agent → @backend-agent → @frontend-agent → @e2e-agent`; `@ux-agent` and user (manual) routes are unordered (`—`). A finding may appear under more than one agent when its route is a chain; counts are involvement, not ownership. Legacy reports without this section fall back to severity/axis grouping.
  - **Not covered** — screens/criteria skipped, auth not seeded, flows unreachable, no pixel-diff baseline. Silent omission is banned.
- **Compression:** Summary + Functional-delivery = tables; Findings = `### [SEVERITY · type] screen @viewport` blocks.
- **Hard bans:** a finding without evidence (screenshot path or log line), a functional result without a tested criterion, a `type: functional` finding without a root cause, a finding without a `route`, a route whose agent cannot write the declared target class (capability-invalid), recording a not-run check as passing instead of `unverifiable`, dropping unreached screens/criteria silently, a reachable, in-contract screen missing from the Coverage table, any "fix applied" claim (QA documents, it does not fix), pass/fail gating language (it is an audit).

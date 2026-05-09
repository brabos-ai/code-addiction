# Review Category — Schemas & Voice

Category file for review docs (audit reports, diagnose reports). Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns review-specific schemas and notation.

**Schemas in this category:** `audit-report`, `diagnose-report`.

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

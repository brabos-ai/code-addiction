# Strategy Category — Schemas & Voice

Category file for framework strategy docs (PRDs that drive `/add.build`). Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns strategy-specific schemas.

**Schemas in this category:** `prd`.

## Shared Notation

### Decision Notation

Reuse the Decision Notation from `references/new-feature.md` (table form by default, expanded form when a decision is load-bearing). PRDs typically carry many validated decisions; the table form keeps them dense and comparable.

### Trade-off Notation

PRDs document accepted trade-offs explicitly:

```markdown
| We gain | We give up |
|---|---|
| [benefit] | [acceptable cost] |
```

Both columns mandatory. A trade-off without a "give up" column is just a benefit list.

### Risk & Mitigation Notation

Same shape as `feature-plan` and `audit-report`:

```markdown
| Risk | Probability | Mitigation |
|---|---|---|
| [risk] | High/Medium/Low | [how to avoid or detect] |
```

A risk without a probability and a mitigation is a worry, not a risk entry.

## Schemas

### prd

For `/add.plan` (framework mode; creates `docs/prd/PRD[NNNN]-<slug>.md`). PRDs drive the framework's own evolution and are consumed by `/add.build`.

- **Frontmatter:** `id: PRD[NNNN]`, `type: prd`, `created:`, `updated:`, `related: []`
- **Status header (immediately after H1):** `Status:` (`draft` | `approved` | `implemented` | `superseded`), `Type:` (`command` | `skill` | `script` | `workflow` | `architecture`), `Created:`, `Author:`
- **Sections (ordered):** TL;DR · Context · Problem · Proposal · Scope (Includes / Does NOT Include) · Validated Decisions · Accepted Trade-offs · Risks and Mitigations · Ecosystem Impact · References · Next Steps · PRD Changelog
- **Depth floor:**
  - **Context** — the state of the framework that motivated this PRD. Cite existing artefacts, prior PRDs, or constraints.
  - **Problem** — what is broken / missing / contradictory today, with concrete pointers (file:line, command/skill names, observable failure modes).
  - **Proposal** — the recommended solution at a level concrete enough that `/add.build` can execute it. Not implementation code, but enough structural detail that the build phase has no ambiguity.
  - **Scope** — explicit Includes and Does NOT Include lists per Scope Notation in `references/new-feature.md`. Out-of-scope items must list a one-line reason.
  - **Validated Decisions** — table `Question | Decision | Rationale`. Every load-bearing choice from the planning consultation lands here.
  - **Accepted Trade-offs** — per Trade-off Notation above. Both columns mandatory.
  - **Risks and Mitigations** — per Risk & Mitigation Notation above.
  - **Ecosystem Impact** — table `Component | Necessary action`. Lists every command, skill, script, doc, or pipeline component the PRD touches, plus those it explicitly leaves untouched (`No change` is a valid action).
  - **References** — `{{skill:}}` and `{{doc:}}` links to authoritative artefacts and prior PRDs.
  - **Next Steps** — the `/add.build PRD[NNNN]-<slug>` invocation that executes the PRD, plus the `/add.plan PRD[NNNN]` invocation that revises it.
  - **PRD Changelog** — table `Date | Change`. Every revision logs an entry. Initial creation is the first entry.
- **Compression:** Validated Decisions = table. Trade-offs = table. Risks = table. Ecosystem Impact = table. Scope = bullets. References = `{{skill:}}` / `{{doc:}}` / URL list.
- **Hard bans:** marketing language; aspirational verbs ("might", "could", "we plan to"); decisions without rationale; risks without mitigations; trade-offs with only the "gain" column.
- **Avoid unless load-bearing:** prose paragraphs in Validated Decisions or Ecosystem Impact (tables suffice for both); long historical narrative (link to prior PRD instead).

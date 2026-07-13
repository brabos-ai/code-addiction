---
name: add-qa-migration
description: Use when a project already runs a QA/test flow (Cypress, Jest, Vitest, custom) and wants to adopt the code-addiction QA pipeline instead of starting over — defines the autonomous dogfooding sequence (add.new → add.plan → add.build → add.review) and its checkpoints. Consumed by /add.qa-setup when migration is detected and confirmed.
metadata:
  category: pattern
  triggers: migrate qa, existing tests, cypress, jest, vitest, adopt qa pipeline, dogfood migration
---

# QA Migration

Domain layer that turns an existing QA/test setup into the code-addiction QA pipeline by **dogfooding the framework's own feature chain** autonomously.

**Core principle:** The migration is a real feature. Capture it via `add.new`, then run it through `add.plan → add.build → add.review` — no bespoke migration mechanism.

> **Mechanism reuse:** This skill defines WHAT to dispatch and WHERE to pause. The HOW (dispatch template, decision log, review gates, compliance gate) comes entirely from `{{skill:add-subagent-driven-development/SKILL.md}}`. Do NOT re-invent dispatch machinery here.

---

## When to Use

- `/add.qa-setup` detected an existing QA/test flow (Cypress, Jest, Vitest, Playwright-standalone, or a custom runner) on a project's **first** setup run and the user **confirmed** they want to migrate/adapt it.
- The goal is to adopt code-addiction's dual-axis QA model over an existing suite, preserving intent, not to author QA from a blank slate.

## When NOT to Use

- **No existing QA tooling** — nothing to migrate; run the normal `/add.qa-setup` scaffolding path.
- **User declined migration** — never migrate silently; confirmation is mandatory upstream.
- **Re-run of `add.qa-setup`** (config.json already present) — migration detection is first-run only; skip.
- **A single trivial test file** — dogfooding overhead outweighs benefit; decline migration (`MIGRATE = false`) and let normal scaffolding handle it.

---

## Migration Sequence

Dispatch each command autonomously via the platform's subagent mechanism, following the `add-subagent-driven-development` template (ROLE, TASK_DOCUMENTS, DECISION LOG, SKILLS, COORDINATOR NOTES, TASK, REPORT FORMAT). Autonomy is directed through the **dispatch prompt** — never by editing the dispatched command's source.

| Order | Command | Purpose | Autonomy directive in dispatch prompt |
|-------|---------|---------|----------------------------------------|
| 1 | `/add.new` | Capture the migration itself as a real feature. `about.md` describes the migration: "migrate the existing QA flow (`<detected tooling>`) to the code-addiction QA pipeline." | Decide feature framing autonomously; create the feature (branch is recorded in `branch:`; created at the add.build step) |
| 2 | `/add.plan` | Plan the adaptation: which existing specs map to which screens/scenarios, what is re-authored, what is dropped | Decide mapping autonomously; do not pause for routine choices |
| 3 | `/add.build` | Execute the migration plan (adapt/re-author specs against `qa-project` conventions + `screens.json`) | Implement autonomously; **pause only at critical checkpoints** (below) |
| 4 | `/add.review` | Validate the migrated pipeline against the plan | Review autonomously; report findings for user review before merge |

Work happens on the branch `add.build`'s setup creates — no worktree (migration runs in-place).

---

## Checkpoints (pause points)

The dispatch prompt directs each subagent to decide autonomously **except** at these critical points, where it MUST pause and surface the decision to the user:

- **Installs** — adding/removing a dependency or runner.
- **File overwrites** — replacing an existing user file (an existing spec, config, or fixture) rather than creating a new one.

Everything between checkpoints (mappings, spec adaptation, naming, selector strategy) is decided autonomously and recorded in the Decision Log.

---

## Traceability & Isolation

- The migration is a first-class feature: standard `about.md` / `plan.md` / review artefacts exist, so the work is auditable like any other feature.
- All migration work stays on the migration branch (created at `add.build`); the **Decision Log** (from `add-subagent-driven-development`) records every autonomous decision for the user to review **before merge**.
- Never merge the migration branch autonomously — hand it back for review.

---

## Validation Checklist

Before reporting the migration complete:

- [ ] Migration confirmed by the user before any dispatch (never silent)
- [ ] `add.new` captured the migration as a real feature (`about.md` describes the migration)
- [ ] Full chain ran: `add.new → add.plan → add.build → add.review`
- [ ] Autonomy directed via dispatch prompts only — no dispatched command's source was edited
- [ ] Paused at every install and every file overwrite
- [ ] Decision Log records each autonomous decision
- [ ] Work isolated on the migration branch; branch NOT merged autonomously
- [ ] Existing specs mapped/adapted, not blindly discarded

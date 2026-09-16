# Plan: Diagnose Timestamp Naming — one filename `/add.diagnose` agrees with itself about

> **Status:** implemented
> **Layers:** product
> **Type:** command
> **Created:** 2026-09-14

---

## Context

`/add.diagnose` tells the user its report will be saved at `docs/diagnose/[NNNN]-[slug].md` (STEP 7.1)
and then actually writes `docs/diagnose/<slug>.md` (STEP 8.3) — matching the schema authority
(`add-doc-schemas/references/review.md:44`), not its own promise. Neither of the command's two
disagreeing forms matches the timestamp convention (`YYYY-MM-DDTHHMMSS-<slug>.md`) already used by
`docs/brainstorming/` and `docs/plans/` for the same kind of local, possibly-repeated document. Found
by the same write/read-mismatch sweep that produced `2026-09-14T215223-PLAN--remove-owner-product-onboarding.md`.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` | Why this sits alongside two unrelated fixes found by the same sweep |
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-002-diagnose-timestamp-naming.md` | The three alternatives weighed (numbered form / bare-slug form / timestamp form) and why the timestamp form was chosen |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)

## Problem

1. **`add.diagnose.md` contradicts itself.** STEP 7.1 promises one filename shape; STEP 8.3 writes another. A user told one path gets the other.
2. **Neither existing form matches the framework's own convention.** `docs/brainstorming/` and `docs/plans/` both already use `YYYY-MM-DDTHHMMSS-<slug>.md`; `add.diagnose.md` uses neither that nor a stable form of its own.

## Proposal

Adopt the framework's `YYYY-MM-DDTHHMMSS-<slug>.md` convention for `docs/diagnose/` reports, in the
step that promises the filename and the step that writes it, plus the schema authority both cite.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/commands/add.diagnose.md`: reword STEP 7.1's promised path to
  `docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md`; change STEP 8.3's write target to the same form. Ref:
  design doc, Scope → Includes.
  - `framwork/.codeadd/skills/add-doc-schemas/references/review.md`: update the `diagnose-report`
    schema's stated destination (L44) to match.
  - **Produces:** `docs/diagnose/` reports are written at `YYYY-MM-DDTHHMMSS-<slug>.md`, consistent
    across the command and its schema authority.

### Does NOT Include (important!)

- The `id: DIAG-<slug>` frontmatter convention (`review.md:46`) — unrelated to the filename, content identity not path identity.
- Any change to the report's sections, depth floor, or the rest of the `diagnose-report` schema.
- Any change to STEP 7's yes/no gate for whether the report is persisted at all.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Which of the two existing disagreeing forms wins? | Neither — adopt the framework's timestamp convention instead | User's explicit instruction to "keep the standard adopted across the whole framework"; removes a silent-overwrite risk the bare-slug form carried — design doc, Proposed Solution |
| Does the `DIAG-<slug>` frontmatter ID change? | No | It identifies content, not the file path — the two are already independent in every other timestamped doc type — design doc, Key Decision 2 |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A user's own script parses `docs/diagnose/<slug>.md` | Low | Tracked by git but never referenced by any other framework artefact — grep-confirmed exhaustive during the design's review; no migration owed to a format that was never a stable contract |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | F1 — STEP 7.1 wording, STEP 8.3 write target |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | product | modify | F1 — `diagnose-report` destination line (L44) |

Grep-confirmed during design review: no other product command, skill, script or `cli/tests/` file names `docs/diagnose`.

---

## Validation Matrix (spec for the build phase)

### L1 — Unit / build-side (RED → GREEN)

1. `grep -n "docs/diagnose" framwork/.codeadd/commands/add.diagnose.md` shows the same `YYYY-MM-DDTHHMMSS-<slug>.md` form at both STEP 7.1 and STEP 8.3. *RED today: STEP 7.1 shows `[NNNN]-[slug].md`, STEP 8.3 shows `<slug>.md` — two different forms.*
2. `grep -n "docs/diagnose" framwork/.codeadd/skills/add-doc-schemas/references/review.md` shows the timestamp form. *RED today: shows `<slug>.md`.*
3. `node scripts/build.js` exits 0, no new warning.

### L2 — Behavioural acceptance

1. A cold reader of `add.diagnose.md` alone (no other context) states the same destination path reading STEP 7.1 as reading STEP 8.3.

**RED expectations against the current tree:** L1's two assertions fail today (self-contradiction). **GREEN = both levels pass after F1.**

---

## Execution Order

F1 only. One F-block, both edits, because they are the same contract split across two files.

## Reviewer Handoff

- **What changed** — `add.diagnose.md` (2 lines) and `add-doc-schemas/references/review.md` (1 line), both F1.
- **Which validation levels cover it** — L1 (2 assertions), L2 (1 assertion).
- **Any decision deferred or altered** — none; this plan matches the design doc's chosen alternative exactly.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — confirm L1's greps were run against the pre-F1 tree.
2. A third file naming `docs/diagnose` that the design's grep sweep and this plan's Impact table both missed — re-run the grep across `framwork/.codeadd` and `cli/tests` rather than trusting the "grep-confirmed exhaustive" claim at face value.

## References

- Design set: `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` (umbrella), `docs/brainstorming/2026-09-14T211914-write-read-mismatches-002-diagnose-timestamp-naming.md` (this subtopic)

---

## Next Steps

/add-framework--build diagnose-timestamp-naming

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | Initial creation |
| 2026-09-14 | Implemented on branch `diagnose-timestamp-naming`, commits c8793eb..bf8b39f (F1) and fdc4a95 (STEP 7 review findings applied). Changelog: `docs/changelog/2026-09-14T231249-fix-diagnose-timestamp-naming.md` |

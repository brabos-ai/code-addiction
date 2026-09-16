# Brainstorm: Command Write/Read Mismatches — Diagnose Timestamp Naming

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** workflow
> **Umbrella:** `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md`
> **Layer:** every affected artefact is `product`. Every F-block is `[product]`.

Subtopic 2 of 3. Covers umbrella finding 2.

## Discovery

Read during refinement, beyond the umbrella's own discovery set:

- **`add.diagnose.md:272`** (STEP 7.1) asks the user: *"Do you want to persist this as a report
  (`docs/diagnose/[NNNN]-[slug].md`) that the next command can consume?"*
- **`add.diagnose.md:297`** (STEP 8.3) actually writes: *"Load `add-doc-schemas` schema
  `diagnose-report`. Write `docs/diagnose/<slug>.md` per schema (extractive only)."* — no number.
- **`add-doc-schemas/references/review.md:44`**, the schema authority for `diagnose-report`, states
  the destination as `docs/diagnose/<slug>.md` — matching what STEP 8.3 actually does, not what
  STEP 7.1 promises. So STEP 7.1's text is the sole outlier, not a second legitimate convention.
- The **frontmatter ID** the same schema assigns is `id: DIAG-<slug>` (`review.md:46`) — a content
  identity, unrelated to the filename. Nothing here changes.
- **No other file references `docs/diagnose`.** Confirmed by grepping the full `framwork/.codeadd` tree
  and `cli/tests/` — only `add.diagnose.md` and `add-doc-schemas/references/review.md` name the path.
  No test pins the current filename shape.
- **The framework's own timestamp convention**, already used by `docs/brainstorming/` and
  `docs/plans/`: `YYYY-MM-DDTHHMMSS-<slug>.md`, local time, no separators inside `HHMMSS` (Windows
  forbids `:` in a filename), lexicographic sort equals chronological sort.

## Problem / Opportunity

Already stated in the umbrella's finding 2. In short: `add.diagnose.md` tells the user one filename
shape and writes another, and neither of its two disagreeing forms matches the timestamp convention
the rest of the framework already standardized on for exactly this kind of local, gitignored,
possibly-repeated report.

## Proposed Solution

Three alternatives were weighed with the user directly.

**A. Adopt STEP 7.1's numbered form (`[NNNN]-<slug>.md`), fix STEP 8.3 to match.** Rejected. This would
introduce a sequential-ID allocation this command has never needed and no other doc-writing command in
the diagnose flow uses; it also breaks from the schema authority, which would then need its own edit
anyway.

**B. Adopt STEP 8.3's current form (`<slug>.md`), fix only STEP 7.1's wording.** Rejected. Cheapest
edit, but `docs/diagnose/` reports are, like brainstorms, local investigative documents that can
legitimately repeat on the same slug (re-diagnosing the same symptom later); a bare slug collides
silently on a second run, overwriting the first report with no warning.

**C. Adopt the framework's `YYYY-MM-DDTHHMMSS-<slug>.md` convention.** Chosen, at the user's explicit
request to "keep the standard adopted across the whole framework." Resolves the self-disagreement,
matches `docs/brainstorming/` and `docs/plans/` exactly, and removes the silent-overwrite risk option B
would have kept.

## Type of Artefact

Workflow (a naming-convention correction). No new file, no new command.

## Scope

### Includes

- `add.diagnose.md` STEP 7.1: reword the promised path to
  `docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md`.
- `add.diagnose.md` STEP 8.3: change the write target to the same timestamp form.
- `add-doc-schemas/references/review.md:44`: update the `diagnose-report` schema's stated destination
  to match.

### Does NOT Include

- The `id: DIAG-<slug>` frontmatter convention (`review.md:46`) — unrelated to the filename, unchanged.
- Any change to the report's sections, depth floor, or the rest of the `diagnose-report` schema.
- Any change to how or whether the report is offered (STEP 7's yes/no gate is unaffected).

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | Adopt the framework-wide timestamp convention, not either existing form | User's explicit instruction; also removes a silent-overwrite risk the bare-slug form carried | ✅ |
| 2 | The `DIAG-<slug>` frontmatter ID is untouched | It identifies content, not the file path; the two are already independent in every other timestamped doc type | ✅ |

## Ecosystem Impact

| Component | Called by (verified) | Action |
|---|---|---|
| `framwork/.codeadd/commands/add.diagnose.md` | Entry point via `/add.diagnose` | Edit STEP 7.1 wording and STEP 8.3 write target |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | Schema authority, cited by `add.diagnose.md` STEP 8.3 | Edit the `diagnose-report` destination line |

Grep-confirmed: no other product command, skill, script or `cli/tests/` file names `docs/diagnose`.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| One filename the command's own text agrees with itself about | Nothing — the change only narrows a contradiction that already existed |
| Same sort and collision-avoidance behaviour `docs/brainstorming/` already has | — |

| Risk | Probability | Mitigation |
|---|---|---|
| A user's own script parses `docs/diagnose/<slug>.md` | Low | This path is tracked by git (not listed in `.gitignore`, unlike `docs/plans/` and `docs/brainstorming/`), but it is local investigative output never referenced by any other framework artefact; no migration is owed to a file format that was never a stable contract |

## Next Steps

`/add-framework--plan write/read mismatches — diagnose timestamp naming`

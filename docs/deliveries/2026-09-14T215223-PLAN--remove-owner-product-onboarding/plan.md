# Plan: Remove Owner/Product Onboarding — delete `/add.init` and every reference to it

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-09-14

---

## Context

A framework-wide sweep of document write/read pairs (dispatched from `/add-framework--brainstorm`)
found that `/add.init` writes `docs/product/owner.md` and `docs/product/product.md` to paths and in a
format that four separate readers (`add.md`, `add.plan.md`, `status.sh`, `init.sh`) never match. 13
product commands carry an instruction to adapt communication style to the owner's profile via
`status.sh`; because the read has never once succeeded, that adaptation has never once fired. The
owner asked to remove the feature entirely rather than repair four broken readers for a feature judged
to serve no real purpose.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` | Why this sits alongside two unrelated fixes found by the same sweep, and why they ship as three independent plans |
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-001-remove-owner-profile.md` | The full alternatives analysis (fix vs. partial removal vs. full removal), every affected file with its exact line numbers, and the graph queries proving `add-product-discovery`'s only caller is `add.init` |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning, including no dangling `uses:` target (CLAUDE.md, Pipeline; `add-framework-product-layer` skill)
- Every deletion is a byte-removal of the exact lines identified in the design doc — no paraphrase, no "while I'm in there" cleanup of surrounding text (design doc `2026-09-14T211914-write-read-mismatches-001-remove-owner-profile.md`, Discovery)

## Problem

1. **Four readers disagree with the one writer.** `add.md` STEP 1 and `add.plan.md` STEP 1 read `docs/owner.md`; `add.init` writes `docs/product/owner.md`. `status.sh` and `init.sh` read the same wrong path AND grep for plain-text lines (`^Nome:`, `^Nivel:`, `^Idioma:`) the schema-based writer never produces.
2. **13 commands carry a dead instruction.** Each has a top-of-file line telling the assistant to adapt detail level to the owner's profile via `status.sh` — silently a no-op on every run of every one of them.
3. **A skill and two schemas exist for one caller.** `add-product-discovery` has exactly one dependant (`add.init`, graph-confirmed); the `owner` and `product` schemas in `add-doc-schemas/references/product.md` are written only by the same command.

## Proposal

Delete `/add.init`, both doc schemas it writes against, the `add-product-discovery` skill, and every
reference to any of them — in that order, references first. Removing references before the target
keeps `node scripts/build.js`'s dangling-`uses:`-target gate green at every step; deleting the target
first would fail the very next build.

## Scope

### Includes

- **F1** [product] — Remove every reference to `/add.init`, `owner.md`, `product.md` or
  `add-product-discovery` across the product layer, **before** anything is deleted. Ref:
  `2026-09-14T211914-write-read-mismatches-001-remove-owner-profile.md`, Scope → Includes and
  Ecosystem Impact table.
  - `framwork/.codeadd/commands/add.md` — remove the top-of-file `> **OWNER:**` line (L20, structurally
    separate from STEP 1); remove STEP 1 ("Check Onboarding"), renumber; delete the Suggestion Table
    row `| No docs/owner.md | /add.init | Project onboarding |` (L168); delete `- command: /add.init`
    from the `<!-- uses: -->` block (L11).
  - `framwork/.codeadd/commands/add.plan.md` — remove the top-of-file `> **OWNER:**` line (L42,
    structurally separate from STEP 1); remove STEP 1 ("Load Founder Profile"), renumber.
  - `framwork/.codeadd/commands/add.brainstorm.md` — remove the top-of-file `> **OWNER:**` line; remove
    `OWNER (name + level), ` from L79's parse list; remove `Owner profile, ` from L94's mental-inventory
    list; delete L108 (`If OWNER not found: inform user to run /founder, …` — `/founder` names a
    command that does not exist anywhere in this framework, a second defect this same edit removes);
    remove `Adapt depth to owner level. ` from L182.
  - `framwork/.codeadd/commands/add.diagnose.md` — remove the top-of-file `> **OWNER:**` line; remove
    `OWNER (name + level), ` from L78's parse list; delete L86 (`If OWNER not found → inform user to
    run /add.init, …`); delete `- command: /add.init` from the `<!-- uses: -->` block (L15).
  - `framwork/.codeadd/commands/add.qa-setup.md` — remove `OWNER (name + level), ` from L187's parse
    list (no top-of-file line exists here to remove).
  - `framwork/.codeadd/commands/add.audit.md`, `add.build.md`, `add.hotfix.md`, `add.new.md`,
    `add.plan-to-ready.md`, `add.review.md`, `add.ux.md`, `add.wiki.md` — remove the top-of-file
    `> **OWNER:** Adapt detail level to owner profile from status.sh …` line (one line each; no body
    references beyond it, confirmed by the design doc's grep sweep).
  - `framwork/.codeadd/scripts/status.sh` — remove the self-contained `OUTPUT: OWNER` block, lines
    106–125.
  - `framwork/.codeadd/scripts/init.sh` — remove the self-contained `OWNER` block, lines 19–39.
  - `framwork/.codeadd/scripts/tests/status.bats` (L97, L105) and `tests/init.bats` (L19, L25, L33) —
    update or remove the assertions on the current `OWNER:` output line.
  - `framwork/.codeadd/skills/add-ecosystem/SKILL.md` — remove `add.init`'s own row and every
    consumer-list mention of it (lines 117, 230, 240, 265, 298); on L265, also drop the "— owner
    profile + ecosystem signals for every command" framing from `status.sh`'s description, separate
    from the consumer-list mention on the same line; remove the `- mention: add-product-discovery`
    edge (L35) and its catalog row (L157).
  - `framwork/.codeadd/skills/add-health-check/SKILL.md` — L82, stop citing `owner.md` for report
    language.
  - `framwork/.codeadd/skills/add-project-scaffolding/SKILL.md` — L81, drop `owner.md` from the example
    directory tree.
  - `framwork/.codeadd/skills/add-feature-specification/SKILL.md` — remove the `- mention:
    add-product-discovery` edge (L11) and the "product blueprint / founder discovery" bullet (L29).
  - `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` — two separate edits: remove `- skill:
    add-doc-schemas/references/product.md` from its own `<!-- uses: -->` block (L29) — the only
    declaration of that target anywhere in the tree, and F2 deletes the target file; and update the
    Language table's policy row (L97) to stop citing `owner.md`: "Match the language the user writes
    in; default to English."
  - **Produces:** every reference to `/add.init`, `owner.md`, `product.md`, `add-product-discovery`
    outside the five artefacts F2 deletes is gone from the tree.
- **F2** [product] — Delete the now-unreferenced artefacts. Ref: same design doc, Scope → Includes.
  - Delete `framwork/.codeadd/commands/add.init.md`.
  - Delete `framwork/.codeadd/skills/add-product-discovery/SKILL.md`.
  - Delete `framwork/.codeadd/skills/add-doc-schemas/references/product.md`; remove its row from the
    schema index table in `add-doc-schemas/SKILL.md` (the same file F1 edits at L97 — a different
    table, a different line).
  - Remove the `add.init` entry (L76) and the `add-product-discovery` entry (L107) from
    `framwork/provider-map.json`.
  - **Consumes:** every reference removed (F1) — deleting these five artefacts before F1 lands would
    fail `node scripts/build.js`'s dangling-`uses:`-target gate.
- **F3** [product] — Regenerate and verify. Ref: same design doc, Risk mitigation on inventory drift.
  - Run `node scripts/inventory.js` so `CLAUDE.md`'s generated inventory block drops `add.init` and
    `add-product-discovery` from its counts. Never hand-edited.
  - Run `node scripts/build.js` and confirm exit 0, no new warning, no dangling `uses:` target.
  - Re-grep `framwork/.codeadd` for `add\.init`, `add-product-discovery`, `owner\.md` (outside
    `docs/product/owner.md`'s own removed schema reference) and confirm zero remaining hits.
  - **Consumes:** F1 and F2 complete.

### Does NOT Include (important!)

- Any replacement personalization mechanism. Communication style continues to follow each command's own `> **LANG:**` line; nothing new is added in its place.
- `docs/product/product.md`'s two readers (`add.new.md:76`, `add.brainstorm.md:93`) beyond the fact that their read will always find nothing from now on — both already handle "if it exists" as a no-op.
- `docs/prd/` or the `prd` doc schema (`add-doc-schemas/references/strategy.md`). Verified during this plan's own discovery: `prd` writes to `docs/prd/PRD[NNNN]-<slug>.md`, an unrelated directory in an unrelated schema category. A second-opinion pass raised this as a question; it does not apply.
- Any user project that already ran `/add.init` and has `docs/product/owner.md` on disk. That file is simply never read again by anything — the same as today, since nothing ever read it correctly.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Fix the four broken readers, or remove the writer? | Remove | User: the feature serves no real purpose; fixing four call sites for a feature nobody wants is more work than deleting it — design doc, Proposed Solution |
| Does `docs/product/product.md` survive, since it IS read correctly? | No, removed with the rest | `/add.init` is its only writer; both readers already treat it as optional — design doc, Key Decision 2 |
| Is there a replacement personalization mechanism? | No | Out of scope for a removal — design doc, Scope → Does NOT Include |
| Order of F1 vs F2 | References removed first, deletion second | `node scripts/build.js` gates on a dangling `uses:` target; deleting the target first fails the very next build |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A reference is missed and a stale mention survives | Medium | F1's file list was built from `node scripts/graph.js impact/neighbors` plus a full-tree grep, cross-checked by an independent second pass that found 2 more machine-parsed `uses:` edges (`add.md:11`, `add.diagnose.md:15`) after the design's own review — both are in F1's list above. F3 re-greps after F1+F2 land |
| `CLAUDE.md`'s generated inventory block still lists the deleted artefacts | Low | F3 regenerates it via `node scripts/inventory.js`, never by hand |
| A hand-edit to `add-doc-schemas/SKILL.md` in F1 collides with the schema-index-row removal in F2 | Low | The two edits are different lines in different tables (Language table vs. schema index); F1 lands first, F2's edit applies against F1's committed result |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/commands/add.init.md` | product | remove | F2 — deleted, only 2 soft `HANDS_OFF_TO` callers (`add`, `add.diagnose`), both edited in F1 |
| `framwork/.codeadd/skills/add-product-discovery/SKILL.md` | product | remove | F2 — orphaned the moment `add.init` is gone |
| `framwork/.codeadd/skills/add-doc-schemas/references/product.md` | product | remove | F2 — the `owner`/`product` schemas, written only by `add.init` |
| `framwork/.codeadd/commands/add.md` | product | modify | F1 — L20 `OWNER:` banner, STEP 1, L168 table row, L11 `uses:` edge |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F1 — L42 `OWNER:` banner, STEP 1 removed |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F1 — header line + L79/94/108/182 |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | F1 — header line + L78/86 + L15 `uses:` edge |
| `framwork/.codeadd/commands/add.qa-setup.md` | product | modify | F1 — L187 |
| `framwork/.codeadd/commands/add.audit.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.ux.md` | product | modify | F1 — header line |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | F1 — header line |
| `framwork/.codeadd/scripts/status.sh` | product | modify | F1 — remove L106–125 |
| `framwork/.codeadd/scripts/init.sh` | product | modify | F1 — remove L19–39 |
| `framwork/.codeadd/scripts/tests/status.bats` | product | modify | F1 — update assertions at L97, L105 |
| `framwork/.codeadd/scripts/tests/init.bats` | product | modify | F1 — update assertions at L19, L25, L33 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | product | modify | F1 — 7 lines (117, 230, 240, 265 row + framing, 298, 35, 157) |
| `framwork/.codeadd/skills/add-health-check/SKILL.md` | product | modify | F1 — L82 |
| `framwork/.codeadd/skills/add-project-scaffolding/SKILL.md` | product | modify | F1 — L81 |
| `framwork/.codeadd/skills/add-feature-specification/SKILL.md` | product | modify | F1 — L11, L29 |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | F1 — L29 `uses:` edge, L97 Language row; then F2 — schema index row |
| `framwork/provider-map.json` | product | modify | F2 — 2 entries removed |
| `CLAUDE.md` | internal | modify (generated) | F3 — `node scripts/inventory.js`, never by hand |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below fails against the current tree; that failure is the proof.

### L1 — Unit / build-side (RED → GREEN)

1. `grep -rn "add\.init" framwork/.codeadd` returns zero matches. *RED today: 15+ matches across 13 commands, 3 skills and the provider-map. Scoped to `framwork/.codeadd` only — `cli/tests/inventory.test.js` permanently contains 5 literal occurrences of the string `add.init` as synthetic sort-order fixture data unrelated to the real command, so a `cli/tests`-wide grep can never return zero; that file's correctness is covered separately by L2.*
2. `grep -rn "add-product-discovery" framwork/.codeadd` returns zero matches. *RED today: 4 matches (add.init.md, add-ecosystem, add-feature-specification, provider-map.json).*
3. `grep -rniE "docs/owner\.md|docs/product/owner\.md|Nivel:|Idioma:" framwork/.codeadd/commands framwork/.codeadd/scripts` returns zero matches. *RED today: matches in `add.md`, `add.plan.md`, `status.sh`, `init.sh`.*
4. `node scripts/build.js` exits 0, no new warning, no dangling `uses:` target. *RED if run between F1 and F2 in the wrong order (target deleted before references) — this is why F1 precedes F2.*

### L2 — Integration

1. `cli/tests/inventory.test.js` passes against the post-F3 tree — its counts are disk-derived, so this is the proof the generator ran and matches. *RED before F3: the generated block still names the deleted artefacts.*

### L3 — Behavioural acceptance

1. Reading `/add.md` shows no top-of-file `> **OWNER:**` line and no onboarding-check step; its
   Suggestion Table — `## STEP 5: Smart Suggestion` today, becoming `## STEP 4` once STEP 1 is removed
   and STEP 2–5 renumber down by one — carries no `/add.init` row.
2. Reading `/add.plan.md`'s STEP 1 (post-renumber) shows no founder-profile read.
3. `add-product-discovery/SKILL.md` and `add-doc-schemas/references/product.md` do not exist on disk.

**RED expectations against the current tree:** all of L1's four assertions and L2's one assertion fail today. **GREEN = all levels pass after F1–F3.**

---

## Execution Order

F1 → F2 → F3.

- **F1 first** because `node scripts/build.js` refuses a dangling `uses:` target — deleting `add.init.md` while `add.md` or `add.diagnose.md` still declare `- command: /add.init` fails the very next build.
- **F1 alone leaves the repo in a working state.** Every command still runs; they simply no longer mention `/add.init` or read the owner profile. This is a safe stopping point if the build must pause.
- **F2 leaves the repo in a working state** once F1 has landed — nothing left in the tree references what F2 removes.
- **F3 is validation, not a decision.** It must run after F2, and its failure means an earlier F-block missed something — not a reason to alter scope.

## Reviewer Handoff

- **What changed** — files touched, with the F-block id (F1/F2/F3), per the Impact table above.
- **Which validation levels cover it**, and their pass state — L1's four assertions, L2's one, L3's three.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — confirm L1's greps were actually run against the pre-F1 tree, not assumed from the design doc's own earlier count.
2. A reference the design doc's own grep sweep missed a third time — the sweep already missed once (13-command grep) and was corrected twice (once by `@plan-review-agent`, once by an independent second-opinion pass); a reviewer should re-run L1's greps with a broader pattern than any single pass used, not trust the count in this plan.

## References

- Design set: `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` (umbrella), `docs/brainstorming/2026-09-14T211914-write-read-mismatches-001-remove-owner-profile.md` (this subtopic)

---

## Next Steps

/add-framework--build remove-owner-product-onboarding

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | Initial creation |

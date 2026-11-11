# Brainstorm: Command Write/Read Mismatches — Remove Owner/Product Onboarding

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** workflow
> **Umbrella:** `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md`
> **Layer:** every affected artefact is `product`. Every F-block is `[product]`.

Subtopic 1 of 3. Covers umbrella finding 1.

## Discovery

Read during refinement, beyond the umbrella's own discovery set — every reference confirmed either by
`node scripts/graph.js impact` / `neighbors`, or by a grep sweep of the whole `framwork/.codeadd` tree
and `cli/tests/`:

- **`add.init.md`** (206 lines) — the only writer of `docs/product/owner.md` (schema `owner`:
  frontmatter `id: OWNER`, sections Founder/Skills/Constraints/Goals) and, optionally,
  `docs/product/product.md` (schema `product`). Graph `neighbors`: two inbound `HANDS_OFF_TO` edges
  (`add`, `add.diagnose` — soft suggestions, not hard dependencies), five outbound edges (`add.new`,
  `status.sh`, `add-doc-schemas`, `add-final-report`, `add-product-discovery`).
- **Four broken readers**, none matching what `add.init` actually writes:
  - `add.md` STEP 1 and `add.plan.md` STEP 1 both `Read docs/owner.md` — missing the `product/`
    segment `add.init` actually writes to.
  - `status.sh` lines 106–125 and `init.sh` lines 19–39 both read `docs/owner.md` (same wrong path)
    **and** grep for `^Nome:`, `^Nivel:`, `^Idioma:` — plain-text lines `add.init`'s schema-based
    writer never produces, even at the right path. `init.sh` is graph-confirmed live: run by `add.new`
    and `add-feature-discovery`, so this is not dead code — it runs on every new feature and always
    falls through to its `unknown|intermediate|en-us` default.
- **`add-product-discovery`** — graph `impact --depth 1` returns exactly one dependant: `add.init`. No
  other command or skill uses it; it becomes an orphan the moment `add.init` is deleted.
- **13 commands** (grep pattern `OWNER:.*owner profile from status\.sh`) carry a top-of-file line
  telling the assistant to adapt detail level via `status.sh`'s owner read: `add.md`, `add.audit.md`,
  `add.brainstorm.md`, `add.build.md`, `add.diagnose.md`, `add.hotfix.md`, `add.init.md` (deleted with
  this subtopic), `add.new.md`, `add.plan.md`, `add.plan-to-ready.md`, `add.review.md`, `add.ux.md`,
  `add.wiki.md`.
- ⛔ **That grep pattern only catches the top-of-file blockquote — `@plan-review-agent` caught seven
  more live references it missed, in command bodies and skill tables.** Recorded here so a later
  validation pass does not reuse the same narrow pattern as proof of completeness:
  - `add.brainstorm.md` L79 (`Parse output: OWNER (name + level), …`), L94 (`**Mental inventory:**
    Owner profile, …`), L108 (`If OWNER not found: inform user to run \`/founder\`, continue with
    intermediate defaults.` — `/founder` names a command that does not exist anywhere in this
    framework's inventory, a second, independent defect this deletion also removes), and L182
    (`Adapt depth to owner level. …`).
  - `add.diagnose.md` L78 (`Parse: OWNER (name + level), …`) and L86 (`If OWNER not found → inform
    user to run \`/add.init\`, …` — names the command this same subtopic deletes).
  - `add.qa-setup.md` L187 (`Parse: OWNER (name + level), …`) — this command carries **no** top-of-file
    line, so the original grep missed it entirely; it is a real consumer of `status.sh`'s OWNER field
    all the same.
  - `add.md` L168, outside STEP 1: a Suggestion Table row, `| No docs/owner.md | /add.init | Project
    onboarding |`.
  - `add-ecosystem/SKILL.md` L35 (`- mention: add-product-discovery`, a live `MENTIONS` edge per
    `graph.js neighbors`) and L157 (`add-product-discovery`'s own row in the skills catalog table) —
    both missed by the original five-line list, which only covered `add.init`'s own mentions.
  - `add-feature-specification/SKILL.md` — absent from the original inventory entirely. Carries
    `- mention: add-product-discovery` (L11, a live edge) and body text at L29, "For product blueprint
    / founder discovery (use `add-product-discovery` instead)" — guidance that would point a user at a
    deleted skill.
  - `add-doc-schemas/SKILL.md` L97, a second table separate from the schema index already listed: the
    Language convention table's own policy row, `Follow the \`language\` field in \`owner.md\` …
    default to English when … \`owner.md\` does not exist`. This is the framework's documented,
    cross-command language policy, and it still names the file this subtopic deletes.
  `add.pull-request.md` was checked against the same body-level pattern and confirmed to carry no
  reference of any kind — no action needed there.
- ⛔ **Two machine-parsed `<!-- uses: -->` edges to `/add.init`, found while cross-checking an
  independent second-opinion pass the user supplied after this document's own review.** `add.md:11` and
  `add.diagnose.md:15` each declare `- command: /add.init` in their `uses:` block — a real graph edge,
  not prose. `node scripts/build.js` gates on a dangling `uses:` target, so deleting `add.init.md`
  without removing these two lines fails the build outright, not silently. Grep-confirmed exhaustive:
  `- command: /add\.init` and `- mention: add-product-discovery` appear nowhere else in
  `framwork/.codeadd`.
- **The same pass raised a question that turned out not to apply.** Does `docs/prd/` (the `prd` doc
  type) get touched? Verified: `prd`'s schema (`add-doc-schemas/references/strategy.md`) writes to
  `docs/prd/PRD[NNNN]-<slug>.md` — an unrelated directory in an unrelated schema category (`strategy`,
  not `product`). Out of scope, confirmed by direct read.
- **`docs/product/product.md` is not broken the same way.** `add.new.md:76` and `add.brainstorm.md:93`
  both read it at its correct path, both treating it as optional context ("if it exists"). It works;
  it is removed only because its sole writer is going and the user decided against keeping a
  stand-alone writer for it (see Key Decisions).
- **Registry and documentation surface:** `provider-map.json` registers both `add.init` (line 76) and
  `add-product-discovery` (line 107). `add-ecosystem/SKILL.md` names `add.init` in five places (117,
  230, 240, 265, 298) including its row in the command table and its presence in `add-final-report`'s
  and `add-doc-schemas`'s consumer lists. `add-doc-schemas/SKILL.md`'s schema index carries
  `| product | references/product.md | owner, product |`. `add-health-check/SKILL.md:82` follows
  `owner.md` for report language. `add-project-scaffolding/SKILL.md:81` shows `owner.md` in an example
  directory tree.
- **Tests:** `cli/tests/inventory.test.js` is the only test file matching `add.init` or
  `add-product-discovery` — it exercises the generated `CLAUDE.md` inventory block, which is written by
  `node scripts/inventory.js` and derives its counts from disk, so no hand-edit is needed there; the
  plan's validation step re-runs the generator to confirm. `framwork/.codeadd/scripts/tests/status.bats`
  and `init.bats` assert the current (broken) `OWNER:` output line and need updating to stop expecting
  it.

## Problem / Opportunity

Already stated in full in the umbrella's finding 1. Restated here in one line for this subtopic's own
completeness: four readers (`add.md`, `add.plan.md`, `status.sh`, `init.sh`) each look for the owner
profile at a path `add.init` never writes to, and two of the four also expect a plain-text format
`add.init`'s schema-based writer never produces — so the "adapt to the owner's profile" instruction
carried by 13 commands has silently never fired, always falling back to `intermediate` / `en-us`.

## Proposed Solution

Three alternatives were weighed with the user directly.

**A. Fix the four readers to match what `add.init` actually writes.** Rejected. This keeps a whole
onboarding command, a schema, a skill and four separate broken-reader fixes alive in service of a
personalization feature the user said serves no real purpose. Fixing four call sites to finally make a
feature nobody wants work correctly is strictly more code than deleting it.

**B. Remove `owner.md` and its adaptation instruction; keep `product.md` and its writer.** Considered
directly, because `product.md` is the one part of this that actually works — `add.new.md` and
`add.brainstorm.md` both read it correctly. Rejected by the user: `add.init` is `product.md`'s only
writer, and standing up a smaller command just to keep one optional, already-degraded-gracefully
context source alive was judged not worth a second command. Both readers already treat it as
optional, so nothing breaks — they simply stop getting that context, the same as any other project
that never ran `/add.init`.

**C. Remove both `owner.md` and `product.md`, and `/add.init` itself.** Chosen. Deletes the command,
the two schemas, the orphaned `add-product-discovery` skill, and every reference across the product
layer, down to the last stale mention in a documentation skill.

## Type of Artefact

Workflow (a removal). No new file is created.

## Scope

### Includes

- Delete `framwork/.codeadd/commands/add.init.md`.
- Delete `framwork/.codeadd/skills/add-product-discovery/SKILL.md`.
- Delete `framwork/.codeadd/skills/add-doc-schemas/references/product.md` (the `owner` and `product`
  schema definitions), and remove its row from the schema index in
  `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`.
- Remove `add.md` STEP 1 ("Check Onboarding") and `add.plan.md` STEP 1 ("Load Founder Profile"),
  renumbering the steps that follow in each file.
- Remove the "OUTPUT: OWNER" block from `framwork/.codeadd/scripts/status.sh` (lines 106–125) and the
  equivalent block from `framwork/.codeadd/scripts/init.sh` (lines 19–39).
- Remove the top-of-file `> **OWNER:** Adapt detail level to owner profile from status.sh` line from
  the 12 surviving commands that carry it: `add.md`, `add.audit.md`, `add.brainstorm.md`,
  `add.build.md`, `add.diagnose.md`, `add.hotfix.md`, `add.new.md`, `add.plan.md`,
  `add.plan-to-ready.md`, `add.review.md`, `add.ux.md`, `add.wiki.md`.
- In `add.brainstorm.md`: drop `OWNER (name + level), ` from L79's parse list, drop `Owner profile, `
  from L94's mental-inventory list, delete L108 (`If OWNER not found: inform user to run \`/founder\`,
  …`) outright, and drop `Adapt depth to owner level. ` from L182.
- In `add.diagnose.md`: drop `OWNER (name + level), ` from L78's parse list and delete L86 (`If OWNER
  not found → inform user to run \`/add.init\`, …`) outright.
- In `add.qa-setup.md`: drop `OWNER (name + level), ` from L187's parse list.
- In `add.md`: delete the Suggestion Table row `| No docs/owner.md | /add.init | Project onboarding |`
  (L168) and the `- command: /add.init` line from the `<!-- uses: -->` block (L11), in addition to
  removing STEP 1.
- In `add.diagnose.md`: also delete the `- command: /add.init` line from the `<!-- uses: -->` block
  (L15).
- In `add-feature-specification/SKILL.md`: delete `- mention: add-product-discovery` from the `<!--
  uses: -->` block (L11) and delete the "For product blueprint / founder discovery" bullet (L29).
- In `add-doc-schemas/SKILL.md`: in addition to the schema-index row, update the Language table's
  policy row (L97) to stop citing `owner.md` — the language a command writes in already follows its
  own `> **LANG:**` line (detected from the conversation), so the row converges onto that existing
  convention rather than introducing a new one: "Match the language the user writes in; default to
  English."
- Update `framwork/.codeadd/scripts/tests/status.bats` and `tests/init.bats` to stop asserting the
  `OWNER:` output line.
- Remove `add.init` from `framwork/provider-map.json` (both its own entry and
  `add-product-discovery`'s).
- Update `add-ecosystem/SKILL.md`: drop `add.init`'s row and every consumer-list mention of it (117,
  230, 240, 265, 298), drop the "owner profile" framing from `status.sh`'s description, delete
  `add-product-discovery`'s `MENTIONS` edge at L35, and delete its own catalog row at L157.
- Update `add-health-check/SKILL.md:82` to stop citing `owner.md` for report language (fall back to the
  same language-detection-from-conversation every command's `> **LANG:**` line already does).
- Update `add-project-scaffolding/SKILL.md:81` to drop `owner.md` from its example directory tree.
- Re-run `node scripts/inventory.js` as part of this delivery's validation, so `CLAUDE.md`'s generated
  block reflects the deletions — never hand-edited.

### Does NOT Include

- Any replacement personalization mechanism. Communication style continues to follow each command's
  own `> **LANG:**` line and general voice rules; nothing new is added in its place.
- Any change to `add.new.md:76` or `add.brainstorm.md:93` beyond the fact that their `product.md` read
  will always find nothing from now on — both already handle that case (`"if it exists"`).

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | Remove, do not fix | Four broken readers in service of a feature the user said serves no real purpose | ✅ |
| 2 | `product.md` goes too, despite working correctly | Its only writer is `add.init`; both readers already treat it as optional; not worth a standalone replacement writer | ✅ |
| 3 | No replacement personalization mechanism | Out of scope for a removal; if wanted later, it is new work with its own brainstorm | ✅ |
| 4 | The Language table's `owner.md` citation is corrected to match existing practice, not treated as a new mechanism | Every command already carries its own `> **LANG:**` line detecting language from the conversation; the table's citation of a dead file was already inconsistent with that, independent of this removal | ✅ |

## Ecosystem Impact

| Component | Called by (verified) | Action |
|---|---|---|
| `framwork/.codeadd/commands/add.init.md` | `add`, `add.diagnose` (`HANDS_OFF_TO`, soft) | **Delete** |
| `framwork/.codeadd/skills/add-product-discovery/SKILL.md` | `add.init` only (`impact --depth 1`) | **Delete** — orphaned by the command's deletion |
| `framwork/.codeadd/skills/add-doc-schemas/references/product.md` | Schema index in `add-doc-schemas/SKILL.md`; written only by `add.init` | **Delete**, remove index row |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` (Language table, separate from the schema index above) | Cross-command language policy, cited implicitly by every command's `> **LANG:**` line | Update L97 to stop citing `owner.md`; converge on "match the user's language; default to English" |
| `framwork/.codeadd/commands/add.md` | Entry point, every user session | Remove STEP 1, renumber; delete the Suggestion Table row at L168 and the `<!-- uses: -->` edge at L11 |
| `framwork/.codeadd/commands/add.plan.md` | Core pipeline command | Remove STEP 1, renumber |
| `framwork/.codeadd/scripts/status.sh` | 23 commands/skills (`impact --depth 1`) | Remove OUTPUT: OWNER block only — script keeps every other output |
| `framwork/.codeadd/scripts/init.sh` | `add.new`, `add-feature-discovery` (`impact --depth 1`) | Remove OWNER block only |
| `framwork/.codeadd/scripts/tests/status.bats` | Tests `status.sh` | Update assertions |
| `framwork/.codeadd/scripts/tests/init.bats` | Tests `init.sh` | Update assertions |
| 12 commands carrying the `> **OWNER:**` line | — | Remove the one line each |
| `framwork/.codeadd/commands/add.brainstorm.md` | Core pipeline command | Remove STEP 1's `OWNER:` header line (counted above) plus 4 body references: L79, L94, L108, L182 |
| `framwork/.codeadd/commands/add.diagnose.md` | Core pipeline command | Remove STEP 1's `OWNER:` header line (counted above), 2 body references (L78, L86), and the `<!-- uses: -->` edge at L15 |
| `framwork/.codeadd/commands/add.qa-setup.md` | Setup-contract command | Remove 1 body reference: L187. No top-of-file line to remove — grep-confirmed absent |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Loaded by `add.md` STEP 0 as the ecosystem source of truth | Update 7 lines: 5 `add.init` mentions plus `add-product-discovery`'s edge (L35) and catalog row (L157) |
| `framwork/.codeadd/skills/add-feature-specification/SKILL.md` | Loaded wherever `about.md` is written | Remove the `add-product-discovery` mention edge (L11) and the "product blueprint" bullet (L29) |
| `framwork/.codeadd/skills/add-health-check/SKILL.md` | `/add-health-check` flow | Update 1 line |
| `framwork/.codeadd/skills/add-project-scaffolding/SKILL.md` | Scaffolding guidance | Update 1 line (example tree) |
| `framwork/provider-map.json` | Build registry for all 5 providers | Remove 2 entries |
| `CLAUDE.md` generated inventory block | — | Regenerated by `node scripts/inventory.js`, not hand-edited |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| No more silently-broken personalization instruction on 13 commands | The idea of adapting tone to an owner profile, if it is ever wanted, starts from zero |
| One fewer command, one fewer skill, one fewer schema pair to keep consistent | `docs/product/product.md`, which did work, loses its only writer |
| `status.sh` and `init.sh` both shrink and stop carrying dead-end logic | None identified beyond the above |

| Risk | Probability | Mitigation |
|---|---|---|
| A reference is missed and a stale mention of `add.init`/`owner.md` survives | Medium | `@plan-review-agent` already found and this document now lists 7 body-level references a first grep pass (matching only the top-of-file blockquote) missed; the plan's validation step should grep for the bare tokens `OWNER`, `owner.md`, `add.init` and `add-product-discovery` across `framwork/.codeadd`, not the narrower blockquote pattern, and confirm zero hits outside what this document's own history records as intentionally kept |
| A user who already ran `/add.init` in their own project has `docs/product/owner.md` on disk | Low | Out of scope for this repo's own removal — a user's existing file is simply never read again, same as today; no migration needed since nothing ever read it correctly |
| `cli/tests/inventory.test.js` has a hardcoded expectation tied to the current artefact count | Low | `CLAUDE.md`'s inventory block explicitly forbids hand-added counts; the generator derives from disk, so a passing re-run after deletion is the check |

## Next Steps

`/add-framework--plan write/read mismatches — remove owner/product onboarding`

# Plan: Final Report Shape — one closing shape for every command, mirrored per layer

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-09

---

## Context

Roadmap item **3.0** — "Lift the executive-summary shape out and make it the standard for every
command". The shape already exists once, inside
`.claude/skills/add-plan-authoring/SKILL.md` § "Completion — The Executive Summary", and is reachable
only by `/add-framework--plan`. Every other command invents its own closing.

No design doc. Decisions were taken in this planning session and are recorded inline under
**Validated Decisions**.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Never write a raw `.codeadd/` path. Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}` (CLAUDE.md, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build (CLAUDE.md, Pipeline)
- The inventory block is generated — `node scripts/inventory.js` writes it from disk. Do not
  hand-edit it, and do not add a count anywhere (CLAUDE.md, Product Layer)
- "numeric advisories (`<200 words`, etc.) are prohibited in any rule constraining agent output"
  (`framwork/.codeadd/skills/add-doc-schemas/SKILL.md`, Output Length Doctrine)
- No product artefact references `.claude/`, and no internal skill loads a product skill as a
  dependency. The two `add-final-report` files are siblings, not a source and a copy (user
  constraint, this session)
- "Prove an internal F-block stayed in its lane with an empty `git status --porcelain framwork/`"
  (`.claude/commands/add-framework--build.md`, Rules)

## Problem

1. **Twenty-one closings, twenty-one shapes** — 7 internal commands and 14 product commands that
   finish work each end differently. `add-framework--build` STEP 10 lists artefacts and rulings.
   `add.plan` STEP 14 lists feature ID and metrics. `add.brainstorm` STEP 6 is a handoff line.
   `add.done` and `add.diagnose` have no closing step at all. The user reads a different report
   every time and has to work out what actually shipped.
2. **The one good shape is locked to one command** — `add-plan-authoring`'s five blocks, its banned
   phrasing table and its self-check are written as plan-document rules, so no other command can
   reach them.
3. **Nothing says how the thing works** — every existing closing reports facts (paths, counts,
   verdicts) and none explains the mechanism the user just received. That is the question the user
   keeps having to ask.

## Proposal

Write the shape once **per layer**, as a small skill loaded at the last step of a command, and
rewrite every finishing command's closing step to use it.

Two files, deliberately. The product layer cannot reference `.claude/` because that directory is
never distributed, and the internal layer must not take a runtime dependency on the product source.
They are siblings with the same block list and different vocabulary — internal speaks F-block,
ledger and layer; product speaks feature ID, task and RF/RN.

Sequencing: internal first (no build, no provider distribution, cheapest to get wrong), then the
product skill and its consumers, then the two artefacts that must name both skills
(`building-commands`, `CLAUDE.md`) once both exist.

## Current State

| Artefact | Layer | Closing today | Dependants (`impact --depth 1`) |
|---|---|---|---|
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | owns the shape, § Completion | 2 |
| `.claude/skills/building-commands/SKILL.md` | internal | requires a "complete (inform user)" step, no shape | — |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | governs docs written to disk, not chat output | 22 |
| 7 `.claude/commands/*.md` | internal | 6 have a closing step, `add-framework--release` has none | — |
| 14 `framwork/.codeadd/commands/*.md` | product | 12 have a closing step, `add.done` and `add.diagnose` have none | — |

`node scripts/graph.js history add-doc-schemas --layer product` returns one live delivery (the
plain-language rule). `history add-plan-authoring --layer internal` returns none. Nothing here has
been attempted and replaced.

## Scope

### Includes

- **F1** [internal] — `.claude/skills/add-final-report/SKILL.md`: new skill. Carries the block list,
  the banned-phrasing table lifted from `add-plan-authoring`, the rule that the report is emitted
  BEFORE any metadata, and the self-check. Must NOT lose the existing bans (an F/T/L id carrying the
  meaning, "improves consistency", a deletion reported as cleanup, a category named instead of each
  file). Must state in prose that a product sibling with the same name exists and that divergence
  between them is intended.

  **Five of the seven blocks arrive with their content rule already written** — `add-plan-authoring`
  defines them and F2 moves that text here unchanged. The two new blocks have none yet, so F1
  writes one for each, at the same specificity as the five it inherits and with no numeric advisory:

  - **`TL;DR`** — one line naming what the user now has that they did not have before. Not what the
    command did, not what file moved. A reader who stops here knows the outcome.
  - **`How it works`** — the mechanism behind what was just delivered, readable by someone who did
    not watch the run: what triggers it, what it reads, what it produces. It answers "and how does
    this thing work?", which is the question every current closing leaves open.

  The self-check gains one line per new block: the `TL;DR` names an outcome and not an activity, and
  the `How it works` digest stands on its own with the surrounding context removed.
  - **Produces:** `add-final-report` (internal) — the seven-block shape `TL;DR` / `What was
    delivered` (or `What will be done`) / `How it works` / `Files touched` / `Where it plugs in` /
    `Not included` / `⚠️ Needs your attention`, plus the emit-before-metadata rule and the self-check

- **F2** [internal] — `.claude/skills/add-plan-authoring/SKILL.md`: delete § "Completion — The
  Executive Summary" and its self-check, and replace the section with a pointer to F1 and nothing
  else. The two plan-specific rules already live untouched in § "Acting on the Verdict" — the
  changelog row on a `fix-then-ok`, and the plan not being delivered before the report comes back.
  Leave that section alone; the pointer must not restate it.
  - **Consumes:** `add-final-report` (internal) (F1)

- **F3** [internal] — the six internal commands with an existing closing step, each rewritten to
  load F1 and report in the shape, keeping every fact the step already demands:
  `add-framework--plan.md` STEP 7, `add-framework--build.md` STEP 10 (keeps the exhaustive rulings
  requirement), `add-framework--done.md` STEP 9 (keeps the archive members, the skip remedy commands
  and every gate result), `add-framework--brainstorm.md` STEP 7, `add-framework--sync.md` STEP 6,
  `add-framework--roadmap.md` STEP 9. Each file's `<!-- uses: -->` block gains `skill:
  add-final-report`.
  - **Consumes:** `add-final-report` (internal) (F1)

- **F4** [internal] — `.claude/commands/add-framework--release.md`: add a closing STEP 8 after
  STEP 7 "Push Tag". The command currently ends on the tag push with no report. The new step names
  the version, the tag, the merge to production and the pipeline URL, in the shape.
  - **Consumes:** `add-final-report` (internal) (F1)

- **F5** [product] — `framwork/.codeadd/skills/add-final-report/SKILL.md`: new skill, same seven
  blocks, product vocabulary. Registered in `framwork/provider-map.json` under `skills` as
  `"add-final-report": {}` so it builds to all 5 providers. Must state that an internal sibling
  exists and that divergence is intended.
  - **Produces:** `add-final-report` (product) — the same seven-block shape, product vocabulary,
    built to all 5 provider directories

- **F6** [product] — the six delivery-flow commands, closing step rewritten to load F5 and report in
  the shape: `add.plan.md` STEP 14, `add.build.md` STEP 17 (17.1 "Rulings I made" survives
  unchanged, exhaustive, with its three-part rows), `add.review.md` STEP 11, `add.hotfix.md`
  STEP 16, `add.pull-request.md` STEP 8, `add.plan-to-ready.md` STEP 9. Each `<!-- uses: -->` gains
  `skill: add-final-report`.
  - **Consumes:** `add-final-report` (product) (F5)

- **F7** [product] — the six generator and setup commands, same treatment: `add.new.md` its
  `## Completion` section, `add.brainstorm.md` STEP 6, `add.audit.md` STEP 9, `add.init.md` STEP 9,
  `add.qa-setup.md` STEP 14, `add.wiki.md` STEP 9 (keeps the backlog and cleanup facts).
  - **Consumes:** `add-final-report` (product) (F5)

- **F8** [product] — the two commands with no closing step: `add.done.md` gains STEP 9 after
  STEP 8 "Execute Merge", carrying the wiki result from 6.7 and the next-command suggestion the
  merge step currently buries; `add.diagnose.md` gains STEP 10 after STEP 9 "Validation Gate" — the
  gate stays the last step that touches the doc, and a completion summary is an allowed post-doc
  step per `add-doc-schemas` § Validation Gate Block.
  - **Consumes:** `add-final-report` (product) (F5)

- **F9** [internal] — `.claude/skills/building-commands/SKILL.md`: authoring rule that a new
  command's closing step reports in the shape, naming `add-final-report` in the command's own layer.
  Names the two exemptions and why: a router (`add.md`) and an instruction transformer (`add.ux`)
  finish no work and get no report.

  ⛔ **The `<!-- uses: -->` block declares the INTERNAL skill only.** `extractUses` in
  `scripts/build.js` resolves every declared target inside the declaring artefact's own layer
  (`to: ${layer}/${usesTargetId(kind, target)}`, line 735, under a comment reading "cross-layer edge
  has no syntax yet"). A `mention: add-final-report` written here would resolve to
  `internal/skill/add-final-report` and quietly duplicate an edge that already exists, never
  reaching the product node. The product sibling is named **in prose**, the way `add-commit`'s two
  copies already coexist with no reference between them. A real cross-layer edge needs new work on
  `build.js` target resolution and is not part of this plan.
  - **Consumes:** `add-final-report` (internal) (F1), `add-final-report` (product) (F5) — the second
    is consumed as a name written in prose, not as a declared `uses:` target

- **F10** [internal] — `CLAUDE.md`: one row in "Where the details live" pointing the closing-report
  topic at `add-final-report`. The inventory block is regenerated by `node scripts/inventory.js`,
  never hand-edited, and picks up the product skill from F5.
  - **Consumes:** `add-final-report` (internal) (F1), `add-final-report` (product) (F5)

### Does NOT Include (important!)

- **`add.md` and `add.ux`.** A router that suggests a next command and a command that rewrites a UX
  instruction finish no work. Forcing a delivery report on them produces noise.
- **A sync check between the two skills.** Divergence is the intended outcome, not the failure mode.
  `add-commit` already lives in both layers and has diverged by ten lines with no harm.
- **A build-time lint asserting every command loads the skill.** The graph already answers "who
  depends on `add-final-report`", and F9 covers commands written from here on. A lint is separable
  work.
- **Any change to `add-doc-schemas`.** It governs documents written to disk. A closing chat message
  is not one, and widening that skill's charter is what its own Self-Governance section forbids.
- **A cross-layer edge in the artefact graph.** `scripts/build.js` resolves every `uses:` target
  inside the declaring artefact's own layer and says so in a comment. Giving the graph a real
  cross-layer syntax is separable work, and this plan does not need it.
- **Changing which facts a command must report.** Every mandatory fact in every rewritten step
  survives verbatim. This plan changes the shape around them, not the content.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Where does the shape live in the product layer? | A new skill, `add-final-report` | `add-doc-schemas` is loaded at the start for doc writing; the report is needed at the very end. A JIT load at the closing step is the one the agent still has in context when it matters |
| One shared file or one per layer? | One per layer | Product cannot reference `.claude/` — it is not distributed. Internal must not take a runtime dependency on product source |
| Keep the two files in sync? | No | The vocabularies differ by design. A byte-identical check would force the shared text down to something too generic to be useful |
| How many commands adopt now? | All 21 that finish work | The roadmap's Target is "every command ends the same way". One command per layer would leave a shape nobody follows |
| Does the shape replace each command's fact list? | It wraps it | TL;DR on top, how-it-works below, the command's own facts become the middle bullets. No fact is lost |
| How do future commands inherit it? | A rule in `building-commands` | It is internal, governs authoring in both layers, and is never loaded by a product command — so it carries the rule with no cross-layer dependency |
| Same skill name in both layers? | Yes | `add-commit` is the precedent. The graph namespaces as `internal/skill/` and `product/skill/` |
| Tense — "will be done" or "was delivered"? | Block 2 is named by the command's role | A planner proposes, a builder reports. The other six blocks are identical |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One closing shape across 21 commands | Two skill files to maintain, one per layer |
| The skill loaded at the moment it is used | 21 `<!-- uses: -->` edits and 21 rewritten steps |
| A "how it works" digest that no command produces today | A longer closing message than the shortest commands emit now |
| Future commands inherit the shape from `building-commands` | Nothing enforces it at build time |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A rewrite silently drops a mandatory fact — `add.build`'s exhaustive rulings, `add.done`'s PR number and merge state, `add-framework--done`'s archive members | High | L3.6 — before each of F3, F6, F7 edits a file, capture that step's required facts as a grep list; after the edit every item must still hit. An F-block whose list does not clear is not committed |
| The two skills are later "fixed" into one by someone who reads the duplication as an accident | Medium | F1 and F5 each state in the file that the sibling is intentional and why. Recorded again under Does NOT Include |
| `CLAUDE.md` edit rewrites what every future session loads | Medium | F10 adds exactly one table row. The inventory block is regenerated by `node scripts/inventory.js`, never hand-edited (Global Constraints) |
| An internal F-block leaks into `framwork/` | Low | L3.4 — `git status --porcelain framwork/` is empty after every internal F-block |
| The product skill ships to only some providers | Low | L1.2 asserts the built file in all 5 provider directories |
| The new skills acquire a numeric length cap by habit | Low | L3.5 greps both files for numeric advisories |
| A live acceptance run writes to `main` — `/add-framework--roadmap` commits and pushes there with no confirmation gate | Medium | L4.1 puts the live run on the build's own STEP 10 instead, which writes nothing outside the plan's own branch. The exclusion is stated in L4.1 so nobody restores the roadmap run later |
| F9 declares the product skill in a `uses:` block and the edge silently lands on the internal node | Medium | F9 states the constraint with the `build.js` line that causes it; L2.2 asserts the product node's dependant set holds the 14 commands and nothing else |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `.claude/skills/add-final-report/SKILL.md` | internal | create | F1 — the internal shape |
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | F2 — section removed, pointer added |
| `.claude/commands/add-framework--plan.md` | internal | modify | F3 — STEP 7 |
| `.claude/commands/add-framework--build.md` | internal | modify | F3 — STEP 10 |
| `.claude/commands/add-framework--done.md` | internal | modify | F3 — STEP 9 |
| `.claude/commands/add-framework--brainstorm.md` | internal | modify | F3 — STEP 7 |
| `.claude/commands/add-framework--sync.md` | internal | modify | F3 — STEP 6 |
| `.claude/commands/add-framework--roadmap.md` | internal | modify | F3 — STEP 9 |
| `.claude/commands/add-framework--release.md` | internal | modify | F4 — new STEP 8 |
| `framwork/.codeadd/skills/add-final-report/SKILL.md` | product | create | F5 — the product shape |
| `framwork/provider-map.json` | product | modify | F5 — register the skill |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F6 — STEP 14 |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F6 — STEP 17 |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F6 — STEP 11 |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | F6 — STEP 16 |
| `framwork/.codeadd/commands/add.pull-request.md` | product | modify | F6 — STEP 8 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | product | modify | F6 — STEP 9 |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F7 — `## Completion` section |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F7 — STEP 6 |
| `framwork/.codeadd/commands/add.audit.md` | product | modify | F7 — STEP 9 |
| `framwork/.codeadd/commands/add.init.md` | product | modify | F7 — STEP 9 |
| `framwork/.codeadd/commands/add.qa-setup.md` | product | modify | F7 — STEP 14 |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | F7 — STEP 9 |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F8 — new STEP 9 |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | F8 — new STEP 10 |
| `.claude/skills/building-commands/SKILL.md` | internal | modify | F9 — authoring rule |
| `CLAUDE.md` | internal | modify | F10 — "Where the details live" row |

**Deleted: none.** F2 removes a section from a file that stays.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every assertion as a runnable check BEFORE the F-block it covers
lands, run it against the current tree, and confirm it fails for the stated reason. Then drive it
green.

These are markdown artefacts, so the levels are build, graph, grep and one live run. There is no
unit test to write.

### L1 — Build side (RED → GREEN)

1. `node scripts/build.js` exits 0 and its warning count equals the baseline captured before F1.
   *RED today: not red — this is a regression guard, run after every F-block per the build rules.*
2. The product skill lands in all 5 provider output directories, at
   `<dir>/skills/add-final-report/SKILL.md`. The five `dir` values, verbatim from
   `framwork/provider-map.json` → `providers.{name}.dir`: `framwork/.claude` (claude),
   `framwork/.agents` (codex), `framwork/.agent` (antigrav), `framwork/.opencode` (opencode),
   `framwork/.cursor` (cursor). Codex's skills root is `.agents`, not `.codex` — read the `dir`
   field, never guess from the provider name. *RED today: the source directory does not exist.*
3. The generated inventory block in `CLAUDE.md` lists `add-final-report` inside `skills`.
   *RED today: absent — the skill does not exist.*
4. `framwork/provider-map.json` parses and its `skills` object holds the key `add-final-report`.
   *RED today: key absent.*

### L2 — Graph

1. `node scripts/graph.js orphans` lists neither new skill. *RED today: they do not exist, so the
   query cannot name them.*
2. `node scripts/graph.js impact add-final-report --depth 1` resolves both layer-qualified nodes.
   Expected dependant set, stated by name, not by count alone:
   - `internal/skill/add-final-report` — the 7 internal commands, plus
     `internal/skill/add-plan-authoring` and `internal/skill/building-commands`.
   - `product/skill/add-final-report` — the 14 product commands, and nothing else.
     `building-commands` names this skill in prose only (F9), so no edge reaches it from the
     internal layer.
   *RED today: no such node.* A difference between the expected set and the returned set is
   reconciled as a ruling, never by editing the expectation.
3. No edge runs from a product artefact to an internal one:
   `grep -rn "\.claude/" framwork/.codeadd/skills/add-final-report/ framwork/.codeadd/commands/`
   returns nothing. *RED today: not red — a boundary guard.*

### L3 — Content assertions

1. Exactly 21 command files declare the skill in their `<!-- uses: -->` block — 7 under
   `.claude/commands/`, 14 under `framwork/.codeadd/commands/`. `add.md` and `add.ux` do not.
   *RED today: 0 of 21.*
2. Each of those 21 files' closing step names the shape and instructs the report be emitted before
   any metadata. *RED today: 0 of 21.*
3. `.claude/skills/add-plan-authoring/SKILL.md` no longer contains the heading
   `## Completion — The Executive Summary`, and contains exactly one reference to
   `add-final-report`. *RED today: the heading is present at § Completion.*
4. `git status --porcelain framwork/` is empty after each of F1, F2, F3, F4, F9, F10.
   *RED today: not red — a lane guard, per Global Constraints.*
5. Neither new `SKILL.md` contains a numeric length advisory:
   `grep -Ein '<[0-9]+ (words|lines|chars)|~?[0-9]+-[0-9]+ words' <file>` returns nothing.
   *RED today: the files do not exist.*
6. **Fact preservation, per rewritten file.** Before F3, F6 and F7 edit a file, extract that closing
   step's required facts into a checklist; after the edit, every item is still found in the file.
   The non-negotiable ones, named here so the reviewer can check them directly:
   - `add-framework--build.md` — "Rulings I made", the exhaustiveness clause, the cost clause, the
     inventory "already current" line, the PR-or-local-branch line.
   - `add-framework--done.md` — the entry `id` and item count, the archive members, the unattributed
     evidence file, the two commands printed when the worktree skip happens, every gate result.
   - `add.build.md` — 17.1 in full: the `grep -n 'Ruling:'` call, the three-column table, the
     "zero rulings is stated, not omitted" rule, deferred minors, parked findings, subagent failures.
   - `add.done.md` — the wiki result from 6.7 and the next-command suggestion.
   - `add.wiki.md` — the backlog and the cleanup result.
   - `add.plan.md` — the design contract path or the reason 8.1 was skipped, and the review verdict.
   *RED today: no checklist exists — the build creates it as its first act on each file.*

### L4 — Behavioural acceptance

1. **Internal, live — the build reports on itself.** `/add-framework--build` is one of the six
   commands F3 rewrites, so the closing message it emits at the end of executing THIS plan is the
   live acceptance. After F3 commits, the build re-reads
   `.claude/commands/add-framework--build.md` STEP 10 from disk and follows the rewritten text: a
   TL;DR line, bullets of what shipped, a how-it-works digest, in that order, before the ledger
   path, the commit brackets and the rulings. *RED today: STEP 10 emits a flat fact list.*
   If the engine cannot pick up its own edited command file inside the same run, the level degrades
   to inspection and the build records that as a ruling — it does not silently pass.

   ⛔ **The live subject is deliberately NOT `/add-framework--roadmap`.** That command commits and
   pushes straight to `main` with no confirmation gate, by design. Running it to look at a report
   format would leave a permanent commit on the shared branch, and reverting it leaves two.
2. **Product, structural.** A live product run needs a real feature branch and is out of reach here.
   Acceptance is by inspection: read `add.build.md` STEP 17 and `add.done.md` STEP 9 end to end and
   confirm a reader who has not seen the plan can tell what the command will print. Recorded as an
   inspection result in the evidence, never as a passing test.

**RED expectations against the current tree:** L1.2, L1.3, L1.4, L2.1, L2.2, L3.1, L3.2, L3.3, L3.5
and L4.1 all fail today. L1.1, L2.3 and L3.4 are guards that pass today and must keep passing.
**GREEN = every level passes after F1–F10.**

---

## Execution Order

**F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10**

- **F1 first** because F2, F3, F4 and F9 all consume the internal shape by name.
- **F2 before F3** so no internal command points at a section that still exists in two places.
- **F5 before F6, F7 and F8** for the same reason on the product side, and because the provider-map
  registration must exist before `build.js` can distribute the skill.
- **F9 and F10 last** because both name the two skills and cannot be written before both exist.
  F10 also needs F5 on disk for the regenerated inventory block to pick it up.

**Safe stopping boundaries.** The repo is in a working state after F4 (internal layer complete and
self-consistent, product untouched) and after F8 (both layers adopted, only the authoring rule and
the `CLAUDE.md` row outstanding). Stopping mid-F3, mid-F6 or mid-F7 leaves some commands loading a
skill and others not, which builds and runs but reports inconsistently.

**Per-F-block validation beyond the layer default:**

- Every F-block: `node scripts/build.js`, warnings compared against the F1 baseline.
- F1, F2, F3, F4, F9, F10: `git status --porcelain framwork/` empty (L3.4).
- F3, F6, F7: the L3.6 fact checklist for each file touched, captured before the edit.
- F5: L1.2 and L1.4 immediately, before any consumer is written.
- F10: `node scripts/inventory.js` regenerates the block. Never hand-edited.

## Reviewer Handoff

For each F-block the build leaves, in the evidence file:

- **What changed** — files touched, with the F-block id and its layer tag.
- **Which validation levels cover it**, and their pass state.
- **The L3.6 checklist** for every file F3, F6 and F7 rewrote — the facts captured before the edit
  and the grep result after. This is the evidence that matters most in this plan.
- **Any decision deferred or altered**, with the plan section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — an assertion written after the
   edit proves nothing.
2. A rewritten closing step that reads well and quietly dropped a mandatory fact. L3.6 is the guard;
   a build that skipped the pre-edit capture cannot claim it.
3. The two skills written as one file copied twice, with product vocabulary left as internal
   vocabulary — `F-block`, `ledger` or `layer` appearing in the product skill is the tell.
4. A product command or the product skill referencing `.claude/`, or `building-commands` declaring
   the product skill in its `uses:` block — which resolves to the internal node and looks correct.
5. `add.md` or `add.ux` picking up the report because the edit was applied by glob.

## References

- Roadmap item 3.0, `docs/roadmap/index.md`
- Source of the shape: `.claude/skills/add-plan-authoring/SKILL.md` § "Completion — The Executive
  Summary"
- Same-name-across-layers precedent: `.claude/skills/add-commit/` and
  `framwork/.codeadd/skills/add-commit/`, already divergent by ten lines

---

## Next Steps

/add-framework--build final-report-shape

One command executes every F-block, whichever layer each is tagged.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-09 | Initial creation |
| 2026-09-09 | Implemented on `feat/final-report-shape`, F1-F10 plus F11/F12 carrying the review findings. Commits d0081fe..8c947ff |
| 2026-09-09 | Review `fix-then-ok` applied. F9 no longer declares the product skill in a `uses:` block — `build.js` resolves every target inside the declaring layer, so the edge would land on the internal node. F1 gains a content rule and a self-check line for `TL;DR` and `How it works`. L4.1 moves the live run off `/add-framework--roadmap`, which pushes straight to `main`, onto the build's own STEP 10. L1.2 names the five provider `dir` values. F2 reworded so the pointer does not restate § "Acting on the Verdict" |

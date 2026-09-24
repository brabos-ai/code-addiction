# Plan: Board pipeline phase statuses — the whole capability, behind one feature

> **Status:** implemented — one delivery, one branch, four checkpoints, all four built
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-23
> **Delivery:** automatic
> **Ticket:** 0005B

---

## ⛔ ONE DELIVERY, ONE BRANCH, FOUR CHECKPOINTS

**This is a single delivery.** One branch, one PR, one close-out, one delivery-index entry, one ticket
close. The four checkpoints are stages **inside** it, exactly as
`2026-09-23T122713-PLAN--board-design-palette-and-hierarchy` ran checkpoints 1 and 2 on one branch.

```
IF TEMPTED TO SPLIT THIS INTO SEVERAL PLANS:
  ⛔ DO NOT: Write a second plan document for a checkpoint
  ⛔ DO NOT: Open a second branch, or a second PR, per checkpoint
  ⛔ DO NOT: Run /add-framework--done between checkpoints
  ✅ DO: Keep one branch. A checkpoint boundary is a safe stopping point, not a delivery
```

**Why it matters beyond tidiness.** The internal `work_id` is the **plan basename**
(`add-plan-authoring`, The Ticket). Four plans would be four `work_id` values, so the `work_id` stop in
checkpoint 3 could not bridge them and ticket `0005B` would bounce backwards between phases as each plan
ran — the exact failure checkpoint 3 exists to prevent, caused by how the work was filed. **One plan, one
`work_id`, one coherent ticket history.**

F-block numbering is **continuous across checkpoints**, F1 to F44. Checkpoint 1 is F1–F4, checkpoint 2 is
F5–F18, checkpoint 3 is F19–F36, checkpoint 4 is F37–F44.

---

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

**When this build is done:** a ticket moves through seven phase statuses as the pipeline runs, the board
shows it in the matching column with its status as a badge, and **the whole capability arrives by fragment
injection behind a `board` feature that is off by default** — with the feature disabled, **no PRODUCT
command** carries a single line of ticket instruction.

⛔ **"Product" is the whole guarantee.** The four internal `add-framework--*` stages always carry their
ticket instructions: `workbench/` has no feature system, and Does NOT Include says so. A promise covering
"every command" would be false the moment anyone opened one of them.

**Ticket done when:** a ticket named by `ticket:` moves through every phase status as add.brainstorm/add.new, add.plan, add.build, the PR and add.done run, each move one board write; the board shows it in the matching column at each step; a project with the old four-status definitions file either migrates or reports the missing status without stopping the command; and add.hotfix can take a ticket straight to building.

⛔ **That criterion is the ticket's own text, copied verbatim, and it offers a CHOICE: "either migrates or
reports the missing status". This delivery takes the SECOND branch.** There is no installed base to migrate
— umbrella, "The premise that shapes everything below" — so `cli/src/migrations.js` is untouched and a
four-status file reports `REFUSED=unknown-status` and continues, proven by **L3.2**. A builder reading the
quote alone could start building a migration the rest of this plan forbids; this note is what stops that.

## Context

The backlog board shipped three days ago in three consecutive plans. It cannot say *where* a ticket is:
`open` covers "nobody looked at this" and "the plan is approved and nobody picked it up" alike. The pipeline
knows the difference at every step and discards it. Each of those three plans deferred, by name, the scope
needed to fix it.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive them — it
points at them.**

| Document | Carries |
|---|---|
| `…-000-umbrella.md` | the phase model, the premise that there is no installed base, what the feature can and cannot reach, the pointer-not-procedure rule |
| `…-001-model-and-script.md` | the four new keys and their fallbacks, the nine reserved names, why nothing is injected |
| `…-002-the-feature-gate.md` | the fifteen-site table, the `add.build` numbering fix, the five count-literal sites, the two-half acceptance criterion |
| `…-003-the-seven-writes.md` | the phase pair, the phase check, the `work_id` stop, every write's exact step, the hotfix route |
| `…-004-the-board.md` | column-as-layout-unit, the three failure modes, the skeleton literal, the `column` URL param, the F13 boundary |
| `…-intent.md` | the classified path, every closed decision, `## Open: None` |

All under `docs/brainstorming/2026-09-23T164422-board-pipeline-phase-statuses-`.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- A command-side marker pair must be EMPTY — `assertEmptyMarkerPairs` throws `Non-empty injection pair ... marker pairs must be empty` (`scripts/build.js:176-180`)
- HTML comments are stripped at build; installed files ship marker-free (AGENTS.md, Pipeline)
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (AGENTS.md, Pipeline)
- The feature registry key equals the fragment directory name (`cli/src/features.js:34-39`)
- `backlog.sh` runs no git command at all (`backlog.sh` header; asserted by `backlog.bats` L1.5b)
- `backlog.sh` uses `set -u` ONLY, NEVER `-e` (`backlog.sh` header; asserted by `backlog.bats` L1.5)
- **No SCRIPT write to a definitions file that already exists** — the constraint binds `backlog.sh`'s own write path, guarded by L1.7 and L3.2 (design 001, "IF THE DEFINITIONS FILE ALREADY EXISTS"). **F35's hand-edit of this repository's file is NOT the case it covers**, and F35 names this constraint to say so
- **A fragment carries an anchor and a pointer, never a procedure** (umbrella, "A fragment carries an anchor and a pointer")
- **No transition validation, ever** — it is what lets `add.hotfix` jump (umbrella, Does NOT Include)
- `board/server.mjs` stays zero-dependency, Node built-ins only, bound to `127.0.0.1`, and never parses `docs/backlog.jsonl` (`board/server.mjs:22-27`, `:45`; AGENTS.md, Product Layer — `board/`)
- F13 and F18 of `2026-09-23T122713-PLAN--board-design-palette-and-hierarchy` are not re-opened: equal-share column sizing (`board-view.tsx:138`) and status-told-apart-by-shape stand
- Tests run through `npm test` at the repository root, which `scripts/run-tests.js` backs (AGENTS.md, Key files)

## Problem

1. **The board's vocabulary is coarser than the pipeline's knowledge** — four statuses over a seven-stage
   flow. The information exists and is discarded.
2. **Only two of five commands write**, and `lifecycle.md`'s stated reason turns out narrower than it reads:
   `backlog-commit.sh` reaches the **base** branch through a detached locked worktree, never the caller's.
3. **Nothing board-related is gateable today** — fifteen instruction sites sit in five command bodies, six
   of them woven into shared sentences or numbered lists.
4. **`add.hotfix` has no route to a ticket at all**, and opens no PR.
5. **The board groups by status**, so nine statuses would render as nine columns in append order.

## Proposal

Four checkpoints on one branch, in this order and no other:

| Checkpoint | F-blocks | What it lands |
|---|---|---|
| **1 — the model and the script** | F1–F4 | `DEFAULT_DEFS` grows to nine statuses and seven columns; four optional keys with fallbacks; two references; additive `backlog.bats` assertions |
| **2 — the feature gate** | F5–F18 | The `board` feature, `default: false`; every existing ticket instruction moved into `fragments/board/`; zero behaviour change when enabled |
| **3 — the seven writes** | F19–F36 | `phases.md` new, `lifecycle.md` rewritten, the five new writes, `add.hotfix` joining, the internal pipeline |
| **4 — the board** | F37–F44 | Group by column, status as a card badge, `dropped` hidden, the `column` URL param |

**Checkpoint 1 gates 2, 3 and 4** — nothing can write or render a phase the format cannot hold.
**Checkpoint 2 gates 3**, and that ordering is the whole reason it comes second: with the gate last,
checkpoint 3 would write five new instructions into command bodies and checkpoint 2 would then move all
fifteen out — the same five files edited twice.

## Current State

Every `Direct callers` figure is `impact --depth 1`. `board/`, `cli/src/` and `docs/` have **no graph node**
— the graph indexes `framwork/.codeadd/` and `workbench/` only — so those rows read NOT VERIFIED and were
answered by reading the files.

| Artefact | Direct callers | Risk |
|---|---|---|
| `framwork/.codeadd/scripts/backlog.sh` | `add-backlog` | MEDIUM |
| `add-doc-schemas/references/backlog.md` | `add-backlog`, `add-doc-schemas` | MEDIUM |
| `add-backlog/references/lifecycle.md` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan`, `add-backlog` | **HIGH** |
| `add-doc-schemas` | 22 artefacts | **HIGH** (reference only) |
| `add.brainstorm` | `add`, `add.new` | MEDIUM |
| `add.new` | 11 artefacts + 1 INJECTS_INTO | **HIGH** |
| `add.plan` | 21 artefacts, 3 INJECTS_INTO | **HIGH** |
| `add.build` | 20 artefacts, 3 INJECTS_INTO | **HIGH** |
| `add.done` | 10 artefacts, 2 INJECTS_INTO | **HIGH** |
| `add.hotfix` | 8 artefacts, 2 INJECTS_INTO | **HIGH** |
| `add-plan-authoring` | `add-framework--brainstorm`, `--build`, `--done`, `--plan` | **HIGH** |
| `cli/src/features.js`, `board/**`, `docs/backlog.definitions.json` | NOT VERIFIED — no node; read directly | — |

No fragment in the tree dispatches or touches the backlog — checked against all eleven.
**`AGENTS.md` is not changed by this plan.**

---

# Checkpoint 1 — the model and the script

**When this checkpoint is done:** `docs/backlog.definitions.json` can express a pipeline phase. A project
created after this change gets nine statuses grouped into seven columns; a definitions file that already
exists is untouched, and any of the four new keys may be absent without breaking a reader.

## Scope — Checkpoint 1

- **F1** [product] — `framwork/.codeadd/scripts/backlog.sh`: `DEFAULT_DEFS` grows to nine statuses and gains
  the seven-column array; the four new keys are read with their fallbacks wherever the script already reads
  a status. **Must NOT lose:** the no-git rule, `set -u` only, write-only creation, and the rule that an
  existing file is never written. Contract in design 001.
  Also: **the ticket record gains a fourteenth field, `feature`**, accepted on a write and persisted like any
  other. It holds the `[NNNN]F` of the feature carrying this ticket. **Must NOT lose:** the rule that a field
  the format does NOT define is still dropped (`backlog.bats` L4.4).
  - **Produces:** the `feature` field accepted on a write and round-tripped on a read
  - **Produces:** the nine reserved names — `open`, `refining`, `shaped`, `planning`, `planned`, `doing`,
    `in-review`, `done`, `dropped` — present in `DEFAULT_DEFS` with the seven-column array
  - **Produces:** `backlog.sh` resolves `column`→the status's own `name`, `label`→the status's own `name`,
    absent `columns`→derived from the statuses in `order` order, `hidden`→`false`
- **F2** [product] — `add-doc-schemas/references/backlog.md`: the four keys and their fallbacks, the nine
  reserved names as a documented contract, what `order` sorts now, who owns which key. **Revises `:93`
  § The definitions file and `:161` § Hard bans** — both promise the file is never rewritten; the promise
  stays true and must now say why. **Must NOT lose:** the six `REFUSED=` names or the seven hard bans.
  Also: **the fourteenth field, `feature`**, documented next to `work_id` — what it holds, who writes it, and
  **why it is not `work_id`**: `work_id` is the marker the `work_id` stop reads, so it cannot double as the
  feature pointer without silencing the planning phase.
  - **Consumes:** the fallback contract (F1)
  - **Consumes:** the `feature` field accepted on a write and round-tripped on a read (F1)
- **F3** [product] — `add-backlog/references/lifecycle.md`, **§ The Status Names only**: nine names in place
  of two. **Must NOT lose:** anything else in the file — the rest is checkpoint 3's.
  - **Consumes:** the nine reserved names (F1)
- **F4** [product] — `framwork/.codeadd/scripts/tests/backlog.bats`: **additive assertions only**, plus a
  guard holding `DEFAULT_DEFS`'s names equal to the reference's — the `L1.4b` pattern extended. **Must NOT
  lose or alter L3.2, L3.2b, L3.6, L1.4 or L1.4b.**
  - **Consumes:** the fallback contract (F1)

## Validation Matrix — Checkpoint 1

### L1 — `backlog.bats` (RED → GREEN)

1. A first write with **no** definitions file creates one holding exactly nine statuses and seven columns,
   `dropped` carrying `hidden: true`. *RED today: four statuses, no `columns`.*
2. A status with no `column` resolves to its own `name`. *RED today: the key is not read.*
3. A status with no `label` resolves to its own `name`. *RED today: same.*
4. An absent `columns` derives the list from the statuses in `order` order. *RED today: same.*
5. A column with no `hidden` resolves to `false`. *RED today: same.*
6. Every name in `DEFAULT_DEFS` appears in `references/backlog.md`, and every status name that reference
   declares appears in `DEFAULT_DEFS`. *RED today: four against nine.*
6a. **The `feature` field round-trips** — a write carrying it persists it, a read returns it, and a field the
   format does NOT define is still dropped (L4.4 unchanged). *RED today: `feature` is dropped as undefined.*
6b. **The same equality against `lifecycle.md` § The Status Names** — it lists the nine and no others. This
   is the level that covers **F3**, which L1.6 alone does not. *RED today: it names two.*
7. **A definitions file that already exists is byte-identical after two further writes.** *Regression guard
   — passes today and must still pass.*
8. L3.2, L3.2b, L3.6, L1.4 and L1.4b pass **unmodified**. *Regression guard.*

### L2 — Build and suite

1. `node scripts/build.js` exits 0, no new warning. 2. `npm test` passes. 3. `backlog.sh` still invokes no
git (L1.5b) and still sets `-u` without `-e` (L1.5).

### L3 — Behavioural

1. On a project created after this change, a write carrying `status: planning` **succeeds**. *RED today.*
2. **Against this repository's own four-status file, unchanged:** `status: planning` is refused with
   `REFUSED=unknown-status`, the file is byte-identical afterwards, and `board/server.mjs` still answers
   `/api/board` with four statuses.
3. An unparseable definitions file reports `DEFS_UNREADABLE=yes` and **is not written**.

**RED today:** L1.1–L1.6, L1.6a, L1.6b, L3.1. **Regression guards:** L1.7, L1.8, L2, L3.2, L3.3.

## Execution Order — Checkpoint 1

F1 → F4 → F2 → F3. F1 first because everything else describes or asserts it; F4 immediately after so the
fallbacks are proven before the prose describes them. **The repository is working after every F-block** —
F1 is additive and nothing writes the new statuses until checkpoint 3.

---

# Checkpoint 2 — the feature gate

**When this checkpoint is done:** every ticket instruction that existed before this delivery lives in
`framwork/.codeadd/fragments/board/`, behind a `board` feature that is off by default. With it disabled the
five commands carry no ticket instruction and declare no dependency on `add-backlog`. With it enabled they
read exactly as they do today.

⛔ **The mechanism is a FEATURE, not a plugin.** In this repository `plugin` means an integration with an
external MCP tool. The verb here is `codeadd features enable board`.

## Scope — Checkpoint 2

- **F5** [product] — `cli/src/features.js`: a `board` entry, `default: false`, `commands` listing the five.
  No alias.
  - **Produces:** `FEATURES.board` with `commands: ['add.brainstorm','add.new','add.plan','add.build','add.done']`
- **F6** [product] — `fragments/board/add.brainstorm.md`: four sections, plus the fragment's own
  `<!-- uses: -->` declaring `add-backlog` and `add-backlog/references/lifecycle.md`.
  - **Produces:** the `board:*` section names for `add.brainstorm`
- **F7** [product] — `commands/add.brainstorm.md`: four blocks removed, empty marker pairs at their anchors,
  the two `- skill: add-backlog…` lines removed from `uses:`. **`:435-438` is rewritten so the ticket clause
  becomes its own trailing line.** **Must NOT lose:** the report contents that sentence describes.
  - **Consumes:** the `board:*` section names for `add.brainstorm` (F6)
- **F8** [product] — `fragments/board/add.new.md`: three sections and its `uses:` block.
  - **Produces:** the `board:*` section names for `add.new`
- **F9** [product] — `commands/add.new.md`: three blocks removed, anchors left, `uses:` lines removed. **The
  `:142` sub-clause comes out of numbered item 3**, which goes back to creating the skeleton. **Must NOT
  lose:** the READ-ONLY GUARANTEE, or the table's remaining two rows.
  - **Consumes:** the `board:*` section names for `add.new` (F8)
- **F10** [product] — `fragments/board/add.plan.md`: two sections and its `uses:` block.
  - **Produces:** the `board:*` section names for `add.plan`
- **F11** [product] — `commands/add.plan.md`: two blocks removed, anchors left, `uses:` lines removed. **The
  `:620-625` clause is rewritten into its own trailing line.** **Must NOT lose:** the `## Objective`
  assembly that paragraph describes, or the prose `product-pipeline-parity.test.js` pins at `:111` and
  `:139-140`.
  - **Consumes:** the `board:*` section names for `add.plan` (F10)
- **F12** [product] — `fragments/board/add.build.md`: three sections and its `uses:` block.
  - **Produces:** the `board:*` section names for `add.build`
- **F13** [product] — `commands/add.build.md`: **the largest command edit in the delivery.** The ticket work
  leaves STEP 2's numbered list and becomes an unnumbered aside after item 6; the two references at
  **`:1501-1502` and `:1508`** name the work instead of "STEP 2 item 5". ⛔ **The first is split across a
  line break (`STEP 2` / `item 5`), so a grep for the phrase finds only the second** — both must be found; three blocks removed, anchors
  left, `uses:` lines removed. **Must NOT lose:** STEP 2's other five items or their order, or STEP 18's
  report contents.
  - **Consumes:** the `board:*` section names for `add.build` (F12)
- **F14** [product] — `fragments/board/add.done.md`: three sections and its `uses:` block.
  - **Produces:** the `board:*` section names for `add.done`
- **F15** [product] — `commands/add.done.md`: `### 8.3` and two bullets removed, anchors left, `uses:` lines
  removed. **Must NOT lose:** STEP 9's other report bullets.
  - **Consumes:** the `board:*` section names for `add.done` (F14)
- **F16** [product] — the substitution-count literal bumped at **all five sites in three files**:
  `injection-exclusivity.integration.test.js:326`, `:327`, `:436`; `delivery-index.test.js:137`;
  `loop-consolidation-0070.test.js:105`, plus the changelog comment line. **The build greps
  `toHaveLength(46)\|toBe(46)` before freezing the number** rather than trusting this list.
  - **Consumes:** the `board:*` section names for all five commands (F6, F8, F10, F12, F14)
- **F17** [product] — `cli/tests/build-artefact-graph.test.js`: node, declaring-node and per-kind totals
  bumped for five new `fragment` nodes and their edges, plus its changelog line. **Totals are read from the
  file; no number is copied from a document.**
  - **Consumes:** the `board:*` section names for all five commands (F6, F8, F10, F12, F14)
- **F18** [product] — a new `cli/tests/board-feature.test.js` carrying the combination matrix below.
  - **Consumes:** `FEATURES.board` (F5)

## Validation Matrix — Checkpoint 2

**EXPECTED END-STATE MAP** — this touches feature injection, so the map is asserted, not described:

| Namespace | Sections | Into |
|---|---|---|
| `board` | 4 | `add.brainstorm` |
| `board` | 3 | `add.new` |
| `board` | 2 | `add.plan` |
| `board` | 3 | `add.build` |
| `board` | 3 | `add.done` |

**Total added: 15 substitutions across 5 commands.** If the build merges two adjacent sites into one
section it records the merge and the new total in the evidence file, and F16 uses the counted number. The
literal must equal `46 + (the counted total)`.

### L4 — Registry and sidecar (RED → GREEN)

1. `FEATURES.board` exists, `default: false`, five commands. *RED today.*
2. `features.test.js:130-135` — every registry key has a matching fragment directory — still passes.
3. The registry's `commands` match the fragment files one to one.
4. **The four suites carrying the substitution total agree on one number**, equal to the map plus 46.

### L5 — Build integration

1. `node scripts/build.js` exits 0, no new warning, `assertEmptyMarkerPairs` does not throw.
2. `build-artefact-graph.test.js` passes with the bumped totals.
3. `product-pipeline-parity.test.js` passes **unmodified**. *Regression guard.*
4. The five built commands ship **marker-free**.

### L6 — Combination matrix

1. **All toggle states** — `board` × `tdd-pipeline` × `qa-pipeline` × `docs-pruning`: every expected section
   exactly once, every unexpected one absent. `add.plan`, `add.build` and `add.done` carry more than one
   namespace and are the cases that matter.
2. **Shared-anchor non-collision** — where a `board` marker shares an anchor, all sections land,
   deterministically ordered.
3. **Partial disable** — disabling `board` leaves every other namespace's sections byte-untouched.
4. **Order independence** — enabling `board` then `tdd-pipeline` produces bytes identical to the reverse.
5. **Full round-trip** — enable everything, disable everything, bytes equal the pristine baseline.
6. **An explicit `false` survives an upgrade.** *Regression guard.*

### L7 — The two-half acceptance criterion

1. **The nine verbatim-moved sites are byte-identical**, with `board` enabled, to the built commands before
   this checkpoint. The build captures the pre-checkpoint built output and diffs it. The only permitted
   differences are the two `uses:` lines per command and the six reworded sites.
2. **The six reworded sites are semantically equivalent** — `@prompt-review-agent`, `mode: audit`, over each
   of the five commands. A finding that a rewrite lost a constraint is a blocker, not a nit.
3. **With `board` disabled, no built command contains the string `add-backlog`.**

**RED today:** L4, L6.1–L6.5, L7. **Regression guards:** L5, L6.6.

## Execution Order — Checkpoint 2

F5 → (F6→F7) → (F8→F9) → (F10→F11) → (F12→F13) → (F14→F15) → F16 → F17 → F18.

⛔ **Fragment before command, every time** — the command's anchors reference section names the fragment
defines.

⛔ **The repository is NOT in a working state between a fragment and its command.** The five pairs are
atomic: the fragment alone injects nothing, the command alone loses its instruction. **A build that must
stop stops after a completed pair**, never between its halves.

**F5 through F15 leave the suite red** — the count literals are stale until F16. Expected, and stated so the
build does not read it as a failure.

---

# Checkpoint 3 — the seven writes

**When this checkpoint is done:** a ticket moves through seven phase statuses as the pipeline runs, in both
layers. `add.hotfix` reaches the board for the first time. No command stops because a write was refused.

## Scope — Checkpoint 3

- **F19** [product] — `add-backlog/references/phases.md`, **NEW**: the phase MODEL — the nine statuses, the
  seven columns, what each phase means, the entry/exit pairs. Split out of `lifecycle.md` so "what does
  `in-review` mean" has an owner separate from "who writes it".
  - **Produces:** `{{skill:add-backlog/references/phases.md}}` as the single source of the phase model
- **F20** [product] — `add-backlog/references/lifecycle.md` rewritten to the **procedure only**: the phase
  check, the `work_id` stop, the seven writes with their exact steps, the extended degradation table, the
  replaced `work_id` ban reason, and **every use of the word "hook" removed** — it means "integration point
  inside a command" and has already been read as a platform hook. Points at `phases.md` for the model.
  - **Consumes:** `{{skill:add-backlog/references/phases.md}}` (F19)
  - **Produces:** the phase check, the `work_id` stop, and one report line per write that did not land

  ⛔ **The two rules, stated — not left to be inferred from L8's cases.** A cold reader given only this
  plan reconstructed the phase check as *"a status at or past this phase"*, which is an **ordering**
  comparison the design forbids twice. Neither rule compares order:

  | Rule | The literal test |
  |---|---|
  | **The phase check** | The entry write is skipped when the ticket's status equals **either of the two named statuses of that same phase** — its entry or its exit. Two string comparisons against two names. No third status is consulted, and no status is "after" another |
  | **The `work_id` stop** | Once the ticket's `work_id` **equals this run's work id**, only `in-review` and `done` may still be written. One equality test |

  **The format withheld ordering deliberately** — `order` is a sort key and never a meaning, and
  `backlog.md` says so. A check that asks "is this status later than that one" breaks the moment a user
  reorders their statuses, and nothing would report it.
- **F21** [product] — `fragments/board/add.brainstorm.md`: `refining` after the path is classified, `shaped`
  at 5.3. **Nothing on `spike`.**
  - **Consumes:** the phase check and the `work_id` stop (F20)
- **F22** [product] — `commands/add.brainstorm.md`: two new anchors.
  - **Consumes:** the `board:*` section names for `add.brainstorm` (F21)
- **F23** [product] — `fragments/board/add.new.md`: `refining` at STEP 2, `shaped` **at the report step, not
  STEP 7** — Continue Mode skips STEP 7 and a write anchored there is lost by a resume. **The STEP 2 write
  carries `feature` in the SAME write as `refining`** — `{"status":"refining","feature":"<FEATURE_ID>"}` —
  because the feature id is allocated in that same step, so the pointer costs no extra commit. Plus the
  `work_id` ban's replacement reason: **`work_id` is what the `work_id` stop reads**, so setting it here
  would block `add.plan` from ever writing `planning`.
  - **Consumes:** the phase check and the `work_id` stop (F20)
  - **Consumes:** the `feature` field accepted on a write and round-tripped on a read (F1)
  - **Produces:** the ticket carries `feature` from `add.new` STEP 2 onward, before any build
- **F24** [product] — `commands/add.new.md`: two new anchors, one at the report step.
  - **Consumes:** the `board:*` section names for `add.new` (F23)
- **F25** [product] — `fragments/board/add.plan.md`: `planning` at STEP 4, `planned` at STEP 13 Completion.
  - **Consumes:** the phase check and the `work_id` stop (F20)
- **F26** [product] — `commands/add.plan.md`: two new anchors.
  - **Consumes:** the `board:*` section names for `add.plan` (F25)
- **F27** [product] — `fragments/board/add.build.md`: `in-review` **at STEP 18**, reading the `Publish:`
  outcome STEP 17 recorded, **only on `pr-opened` or `pr-updated`**. The other three outcomes write nothing.
  - **Consumes:** the phase check and the `work_id` stop (F20)
- **F28** [product] — `commands/add.build.md`: one new anchor at STEP 18.
  - **Consumes:** the `board:*` section names for `add.build` (F27)
- **F29** [product] — `fragments/board/add.hotfix.md`, **NEW**, and `cli/src/features.js` `commands` grows
  from five to six. The ticket id is resolved from the invocation; `doing` + `work_id` after the branch is
  confirmed; `ticket:` persisted into `about.md`. **A hotfix never writes `in-review`** — it opens no PR.
  - **Consumes:** `FEATURES.board` (F5), the `work_id` stop (F20)
  - **Produces:** `FEATURES.board.commands` listing six commands
- **F30** [product] — `commands/add.hotfix.md`: three anchors — STEP 1 (resolve), STEP 3 (after
  `git branch --show-current` confirms), STEP 12 (persist `ticket:`). **Must NOT lose:** STEP 3's gate that
  the branch exists before investigation.
  - **Consumes:** the `board:*` section names for `add.hotfix` (F29)
- **F31** [internal] — `workbench/skills/add-plan-authoring/SKILL.md` § The Ticket: two write rows become
  seven, plus the phase check, the `work_id` stop, and the internal two-outcome rule for `in-review`.
  **`add-framework--build` STEP 9 is a question** — on "no" the close-out opens and merges in one run, so
  `in-review` is never written. **Must NOT lose:** the declared-never-inferred rule or the reading-one-ticket
  recipe.
  - **Consumes:** the phase check and the `work_id` stop (F20)
  - **Produces:** the seven-row internal write table, naming the same seven statuses F20 names
- **F32** [internal] — `workbench/skills/add-framework--brainstorm/SKILL.md`: `refining` after `2.2.2`,
  `shaped` at `7.3`. Nothing on `spike`.
  - **Consumes:** the seven-row table (F31)
- **F33** [internal] — `workbench/skills/add-framework--plan/SKILL.md`: `planning` at STEP 1.2, `planned` at
  its report step.
  - **Consumes:** the seven-row table (F31)
- **F34** [internal] — `workbench/skills/add-framework--build/SKILL.md`: `in-review` at its report step,
  reading STEP 9's answer. `doing` at 5.1 unchanged.
  - **Consumes:** the seven-row table (F31)
- **F35** [internal] — `docs/backlog.definitions.json`, this repository's own file, hand-edited for the
  internal flow. **Only after confirming nothing else consumes it, CI included** — it is tracked in git and
  is the live file this repository's board reads. ⛔ **This is a hand-edit, not a script write**, so the
  Global Constraint forbidding a write to an existing definitions file does not cover it — that constraint
  binds `backlog.sh`, and L1.7 and L3.2 guard it. Proven by **L11.6**.
- **F36** [product] — the count literals and the graph totals bumped again for `add.hotfix`'s fragment and
  the new sections, at the sites F16 and F17 named. **The build greps rather than trusting a list.**
  - **Consumes:** the six fragments' final section names (F21, F23, F25, F27, F29)

⛔ **`add-framework--done` gets no F-block.** Its STEP 8 already writes `done`, and the deferred-PR path
deliberately writes no `in-review`.
⛔ **`fragments/board/add.done.md` gets no F-block.** `done` already moved in checkpoint 2.

## Validation Matrix — Checkpoint 3

### L8 — The phase check and the `work_id` stop (RED → GREEN)

1. **A three-subfeature epic**, walked end to end: `add.new` writes `refining` then `shaped`; SF1 `add.plan`
   writes `planning` then `planned`; SF1 `add.build` writes `doing`+`work_id` then `in-review`; **SF2 and
   SF3 write nothing**; `add.done` writes `done`. *RED today: only two writes exist.*
2. `add.brainstorm` then `add.new` on one ticket: `add.new`'s entry write is **skipped**, because the ticket
   already reads `shaped`. The board never moves backwards.
2b. **`add.new` STEP 2 sets `status` and `feature` in ONE write**, and the ticket carries `feature` while
   `work_id` is still `null`. *RED today: neither field is written by `add.new`.*
2c. **Setting `work_id` at `add.new` would block `planning`** — asserted as the reason the ban exists: with
   `work_id` set early, the `work_id` stop suppresses `add.plan`'s write. The assertion proves the stop reads
   `work_id` and nothing else.
3. `add.plan` re-run before any build writes nothing the second time.
4. `add.build` resumed writes nothing.
5. `add.done`'s Resume route writes nothing.
6. A `spike` writes nothing at all.

### L9 — Outcome-guarded writes

1. `in-review` is written on `pr-opened` and on `pr-updated`. *RED today.*
2. `in-review` is **not** written on `on-main`, `no-gh — pushed` or `declined — local merge`.
3. A hotfix goes `open` → `doing` → `done` with four phases skipped and **no refusal**.
4. Internally, `in-review` is written when `add-framework--build` STEP 9 is answered yes, and **not** when
   it is answered no. *Covers F34.*
5. Internally, `add-framework--brainstorm` writes `refining` after `2.2.2` and `shaped` at `7.3`, and writes
   **nothing** on `spike`. *Covers F32. RED today: it writes nothing at all.*
6. Internally, `add-framework--plan` writes `planning` at STEP 1.2 and `planned` at its report step.
   *Covers F33. RED today: it writes nothing.*

### L10 — Degradation, per write

1. Each of the seven writes, refused or degraded, produces **one line in its own command's final report**
   and **does not stop the command**. *RED today: the rule covers two writes.*
2. `add.plan` makes two writes; a run where both fail reports **two** lines.
3. `BACKLOG_PRESENT=no` produces no write and no line.

### L11 — Reference integrity

1. `phases.md` carries the model and **no write table**; `lifecycle.md` carries the procedure and points at
   `phases.md` for the model. A write table in `phases.md` is the sign the split failed.
2. **No `board` fragment section restates a `lifecycle.md` row.** Anchor and pointer only.
3. The word "hook" appears nowhere in `lifecycle.md`.
4. `node scripts/build.js` exits 0; the resource-path lint emits no new warning for `{{skill:…}}` targets.
5. **The internal and product phase maps agree.** The seven statuses named in `add-plan-authoring`
   § The Ticket (F31) are exactly the seven named in `lifecycle.md` (F20) and declared in `phases.md` (F19)
   — same names, same entry/exit pairing, same `work_id` stop. **This is the check that makes the drift risk
   verifiable**, on the pattern L1.6 uses for `DEFAULT_DEFS` against the reference. *RED today: the internal
   table names two.*
6. **F35's edit is diffed and recorded.** This repository's `docs/backlog.definitions.json` after the edit
   holds the nine statuses and the seven columns, the file parses, and `backlog.sh list --all` still returns
   every ticket already on the board with no `UNDEFINED_STATUS` line. *Covers F35. RED today: four statuses.*

### L12 — Build and suite

1. `npm test` passes. 2. `build-artefact-graph.test.js` passes with the new `phases.md` and hotfix fragment
nodes. 3. `node scripts/build-workbench.js` exits 0 for the internal F-blocks.

**RED today:** L8, L9, L10, L11.1–L11.3, L11.5, L11.6. **Regression guards:** L11.4, L12.

## Execution Order — Checkpoint 3

F19 → F20 → (F21→F22) → (F23→F24) → (F25→F26) → (F27→F28) → (F29→F30) → F31 → F32 → F33 → F34 → F35 → F36.

**F19 and F20 first** — every fragment points at them. **The five fragment/command pairs stay atomic**, as
in checkpoint 2. **F31 before F32–F34** — the three stages consume its table.

⛔ **F35 is the only F-block that changes live state in this repository.** It is last among the internal
blocks so that a build stopping earlier leaves this repository's own board working on four columns.

---

# Checkpoint 4 — the board

**When this checkpoint is done:** the board groups by column and badges each card with its status, `dropped`
is out of the way by default and overridable in the URL, and the skeleton matches the shipped default.

## Scope — Checkpoint 4

- **F37** [product] — `board/server.mjs`: `readDefs()` carries `column` and `label` through; a sibling read
  carries the `columns` array **with each entry's `label` and `hidden`** — the mapper is an allowlist and
  drops what it does not name; `boardPayload()` returns `columns`, derived when absent, with today's
  no-definitions-file path preserved. **Must NOT lose:** zero dependencies, `127.0.0.1`, and never parsing
  `docs/backlog.jsonl`.
  - **Produces:** `/api/board` carries `columns`, and each status carries `column` and `label`
- **F38** [product] — `board/src/api/types.ts`: a new `Column = { name, order, label?, hidden? }`; `Status`
  gains optional `column` and `label`; `BoardData` gains `columns: Column[]`; **`Ticket` gains
  `feature: string | null`**, alongside the `work_id` it already carries.
  - **Consumes:** `/api/board` carries `columns` (F37)
  - **Produces:** the `Column` type, carrying `label` and `hidden`
- **F39** [product] — `board/src/lib/tickets.ts`: a column grouping **wrapping** `groupByStatus`, which is
  kept — its per-status grouping is what the card badges need. **Three distinct markers** for an unknown
  status, an unknown column and an absent column.
  - **Consumes:** the `Column` type (F38)
  - **Produces:** the column grouping, with its three failure markers
- **F40** [product] — `board/src/views/board-view.tsx`: the `Column` component, the mobile tab bar and the
  desktop layout keyed by **column**; the status badge moved onto the card; `QUIET` moved from per-column to
  per-card. **Must NOT lose:** F18's status-by-shape, F1's tokens, F5/F8's priority rank as the card's one
  bold element.
  - **Consumes:** the column grouping (F39)
- **F41** [product] — `board/src/components/states.tsx`: `BoardSkeleton`'s `[0,1,2,3]` becomes **the shipped
  default's visible count, six — a literal, not a derived value.** It is the router's `pendingComponent` and
  renders before any payload exists.
- **F42** [product] — `board/src/lib/search.ts` and `board/src/components/filter-bar.tsx`: a `column` list
  param, **an additive union with the default-visible set, not an override list**, and `hidden: true` as the
  default it overrides. The "show dropped" control writes the single value `dropped`. **Must NOT lose:** the
  URL-as-source-of-truth convention (`filter-bar.tsx:28-33`).
  - **Consumes:** `hidden` on a column (F37)
- **F43** [product] — `board/test/server.test.ts`, `board/test/tickets.test.ts`, `board/e2e/fixture.ts` and
  `board/e2e/board.spec.ts`: the assertions below.
- **F44** [product] — `board/src/components/ticket-card.tsx` and `board/src/views/ticket-sheet.tsx`: render
  `feature` alongside the `work_id` they already show. The card shows it from `add.new` onward; the sheet's
  detail list gains a `Feature` row beside its existing `Work` row, falling back the way `Work` already falls
  back to "Not picked up". **It renders the id, never a path** — the path carries the renameable slug, the id
  does not. **Must NOT lose:** the priority rank as the card's one bold element (F5/F8 of the palette
  delivery).
  - **Consumes:** the ticket carries `feature` from `add.new` STEP 2 onward (F23)
  - **Consumes:** `Ticket.feature` (F38)

## Validation Matrix — Checkpoint 4

### L13 — Server round trip (RED → GREEN)

1. **One assertion per field** — `column` and `label` survive on a status; `label` and `hidden` survive on a
   column. *RED today: the allowlist mapper drops all four.* A single "the new fields survive" assertion
   would pass with three of four.
2. `columns` present in the file is used as written, sorted by `order`.
3. `columns` absent derives one column per distinct status `column` value, in the statuses' `order` order.
4. No definitions file at all still yields today's rendering — statuses from first-seen ticket order, each
   its own column. *Regression guard.*

### L14 — Grouping and failure modes

1. A ticket whose **status** is not in `statuses` still gets the trailing `undefined: true` group and the
   fallback dot. *Regression guard.*
2. A status whose **`column`** is not in `columns` produces a trailing **column**, marked undefined.
3. A status with **no `column`** falls back to its own `name`. All three are distinguishable.

### L15 — View and URL

1. `BoardSkeleton` renders **six** columns, matching the shipped default's visible count. *RED today: four.*
2. `?column=dropped` renders the six default-visible columns **plus** `dropped` — additive, not an override.
3. With no `column` param, a column carrying `hidden: true` does not render.
4. A `column` param survives a reload — it is URL state, not `useState`.
5. `QUIET` dims by **card**, so a column holding `in-review` and `done` dims only the `done` cards.
6. **A ticket in `shaped` with `work_id: null` shows its `feature` on the card and in the sheet**, and the
   sheet still shows `Work: Not picked up`. The two are distinct rows. *RED today: there is no `feature`.*

### L16 — Layout, the F13 boundary

1. `noSidewaysScroll` passes at all three viewports **at the real seven-column count**. *RED expectation
   unknown — this is the measurement, not a prediction.*
2. **If L16.1 fails, the build reports it and STOPS.** ⛔ It does not re-open F13's equal-share sizing,
   which was reverted twice on 2026-09-23 by a user looking at a real board. The user then chooses: fewer
   shipped columns, or a layout change as its own delivery.
3. `--s-*` tokens, `[data-status="…"]` selectors, `StatusGlyph`'s shapes and `StatusPill` are **unchanged**.
   *Regression guard.*

### L17 — Suite

1. `npm --prefix board test` passes (`tsc -b --noEmit && vitest run`). 2. The root `test:board` passes.

**RED today:** L13.1–L13.3, L14.2–L14.3, L15.1–L15.5. **Regression guards:** L13.4, L14.1, L16.3, L17.
**L16.1 is a measurement**, and the plan does not predict its outcome.

## Execution Order — Checkpoint 4

F37 → F38 → F39 → F40 → F41 → F42 → F44 → F43.

**F44 before F43** — F43 carries the assertions, and L15.6 asserts what F44 renders.

Strictly sequential: each consumes the one before. **The board is visibly broken between F39 and F40** —
the grouping changes shape before the view reads it — so a build that must stop stops **before F39 or after
F40**, never between.

---

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| One delivery or four? | **One branch, one PR, four checkpoints** | User instruction, 2026-09-23. Also the only shape where the `work_id` stop works — four plans are four `work_id` values |
| How does a phase become expressible? | Four optional keys with declared fallbacks | design 001 |
| How do existing installs get the new statuses? | They do not exist. `DEFAULT_DEFS` ships the shape | umbrella, "The premise"; user instruction, 2026-09-23 |
| Is L3.2 `DEFS_PRESERVED` reversed? | No. It stays and stays true | design 001 |
| What does "reserved" mean? | A documented contract, never enforced in code | design 001 |
| Feature default? | `false` | design 002; user instruction, 2026-09-23 |
| What is gated? | Everything gateable — the six commands' instructions. The skill, the scripts and `workbench/` cannot be | umbrella, "What 'everything board-related' can and cannot reach" |
| `add.build.md:153`? | Out of the numbered list; the two cross-references name the work, not the position | design 002 |
| How is a fifteen-site move verified? | Two halves — nine byte-identical, six semantically equivalent | design 002 |
| What stops an epic running the board backwards? | The `work_id` stop | design 003 |
| Where does an exit write stand? | The command's final report step | design 003 |
| Does a fragment restate the procedure? | Never. Anchor and pointer only | umbrella |
| Where does the shared knowledge live? | `phases.md` (model) + `lifecycle.md` (procedure), both under `add-backlog`. No new top-level skill | umbrella; user instruction, 2026-09-23 |
| How does a ticket point at its feature before the build starts? | A fourteenth field, `feature`, written by `add.new` in the same write as `refining`. It holds the id, never a path | User decision, 2026-09-23. `work_id` cannot double as the pointer — the `work_id` stop reads it |
| Column count vs F13? | Measured by `noSidewaysScroll`, reported, never re-decided here | design 004 |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A board that says which phase a ticket is in and whether anyone is in it | Two commits per ticket becomes seven, on the base branch |
| A project with no board carries none of the text | Fifteen instruction sites live one indirection away from the command |
| One `work_id` for the whole delivery, so the ticket history is coherent | A long branch — four checkpoints before the PR |
| `add.hotfix` on the board for the first time | — |
| Every existing `backlog.bats` assertion intact | Six prose sites read differently for every reader |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| **A moved block changes meaning** — fifteen sites, six rewritten | High | **L7.1** byte-diffs the nine; **L7.2** dispatches `@prompt-review-agent` over the five commands for the six |
| **A skipped write leaves the ticket a column behind and nobody is told** | High | Accepted — the board goes coarse, never wrong. **L10** makes a miss visible in the run it happened in. A `status.sh` drift signal is named out of scope |
| The count literal is missed at one of five sites | High | **F16** and **F36** grep; **L4.4** asserts the four suites agree |
| `build-artefact-graph.test.js` totals not bumped | High | **F17**, **F36**, and **L5.2** / **L12.2** run the suite |
| **Seven columns break the equal-share layout F13 landed on** | High | **L16.1** is the gate and **L16.2** says the build reports and stops. F13 is a Global Constraint |
| A builder re-introduces the definitions-file injection | Medium | **L1.7** and **L1.8**; L3.2 standing unchanged is the check |
| A `board` marker shares an anchor with a `tdd-pipeline` or `qa-pipeline` marker | Medium | **L6.2**; F11 and F13 check each anchor and pick a different line where they collide |
| `readDefs()`'s allowlist drops one of the four new fields | High | **L13.1** — one assertion per field |
| The internal and product phase maps drift | Medium | **L11.5** asserts the seven names, the pairing and the `work_id` stop match across `phases.md`, `lifecycle.md` and `add-plan-authoring` — the L1.6 pattern applied to the two layers. Landing both in one checkpoint is the schedule, not the check |
| A fragment section restates the procedure | Medium | **L11.2**, and it is a Global Constraint |
| `DEFAULT_DEFS` and `backlog.md` drift | Medium | **L1.6**, extending the `L1.4b` pattern |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/backlog.sh` | product | modify | F1 |
| `add-doc-schemas/references/backlog.md` | product | modify | F2 |
| `add-backlog/references/lifecycle.md` | product | modify | F3, F20 |
| `add-backlog/references/phases.md` | product | create | F19 |
| `framwork/.codeadd/scripts/tests/backlog.bats` | product | modify | F4 |
| `cli/src/features.js` | product | modify | F5, F29 |
| `fragments/board/add.brainstorm.md` | product | create | F6, F21 |
| `fragments/board/add.new.md` | product | create | F8, F23 |
| `fragments/board/add.plan.md` | product | create | F10, F25 |
| `fragments/board/add.build.md` | product | create | F12, F27 |
| `fragments/board/add.done.md` | product | create | F14 |
| `fragments/board/add.hotfix.md` | product | create | F29 |
| `commands/add.brainstorm.md` | product | modify | F7, F22 |
| `commands/add.new.md` | product | modify | F9, F24 |
| `commands/add.plan.md` | product | modify | F11, F26 |
| `commands/add.build.md` | product | modify | F13, F28 |
| `commands/add.done.md` | product | modify | F15 |
| `commands/add.hotfix.md` | product | modify | F30 |
| `cli/tests/injection-exclusivity.integration.test.js` | product | modify | F16, F36 |
| `cli/tests/delivery-index.test.js` | product | modify | F16, F36 |
| `cli/tests/loop-consolidation-0070.test.js` | product | modify | F16, F36 |
| `cli/tests/build-artefact-graph.test.js` | product | modify | F17, F36 |
| `cli/tests/board-feature.test.js` | product | create | F18 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F31 |
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | F32 |
| `workbench/skills/add-framework--plan/SKILL.md` | internal | modify | F33 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F34 |
| `docs/backlog.definitions.json` | internal | modify | F35 |
| `board/server.mjs` | product | modify | F37 |
| `board/src/api/types.ts` | product | modify | F38 |
| `board/src/lib/tickets.ts` | product | modify | F39 |
| `board/src/views/board-view.tsx` | product | modify | F40 |
| `board/src/components/states.tsx` | product | modify | F41 |
| `board/src/lib/search.ts` | product | modify | F42 |
| `board/src/components/filter-bar.tsx` | product | modify | F42 |
| `board/src/components/ticket-card.tsx` | product | modify | F44 |
| `board/src/views/ticket-sheet.tsx` | product | modify | F44 |
| `board/test/server.test.ts` | product | modify | F43 |
| `board/test/tickets.test.ts` | product | modify | F43 |
| `board/e2e/fixture.ts` | product | modify | F43 |
| `board/e2e/board.spec.ts` | product | modify | F43 |

## Does NOT Include (important!)

- **Any migration in `cli/src/migrations.js`, and any injection into an existing definitions file.**
- **Any change to `backlog.bats` L3.2 `DEFS_PRESERVED`, L3.2b, L3.6, L1.4 or L1.4b.**
- Any enforcement of the reserved names in the script.
- **Transition validation of any kind** — it is what lets `add.hotfix` jump.
- Any platform hook. Every write is a STEP the agent runs.
- Moving `doing` and `done` into `build-setup.sh` and `done.sh --merge` — possible, recorded, not now.
- **A drift signal in `status.sh`** for a write the agent skipped. Right idea, its own delivery.
- Batching the seven writes into fewer commits.
- Any change to `backlog-commit.sh`, `next-id.sh`, `injection-core.js` or `build.js`'s marker handling.
- Gating `lifecycle.md`, `phases.md`, `add-backlog` or anything in `workbench/` — the registry has no
  `skills` key and the workbench has no feature system.
- **A ticket that spans a plan set** — this delivery is one plan, so the case does not arise here.
- **One ticket per subfeature.** An epic's ticket tracks the epic.
- Re-opening F13's equal-share sizing, or any `data-column` styling axis.
- Grouping by theme — the other half of the palette delivery's Checkpoint 3.
- Any write path from the board app. It stays read-only.
- `AGENTS.md`'s Feature Injection System table — a documentation sweep, not this delivery's work.
- `add.review`, `add.pull-request`, `add.audit` and `add.diagnose` write nothing to the board.

---

## Reviewer Handoff

For each F-block the build leaves, in the evidence file:

- **What changed** — files touched, with the F-block id and its checkpoint.
- **Which validation levels cover it**, and their pass state, with every regression guard marked as such
  rather than claimed as a RED→GREEN.
- **The counted section total** after checkpoint 2, and again after checkpoint 3, with any merged sites named.
- **The pre-checkpoint built output** the L7.1 diff was taken against.
- **L16.1's measured result** at all three viewports, whatever it was.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. **A fragment section that restates a `lifecycle.md` row instead of pointing at it.** The easy thing to do
   when a moved block looks short in its new file, and the failure the reference exists to prevent.
3. **Any code path that writes a definitions file which already exists**, or a weakened L3.2.
4. **A command left with a numbering gap**, or an instruction still naming "STEP 2 item 5".
5. **A sixth count-literal site** the grep found and F16/F36 did not bump.
6. A reworded site that quietly dropped a `⛔ DO NOT` line — the six rewrites are where a constraint goes
   missing with no test noticing.
7. **An `in-review` write not guarded by STEP 17's outcome**, or an exit write left at a mid-command anchor.
8. **A second branch or a `/add-framework--done` run between checkpoints.** This is one delivery.

## References

- Design set: `docs/brainstorming/2026-09-23T164422-board-pipeline-phase-statuses-{000-umbrella,001-model-and-script,002-the-feature-gate,003-the-seven-writes,004-the-board,intent}.md`
- Prior art: `2026-09-20T111051-PLAN--project-backlog-001-format-and-script` (the script, the format, the six
  `REFUSED=` names) · `2026-09-21T134430-PLAN--backlog-board-001-internal-backlog-migration` (the definitions
  file and the never-rewritten ban this plan keeps) · `2026-09-21T145331-PLAN--backlog-board-002-board-app`
  (the board and `/api/board`) · `2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle` (the
  per-stage write table this plan grows) · `2026-09-23T122713-PLAN--board-design-palette-and-hierarchy` (F13,
  F18, the rank-as-bold-element, and the multi-checkpoint-on-one-branch shape this plan follows)

---

## Next Steps

/add-framework--build board-pipeline-phase-statuses

## Plan Changelog

| Date | Change |
|---|---|
| 2026-09-23 | **Implemented** in `9d72c18..0992e39` (39 commits on `feat/board-pipeline-phase-statuses`): F1–F49 plus F43a. At the L16.2 stop the user chose to ship six columns with the row scrolling at 1080px; the layout follow-up is ticket 0008B. Changelog `docs/changelog/2026-09-23T235502-add-board-pipeline-phase-statuses.md` |
| 2026-09-23 | The `feature` field (F1, F2, F23, F38, F44) added after the user asked how a ticket stays linked to its feature. `work_id` could not be moved earlier: the `work_id` stop reads it, so setting it at `add.new` would suppress `add.plan`'s `planning` write |
| 2026-09-23 | Initial creation. Four checkpoints on one branch, at the user's instruction — an earlier draft split them into four plan documents, which would have produced four `work_id` values and a ticket bouncing backwards between phases |

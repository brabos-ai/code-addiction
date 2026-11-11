# Brainstorm: The feature gate

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-23
> **Type:** architecture
> **Ticket:** 0005B
> **Set:** `2026-09-23T164422-board-pipeline-phase-statuses-000-umbrella.md`, subtopic 002

## Objective

Today the board can only say whether a ticket was decided, is in progress, or is finished. When this is
done, a ticket's status says **which pipeline phase it is in and which command takes it out of there** —
and every pipeline command writes its own phase, without any of them stopping because of the board.

**Serves the objective by** making every command able to write its own phase without every project paying
for it — seven writes and their instructions arrive in five commands, and a project with no board should
carry none of that text.

## Discovery

- **`cli/src/features.js:41-70`** — the `FEATURES` registry. Fields: `description`, `default`, `commands`
  (command basenames), optional `aliases`. **The registry key doubles as the fragment directory name**
  (`features.js:34-39`, and `getFragments` at `:142-154` joins `.codeadd/fragments/<key>`).
- **`applyEnabledFeatures(cwd)`** (`features.js:241-270`) runs after install and upgrade, with no prompt, and
  enables every feature whose state resolves true — `default: true` included. `resolveFeatureState`
  (`:98-108`) checks the explicit manifest key before the default, **so a user's `false` survives every
  upgrade** (`cli/tests/features.test.js:149-157`).
- **`enableFeature`** (`features.js:162-195`) injects, sets `manifest.features[name] = true`, normalises,
  recalculates hashes, writes. **`disableFeature`** (`:203-235`) is the exact inverse.
- **`cli/src/injection-core.js:26-34`** — a fragment's sections are
  `<!-- section:NAME -->…<!-- /section:NAME -->`. `insertBlockAfterAnchor` (`:104-126`) is idempotent;
  `removeBlockAfterAnchor` (`:138-152`) is its inverse, and enable→disable round-trips byte-identical
  (`features.test.js:361-375`).
- ⛔ **`scripts/build.js:148-182`, `assertEmptyMarkerPairs`** — a command-side
  `<!-- feature:NAME:SECTION -->` pair **must be empty**. Non-whitespace between open and close throws
  `Non-empty injection pair … marker pairs must be empty` (`:176-180`); an unmatched open throws
  `Unbalanced injection marker` (`:172-175`).
- **`scripts/build.js:184-261`, `extractInjectionPoints`** — anchors each open marker to the nearest
  surviving non-blank line by trimmed text plus occurrence ordinal. `stripHtmlComments` (`:78-85`) then
  removes every marker, so installed files ship marker-free. `SIDECARS` at `:2038`.
- **Fragment conventions**, from `fragments/docs-pruning/add.done.md` and `fragments/qa-pipeline/add.build.md`:
  no frontmatter; an optional `<!-- uses: -->` block of the fragment's own; kebab-case section names
  matching the marker's third field; `{{skill:…}}` for resources; several independently-gated sections per
  file are normal.
- **`framwork/provider-map.json` needs nothing.** Fragments are discovered from disk; `build.js` never reads
  the fragments directory, and marker extraction is namespace-agnostic.
- **`cli/tests/injection-exclusivity.integration.test.js`** — asserts the sidecar, the fragments and the
  catalog declare **the same 46 substitutions**, with the literal `46` hardcoded **twice** (`:326`, `:436`)
  and a changelog comment tracking every bump (`:313-320`). It also asserts the registry's `commands` match
  the fragment files one to one (`:334-339`) and runs an enable/disable/re-enable round trip per feature over
  the real built files (`:377-403`), iterating `Object.keys(FEATURES)`.
- **`cli/tests/features.test.js:130-135`** — every registry key must have a matching fragment directory in
  the source tree.
- **`cli/tests/product-pipeline-parity.test.js`** — reads four of the five commands and pins prose, but
  **none of its assertions touch the ticket or backlog text**. It pins `/[Dd]raft the objective/` (`:111`)
  and the `semi-automatic`/`serves` regexes (`:139-140`), none of which overlaps a block moved here.
- **Delivery index (`history`)** — nothing `gone`, nothing `superseded`. `add-backlog` is `live` from
  `2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename`.

## Context & Motivation

The user's requirement is one sentence: the ticket instructions should be in the commands only when the
board feature is on. The mechanism to do that already exists and is well tested. What makes this a subtopic
of its own is that **the instructions cannot be gated where they stand.** A command-side marker pair must be
empty, and several of the fifteen sites are a clause inside a shared sentence or an item inside a numbered
list. Gating them means rewriting them.

Doing that once, over everything that exists today, is the whole point of putting this before subtopic 003.
With the gate last, 003 writes five new instructions into command bodies and this subtopic then moves all
fifteen out — the same files edited twice, the second pass rewriting what the first just landed.

## Problem / Opportunity

1. **Nothing can be gated in place.** The marker pair is empty by build-time assertion, so every gated line
   moves to a fragment.
2. **Two sites are structurally entangled**, and they are the real work:
   - **`add.build.md:153`** is item **5 of 6** in STEP 2's numbered list. Gate it and the source the agent
     reads has a numbering gap, 4 → 6. Worse, `add.build.md:1500-1502` and `:1507-1509` refer to it as
     "STEP 2 item 5" **by position**, so the numbering is load-bearing across 1,350 lines.
   - **`add.new.md:142`** is a sub-clause inside numbered item 3, which also does unrelated work (creating
     the skeleton `about.md`).
3. **Four more sites are clauses inside shared sentences** — `add.brainstorm.md:435-438`,
   `add.plan.md:620-625`, `add.build.md:1500-1502`, `:1507-1509`. A sentence cannot be half-injected.
4. **The `uses:` declarations point the wrong way after the move.** All five commands declare
   `- skill: add-backlog` and `- skill: add-backlog/references/lifecycle.md`, and `add-backlog` is named
   nowhere else in them. Left behind, a command with the feature off declares a dependency it does not have.
5. **A hardcoded count fails on purpose.** `46`, twice, in one file.

## Proposed Solution

### The registry entry

```js
board: {
  description: 'Backlog board (pipeline commands read a ticket and move it through the phase statuses)',
  default: false,
  commands: ['add.brainstorm', 'add.new', 'add.plan', 'add.build', 'add.done'],
},
```

**`default: false`, and the reason is that there is nothing to preserve.** Nobody is using the board in a
project. The earlier draft argued for `true` on one sentence — that `add.build` and `add.done` write today
and turning it off would silently remove that — and with no installed base that sentence is empty.

`false` also matches what the flag gates. The board app ships as a separate release asset, so a fresh
install has no board, no `docs/backlog.jsonl` and no reason to carry fifteen blocks of ticket instruction
across five commands. It joins `qa-pipeline` and `docs-pruning` as opt-in; `tdd-pipeline` stays the only
`default: true` feature.

⛔ **Enabling it is one command:** `codeadd features enable board`.

⛔ **`add.hotfix` is NOT in this list.** It carries no ticket instruction today, and the registry's
`commands` must match the fragment files one to one. It joins in subtopic 003, with its fragment.

### A fragment carries an anchor and a pointer, never a procedure

Every section moved here already points at `{{skill:add-backlog/references/lifecycle.md}}` rather than
restating it — that is how the five commands are written today, and the move must not change it.

```
IF A MOVED BLOCK LOOKS SHORT IN ITS FRAGMENT:
  ⛔ DO NOT: Fill it out by copying the reference row it points at
  ✅ DO: Leave it short. The pointer is the content
```

⛔ **This subtopic creates no new reference.** `phases.md` is subtopic 003's, written when the model it
carries exists. Here the fragments point where the commands already point.

### The fifteen sites, and what happens to each

| Command | Site | Shape today | What this subtopic does |
|---|---|---|---|
| `add.brainstorm` | `:114-117` | a bullet inside a three-item context list | Whole bullet moves. The list keeps two items |
| | `:386` | its own paragraph | Moves as it stands |
| | `:435-438` | **a clause inside a report-contents sentence** | The sentence is rewritten so the ticket part becomes its own trailing line, which moves |
| | `:485-487` | its own paragraph | Moves as it stands |
| `add.new` | `:77` | **a row inside a three-row table** | The whole row moves; the marker pair sits outside the table, and the table stays contiguous with two rows |
| | `:142` | **a sub-clause inside numbered item 3** | The clause comes out of item 3. Item 3 goes back to creating the skeleton |
| | `:144-151` | its own `IF` block | Moves as it stands |
| `add.plan` | `:211-217` | its own paragraph | Moves as it stands — the cleanest site in the set |
| | `:620-625` | **a clause inside the header-assembly paragraph** | Rewritten into its own trailing line, which moves |
| `add.build` | `:153` | **item 5 of 6 in STEP 2** | **Comes out of the numbered list entirely** — see below |
| | `:1500-1502` | **a clause referring to "STEP 2 item 5"** | Rewritten to name the work, not its position, then moves |
| | `:1507-1509` | **the same, in the metadata sentence** | Same treatment |
| `add.done` | `:993-1008` | its own H3, `### 8.3 Close the Ticket` | Moves as it stands |
| | `:1013` | its own bullet | Moves as it stands |
| | `:1047-1049` | its own bullet | Moves as it stands |

### `add.build.md:153` — the one that needs a decision, not a move

The numbered item leaves the list and becomes an unnumbered aside directly after it, and the two later
references stop naming a position.

```
⛔ DO NOT: Leave a gap — STEP 2 reading 1, 2, 3, 4, 6 with the feature off
⛔ DO NOT: Renumber 6 to 5, which makes the item's number depend on a flag
⛔ DO NOT: Keep "STEP 2 item 5" in the report instructions at :1500 and :1507
✅ DO: Take the ticket work out of the list, as an aside after item 6, and refer to it by name
```

**Position-based cross-references are what make this unsafe**, not the gap itself. A numeral the agent reads
as 4, 6 is untidy; an instruction at line 1,500 pointing at "item 5" that the flag removed is wrong. Naming
the work instead of its position fixes both and is the smaller change.

### The `uses:` lines move into the fragments

Each of the five fragments opens with its own `<!-- uses: -->` block carrying:

```
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
```

and those two lines come out of the five commands' own blocks. The graph then reads
`fragment → add-backlog` and `fragment → command`, which is what is actually true: with the feature off,
the command does not use the skill.

⛔ **This is the umbrella's earlier claim, corrected.** It said the `uses:` line stays because a marker
cannot nest inside the block. The premise is right and the conclusion was wrong — a fragment has a `uses:`
block of its own, so the declaration moves rather than staying.

### The count literal — five sites, three files

⛔ **`46` is not asserted twice in one file. It is asserted five times across three files**, and a bump that
covers only the first file leaves three assertions failing on files this subtopic would otherwise never
name:

| File | Line | Assertion |
|---|---|---|
| `cli/tests/injection-exclusivity.integration.test.js` | `:326` | `expect(points).toHaveLength(46)` |
| | `:327` | `expect(all).toHaveLength(46)` — a separate assertion, one line below |
| | `:436` | `expect(features.length + plugins.length).toBe(46)` |
| `cli/tests/delivery-index.test.js` | `:137` | `expect(SIDECAR().points).toHaveLength(46)` |
| `cli/tests/loop-consolidation-0070.test.js` | `:105` | `expect(sidecarPoints()).toHaveLength(46)` |

```
IF BUMPING THE SUBSTITUTION COUNT:
  ⛔ DO NOT: Trust the table above as the complete list
  ✅ DO: grep 'toHaveLength(46)\|toBe(46)' over cli/tests/ first, and bump what it returns
```

**The table is what is true today; the grep is what makes it true at build time.** A sixth site added
between now and the build would be invisible to a plan copying this list.

One changelog comment line is appended in the exclusivity file's own convention
(`46 -> N: board adds … sections across five commands`). **The plan counts the sections; this document
deliberately does not**, because merging two adjacent sites into one section is a plan-time call and a
number written here would be copied without being counted.

### The graph-total snapshot

**`cli/tests/build-artefact-graph.test.js` asserts exact node and edge totals**, per kind, with a changelog
comment tracking every prior bump — the same pattern as the substitution count. Five new fragments are five
new nodes of a **declaring** kind (`fragment` is in `DECLARING_KINDS`, `build-artefact-graph.test.js:354-365`),
each carrying its own `add-backlog` skill and reference edges, plus one `INJECTS_INTO` edge per section.

```
IF ADDING A FRAGMENT:
  ⛔ DO NOT: Copy a total from this document — read the current ones from the file
  ✅ DO: Bump the node total, the declaring-node total and the per-kind counts, and append the changelog line
```

⛔ **This document names no number here on purpose.** The totals move with every delivery, and a stale
figure copied from a brainstorm is worse than no figure: it looks checked.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Gate only `add.build` and `add.done`** — the umbrella's first shape | The other three commands keep ungated ticket reads, so subtopic 003 gates them. Two passes over the same five files, and the `uses:` move and the numbering refactor happen in whichever pass remembers |
| **Duplicate the entangled sentences** — an "off" variant in the command, an "on" variant in the fragment | Two copies of one sentence, drifting. The `qa-pipeline` comment in `features.js` records what happens when a flag means two things |
| **Accept the 4 → 6 numbering gap** | Tolerable on its own. Not tolerable with two instructions 1,350 lines away pointing at "item 5" |
| **Renumber item 6 to 5 when the feature is off** | The item's number would depend on a flag. Nothing in the build can do it, and no reader should have to |
| **`default: true`** | It was right only while an installed base had to be preserved. There is none, and a project with no board would carry fifteen blocks for nothing |
| **Leave the `uses:` lines in the commands** | A disabled command declaring `add-backlog` is a graph edge asserting a dependency that is not there |

## Type of Artefact

architecture — the CLI feature registry, five new fragments, five command sources and two test suites.

## Scope

### Includes

- `FEATURES.board` in `cli/src/features.js`: `default: true`, five commands, no alias.
- `framwork/.codeadd/fragments/board/{add.brainstorm,add.new,add.plan,add.build,add.done}.md`, each with its
  own `<!-- uses: -->` block and one section per gated site.
- Empty marker pairs in the five command sources, at the anchor each moved block leaves behind.
- The two `- skill: add-backlog…` lines removed from the five commands' `uses:` blocks.
- The prose refactor at the four sentence-embedded sites and the two numbered-item sites.
- `add.build`'s STEP 2 item 5 out of the numbered list, and the two "STEP 2 item 5" references renamed.
- The substitution-count literal bumped at **all five sites across three files** — listed above, and
  confirmed by grep before the number is frozen — with the changelog comment line.
- `cli/tests/build-artefact-graph.test.js`: the node total, the declaring-node total and the per-kind counts
  bumped for five new `fragment` nodes and their edges, plus its changelog line. **Read the current totals
  from the file; this document names none.**
- A new `cli/tests/` suite: enable → disable → re-enable over the five real built commands, the five
  fragments' sections all present, the commands marker-free after build, and `add-backlog` absent from a
  disabled command's text.

### Does NOT Include

- **Any new status, any new write, any behaviour change.** The acceptance criterion has **two halves**, and
  collapsing them into "reads exactly as today" is wrong in both directions — it would reject a correct
  delivery for rewording what this subtopic says to reword, and wave through a real drift at one of the six
  sites where a difference is already expected:

  | The nine verbatim sites | The six reworded sites |
  |---|---|
  | **Byte-identical** in the built command with `board` enabled. Machine-diffable against the current built form | **Semantically equivalent**, judged by `@prompt-review-agent` over each of the five commands |

  The only other permitted differences anywhere are the two `uses:` lines leaving each command's block.
- `add.hotfix` — subtopic 003.
- `add-plan-authoring` or anything in `workbench/`. It has no feature system.
- `lifecycle.md`'s content. Subtopic 003 rewrites it; this subtopic only changes who points at it.
- Any change to `backlog.sh`, `backlog-commit.sh`, `docs/backlog.definitions.json` or `board/`.
- Any change to `injection-core.js`, `build.js`'s marker handling, or the sidecar's shape.
- An `aliases` entry. There is no retired name to carry.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Every ticket instruction that exists today moves, reads and writes alike | the "every command writes its own phase" half | Gating half of them leaves the other half for 003, which means editing five files twice | ✅ |
| `default: false` | the "every command writes its own phase" half | No installed base, so nothing is removed by turning it off. A fresh install has no board app and no backlog | ✅ |
| `add.build`'s ticket work leaves the numbered list | the "every command writes its own phase" half | Two instructions 1,350 lines away name it by position. A flag must not be able to invalidate a cross-reference | ✅ |
| The two later references name the work, not "STEP 2 item 5" | the same half | It is the smaller half of the same fix, and it is what makes the list position a detail again | ✅ |
| The entangled sentences are rewritten, never duplicated | the "one decision, one place" half | Two variants of one sentence drift, and the registry's own comment records what a flag meaning two things costs | ✅ |
| The `uses:` lines move into the fragments' own blocks | the "every command writes its own phase" half | A disabled command declaring `add-backlog` asserts a dependency it does not have. Fragments carry `uses:` blocks already | ✅ |
| Zero behaviour change with the feature on, as the acceptance criterion | the "the board never stops a command" half | It is what makes a fifteen-site move verifiable at all: the same assertions pass before and after | ✅ |
| `add.hotfix` joins in 003 | the "every command writes its own phase" half | The registry's `commands` must match the fragment files one to one, and it has no instruction to gate yet | ✅ |
| The section count is left to the plan | the same half | Adjacent sites may merge into one section. A number written here would be copied rather than counted | ✅ |

## Ecosystem Impact

`Called by` is from `impact --depth 1`. The fragments are new nodes; each will carry `INJECTS_INTO` its
command and `USES_SKILL` `add-backlog`.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `cli/src/features.js` | **NOT VERIFIED** (no graph node) — read directly: `applyEnabledFeatures` on install/upgrade, and the `features` CLI verbs | A fourth registry entry | required |
| `fragments/board/add.brainstorm.md` | new — will `INJECTS_INTO` `add.brainstorm` | Carries four sections | new |
| `fragments/board/add.new.md` | new — will `INJECTS_INTO` `add.new` | Carries three sections | new |
| `fragments/board/add.plan.md` | new — will `INJECTS_INTO` `add.plan` | Carries two sections | new |
| `fragments/board/add.build.md` | new — will `INJECTS_INTO` `add.build` | Carries three sections | new |
| `fragments/board/add.done.md` | new — will `INJECTS_INTO` `add.done` | Carries three sections | new |
| `add.brainstorm` | `add`, `add.new` (HANDS_OFF_TO) | Four blocks out, four empty pairs in, two `uses:` lines out | required |
| `add.new` | 11 artefacts (HANDS_OFF_TO); `plugins/gitnexus/fragments/add.new.md` (INJECTS_INTO) | Three blocks out, one table row, one numbered sub-clause refactored | required |
| `add.plan` | 21 artefacts — 9 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | Two blocks out, one sentence refactored | required |
| `add.build` | 20 artefacts — 8 commands/agents, 4 fragments (3 INJECTS_INTO), 8 skills | Three blocks out, item 5 out of the list, two cross-references renamed | required |
| `add.done` | `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`, 2 fragments (INJECTS_INTO), `add-doc-schemas`, `add-qa` | Three blocks out, the cleanest of the five | required |
| `add-backlog` | `add.brainstorm`, `add.build`, `add.done`, `add.new`, `add.plan` (USES_SKILL) | **Its five callers become five fragments.** The skill itself does not change | consequence |
| `add-backlog/references/lifecycle.md` | the same five commands plus `add-backlog` (USES_SKILL) | Same — pointed at from the fragments instead | consequence |
| `framwork/provider-map.json` | the build | **Nothing.** Fragments are discovered from disk | none |
| `injection-points.json` | `cli/src/features.js`, `plugins.js` | Gains the new points automatically; `SIDECARS` unchanged | consequence |
| `cli/tests/injection-exclusivity.integration.test.js` | not a node | The count literal at `:326`, `:327` and `:436`, plus a changelog line | required |
| `cli/tests/delivery-index.test.js` | not a node | The same count at `:137` — a file this subtopic otherwise never touches | required |
| `cli/tests/loop-consolidation-0070.test.js` | not a node | The same count at `:105` — likewise | required |
| `cli/tests/build-artefact-graph.test.js` | not a node | Node, declaring-node and per-kind totals for five new `fragment` nodes and their edges, plus a changelog line | required |
| `cli/tests/features.test.js` | not a node | Its "every key has a fragment directory" check covers `board` automatically | verify |
| `cli/tests/product-pipeline-parity.test.js` | not a node | **No assertion touches the ticket text.** Verified by grep | verify, no edit |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A project with no board carries none of the text | Fifteen instruction sites now live one indirection away from the command |
| The fifteen sites are refactored once, not twice | Six prose sites rewritten, changing how those paragraphs read |
| The graph stops asserting a dependency a disabled command does not have | — |
| `add.build`'s STEP 2 stops having a flag-dependent numbering | The item order in STEP 2 changes for every reader, board or no board |

| Risk | Probability | Mitigation |
|---|---|---|
| **A moved block changes meaning in the move** — fifteen sites, six of them rewritten | **High. This is the risk of this subtopic** | The two-half criterion above: the nine verbatim sites diffed byte-for-byte against the current built form, the six reworded ones judged by `@prompt-review-agent` over each of the five commands. A single "reads as today" check cannot grade either half |
| **The count literal is missed at one of its five sites** | High — three of the five are in files this subtopic has no other reason to open | All five are tabled above, and the plan greps `toHaveLength(46)\|toBe(46)` rather than trusting the table. The suites fail loudly, not silently |
| **`build-artefact-graph.test.js`'s totals are not bumped** | High — five new `fragment` nodes with edges, and nothing else in this subtopic points at that file | Named in Discovery, in Scope and in this table. Its totals are read from the file, never copied from here |
| A `board` marker shares an anchor line with a `tdd-pipeline` or `qa-pipeline` marker in `add.plan.md` or `add.build.md` | Medium | `groupPointsByAnchor` and the reversed insert in `injection-core.js:180-192` handle siblings, but the drift guard at `:116-121` becomes load-bearing instead of incidental. The plan checks each new anchor against the existing markers in those two files and picks a different anchor line where they collide |
| `build.js` throws `Non-empty injection pair` because a pair was left wrapping content | Medium | It is a build-time throw, so it cannot ship. Named here so it is expected rather than debugged |
| The prose refactor breaks a `product-pipeline-parity` assertion | Low — verified none touches the ticket text | The suite runs. The two pinned regexes are named in Discovery so the plan can avoid them |
| A project that DOES want the board has to enable it, and nobody tells them | Medium | The release notes and the feature list carry it. It is the same discovery path `qa-pipeline` and `docs-pruning` already have |
| A user who disabled `board` gets it re-enabled on upgrade | Low | `resolveFeatureState` checks the explicit manifest key before the default, asserted at `features.test.js:149-157` |

## Next Steps

Run: `/add-framework--plan [idea]`

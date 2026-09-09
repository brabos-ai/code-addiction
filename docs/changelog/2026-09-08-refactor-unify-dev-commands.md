# 2026-09-08 — One planner, one executor, four skills: the development loop stops splitting by layer

Implements `docs/plans/2026-09-08T210322-SELF-PLAN--unify-dev-commands.md` (internal layer,
F1–F13, plus an F14 the plan did not have). Four commands become two, the `self-` and `shared-`
sub-prefixes are retired, the root `.opencode/` adapter tree is deleted, and the instructions that
were duplicated across the four move into four skills a command loads only when the work calls for
them.

## Why

A topic touching both layers cost two plans, two builds and two contexts. The plans were tolerable.
The builds were not: `/add-framework--build` and `/add-framework--self-build` were separate sessions
with separate ledgers and no shared execution order, so two halves of one working change could not
land next to each other and the second session started blind.

The boundary that forced it was not in CI and not in `provider-map.json`. It lived in four places in
the command bodies: two prohibition blocks banning writes across the line, one plan resolver
excluding `*-SELF-PLAN--*.md`, and one Rules line routing internal work to a companion.

The boundary was already negotiated in one direction. `add-framework--build` STEP 6.3 and 6.4 wrote
`CLAUDE.md` — an internal-layer file — whenever the change was derived from what that build itself
did. A layer-aware command generalises an exception that already existed.

## The layer moves from the command to the F-block

A plan now tags every F-block `[product]` or `[internal]`, and the executor reads that tag to select
which prohibitions and which mechanics apply. The execution order can interleave the two, which is
the whole point: a script change and the command that reads it commit next to each other instead of
one being committed half-broken while the other waits for a second session.

`/add-framework--plan` classifies which layers a topic touches instead of assuming product, and its
reviewer dispatch derives `layer` from the tags — all product, all internal, or both — rather than
hardcoding one. Always sending `both` would hand the reviewer a wider lens than a single-layer plan
needs and lose the layer-boundary check.

`/add-framework--build` drops the `*-SELF-PLAN--*` exclusion from its resolver. That exclusion
existed only because a topic used to split into a paired product plan and internal plan sharing a
slug, so the glob matched two candidates and stopped. With one plan per topic there is no pair, and
all three naming forms resolve.

**One CLAUDE.md exception is now stated rather than implied.** A `[product]` F-block may write the
derived Project Anatomy counts and the rows describing what it just shipped. Everything else in
`CLAUDE.md` belongs to an `[internal]` F-block.

**`node scripts/build.js` runs on internal F-blocks too**, which the old self-build forbade. That is
where the three artefact-graph gates live, and the graph covers `.claude/` as well as
`framwork/.codeadd/`. An internal block proves it stayed in its lane with
`git status --porcelain framwork/` returning empty — the only file it may touch there is the
gitignored `artefact-graph.json`.

## Four skills, loaded when pertinent

Roughly a quarter of each old pair was duplicated text. The builds carried near-identical copies of
the ledger, the rulings, the four hard stops and the commit cycle; the planners duplicated file
naming, the document structure, the review dispatch and the completion rules.

| Skill | Carries | Loaded |
|---|---|---|
| `add-build-ledger` | Ledger, resume rule, one commit per F-block, ruling format, four hard stops | Planned mode, always |
| `add-plan-authoring` | Naming, structure, layer tags, Produces/Consumes, review dispatch, completion summary | By the planner |
| `add-framework-product-layer` | provider-map registration, `build.js`, the serial `cli` suite, the count sync | First `[product]` F-block |
| `add-framework-internal-layer` | Coherence, dependency checks, lifecycle actions, the grep sweep | First `[internal]` F-block |

A single-layer plan never loads the other layer's skill. `add-plan-authoring` keeps the bulky plan
skeleton in `references/plan-template.md`, read only at write time.

The commands shrank accordingly: `add-framework--plan` from 616 lines to 330,
`add-framework--build` from 659 to 290.

## The prefixes go with the split

`shared-` marked a command serving either context, in contrast to `self-` for the internal one. With
`self-` retired the prefix contrasts with nothing, so `add-framework--shared-brainstorm` becomes
`add-framework--brainstorm` and `add-framework--shared-review` becomes `add-framework--review`.

The brainstorm's STEP 7.3 layer routing collapses with them. It printed one of two commands and
asked the user when the layer was ambiguous; it now prints one command and records each artefact's
layer in the design document, which is where the planner's F-block tags start from. **An ambiguous
layer is a note in the document, not a question to the user.**

## `.opencode/` at the repo root is gone

It held hand-maintained adapters of every internal command and agent. Nothing in `scripts/`, `cli/`
or CI read it — every such reference points at `framwork/.opencode/`, which is build output for the
OpenCode provider and is untouched. OpenCode remains a supported provider for framework users.

The mirror only doubled the edit count on every internal change, and its untracked skill copies had
already drifted: they were missing the entire `uses:` section of `add-framework-development` and
still named a skill that had been renamed. Deleting it first is what let every later change in this
delivery edit one file per artefact instead of two.

## The delivery index derives its layer

`delivered.sh` validates `layer` against `product | internal` and refuses anything else, so a
cross-layer delivery is one entry, not two and not a third value. `/add-framework--done` stops
hardcoding `"internal"` and derives it from the entry's items: an `at` under `framwork/` is product,
everything else internal, dominant side wins, a tie is a user question.

**Derived from item paths, not from the entry's `node`.** The command already records that top-level
`scripts/`, `CLAUDE.md` and `.gitignore` produce no graph node, so `node` is legitimately absent on
some entries — a rule keyed to it would have no answer for exactly the deliveries this change makes
common. Item paths are always present.

## What the tests had to learn

Three `cli/` assertions and one checked-in artefact encoded internal-layer facts this delivery
changed, so a correct build turned CI red:

- the node inventory snapshot moved from 208 nodes to 211 — four skills and one reference added, two
  commands deleted — and from 97 declaring artefacts to 99;
- the `/add-framework--done` CI-gate test looped over a `.opencode/` adapter that no longer exists;
- `web/public/artefact-graph.mmd` was stale against the renamed and deleted command nodes.

Each number carries its reason in a comment above it, per the standing rule that a test encoding a
deliberately replaced fact is updated and explained, never deleted.

## Scope left open

`framwork/.codeadd/skills/add-plan-review/SKILL.md` names `add-framework--shared-review` in one line
and goes stale here. It is product-layer prose, cross-layer names are skipped by the prose gate, and
nothing fails — but the pointer is wrong. Fixing it is the first thing the merged command is good
for, which is a fair test of whether the merge earned itself.

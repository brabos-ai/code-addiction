# One closing shape for every command

**Date:** 2026-09-09
**Plan:** `2026-09-09T163448-PLAN--final-report-shape`
**Layers:** both

## What changed

`add-final-report` is a new skill, written once per layer, that owns the last thing a command says.
Seven blocks: TL;DR, what was delivered, how it works, files touched, where it plugs in, what is not
included, what needs attention. It is loaded at a command's closing step, not at its first.

Twenty-one commands adopted it — seven internal, fourteen product. `add-framework--release`,
`add.done` and `add.diagnose` had no closing step at all and gained one.

The shape came out of `add-plan-authoring`, where only `/add-framework--plan` could reach it. Two
blocks are new: `TL;DR` names the outcome rather than the activity, and `How it works` explains the
mechanism the user just received — the question every previous closing left open.

## Why two files

The product layer is distributed to users' projects, where `.claude/` does not exist, so it cannot
reference the internal layer. The two skills carry the same blocks and different vocabulary: the
internal one speaks F-block, ledger and layer; the product one speaks feature ID, task and
requirement. Divergence is the intended outcome, and no check keeps them identical.

## Facts preserved

The shape wraps each command's facts, it does not replace them. Every fact the twenty-one closing
steps already demanded was captured before the edit and grepped after it: 92 items, none lost.
`add.build`'s exhaustive rulings table, `add-framework--done`'s archive members and worktree-skip
remedy commands, `add.plan-to-ready`'s three-state split and its ban on softening a red run.

## Also fixed, found in review

- `cli/tests/build-artefact-graph.test.js` asserted 213 graph nodes; two new skills make it 215.
- `add.audit` and `add.review` were told to print "none" on every Files touched row while both write
  documents. They now name what they write.
- `add.brainstorm` and `add.new` cap responses at 20 words at the top of the file, which would have
  reduced the report to a stub. Both now exempt the closing step.
- `add.diagnose` 8.4 and `add.done` STEP 8 printed the path and the next command before the report.
- `add-ecosystem`, the source of truth `/add` loads, gained the skill and its consumer map row.

## Inheritance

`building-commands` now requires the shape of any new command's closing step, names the layer to load
from, and names the only two exemptions: `add.md` routes and `add.ux` rewrites an instruction.

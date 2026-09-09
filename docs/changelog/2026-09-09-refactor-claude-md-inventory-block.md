# 2026-09-09 — CLAUDE.md stops being something builds write

Implements `docs/plans/2026-09-08T234054-PLAN--claude-md-inventory-block.md` (F1–F8, both layers).
A generated block replaces the hand-maintained Project Anatomy counts, and every standing licence to
write `CLAUDE.md` prose during a build is deleted.

## Why

`CLAUDE.md` is loaded into every session, which makes it the highest-leverage document in the
repository and the most expensive one to get wrong. It had been edited in 28 of 422 commits, and the
last fifteen of those split cleanly in two: eight were one- or two-line count syncs, two were
structural prose a new mechanism wrote about itself, and one was the corrective cleanup that cut the
file from 4212 words to 1220.

That cleanup was needed because a MANDATORY step kept appending mechanism sections until the file
passed its own budget. The step tried to hold the line by discipline — "edit what this build changed,
nothing else". The discipline did not hold, and it could not: a mandatory write step into a shared
document accumulates by construction, not by carelessness.

The unification in `f63b8bd` relocated that step out of the command bodies and into two layer skills.
It did not retire it. This change does.

## A count answers the wrong question

`Skills 41` tells a session a number. It does not tell it that `add-qa-spec` exists — which is what a
session actually needs before deciding to write a new skill. And the number was a third copy of a fact
that already had two sources: the filesystem, `provider-map.json`, and `cli/tests/build.test.js`,
which asserts `agents × providers` as a literal.

So the counts are gone and an inventory takes their place. The count survives as an array length.

```
[//]: # (codeadd-inventory:start)
{"commands":[...16...]}
{"skills":[...41...]}
{"agents":[...22...]}
{"scripts":[...18...]}
{"templates":[...],"fragments":[...],"plugins":[...],"transforms":[...],"sidecars":[...]}
[//]: # (codeadd-inventory:end)
```

Five lines of minified JSON, because `add-token-efficiency` § 2 reserves that form for data the agent
looks up, and because it is the only shape a test can `JSON.parse` and diff against disk. The markers
are link-reference-definitions rather than HTML comments, matching the convention `add-claude-md-style`
already set for the product layer — though for a different reason here, since this `CLAUDE.md` never
passes through `build.js`.

## Two rules the generator carries, and why

**Sorted by name, never by filename.** Sorting `commands/*.md` puts `add.md` after `add.init.md` and
`add.plan-to-ready.md` before `add.plan.md`, because `-` sorts before `.` and the extension shifts the
comparison. Both read as mistakes and both move the diff for no reason.

**`sidecars` reads the `SIDECARS` constant, never a glob.** All three sidecar files are gitignored and
absent from a fresh checkout, so a glob would report staleness that does not exist.

`fragments` and `plugins` list the owning directory rather than their files, because `add.plan.md`
exists three times on disk — under `fragments/qa-pipeline/`, `fragments/tdd-pipeline/` and
`plugins/gitnexus/fragments/`. A flat filename array collides on it.

## Who keeps it current

**The build writes it; the close-out is the net.**

`/add-framework--build` STEP 6 runs the generator and commits `CLAUDE.md` as its last documented act,
**unconditionally** — whether or not a PR follows. The block is derived from `framwork/.codeadd/`, so
its correctness is a fact about the tree, not about anyone's publishing decision. Tying it to the
publish answer would leave the branch carrying a `CLAUDE.md` that contradicts its own artefacts every
time someone declines.

This is the ordinary shape for a derived file that is checked in: generate where the input changes,
verify later. `go generate` plus `git diff --exit-code`, `make verify`, `cargo fmt --check`,
`terraform fmt -check` are all the same pattern.

A new `## STEP 7: Publish [STOP]` then asks before pushing the branch and opening the PR, and skips
the question when a PR already exists. It never merges. Completion renumbers to STEP 8 and reports
both whether the block changed and whether a PR was opened.

**The build asks rather than the rule bending for it.** `add-build-ledger`'s third hard stop already
covers "a side effect outside this working tree… a push to a shared branch". The alternative was to
loosen that rule for feature branches; obeying a rule that already existed is the smaller change.

### The close-out still syncs

`/add-framework--done` STEP 2.4, as item 1 of its inner list: run the generator, commit `CLAUDE.md`,
push. Items 1–6 shift to 2–7; the step number does not move, so the four cross-references to STEP 2.4
stay correct.

`already current` is now its expected outcome, and that is not a sign the step is redundant. It is the
net under three cases where the build cannot have synced: a build that hard-stopped before STEP 6, a
hotfix that never ran a full build, and the recovery path at 2.5 where the merge came first.

**Item 1 sits before the clean-tree check, and that order is the whole point.** A sync that writes
without committing leaves the tree dirty, and the check on the very next line would hard-stop the
close-out on its own output. It stages `CLAUDE.md` by path rather than `-A`, so the check can still
catch every unrelated edit sitting beside it.

A sub-step `2.4.0` was the obvious alternative and is ruled out twice over: `add-framework--build.md`
forbids fractional numbering, and renumbering `2.4` to `2.5` would collide with the Recovery Path that
already owns `2.5`.

## What was deleted

- `add-framework-product-layer`: the section instructing a build to recompute the counts, and the
  six-row table telling it which prose to update for whatever it shipped. Plus four smaller claims
  none of which contain the string `CLAUDE.md` — the ownership paragraph, the frontmatter's "and the
  CLAUDE.md count sync", the requirement to read `add-claude-md-style`, and the Rules line.
- `add-framework-internal-layer`: the three-row twin, and the coherence checkbox asking whether
  `CLAUDE.md` "reflects the current artefact list" — the same duty in a second place.
- `add-framework--build`: the exception letting a `[product]` F-block write `CLAUDE.md`, the STEP 6
  bullet, and the two STEP 7 reporting lines.
- `.claude/bootstrap-framework-context.sh`: a script that printed the same inventory to a terminal.
  Nothing called it, and it was not a graph node, so no gate protected it and `graph.js orphans` could
  not see it. Its one loss is the skill descriptions it printed, which stay readable in each skill's
  frontmatter.

**Deleting the exception was not enough on its own.** `CLAUDE.md` is a root file, so neither the
`.claude/` rule nor the `framwork/` rule reaches it — it would have fallen through to "rule on it and
record the ruling", and a build could still have decided its way back in. The `[product]` block
carries an explicit prohibition now. The `[internal]` block does not, because an internal F-block must
still be able to write the file; that is how the markers got there.

## No CI gate — but the shape now supports one

The design argued for a `--check` gate and the build dropped it. `--check` ships as a mode of the
script, wired to nothing.

What made a gate awkward was the ordering, and that is fixed. When only the close-out synced, a gate
would have gone red across the whole review window and then blocked its own writer: CI red →
`/add-framework--done` STEP 2.4 stops on a non-`success` check → the step that would have fixed the
block never runs. With the build syncing before the PR exists, a gate reads a block that is already
current. Adding it is one step in `ci.yml`.

The cost until then is stated rather than hidden: a delivery that skips both the build's STEP 6 and
`/add-framework--done` leaves the block stale and nothing says so.

## The graph gate did its job three times

Each of the three replacement passages named `/add-framework--done` in prose without declaring a
relationship to it, and `build.js` failed the block each time. All three are declared `mention:`
rather than a dependency: the prose points at who keeps the block current, it never loads or
dispatches it, and a `MENTIONS` edge keeps `impact` and `dependencies` honest.

## Verification

Thirty assertions across three levels, written RED before `scripts/inventory.js` existed and confirmed
failing. The suite went 20 → 21 → 24 → 25 → 26 → 27 → 29 → 30 as each F-block landed, which is the
evidence each level was red for its own reason rather than for a missing import.

Three of those levels were themselves defective and fixed in their own commits: a fixture that did not
mirror `<root>/framwork/.codeadd`, a count assertion that also matched the Internal Layer's legitimate
path table, and a sweep that grepped for a string its own source contained.

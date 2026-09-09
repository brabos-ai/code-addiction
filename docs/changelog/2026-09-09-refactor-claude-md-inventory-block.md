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

`/add-framework--done` STEP 2.4, as item 1 of its inner list: run the generator, commit `CLAUDE.md`,
push. Items 1–6 shift to 2–7; the step number does not move, so the four cross-references to STEP 2.4
stay correct.

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

## No CI gate

The design argued for one and the build dropped it: the PR opens at the end of
`/add-framework--build`, so a gate reading a PR check run does not fit the flow. `--check` ships as a
mode of the script, wired to nothing.

The cost is stated rather than hidden: a delivery that never runs `/add-framework--done` leaves the
block stale and nothing says so. Wiring a gate later is one step in `ci.yml`.

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

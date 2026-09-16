# The pipeline chains

**2026-09-16** · internal and product layers
· plan `2026-09-16T170340-PLAN--the-pipeline-chains`

## Why

A small change to an internal `add-framework--*` artefact paid the full ceremony: four commands typed in
order, four approvals, and each approval decided nothing once every gate was green. The close-out then
squashed the branch, so one commit per F-block — each carrying what was validated and what was ruled —
reached `main` as a single line.

## What changed

**The four stages are skills.** `add-framework--brainstorm`, `--plan`, `--build` and `--done` moved from
`.claude/commands/` to `.claude/skills/add-framework--<stage>/SKILL.md`, double dash kept, each with its
own frontmatter. They are still invoked as `/<name>`. A new `handoff:` declaration kind lets a skill mark
the next stage, so the graph now carries brainstorm → plan → build → done as `HANDS_OFF_TO`; build → done
was a plain mention before.

**One approval, with three options.** The brainstorm's STEP 7.3 asks: confirm each stage, deliver
automatically, or keep discussing. The answer is written as `delivery:` in the intent file, copied into
the plan header as `> **Delivery:**`, and read by the build. On the automatic path every stage hands off
without waiting **up to the build's STEP 9 question about opening the PR**, which is the terminus. The
close-out is never reached unattended.

**Every stop is classified by the state it runs in.** `add-plan-authoring` owns the rule: a *deciding*
stop waits on both modes; a *confirming* stop waits only when the user chose to confirm each stage, and
when it passes through it still prints everything it would have shown. Doubt falls toward deciding. The
build's STEP 9 is the stop that proved this must be by state: deciding on the first push, confirming
once a PR exists.

**The plan shows a preview before it is written** — objective, phases, order and why, risk per artefact,
exclusions — inside the stop STEP 4 already makes.

**The merge keeps its history.** Both close-outs run `gh pr merge --merge`. The recovery path reads the
merge commit against its first parent, because `git show` on a merge commit prints a combined diff that
can be smaller than the delivery or empty.

**The impact query still answers.** Measured before changing anything: under `--merge`,
`delivered.sh touched` read the branch's docs-only commit and degraded every PR-merged delivery to
`curated`. It now walks `--first-parent -m`, which answers `complete` with the merge commit, and answers
exactly as before on squashed history (15/15 on this repository). `delivery-index.md` states the rule
for both routes, and the test that grepped for the word "squash" is replaced by one that builds a merge
and a squash with real git.

**Ruler fixes on the stages.** Argument resolution and the agent dispatch rules each have one owner
now; `add-build-ledger` documents the `GRAPH:` line; the build's STEP 9 gate states both behaviours;
the close-out's cleanup keys on the delivery being on `main`; STEP 4.0's `Lists items` row covers all
five sections; the close-out's Rules gained a NEVER section; three duplicated plan rules are gone.

## What did not change

- `done.sh`'s local route still squashes. On an install that does not take the PR route, `add.done`
  keeps flattening history.
- The product-layer pipeline (`add.brainstorm` → `add.new` → `add.plan` → `add.build`) is untouched.
- `add-framework--sync`, `--release` and `--roadmap` stay commands.
- The public command diagram (`web/public/artefact-graph.mmd`) renders commands only, so the four
  stages dropped out of it.

## Cost accepted

Merge commits become the default for installed users whose PR route runs `add.done`. A repository that
disallows merge commits refuses loudly at the close-out rather than silently switching method.

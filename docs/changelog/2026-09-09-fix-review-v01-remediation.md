# 2026-09-09 — The gates the unify merge left soft, made hard again

Remediates `docs/plans/2026-09-08T210322-SELF-PLAN--unify-dev-commands--review-v01.md`, the
implementation audit of the four-commands-become-two delivery. That audit found the delivery itself
complete — every planned item landed, no scope item without a diff, the line budget met honestly —
and the defects concentrated in the merged executor's own gates.

Ten F-blocks, all internal layer. Nine were planned; F10 was opened during execution when the full
`cli/` suite caught the checked-in graph diagram going stale against the edges F5 and F7 changed.

## Why

Two of the findings were high severity and both sat in `/add-framework--build`.

**The per-F-block build check could not see what it gated on.** `build.js` prints
`N graph warning(s) — ADD_GRAPH_WARNINGS=1 to list` and nothing more unless that variable is set. The
command's validation step ran the bare form and asked for "no new warning", so a block inspecting the
output found nothing and reported clean against warnings it had never printed. This is not a
hypothetical: the delivery under audit shipped four warnings through thirteen blocks on exactly this
gate, and its own F15 ruling records the discovery. The remediation was applied to that run and never
written back into the artefact, so every later build inherited the same blind check.

**Direct mode had no layer confinement at all.** Every layer prohibition was written as
`IF THE CURRENT F-BLOCK IS TAGGED [internal]` or `[product]`, and STEP 1.2 states that direct mode has
no F-blocks. Neither condition could ever be true there. The deleted `add-framework--self-build`
carried an unconditional `ALWAYS` tier of write prohibitions; the merge dropped that tier and put
nothing in its place for the one mode that has no tag to key on. A direct build therefore ran with
weaker confinement than either command it replaced.

## What changed

**The warning gate now sets the variable, in all three places that state the check** — the command's
validation step and both layer skills. Each also states the baseline procedure the phrase "no *new*
warning" always required and never had: measure once on the branch point, compare every block against
that list. The product skill additionally stopped naming only LINT warnings, which are a different
class from the graph warnings the same run emits.

**The layer-boundary block gained three conditions and lost a contradiction.** A direct-mode
condition restores confinement where no tag exists. A condition for a tag that is neither
`[product]` nor `[internal]` closes an enum that previously matched nothing, fired no prohibition and
loaded no layer skill — `[both]` being the easy authoring confusion, since the reviewer accepts it as
a `layer` value. And the uncovered-path condition no longer reads `DO NOT widen the block` directly
above `DO: rule on it and record the ruling`, which is the same act described twice; it now says what
the F14 and F16 rulings actually did, which is open a new F-block carrying that path's own tag.

**`/add-framework--review` stopped colliding with its own ledger.** Its resolver excluded
`--review-v*` and `--evidence-v*` but not `--ledger`, while `/add-framework--build` excludes all
three. A ledger is written on the first F-block, so every plan that has been built produced two
candidates and the command had to stop. It was reproduced live: the review that found this finding
hit the collision resolving its own argument. The same command's `graph.js history` call also ran
without `--layer`, in a command now scoped to audit both layers, against the planner stating the
opposite rule as an ALWAYS.

**`/add-framework--done` put `cli/` back on the product side.** Its delivery-index layer derivation
read "under `framwork/` is product, everything else internal", narrower than the three-path split the
same delivery wrote into the build command and into `CLAUDE.md`. `provider-map.json` was covered by
accident because it sits under `framwork/`; `cli/` was not, so a `cli/`-heavy delivery would index as
internal and then vanish from `delivered.sh read --layer product`. `delivered.sh` is untouched — the
derivation still emits only the two values its enum accepts.

**The Rules sections met the removal test they are supposed to pass.** `building-commands` says Rules
carry only what is not derivable from the STEPs and condition blocks. The build command was carrying
six ALWAYS rules restating its own steps and four NEVER rules that are product-layer rules the product
skill already states verbatim, in a command that presents itself as layer-neutral. The planner was
carrying eight rules restating `add-plan-authoring`, its template, and its own steps. Each removal was
checked against the owning artefact first: a dedup that deletes the only statement of a rule is not a
dedup. The rulings report and the changelog rule each now have one home instead of two.

**Three false dependency edges are gone.** `mention:` marks prose that names an artefact while
pointing away from it, and `impact` excludes those edges. Brainstorm prohibits invoking the build;
`plan-review-agent` is a leaf that only checks the build is named in the plan it reviews. Both
declared it as a dependency and emitted `HANDS_OFF_TO`. The build command's depth-1 impact drops from
six to four, and that number is what the planner grades risk on. Two further prose names escaped the
undeclared-reference gate outright by being written without a leading slash; both now carry it.

**Five coherence defects from the original sweep.** The internal-layer skill told readers risk grading
belongs to the planner and then ordered them to grade it. Brainstorm pointed twice at a layer routing
that had been collapsed, and implied `SELF-PLAN` is a current marker rather than a legacy one.
`add-build-ledger` moved its `uses:` block up to its H1, matching every other artefact. The product
skill regained the failing-test condition block the merge had flattened into prose.

**The delivery changelog stopped under-reporting itself.** Written before F15 and F16 existed, it
claimed "F1–F13, plus an F14 the plan did not have" and carried a "Scope left open" section describing
a fix that had shipped in the same merge.

## Proof

Every block ran `ADD_GRAPH_WARNINGS=1 node scripts/build.js` and compared against a baseline measured
on `888f3f9`, which is zero warnings. Every block proved `git status --porcelain framwork/` empty and
`graph.js orphans` at the standing 24, all product.

The full `cli/` suite ran serially at the end: 38 files, 852 passing, one skipped, zero failures. It
caught one real regression on the way — `graph-mermaid.test.js` failed because the checked-in diagram
encodes the edges F5 and F7 changed, which is F10.

The new gate earned itself inside this delivery. F5's Rules trim removed the only prose naming
`/add-framework--release`, turning its declaration into a phantom edge — caught as a warning that the
old bare invocation would have summarised into a count nobody reads. The fix to that then failed the
build outright, because `mention:` without a leading slash resolves to a skill rather than a command.
Both were caught before the block's commit.

## Not included

Four findings from the audit are recorded as needing no change, and none is a defect in the tree:

- The `S<n>` to `F<n>` ledger-gate fix and the close-out recovery path both already landed in
  `888f3f9`. The findings are about how they were recorded, not about the code.
- `building-commands` is a depth-1 dependant of the rewritten build command that the plan never
  mentioned. Inspection found nothing broken: its declaration resolves and its content is
  layer-neutral. It is a gap in the plan's blast-radius analysis, not in the repository.
- The seven product dependants of `add-plan-review` were likewise unmentioned. F16 changed one word of
  prose with no interface attached, so none of them can break.

Root `.opencode/` remains outside `.gitignore`. The original plan removed that negation block
deliberately, and re-ignoring the directory is a decision rather than a repair.

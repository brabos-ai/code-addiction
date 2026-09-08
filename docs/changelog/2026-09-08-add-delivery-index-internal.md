# 2026-09-08 — The internal close-out: `/add-framework--done`, a time axis for the graph, and four consumers that ask it

Implements `docs/plans/2026-09-07T162415-SELF-PLAN--delivery-index-internal.md` (internal layer,
S1–S5). The companion to `2026-09-07T160328-PLAN--delivery-index.md`, which built the record
format and `delivered.sh` for the product layer. This one gives the internal layer a close-out
and teaches the artefact graph to answer a question it structurally could not.

## Why

The internal layer had no close-out. Work ended as a commit on `main`, a hand-written changelog
entry and a merged PR — three signals, none authoritative, none machine-readable. Nothing
recorded when an artefact arrived, which plan brought it, or what it replaced.

The graph could not fill the gap, and not by omission. `artefact-graph.json` is rebuilt from
scratch on every build and gitignored, so it describes what exists **today** and holds no
history at all. Ask it about a deleted artefact and it does not say "this was removed on
2026-09-06 and replaced by X" — it says nothing, which reads identically to "never existed".

## `/add-framework--done`

Nine steps: collect context and probe `gh`; gates; author the index entry; changelog; preview;
commit on the branch and push; `gh pr create` + `gh pr merge --squash`; cleanup; report.

**The gate reads CI's run on this exact commit. It does not re-run the commands locally.**

The first version of this command did re-run them, on the reasoning that using CI's own four
commands makes a green local gate and a green PR the same statement. Running the gate for real
showed the flaw in that: two gates that are *meant* to agree are still two gates, and the local
one is the weaker. It runs on one machine, one Node version, and a developer's environment.

The measurements that settled it, taken on this branch: `npm run test:scripts` takes **over an
hour** on Windows and **63 seconds** on CI, and the local run reports a `qa-preflight.bats`
failure that exists nowhere but on that machine, because a `node_modules` above `TMPDIR`
resolves a package the test asserts is absent. A gate whose slow path also produces a false red
is not a stricter gate.

So the gate now pushes, ensures the PR exists (`ci.yml` triggers on `pull_request`, so no PR
means no run), waits for the checks, and reads them. **The load-bearing part is the SHA
comparison:** `gh pr view --json headRefOid` against `git rev-parse HEAD`, refusing a verdict
from any other commit. Without it the command reads yesterday's green run and calls today's
untested code gated — the same class of lie as a gate that invokes a script that does not exist,
and harder to see, because the output says `pass`. A skipped, queued, neutral or cancelled
check is not a pass either; only `success` is.

STEP 7 waits a second time, because STEP 6 pushes the entry and this changelog and CI has not
seen that commit. It costs about a minute and closes the one hole the design would otherwise
leave: a delivery whose final commit was never tested.

**The local four survive as an explicit, reported fallback** for when `gh` is unavailable, the
network is down, or a repository has no CI. There the `--prefix cli` hazard is still live —
`test:package` exists only in `cli/package.json` and the bare form fails with "Missing
script", a *false* gate worse than a failing one. A test in `build-artefact-graph.test.js` pins
the prefixed form in both the canonical command and its OpenCode adapter, and it caught a
regression during this very edit: the rewritten section quoted CI's own bare invocation as
documentation, and the guard does not care that it was only being described.

`converge-gates.sh` was rejected as a category error — it needs `epic.md`, `review-NNN.md`
and a root `manifest.json` that the internal layer does not have.

**The ledger gate runs before the four commands**, because unwritten code breaks no test. A
`/add-framework--self-build` run that stopped halfway passes every command below it and would
merge and index as fully delivered — the exact lie the index exists to prevent.

**Cleanup deletes the worktree, the branch and `docs/evidence/` — nothing else.** `docs/plans/`
and `docs/brainstorming/` are read by `@framework-discovery-agent` and by seven commands;
deleting them blinds the discovery path. That is a thin harvest and it should be: the internal
relief this delivery buys is retiring force-add, not deleting files.

## `graph.js history` — the seventh verb, and the file's first subprocess

`history <name>` answers *when did this arrive, and what did it replace*. It shells out to
`bash <path>/delivered.sh read`, filters to entries matching the resolved node, and enriches
each with the graph's dependant count.

**The read is delegated and never reimplemented.** Parsing the JSONL in JavaScript would be a
second implementation of one format — which is plan 0075's whole subject, recreated inside the
design that cites it as the lesson. Inlining the parse looks cleaner and is the likeliest future
regression, so the reason it must not happen is written above the function.

`bash` is named explicitly rather than executing the script directly: Windows is this repo's
primary platform and a shebang file is not executable by process creation there. A missing
`bash` or a missing script is **reported, never thrown** — the same function runs inside the
long-lived MCP server, where a throw kills every later query rather than the one that failed.
Its `unavailable.detail` names both the interpreter and the cwd, because Node reports a bad cwd
and a missing interpreter as the same `ENOENT` and the ambiguous message sent a reader to the
wrong problem during this build.

The verb is query-only: `--repair`, `--write` and `--fix` are refused outright, so
`delivered.sh verify --repair` stays the single writing path. `--layer` is forwarded verbatim to
`delivered.sh read` rather than re-filtered here.

`artefact-graph-mcp.js` exposes it as the seventh tool. The dispatcher discovers it from the
`TOOLS` array, so `handle()` needed no change.

## The four consumers

Not in the delivery index — they are modifications with no nameable surface of their own, which
belongs in a changelog rather than in an anchored item — so they are recorded here in full:

- **`add-framework--shared-brainstorm`** STEP 1.2, a genuinely new step: the index is asked
  before `@framework-discovery-agent` is dispatched, and the resolved entries travel in the
  agent's payload. The agent gets no new tool and no new file — its `Glob, Read` allowlist is
  untouched, deliberately, because this repo treats that allowlist as a method boundary.
- **`add-framework--plan`** STEP 2.2, new work nested inside the existing "Investigate Framework
  Ecosystem" sub-step, passing `--layer product`. Nested rather than renumbered: STEP 2 already
  exists with sixteen internal cross-references and one citation from
  `add-framework-development/SKILL.md` outside the file.
- **`add-framework--self-plan`** STEP 2.1/2.2, an extension beside the four `graph.js` calls
  already there — the time axis next to the structure.
- **`add-framework--shared-review`** STEP 3.1b, an extension: the blast-radius check gains "and
  this is what it superseded".

Each landed with its `.opencode/` adapter in the same commit, because nothing in CI catches a
missing mirror. The adapters carry pre-existing content drift from their canonicals, and each
edit was mirrored against the adapter's own wording rather than normalising the adapter —
normalising would have buried four small additions inside a large unreviewed rewrite.

## The index is tracked by a `.gitignore` negation, not by force-add

One line: `!docs/delivered.jsonl` after `docs/*`. Force-add is the mechanism that resurrected
seven deleted plans in this repository, and using it to make the anti-drift index durable would
have been using the disease as the cure.

**The force-add retirement this unlocks is deliberately not taken here.** Its trigger is
`git show main:docs/delivered.jsonl | grep '"layer":"internal"' | grep '"by":"done"'`, and it
cannot fire until a real close-out has run. Both greps are required on the same line: the
product layer's `/add.done` also writes `"by":"done"`, so a check without the `layer` filter
fires on a product entry and causes the premature retirement it exists to prevent.

## A defect report that was withdrawn

Mid-build this branch claimed `delivered.sh` silently dropped an item-level `node` on write, and
treated that as a product-layer defect. **It is not one, and the claim was withdrawn on the
branch rather than left standing.**

`delivered.sh` implements its owning spec exactly. The format is owned by
`add-doc-schemas/references/delivery-index.md`, which lists `node` in its record field table and
defines an item as exactly `{what, at, find}`. Normalising a `node` out of an item is the
schema, not data loss. The error was reading an internal brainstorm as the authority on the
record shape when a reference owns it.

Left standing, the claim would have told every future reader that a spec-conformant script is
buggy, and the likely outcome is someone "fixing" `serialize()` into a spec violation — the same
doc-vs-code drift this whole delivery exists to kill. `delivered.bats` gained four `node` levels,
a field that previously had zero coverage at either level, which is why a correct implementation
could be read as a defect and survive review.

`history()` still reads both levels deliberately: `read` returns whatever a line carries and the
reference says humans hand-author lines, so an item-level `node` can legitimately appear even
though `write` never emits one.

## Recorded honestly: this close-out ran without a review

`/add-framework--done` STEP 2.3 requires a `--review-vNN.md` companion with a `PASS` verdict, and
hard-stops without one. No review companion was ever produced for this plan. The close-out was
run at the repository owner's explicit instruction to bypass that gate, after the stop was
reported.

Every other gate ran and passed: the ledger gate (S1–S5 all `complete`), `node scripts/build.js`,
`npm test`, `npm --prefix cli run test:package` and `npm run test:scripts`. What is missing is
the independent audit, not the test evidence. This paragraph exists because an index that
records a delivery as clean when its own review gate was skipped would be the first lie in a
file built to stop them.

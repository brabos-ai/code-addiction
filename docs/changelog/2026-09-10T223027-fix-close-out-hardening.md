# Close-out hardening — the gate's fourth state, a merge proven on main, changelog files that sort

**Date:** 2026-09-10
**Plan:** `2026-09-10T203053-PLAN--close-out-hardening`
**Layer:** both

The close-out was exercised end to end for the first time on 2026-09-10, delivering the prompt
quality ruler. Running it surfaced four defects that reading it had not. This is the repair.

## Why

Three of the four were in `/add-framework--done`, and the fourth was in a tool every plan's analysis
depends on.

**Gate 2.1 covered three of four combinations.** It crosses PR state with index-entry presence, and
had no row for "PR open, entry already written". That is precisely where a close-out lands when STEP 6
commits and STEP 7's merge is then refused — a review thread left unresolved, an approval dismissed by
a push, an unattributed change. Resuming fell through to the normal path and wrote a **second index
entry for one delivery**.

**STEP 8 stated a rule it never showed how to check.** "No durable copy under `docs/deliveries/<id>/`
on main → do not rm" was the whole safety condition for three deletions, and nothing in the command
evaluated it. The `cmp` pattern that answers it already existed one STEP earlier, applied only before
the merge.

**Changelog filenames did not sort by delivery order.** The name carried a date and no time, so a day
with several deliveries alphabetised by verb. Seven files share `2026-09-09` and five share
`2026-07-27`. Every other internal document directory already used a timestamp.

**`graph.js history` could not find an entry by node.** It asks `delivered.sh read` with the
artefact's bare name, and the read matched that text against the entry's `id`, `name`, `words` and
item strings — never against `node`. Measured over the whole index: eight nodes carry entries, the six
with a single delivery answered correctly, and the two with more than one each returned one of two. So
the verb worked exactly while an artefact had one delivery, which is when "was this attempted before?"
carries the least information.

A separate audit against the prompt quality ruler failed three of its eight items on the same command.

## What changed

**The index read searches `node`.** One field added to a haystack in `delivered.sh`, with a comment
saying why `items[].at` stays out: an `at` is a hint that `--repair` rewrites, so matching it would let
a query hit a stale pointer. `history` now returns both entries on both nodes that have two.

**`add-plan-authoring` owns the changelog filename.** It was declared by two commands and owned by
nothing, so fixing one would have left them divergent. The format is now
`docs/changelog/YYYY-MM-DDTHHMMSS-<verb>-<slug>.md`, beside the plan filename it already owned, under
the timestamp rule they share. The verb survives, because once the timestamp leads it no longer
affects order and the existing files carry it. Pre-existing changelogs keep their names, the precedent
the skill already set for plans.

**One changelog per delivery is now a rule.** This was not in the plan; it surfaced in review. Under
the date-only name both writers computed the same path, so the second landed on the first file — the
directory holds one changelog per delivery by accident, not by design. Two timestamps differ by the
seconds between the two commands. The first writer creates the file, a later writer edits it and keeps
its name.

**Gate 2.1 has its fourth row**, routing to a new resume path at 2.5. Three STEPs already ran and are
skipped: the entry writer, the changelog and the archive commit. Every gate still applies. STEP 4 is
skipped for a reason of its own — with a timestamped filename a second run does not overwrite the
first, it writes a second file, and both reach `main`.

**STEP 8 proves `main` holds the archive before it deletes.** Five checks: the fetch that makes
`origin/main` mean anything, the PR reporting MERGED with a merge commit, every archived file member
resolving on `origin/main`, the index entry being there, and each member byte-identical to the local
original it is about to authorise deleting. Any failure refuses every deletion, names the check and
the path, and prints `/add-framework--plan` as text. The close-out is not a planner.

The fetch is a numbered check rather than a preamble, and that is the whole point: outside the gate
its failure leaves `origin/main` at the branch point and the remaining checks pass against an archive
`main` has never seen.

**Three ruler items.** The top-of-file prohibitions block qualifies its `ALWAYS:` label the way its
two siblings do. The ledger's line schema is delegated to `add-build-ledger` by name instead of
restated, while the gate that reads it stays. `## Rules` keeps only what no STEP body states.

## What this cost

Fifteen of thirty review findings were rejected, each with a reason in the ledger. One is worth
repeating here: an auditor asked to remove a duplicated prohibition in `add-plan-authoring`, and a
suite from an earlier delivery pins both prohibitions as a deliberate guard against that exact
deletion. The removal was applied, the suite caught it, and the line went back.

`## Rules` on the close-out went from nine items to two. Every one of the nine restated a STEP body;
the two that stayed are the ones no single STEP owns.

## Evidence

Sixteen commits, `6ead1d1..8600140`. Build clean on every block. The cli suite green in serial: 43
files, 984 tests. The scripts suite green on linux/amd64: 386 tests, in under two minutes — the same
suite takes over an hour on a Windows host, and the `qa-preflight` failure that host reports does not
occur in a container, because its `TMPDIR` has no `node_modules` above it.

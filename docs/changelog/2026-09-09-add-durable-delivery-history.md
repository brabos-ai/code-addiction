# Development history that survives the worktree

**Date:** 2026-09-09
**Layer:** internal
**Plan:** `2026-09-09T112557-PLAN--durable-delivery-history`

## Why

`docs/plans/`, `docs/brainstorming/` and `docs/evidence/` are gitignored on purpose — a fresh clone
should not carry someone's half-finished drafts. But they hold the richest record a delivery
produces: the plan's reasoning, the ledger's `Ruling:` lines with their cost clauses, the defect list.

On a worktree build — the normal shape for planned work — those files exist only inside that
worktree's own directory. `/add-framework--done` STEP 8 removed the worktree and took every one of
them with it, while the command's own table listed `docs/plans/` and `docs/brainstorming/` under
"Kept". The rehearsal confirmed the mechanism exactly: `git worktree remove` without `--force` exits 0
and deletes gitignored files silently.

What reached `main` was an extract — the rulings retyped into a completion report, the changelog's
prose. The document itself was never asked to survive.

The delivery index made the same claim in a second place. Every entry recorded
`origin: docs/plans/<id>.md`, a path that resolves to nothing on any machine but the one that ran the
build.

## What changed

A closed-out plan now has a tracked home, `docs/deliveries/<plan-basename>/`, assembled by
`/add-framework--done` STEP 6 and committed with the delivery-index entry and the changelog — the same
single commit STEP 7 merges. Ordering is the whole fix: the documents are on `main` before anything
removes the worktree.

The directory is named after the plan's basename, which is also the index entry's `id`, so a line in
`docs/delivered.jsonl` and the documents behind it join on one string. Its members are `plan.md`,
`ledger.md`, `design.md`, `review.md` and `evidences/`. The first two are load-bearing; the last three
are conditional, and after the review-no-loops delivery nothing produces a `--review-v*` companion or
writes to `docs/evidence/` at all, so a directory holding neither is the normal case.

Two sourcing rules had to be settled rather than assumed. The design doc is found through the
`| Document | Carries |` table in the plan's own Context section, because `docs/brainstorming/`
allocates its own timestamp and that table cell is the only link between the two. An evidence file
belongs to this delivery only when its name carries the plan's id prefix — `docs/evidence/` holds
several plans at once, and filing another plan's evidence under this one reads as this delivery's own
record, which is worse than leaving it behind.

STEP 8 now describes what it actually does. Its table lists this plan's local originals as removed,
with the durable copy on `main` as what survives, and a gate above the list refuses to delete any path
that has no such copy. Two top-of-file prohibitions that contradicted the new step were rewritten: the
untracked-file rule now turns on whether a durable copy exists, and the blanket ban on deleting under
`docs/plans/` narrows to other plans' files.

The step also gained the case it had never handled. On a worktree build the branch is checked out only
inside the worktree, so the command runs there and cannot remove the tree it is standing in.
Attempting it is worse than skipping: measured, `git worktree remove` unregisters the worktree and
then fails to delete the directory, leaving an orphan git no longer tracks. The branch is skipped with
it, since `git branch -d` refuses a branch checked out in a live worktree even when fully merged. Both
are reported with the commands that finish the job from the primary checkout.

Everything that reads `docs/plans/` was swept. `add-build-ledger` no longer claims a ruling dies on
this machine without qualifying it — that stays true during the build, and false after close-out.
`framework-discovery-agent` scans `docs/deliveries/*/plan.md` alongside plans in flight, taking the
slug from the directory name because every file there is called `plan.md`. `add-framework--release`
sources its plan scan from the tracked directory instead of a gitignored one that is usually empty on
a release machine. `CLAUDE.md` and the `.gitignore` durability comment name the new home.

## What the validation caught

The behavioural rehearsal found two defects that no amount of reading would have.

The discovery agent decided whether a plan was delivered by reading the document's `Status:` line
rather than the directory it came from, so it marked an in-flight plan as delivered and missed the one
that actually was. The rule is now a prohibition: the glob that found the file is the only input.

The worktree self-removal was assumed to fail cleanly. It does not — it half-succeeds and leaves a
repair behind. The step quotes both measured error messages rather than describing an assumption.

## Scope

Almost all internal. The product layer has no equivalent worktree defect: `docs/features/` is tracked
in a user's project and `build-setup.sh` already copies feature docs into the worktree it creates.

One product-layer file changed, and it was not in the original scope. The review pass found that
`add-doc-schemas/references/delivery-index.md` still described `origin` as a directory or a plan path
and claimed it survives pruning — the last place still describing the value the close-out now forbids.
The plan had scoped itself internal and named the index schema as out of bounds, so the finding went
to the operator rather than being cleared by assumption, and the decision was to fix it here. The
field row now states the surviving-directory rule and names what each layer puts there.

Entries already in `docs/delivered.jsonl` keep their original `origin`. The index never rewrites a
line, so the asymmetry between old and new entries is visible and intended.

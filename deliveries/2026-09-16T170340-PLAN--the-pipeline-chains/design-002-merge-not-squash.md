# Brainstorm: A merge that keeps the history the build produced

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-16
> **Type:** command
> **Layer:** both — one internal command, one product command
> **Part of:** `2026-09-16T083054-internal-fast-path-000-umbrella.md`

## Objective

**A small adjustment to an internal `add-framework--*` artefact should not have to pay the full
brainstorm → plan → build → done ceremony.** The four stages become skills that hand off to each
other; the approval collapses into one three-way choice at the brainstorm, one of which runs
unattended to an open PR; the merge preserves the per-F-block history the build produced instead of
flattening it; and the operator sees what a stage is about to produce **before** it produces it —
approving it on the manual path, reading it on the automatic one.

*Copied verbatim from `…-000-umbrella.md`. A SET member does not author its own.*

**Serves the objective by** delivering its third clause: the merge preserves the per-F-block history
the build produced instead of flattening it.

⛔ **This line could not be written against the umbrella's earlier objective, and `8.1`'s test said
so.** The earlier text covered only ceremony and chain; this document was introduced there with the
word *"Separately"*. The objective was widened — the second of the two readings `8.1` names — rather
than this subtopic being dropped. It is a member on the record now, not by assumption.


## Discovery

- **The repository already allows every merge method.** `gh api repos/brabos-ai/code-addiction` returns `allow_merge_commit: true`, `allow_squash_merge: true`, `allow_rebase_merge: true`. **There is no GitHub setting to change.**
- **The constraint is written into the commands.** `.claude/commands/add-framework--done.md` carries `--squash` at lines 39, 466 and 468. `framwork/.codeadd/commands/add.done.md` carries it at lines 879 and 882.
- **`done.sh`'s `git merge --squash` at lines 598-602 is a different operation** — a local squash-merge into a branch, not a forge merge of a PR, with its own `[FIX-13]` and `[FIX-14]` notes explaining why it takes that form. It is out of scope.
- **The build produces one commit per F-block, deliberately.** `add-build-ledger` requires it, and every ruling is recorded against the block it belongs to. The pipeline-ceremony-rebalance delivery landed 20 such commits and reached `main` as one line.

## Context & Motivation

The close-out squashes. Every commit boundary the build was careful to draw — one per F-block, each carrying what was validated and what was ruled — collapses into a single entry on `main`. The ledger survives in the archive, but the commits that would let someone bisect or blame the work do not.

## Problem / Opportunity

**The merge method is hardcoded, in two commands, in a repository that permits all three.** Nothing about the close-out needs a squash; the flag was chosen once and never revisited.

## Proposed Solution

Replace `--squash` with `--merge` at all five sites. Three lines in the internal close-out, two in the product one.

⛔ **The flag is not the whole footprint, and the document originally said it was.** Both close-out commands reconstruct an out-of-band delivery's file list with `git show --name-status <merge-commit>` on their recovery path, and both say *"the squash IS the delivery"*. That is true only of a squash commit, whose own diff equals the branch's cumulative diff. **A merge commit has two parents, so `git show` on it produces a combined diff — frequently smaller, sometimes empty.** Left unchanged, the recovery path would write a wrong or empty file list into the index and the changelog, silently. It is fixed here, in the same change, because it is what this change breaks.

**The internal change is unambiguous:** it is this repository, and the owner wants history preserved.

**The product change imposes a policy.** `add.done` runs in other people's repositories and merges their PRs. Changing the flag makes merge commits the default for everyone who installs the framework, including people whose repository policy is squash-only. **That cost was stated and accepted** — the alternative considered was reading a method from `.codeadd/manifest.json` with `merge` as the default, which was rejected for the simpler change.

⛔ **Leaving the flag off is not an option, and the mechanism matters.** Attached to a terminal, `gh pr merge` with no method flag prompts. **Run non-interactively — which is how a close-out runs — it errors instead:** `--merge, --rebase, or --squash required when not running interactively`. Either way the command must pass a method; the failure is an error, not a hang.

*Alternatives considered:* a `mergeMethod` field in the manifest, defaulting to `merge` — rejected as more machinery than the change is worth. Changing only the internal command and leaving the product one on squash — rejected because it leaves two sibling commands silently divergent with nothing recording why.

## Type of Artefact

Command. Two commands and one test file: five flag lines, two recovery-path diffs, one stale rationale, one pinned assertion.

## Scope

### Includes

- `--squash` → `--merge` at `.claude/commands/add-framework--done.md` lines 39, 466 and 468.
- `--squash` → `--merge` at `framwork/.codeadd/commands/add.done.md` lines 879 and 882.
- **The recovery path's diff, in both commands** — `add-framework--done.md` line 240 and `add.done.md` lines 207-216. `git show --name-status <merge-commit>` becomes a first-parent diff, and *"the squash IS the delivery"* is rewritten. **This is the correctness half of the change, not a tidy-up.**
- `add-framework--done.md` line 446, *"rides the squash merge to `main` under a message that does not describe it"* — the reason that sentence gives stops holding once individual commit messages survive.
- `cli/tests/product-close-out-parity.test.js` line 371, whose ordered-token array pins the literal `'gh pr merge --squash'`. It goes red on the same commit that changes the flag.
- A line in each saying the method is deliberate, so the next reader does not "fix" it back.

### Does NOT Include

- `framwork/.codeadd/scripts/done.sh` lines 598-602. `git merge --squash` there is a local branch merge with no PR, structurally different and with no `--merge` flag to flip. ⛔ **This leaves the product close-out asymmetric, and that is disclosed rather than hidden:** on any install where the PR route is not taken — no `gh`, the PR declined, already on `main` — `add.done` still squashes the history this change exists to preserve. Making the Local Route preserve history is a different change, on different code, and nobody has asked for it.
- Any GitHub repository setting. All three methods are already allowed.
- Making the method configurable.
- The `--auto` variant's existence, which both commands mention and which keeps whatever method flag accompanies it.

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `--merge`, not `--rebase` | The ask is preserving history. A rebase rewrites the commits it moves, which loses the parentage a merge commit records | ✅ |
| Both commands change | Leaving them divergent with nothing explaining why is how two siblings drift | ✅ |
| The product command takes the same flag, not a manifest field | Simpler; the cost of imposing one history policy on installed users was stated and accepted | ✅ |
| `done.sh` is untouched | Different operation, local rather than forge, with its own recorded constraints | ✅ |
| The flag is never omitted | `gh pr merge` prompts when several methods are allowed, and a close-out cannot answer a prompt | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-framework--done` | none — entry point, zero dependants at depth 1 | Three lines | Edit |
| `add.done` | `add`, `add.build`, `add.plan`, `add.plan-to-ready`, `add.pull-request`, `add.review`, `fragments/docs-pruning/add.done.md` (INJECTS_INTO), `fragments/qa-pipeline/add.review.md`, `plugins/gitnexus/fragments/add.done.md` (INJECTS_INTO), `add-doc-schemas`, `add-qa` | Two lines | Edit |

Both cells are depth-1 graph answers. The two fragments injecting into `add.done` were queried separately as the fragment rule requires: `docs-pruning` declares no target of its own, `gitnexus` declares only `add-gitnexus`. Neither touches the merge step.

⛔ **What the graph cannot answer:** whether any test asserts the string `--squash`. The graph does not model test files. A grep of `cli/tests/` and `framwork/.codeadd/scripts/tests/` is part of the work, not an afterthought — a guard pinning the old flag turns this two-line change red.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Per-F-block history survives on `main`, with its rulings attributable per commit | A linear `main` |
| Bisect and blame reach the commit that introduced a change, not a squash of twenty | A shorter log |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| An installed user's repository disallows merge commits | Medium | `gh pr merge --merge` fails loudly at the close-out rather than silently choosing another method — visible at the moment it happens, not later in the history |
| A test pins the old flag and this change goes red | **Certain, and now named** | `cli/tests/product-close-out-parity.test.js:371` pins `'gh pr merge --squash'` as an ordered token. It is in Scope, not left to the build to discover |
| The recovery path silently writes a wrong file list after the flag changes | **Certain if the diff is not fixed** | A merge commit's `git show` is a combined diff against both parents. The first-parent fix is in Scope, in the same change, because this change is what breaks it |
| Someone "fixes" it back to squash later | Medium | Each site gets a line saying the method is deliberate |

## Next Steps

Run: `/add-framework--plan merge not squash`

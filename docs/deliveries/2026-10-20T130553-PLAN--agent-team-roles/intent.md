---
path: bounded
topic: agent-team-roles
doc: none
delivery: confirm
ticket: agent-team-roles
---
## Problem
Onboarding a new agent (several PMs and engineers on the same codebase) has no guide. The owner wants one sentence: "read role X and use this framework". Docs-only change; product = `framwork/.codeadd/`. No command or script changes.
## Decided
1. New section "Working as a team of agents" in `framwork/.codeadd/agent-mode/README.md` (after section 2 or as a new numbered section). It states: one git worktree + one session per agent; always `--resume <session_id>` from the envelope, never `-c`/`--continue`, never the newest `.jsonl`, never switch branches in a shared checkout (reuse/point to the rules already in section 2, do not duplicate); one ticket per engineer; board writes only via `node .codeadd/scripts/backlog-commit.cjs <mode>`; on `ERROR=board-locked` wait and retry; on `SYNC_REASON=rebase-conflict` / `push-refused` / `fetch-failed` stop, report to the user, never auto-resolve (the commit is kept in the board clone, see `RECOVERY_REF`); handoff PM → engineer via the intent file and the `shaped` status.
2. Roles live in a NEW folder `framwork/.codeadd/agent-mode/roles/` (does not exist today). The README section points to them.
3. Only two roles now:
  - `roles/product-pm.md` — product PM with ownership of scope, release and priority; expert code analysis grounded in real code; uses `/add-brainstorm` and `/add-new` up to `shaped` (intent written, `about.md` created); never implements; before user acceptance, does a product check of the delivered result against the intent acceptance criteria.
  - `roles/chief-engineer.md` — reads and executes the ticket with ownership: `/add-plan`, `/add-build`, mandatory `/add-review` before `/add-done` or `/add-pull-request`, resolving every blocker/major; minors follow the normal deferred flow (build ledger `minor (deferred)` + Known Issues; one deferred-minors ticket only when the board is on); decides within scope, asks the user when scope changes; ends with a summary to the user.
  - Each role file has: commands it uses, boundaries, when to stop and ask the user, summary format.
4. No separate reviewer role: review is already inside the framework flow (`/add-review` and the plan reviewer run as subagents of the engineer). The README gets one line: for a critical or large PR, another engineer may run `/add-review` in its own worktree.
5. Roles work with and without the board. Without the board, handoff is the intent file (`docs/brainstorm/<timestamp>-<slug>-intent.md`) and `docs/features/<id>/about.md` created by `/add-new`.
6. The PM distributes one ticket per engineer and records the assignee on the ticket. Process rule only, no new code (the board has no per-ticket claim or lock).
7. `/add-help` (`framwork/.codeadd/commands/add-help.md`, Type H bot/agent mode, which already reads `agent-mode/README.md`) gets a pointer to the roles only.
8. Release: next release.
## Scope
In: README section, `roles/product-pm.md`, `roles/chief-engineer.md`, pointer in `add-help.md`, CHANGELOG/release note. Out: any change to commands, scripts, fragments or the board; a reviewer role; per-ticket lock/claim.
## Acceptance criteria
- README has the team section with all rules in decision 1, and links both role files.
- Both role files exist and each has commands, boundaries, when to ask, summary format.
- Chief engineer states mandatory `/add-review` before done/PR, blocker/major resolved, minors deferred per normal flow.
- PM states no implementation and the product acceptance check against intent criteria.
- Both roles describe the with-board and without-board handoff.
- `add-help.md` points to the roles.
- The installed package ships `.codeadd/agent-mode/roles/` (verify install copies the new folder; `npm run build` passes).
- A grep finds no claim the board locks per ticket.
## Risks
- Two engineers on the same ticket if the one-ticket rule is ignored (no technical guard).
- Cross-machine `rebase-conflict` / `push-refused` on the board: stops, needs a human.
- Drift: the team section must point to section 2 rules, not copy them.
## Real paths
- `framwork/.codeadd/agent-mode/README.md`, `result.schema.json` (exist)
- `framwork/.codeadd/agent-mode/roles/` (NEW)
- `framwork/.codeadd/commands/add-brainstorm.md`, `add-new.md`, `add-plan.md`, `add-build.md`, `add-review.md`, `add-done.md`, `add-pull-request.md`, `add-help.md` (exist)
- `framwork/.codeadd/scripts/backlog-commit.cjs` (exists)
- `framwork/.codeadd/fragments/board/` and `fragments/agent-mode/` (exist)
## Open
None

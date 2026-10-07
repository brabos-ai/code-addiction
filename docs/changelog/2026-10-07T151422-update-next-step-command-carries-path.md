# Next-step command carries the path

## Outcome

When brainstorm, plan or build closes, its last line is the next command with the relative path of the file it points at: `/add-framework--plan docs/brainstorming/<intent>.md`, `/add-framework--build docs/plans/<plan>.md`, `/add-framework--done docs/plans/<plan>.md`. The user copies one line and pastes it. No `@`, no slug to assemble.

## Why

The closings printed `[idea]` and `[slug]` placeholders, and the build printed no next command at all. A plan set shares one timestamp, so a slug fragment is ambiguous by construction. The product layer solved this in ticket 0018B. This is the internal equivalent; nothing under `framwork/` changed. The `@` prefix the ticket asked for was dropped by the user on 2026-10-07.

## Changes

- `add-final-report` owns the rule in a new section, **The Continuation Line**: the format, the `test -f` check on a chat closing, the spelling per provider (`/<name>` for claude and opencode, the bare name for codex), the plan-set case, automatic delivery, and who never prints one.
- `add-plan-authoring` Argument Resolution strips any directory part and a trailing `.md` before the match, so plan, build and done accept a plain path. The three outcome bullets and both STOPs are unchanged.
- `add-framework--plan` routes a path by where it points: under `docs/plans/` is Continue Mode, outside it is the new-idea input. An intent file is read at STEP 1.2; a design finds its intent by timestamp prefix. STEP 7 prints the revise line and then the build line.
- `add-framework--build` shows the path form and closes on `/add-framework--done <plan>`. It prints the line and never loads the close-out.
- `add-framework--brainstorm` closes STEP 7.3 on `/add-framework--plan <intent file>`; the design template points at the design's own path.
- `add-framework--done` shows that `[plan]` may be a plain path.
- `add-final-report` also lost its repeated rules (ruler items 3 and 7), with no rule removed.
- `cli/tests/next-step-command-carries-path.test.js` pins the owners, the missing placeholders, the STOPs, the preserved no-handoff sentence and the dropped `@`.

## Validation

`node scripts/build.js` exits 0 with no warning, before and after. `node scripts/build-workbench.js` exits 0. `framwork/` is untouched.

The new test file was written RED first (15 failing, 13 passing) and ends at 28 of 28. The official runner could not run on this machine (GNU `tar` in Git Bash reads `C:` as a host), so the file ran through a small stand-in; the full CLI suite is left to CI. Ticket 0024B's last check — a printed path resolved on disk — is the operator running `/add-framework--done docs/plans/<plan>.md` by hand after this build.

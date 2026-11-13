# Fix — a project-based, versioned QA seed replaces `qa.authSeed`

**Date:** 2026-11-12 · **Type:** fix · **Plan:** `2026-11-12T212018-PLAN--qa-project-seed` · **Release:** patch (v1.9.3), tagged by `add-framework--release` · **PR:** #171

## Summary
`qa.authSeed` held a test credential, first in the committed settings and then in a gitignored local file. Both placements were wrong for a feature that must run on a fresh clone. The key is gone with no fallback. `/add-qa-setup` now studies the project and generates a tracked, secret-free seed in `.codeadd/qa/`. Every QA run executes that seed first and uses what it prints.

## Why
A credential file the repository cannot carry means QA cannot run on a fresh clone, and moving the key around never removed it from git history. A seed that names env vars, never values, can be committed. It also fits projects with no auth, which the old key could not describe.

## What changed
- **Migration `0008-remove-qa-auth-seed`** removes the retired key from both settings files, parsing both before writing either. It warns `BREAKING:` only when it removed something. `0007` keeps its id and becomes a no-op, so a project on 1.9.1 still ends with no secret placement left.
- **`docs migrate`** drops the key branches and prints a note that a retired QA key was dropped and `/add-qa-setup` should be rerun.
- **The managed `.gitignore` block** carries `!.codeadd/qa/`. The installer and uninstaller treat the tracked seed as project data.
- **`qa-preflight.cjs`** gains the `QA_SEED` row. It never runs the seed. The local-file branch is removed from it and from `status.cjs`.
- **QA skills** define the Seed Output Contract: one JSON object on the last stdout line (`ready`, `baseUrl`, `identity`, `data`), exit 0. `add--settings` gains `qa.seed.command` and `qa.seed.env`.
- **`/add-qa-setup`** analyses the project before writing, keeps an existing seed, and generates the seed and its README.
- **Consumers:** `qa-agent` and `e2e-agent` use the seed output and never improvise a login. A seed gap is a finding that routes to the seed.
- **Per-feature evolution, `qa-pipeline` only:** `/add-plan` writes `## QA Seed Update`, `/add-build` applies it and checks seed coverage, `/add-review` runs the seed once per review. A boundary test proves nothing leaks when the feature is off, including with the playwright plugin on.
- **Guard:** `qa-retired-key.test.js` replaces `qa-secret-placement.test.js`.

## For QA users
Run `codeadd update`, then rerun `/add-qa-setup`. `SETUP_QA_STALE` is expected once. If a password was ever committed, git history keeps it: rotate it.

## Decisions worth knowing
- The seed runs once per QA run and agents reuse its output. A project that needs fresh state per spec makes its own seed idempotent.
- The STEP 7 review fixed the installer and uninstaller outside any F-block, because a fresh clone with a seed read as an existing install.
- Four `cli` test failures and two `scripts` failures reproduce on a baseline worktree. They are environmental, not this delivery's.

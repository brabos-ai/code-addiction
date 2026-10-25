# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [1.7.0] - 2026-10-25

### Added
- Open source governance files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`)
- GitHub templates for issues and pull requests
- CI and release workflows
- Root-level README for public onboarding
- Agent team section (`## 10`) in the agent-mode guide, and two role files, `roles/product-pm.md` and `roles/chief-engineer.md`
- Agent-mode board management guide (`agent-mode/board-management.md`): who writes the board, how each stage is mirrored to an external tracker, and how concurrent writes behave
- `/add-wiki` writes a fixed `## Stack Conventions` table (tenancy, DI, barrels, layering, validation, ORM / data access, entity language) in the wiki's `conventions.md`, with detection defined once in `add--architecture-discovery`. `/add-wiki update` backfills it once into an older wiki and never overwrites a `decided` row. The AGENTS.md `Multi-tenancy:` line appears only after a full `/add-wiki` run, since `update` never regenerates the Architecture Contract
- `/add-brainstorm` on a repo with no code and no `AGENTS.md` takes a greenfield path: one five-item foundations question (stack, tenancy, layering, validation, ORM) with recommendations, then writes `conventions.md` (`## Stack Conventions`, rows `decided`), a minimal wiki `index.md` and `.meta.json`, and a minimal `AGENTS.md`. "Keep discussing" writes nothing and a repo with no commit no longer stops at `status.cjs`. Other repos are unchanged. After it, make a first commit before `/add-new`; the next `/add-wiki` run confirms or flags the `decided` rows against code

- `.codeadd/settings.json`: one project settings file, committed, with one section per command (new skill `add--settings`). `/add-qa-setup` now keeps its values, receipt and decision log in the `qa` section and writes nothing under `docs/qa/`; `qa-preflight.cjs` and `status.cjs` read it. Migration `0005-qa-settings` converts an existing project on `codeadd update` without making it STALE; commit the new file afterwards
- `/add-setup`: guided onboarding. It checks the project, offers each feature and plugin with its benefit in one numbered list, and runs the setup pieces (tool installs, one `codeadd modify`, `/add-qa-setup`, `/add-wiki`) for the accepted items only. Decisions and reasons go in the `setup` section of `.codeadd/settings.json`. The install and update outros now point to it. Run it once after `codeadd update`.

### Removed
- Five generic skills no command or agent loaded: `add--stripe`, `add--plan-based-features`, `add--optimizing-git-workflow`, `add--project-scaffolding`, `add--skill-creator`. **`codeadd update` deletes them from your install, local edits included.** To author skills, install the native plugin: `/plugin install skill-creator@claude-plugins-official` (marketplace: `/plugin marketplace add anthropics/claude-plugins-official`)

### Fixed
- The managed `.gitignore` block no longer ignores `.codeadd/wiki/` or `.codeadd/settings.json`, a fresh clone that carries only `board.json`, `settings.json` and `wiki/` installs without `--force`, and an uninstall with a corrupted manifest keeps all three
- An existing board definitions file now gains the default statuses it lacks (`refining`, `shaped`, `planning`, `planned`, `in-review`, and `awaiting-release` when the release step is on), through `codeadd migrate` and on the write that names one. The pipeline's own status writes stop being refused as `unknown-status` on old boards; entries the user wrote are never edited
- `/add-done` runs from the linked worktree checked out on the feature branch for context, commit-push and the PR route; `--cleanup` there defers removing the worktree and the local branch and prints the commands. `--merge` still needs the primary checkout
- `done.cjs --commit-push` stages only the branch diff, untracked files beside it, the delivery folder and the close-out outputs; other uncommitted files stop the run with `DIRTY_UNRELATED=<path>` and are never staged
- `build-setup.cjs --worktree` copies the installed `.codeadd/` and provider folders into the new worktree and prints `COPIED=`
- Agent-mode guide: a hand-made worktree needs the framework copied or installed, and a destructive-command hook must allow `git push` and `gh pr merge` for `/add-done`

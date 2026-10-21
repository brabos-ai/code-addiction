# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Added
- Open source governance files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`)
- GitHub templates for issues and pull requests
- CI and release workflows
- Root-level README for public onboarding
- Agent team section (`## 10`) in the agent-mode guide, and two role files, `roles/product-pm.md` and `roles/chief-engineer.md`
- Agent-mode board management guide (`agent-mode/board-management.md`): who writes the board, how each stage is mirrored to an external tracker, and how concurrent writes behave

### Fixed
- An existing board definitions file now gains the default statuses it lacks (`refining`, `shaped`, `planning`, `planned`, `in-review`, and `awaiting-release` when the release step is on), through `codeadd migrate` and on the write that names one. The pipeline's own status writes stop being refused as `unknown-status` on old boards; entries the user wrote are never edited
- `/add-done` runs from the linked worktree checked out on the feature branch for context, commit-push and the PR route; `--cleanup` there defers removing the worktree and the local branch and prints the commands. `--merge` still needs the primary checkout
- `done.cjs --commit-push` stages only the branch diff, untracked files beside it, the delivery folder and the close-out outputs; other uncommitted files stop the run with `DIRTY_UNRELATED=<path>` and are never staged
- `build-setup.cjs --worktree` copies the installed `.codeadd/` and provider folders into the new worktree and prints `COPIED=`
- Agent-mode guide: a hand-made worktree needs the framework copied or installed, and a destructive-command hook must allow `git push` and `gh pr merge` for `/add-done`

# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

## [1.9.1] - 2026-11-11

### Fixed
- The release pipeline runs the tests before the `--package` build, so a failing test stops a release before anything is packaged.
- Leftover plan and brainstorm files that a post-sync commit had put on the code branch are gone from it. Code Addiction documents live on the docs branch only.

## [1.9.0] - 2026-11-11


### Added
- The docs branch. Every output Code Addiction writes (plans, feature docs, wiki, QA reports, changelog, the delivery index) now lives in `.codeadd/docs/`, a git worktree of the orphan `codeadd-docs` branch in your own remote. Code pull requests no longer carry any Code Addiction document. `status.cjs` prepares the worktree and prints one `DOCS=` line (it never fails on this step), code worktrees see the docs through a link, and `/add-done` commits and pushes the branch. Nothing deletes `codeadd-docs`.
- The docs-guard: an output written outside `.codeadd/docs/` is moved there silently at close-out, so it never reaches a code PR.
- `codeadd docs migrate [--dry-run]`: an optional, idempotent command for a project that kept its Code Addiction outputs in the code branch. It moves them into the docs branch in one commit there, stages the deletions in your code branch without committing them, and ends by printing `DOCS_LEGACY=<n>` and a ready-to-paste, provider-agnostic prompt (between `--- AGENT PROMPT ---` and `--- END AGENT PROMPT ---`) for your own agent. The command runs no agent and stamps no version; the prompt brings legacy documents to the current standard and stamps them. `codeadd update` does not run it.
- `schema:` on every generated markdown document: the version of the document format (currently 1), not the package version. A document without it is schema 0, a legacy document; JSONL outputs carry a per-line `v` instead.

### Changed
- **Re-run `/add-qa-setup` in every project that uses QA.** The ignore for the QA run output moved to the docs branch, so the setup contract changed and `SETUP_QA_STALE` is expected once.
- Agents searching the docs with `rg`, Grep or Glob must pass `.codeadd/docs/` explicitly, because those tools skip git-ignored paths.

## [1.8.1] - 2026-10-30

### Fixed
- The Notion integration of 1.8.0 was more than asked for. It is now one instruction-only agent-mode skill, `add--agent-notion`: the PM agent (or the engineer when there is no PM) builds the board with you once, keeps each card current at every pipeline milestone and always names work `<id>-<slug>`. `/add-setup` no longer offers a `notion` item and `add--settings` no longer has the key (a project that already recorded it keeps a harmless key). `codeadd update` now removes the folders it empties, so the two old Notion skill folders go from every provider directory. A project that had the old local board finds the migration order in section 10 of the agent-mode guide: move the in-progress and pending cards to Notion first, then delete `.codeadd/board.json`, `~/.codeadd/<key>/board/` and the remote `board` branch, the branch last.

## [1.8.0] - 2026-10-30

### Added
- Optional Notion tracking for agent mode, as two instruction-only skills (no script, no API client, no sync). `add--notion-setup` builds the cards database and a `Como funciona` page that holds the workflow rules, and links each provider's MCP configuration; `add--notion` has agents read that page first and move cards along the pipeline. `/add-setup` offers a new `notion` item, recorded in `setup.offered`; the agent-mode guide has a new section 10 and the two role files one paragraph each. Without Notion nothing changes.

### Removed
- The `board` feature, the backlog board and everything around it: the `board` option of `codeadd features`, the fragments injected into six commands, the backlog scripts (`backlog-cli.cjs`, `backlog-commit.cjs` and the rest), the `add--backlog` skill, the agent-mode board guide and the ticket field of the agent-mode result block. Feature folders are now named `<id>-<slug>` and the allocator (`feature-id.cjs`, renamed from `backlog-id.cjs`) counts feature folders only; old `NNNNB` ids are still read, never given out. A legacy `ticket:` field in a document stays valid. Migration `0006-retire-board` drops the `board` flag on `codeadd update` and notes it once. **It leaves `.codeadd/board.json`, the `board` branch and the clone under `~/.codeadd` untouched — your tickets stay where they are, readable as plain files.**

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

- `.codeadd/settings.json`: one project settings file, committed, with one section per command (new skill `add--settings`). `/add-qa-setup` now keeps its values, receipt and decision log in the `qa` section and no longer writes a separate QA config or receipt file; `qa-preflight.cjs` and `status.cjs` read it. Migration `0005-qa-settings` converts an existing project on `codeadd update` without making it STALE; commit the new file afterwards
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

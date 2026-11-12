# docs-branch-fixes — intent

Source: Maicon approved, 2026-11-12 (BRT); PM decisions. Findings come from the Estanka upgrade to v1.9.1 ([xmaiconx/organize-my-finances PR #66](https://github.com/xmaiconx/organize-my-finances/pull/66), merged) and fix [Isolar documentos do Code Addiction na branch codeadd-docs](https://app.notion.com/p/415e0000aeae81808613fd40d66b3c89) (0078F-docs-branch, v1.9.1). Checked on main `12e4f0be` (v1.9.1). Paths are under `framwork/.codeadd/` (product) unless stated otherwise; `workbench/` is internal. Patch v1.9.2.

Copied from the Notion intent https://app.notion.com/p/416e0000aeae81c0a93eddad68893cc5 (card [docs-branch-fixes](https://app.notion.com/p/416e0000aeae812ab748d3323ec7479e), fetched 2026-11-12 16:14 America/Sao_Paulo). This copy is for the plan step and is not committed.

```yaml
path: bounded
topic: docs-branch-fixes
doc: none
delivery: confirm
ticket: none
```

## Decided

1. Order: decision 8 (secrets) is the most severe and is done first. The rest follow in the order below.
2. Sync writes only to the docs worktree. The internal `/add-framework--sync` (`workbench/commands/add-framework--sync.md`) writes only into the `codeadd-docs` worktree (`.codeadd/docs/`) and never recreates a `docs/` copy. Context: commit `2fe12985` had to drop leftover `docs/brainstorming/0078F-docs-branch-intent.md` and `docs/plans/2026-11-11T121728-PLAN--docs-branch.md` from the code branch. Regression check: the zero-legacy guard (`cli/tests/docs-no-legacy.test.js`) also covers the sync output and fails when a `docs/` folder with Code Addiction files is tracked again.
   - Acceptance: a sync run leaves `git ls-files docs` empty; the guard test fails on a planted tracked `docs/` Code Addiction file and passes without it.
3. Migrate reports stale references. `codeadd docs migrate` (`cli/src/docs-migrate.js`) scans project files outside `.codeadd/docs/` (skipping `.git`, `node_modules` and build outputs such as `dist/`, `build/`, `.next/`, `coverage/`) for references to the moved legacy paths (e.g. `docs/qa/config.json`, `docs/features/`, test fixtures). It prints each hit as `file:line` under a "needs update" heading in the final summary. It never rewrites code. The printed agent prompt (`templates/docs-migrate-prompt.md`) adds a step to fix those references. The migrate command stays the only place that knows the legacy paths. Estanka case: `apps/e2e/src/catalog.ts` and `apps/api/scripts/mcp-bench.mjs` still read `docs/features/` and `docs/qa/config.json` after PR #66.
   - Acceptance: on a fixture with a source file that reads `docs/qa/config.json`, the summary lists it as `file:line` under "needs update", the file is unchanged, and the prompt carries the fix step.
4. Headless permissions (docs only). The agent-mode guide (`agent-mode/README.md`, headless section around the `claude -p` examples) documents the permissions a headless run needs: write access to the provider skills folder (`.claude/skills/` for Claude Code) for `/add-qa-setup`, given through `--allowedTools` or a permission mode, and `Bash(node:*)` for the verification prompt. The text is provider-agnostic with the Claude Code example. It does not recommend `bypassPermissions` as the default.
   - Acceptance: the guide names both permissions with a Claude Code example and a generic sentence for other providers; it contains no default `bypassPermissions` advice.
5. Migrate never skips silently. `codeadd docs migrate` stamps every doc it can. For each doc it cannot stamp it writes a report file in the docs root (e.g. `.codeadd/docs/migration-report.md`) with the path and the reason: a non-standard id (e.g. `0002CHG`), a `qa-validation` without evidence, a design without a hash, or an unknown type. It prints the count, and the agent prompt points to that report as the list to fix. This replaces the v1.9.1 rule of moving without stamping (0078F decision 21): Estanka had 419 of 768 docs adjusted by the agent and the rest left without a reason list.
   - Acceptance: on a fixture with stampable and unstampable docs, every stampable doc gets `schema:`, each unstampable one appears in `migration-report.md` with a reason, the count is printed, and the prompt names the report.
6. Release promotes `[Unreleased]`. The release flow (`workbench/commands/add-framework--release.md` STEP 6 and `scripts/release.cjs` / `scripts/create-release-tag.cjs`) moves the `## [Unreleased]` section of `CHANGELOG.md` into `## [<version>] - <date>` when it tags, leaving an empty `[Unreleased]`. Today `CHANGELOG.md` has `[Unreleased]` at line 7 and no `1.9.0` or `1.9.1` section after both releases. v1.9.2 also writes the missing `1.9.0` and `1.9.1` entries.
   - Acceptance: a release run on a fixture changelog produces the version section with the former Unreleased content and an empty Unreleased; `CHANGELOG.md` on main has `1.9.0`, `1.9.1` and `1.9.2` sections.
7. Migrate always prints a summary. The summary is printed on every run, including the idempotent no-op (`MIGRATED=already` or `MIGRATED=nothing`, `delivered.jsonl` already at `v: 1`), and says that nothing was moved and why. Today `nothing` prints no prompt and no summary (`cli/src/docs-migrate.js:31-34`).
   - Acceptance: a second run on a migrated fixture prints the summary with zero moved and the reason.
8. Secrets never in a tracked file (most severe). The QA `authSeed` sign-in data (passwords) leaves `.codeadd/settings.json`, which the generated `.gitignore` keeps committed (`cli/src/gitignore.js:16`, `!.codeadd/settings.json`). It moves to a gitignored local file (e.g. `.codeadd/settings.local.json`, added to the managed block in `cli/src/gitignore.js`) or to an env var reference. `settings.json` keeps only non-secret config. Rules and readers follow: `skills/add--settings/SKILL.md` (`qa.authSeed` schema), `commands/add-qa-setup.md` (`.codeadd/settings.json#qa`), `scripts/qa-preflight.cjs`, `scripts/status.cjs`, `agents/qa-agent.md`, `agents/e2e-agent.md`, `skills/add--setup-contract/SKILL.md`. `codeadd update` moves an existing `authSeed` secret out of `settings.json` automatically and prints a warning telling the user to check whether it was already committed and, if so, to rotate the test password. The legacy QA migration (`migrateQaSettings` in `cli/src/docs-migrate.js:106`) writes the secret to the local file, never to `settings.json`.
   - Findings (values not copied anywhere): Estanka has a committed QA test password in the git history of `docs/qa/config.json` (the `authSeed` field). PR #66 removed the file from the code branch, but the history keeps it, so the test password must be rotated. PR #66 kept the migrated `qa` section local (not committed). The code-addiction repo has no tracked `.codeadd/settings.json` and no committed `authSeed` value.
   - Acceptance: after install, `/add-qa-setup` writes no secret to `settings.json`; `git check-ignore` matches the local file; `codeadd update` on a fixture with `authSeed` in `settings.json` moves it to the local file, leaves `settings.json` without it, and prints the warning; a test fails if any shipped writer puts `authSeed` content in `settings.json`.
9. Release: patch v1.9.2, with the CHANGELOG entry describing the seven fixes and the rotation warning.

## Open

None

```bash
/add-framework--plan <this intent>
```

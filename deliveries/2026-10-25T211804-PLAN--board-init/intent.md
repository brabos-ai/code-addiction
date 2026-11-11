# Intent: board-init

Source: Notion intent https://app.notion.com/p/404e0000aeae81a5a884fba9dc9ee93f (card https://app.notion.com/p/404e0000aeae8165a8d2c042e92ab5a5). Board ticket 0070B. Approved by Maicon on 2026-10-25 12:07 BRT ("Sim, pode pedir pra criar."). Decision 10 = automatic push, confirmed by Maicon at 12:15 BRT.

```yaml
path: bounded
topic: board-init
doc: none
delivery: confirm
ticket: 0070B
```

## Decided

1. Problem: turning the `board` feature on does not create a board. Checked on main `5ef82709` (v1.7.0, `cli/package.json`). `enableFeature` only flips the flag and reconciles the fragment slots (`cli/src/features.js:216-220`). `codeadd modify` calls only that (`cli/src/modify.js:365-369`). `/add-setup` marks `board` as `unavailable` when there is no `.codeadd/board.json` and tells the user to "ask the framework maintainer" (`commands/add-setup.md:97`, `:137`). The only creation path is the internal `scripts/migrations/migrate-board.cjs`, which is never shipped (`:6-10`). README tells people to download it (`README.md:94-100`). The states differ by case (`scripts/backlog-board.cjs:155-182`):
   - A fresh project with neither file resolves to `none`. `backlog-commit.cjs` then prints `REFUSED=board-not-configured` and exits 2 (`scripts/backlog-commit.cjs:167-170`), and reads print `BACKLOG_PRESENT=no`.
   - `branch-missing` means board.json exists but the remote has no branch.
   - `migration-required` means `docs/backlog.jsonl` is in the checkout, or board.json is invalid.
   - The last two say "Ask the framework maintainer" (`backlog-commit.cjs:173-177`, `backlog-cli.cjs:393-397`).
A failed board write never fails a command (`agent-mode/board-management.md:21`), so every ticket transition is silently lost. Paths are under `framwork/.codeadd/` unless stated otherwise.
2. New shipped script `scripts/board-init.cjs`. It uses Node built-ins plus its siblings `backlog-board.cjs` and `backlog-git.cjs` only, which is the rule that admits shipped scripts (`scripts/build.js:1806-1825`). It ships with the `scripts` subdir like every other script. Regenerate the AGENTS.md inventory block (`AGENTS.md:26`) with `node scripts/inventory.js`.
3. Behaviour by `board.resolve()` state. Every refusal changes nothing.
   - `ready`: print `BOARD=ready` and exit 0. Touch nothing. A project that already has a board stays exactly as it is.
   - `none`: run the full create (decisions 4-8).
   - `branch-missing`: create the branch on the remote named in the existing config. Do not rewrite the config, then make the clone.
   - `migration-required`: `ERROR=board-migration-required`, pointing to the README Board migration section. The legacy route stays with the internal migrate-board.
   - `checkout-missing`: `ERROR=board-unavailable`.
   - Not a git repository: `ERROR=not-a-git-repository`, exit 2.
4. Config: write `.codeadd/board.json` as `{ "remote": <origin URL>, "branch": "board" }`, the same shape as `migrate-board.cjs:345`. With no `origin`, print `ERROR=no-remote` and write nothing. The message says to add an origin, push the main branch, then run again.
5. Base branch required. After a fetch, discover it in this order: origin/HEAD, then main, then master (copied from `migrate-board.cjs:152-162`). With no base, print `ERROR=no-base-branch` and push nothing. Reason: on an empty GitHub repository, the first branch pushed becomes the default branch, so pushing the orphan `board` first would make `board` the repo's default. Greenfield order: first commit and push main, then create the board.
6. Board branch. Build an orphan root commit in a temp dir, as in `migrate-board.cjs:232-261`.
   - Contents: an empty `docs/backlog.jsonl` and no definitions file. The core seeds the default definitions on the first write (`scripts/backlog-core.cjs:163-168`).
   - Message: `Create the board`.
   - Trailers: `Migrated-From: <origin/<base> sha>`, `Backlog-Blob: none`, `Definitions-Blob: none`. Reason: migrate-board reports a root without `Migrated-From` as `board-unrecognised` (`:364-368`). The same trailers keep a board-init board recognisable to the internal tool, and the value records which code commit the board started from.
   - The script pushes only `board`. A board cannot exist without that push, because resolve clones from the remote (`backlog-board.cjs:176-181`). A rejected push means another machine created it first, and the script carries on as "present" (as in `migrate-board.cjs:255-257`).
7. Clone: `board.resolve()` after writing the config makes `~/.codeadd/<project-key>/board/`. The key comes from the config's remote (`backlog-board.cjs:168-169`). On failure, remove the config written and print `ERROR=board-unavailable`.
8. Code side: run `git add -f -- .codeadd/board.json` only. The code repository is never committed or pushed. `.gitignore` is not edited, because the managed block already holds `!.codeadd/board.json` (`cli/src/gitignore.js:16`). If `git check-ignore` still ignores the file, print `IGNORE_WARNING=board-json-ignored` and `IGNORE_RULE=<rule>`, as in `migrate-board.cjs:467-472`.
9. Output is KEY=value lines:
   - `BOARD=created|ready`, `BOARD_DIR`, `BASE_BRANCH`, `BOARD_BRANCH_CREATED=yes|raced`.
   - `CODE_CHANGES=staged` and `STAGED=.codeadd/board.json`, plus a line "commit .codeadd/board.json".
   - Exit 0 when done or already done, 1 on failure, 2 on caller error.
10. CLI. This applies to `install --enable-feature board`, `modify --enable-feature board` and `features enable board`, in project scope only.
    - After `enableFeature`, when `.codeadd/board.json` is absent, spawn `node .codeadd/scripts/board-init.cjs` and print the result. This is the same spawn pattern as `syncBoardDefinitions` (`cli/src/migrations.js:507-538`), with an injectable exec for tests.
    - Not a git repository, or `no-remote`, `no-base-branch` or any error: print one warning line with the command to run later. The enable still succeeds.
    - Global scope: skip.
    - Reason: the explicit enable is the consent. The only push is the orphan `board` branch, never code.
    - Confirmed by Maicon on 2026-10-25 12:15 BRT ("Sim, push automático"): the CLI enable pushes the orphan `board` branch to origin automatically. The alternative (the CLI only prints the command) was rejected.
11. `/add-setup`: offer `board` like any other item and remove the `unavailable` value.
    - Recommend yes when `agent-mode` is accepted or on, otherwise no. Reason shown: "creates the board branch on origin; needs origin with the main branch pushed".
    - On accept, it goes through the same single `codeadd modify`, which creates the board (decision 10). `/add-setup` reads `BOARD=` or `ERROR=` from the output and records `enabled`, or `failed` with the reason.
    - Remove the `unavailable` drift exception (`:97`) and the maintainer reason (`:137`). An old record that says `unavailable` is treated as new and asked again.
12. Messages that named the maintainer:
    - `branch-missing` (`backlog-commit.cjs:175-176`, `backlog-cli.cjs:395-396`): "Run `node .codeadd/scripts/board-init.cjs` (or /add-setup) to create it."
    - `none` in backlog-commit (`:168-169`): add the same hint.
    - `migration-required`: point to the README Board section (`https://github.com/brabos-ai/code-addiction#board`).
    - Apply the same text in `skills/add--backlog/SKILL.md:231-232` and the board app `board/src/components/states.tsx:19-26`.
    - `workbench/commands/add-framework--backlog.md:94` and `workbench/skills/add-plan-authoring/SKILL.md:357` do not name the maintainer, so they are not touched.
13. `scripts/migrations/migrate-board.cjs` stays as it is (internal, covered by `scripts/tests/migrate-board.test.cjs`). It does not reuse the new module. Accept about 60 duplicated lines (`discoverBase`, `createBoardBranch`). Reason: migrate-board loads modules from installs from 1.5.0 onward (`:110-140`), and adding `board-init.cjs` to `NEEDED` would break it on 1.5-1.7 installs.
14. Tests:
    - `scripts/tests/board-init.test.cjs`, using the fixtures of `migrate-board.test.cjs` (temp bare remote, temp project, temp `CODEADD_BOARD_DIR`). Cases:
      - `none` gives `created`: the branch is on the remote, the root carries `Migrated-From`, board.json is staged, and nothing is committed in the code repo.
      - A second run gives `ready`, a no-op, with the remote sha unchanged.
      - `branch-missing` is created from the existing config.
      - `no-remote`.
      - `no-base-branch`: empty remote, nothing pushed.
      - `migration-required` is refused.
    - CLI enable in `cli/tests/board-feature.test.js` or `features.test.js` with the injected exec: it calls the script, skips when board.json exists, skips in global scope, and the enable still succeeds when the script fails.
    - Update `cli/tests/add-setup.test.js:263` (the `unavailable` drift assertion).
15. Docs:
    - `README.md` Board section (`:86-100`): a "New project" paragraph. Enabling, or `/add-setup`, creates the board and needs origin with main pushed; commit `.codeadd/board.json` afterwards. The migration paragraph stays.
    - `agent-mode/board-management.md` section 1: one line on how the board is created.
    - The `cli/src/features.js:82-86` comment.
    - `CHANGELOG.md` `[Unreleased]` Added.
    - The site (`web/src/pages/docs.astro:685-688`) only lists the feature, so no change.

## Acceptance

- In a new repo with origin and main pushed, `npx codeadd install --enable-feature board` leaves `origin/board`, the clone under `~/.codeadd/<key>/board/` and `.codeadd/board.json` staged, with no commit on the code branch. Next, `backlog-commit.cjs add` writes a ticket.
- Running it again, or running it on a project that already has a board, changes nothing (`BOARD=ready`).
- No origin, or an empty remote, pushes nothing and the enable still succeeds with a warning line.
- No shipped text says "framework maintainer" for the board.
- `npm run test:scripts` and `npm run test:cli` are green.

## Risks

- The CLI enable now pushes the orphan `board` branch to origin. That is visible on the remote, but it never touches code branches.
- Duplicated logic with migrate-board can drift. Both are covered by tests.
- Enable in CI or without credentials: the push fails, which gives a warning and an enable that still succeeds.

## Open

None

## PM shaping notes

- States handled by board-init.cjs:
  | `board.resolve()` state | Action |
  |---|---|
  | `ready` | no-op, `BOARD=ready` |
  | `none` | full create |
  | `branch-missing` | create the branch from the existing config |
  | `migration-required` | refuse, point to the README Board section |
  | no origin | `ERROR=no-remote`, nothing written |
  | no base branch on origin | `ERROR=no-base-branch`, nothing pushed (an empty GitHub repo would make `board` the default branch) |
- Two corrections to the original problem statement: a fresh project gives `REFUSED=board-not-configured` (not `migration-required`/`branch-missing`), and the clone uses the key derived from the remote.
- Root commit trailers: `Migrated-From: <origin/base sha>`, `Backlog-Blob: none`, `Definitions-Blob: none` (keeps migrate-board step 4 recognising it).
- Pushes only the `board` branch; code side = `git add -f .codeadd/board.json`, never committed or pushed; `.gitignore` not edited.
- CLI enable (project scope, board.json absent) spawns the script like `migrations.js` `syncBoardDefinitions`; any failure = one warn line, enable still succeeds.
- `/add-setup`: board offered normally, `unavailable` value and drift exception removed; recommend yes with agent-mode.
- Replace "ask the framework maintainer" texts with board-init.cjs / README Board pointers.
- `migrate-board.cjs` left as is (no shared module; a `NEEDED` change would break 1.5-1.7 installs).
- Runs after site-i18n; ships with the next release.

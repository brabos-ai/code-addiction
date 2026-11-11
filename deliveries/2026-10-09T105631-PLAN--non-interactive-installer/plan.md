# Plan: Non-interactive installer — install, modify, update and features list run from flags with no TTY

> **Status:** implemented
> **Layers:** product
> **Type:** product
> **Created:** 2026-10-09
> **Delivery:** confirm
> **Ticket:** 0036B

---

## Objective

[from conversation, no design document] A bot, CI job or agent can install codeadd, change providers,
features and plugins, and update, from flags alone with stdin not a TTY — never a hang, never a silent
guess — while the interactive flow for humans stays exactly as it is. Replaces the 0027B dead end
(`cli/src/installer.js:193-202` only throws without a TTY).

**When this build is done:** `codeadd install`, `modify`, `update` and `features` each have a
non-interactive road that either finishes the requested change with exit 0 or exits 1 with a message
naming the flag that is missing. Destructive steps need `--force`. A requested plugin that could not
be enabled ends in a non-zero exit after everything else is applied. `codeadd --help`,
`cli/README.md` and the agent-mode guide document the flags. Run with no flags in a terminal, every
command behaves exactly as it does today.

**Ticket done when:** With stdin not a TTY, install (with --providers and feature flags), modify (with flags and --force) and update finish without a prompt and change providers, features and plugins as asked; missing --providers or a destructive step without --force exits 1 with a clear message; features list prints and exits; tests cover each case, codeadd --help and the agent-mode guide list the flags, and the interactive flow is unchanged.

## Context

0027B made `install` fail fast without a TTY instead of hanging. That stopped the hang, but it left
a bot with no way to install at all. `modify` ignores its arguments today (`void args`). `features`
with no action opens a multiselect.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-09T105500-non-interactive-installer-intent.md` | Path `bounded`. Every flag and its meaning, the defaults without a TTY, the `--force` rule, the plugin exit signal, the proofs (a)–(e) and what is out of scope. `## Open: None` |

Three more decisions were taken at this plan's STEP 4 and are recorded under **Validated Decisions**:
P1 (flags with a TTY), P2 (`providers remove` without `--force`) and P3 (the `.claude/` case).

## Global Constraints

- Non-interactive mode is `!process.stdin.isTTY`; no `--yes` / `--non-interactive` flag is added (intent, Decided 2)
- A non-interactive failure is a plain `Error` (exit 1), never `USER_CANCEL` — `runCli` maps `USER_CANCEL` to exit 0 (`cli/src/cli.js:219-222`)
- Destructive confirmation vocabulary is `--force` only (intent, Decided 4)
- Features and plugins flags are deltas, never final sets; `--providers` is the final set (intent, Decided 7-8)
- No new apply core: every change to an existing install goes through `applyDesiredState` (`cli/src/modify.js:31-47`)
- Tests run through `node scripts/run-tests.js cli`, never `npx vitest` inside `cli/` (AGENTS.md, Key files)
- No existing assertion in `install.e2e`, `modify`, `features` or `prompt` tests changes; the only edit allowed in them is setting `process.stdin.isTTY = true` in the `beforeEach` of the interactive blocks (intent, Decided — Proof; STEP 4 decision A)

## Problem

1. **No road for a bot** — `install` without a TTY only throws, `modify` has no flags, and `features`
   waits on a multiselect. A CI job or an agent cannot install or change an installation.
2. **Removal confirmation hangs or lies** — `applyDesiredState` calls `promptConfirm` on a removal
   without `force`. Without a TTY it either waits, or a cancel comes back as `USER_CANCEL`, which is
   exit 0 with nothing done. This also hits `providers remove <name>` without `--force`.

## Proposal

Add one shared flag reader. Teach the existing core to refuse a confirmation it cannot ask for, and
to report which plugins it could not enable. Then put flags on `modify` and `install` over that core,
make `features` print without a TTY, and document the flags where a bot reads them before installing.

**One rule for flags in both modes (P1):** a flag always fills its own answer and skips its own
prompt. What happens when a value is missing depends on the TTY: with one, the prompt is asked as
today; without one, the documented default is used or the command exits 1. With no flags, the
interactive flow is byte-for-byte today's.

## Scope

### Includes

- **F1** [product] — `cli/src/change-flags.js` (new) and `cli/src/cli.js`: the flag reader.
  - `change-flags.js` exports `getArgValues(argv, flag)`, which accepts both repeated flags and
    comma lists, inline `--flag=a,b` included, and trims and de-duplicates the values.
  - `change-flags.js` also exports `readChangeFlags(argv)`. It returns `{ providers, features,
    plugins, force, gitignore, any }`:
    - `providers` is `undefined` when absent, `[]` for `none`, or the list of keys.
    - `features` and `plugins` are `{name: boolean}` maps built from the four delta flags.
    - `gitignore` is `false` only when `--no-gitignore` is present, else `undefined`.
    - `any` is true when any change flag is present (`--force` alone does not count).
  - A name in both an enable and a disable flag is an error.
  - `getArgValue` in `cli.js` keeps how `--version` / `--channel` parse. Only its error message
    changes, to a per-flag hint: `<tag|main>` for `--version`, `<stable|beta>` for `--channel`.
  - A new module and not `cli.js` itself, because `modify.js` and `installer.js` must read it, and
    `cli.js` imports both of them.
  - **Produces:** `readChangeFlags(argv) → { providers, features, plugins, force, gitignore, any }`
- **F2** [product] — `cli/src/modify.js` core (`validate`, `applyDesiredState`):
  - `validate` is exported as `validateDesired`, with the same body.
  - A removal without `force` and without a TTY throws a plain `Error`. The message names the
    providers and `--force`. It is thrown BEFORE anything is touched, like the existing check.
  - `applyDesiredState` returns the diff plus `pluginsNotEnabled: string[]`, the names whose
    `enablePlugin` returned `ok: false`. The existing warning wording is kept.
  - `providers remove` inherits the no-TTY error with no change of its own (P2).
  - Must not lose: the TTY path still calls `promptConfirm`, and the order copy → prune → manifest →
    baselines → features → plugins → MCP → .gitignore is unchanged.
  - **Produces:** `validateDesired(desired, scope, installed)`
  - **Produces:** `applyDesiredState(...).pluginsNotEnabled`
- **F3** [product] — `cli/src/modify.js` `modify()`: when `readChangeFlags(args).any` is true,
  `modify` builds `desired` and calls `applyDesiredState(cwd, desired, { force })`, with no prompt.
  - `desired` takes `--providers` as the final set, plus the feature and plugin maps.
  - After the apply, a non-empty `pluginsNotEnabled` throws an `Error` naming those plugins, so
    `runCli` exits 1 with everything else already applied.
  - With no change flag, `modify` is the interactive editor it is today. The install menu's
    `modify(targetDir, [], scope)` call keeps reaching it.
  - With no change flag and no TTY, `modify` exits 1 with a message showing the flags. Without
    that, it would open `promptModify` and wait.
  - **Consumes:** `readChangeFlags(argv) → { providers, features, plugins, force, gitignore, any }` (F1)
  - **Consumes:** `applyDesiredState(...).pluginsNotEnabled` (F2)
- **F4** [product] — `cli/src/installer.js` `install()` and `cli/src/cli.js` dispatch: the
  non-interactive install.
  - `runCli` passes the raw `args` into `install` options, so `install` calls `readChangeFlags`.
  - The 0027B guard is replaced. Without a TTY, these checks run in this order, all BEFORE the
    download:
    1. An existing manifest exits 1 with a message pointing to `codeadd update` and
       `codeadd modify --…`.
    2. A missing `--providers` exits 1 with a message showing the flag and an example.
    3. `validateDesired` checks the providers, features and plugins against the scope.
    4. An existing `.codeadd/` or provider dir without `--force` exits 1, and the message names
       `--force` (P3).
  - Defaults without a TTY:
    - scope `project`, or `global` with `--global` / `--user`
    - gitignore `true`, off with `--no-gitignore`
    - features are the registry defaults with the deltas merged in BEFORE `writeManifest`
    - plugins none
  - With a TTY, each flag skips only its own prompt (P1). `--force` skips both overwrite
    confirmations. `--global` still skips the scope prompt as today.
  - The existing-install menu is unchanged with a TTY.
  - Requested plugins are enabled after the install completes, through
    `applyDesiredState(targetDir, { plugins })`. A non-empty `pluginsNotEnabled` then throws, as in F3.
  - `--version` and `--channel` keep working.
  - Must not lose: install's write order, the migration stamp, and the MCP registration.
  - **Consumes:** `readChangeFlags(argv) → { providers, features, plugins, force, gitignore, any }` (F1)
  - **Consumes:** `validateDesired(desired, scope, installed)` (F2)
  - **Consumes:** `applyDesiredState(...).pluginsNotEnabled` (F2)
- **F5** [product] — `cli/src/features.js` `features()`: `features` and `features list` without a TTY
  print each feature with its state and exit 0, like `plugins list`. The legacy-key warnings are
  still printed. With a TTY they are unchanged. `enable` and `disable` are untouched.
- **F6** [product] — docs:
  - `USAGE` in `cli/src/cli.js` lists every new flag and adds bot examples:
    - `install --providers claude,codex --enable-feature board`
    - the same call with `--force` for a project that already has `.claude/` (P3)
    - `modify --providers claude --force --disable-feature tdd-pipeline`
    - `install --providers none`
  - `USAGE` also says in one line that without a TTY `--providers` is required.
  - `cli/README.md` gets the same flags and examples.
  - `framwork/.codeadd/agent-mode/README.md` gets a section "Install and change the installation
    from a bot" with 3-4 examples. It carries one line saying this CLI path works for every
    provider, while the slash-command contract above it stays Claude Code only.
  - The new section names no `/add-*` command that is not registered, so `agent-mode.test.js` L1.4
    holds.
- **F7** [product] — tests, written RED before F1–F5 land; see the Validation Matrix.
  - `cli/tests/change-flags.test.js` (new) covers the parser.
  - `cli/tests/non-interactive.e2e.test.js` (new) runs in-process with `process.stdin.isTTY = false`,
    the `github.js` mocks of `install.e2e`, and prompt mocks that make the test fail when called. It
    covers every case that downloads.
  - `cli/tests/bin-entrypoint.integration.test.js` gets the spawn cases, `spawnSync` with
    `input: ''` and a timeout. They cover every case that fails before a download.
  - `cli/tests/modify.test.js` and `cli/tests/features.test.js` get `process.stdin.isTTY = true` in the `beforeEach` of their interactive blocks (restored in `afterEach`), the pattern `install.e2e.test.js:77-100` already uses. Under vitest `isTTY` is `undefined`, so without it those tests would enter the no-TTY branches. No assertion in them changes.
  - That file's 0027B test asserting `interactive terminal` is updated to the new `--providers`
    message. This is the one existing assertion that changes, and it changes on purpose.

### Does NOT Include (important!)

- `uninstall` when both a project and a global install exist — its scope prompt stays (intent)
- A `--json` output mode — exit codes and messages are the contract (intent)
- A reinstall action flag — a bot runs `uninstall --force` then `install` (intent)
- Changing the version through `modify` (intent)
- The `install --version main` → `vmain` mismatch between `cli/README.md` and `resolveInstallSource` (intent)
- Honouring change flags inside the TTY existing-install menu — the menu is unchanged and a choice of
  Modify there stays interactive
- New flags on `update` — it already runs with no prompt; it only gets a test and docs (intent)

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Every decision in the intent file | Carried as settled | `docs/brainstorming/2026-10-09T105500-non-interactive-installer-intent.md` |
| P1 — flags with a TTY | Each flag fills its own answer and skips its own prompt; missing values are asked as today; `--force` skips the overwrite confirmations in both modes | One rule ("the flag wins"); with no flags the flow is unchanged. Ignoring a flag silently was rejected. Confirmed by the user at STEP 4 |
| P2 — `providers remove` without `--force`, no TTY | In scope: the core error covers it, with its own test | It shares `applyDesiredState`; leaving it out would hide the effect. Confirmed at STEP 4 |
| P3 — an existing `.claude/` without `--force`, no TTY | Keep the intent's rule: exit 1. The message names `--force` and the docs show it | Overwriting files is destructive; the mitigation is in F4's message and F6's examples. Confirmed at STEP 4 |
| Existing tests under vitest, where `isTTY` is `undefined` | Option A: add `isTTY = true` setup to the interactive blocks of `modify.test.js` and `features.test.js`; no assertion changes | Visible where it matters, same pattern as `install.e2e`. A global `setupFiles` was rejected: it changes the environment of every test invisibly. Found by the plan review; confirmed at STEP 4 |
| Error type without a TTY | Plain `Error`, never `USER_CANCEL` | `USER_CANCEL` exits 0, which a bot reads as success |
| Where install validates names | Before the download, through `validateDesired` | A typo must change nothing |
| How the plugin failure exits | Throw after the apply, so `runCli` exits 1 | `process.exitCode` would leak into an in-process test run; throwing keeps one exit path |
| Where the flag reader lives | New `cli/src/change-flags.js` | `cli.js` imports `modify.js` and `installer.js`; reading flags from `cli.js` would add a cycle |
| How the tests reach a download | In-process with mocks for downloading cases; spawn for cases that fail first | A child process cannot use `vi.mock`, so a spawn test can only prove the paths that stop before the network |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/src/change-flags.js` | product | create | F1 — shared flag reader |
| `cli/src/cli.js` | product | modify | F1 message per flag, F4 pass `args` to install, F6 `USAGE` |
| `cli/src/modify.js` | product | modify | F2 core, F3 flag mode |
| `cli/src/installer.js` | product | modify | F4 non-interactive install |
| `cli/src/features.js` | product | modify | F5 print without a TTY |
| `cli/README.md` | product | modify | F6 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F6 — new section |
| `cli/tests/change-flags.test.js` | product | create | F7 — L1 |
| `cli/tests/non-interactive.e2e.test.js` | product | create | F7 — L2 |
| `cli/tests/modify.test.js` | product | modify | F7 — `isTTY = true` setup only |
| `cli/tests/features.test.js` | product | modify | F7 — `isTTY = true` setup only |
| `cli/tests/bin-entrypoint.integration.test.js` | product | modify | F7 — L3, and the 0027B assertion updated |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

### L1 — Flag parsing (F1) (RED → GREEN)

1. `getArgValues` reads `--x a,b --x c` and `--x=a,b` as the list of values, trimmed and
   de-duplicated. *RED: the function does not exist.*
2. `readChangeFlags`:
   - `--providers none` gives `providers: []`, and no `--providers` gives `providers: undefined`.
   - The four delta flags give the expected maps.
   - `--no-gitignore` gives `gitignore: false`.
   - `any` is false for `[]` and for `['--force']`.
3. The same name in `--enable-feature` and `--disable-feature` throws.
4. `getArgValue(['--channel'], '--channel')` throws a message containing `<stable|beta>`, and the
   `--version` message still contains `<tag|main>`. *RED: both say `<tag|main>` today.*

### L2 — In-process, `process.stdin.isTTY = false`, every prompt mock fails the test if called (F2–F5)

1. **(a)** In an empty dir, `install` with `--providers claude,codex --enable-feature board`
   resolves. The manifest has `providers: ['claude','codex']` and `features.board: true`, and
   `tdd-pipeline` is still at its default. `.gitignore` carries the codeadd block. No prompt mock
   was called. *RED: install throws without a TTY.*
2. `install --providers none` writes the core only, with manifest `providers: []`.
3. `install --providers claude --no-gitignore` writes no `.gitignore` block.
4. `install --providers claude` in a dir with a `.claude/` dir:
   - Without `--force`, it rejects with a message containing `--force`, `downloadReleaseAsset` was
     not called, and no file was written.
   - With `--force`, it resolves.
5. `install --providers claude --enable-feature nope` rejects with `Unknown feature` before
   `downloadReleaseAsset` is called.
6. **(c)** On an install with `['claude','codex']`, `modify` with `--providers claude --force
   --disable-feature tdd-pipeline` resolves. The manifest has `providers: ['claude']` and
   `tdd-pipeline: false`, and no prompt mock was called. *RED: `modify` ignores args and calls
   `promptModify`.*
7. **(d)** `update` on an installed dir resolves with no prompt mock called.
8. **Plugin signal:** the test uses a catalog plugin whose `detect` command always fails, the
   `writeCatalog` pattern of `modify.test.js:96-100`. The real `gitnexus` is not used, because
   whether it is detected depends on the machine. `modify --enable-plugin <that plugin>` plus a
   feature delta:
   - It rejects with a message naming the plugin.
   - The feature delta was still applied.
   - The manifest does not carry the plugin as enabled.
9. The same plugin case through `install --providers claude --enable-plugin <that plugin>` rejects
   after the manifest is written.
10. **Interactive path unchanged:** with `isTTY = true`, `modify(dir, [], 'project')` calls
    `promptModify` exactly once.

### L3 — Spawned binary, `spawnSync` with `input: ''` and `timeout` (F3–F5)

Every case asserts `result.error` is `undefined`, which means no timeout, so no hang.

1. **(b)** `install` in an empty dir exits 1, and its stdout contains `--providers` and an example.
2. **(b)** `install` over an existing manifest exits 1, and its stdout contains `codeadd update` and
   `codeadd modify`.
3. **(c, no `--force`)** On a manifest with `['claude','codex']` and their files on disk,
   `modify --providers claude` exits 1. Its stdout contains `--force`, and the manifest and the
   files are byte-unchanged.
4. **P2:** `providers remove codex` on the same fixture exits 1, and its stdout contains `--force`.
   Nothing changed.
5. `modify` with no flags exits 1, and its stdout names the change flags.
6. **(e)** `features list` and bare `features` on an installed dir each exit 0, print every
   `FEATURES` name with its state, and do not time out. *RED: both open the multiselect.*

### L4 — Behavioural acceptance

1. `codeadd --help` output contains `--providers`, `--enable-feature`, `--disable-feature`,
   `--enable-plugin`, `--disable-plugin`, `--no-gitignore` and `--force` under install/modify.
2. `agent-mode/README.md` has the bot-install section with the flags. `agent-mode.test.js` passes.
3. `install.e2e.test.js`, `modify.test.js`, `features.test.js` and `prompt.test.js` pass. `git diff` on them shows only added `isTTY` setup lines, and no removed or changed assertion line.
4. `node scripts/run-tests.js cli` is green.

**RED expectations against the current tree:**
- L1.1, L1.2, L1.3 and L1.4 fail.
- L2.1–L2.9 fail: install throws without a TTY, and `modify` ignores args.
- L3.1 fails on the message. L3.3, L3.4 and L3.5 fail or time out on the prompt. L3.6 times out.
- L2.10 and L3.2 already pass. They guard behaviour that must not change.

**GREEN = all levels pass after F1–F6.**

---

## Execution Order

1. **F7 RED.** Write the L1–L3 tests and confirm the RED set above fails.
2. **F1 [product].** The reader comes first because F3 and F4 consume it.
3. **F2 [product].** The core comes before both doors: F3 reads `pluginsNotEnabled`, and F4 reads
   `validateDesired` and `pluginsNotEnabled`.
4. **F3 [product].**
5. **F4 [product].** It comes after F3 so that its plugin step reuses the throw F3 already proved.
6. **F5 [product].** Independent of the others.
7. **F6 [product].** Last, because it describes flags that now exist.

The repository is in a working state after each F-block. F1 and F2 add behaviour no caller uses
yet, apart from the removal error. A build that stops after F3 leaves `modify` usable by bots and
`install` as today.

Beyond the product-layer default, run `node scripts/run-tests.js cli` after F2, F4 and F6. F2 and
F4 change shared install paths, and F6 is checked by the agent-mode guide test.

## Reviewer Handoff

For each F-block the build must leave in its evidence:

- the files touched
- the validation levels that cover it, and their pass state
- any decision altered, with the Validated Decisions row it departs from

Gaps a reviewer must hunt:

1. An F-block marked done whose validation level was never RED. A test written after the fix proves
   nothing.
2. A no-TTY error that throws `USER_CANCEL`, or reaches `promptConfirm`, instead of a plain
   `Error`. It would exit 0.
3. A check in `install` that runs AFTER `downloadReleaseAsset`. The L2.4 and L2.5 assertions on the
   download mock are what catch it.
4. An edit to `install.e2e.test.js`, `modify.test.js`, `features.test.js` or `prompt.test.js` beyond the `isTTY` setup lines. Any changed assertion breaks L4.3.
5. Feature deltas applied with a second reconcile after install, instead of being merged into the
   manifest before `writeManifest`.

---

## Next Steps

/add-framework--build docs/plans/2026-10-09T105631-PLAN--non-interactive-installer.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-09 | Initial creation |
| 2026-10-09 | Review blocker B1/B2: vitest runs with `isTTY` undefined, so existing modify/features tests would enter the no-TTY branches. Option A adopted: `isTTY = true` setup in their interactive blocks; Global Constraints, F7, Impact, L4.3, Validated Decisions and Reviewer Handoff updated |
| 2026-10-09 | Implemented on feat/non-interactive-installer: commits 610bbcf (F7), b8e8d86 (F1), f510222 (F2), e8e7704 (F3), 5407597 (F4), 79caed3 (F5), c1de693 (F6), 91a28cf (review fixes) |

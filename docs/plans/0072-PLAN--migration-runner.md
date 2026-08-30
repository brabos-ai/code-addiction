# Plan: Migration Runner — close the install-path prune gap, then add a recorded escape hatch for what the update path cannot reach

> **Status:** implemented
> **Type:** architecture
> **Created:** 2026-08-25
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

The v0.7.2 patch removed `render-graphs.js` from the shipped surface. Investigating how that removal reaches installed projects surfaced the real boundary of the current update model.

`cli/src/updater.js:138-155` already prunes orphans **declaratively**: it diffs `manifest.files` (old) against the file list of the new release and unlinks the difference. Covered by `cli/tests/updater.test.js:99`. For anyone running `codeadd update`, `render-graphs.js` disappears on its own. No migration is needed for that case, and none should be written for it.

That declarative diff has two gaps:

- **`cli/src/installer.js` has no prune at all.** Running `install` over an existing installation overwrites `manifest.files` with the new list. Any file the previous version put on disk and the new one does not ship is now on disk **and absent from the manifest** — invisible to every future diff. No amount of updating recovers it. This is a defect in the diff mechanism itself, not a case for a migration.
- **`cli/src/updater.js:104-107` returns early** when the project is already on the latest version. Anything that must run against an already-current project has no vehicle today.

So the work splits cleanly in two. First, make the declarative prune work on both paths, so the mechanism stops manufacturing invisible orphans. Second, add a recorded, run-once runner for the residue the diff provably cannot see — files already orphaned on projects installed before the parity fix — and for transformations that are not "a file the release ships" at all.

No design doc precedes this plan; decisions are carried inline below.

## Problem

1. **The install path manufactures permanently invisible orphans.** A file dropped from a release, on a project that used `install` rather than `update`, is unreachable by the manifest diff forever. `render-graphs.js` is the live instance.
2. **Preservation rules live in one path only.** `PRESERVE_PATTERNS` / `shouldPreserve` (`updater.js:12-21`) are what stop the prune from deleting `history/` and `*.local.json`. They exist solely in `updater.js`; any prune added to `installer.js` without sharing them creates a second, divergable definition of "never delete this".
3. **An already-current project has no repair vehicle.** `codeadd update` short-circuits at `updater.js:104`. If a fix is not a file the release ships, there is no way to apply it.
4. **Files already orphaned stay orphaned.** Fixing the install path forward does nothing for projects that already lost the manifest record. Only an explicit, recorded transformation can clean those.

## Proposal

Two stages, in order.

**Stage one — parity.** Move the preservation rules into `installer.js`, export them, and have `updater.js` consume them so there is exactly one definition. Make `install()` read the pre-existing manifest before overwriting it, and prune the difference the same way `update()` does. This stops the bleeding: after it, no new invisible orphan is created by either path.

**Stage two — the runner.** An ordered registry of `{ id, description, run(ctx) }` entries, a ledger of applied ids in the manifest the CLI already reads and rewrites, and two drivers: automatic during `update`, and a manual `codeadd migrate` for projects the update path cannot reach. Its first entry cleans the orphans stage one cannot retroactively see.

No third-party framework. `cli/package.json` carries exactly two dependencies (`@clack/prompts`, `adm-zip`); `umzug`, `node-migrate` and `knex` are database-oriented and would import a storage adapter and connection model with no counterpart here. The mechanism is an ordered array plus a string array in a JSON file that is already being written.

Stage one is sequenced first because stage two's install-side work (F4) depends on the manifest read that F1 introduces, and because a runner merged before the parity fix would need a new migration for every future dropped file.

## Scope

### Includes

- **F1** — `cli/src/installer.js` + `cli/src/updater.js`: move `PRESERVE_PATTERNS` and `shouldPreserve` from `updater.js` into `installer.js` and export them; `updater.js` imports them and drops its local copy, matching the dependency direction that already exists (`updater.js` imports `fixLineEndings`, `writeManifest`, `resolveInstallSource` from `installer.js`). Then `install()` reads the pre-existing manifest before overwrite via `readManifest` (`injection-core.js:273`, returns `null` when absent) and, when one existed, unlinks every path in its `files` that the new install did not write, honouring the shared preservation rules. A `null` or unparseable manifest means no prior file list, therefore no prune.
  Both the manifest read and the prune target **`targetDir`** (`installer.js:202`, the scope-resolved directory every existing file operation and `writeManifest` already use), never the raw `cwd` parameter — the two diverge under `--global`, and the file already carries a standing comment about that split having caused confusion once.
  Must NOT lose: the exact preservation semantics `updater.js` has today — this is a move, not a rewrite; and the property that a first-time install with no prior manifest deletes nothing.
- **F2** — `cli/src/migrations.js` (new): the migration contract, the ordered registry, the runner, and the command-facing entry point. Placement follows the `features.js` / `plugins.js` convention, where one module owns its registry, its state helpers and its `export async function <name>(cwd, args, scope)` command entry. The contract is `{ id, description, run(ctx) }` where **`ctx` is `{ cwd, providers }`** — `providers` being the resolved provider list that `resolveSelected()` already produces at every call site in both `installer.js` and `updater.js`, so a migration can reach each installed provider dir without re-deriving it. Execution is ordered by id, isolated per migration (one failure never aborts the run), and supports a dry-run that reports without writing. A failed migration is **not** recorded, so the next run retries it. The module also exports the list of all known ids, for F4's baseline stamp.
  The registry's first entry, `0001-prune-legacy-orphans`, carries the explicit list of paths that releases up to v0.7.1 shipped and v0.7.2+ does not — currently `skills/add-skill-creator/render-graphs.js` — and removes it from `.codeadd/` and from each dir in `ctx.providers`. A missing file is a no-op that still records as applied, which is what makes re-running harmless. It exists because F1 fixes the install path only going forward; projects that already lost the manifest record are unreachable by any diff.
  Must NOT lose: run-once ledger semantics, and the guarantee that a migration throwing cannot fail its caller.
- **F3** — `cli/src/updater.js`: run pending migrations after the new files land and before `writeManifest`, and merge newly applied ids into the ledger passed through the existing metadata argument — the same way `features` and `plugins` state is already preserved across an update. Report through the existing `log` surface, consistent with how the orphan prune and feature re-application already report.
  Must NOT lose: preservation of `features` and `plugins` state across the update, and the property that update completes even when a migration fails.
- **F4** — `cli/src/installer.js`: using the pre-existing-manifest read that F1 introduces, carry a prior `migrations` ledger forward when a manifest existed, and baseline-stamp every known id **only when none did**. Without the stamp, a clean install would run the entire back-catalogue against a pristine project; without the carry-forward, re-installing would erase the ledger of a project that still needs those migrations.
  Must NOT lose: the fresh-vs-re-install distinction — `readManifest` returning `null` is the only signal that authorises a baseline stamp.
- **F5** — `cli/src/cli.js`: register the `migrate` command and its help text alongside the existing `features enable|disable` entries, dispatching to F2's command entry. `codeadd migrate` runs pending migrations, `--list` shows applied vs pending, `--dry-run` reports without writing. This is not a convenience: `updater.js:104` returns before any migration could run, so a project already on the latest version has no other vehicle.
  Must NOT lose: parity of ledger semantics between the manual path and F3's update path — both must record identically.

### Does NOT Include (important!)

- **Retrofitting `features.js:101` normalisation or `updater.js:138` prune into migrations.** Both are idempotent or declarative and need no ledger. Moving them would add state to mechanisms that are correct without it.
- **Preserving `features` / `plugins` state across a re-install.** `install()` unconditionally resets them to defaults (`installer.js:274-277`, `285`). Once F1 makes install read the prior manifest, preserving these is one step away — but it is a behaviour change nobody asked for, and folding it in silently would change what a re-install means. Flagged for a separate decision.
- **`doctor.js` reporting pending migrations.** Natural home, not required for the mechanism to work.
- **`CLAUDE.md` documentation of the migration system and the `cli/` layer-ownership gap.** `/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/` — requires a companion `/add-framework--self-plan`.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Third-party migration framework? | No — native | CLI has 2 dependencies; DB-oriented runners bring a storage/connection model with no counterpart here |
| Where does the ledger live? | `manifest.json` → `migrations: []` | Already read and rewritten on every update; zero new storage, zero new file to keep in sync |
| Automatic or confirmed? | Automatic during `update`, logging what changed | User decision. Consistent with the orphan prune and feature normalisation, which already mutate installed state without prompting |
| Fresh install behaviour | Baseline-stamp only when no manifest existed | Otherwise a clean install runs the back-catalogue against a pristine project, or a re-install erases a needed ledger |
| Migration failure | Log, do not record, continue | Update must not break because of a migration; not recording makes the next run retry |
| Manual entry point? | Required, not optional | `updater.js:104` early-returns on an already-current project, leaving no other vehicle |
| First registry entry | `0001-prune-legacy-orphans`, pure JS | Proves the runner against a real defect no diff can reach; no bash dependency, so Windows behaves identically |
| Install-path prune parity? | **In scope (F1)** — user decision, reversed from the initial draft | Without it every future dropped file creates a new invisible orphan needing its own migration entry — a recurring tax the ~10-line fix removes |
| Where do the preservation rules live? | `installer.js`, exported; `updater.js` imports | Two definitions of "never delete this" will diverge, and the one that diverges deletes someone's `history/` |
| Where does the `migrate` command live? | `cli/src/migrations.js`, per the `features.js` / `plugins.js` convention | Every other subcommand owns its module with registry, helpers and command entry together |
| Which command executes this plan? | `/add-framework--build`, **after** a companion self-plan gives its STEP 4 a fourth artefact flow for CLI source | User decision. No command owns `cli/` today: `--build`'s STEP 4 has only Command/Skill/Script flows, all rooted in `framwork/.codeadd/`, and mentions `cli/` nowhere; `--release` has no code-editing steps; `--self-build`'s declared scope is `.claude/`, `scripts/`, `CLAUDE.md`. Recorded dissent: this couples product-layer and CLI-source editing in one command, which is the separation CLAUDE.md's scope table exists to keep |
| Does that extension block this plan? | It did — **satisfied 2026-08-25**, so F1–F5 are unblocked | The CLI-source flow now exists in `.claude/commands/add-framework--build.md` STEP 4.1, with STEP 5.3 gating completion on a serial test run, and the `.opencode/` adapter re-synced from canon. Applied directly on user instruction, skipping the `/add-framework--self-plan` → `/add-framework--self-build` cycle the layer taxonomy would require — recorded here because the taxonomy is still uncorrected |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Both install paths stop manufacturing invisible orphans | `install()` gains a destructive step it never had; its blast radius is now the preservation rules' correctness |
| One definition of what must never be deleted | A move across module boundaries, which risks a subtle semantic change if done as a rewrite |
| A vehicle for fixes the release payload cannot carry | A second mechanism mutating installed state, which must not overlap the declarative diff |
| Run-once semantics with an auditable ledger | A manifest field that must survive every write path, or migrations silently re-run |
| No new dependency | Hand-rolled ordering and failure handling instead of a proven library |
| Windows parity from day one | Every future migration must be written in JS, so no existing shell tooling can be reused as-is |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The preservation move changes semantics, and `install` deletes user state | High | F1 is a move, not a rewrite; L1.1 asserts the shared helper matches today's behaviour case-for-case and L2.2 re-asserts the updater's existing preservation guarantee after the move |
| `install` prunes on a first-time install and deletes files it should not | High | F1 treats `readManifest() === null` as "no prior list, prune nothing"; L2.3 asserts a first-time install deletes nothing |
| Ledger dropped by a manifest write path, silently re-running migrations | High | F3 threads it through the same metadata argument as `features`/`plugins`; L2.6 asserts it survives an update alongside them, L1.2 asserts a recorded id never re-executes |
| Re-install erases the ledger of a project that still needs those migrations | High | F4 carries a prior ledger forward and stamps only when no manifest existed; L2.8 asserts a re-install preserves it |
| Fresh install runs the back-catalogue against a pristine project | High | F4's baseline stamp; L2.7 asserts a fresh install records every id and executes none |
| A throwing migration aborts the update mid-way | Medium | F2 isolates per migration; L1.5 asserts one failure neither aborts the run nor gets recorded, L2.5 asserts update still completes |
| Migration deletes something the user still needs | Medium | `0001` acts on an explicit path list, never a pattern; `--dry-run` and `--list` in F5 make the effect inspectable first |
| Runner and declarative diff double-handle the same orphan | Low | Scope leaves `updater.js:138` and `features.js:101` alone; `0001` targets only paths no diff can see; L3.3 asserts both mechanisms still exist independently |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `cli/src/installer.js` | Hosts and exports `PRESERVE_PATTERNS`/`shouldPreserve`; `install()` reads prior manifest and prunes (F1); carries ledger forward or baseline-stamps (F4) |
| `cli/src/updater.js` | Imports shared preservation helper, drops local copy (F1); runs migrations and threads ledger (F3) |
| `cli/src/migrations.js` | Created — contract, registry, runner, `0001-prune-legacy-orphans`, command entry (F2) |
| `cli/src/cli.js` | Registers `migrate` command and help text (F5) |
| `cli/src/injection-core.js` | Consumed unchanged — `readManifest` is the fresh-vs-re-install signal (F1, F4) |
| `.codeadd/manifest.json` (user projects) | Gains a `migrations` array; absent means "nothing applied yet", the correct reading for pre-0.7.2 installs |
| `cli/tests/installer.test.js` | Extended — L2.1, L2.3, L2.7, L2.8 |
| `cli/tests/updater.test.js` | Extended — L2.2, L2.4, L2.5, L2.6 |
| `cli/tests/migrations.test.js` | Created — all of L1, plus L2.9, L2.10 and all of L3 |
| `.claude/commands/add-framework--build.md` (+ `.opencode/` adapter) | **Done 2026-08-25** — CLI-source flow added to STEP 4.1, serial-test gate added as STEP 5.3, adapter re-synced. Prerequisite satisfied; F1 can start |
| `CLAUDE.md` | Out of reach — companion `/add-framework--self-plan`: the migration system, plus the Command-scope-by-layer row that goes stale the moment the prerequisite flow lands |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written and observed failing against the current tree before any F-block lands. `cli/src/migrations.js` does not exist today, so every L1 assertion fails at import — that is the starting RED.

**Expected end state.** After F1–F5: one registry entry (`0001-prune-legacy-orphans`); exactly one definition of `shouldPreserve`, exported from `installer.js`; both `install` and `update` prune orphans against a prior manifest; a fresh install records the one id and executes nothing; an update from an empty or absent ledger executes it exactly once; a second update executes nothing.

### L1 — Unit (RED → GREEN)

1. The shared `shouldPreserve` matches today's `updater.js` behaviour case-for-case: `history/` paths and `*.local.json` preserved, everything else not. *RED today: not exported from `installer.js`.*
2. Pending computation returns every registry id when the ledger is absent, empty, or unknown-shaped; returns nothing when every id is recorded. *RED today: module does not exist.*
3. Execution order follows id order regardless of registry array order.
4. Dry-run reports the same pending set and writes nothing to disk.
5. A migration that throws is reported failed, is **not** added to the ledger, and does not prevent later migrations from running.
6. `0001` removes the legacy orphan from `.codeadd/` and from each dir in `ctx.providers`.
7. `0001` where the file is already absent is a no-op that still records as applied; a second full run performs no work.
8. The all-known-ids helper matches the registry exactly — guards F4 against drifting from F2.
9. `ctx` construction is identical across call sites: the object F3 and F5 pass carries the same `{ cwd, providers }` shape F2 documents.

### L2 — Integration, install and update paths

1. `install` over an existing manifest unlinks a file listed in the prior `files` that the new install did not write. *RED today: `install()` never prunes.*
2. `update` still preserves `history/` and `*.local.json` after the preservation helper moves — regression guard on F1's move.
3. A first-time install, with no prior manifest, deletes nothing.
4. `install` over a corrupted or unparseable manifest prunes nothing rather than throwing.
5. A throwing migration leaves the update successful, the new version recorded, and that migration absent from the ledger.
6. The ledger survives the update's manifest rewrite **alongside** preserved `features` and `plugins` state — asserted together, since F3 threads all three through one argument.
7. A fresh install records every known id and executes no migration.
8. A re-install over an existing manifest preserves that manifest's ledger rather than baseline-stamping it.
9. `codeadd migrate --list` reports applied and pending without mutating the manifest.
10. `codeadd migrate` on a project already at the latest version still executes pending migrations — the case `updater.js:104` makes unreachable, and the reason F5 exists.

### L3 — Behavioural acceptance

1. Given a project carrying `skills/add-skill-creator/render-graphs.js` on disk and **absent from** `manifest.files` — the state F1 prevents going forward but cannot retroactively see — `codeadd migrate` removes it from every installed provider dir and records `0001`.
2. Re-running immediately reports nothing pending and touches no file.
3. The prune at `updater.js:138` still removes a file that *is* listed in `manifest.files`, and `0001` still removes one that is not — proving the two mechanisms remain distinct rather than collapsing into each other.

**RED expectations against the current tree:** L1.1 fails because the helper is not exported; all remaining L1 fails at import. L2.1, L2.3 and L2.4 fail because `install()` has no prune; L2.5–L2.8 fail because no call site invokes a runner; L2.9–L2.10 fail because no `migrate` command is registered; L3.1–L3.2 fail because nothing addresses manifest-invisible orphans. L2.2 and the first half of L3.3 pass today and must **still** pass afterwards — they are the regression guards on what this plan deliberately preserves. **GREEN = all levels pass after F1–F5.**

---

## Execution Order

`F1 → F2 → F3 → F4 → F5`, with the validation matrix written before any of it.

- **F1 first** — it stops the mechanism from creating new invisible orphans, and F4 depends on the pre-existing-manifest read it introduces.
- **F2 before F3/F5** — both import its contract and registry; nothing can be written against a contract that does not exist.
- **F3 before F4** — F3 establishes how the ledger threads through a manifest write; F4 mirrors that shape on the install path.
- **F5 last** — a second driver of an already-proven runner.

**Safe stopping points:** after F1 the parity defect is closed and nothing else has changed. After F2 the registry exists but nothing calls it — behaviour unchanged. After F3 `update` runs migrations and records them, while `install` has not yet learned to stamp or carry the ledger — a fresh install would therefore re-run them on its first update, which is harmless for `0001` but is why F4 must not be skipped. After F4 the mechanism is complete for update and install; only the already-current-project case remains uncovered. F5 is additive.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-reading this plan's rationale. For each F-block the build must leave, in the evidence file: what changed with the F-block id, which validation levels cover it and their pass state, and any decision deferred or altered with the reason.

Specific gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing. L1 is the highest risk, since the module is new and it is trivial to write assertions that only ever passed.
2. **F1 done as a rewrite rather than a move.** A reimplemented `shouldPreserve` that passes L1.1's cases can still differ on one the test did not enumerate. Confirm `updater.js` holds no second copy.
3. **Ledger loss through a write path the plan did not enumerate.** L2.6 covers the update path; confirm no other code path writes the manifest without carrying `migrations` forward.
4. **F4 baseline-stamping unconditionally.** "Always stamp" passes L2.7 while destroying the ledger of an existing project; L2.8 is the assertion that catches it.
5. **`0001` acting on a pattern rather than an explicit list.** A glob would be shorter and would pass L1.6; it would also delete files this plan never authorised.
6. **F1 silently preserving `features`/`plugins` across re-install.** Explicitly out of scope; if the manifest read makes it tempting, it must not happen here.
7. Confirmation that `updater.js:138` and `features.js:101` were left untouched — the plan's value depends on the runner not absorbing them.

## References

- `cli/src/updater.js:12-21` — `PRESERVE_PATTERNS` / `shouldPreserve` in their current single-path home
- `cli/src/updater.js:104-107` — the early return that makes F5 necessary
- `cli/src/updater.js:138-155` — the declarative orphan prune this plan extends to `install` rather than replaces
- `cli/src/installer.js:274-277, 285` — the unconditional `features`/`plugins` reset that F1 deliberately leaves alone
- `cli/src/injection-core.js:273` — `readManifest`, returning `null` when absent: the fresh-vs-re-install signal
- `cli/src/features.js:41-278` — the module convention F2 follows: registry, state helpers and command entry in one file
- `cli/tests/updater.test.js:99` — proof the update-path prune works, and the reason no migration targets it
- `docs/changelog/2026-08-25-remove-shipped-lintable-source.md` — the v0.7.2 patch that surfaced the gap

---

## Next Steps

**Prerequisite satisfied 2026-08-25.** `/add-framework--build` now carries a fourth artefact flow for CLI source (STEP 4.1) and a `type=cli` completion gate requiring a serial test run (STEP 5.3); the `.opencode/` adapter was re-synced from canon. F1–F5 are executable.

```
/add-framework--build 0072-PLAN--migration-runner
```

Then, for the remaining internal-layer work:

```
/add-framework--self-plan document the migration system and update the Command-scope-by-layer table for the cli/ layer-ownership gap in CLAUDE.md
```

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-25 | Initial creation |
| 2026-08-25 | Review v01 (`fix-then-ok`): named the `migrate` command's module and its test file (B1); defined `ctx` as `{ cwd, providers }` (A1); stated how F4 sources the prior ledger via `readManifest` (A2); recorded the executing-command decision in the table (A3); dropped the `add-qa-migration` mischaracterisation from References (N1) |
| 2026-08-25 | Scope reversal on user decision: install-path prune parity moved from "Does NOT include" into F1, with the preservation-helper extraction it requires; F-blocks renumbered to F1–F5 and the validation matrix extended with L1.1, L2.1–L2.4 and L3.3 |
| 2026-08-25 | Review v02 (`blocked`): F1 now pins the manifest read and prune to `targetDir` rather than `cwd`, so the parity fix applies under `--global` (A1); added the post-F3 stopping point (N1). Blocker B1 — no existing command owns `cli/` source edits — escalated to the user; Next Steps unresolved pending that decision |
| 2026-08-25 | Review v02 blocker B1 resolved by user decision: extend `/add-framework--build` STEP 4 with a CLI-source flow rather than widen `--self-build` or repeat the v0.7.2 exception. Recorded as a hard prerequisite — the extension targets internal-layer files this plan's executor cannot reach, so a companion self-plan now sequences *before* the build, not after |
| 2026-08-25 | Review v03 (`fix-then-ok`, no blockers): added the `.claude/commands/add-framework--build.md` prerequisite row to Ecosystem Impact (A1); extended the final self-plan command to cover the Command-scope-by-layer table (A3); corrected the `shouldPreserve` citation to `updater.js:12-21` (N1) |
| 2026-08-25 | Removed every `migrate-ids.sh` reference on user instruction — it is legacy tooling and not a candidate for this runner. The plan is forward-looking only: `0001-prune-legacy-orphans` is the sole registry entry, and no existing script is queued for conversion (A2 closed by removal rather than correction) |
| 2026-08-25 | Prerequisite satisfied: `/add-framework--build` STEP 4.1 gained a CLI-source flow and STEP 5.3 a `type=cli` gate that blocks completion on a serial `vitest --no-file-parallelism` run; `.opencode/` adapter re-synced from canon. Applied directly on user instruction, bypassing the `/add-framework--self-plan` → `/add-framework--self-build` cycle — the `cli/` layer-ownership gap in CLAUDE.md's scope table remains open |
| 2026-08-25 | **Implemented.** F1–F5 landed; status draft → implemented. RED confirmed for all levels before implementation. Full CLI suite serial: 660 passed / 0 failed (baseline 617); `test:package` PASS; end-to-end verified against a project carrying the orphan invisible to `manifest.files`. Two deviations recorded in the changelog: install-path e2e assertions went to `install.e2e.test.js` (the plan named `installer.test.js`, which is pure-unit and never exercises `install()`), and the prune loop was not extracted — per the plan's letter only the preservation rules are shared |

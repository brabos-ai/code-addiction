# Evidence: 0070 — Development Loop Consolidation

> **Plan:** `docs/plans/0070-PLAN--development-loop-consolidation.md`
> **Branch:** `feat/0070-development-loop-consolidation`
> **Built:** 2026-08-24
> **Matrix:** `cli/tests/loop-consolidation-0070.test.js` — 53 levels, all GREEN
> **RED baseline:** `docs/evidence/0070-RED-baseline.txt` — 43 of 43 levels failing before any F-block landed

---

## Scope decisions taken at build time

Two decisions were escalated to the user before implementation, both flagged by the plan itself (F8: *"Do not guess these strings… stop and ask"*).

| Decision | Choice | Consequence |
|---|---|---|
| **Antigravity agents** | **Deferred by user instruction.** | Agents ship to **four** providers, not five. `antigrav` carries no `agents` pattern, so `buildResources` skips it by construction. Matrix L1.3 asserts the deferral explicitly rather than leaving it as an unexplained gap. |
| **Codex agents root** | New optional `agentsDir` key in `provider-map.json` + `agentsSrc`/`agentsDest` in `cli/src/providers.js`. | Codex agents emit to `framwork/.codex/agents/*.toml` and install to `.codex/agents/`, while its skills keep `.agents/`. **No installed project moves.** The same key is ready for antigrav when it returns. |

**Why the conflict existed:** `provider-map.json` had one `dir` per provider. Codex's native agents live at `.codex/agents/` while this repo already installs its Codex *skills* to `.agents/`. Antigravity's native agents live at `.agents/agents/` — inside Codex's skills root. One key could not express both, and repointing `codex.dir` would relocate every installed project's skills (unscoped in 0070).

---

## F-block completion

### T1 — `tdd` → `tdd-pipeline`

| F | What changed | Matrix levels | State |
|---|---|---|---|
| F1 | `cli/src/features.js`: key renamed, `aliases: ['tdd']`, new `resolveFeatureName` / `resolveFeatureState` / `normalizeFeatureStates`; alias resolved **before** `meta.default` at all three sites; unconditional normalisation pass in `applyEnabledFeatures` | L2.0–L2.6 | ✅ |
| F2 | `git mv fragments/tdd/ → fragments/tdd-pipeline/`; all **9** `feature:tdd:*` marker pairs re-keyed (plan 2, build 5, review 2) | L1.1 | ✅ |
| F3 | `qa-preflight.sh`: manifest key extracted to a single `QA_FEATURE_KEY` constant, passed into the node probe as `argv[1]` | L1.6 | ✅ |
| F4 | `cli/tests/features.test.js`: registry-key ↔ fragment-directory guard, plus the reverse (no orphan directory) | L2.6 | ✅ |
| F5 | `installer.js:287`, `add-ecosystem/SKILL.md` feature table, `docs.astro` feature card | L1.7 | ✅ |

**Live proof of the motivating bug:** `cli/tests/updater.test.js` had a case asserting `manifest.features.tdd === true` survives an update. Post-F1 it asserts `tdd-pipeline: true` **and** `not.toHaveProperty('tdd')` — the user's explicit choice is preserved and the orphaned key is cleaned, which is precisely failure mode 5 from brainstorm 001.

### T2 — Named leaf agents across four providers

| F | What changed | Matrix levels | State |
|---|---|---|---|
| F6 | `agents/test-agent.md` — new leaf agent, read-write on test files only, mode-aware (CORRECTION = red-green) | L7.6 | ✅ |
| F7 | `agents/fix-agent.md` — new leaf agent, caller-supplied `ATTEMPT`/`MAX_ATTEMPTS` | L7.6 | ✅ |
| F8 | `provider-map.json`: both agents registered; `agents` patterns for codex/cursor/opencode + `agentsDir` for codex. `providers.js` gains `agentsSrc`/`agentsDest`/`agentInjection` and `agentDest()` | L1.3, L5.2 | ✅ (antigrav deferred) |
| F9 | `scripts/build.js`: agent passthrough → per-provider dialect table (`AGENT_DIALECTS`) + TOML emitter. `splitFrontmatter` returns verbatim `blocks` alongside scalars | L1.3, L1.4 | ✅ |
| F10 | `add.build.md` → thin coordinator: **Agent Roster** table, **Correction Dispatch** contract, three anonymous fix sites replaced by `@fix-agent` | L6.7 | ✅ |
| F11 | `add.review.md` → thin coordinator: **Agent Roster**, both reviewer dispatches read-only | L6.4 | ✅ |

**Regression caught and fixed during F9:** the first dialect implementation re-serialised frontmatter from parsed scalars, which silently dropped every entry of the multi-line `skills:` YAML list on 10 of 17 agents. Fixed by preserving verbatim per-key `blocks`; **L1.3 now permanently asserts it** ("the claude dialect preserves every source frontmatter key, lists included").

**TOML validation honesty:** no TOML parser exists in this toolchain. L1.4 does **not** claim to parse; it asserts the escaping invariants that determine parseability — balanced `"""` delimiters, no unpaired backslash in the body, a well-formed single-line `description`. All 17 agents pass on all checks.

### T3 — `add.test` into `add.build`

| F | What changed | Matrix levels | State |
|---|---|---|---|
| F12 | Deleted `commands/add.test.md`, `fragments/qa-pipeline/add.test.md`, and the `provider-map.json` entry | L5.0, L5.2 | ✅ |
| F13 | `fragments/tdd-pipeline/add.build.md` gains `detect-framework`, `test-dispatch`, `coverage` — anchored at **mode-independent** points (context setup, shared dispatch template, verification) | L6.1, L6.3 | ✅ |
| F14 | `e2e-dispatch` moved into `fragments/qa-pipeline/add.build.md`, anchored **after the area validators return** | L1.0 map | ✅ |
| F15 | Both self-detection notices placed in `add.build`'s **ungated base body** | L6.2 | ✅ |
| F16 | `/add.test` rerouted in `add.build`, `add.qa-setup`, `e2e-agent`, `add-qa`, `add-ecosystem` | L5.1 | ✅ |

### T4 — `add.qa` into `add.review`

| F | What changed | Matrix levels | State |
|---|---|---|---|
| F17 | Deleted `commands/add.qa.md` + registry entry | L5.0, L5.2 | ✅ |
| F18 | `add.review` STEP 8/9/10 — preflight / evidence / judgement, **base body, ungated**, self-gating on the `add.qa-setup` receipt | L6.5 | ✅ |
| F19 | AUTO-CORRECTION RULE removed; Gate 5 converted to a routed finding; Gate 6 output folded into the same rows; reviewer prompts read-only; `readonly: true` declared on 7 agents; **STEP 7.5 read-only self-check added** | L6.4 | ✅ |
| F20 | Unified `## Fix Routing` union table (STEP 11.2); `/add.build qa` argument mode retired, replaced by a routed-findings pre-check | L6.0, L6.6 | ✅ |
| F21 | `review.md` → `review-NNN.md`; Gate 7 `.prev` rule removed; **`review` schema entry created**; `qa-validation` extended with `judged-tree` | L5.5, L6.0 | ✅ |
| F22 | `add.done` STEP 4.0 reads the highest-numbered `review-NNN.md`; L355 prose retargeted | L6.0 | ✅ |
| F23 | `plugins.json` `playwright.injects` → `add.review`; fragment renamed; `drive` anchor moved with the judgement section | L5.3 | ✅ |
| F24 | `/add.qa` rerouted across agents, skills, scripts, commands | L5.1 | ✅ |

**Contract-shape gate fired as designed.** An F16/F24 reroute landed inside `add.qa-setup`'s `## Materializes` block (the generated `qa-project` skill template, which materializes into user projects). The build refused with `Contract shape changed`. The edit was legitimate — that template names the commands it hands off to — so the shape was bumped `ea7856fb4e1a72e2` → `d599ad3ab3c9f345`. **Installed projects will need `/add.qa-setup` on upgrade**, which is exactly what that hash exists to signal.

### T5 — `/add.plan-to-ready`

| F | What changed | Matrix levels | State |
|---|---|---|---|
| F25 | `commands/add.plan-to-ready.md` — new. 9 STEPs, three agent rosters, cap 3/invocation, `(area, file, symptom)` no-progress over two consecutive rounds, dry-run convergence limited to `add.done` STEP 4.0–4.2, subfeature-scoped gate-3 substitution, coordinator-owned annex write-back | L7.0–L7.6 | ✅ |
| F26 | Deleted `commands/add.autopilot.md` + entry; registered `add.plan-to-ready` for all five providers | L5.0, L5.2 | ✅ |
| F27 | `/add.autopilot` rerouted in `add.md`, `add.build`, `log-jsonl.sh`, 6 skills | L5.1 | ✅ |

### T6 — Closure

| F | What changed | State |
|---|---|---|
| F28 | Matrix written FIRST and verified RED (43/43 failing) before any F-block landed. Includes the `qa-reachability.smoke.test.js` rewrite — 12 of its scenarios re-anchored from `add.test`/`add.qa`/`add.autopilot` to their new hosts | ✅ |
| F29 | `node scripts/build.js` run after every T-block. Final: **16 commands, 40 skills, 17 agents → 698 files, 38 injection points, 1 contract** | ✅ |
| F30 | `add-ecosystem/SKILL.md` regenerated (command/skill/agent/plugin tables + routing graph); `docs.astro` feature card updated | ⚠️ partial — see *Deferred* |

---

## Injection map — asserted, not assumed

| Namespace | Resource | Count |
|---|---|---|
| feature `tdd-pipeline` | add.plan | 2 |
| | add.build | **8** (5 existing + 3 generation) |
| | add.review | 2 |
| feature `qa-pipeline` | add.plan | 2 |
| | add.build | **2** (`qa-fix` + `e2e-dispatch`) |
| plugin `gitnexus` | unchanged | 20 |
| plugin `playwright` | add.review `drive`, qa-agent `drive` | 2 |
| **TOTAL** | | **38** |

`add.test`, `add.qa` and `add.autopilot` contribute zero. `@test-agent` and `@fix-agent` carry no markers by design (gitnexus stays at 20). L1.0 asserts the total **and** the per-resource breakdown.

---

## Defects found and fixed beyond the plan's scope

These were discovered by the matrix, not anticipated by the plan.

1. **The build never pruned deleted resources.** Removing a command left its provider output shipping forever. `framwork/.claude/commands/add.design.md` proved this had already happened silently in an earlier release. Added `pruneStaleOutputs()` to `scripts/build.js`, handling both the flat (`commands/{name}.md`) and nested (`skills/{name}/SKILL.md`) layouts. It removed 20 stale files on first run. A nested directory is pruned only when absent from **both** the commands and skills registries — the two share that tree.
2. **`.codex` was missing from release packaging.** Codex agents would have built locally and never shipped. Added to `.github/workflows/release.yml` and to `framwork/.gitignore` (every other provider dir is ignored).
3. **`.codex`/`.cursor` missing from uninstall.** `ADD_DIRS` in `uninstaller.js` would have orphaned them.
4. **Stale `status.sh` recommendations.** `RECS` named `/feature`, `/plan`, `/add-dev`, `/review`, `/add-done` — none of which exist under any current spelling. Retargeted to real commands.
5. **`add.qa-setup`'s registry description** still ended "smoke-tests /add.qa" — source was fixed, the `provider-map.json` description was not, so the built frontmatter kept a dangling route. Caught by L5.1 against built output.

---

## Deferred, with reasons

| Item | Why | Where it lands |
|---|---|---|
| **Antigravity agents** | User instruction (*"ignore o antigravity por hora"*). The `.agents/agents/` ↔ Codex-skills-root collision remains unresolved and would need a migration path. | A follow-on plan; `agentsDir` is already in place for it. |
| **Plugin agent injection beyond Claude** | Explicitly out of scope in brainstorm 002. Four providers now receive agent **files**; only Claude receives plugin agent **fragments**. Codex agents are TOML, which the markdown-anchored injection engine cannot address at all. Made explicit via a new `agentInjection` flag rather than left implicit in `agentsSubdir`. | Recorded in `providers.js`; `injection-exclusivity` asserts it. |
| **F30 `/add-framework--sync`** | `README.md`, `web/src/pages/docs.astro` command cards and the three SVGs are regenerated by a separate command that dispatches four analyzer agents. | **Run `/add-framework--sync` next.** `docs.astro`'s feature card and `add-ecosystem` were updated by hand here; the command cards and Cytoscape graph edges (`['add.qa','qa-agent','dispatches']`, `['add.test','e2e-agent','dispatches']`) still name removed commands. |
| **`CLAUDE.md` and `.claude/`** | Out of scope by construction — `/add-framework--build` does not reach them. | Four `/add-framework--self-plan` runs, named in the plan's *Next Steps*. Counts now stale: 18→16 commands, 15→17 agents, "the build is markdown-only" invariant reopened. |

---

## Reviewer hunt-list responses

The plan names six gaps a reviewer must actively hunt. Each, answered:

1. **An F-block marked done whose matrix level was never RED.** The RED baseline is committed at `docs/evidence/0070-RED-baseline.txt`: 43 failing levels captured before any F-block landed. Levels added *during* the build (the frontmatter-preservation regression in L1.3, the prune coverage) are marked as such above and were RED at the moment the defect existed.
2. **Injection map silently differing from 38.** L1.0 asserts the total and the per-resource breakdown; `injection-exclusivity` asserts the same 38 independently from the catalog/fragment/sidecar trio.
3. **A gate lost in the F10/F11 restructure.** `add.build`'s nine ABSOLUTE INVARIANTS are intact and unedited. `add.review` Gates 1–7 all survive: 1–4 unchanged, **5 converted** (build failure → routed finding, the real read-only conversion), **6 reformatted** (already non-mutating; output folds into `## Fix Routing`), **7 rewritten** for `review-NNN.md` with the `.prev` rule removed. Gate 7's `QA baseline` mandatory-line rule is preserved verbatim.
4. **A removed-command reference surviving in built output.** L5.1 walks every built file for all five providers with `/add\.(test|qa|autopilot)(?![\w-])` — `add.qa-setup` is not caught. Currently zero.
5. **`add-ecosystem` inconsistent with `provider-map.json`.** L5.4 extracts every `/add.*` the skill names and asserts each exists in the registry.
6. **Codex output skipped and reported as deferred.** It was **not** skipped — all 17 agents emit as `.codex/agents/*.toml` and are packaged at release. Antigravity is the deferral, stated at the top of this file and asserted by L1.3.

---

## Test state

| Suite | Result |
|---|---|
| `loop-consolidation-0070.test.js` (F28 matrix) | **53 / 53 pass** |
| Full `cli/` suite (`--no-file-parallelism`) | **30 files, 608 pass, 0 fail**, 1 skipped |
| `qa-preflight.bats` | 25 / 25 pass |
| `done.bats` + `qa-evidence.bats` | 43 / 43 pass |
| `status.bats` | 5 / 5 pass |

The full-suite figure above is from a **clean-from-scratch rebuild**: every
provider output directory deleted, `node scripts/build.js` re-run, then the suite.
It reproduces what CI does.

**Pre-existing flakiness under default parallelism (not introduced here).** Running all 30 files with vitest's default file-parallelism produces an unstable 2–4 failures whose *identity changes between runs* (`plugins.test.js`, `bin-entrypoint`, `injection-roundtrip`, `updater`, `qa-reachability` scenario 2). The same command with `--no-file-parallelism` passes **608/608**. Several suites `cpSync` the shared `framwork/.claude` + `framwork/.codeadd` trees into temp dirs and mutate manifests there, so this is contention on that shared read, not a correctness defect. Worth its own fix (a per-suite fixture, or `sequential` on those files); out of scope for 0070.

---

## Files touched

**Created (4):** `agents/test-agent.md`, `agents/fix-agent.md`, `commands/add.plan-to-ready.md`, `cli/tests/loop-consolidation-0070.test.js`

**Deleted (4):** `commands/add.test.md`, `commands/add.qa.md`, `commands/add.autopilot.md`, `fragments/qa-pipeline/add.test.md`

**Renamed (2):** `fragments/tdd/` → `fragments/tdd-pipeline/`, `plugins/playwright/fragments/add.qa.md` → `add.review.md`

**Modified — product layer:** `commands/{add.build,add.review,add.done,add.plan,add.md,add.qa-setup}.md`, `agents/{reviewer,qa,ux,e2e,discovery,architecture,doc-reviewer,feature-history,git-history}-agent.md`, `fragments/tdd-pipeline/add.build.md`, `fragments/qa-pipeline/add.build.md`, `skills/{add-qa,add-qa/references/coordinator,add-doc-schemas,add-doc-schemas/references/review,add-ecosystem,add-tasks-checklist,add-code-review,add-delivery-validation,add-knowledge-discovery,add-resource-path-convention,add-claude-md-style,add-id-convention}`, `scripts/{qa-preflight,status,log-jsonl}.sh`, `provider-map.json`

**Modified — pipeline + CLI:** `scripts/build.js`, `cli/src/{features,providers,injection-core,installer,updater,gitignore,uninstaller,plugins.json}.js`

**Modified — tests:** `features`, `build`, `injection-exclusivity`, `injection-roundtrip`, `qa-pipeline-umbrella`, `qa-reachability.smoke`, `install.e2e`, `updater`

**Modified — infra:** `.github/workflows/release.yml`, `framwork/.gitignore`, `web/src/pages/docs.astro`

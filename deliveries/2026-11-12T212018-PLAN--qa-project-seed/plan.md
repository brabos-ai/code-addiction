# Plan: qa-project-seed — replace `authSeed` with a project-based, versioned QA seed

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-11-12
> **Delivery:** confirm

---

## Objective

[from conversation, no design document — the intent file below carries the decisions; `doc: none`]

QA stops assuming a sign-in as a test user. `/add-qa-setup` studies how the project works and what it
needs (auth model, data stores, services, existing seed/fixture/migration tooling, env vars), detects
rather than assumes, asks only what it cannot infer, and generates a project-specific seed in
`.codeadd/qa/` — tracked, secret-free — that makes the data ready before every QA run. No-auth is a
first-class case. The seed evolves per feature through the `qa-pipeline` fragments only. `authSeed` is
removed entirely, with no fallback and no compatibility path.

**When this build is done:** a QA user's project carries a tracked `.codeadd/qa/` seed and a `qa.seed`
block (`command` + env var NAMES) in `.codeadd/settings.json`; every QA run in build and review executes
that seed first and stops with "run `/add-qa-setup`" when it is missing or fails; `/add-plan` asks for a
seed update when a feature needs new QA data and `/add-build` makes it in the same PR; a product grep for
`authSeed` and "test password" finds only migration `0008`'s removal code; `codeadd update` runs `0008`,
strips `qa.authSeed` from both settings files and prints a BREAKING notice; a test proves a build with
`qa-pipeline` off carries none of the seed instructions. All of it ships as one PR and patch v1.9.3.

## Context

`authSeed` is a free-text hint `/add-qa-setup` always asks for without inspecting the project. There is
no path for a project with no auth, the QA agents improvise a form login from it, and migration 0007 and
the v1.9.2 CHANGELOG speak of a "test password" as if every project had one. v1.9.2 moved the key to the
gitignored `.codeadd/settings.local.json`; this card supersedes that handling for QA.

**Every decision here was taken in the document below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/qa-project-seed-intent.md` | `path: architectural`, `doc: none`, decisions 1–12 (problem, removal, analysis, location/tracking, per-feature evolution, fragment-only injection, seed-first QA runs, fresh clone, no-auth, migration 0008, patch v1.9.3, acceptance criteria), `## Open: None` |

Card: https://app.notion.com/p/417e0000aeae81ceb698d136437d5cb2 · Intent: https://app.notion.com/p/417e0000aeae8171943ae0d8aafcd4c1

## Global Constraints

- One PR, one patch release: **v1.9.3** (intent decision 11; user directive)
- Remove `authSeed` entirely — **no fallback and no compatibility path** (intent decision 2)
- A grep of `framwork/.codeadd/` and `cli/src/` for `authSeed` and "test password" returns nothing except the removal code of migration `0008` (intent decision 12)
- Seed lives in `.codeadd/qa/`, tracked, **no secrets**; secrets only by env var NAMES; tracked settings hold only `qa.seed.command` and `qa.seed.env` (intent decision 4)
- Nothing hard-coded, including username/password; "no auth" is valid (intent decisions 3, 9)
- Seed and test-environment instructions in plan, build and review are injected **only** through `qa-pipeline` fragments; a test proves a build without QA contains none of them (intent decision 6)
- Past CHANGELOG entries are not rewritten; the v1.9.3 entry carries the breaking note for QA users (intent decision 10)
- Strict TDD red-green for every code change that has a test: red evidence, then green evidence, recorded in the ledger (intent Constraints; user directive)
- Stack-agnostic, docs in English, `{{cmd:}}`/`{{skill:}}` refs, register in `provider-map.json`, no bash dependencies (intent Constraints; AGENTS.md "Two rules bind anyone editing an artefact")
- A test name removed or renamed carries a `Test-Removed:` commit trailer (AGENTS.md, `scripts/test-loss-guard.cjs`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **`/add-qa-setup` asks, never inspects** — `authSeed` is a free-text answer (`commands/add-qa-setup.md:147,206-207,339-356`, `commands/add-setup.md:145`), so the framework knows nothing about how the project boots, seeds or authenticates.
2. **No-auth projects have no path** — every reader assumes a sign-in (`agents/qa-agent.md:27`, `agents/e2e-agent.md:21`, `plugins/playwright/fragments/agents/qa-agent.md:19`, `skills/add--qa/SKILL.md:83,128-132,222`).
3. **Agents improvise a login** — the Playwright fragment says "establish the session per the `authSeed` hint" (`plugins/playwright/fragments/add-review.md:8`).
4. **Password vocabulary is universal** — migration 0007's user-facing text (`cli/src/migrations.js:565-566,598`) and `cli/src/docs-migrate.js:246-247` tell every user to "rotate that test password".
5. **Data readiness is not reproducible** — nothing makes the data ready before a run, and nothing keeps that in step with new features.
6. **Pre-existing red** — `scripts/tests/changelog-promote.test.cjs` #008 slices `## [Unreleased]` → `## [1.9.1]` and asserts the trimmed body opens with `### Security`; with `[Unreleased]` empty above `## [1.9.2]` the body opens with `## [1.9.2]`, so it fails on `main` today (read from source; F1 confirms by running it), and any v1.9.3 entry keeps it red.

## Proposal

Remove the key everywhere, then build the replacement in dependency order: the CLI migration and its
shared helper, the scripts' deterministic `QA_SEED` row, the QA-owned contracts (the seed output
contract in `add--qa`, the `qa.seed` schema in `add--settings`), the `/add-qa-setup` analysis and
generation step, the QA agents and Playwright plugin as consumers, then the three `qa-pipeline`
fragments that make the seed evolve per feature and run before every QA run. A boundary test written
before the fragments are touched proves the instructions exist only with the feature on. The CHANGELOG
entry closes the PR.

**Where seed instructions may live** (the boundary the L3 test enforces):

| Allowed | Why |
|---|---|
| `fragments/qa-pipeline/{add-plan,add-build,add-review}.md` | Injected only with `qa-pipeline` on — decision 6 |
| QA-own artefacts: `commands/add-qa-setup.md` and its agent-mode fragment/fallbacks, `skills/add--qa` (+ `references/coordinator.md`), `skills/add--qa-spec`, `skills/add--settings` (the `qa` schema rows only), `agents/qa-agent.md`, `agents/e2e-agent.md`, `plugins/playwright/fragments/agents/qa-agent.md` (injects into `qa-agent` only). NOT `plugins/playwright/fragments/add-review.md` — it injects into `add-review` with QA off (F11) | They exist only to set up or run QA; they already carry the whole `qa` section today. `add--settings` keeps schema rows (data definitions), never instructions |
| Scripts `qa-preflight.cjs`, `status.cjs` | Deterministic probes, not instructions |
| **Forbidden:** every other compiled command and skill — `add-plan`, `add-build`, `add-review`, `add-setup` base bodies included | Decision 6: "No seed text goes into the base command bodies" |

**No new injection anchor.** Every seed instruction lands inside an existing `qa-pipeline` section
(`qa-spec`, `qa-fix`, `e2e-dispatch`, `preflight`, `evidence`), so `injection-points.json`'s section count
is unchanged and no base command gains a marker.

## Scope

### Includes

#### T0 — Pre-existing red

- **F1** [internal] — `scripts/tests/changelog-promote.test.cjs`: retarget #008 to the `## [1.9.2]` section, where the Security/authSeed/rotation content it asserts now lives (a released section is not rewritten, so the assertion stays true). The test name changes, so the commit carries `Test-Removed:` for the old name. It keeps the Security-first, authSeed, rotation, Fixed and Changed assertions on the released section; it deliberately drops "Unreleased is non-empty", which was only true between 1.9.2's writing and its release. Validation: L1.1.

#### T1 — CLI: migration 0008, 0007 neutralised, docs migrate, gitignore

- **F2** [product] — `cli/src/migrations.js`: add `0008-remove-qa-auth-seed` and an exported helper that deletes the retired QA key from a `qa` object (drops `qa` when it becomes empty). `0008` reads both `.codeadd/settings.json` and `.codeadd/settings.local.json`, parses both before writing either (an unparsable file throws untouched, like 0007), removes the key from each, never prints a value, and emits a warning that starts `BREAKING:` and says the QA config changed and to rerun `/add-qa-setup`. When the key sat in the tracked file it adds a credential-neutral history note ("if it held a credential, git history keeps it — rotate it"), never "password". `0007-move-qa-auth-seed` keeps its id (the ledger needs it, and `auth-seed` with a hyphen does not match the retired-key grep) but its `run` becomes a no-op, its function is renamed to a key-free name, and its JSDoc, notes and `description` drop the key name and the password wording ("Superseded by 0008 — no-op"). A project on 1.9.1 then runs 0007 (no-op) and 0008 (removes from the tracked file), which is the only path that leaves no secret placement behind. The helper and `0008` sit together between the marker comments `// retired-qa-key:begin` and `// retired-qa-key:end`; that region is the only place in `framwork/.codeadd/` and `cli/src/` allowed to name the key (F16 reads the markers). The 0007 cases of `cli/tests/migrations.test.js` are rewritten here, in this F-block (renamed tests carry `Test-Removed:`). Validation: L1.2, L1.3.
  - **Produces:** `dropRetiredQaKeys` (export of `cli/src/migrations.js`)
- **F3** [product] — `cli/src/docs-migrate.js`: delete every `authSeed` branch (lines 115-118, 215-247); after the merge, call the helper on the `qa` section it writes, so a legacy `docs/qa/config.json` carrying the key never reaches the tracked file. It no longer writes `.codeadd/settings.local.json` and no longer prints the rotate-password warning; it adds a note naming that a retired QA key was dropped and to rerun `/add-qa-setup`. Must not lose the read-all-before-write rule or the merge-without-overwrite rule. Its key cases in `cli/tests/docs-migrate.test.js` are rewritten here (renamed tests carry `Test-Removed:`). Validation: L1.4.
  - **Consumes:** `dropRetiredQaKeys` (F2)
- **F4** [product] — `cli/src/gitignore.js`: add `!.codeadd/qa/` to `CODEADD_PAIR` after `!.codeadd/wiki/` and before the `.codeadd/settings.local.json` line; rewrite the comment without the key name (the local line stays — earlier versions wrote there, and an ignored file is harmless). Must not lose bare-`.codeadd/` normalisation. Validation: L1.5, L4.2, L4.4.

#### T2 — Scripts: the deterministic seed row

- **F5** [product] — `framwork/.codeadd/scripts/qa-preflight.cjs` and `framwork/.codeadd/scripts/status.cjs`: remove `localHasAuthSeed` and the local-file branch in each (and their header lines); add a Phase A row `QA_SEED` to `qa-preflight.cjs` — `ok` when `qa.seed.command` is a non-empty string and `qa.seed.env`, if present, is an array of strings; `missing` when `qa.seed` is absent; `broken` on a wrong type; `not-probed` when the qa section is missing/broken. The probe never runs the seed (Phase A stays side-effect free). Header documents the row. `status#080` and `qa-preflight#080` are removed with `Test-Removed:` trailers. Validation: L1.6, L1.7.
  - **Produces:** `QA_SEED=ok|missing|broken|not-probed`

#### T3 — QA-owned contracts

- **F6** [product] — `framwork/.codeadd/skills/add--qa/SKILL.md` and `references/coordinator.md`: add a **Seed Output Contract** section — the seed prints one JSON object on its last stdout line and exits 0 when the environment is ready; fields: `ready`, `baseUrl`, `identity` (`null` for no-auth, otherwise the auth model and how to authenticate expressed by env var NAMES, never values), `data` (short labels of what was seeded); non-zero exit or unparsable output = failure → QA stops with "run `/add-qa-setup`" and attempts no login. Remove the local-file JSON block (128-132); `data-seed` root cause (83) becomes "flow needs state the seed does not provide (seed gap)"; coordinator rows (70) and SKILL row (222) route a seed gap to the seed in `.codeadd/qa/` (feature data → `/add-build` seed update; base change → `/add-qa-setup`). **This F-block creates `cli/tests/qa-seed-contract.test.js`** with its own L3.3 cases written RED first; every later F-block listed against L3.3–L3.7 adds its cases to that file, RED first, in its own commit — so the suite is never red across an F-block boundary. Validation: L3.2, L3.3.
  - **Produces:** `Seed Output Contract` (section of `add--qa`)
- **F7** [product] — `framwork/.codeadd/skills/add--settings/SKILL.md` and `framwork/.codeadd/skills/add--setup-contract/SKILL.md`: `add--settings` gains schema rows `qa.seed.command` (how to run the seed; stack-agnostic, no bash dependency) and `qa.seed.env` (array of env var NAMES; never values); remove "The local file" section (64-77), line 119 and the authSeed clause of 192. `add--setup-contract` (68) drops the authSeed exception to "never drop a user key" — there is no exception left. Validation: L3.2, L3.4.
  - **Produces:** `qa.seed.command`, `qa.seed.env` (schema of the `qa` section)

#### T4 — `/add-qa-setup` studies the project and generates the seed

- **F8** [product] — `framwork/.codeadd/commands/add-qa-setup.md`:
  - New step `STEP add-qa-setup.seed` between `config` and `catalog` (step list, prohibitions table and `## Materializes` step numbers updated). It analyses, in this order, the auth model (none, session, OAuth, API key, magic link, …), the data stores, the required services and how they boot, existing seed/fixture/migration scripts, and the env vars they need — each finding cited to the file it came from. It asks only what the analysis could not infer, in one batch, through the interaction slot already loaded. It writes `.codeadd/qa/` — the seed entry (in the project's own runtime, reusing the project's tooling by invoking it, never editing it; glue only when none exists; no bash dependency) and a short `README.md` (what it does, prerequisites, the env var names) — and the seed must emit the `Seed Output Contract`. No-auth produces no identity. It runs the seed once and checks the output parses before continuing.
  - `## Materializes`: `settings.json#qa` gains `"seed": { "command": …, "env": [ … ] }`; remove the `settings.local.json#qa` path and block; add `.codeadd/qa/` (seed entry + `README.md`) as `owner: shared` (feature builds edit it, so `hash: null`); the `qa-project` skeleton's `## Auth / Seed` becomes `## Seed` (run `qa.seed.command`, consume its output per the contract) and the Managed App Lifecycle gains a **Seed** step after boot/ready and before Run, stopping on failure with "run `/add-qa-setup`". `changed-in: 1.9.3`; the shape hash moves (expected — QA users rerun `/add-qa-setup`).
  - `STEP add-qa-setup.config` drops the authSeed paragraph (356); `STEP add-qa-setup.receipt` records `.codeadd/qa/` as shared and drops `.codeadd/settings.local.json` from receipt rule 2 (446) and from validate item 4 (459), so no `qa.materialized` entry names the local file any more; `STEP add-qa-setup.validate` item 7 becomes: `qa.seed.command` and `qa.seed.env` present, `qa.seed.env` holds names only, and no tracked file under `.codeadd/qa/` or `qa` holds a secret value; `git check-ignore` on the seed files must NOT match. Prohibitions row (87) adds `.codeadd/qa/` to the writable set and still forbids app source edits. Hand-off names that the seed is tracked and how to rerun it.
  - Must not lose: setup-contract classification, migration fingerprinting, feature gate, setup proof (which adds the `QA_SEED` row to the rows that must be `ok`).
  - The shape pins move here, in this F-block, keeping their names: `cli/tests/add-setup.test.js` L1.4, `cli/tests/lighter-product-qa.test.js` #21, `cli/tests/build-contracts.test.js` (`changed_in` → `1.9.3`). Run `node scripts/build.js` before the green run.
  - **Consumes:** `QA_SEED=ok|missing|broken|not-probed` (F5), `Seed Output Contract` (F6), `qa.seed.command`, `qa.seed.env` (F7)
  - Validation: L3.4, L3.5, L5.1–L5.3.
- **F9** [product] — `framwork/.codeadd/fragments/agent-mode/add-qa-setup.md` (`config-values` section) and `framwork/.codeadd/fallbacks/agent-mode.add-qa-setup.config-values.md`: replace "do NOT guess base URL or auth/seed flow" with: values come from the project analysis; ask, in one numbered batch, only what it could not infer; never ask for a secret value, only its env var name. Same meaning in both files. Validation: L3.5.
- **F10** [product] — `framwork/.codeadd/commands/add-setup.md:145`: remove `authSeed` from the value batch; say the batch carries only the values `{{cmd:add-qa-setup}}`'s own analysis could not infer. No seed vocabulary enters this base command. Validation: L3.6 (RED today: the batch names the key and the local file), L3.1.

#### T5 — Consumers run the seed first

- **F11** [product] — `framwork/.codeadd/agents/qa-agent.md:27`, `framwork/.codeadd/agents/e2e-agent.md:21`, `framwork/.codeadd/plugins/playwright/fragments/agents/qa-agent.md:19`, `framwork/.codeadd/plugins/playwright/fragments/add-review.md:8`: replace every authSeed read with the seed output (identity and data per the `Seed Output Contract`; env var names resolved from the environment, never printed). No improvised login: when an `auth:true` screen has no identity in the seed output, it is a `data-seed` finding, not a guess. `e2e-agent` gains write scope on `.codeadd/qa/` for the per-feature seed update (F14). **`plugins/playwright/fragments/add-review.md` is a special case:** its `drive` section anchors to base text in `add-review` and injects whenever the plugin is on, even with `qa-pipeline` off (verified in `injection-points.json`). It therefore carries no seed sentinel: it only says live driving authenticates with the identity the QA judgement hands to `@qa-agent`, and with none it does not sign in. The seed instructions themselves stay in the `qa-pipeline` fragment (F15) and the QA-own `qa-agent` plugin fragment. Validation: L3.2, L3.3, L3.1 (plugin-on/QA-off case).
  - **Consumes:** `Seed Output Contract` (F6)

#### T6 — Per-feature evolution, fragment-only

- **F12** [product] — new `cli/tests/qa-seed-boundary.test.js`, written before F13–F15 and RED: on the built `framwork/.claude` tree (via `treeFixture`), with `qa-pipeline` disabled no compiled command or skill outside the allowed set (Proposal table) contains any sentinel (`qa.seed`, `.codeadd/qa/`, `QA_SEED`, `Seed Update`, `seed coverage`); with it enabled, `add-plan`, `add-build` and `add-review` contain each sentinel the F13–F15 fragments own exactly once per section; disable restores bytes. A third case enables the `playwright` plugin with `qa-pipeline` still disabled and asserts the same zero-sentinel result (the plugin's `add-review` anchor is in the base body). The sentinel list and the allowed set are declared once at the top of the file; `plugins/playwright/fragments/add-review.md` is NOT in the allowed set. Validation: L3.1.
- **F13** [product] — `framwork/.codeadd/fragments/qa-pipeline/add-plan.md` (`qa-spec` section) and `framwork/.codeadd/skills/add--qa-spec/SKILL.md`: the QA-spec subagent compares the screens in scope against `.codeadd/qa/README.md` and writes a `## QA Seed Update` block in `plan-qa-spec.md` — `none`, or each data/prerequisite to add with the screen that needs it. That block is the plan's seed-update task. A missing `.codeadd/qa/` is a warning naming `{{cmd:add-qa-setup}}`, never a stop (same as the existing setup check). Validation: L3.1, L3.7.
  - **Produces:** `## QA Seed Update` (block of `plan-qa-spec.md`)
- **F14** [product] — `framwork/.codeadd/fragments/qa-pipeline/add-build.md`: in `e2e-dispatch`, `@e2e-agent` applies the `## QA Seed Update` rows to `.codeadd/qa/` (seed + README) before authoring specs, in the same delivery and the same spec batch commit, then green-confirms via the lifecycle (which runs the seed). Before `## Final Review`, a **seed coverage** check: every new screen in scope has the data/identity it needs in the seed output; a gap becomes an `E2E-n` fix row. In `qa-fix` (46), the `data-seed` row names the seed in `.codeadd/qa/` (feature data) or `{{cmd:add-qa-setup}}` (base change) instead of the two settings fields. Validation: L3.1, L3.7.
  - **Consumes:** `## QA Seed Update` (F13), `Seed Output Contract` (F6)
- **F15** [product] — `framwork/.codeadd/fragments/qa-pipeline/add-review.md`: `preflight` Phase A table gains the `QA_SEED` row — `block`, remedy `{{cmd:add-qa-setup}}`; after row 3's boot and before capture, run `qa.seed.command` once per review and parse it per the contract — failure blocks with "run `{{cmd:add-qa-setup}}`" and no login attempt; its output is handed to both judges. The `evidence` coverage reconciliation adds the seed coverage check for new screens. Validation: L3.1, L3.7.
  - **Consumes:** `QA_SEED=ok|missing|broken|not-probed` (F5), `Seed Output Contract` (F6)

#### T7 — Guards, pins and release note

- **F16** [product] — `cli/tests/qa-secret-placement.test.js` is replaced by `cli/tests/qa-retired-key.test.js` (all old names carry `Test-Removed:`): walks `framwork/.codeadd/` and `cli/src/` and asserts `authSeed` and `test password` (case-insensitive) appear in no file except `cli/src/migrations.js`, and there only between `// retired-qa-key:begin` and `// retired-qa-key:end` (F2). It writes RED while `qa-secret-placement.test.js` still exists and turns GREEN after the delete in the same commit. Validation: L3.2.
  - **Consumes:** `dropRetiredQaKeys` (F2) — the marker region that wraps it
- **F17** [internal] — `CHANGELOG.md` `## [Unreleased]`: `### Changed` entry opening **BREAKING for QA users**: `qa.authSeed` is gone with no fallback; `codeadd update` (migration `0008`) removes it from both settings files; rerun `/add-qa-setup`, which now analyses the project and generates a tracked seed in `.codeadd/qa/` (`qa.seed.command`, `qa.seed.env` by env var names); `SETUP_QA_STALE` is expected once. `### Added` for the seed and per-feature evolution. The `[1.9.2]` section is not edited. A new case in `scripts/tests/changelog-promote.test.cjs`, written RED first, asserts the `[Unreleased]` body contains "BREAKING for QA users", `0008` and `/add-qa-setup`; `/add-framework--release` promotes `[Unreleased]` to `[1.9.3]`, so the case is written to read the newest section after `[Unreleased]` when `[Unreleased]` is empty — it stays true across the promotion. Validation: L1.1 (stays green), L1.8.

**Registration:** no command, skill, agent or script is created or renamed — `framwork/provider-map.json` and the generated inventory do not change. `.codeadd/qa/` lives in the user's project, not in the framework.

### Does NOT Include (important!)

- Rewriting past CHANGELOG entries (1.9.2 keeps its password wording — decision 10).
- A fallback that reads an old `authSeed`, or a converter from it to a seed — decision 2.
- Removing the `.codeadd/settings.local.json` ignore line — harmless, and users may still hold the file.
- Running the seed inside `qa-preflight.cjs` — Phase A stays side-effect free; review runs it (F15).
- Version bump, tag, sync of README/web, merge — `/add-framework--done`, `/add-framework--sync`, `/add-framework--release`.
- A new feature flag or injection anchor.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Decisions 1–12 | As written in the intent | Intent `## Decided`; `## Open: None` |
| What becomes of 0007? | Keep the id, no-op `run`, neutral description | The ledger needs the id; its body moved the key into the local file and named "password", both of which decision 2 and the grep criterion forbid. 0008 alone removes it from both files |
| How does docs migrate avoid the key without naming it? | Calls the helper exported by `migrations.js` | One place names the retired key; the grep criterion stays true |
| Which artefacts may carry seed instructions with QA off? | The QA-own set in the Proposal table | Decision 6 binds plan/build/review and "base command bodies"; `add-qa-setup`, the QA skills and agents exist only for QA and already carry the `qa` section |
| New anchors for the seed text? | None — inside existing `qa-pipeline` sections | Keeps `injection-points.json` stable and no base command gains a marker |
| Who edits the seed per feature? | `@e2e-agent`, in the spec batch | It already writes test infrastructure in that dispatch; one writer, one commit |
| Does preflight run the seed? | No — `QA_SEED` checks config only; review runs it | Phase A is a cheap, side-effect-free diagnosis |
| Where does the seed output contract live? | `add--qa` | It is what the QA consumers read; `/add-qa-setup` generates against it |
| What is "a QA run" in decision 7? | A review's QA steps, or the build's e2e green-confirm. The seed runs once at the start of each; the agents consume its output rather than running it again | Running it per agent would re-seed mid-run and judge a different state than was captured |
| Does the Playwright `add-review` fragment carry seed text? | No | Its anchor is in the base `add-review` body, so it injects with QA off (F11, L3.1 third case) |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A reproducible, project-based seed every QA run and every fresh clone uses | QA users must rerun `/add-qa-setup` once (breaking in a patch, Maicon's choice) |
| One rule for no-auth and auth projects | No automatic carry-over of an existing `authSeed` hint |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Seed text leaks into a base command | Medium | F12 boundary test (L3.1), written RED first |
| A secret value lands in a tracked file | Medium | F8 validate gate item 7; env var names only (F6, F7); L5.3 |
| `.codeadd/qa/` stays ignored in an existing project | Medium | F4 exception; L1.5 + L4.2 on an updated block |
| `0008` on a malformed settings file corrupts it | Low | Parse-both-before-write, throw untouched (F2, L1.2) |
| `changelog-promote#008` blocks the build | High (red today) | F1 first |
| The `/add-qa-setup` analysis guesses instead of asking | Medium | F8 cites each finding to a file and asks the rest; L5.1/L5.2 |

## Impact

Graph depth-1 callers (artefact-graph MCP, `impact` depth 1). Delivery index (`history`, layer `product`): `add-qa-setup` has 5 live entries, 0 `gone`/`superseded` — nothing was tried and dropped. `touched_by` on the three CLI files: no delivery hits (CLI source is outside the graph). `AGENTS.md` is not changed.

| Artefact | Layer | Action | Depth-1 callers → risk | F-block |
|----------|-------|--------|------------------------|---------|
| `scripts/tests/changelog-promote.test.cjs` | internal | modify | test — n/a | F1 |
| `cli/src/migrations.js` | product | modify | not in graph (CLI) — NOT VERIFIED by graph; called by `updater.js`, `docs-migrate.js` (F3) | F2 |
| `cli/src/docs-migrate.js` | product | modify | not in graph (CLI) — NOT VERIFIED | F3 |
| `cli/src/gitignore.js` | product | modify | not in graph (CLI) — NOT VERIFIED | F4 |
| `framwork/.codeadd/scripts/qa-preflight.cjs` | product | modify | 3 (add-qa-setup, qa-pipeline/add-review, add--settings) → HIGH | F5 |
| `framwork/.codeadd/scripts/status.cjs` | product | modify | 23 → HIGH (change limited to the `SETUP_QA` local-file branch) | F5 |
| `skills/add--qa/SKILL.md`, `references/coordinator.md` | product | modify | 4 → HIGH | F6 |
| `skills/add--settings/SKILL.md` | product | modify | 5 → HIGH | F7 |
| `skills/add--setup-contract/SKILL.md` | product | modify | 2 → MEDIUM | F7 |
| `commands/add-qa-setup.md` | product | modify | 9 → HIGH | F8 |
| `fragments/agent-mode/add-qa-setup.md`, `fallbacks/agent-mode.add-qa-setup.config-values.md` | product | modify | injects into add-qa-setup → MEDIUM | F9 |
| `commands/add-setup.md` | product | modify | 2 → MEDIUM | F10 |
| `agents/qa-agent.md` | product | modify | 9 → HIGH | F11 |
| `agents/e2e-agent.md` | product | modify | 6 → HIGH | F11 |
| `plugins/playwright/fragments/agents/qa-agent.md`, `plugins/playwright/fragments/add-review.md` | product | modify | plugin fragments → MEDIUM | F11 |
| `cli/tests/qa-seed-boundary.test.js` | product | create | test | F12 |
| `fragments/qa-pipeline/add-plan.md`, `skills/add--qa-spec/SKILL.md` | product | modify | 1 (feature qa-pipeline) → MEDIUM | F13 |
| `fragments/qa-pipeline/add-build.md` | product | modify | feature qa-pipeline → MEDIUM | F14 |
| `fragments/qa-pipeline/add-review.md` | product | modify | feature qa-pipeline → MEDIUM | F15 |
| `cli/tests/qa-secret-placement.test.js` → `cli/tests/qa-retired-key.test.js` | product | remove + create | test | F16 |
| `cli/tests/qa-seed-contract.test.js` | product | create | test | F6 (created), F7–F11, F13–F15 (cases added) |
| `cli/tests/migrations.test.js` | product | modify | test | F2 |
| `cli/tests/docs-migrate.test.js` | product | modify | test | F3 |
| `cli/tests/gitignore.test.js` (+ an updater/install fixture case for L4.2, L4.4) | product | modify | test | F4 |
| `scripts/tests/status.test.cjs`, `scripts/tests/qa-preflight.test.cjs` | product | modify | tests (suites of shipped scripts) | F5 |
| `cli/tests/{add-setup,lighter-product-qa,build-contracts}.test.js` | product | modify | shape pins | F8 |
| `scripts/tests/changelog-promote.test.cjs` | internal | modify | test | F1, F17 |
| `CHANGELOG.md` | internal | modify | — | F17 |
| `framwork/.codeadd/contracts.json`, `injection-points.json` | product | regenerated by `node scripts/build.js` | — | F8 (shape), F13–F15 (anchors unchanged) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below that tests a change is written and run RED against the
current tree before its F-block lands, with the failing output recorded in the ledger; then GREEN, with
the passing output recorded. L1.1 is RED today for a pre-existing reason (Problem 6).

**Expected end-state injection map:** `qa-pipeline` injects the same sections into the same commands
as today (`add-plan`: step-list, qa-spec; `add-build`: qa-fix, e2e-dispatch, next-command; `add-review`:
step-list, preflight, evidence, judge-head, judge-tail). Section count unchanged; only section CONTENT
grows. The build asserts this with the existing `injection-exclusivity` suite.

### L1 — Unit (RED → GREEN)

1. `changelog-promote` (retargeted #008) passes against the 1.9.2 section, and stays green after F17. *RED today: Unreleased body opens with `## [1.9.2]`.*
2. `migrations.test.js`: `0008` removes the key from tracked and local files, keeps every other key, drops an empty `qa`, prints no value, warns with `BREAKING:` and `/add-qa-setup`; an unparsable file throws and both files stay byte-identical; a project without the key is a no-op. *RED: `0008` does not exist.*
3. `migrations.test.js`: `0007` is a no-op on a settings file holding the key; its description contains neither the key name nor "password"; `allMigrationIds()` ends `…0007…, 0008-remove-qa-auth-seed`. *RED: 0007 moves the key.*
4. `docs-migrate.test.js`: a legacy config with the key writes a `qa` section without it, writes no `settings.local.json`, prints no "password", and notes the dropped key with `/add-qa-setup`. *RED: it moves the key to the local file.*
5. `gitignore.test.js`: the managed block contains `!.codeadd/qa/` after `.codeadd/*` and before the local line; a bare `.codeadd/` is still normalised. *RED: no exception.*
6. `qa-preflight.test.cjs`: `QA_SEED` is `ok` / `missing` / `broken` / `not-probed` for the four fixtures; no row reads the local file. *RED: no row.*
7. `status.test.cjs`: a project whose only QA state is a key in the local file reads `SETUP_QA` `absent`. *RED: it reads `stale`.*
8. `changelog-promote.test.cjs` (F17): the newest unreleased-or-released section after 1.9.2 names "BREAKING for QA users", `0008` and `/add-qa-setup`. *RED: no such entry.*

### L2 — Build

1. `node scripts/build.js` exits 0, no new warning; `contracts.json` `add-qa-setup.changed_in` is `1.9.3` and the shape differs from `sha256:c61dbcc38148c997`; `injection-points.json` qa-pipeline section count unchanged.

### L3 — Contract text and boundary (RED → GREEN)

1. `qa-seed-boundary.test.js` (F12) — QA off: zero sentinels outside the allowed set; QA off + playwright on: still zero; QA on: each fragment sentinel lands in `add-plan`/`add-build`/`add-review` exactly once per section; disable restores bytes. *RED: the enabled half fails (no sentinel exists yet).*

L3.3–L3.7 live in `cli/tests/qa-seed-contract.test.js` (created by F6; each F-block adds its own cases RED first).
2. `qa-retired-key.test.js` (F16) — `authSeed` and "test password" absent from `framwork/.codeadd/` and `cli/src/` except the `0008` block. *RED: ~30 hits.*
3. `add--qa` carries the Seed Output Contract with `ready`, `baseUrl`, `identity` (null allowed), `data`; `qa-agent`, `e2e-agent` and both Playwright fragments reference it and contain no "login" fallback wording.
4. `add--settings` names `qa.seed.command` and `qa.seed.env` (names only); `add--setup-contract` has no key-move exception.
5. `add-qa-setup.md` step list holds `STEP add-qa-setup.seed` between config and catalog; `## Materializes` holds `.codeadd/qa/` (shared) and `qa.seed`, no `settings.local.json#qa`; `add-qa-setup.md` names `settings.local.json` nowhere (receipt rule 2 and validate item 4 included); the proof requires `QA_SEED=ok`; the agent-mode fragment and fallback carry the same "ask only what the analysis could not infer" rule. *RED: none of it exists.*
6. `add-setup.md`'s value batch names neither the retired key nor `settings.local.json`, points to `{{cmd:add-qa-setup}}`'s analysis, and contains no seed sentinel. *RED: line 145 names both.* Shape pins (`add-setup` L1.4, `lighter-product-qa` #21, `build-contracts`) hold the new shape and `1.9.3` (moved in F8).
7. With QA on: `add-plan` qa-spec names `## QA Seed Update`; `add-build` e2e-dispatch orders seed update → spec authoring and holds the seed coverage check; `add-review` preflight holds the `QA_SEED` block row and the seed run before capture.

### L4 — Integration

1. `npm test` (framework default via `scripts/run-tests.js`) green; `scripts/test-loss-guard.cjs` green with the trailers.
2. Installer fixture (`install.e2e` style): after install, `git check-ignore .codeadd/qa/seed.mjs` matches nothing and `git check-ignore .codeadd/settings.local.json` still matches.
3. `codeadd update` on a fixture whose ledger lacks `0008` and whose settings hold the key: both files stripped, `BREAKING:` printed, value never printed.
4. `codeadd update` on a fixture whose `.gitignore` holds the 1.9.2 managed block (no `!.codeadd/qa/`): the block is rewritten with the exception, entries outside the block untouched, and `git check-ignore .codeadd/qa/seed.mjs` then matches nothing. *RED: the 1.9.2 block ignores `.codeadd/qa/`.*

### L5 — Behavioural acceptance (agent-executed, recorded in the ledger, not CI)

Run the compiled `/add-qa-setup` (agent-mode on) against two scratch projects under `.codeadd/.temp/`, deleted afterwards:

1. **No-auth fixture** (static app + a JSON data file + an existing seed script): `.codeadd/qa/` holds a seed that invokes the existing script and a README; `qa.seed` written; seed output `identity: null`; no question about credentials asked.
2. **Auth fixture** (session auth + a migration/seed tool + `.env.example` naming vars): the seed reuses the tool, creates a test identity from env var names, output `identity` non-null with names only; only uninferable values asked.
3. In both: `git check-ignore` on the seed files matches nothing; grep of tracked files for the fixture's secret values finds nothing; deleting the seed then running the review preflight path stops with "run /add-qa-setup" and no login attempt.

**RED expectations against the current tree:** L1.1–L1.8, L3.1–L3.7, L4.2–L4.4 fail today (each written RED in the F-block that owns it, so no F-block boundary leaves the suite red).
**GREEN = all levels pass after F1–F17.**

---

## Execution Order

F1 [internal] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [product] → F7 [product] → F8 [product] → F9 [product] → F10 [product] → F11 [product] → F12 [product] → F13 [product] → F14 [product] → F15 [product] → F16 [product] → F17 [internal]

- **F1 first** — the suite is red on `main`; every later green needs it.
- **F2 before F3** — F3 consumes the helper.
- **F5–F7 before F8** — `/add-qa-setup` consumes the row, the contract and the schema.
- **F12 before F13–F15** — the boundary test must be RED before the fragments change.
- **F16 after F15** — the retired-key test goes green only when the last reader is clean.
- **F17 last** — the note describes what shipped.

Working-state boundaries: after F5 (CLI and scripts consistent), after F11 (all readers off `authSeed`), after F16. Run `node scripts/build.js` after F8 and after F15 (contracts and injection points change).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the validation levels covering it with RED and GREEN output, and any departure from this plan with its reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. Seed vocabulary in a base command body (`add-plan`, `add-build`, `add-review`, `add-setup`) — L3.1 must cover all four.
3. A secret VALUE (not a name) in any example block of `add-qa-setup.md`, `add--qa` or `add--settings`.
4. "password" or "login" assumed in any new text where no-auth is valid.
5. A removed or renamed test without its `Test-Removed:` trailer.
6. A raw `.codeadd/` command/skill path instead of `{{cmd:}}`/`{{skill:}}` in new text (scripts excepted).

## References

- Prior delivery this supersedes for QA: v1.9.2 docs-branch-fixes (`0007-move-qa-auth-seed`, PR #170).
- Boundary-test prior art: `cli/tests/test-terminal-states-qa-boundary.test.js`, `cli/tests/injection-exclusivity.integration.test.js` (`treeFixture`).

---

## Next Steps

/add-framework--build docs/plans/2026-11-12T212018-PLAN--qa-project-seed.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-12 | Initial creation |
| 2026-11-12 | Review fix-then-ok applied: named `cli/tests/qa-seed-contract.test.js` for L3.3–L3.7 (B1); marker region `retired-qa-key` in `migrations.js` and key-free 0007 function (B2); test edits moved into the F-block that changes the behaviour (A1); `settings.local.json` receipt/validate entries dropped in F8 (A2); Playwright `add-review` fragment kept sentinel-free, L3.1 plugin-on/QA-off case (A3); L4.4 update-path gitignore case (A4); F10 RED assertion (A5); CHANGELOG assertion L1.8 (A6); "a QA run" defined (A7); F1 note (N1) |
| 2026-11-12 | Implemented on fix/qa-project-seed, F1–F17 (commits 76f3a7d1..HEAD) plus review fixes; see the ledger |

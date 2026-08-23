# Plan: QA Single-Path Pipeline

> **Status:** implemented
> **Type:** workflow
> **Created:** 2026-08-23
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

The QA pipeline already has the shape the user wants: `add.qa` is feature-scoped (never a full suite), `add.plan` STEP 8.1 already owns `design.md`, `add.test` already runs after build, `qa-setup` already materializes the project-level prerequisites. What the pipeline does *not* have is a single way to be current.

Three layers of retrocompatibility let an outdated project keep running: unreceipted installs are backfilled, a delta chain migrates surgically, and `add.qa`'s preflight never reads the receipt. Identity is an integer (`setup-contract: N`) invented to walk `## v1 … ## vN` recipes. Without recipes the integer is theatre.

Brainstorm of record: `docs/brainstorming/2026-08-22-qa-single-path-pipeline.md`.

This is a product-layer refactor. It ships as one release. The community sees one breaking change: "QA works this way now. If it does not, run `/add.qa-setup`."

## Problem

1. `qa-preflight.sh` probes infrastructure (rows 1–8) and feature artefacts (rows 9–12). It never opens the receipt or `contracts.json`. A project on the old flow runs `add.qa` with no diagnosis.
2. `add-setup-contract` classifies UNRECEIPTED → backfill at integer 1, then walks deltas. That is the retrocompat the user rejected.
3. `screens.json` is co-written (`qa-setup` STEP 8 merge + `add.plan` STEP 10.0). Catalog `expect` copies Design Contract prose. Authority is adjudicated ("DESIGN_FILE wins") instead of structurally exclusive.
4. `/add.design` is a second door to the pipeline `add.plan` 8.1 already runs. Twenty-five inbound references keep the fiction of two producers.

## Proposal

Four moves, one release, no version numbers anywhere in the resulting system.

**Identity is the existing `shape` hash.** The build already computes `sha256:<16 hex>` of the `## Materializes` block (minus its own `shape:` line). The receipt stores that value as `setup-shape`. `qa-preflight.sh` and `status.sh` compare it to `contracts.json["add.qa-setup"].shape`. Equal → current. Anything else (absent, unreadable, mismatch) → stale. Stale is a hard `block` in `add.qa`. The only remedy is `/add.qa-setup`. There is no "behind by N", no `SETUP_QA_CONTRACT:2/3`, no recipe file.

**`qa-setup` re-materializes to the current shape without destroying user-authored values.** Merge rule, pinned:

- `qa-project` skill: always regenerate (generated file, not user-authored).
- `docs/qa/config.json`: per-key merge. Any key present in the existing file is kept, including unknown extras. Keys in the declared default set that are missing get the default. Never drop a user key. Drift-check applies to this file (report, do not silently overwrite a user-edited value with the default).
- `screens.json`: if it exists, leave it (plan owns content); if missing, write `{ "feature": "<id>", "screens": [] }`.
- `.gitignore`: idempotent `ensure-ignore`.
- Missing declared paths: create.
- Receipt: rewrite with the current `setup-shape`.

This is "adapt what exists to how the pipeline must work", not a wipe.

**Ownership becomes exclusive.** `add.plan` is the only writer of `design.md` (already true in 8.1) and of `screens.json` *content*. `qa-setup` writes the empty catalog once. Catalog field `expect` is **deleted** — not renamed. The `design:` path is the only contract pointer. `@qa-agent` already consumes `DESIGN_FILE`; a commentary field that QA never reads is dead weight.

**`/add.design` is deleted.** Agents and `add-ux-design` stay. Regenerating design means running `add.plan`.

Authoring consequence, accepted: any edit inside `## Materializes` (including the explanatory blockquote) moves `shape` and every installed project goes stale. The forgotten-change guard still fires at build time — it now says "paste `shape: <computed>`" and nothing else. There is no integer to bump and no recipe section to add.

## Scope

### Includes

- `qa-preflight.sh`: two new Phase A probes (`QA_RECEIPT`, `QA_CONTRACT_MATCH`) plus the extractor that reads receipt `setup-shape` and sidecar `shape`.
- `add.qa.md`: Phase A row table grows; any `block` among the new rows STOPS with remedy `/add.qa-setup`. Phase B rows renumber 9–12 → 11–14.
- `add.qa-setup.md`: STEP 1.5 becomes binary (FIRST-RUN / CURRENT / STALE). FIRST-RUN = no receipt AND no `owner: setup` path exists; anything else that is not a shape match is STALE (including no-receipt-but-state-present). `--upgrade` forces full re-materialization even when current. STEP 8 writes the empty scaffold only when the file is absent **and deletes** the current derive-from-design / `expect` is never freehand / `open` grammar / `/add.design` remedy block (today ~lines 304–325). Frontmatter argument-hint for `--upgrade` is rewritten (today: "forces contract reconciliation"). Every remaining `/add.design` remedy is rewritten to `/add.plan`. STEP 12, STEP 14, the `## Materializes` blockquote, and Required Skills drop all `setup-contract` / `version` / `delta` language.
- `add-setup-contract` skill: compare-and-route only. Backfill, sequential deltas, chain-hole refusal, integer compare, `RECIPES` input — all deleted.
- Delete `skills/add-qa/references/setup-contract.md`.
- `scripts/build.js` `extractContract()`: drop `version` and `recipes` from the required grammar (**this is gate B**, `build.js:450` — rewrite the missing-field check; do not leave a hunter looking for a letter that vanished). Delete gates F/G/H (recipes path, file existence, `1..N` chain). Keep A (variable ban), C (name match), D (path owners), E (shape mismatch — new error text, no bump language), I (duplicate key). Sidecar payload is `{ shape, paths }` (no `version`, no `recipes`).
- `add.plan.md` STEP 10.0: sole-writer language; no merge. Drop the three `/add.design` mentions (lines 234, 286, 614).
- Delete `commands/add.design.md` and its `provider-map.json` key.
- Clean remaining inbound refs: `add.new.md:300`, `add.autopilot.md:207`, `add.qa-setup.md:324`, three UX-agent frontmatters, `add-ecosystem/SKILL.md` (command row, agent "Dispatched by", dependency index, Main Flows, Next-Steps Routing).
- `add-doc-schemas/references/receipt.md`: replace `setup-contract` integer with `setup-shape`; rewrite TL;DR so it never says "contract vN" / "behind".
- Catalog schema (declared in `add.qa-setup` `## Materializes` + restatements in `add-doc-schemas`, `add-qa`, **`add-qa-spec/SKILL.md`**): delete the `expect` key. Do not add `note`. Example entries keep `design:` as the only contract pointer. `add.plan` STEP 10.0 stops deriving `expect` from the Design Contract.
- `status.sh`: drop `SETUP_QA_CONTRACT` and `SETUP_QA_BEHIND`. Emit `SETUP_QA_STALE:yes` on mismatch/unreadable. Hints name `/add.qa-setup` with no version language. `SETUP_QA:unreceipted` collapses into stale (no special class).
- Tests: `cli/tests/build-contracts.test.js`, `framwork/.codeadd/scripts/tests/status.bats`, `cli/tests/release-packaging.test.js` (drop the "ships upgrade recipes" case; keep sidecar packaging), `cli/tests/qa-pipeline-umbrella.test.js` (skill still registered; assertions about deltas/backfill rewritten).
- Docs sync surfaces: `CLAUDE.md` command count 19 → 18 and the setup-contract paragraph (no "monotonic integer"); `README.md:76,88–91`; `web/src/pages/docs.astro` cards + graph nodes/edges.

### Does NOT Include

- Pixel / image diffing. Level C stays computed-style numbers vs Design Contract + agent judgement (0058 stands).
- Change-based (diff-aware) scope selection. Scoping stays declaration-based.
- A full-suite / aggregate validation mode.
- Relocating or redesigning `add.test`.
- Feature / plugin injection (0067 matrix untouched).
- A new identity algorithm (structured-only hash). Identity is the hash `contractShape()` already computes.
- A new command, skill, or agent. This plan deletes and shrinks; it does not add surface area.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| What happens when a stale project runs `add.qa`? | Hard gate. Preflight `block`. Remedy is `/add.qa-setup`. | A report produced under the wrong shape is not a degraded report — it is the wrong pipeline. |
| Incremental deltas or full re-setup? | Full re-materialization to the current shape. No recipe file, no sequential walk. | Deltas exist to preserve old flows. The requirement is one flow. |
| Version integers (`setup-contract: N`, `## vN`, `SETUP_QA_BEHIND:N`)? | Deleted from grammar, receipt, sidecar, signals, user-facing text, and authoring error messages. | The integer existed to index a recipe chain. The chain is gone. Remaining mentions would be a second identity next to `shape`. |
| What is identity? | `shape` hash already produced by `contractShape()`. Receipt field: `setup-shape: sha256:<16 hex>`. Compare to `contracts.json["add.qa-setup"].shape`. | One value, already gated at build, already short enough to paste. |
| Recipe file fate? | Delete `skills/add-qa/references/setup-contract.md`. Drop `recipes` from the declaration. | A current-shape-only file would still trip the `1..N` chain gate unless that gate is rewritten; deleting both is the smaller machine. |
| One plan or split? | Single plan, single release. | A half-migrated install (new ownership + old gate, or the reverse) is an incoherent state the community would have to reason about. |
| `/add.design`? | Delete the command. Agents + `add-ux-design` stay. | Plan 8.1 already is the producer. A second door is how "one way" fails. |
| Who writes `screens.json` content? | `add.plan` only. `qa-setup` writes `{ "feature", "screens": [] }` iff the file is absent. | Ends the read-merge-write. Shared ownership stays for existence-check / `hash: null` — setup still creates the file. |
| Where do declared visual values live? | `design.md` `## Design Contract` only. Catalog carries `design:` path. Field `expect` is deleted (not renamed to `note`). | Drift becomes impossible. `@qa-agent` already reads `DESIGN_FILE`. A commentary key QA never consumes is dead weight. |
| Does `qa-setup` wipe `config.json` on stale? | No. Per-key merge: keep every existing key (including extras); fill missing declared keys with defaults; never drop a user key. `qa-project` always regenerates. Drift-check applies to `config.json`. | "Adapt what exists" is not "destroy the project's baseUrl". Generated files are not user-authored. |
| How is FIRST-RUN classified? | No receipt AND no `owner: setup` path exists. No receipt + any setup-owned path present = STALE (full re-materialize with merge rules). | The old UNRECEIPTED backfill is gone; the state-presence probe stays so an existing install is never treated as a blank first run. |
| How does `qa-setup` itself treat the new preflight rows? | Work-to-do, never a stop. | The script is shared. `add.qa` interprets mismatch as `block`. `add.qa-setup` interprets it as the reason it was invoked. |
| `add.test` placement? | Unchanged, after `add.build`. | Its definition requires developed code. |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One way to be current. No alternate states to document. | Surgical upgrades. Any `## Materializes` edit (including prose) stale-gates every install. |
| Enforcement lives in the same preflight that already blocks on a missing runner. | The `/add.design` escape hatch. Regeneration = re-run `add.plan`. |
| Less machinery: no backfill, no delta executor, no chain-hole guard, no integer identity. | Legacy projects get no adoption path other than running `qa-setup`. |
| Catalog cannot disagree with the Design Contract. | The `expect` key (authoritative or commentary). |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Authors casually edit the Materializes blockquote and stale-gate every consumer | Medium | Gate E still fails the build until `shape:` is pasted. The new error text states the consumer consequence: every install will need `/add.qa-setup`. |
| `qa-setup` on a stale project overwrites `config.json` and drops `baseUrl`/`authSeed` | High if unspecified | Per-key merge is pinned in Proposal. Tests must cover "stale + existing config.json keeps baseUrl and extra user keys". |
| Dual interpretation of the same preflight rows is implemented only in one command | Medium | Both `add.qa.md` and `add.qa-setup.md` state the rule next to the row table. A test that `qa-preflight.sh` still exits 0 (diagnosis, never a gate) stays. |
| `/add.design` removal leaves a dangling suggested-next in a file this plan did not list | Medium | Grep the product layer for `add.design` after the edits; the known set is in Ecosystem Impact. Built provider dirs regenerate via `node scripts/build.js`. |
| `release-packaging.test.js` and `build-contracts.test.js` keep asserting `version`/`recipes` and the build goes red | High | Those files are in scope. Rewrite them in the same change. |
| Installed users hit the gate with no idea why | Medium | The consolidated preflight report already prints the remedy. Release notes + README/docs.astro sync in the same pass. `status.sh` hint names the command, not a version. |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/scripts/qa-preflight.sh` | Add receipt + sidecar probes. Reuse the frontmatter-bounded read pattern; do not invent a second parser. Emit `QA_RECEIPT=ok\|missing\|broken` and `QA_CONTRACT_MATCH=ok\|broken\|not-probed\|missing`. Never print a version integer. |
| `framwork/.codeadd/commands/add.qa.md` | Phase A rows 9–10 (`block`, remedy `/add.qa-setup`). Renumber Phase B to 11–14. STEP 1.3 / 2.2 tables. |
| `framwork/.codeadd/commands/add.qa-setup.md` | Rewrite STEP 1.5 classification (drop UNRECEIPTED/BEHIND/REFUSED-on-chain-hole). FIRST-RUN = no receipt AND no `owner: setup` path exists. `--upgrade` = re-materialize even on match; rewrite the frontmatter argument-hint (today: "forces contract reconciliation"). STEP 8 = create-if-absent empty catalog **and delete** the derive-from-design / `expect` is never freehand / `open` grammar / `/add.design` remedy block (~304–325). Drop `version:` and `recipes:` from the `## Materializes` YAML; drop the co-owner merge language; recompute and paste `shape:`. Rewrite the Materializes blockquote (~line 74: "the build will demand a `version` bump" → paste-`shape` only). Required Skills (~line 20): drop "delta execution". STEP 12 (~375): write `setup-shape` from the sidecar, never `setup-contract`. STEP 14 (~425): drop "Contract state: `setup-contract vN` / upgraded from vM". State that new preflight rows are work items, not a stop. |
| `framwork/.codeadd/skills/add-setup-contract/SKILL.md` | Rewrite. Inputs: receipt `setup-shape`, sidecar `shape`. Procedure: classify FIRST-RUN (no receipt AND no `owner: setup` path exists) / CURRENT (hashes equal) / STALE (everything else, including no-receipt-but-state-present); STALE and `--upgrade` route to re-materialize (per-key merge on `config.json`, regenerate `qa-project`); always rewrite receipt. Delete delta/backfill/chain-hole/integer sections. Description frontmatter must match. |
| `framwork/.codeadd/skills/add-qa/references/setup-contract.md` | Delete the file. |
| `scripts/build.js` | `extractContract` / `parseContractDeclaration` / sidecar writer: `version` and `recipes` gone. Gates F/G/H gone. Gate E error: paste `shape`, no bump sentence. Header comment (lines 304–308) rewritten. `module.exports` stays for tests. |
| `cli/tests/build-contracts.test.js` | Drop every case that requires `version`, `recipes`, chain holes, or sidecar keys `version`/`recipes`. Keep shape-mismatch, variable-ban, owner-validation, name-mismatch, real-command seal. |
| `framwork/.codeadd/scripts/status.sh` | Replace the integer grep (`setup-contract: [0-9]+`) with `setup-shape: sha256:[0-9a-f]+`. Drop `SETUP_QA_CONTRACT` and `SETUP_QA_BEHIND`. Add `SETUP_QA_STALE:yes`. Collapse `unreceipted` into stale. Hints: `/add.qa-setup`, no version words. |
| `framwork/.codeadd/scripts/tests/status.bats` | Rewrite the SETUP_QA_* suite (`mk_receipt`, behind-by-2, malformed `v1`, Decision-Log decoy). Decoy in the body must not be read as the frontmatter value (same bounding rule, new field name). |
| `cli/tests/release-packaging.test.js` | Keep "ships `contracts.json`". Delete "ships the setup-contract upgrade recipes". |
| `cli/tests/qa-pipeline-umbrella.test.js` | Skill remains registered. Drop assertions that the skill executes deltas / backfills. |
| `cli/tests/qa-reachability.smoke.test.js` | Delete/rewrite cases at ~188–189 and ~504 that assert a built `add.design` exists and that `add.autopilot` points at `/add.design`. |
| `framwork/.codeadd/commands/add.plan.md` | STEP 10.0 sole writer; stop deriving/writing `expect`. Lines 234, 286, 614. |
| `framwork/.codeadd/commands/add.design.md` | Delete. |
| `framwork/provider-map.json` | Delete the `add.design` key. |
| `framwork/.codeadd/commands/add.new.md` | Line 300: next step is `/add.plan`, not `/add.design`. |
| `framwork/.codeadd/commands/add.autopilot.md` | Line 207: missing `design.md` → run `/add.plan` (8.1), do not warn `/add.design`. |
| `framwork/.codeadd/agents/ux-flow-agent.md` | Frontmatter + body: dispatched by `add.plan` 8.1 only. |
| `framwork/.codeadd/agents/ux-layout-agent.md` | Same. |
| `framwork/.codeadd/agents/ux-agent.md` | Same (lines 3 and 15). |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Drop the `add.design` command row. Agent "Dispatched by" columns. Dependency index. Main Flows (`new → plan`, not `new → design → plan`). Next-Steps Routing. |
| `framwork/.codeadd/skills/add-doc-schemas/references/receipt.md` | `setup-shape` field rule (bare `sha256:<16 hex>`, own line, unquoted). TL;DR without "vN" / "behind". Decision Log column that currently says `Contract` becomes `Shape` or is dropped — do not leave a column that invites version integers. |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | Drop "one artefact, two callers" (`add.plan` + `add.design`) at ~139, ~158. Sole caller is `add.plan` 8.1. |
| `framwork/.codeadd/skills/add-id-convention/SKILL.md` | ~line 97: remove the `add.design` reference. |
| `framwork/.codeadd/skills/add-ux-design/critique-rubric.md` | ~line 5: remove the `add.design` reference. |
| `.claude/commands/add-framework--sync.md` | ~line 164: drop `add.design` from the auxiliary-command list. |
| `.opencode/commands/add-framework--sync.md` | ~line 169: same. |
| `framwork/.codeadd/skills/add-qa/**` and any screens.json restatement | Delete the `expect` key from examples and rules. Align with the Materializes template (`design:` only). |
| `framwork/.codeadd/skills/add-qa-spec/SKILL.md` | Delete the screens.json shape restatement and the "derive `expect` from Design Contract" rule (~lines 52–105). Catalog entries this skill describes no longer carry `expect`. |
| `CLAUDE.md` | Command count 19 → 18. Rewrite the Setup Contracts paragraph: identity is `shape`, there is no monotonic integer, there is no recipe chain, stale → `/add.qa-setup`. |
| `README.md` | Development Trail + complete-flow ASCII (lines 76, 88–91). Design is not a user-facing step. |
| `web/src/pages/docs.astro` | Planning card, Complete Flow, Scenario 1, ecosystem graph node + load/dispatch edges for `add.design`. |
| `web/public/commands.svg`, `flows.svg`, `flowchart.svg` | Nodes/labels that render `/add.design` (~commands.svg:52, flows.svg:28,45, flowchart.svg:57). Regenerated by `/add-framework--sync` in the same release pass — do not hand-edit the SVGs in this plan's build. |
| Installed projects (out of repo) | Next `add.qa` hard-blocks until `/add.qa-setup`. Intended. |

## References

- `docs/brainstorming/2026-08-22-qa-single-path-pipeline.md` — validated design
- `framwork/.codeadd/commands/add.qa.md` — preflight consumer
- `framwork/.codeadd/commands/add.qa-setup.md` — `## Materializes` (single source of shape)
- `framwork/.codeadd/scripts/qa-preflight.sh` — diagnosis script (exit 0)
- `framwork/.codeadd/scripts/status.sh` — `SETUP_QA_*` signals
- `framwork/.codeadd/skills/add-setup-contract/SKILL.md` — current reconcilier (to be gutted)
- `scripts/build.js` `extractContract()` (lines 300–521) and `cli/tests/build-contracts.test.js`
- Plans 0056–0059 (QA umbrella, implemented), 0058 (Level C, no image diff), 0067 (injection exclusivity — do not touch)

---

## Next Steps

/add-framework--build 0068-PLAN--qa-single-path-pipeline

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-23 | Initial creation |
| 2026-08-23 | Review pass (`plan-review-agent`, verdict fix-then-ok). A1: delete `expect`, do not add `note`; list `add-qa-spec`. A2: STEP 12/14 + blockquote + Required Skills on `add.qa-setup`. A3: smoke test, new-feature.md, id-convention, critique-rubric, sync commands. A4: per-key merge pinned. A5: FIRST-RUN = no receipt AND no setup-owned path. A6: STEP 8 derivation-text deletion. N1–N3: SVGs via sync, `--upgrade` hint, gate B named. |
| 2026-08-23 | Implemented on `feat/0068-qa-single-path-pipeline`. |

---
review_version: 01
plan: HANDOFF-qa-ux-umbrella (umbrella scope — plans 0056, 0057, 0058, 0059, 0060)
plan_changelog_audited: 2026-07-27 | a7eeb52
reviewed_at: 2026-07-27T21:51:09Z
verdict: BLOCKED
resolution: CLEARED (2026-07-27, commit 7f7b798) — 4/4 blockers, 11/11 medium, 10/10 low. 2 items deferred with owners; see § Resolution
---

# Review v01: QA/UX Umbrella (topics 01–05, plans 0056–0060)

> Verdict: **BLOCKED** — **resolution: CLEARED** (see [§ Resolution](#resolution))
> Plan audited at changelog entry: 2026-07-27 (HEAD `a7eeb52`, branch `feature/0056-qa-ux-umbrella`, 27 commits ahead of `main`)
> Scope: `docs/brainstorming/2026-07-26-0[0-5]-*.md`, `docs/plans/0056..0060-PLAN--*.md` (+ evidence files), `docs/plans/HANDOFF-qa-ux-umbrella.md`
>
> ⚠️ **The findings below are the audit of record at `a7eeb52` and are NOT rewritten.** Every line describes the state at review time. What was done about each is ticked in the Consolidated Action List and summarized in § Resolution. A finding's file:line citations are stale by design — do not use them to navigate current code.

## Summary

All five topics are, item by item, implemented at a very high conformance rate: every verbatim table the plans demanded (7-row axis ownership, 14 routing rules, 11 Design Contract dimensions, 9 critique items, 7 root causes), the memory-by-role policy, the new agent pair, the dual-judge STEP 4/5, the schema changes and the preflight script with 21 bats tests are all present and correct. Test suites are green (`vitest` full suite **470/470**, smoke **29/29** on this Linux checkout).

The umbrella is nevertheless **BLOCKED**, not because a plan item is missing but because the delivered architecture is incoherent at three seams the plans never covered: the new fix-routing dispatches `@ux-agent` in a mode its own definition refuses to perform, and two untouched commands (`add.review`, `add.autopilot`) still resolve `design.md` at feature level, so on epics the Design Contract this umbrella exists to create is silently skipped exactly where it should be enforced. A fourth item — commit `a7eeb52` removing the legacy-report fallback — reverses a constraint plan 0060 still mandates in three places, with no plan amendment.

## Findings by Severity

| Severity | Count | Topic |
|----------|-------|-------|
| high | 4 | `@ux-agent` has no fix/`design-spec` mode yet routing dispatches it there; `add.review` blind to SF-level `design.md`; `add.autopilot` blind to SF-level `design.md`; legacy-fallback removal contradicts plan 0060 of record |
| medium | 9 | `add.qa` missing the SF→feature `design.md` fallback; stale public docs (`docs.astro` QA model + ecosystem graph); duplicated canonical content (axis table, root-cause taxonomy, screens.json merge rules, UX pipeline across `add.plan`/`add.design`); missing `disallowedTools` on read-only judges; skill bloat / progressive disclosure; STEP 8.1 gates absent from the `## GATES` table; `add.qa` STEP 6 points at `/add.build` instead of `/add.build qa`; `qa-preflight.sh` false-positive on Docker `172.16/12` baseUrls; missing changelogs (0057, 0058) |
| low | 8 | fragile ` ``` `-ordinal anchor for `feature:tdd:step9`; `CLAUDE.md` agent count (~8 vs 15); `add-framework-development:142` still documents `--yolo` as a convention; undocumented `memory` deviation inside the agent files; `provider-map.json:126` ux-agent description still critique-only; `qa-preflight.sh` mode 644 + no `set -u`/`local`; bats gaps (malformed manifest, env-dependent runner test); `add.qa-setup:271` numbering `1,2,2,3,4,5`; docs-tracking inconsistency; stale HANDOFF |

## Plan Conformance

Conformance is near-total. Verified implemented with the specified semantics (evidence abridged):

| Plan | Item | Verdict | Evidence |
|---|---|---|---|
| 0056 | preflight two-phase, 3-valued status, `not-probed` short-circuit | implemented | `scripts/qa-preflight.sh:9-14,24-135` |
| 0056 | all-at-once diagnostics + severity table | implemented | `commands/add.qa.md:63-75,92-102` |
| 0056 | `add.qa-setup` opt-in gate (confirm→enable→verify no-op) | implemented | `commands/add.qa-setup.md:28,82-99` |
| 0056 | self-detection notices | implemented | `add.plan.md:619`, `add.test.md:213` |
| 0057 | `HAS_DESIGN` SF-aware + bats | implemented | `scripts/status.sh:136-143,181`; `tests/status.bats:162,171,182` |
| 0057 | `add.build` domain-scoped precedence | implemented | `add.build.md:191-192` |
| 0057 | agent trio + registration | implemented | `agents/ux-flow-agent.md`, `agents/ux-layout-agent.md`, `provider-map.json:127-128` |
| 0057 | memory-by-role (removed on ux/qa/ux-layout, `project` kept on ux-flow) | implemented | `ux-flow-agent.md:7`; absent elsewhere |
| 0057 | `--yolo` removed, error gates + STEP 6 retained | implemented | `add.plan.md:23,25,147-153` |
| 0057 | `screens.json` ownership inverted to STEP 10.0 | implemented | `fragments/qa-pipeline/add.plan.md:26-39`; `add-qa-spec/SKILL.md:12,46-79` |
| 0058 | `## Design Contract` (11 dims, each naming a verification method) + `## Design Review` | implemented | `references/new-feature.md:141-161`; `add-ux-design/SKILL.md:517-533` |
| 0058 | ASCII retired; layout tree | implemented | repo-wide `ASCII` grep returns ban lines only |
| 0058 | computed-style capture path | implemented | `e2e-agent.md:25`; `fragments/qa-pipeline/add.test.md:7`; `add.qa-setup.md:164` |
| 0059 | dual-judge STEP 4 + WAIT-ALL + read-only guard naming both | implemented | `add.qa.md:144-208` |
| 0059 | STEP 5 merge/dedupe/precedence/contradiction | implemented | `add.qa.md:216-224` |
| 0059 | `qa-validation` spec-gap / root cause / unverifiable / Responsiveness+Accessibility / TOC | implemented | `references/review.md:58,61,62,67,68,72` |
| 0060 | routing table (14 rows verbatim), capability validation, ordering, template, amendment trail | implemented | `add-qa/SKILL.md:88-143` |
| 0060 | coordinator derives route at 5.5; judges emit type+root cause only | implemented | `add.qa.md:226-232`; `ux-agent.md:73`; `qa-agent.md:66` |
| 0060 | `/add.build qa` consumes routing; Named Agent Mapping rows | implemented | `fragments/qa-pipeline/add.build.md`; `add.build.md:303-304` |

Deviations found:

| # | Item | Verdict | Evidence | Sev |
|---|---|---|---|---|
| C1 | Legacy reports without `## Fix Routing` "must still work (fallback to severity/axis grouping)" | **drift/reversed** | plan `0060-PLAN--qa-fix-routing.md:22,50,72` vs `fragments/qa-pipeline/add.build.md` (hard STOP) and `references/review.md:69` (route REQUIRED); smoke assertion inverted to `not.toMatch(/Legacy fallback/i)` in `a7eeb52` | high |
| C2 | `add.qa` STEP 3 follows the new `design.md` scope rule | partial | `add.qa.md:79-86,95,105-110` — resolves `SCOPE_DIR` but never implements the SF→feature-level fallback that `add.plan:237`, `add.build:101,185` and `new-feature.md:141` all declare | medium |
| C3 | 0057 T5.5 / 0058 T4.4 changelogs | missing | `docs/changelog/` contains only the dual-judge and fix-routing entries; `0058-PLAN…:84` *cites* a changelog file that does not exist | medium |
| C4 | 0059/0060 plans marked `implemented` without an implementation Plan Changelog row | missing | `0059-PLAN…:120-122`, `0060-PLAN…:82-84` | low |
| C5 | `provider-map.json:126` ux-agent description still critique-only (review mode never added) | drift | `provider-map.json:126` | low |

## Diff Completeness

56 files, +4941/−435 across 27 commits. Every changed file maps to a plan task except as noted. No unregistered artefact: 19/19 commands, 15/15 agents, all skills present in `provider-map.json`. Provider output dirs and `injection-points.json` are gitignored (`framwork/.gitignore:6-20`) and CI rebuilds before tests (`ci.yml:34,37`), so no stale-build drift is possible in-repo.

**Unaccounted / inconsistent:**

| # | Item | Detail | Sev |
|---|---|---|---|
| D1 | `a7eeb52` scope reversal | Removes a deliverable plan 0060 still mandates (see C1) and deletes the `_qa-report/` migration note that plan 0057 T4.3 cited as governing precedent. Three artefacts still describe the removed behavior: `0060-PLAN…:22,50,72`, `0060-…evidence-v01.md:29,54`, `docs/changelog/2026-07-27-update-qa-fix-routing.md:23` | high |
| D2 | HANDOFF stale + self-contradicting | `HANDOFF…:3,13,14,20` still says branch `feature/0056-qa-pipeline-reachability`, 17 commits, 0059 "3 of 5 tasks", 0060 "not started"; `:48` asserts `docs/*` is "never in commits" while the file itself is tracked by `b49352e` | medium |
| D3 | docs tracking inconsistent | `.gitignore` still ignores `docs/*`; `b49352e` force-added only the 20 umbrella files. `git ls-files docs/` returns exactly those — plans 0001–0055, all prior reviews and changelogs remain untracked. A fresh clone reads as if no prior plan existed | medium |
| D4 | evidence snapshots not reconciled | `0060-…evidence-v01.md:54` claims scenario 8 asserts the legacy fallback (now the opposite); `:59,:61` figures (635 files / 35 injection points / 470 passed) are repeated verbatim in `a7eeb52`'s message after tests were added — at least one figure was copied forward rather than re-measured | medium |
| D5 | `add.autopilot` edited despite `0057-PLAN…:70` declaring other commands out of scope | disclosed in `0057-…evidence-v01.md:81,180`; hunk 2 (add.review `--yolo` rewording) has no causal link to any decision | low |
| D6 | `add.qa-setup` STEP 8 retitle "(bootstrap path)" + ownership note (`a7eeb52`) | documentation-only, no plan task requests it | low |
| D7 | `cli/package-lock.json` still `0.4.7` after the 0.7.0 bump | pre-existing drift, not introduced here | low |

## Side-Effect Detection

**Injection-anchor question (open since `HANDOFF…:25`) — ANSWERED: not a regression, safe in both scenarios.**

Anchors were re-derived with `extractInjectionPoints` over `git show main:<file>` vs the working tree. Real deltas: `qa-agent` `plugin:playwright:drive` `next` changed (`### Step 0.5 …` → `### Axis 1 — Functional delivery …`); `add.plan` `feature:*:step-list` text `- 8.3:` → `- 8.4: Frontend Specialist`; `feature:tdd:step9` fence ordinal 12 → 23; two `next` hints on `add.plan`/`add.test`.

- **(a) fresh install, regenerated sidecar** — safe. `next` is only consulted by `insertBlockAfterAnchor` → `existsBelow`; every new `next` exists below its anchor in the new shipped file (`### Axis 1` is `qa-agent.md:36`, anchor at `:33`). All anchor texts are unique at their ordinal and variable-free, else the build would fail loud. `removeBlockAfterAnchor` ignores `next`, so disable still round-trips byte-identically.
- **(b) already-installed project, OLD sidecar** — safe, because it also holds the OLD files, and `cli/src/updater.js:165-174` (`copyFromZip`) overwrites `.codeadd/` (carrying the sidecar) and every provider dir in one pass, then re-applies features/plugins. There is no supported path that pairs an old sidecar with new files.

Regression candidates:

| # | file:line | What breaks | Sev |
|---|---|---|---|
| S1 | `agents/ux-agent.md` (whole file; `:3` description, `:78`) | Fix routing dispatches `@ux-agent` to the `design-spec` target (`add-qa/SKILL.md:99,102`, `fragments/qa-pipeline/add.build.md:25` "MUST append its amendment to `design.md`'s `## Design Review`", `add.build.md:304` Named Agent Mapping). The agent defines only critique (writes `design-review.md`, "never edit `design.md`"), review ("if asked to fix a finding, **refuse**") and free-form. A dispatched `design-spec` fix refuses per its own instructions, and the contract-amendment trail — the only thing preventing a green-under-amended-contract from being reported as a fix — exists solely in the coordinator's prompt | **high** |
| S2 | `commands/add.review.md:59,244,383,390,399` | `design.md` is now SF-scoped by default (`new-feature.md:141`) and `add.build` resolves `${SF_DIR}/design.md` first (`:101,185`). `add.review` was never updated: it reads only `docs/features/${FEATURE_ID}/*` (`:59`). On an epic it concludes "no design.md" → `:383` loads `add-ux-design` as if nothing were specified and `:399` "Design specs are MANDATORY (if design.md exists)" never fires. The Design Contract is skipped at the review gate | **high** |
| S3 | `commands/add.autopilot.md:207,386,600` | Same SF-blindness: `:207` false-warns "design.md missing → run `/design`" (also a non-existent command; it is `/add.design`) for epics that do carry `subfeatures/SFxx/design.md`; `:386` dispatches `@frontend-agent` with an explicit "(If NO design.md: also load add-ux-design)" fallback, so the build runs contract-free and the later `/add.qa` reports conformance findings the build never had inputs to satisfy | **high** |
| S4 | `web/src/pages/docs.astro:564` | Public docs still describe the retired "dual-axis (UX + functional)" model consumed "by /add.qa and the qa-agent", while `cli/tests/qa-reachability.smoke.test.js:280` asserts the skill contains no `\d-axis|dual-axis` | medium |
| S5 | `web/src/pages/docs.astro:987-991,1107-1135` | Ecosystem graph has no `ux-flow-agent`/`ux-layout-agent` nodes and only `add.design→ux-agent`; missing `add.plan→` the trio, `add.qa→ux-agent`, `add.build→e2e-agent/ux-agent` | medium |
| S6 | `web/src/pages/docs.astro:266,563,693` | `add-qa-spec` blurb omits `screens.json` authoring; `/add.qa` blurb still one judge over four axes; playwright blurb names only `qa-agent` | medium |
| S7 | `add.plan` `feature:tdd:step9` anchor | Bare ` ``` ` at ordinal **23** (was 12) with `next: "---"`. `findAnchorLine` does no uniqueness check and `existsBelow(…, "---")` is satisfied almost anywhere, so one user-added fenced block above STEP 9 relocates the injection silently (`warnMissed` never fires). Not introduced by this branch, but exposure roughly doubled | medium |
| S8 | `CLAUDE.md:17` | Agent count "~8"; actual is 15 | low |
| S9 | `.claude/skills/add-framework-development/SKILL.md:142` | Still documents `--yolo` as a general command convention after the branch removed it from `add.plan`; an author following it would re-add the flag | low |

Clean (verified, no finding): registries (`features.js` `qa-pipeline.commands` ↔ the three fragment files; `plugins.json` gitnexus/playwright rows ↔ fragments, `ux-layout-agent` correctly excluded by omission); no surviving `--yolo` / `4-axis` / `Do NOT write screens.json` in the product layer; step-index tables match `## STEP` headers in `add.qa` (7), `add.qa-setup` (11), `add.plan` (13 + 8.1.x); playwright fragments carry dual-judge framing; the `ux-agent` "six-vs-five dimensions" ledger item is fixed; the report template matches the `qa-validation` Sections list; `web/public/*.svg` carry no agent nodes.

## Quality / Style

`STEP 8.1` is **not** a house-rule violation — `building-commands:123` sanctions `N.1` sub-actions, the existing `8.0`–`8.3` were correctly renumbered to `8.2`–`8.4`, and third-level numbering has precedent at `add.wiki.md:173`. Build lint is clean (no raw `.codeadd/` paths); `node scripts/build.js` is idempotent here. No Portuguese leakage in the diff.

| # | file:line | Principle | Correction | Sev |
|---|---|---|---|---|
| Q1 | `agents/ux-agent.md:78` | Agent contradicts its dispatch contract (= S1) | Add an explicit **Fix Mode (dispatched by `/add.build qa`)** section authorizing the `design.md` amendment + `## Design Review` trail entry; drop "Read-only in critique mode and review mode" from the description in favour of naming all three modes | high |
| Q2 | `agents/qa-agent.md:1-4`, `ux-agent.md:1-7` | `add-framework-development` §7 — read-only agents need `disallowedTools: Write, Edit, NotebookEdit`. Both assert read-only in prose only; `add.qa` 4.5 detects violations *after* the write | Add the denylist to `qa-agent`; `ux-agent` needs Write for `design-review.md` (and, per Q1, `design.md`) — state that explicitly instead | medium |
| Q3 | `add.qa.md:159-171` vs `add-qa/SKILL.md:31-45`; `add.qa.md` 5.1-5.4 vs `add-qa/SKILL.md:71-79` | Reference-don't-repeat — axis table and merge rules byte-identical in both, and the command already hands the skill to both judges | Canonical = `add-qa/SKILL.md`; replace the command copies with section references, keep only the ⛔ dispatch prohibition | medium |
| Q4 | `qa-agent.md:52-60` vs `add-qa/SKILL.md:59-67` (third partial copy at `references/review.md:202`) | Agent prompt duplicates skill content five lines after being told to load that skill | Delete the taxonomy from `qa-agent.md`, cite the skill — the pattern `ux-layout-agent.md:16` already uses | medium |
| Q5 | `fragments/qa-pipeline/add.plan.md:26-40` vs `add-qa-spec/SKILL.md:83-91` | Same — 5 read-merge-write rules restated verbatim right after "follow ALL rules" | Reduce the fragment to a pointer at the skill's "Read-merge-write (MANDATORY)" section | medium |
| Q6 | `add.plan.md:239-345` vs `add.design.md:100-230` | The whole UX pipeline (3 dispatch prompts, frontmatter block, `## Design Review` table, cleanup bash) duplicated near-verbatim; the code ships a comment ("change them in BOTH or in NEITHER") instead of a mechanism | Shrink dispatch prompts to scope/paths + agent name; move the frontmatter/section shape into the `feature-design` schema and cite it from both commands | medium |
| Q7 | `add.plan.md` `## GATES` table | STEP 8.1's three-check gate and the 8.1.5 schema gate are absent from the top-of-file gates table, though STEP 7 says "Ref: GATES table" | Add `design_gate` (8.1.0) and `design_validated` (8.1.5) rows | medium |
| Q8 | `add-ux-design/SKILL.md:488-560` | Progressive disclosure — 73 new lines added to a 595-line Tier-3 dispatcher that already has 11 sibling reference docs; `ux-layout-agent` needs only 3 sections, `ux-agent` only the rubric | Split into `add-ux-design/design-contract.md` and `add-ux-design/critique-rubric.md`, leave index lines | medium |
| Q9 | `add-qa/SKILL.md:82-134` | Same — ~55 lines of coordinator-only `## Fix Routing` in a skill loaded by both judges, who are explicitly told not to emit routes (skill grew +177 lines / +164%) | Move Fix Routing + Merge Rules to `add-qa/references/coordinator.md`, loaded by `/add.qa` STEP 5 only | medium |
| Q10 | `add.qa.md:256` | STEP 6 routes the user to `/add.build` (plain), which never reads `## Fix Routing`; `add-ecosystem` was correctly updated to `/add.build qa` in the same PR | Change to `/add.build qa` | medium |
| Q11 | `scripts/qa-preflight.sh:59` | Local-host allowlist covers `10.*`/`192.168.*` but not `172.16.0.0/12` (Docker bridge) or `host.docker.internal` → `QA_BASEURL_LOCAL=broken` → `add.qa` 1.3 row 3 hard-blocks a legitimate local env | Add `172.1[6-9].*\|172.2[0-9].*\|172.3[01].*\|host.docker.internal` | medium |
| Q12 | `agents/*.md` (`ux-agent:3,11,32,40`, `qa-agent:3`, `ux-layout-agent:3`, `ux-flow-agent:3`) | Hard-coded step coordinates (`add.plan 8.1.3`, `add.qa STEP 4.5`, …) that this very PR proved drift | Name command + role; keep numeric coordinates only in `add-ecosystem` | medium |
| Q13 | `ux-agent.md:4`, `qa-agent.md:3`, `ux-layout-agent.md:1-6` | The deliberate `memory` removal is documented only in the plans; `ux-flow-agent.md:10` sets the opposite precedent by documenting its own `memory` inline | Add a one-line rationale to each agent body | low |
| Q14 | `scripts/qa-preflight.sh` (mode 100644) | Every sibling script is 755; neither `build.js` nor the installer chmods, so users receive a non-executable script (works only because both callers invoke it via `bash`) | `chmod +x` and commit the mode | low |
| Q15 | `scripts/qa-preflight.sh:21-141` | No `set -u` (`status.sh:10` uses `set -euo pipefail`); no `local` — `FEATURE_DIR`, `BASEURL`, `HOST`, `LOCAL`, `SKILL` are globals shared by `phase_a`/`phase_b` | Add `set -u` (not `-e`, given the always-exit-0 contract) and `local` declarations | low |
| Q16 | `scripts/tests/qa-preflight.bats` | Tests assert behaviour (good), but: no malformed-manifest case (the `catch` at `qa-preflight.sh:34` is untested); the "runner absent" test passes only because `mktemp -d` lands outside any JS project (`require.resolve` walks up) | Add the malformed-manifest case; pin the runner test's environment | low |
| Q17 | `add.qa-setup.md:271-276` | Hand-off list introduced by "in order" is numbered `1, 2, 2, 3, 4, 5` | Renumber 1–6 | low |
| Q18 | 7 sites incl. `add.plan.md:238`, `add.design.md:79`, `add.build.md:101,185`, `add-qa-spec/SKILL.md:22`, `new-feature.md:148`, `fragments/qa-pipeline/add.plan.md:19` | The "SF-level first, feature-level fallback" rule restated in 7 slightly different wordings | Canonical = `new-feature.md` → `feature-design` → Location; all others cite it | low |

## Consolidated Action List

Status legend: `[x]` done · `[~]` deferred with a named owner · `[ ]` open.

**Blockers (must clear before the umbrella can be called closed):** — **4/4 cleared**

- [x] Add a **Fix Mode** to `framwork/.codeadd/agents/ux-agent.md` (currently `:78` refuses fixes) authorizing the `design.md` amendment + `## Design Review` trail with `run-NNN` + finding ID, and update its `description` (`:3`) — the `design-spec` route in `add-qa/SKILL.md:99,102` and `add.build.md:304` is otherwise undispatched.
  → `ux-agent.md:3` names all three modes; `:13` states per-mode write scope; `:85-101` `## Fix Mode` with the amendment trail + constraints; review mode still refuses in-dispatch (`:82`).
- [x] Teach `framwork/.codeadd/commands/add.review.md:59,244,383,399` the SF-level `design.md` resolution used by `add.build.md:101,185`.
  → resolved via the `feature-design` **Location** rule at `:59,244,383,399`; loading `add-ux-design` as a substitute is now explicitly banned.
- [x] Teach `framwork/.codeadd/commands/add.autopilot.md:207,386,600` the same, and fix the `/design` → `/add.design` reference at `:207`.
  → fixed at prerequisite validation (`:207`), `TASK_DOCUMENTS` (`:233`), the `@frontend-agent` dispatch (`:387`) and the final doc check (`:601`).
- [x] Resolve the `a7eeb52` scope reversal: either restore the legacy-report fallback **or** amend plan 0060 + evidence + changelog.
  → **amended, not reverted.** Plan 0060 **amendment A1** (`0060-PLAN…:68-70,98`): fallback withdrawn, `/add.build qa` STOPs with a re-run remedy. Rationale recorded — `qa-pipeline` ships disabled, no released version wrote routed reports, and a fallback would dispatch findings whose owner was never derived. Evidence file + `2026-07-27-update-qa-fix-routing.md` reconciled.

**Medium:** — **10 cleared, 1 deferred**

- [x] Add the SF→feature-level `design.md` fallback to `add.qa.md:79-110` (preflight row 10), matching every other consumer.
  → `add.qa.md:87` resolves `DESIGN_FILE` **once**; preflight row 10, STEP 3, the `@ux-agent` dispatch and the `judged-contract` hash all consume it, never a re-derived path.
- [x] Write the missing changelogs: 0057 T5.5 and 0058 T4.4.
  → `docs/changelog/2026-07-27-update-ux-agent-design-ownership.md`, `…-update-layout-notation-design-contract.md`.
- [~] Refresh `web/src/pages/docs.astro:266,563,564,693,987-991,1107-1135` (dual-judge model, new agents, dispatch edges).
  → **DEFERRED — owner `/add-framework--sync`**, which regenerates that file from the ecosystem map before a release. S4/S5/S6 remain true at `docs.astro:564` today. Must run before the next release.
- [x] De-duplicate against a single canonical copy (Q3, Q4, Q5, Q6).
  → Fix Routing + merge rules → `add-qa/references/coordinator.md` (coordinator-only; the judges preload the SKILL and are told not to emit routes). Root-cause taxonomy cited, not restated, by `@qa-agent`. `screens.json` rules → pointer at `add-qa-spec`. The `add.plan`/`add.design` UX pipeline shrank to scope + paths + agent name, shared shape moved into the `feature-design` schema.
- [x] Add `disallowedTools: Write, Edit, NotebookEdit` to `qa-agent.md`; state `ux-agent`'s write scope explicitly.
  → `qa-agent.md:5`; `ux-agent.md:13` (per mode — it needs Write for `design-review.md` and, in fix mode, `design.md`).
- [x] Split `add-ux-design/SKILL.md:488-560` and `add-qa/SKILL.md:82-134` into reference files (Q8, Q9).
  → `add-ux-design/design-contract.md`, `add-ux-design/critique-rubric.md`, `add-qa/references/coordinator.md`.
- [x] Add the `design_gate` / `design_validated` rows to `add.plan.md`'s `## GATES` table. → `add.plan.md:25-26`.
- [x] `add.qa.md:256` → `/add.build qa`. → now at `:227`, naming it as the only mode that reads `## Fix Routing`.
- [x] `qa-preflight.sh:59` → accept `172.16.0.0/12` + `host.docker.internal`. → `:66-68`, with `172.32.*` still refused (public, not the bridge).
- [x] Decide the docs-tracking policy (D3). → documented as a deliberate force-add exception in `CLAUDE.md` (`docs/` tracking policy); `.gitignore` deliberately unchanged.
- [x] Retire or update `HANDOFF-qa-ux-umbrella.md` (D2). → **RETIRED** in place, with the stale branch name, the "docs is never in commits" claim and the answered anchor question all corrected.

**Low:** — **10/10 cleared**

- [x] `CLAUDE.md:17` counts. → corrected to 19 commands / 39 skills / 15 agents.
- [x] `.claude/skills/add-framework-development/SKILL.md:142` drop `--yolo` as a convention. → removed (grep clean).
- [x] `provider-map.json:126` ux-agent description. → rewritten to cover all three modes.
- [x] Per-agent `memory` rationale (Q13). → each memory-free agent states its role-scoped rationale inline.
- [x] `qa-preflight.sh` mode / `set -u` / `local` (Q14, Q15). → mode 755, `set -u` at `:18`, `local` in both phases.
- [x] Bats gaps (Q16). → +4 cases: Docker bridge accepted, `host.docker.internal` accepted, `172.32.*` refused, malformed manifest → `unset` at exit 0; the runner-absent test now pins its environment.
- [x] `add.qa-setup.md:271` renumber (Q17). → hand-off list is 1–7.
- [x] Single-source the SF-fallback wording (Q18). → all 9 sites cite the `feature-design` **Location** rule.
- [x] Prose anchor for `feature:tdd:step9` (S7). → re-anchored from a bare code fence at ordinal 23 to unique prose at ordinal 1.
- [x] Implementation rows in the 0059/0060 Plan Changelogs (C4). → added, including the fix-wave row.

**Still open (not part of this review's scope to fix):**

- [ ] **D7** — `cli/package-lock.json` is still `0.4.7` while `cli/package.json` is `0.7.0`. Pre-existing drift, unrelated to the umbrella; belongs to `/add-framework--release`.

## Resolution

> **CLEARED 2026-07-27** · fix wave `7f7b798` (+ plan amendment recorded on `a7eeb52`) · changelog `docs/changelog/2026-07-27-refactor-umbrella-review-v01-fixes.md`

| Severity | Found | Cleared | Deferred | Open |
|---|---|---|---|---|
| high (blockers) | 4 | 4 | 0 | 0 |
| medium | 11 | 10 | 1 | 0 |
| low | 10 | 10 | 0 | 1 (D7, pre-existing) |

**What the blockers actually were.** Plan conformance was never the problem — it was near-total. Three of the four blockers were seams *no plan covered*: a route dispatched at an agent that refused it (S1), and two commands the umbrella never touched that resolved `design.md` at the wrong scope, silently skipping the Design Contract at the review and autopilot gates (S2, S3). The fourth (C1/D1) was code that had outrun its plan.

**One decision was reversed relative to the review's framing.** The review presented C1 as "restore the fallback **or** amend the plan." It was amended, not restored: `qa-pipeline` ships disabled by default, no released version ever wrote a routed report, so the migration cohort the fallback protected is empty — and a fallback would dispatch findings whose responsible agent was never derived. Recorded as plan 0060 **amendment A1**.

**Deferred, with owners — these are not silently dropped:**

| # | Item | Owner | Gate |
|---|---|---|---|
| S4, S5, S6 | `web/src/pages/docs.astro` — retired dual-axis model, missing `@ux-flow-agent`/`@ux-layout-agent` nodes, missing dispatch edges | `/add-framework--sync` | **Must run before the next release.** The file is generated from the ecosystem map; hand-editing it would be undone |
| D7 | `cli/package-lock.json` `0.4.7` vs `package.json` `0.7.0` | `/add-framework--release` | Pre-existing; not introduced by this umbrella |

**Verification at the fix wave:**

```
node scripts/build.js   →  650 files, 35 injection points, clean
npx vitest run          →  479 passed (479)      (was 470 — +8 smoke, +1)
npx bats framwork/.codeadd/scripts/tests/*.bats  →  180 passed  (+4)
```

New coverage pins the fixes rather than trusting them: smoke scenario 9 asserts Fix Mode + its amendment trail, review mode still refusing, SF-scoped `design.md` in all four consumers, the `/add.design` reference, the two new GATES rows, the re-anchored `step9` injection point, and the canonical location of both extracted reference files.

## Re-review

Not required — the fix wave is covered by the tests above and every item is ticked in the action list. A re-review would re-audit conformance that was already near-total at v01.

Run `/add-framework--shared-review 0060` only if the deferred `docs.astro` sync (S4–S6) lands with unrelated changes, or before cutting the release that ships this branch. It would produce `HANDOFF-qa-ux-umbrella--review-v02.md`.

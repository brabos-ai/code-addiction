# Evidence v01 — Plan 0060: Fix Routing in the QA Report

> **Date:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability` (0060 closes the umbrella on the same branch)
> **Discipline:** subagent-driven-development, resumed direct/task-by-task this session (source of truth: git history + plans + HANDOFF). Commit per task, trailer Claude Opus 4.8.
> Local environment: Linux / WSL2 / node 22 — LF checkout, so no CRLF failures; full vitest is green.

## Task 1 — `qa-validation` schema + `add-qa` routing rules

Commit `d49b640`.

`framwork/.codeadd/skills/add-doc-schemas/references/review.md` (`qa-validation` schema): every finding gains a **REQUIRED `route`** (`**Route:** @agent-a → @agent-b · target: <class>`, ordered chain allowed, coordinator-derived); `## Fix Routing` added to the Sections list (after Accessibility); a `Fix Routing` depth-floor bullet (`Order | Agent | Findings | Target class | Blocked by`, fixed layer order; the legacy fallback recorded here was later **withdrawn by amendment A1** — an un-routed report now STOPs with a re-run remedy); frontmatter gains `judged-contract: sha256:<provenance hash>`; hard bans extended (a finding without a route; a capability-invalid route).

`framwork/.codeadd/skills/add-qa/SKILL.md` — new `## Fix Routing` section: the routing-rules table (deterministic lookup on `type` + root cause, **no confidence field**); the `ux` two-value classification (`contract-violated` → `@frontend-agent`, `contract-inadequate` → `@ux-agent`, citation-or-not-dispatched); capability validation (hard rule); fixed layer ordering; the `## Fix Routing` template; the contract-amendment trail (`judged-contract` hash → a green flip under an amended contract is never a fix). Report template gains `judged-contract` frontmatter, `## Fix Routing` in the TOC + a template section, and a `Route` line on the finding block; checklist gains a routing/capability check.

## Task 2 — `add.qa` derives routes (STEP 5/6); judges emit type + root cause only

Commit `f306905`.

`framwork/.codeadd/commands/add.qa.md`: **STEP 5.5** — over the merged/deduped set the coordinator assigns each `route` by the type+root-cause lookup, applies the citation gate (`@ux-agent` route missing its contract-line citation → presented, never dispatched), runs capability validation (fail-loud on an invalid route — do not write the report), and writes the `## Fix Routing` dispatch table in fixed layer order. The write step sets `judged-contract` to the judged `design.md` provenance hash and notes "contract amended since run-(NNN-1)" + dimensions when it differs. **STEP 6** console summary gains per-responsible-agent distinct-finding counts + presented-not-dispatched routes.

Agents: `qa-agent.md:66` and `ux-agent.md:73` already carried "Do NOT emit a `route` field — routing … is coordinator work" (pre-added in 0059) and already emit `type` + root cause + the `ux` two-value classification with its citation. Task 2 item 3 was therefore satisfied with **no agent change** — verified by grep, not assumed.

Playwright anchor preserved: `add.qa` `plugin:playwright:drive` anchor stays `text="WAIT-ALL before STEP 5."`, `next=` the qa-agent read-only guard line (byte-identical); the STEP 5.5 edit is below the marker/guards. Confirmed against the regenerated sidecar.

## Task 3 — `/add.build qa` consumption + Named Agent Mapping

Commit `e21e2d9`.

`framwork/.codeadd/fragments/qa-pipeline/add.build.md` (between its `section:qa-fix` markers): DISPATCH by ROUTE (read `## Fix Routing`, dispatch each agent in `Order` respecting `Blocked by`, layer-sequential / slice-parallel), severity stays presentation-only, the confirmation gate stays mandatory (routing decides *who*, never *whether*). Present-not-dispatch for manual `data-seed`/`env-boot` (naming the `config.json` field `authSeed`/`bootHint`), capability-invalid, and citation-missing `@ux-agent` routes; a dispatched `design-spec` fix appends the amendment trail to `design.md` `## Design Review`; a report without `## Fix Routing` **STOPs with the re-run remedy** (plan amendment A1, commit `a7eeb52` — the originally planned severity/axis fallback was withdrawn). C2 discipline / add-ux-design / 100% compile / re-run suggestion retained.

`framwork/.codeadd/commands/add.build.md` Named Agent Mapping (~:302, far from the qa-fix anchor at :195): rows for `@e2e-agent` (test files only, no MCP) and `@ux-agent` (design spec only, never application code), each with a soft-degrade fallback.

`cli/src/plugins.json`: **unchanged** — `playwright.agents` stays `[qa-agent]`. Decision recorded: `@ux-agent` judges from persisted PNGs and never needs live driving, and no `plugins/playwright/fragments/agents/ux-agent.md` fragment exists, so a catalog row would inject nothing. A row is deliberately NOT added.

qa-pipeline injection still round-trips byte-identically (smoke scenario 1) after the fragment rewrite.

## Task 4 — ecosystem + sweep + tests + evidence + umbrella closure

Commit: this commit.

`framwork/.codeadd/skills/add-ecosystem/SKILL.md`: `add.qa → add.build qa` next-step row mentions the routed handoff; `@e2e-agent` + `@ux-agent` "Dispatched by" (Agents table) and Dependency Index rows gain `add.build qa` routed-fix dispatch.

**Sweep (clean):**

```
$ grep -rniE "confidence" framwork/.codeadd/ | grep -vi brainstorm
add-qa/SKILL.md   → "there is no confidence score"     # the deliberate corrected decision
add.qa.md         → "(there is no confidence score)"   # ditto
# (add.diagnose/add.hotfix/add-investigation hits are unrelated to QA routing)
```

No stray `confidence` FIELD anywhere; dispatch-by-severity appears only in the new correct "DISPATCH by ROUTE, not by severity" lines; `fix hint` retained as a required finding field (`review.md:69`, `add-qa` template) but no longer the dispatch signal.

**Smoke scenario 8 (+6 tests → 29 total):** built `review.md` declares `## Fix Routing` + `judged-contract` + required `route`; built `add-qa` carries the routing-rules table + capability validation + `contract-inadequate` + "no confidence score"; built `add.qa` STEP 5.5 derives routes, writes `judged-contract`, STEP 6 reports per responsible agent; the qa-fix fragment dispatches by route, asserts the **absence** of a legacy fallback (`not.toMatch(/Legacy fallback/i)`, per amendment A1) and injects into `add.build` on enable; built `add.build` Named Agent Mapping lists `@e2e-agent` + `@ux-agent`; `plugins.json` keeps `playwright.agents = [qa-agent]`.

**Verification:**

```
$ node scripts/build.js         →  635 files, 35 injection points, clean
$ npx vitest run tests/qa-reachability.smoke.test.js   →  29 passed (29)
$ npx vitest run                →  26 files, 470 passed (470)      # LF checkout, no CRLF failures
```

bats not installed on this checkout; 0060 changed **no shell scripts**, so the bats suite is unaffected.

### Re-measured after the umbrella review v01 fix wave (2026-07-27)

The figures above are the as-of-Task-4 snapshot and are kept for the record. Re-measured on the same LF checkout after the review fixes (amendment A1 recorded, `@ux-agent` Fix Mode, SF-level `design.md` resolution in `add.review`/`add.autopilot`/`add.qa`, the `add-qa` and `add-ux-design` reference splits, `qa-preflight.sh` docker-bridge allowlist):

```
$ node scripts/build.js         →  650 files, 35 injection points, clean (no LINT warnings)
$ npx vitest run                →  479 passed (479)
$ npx bats framwork/.codeadd/scripts/tests/*.bats   →  180 passed, 0 failed
```

File count moved 635 → 650 because two skills gained reference subdocs (`add-qa/references/coordinator.md`, `add-ux-design/{design-contract,critique-rubric}.md`), each copied per provider. Injection-point count is unchanged at 35; the only anchor that moved is `add.plan` `feature:tdd:step9`, deliberately re-anchored from a bare ` ``` ` at ordinal 23 to unique prose at ordinal 1 (review finding S7).

**Umbrella closure:** `docs/brainstorming/2026-07-26-00-qa-ux-umbrella.md` gained an "Implementation Status (2026-07-27) — umbrella CLOSED" section recording topics 01–05 → plans 0056–0060 and the four still-open deferred follow-ups (non-web-surface QA, run-evidence lifecycle, screens.json maintenance, hand-edit design.md drift).

## Framework version bump obligation

0060 changes the `qa-validation` doc schema (new required `route`, `## Fix Routing` section, `judged-contract` frontmatter). `add-framework--release` must bump the framework version when cutting the release that ships this.

## Status

Plan 0060 Tasks 1–4 complete. Pending: whole-topic final review (diff `d49b640^..HEAD` for 0060, or `f306905^` base = last 0059 commit), then the branch is PR-ready. The umbrella is closed.

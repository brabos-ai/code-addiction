# Plan: Injection Content Exclusivity — features/plugins exactly-once

> **Status:** implemented
> **Type:** script (build guard) + command-source fix + CLI test suite
> **Created:** 2026-08-22
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

A real installation (`organize-my-finances`, v0.6.6, providers claude+opencode, features `tdd`+`qa-pipeline` enabled) shipped duplicated command content: `.opencode/commands/add.plan.md` contains the step-list line `STEP 9: Test-Spec subagent` **twice** (lines 62+64) and the heading `## STEP 9: Test-Spec Subagent` **twice** (lines 496+568) — two *different* variants.

Root cause (single, surgical): `framwork/.codeadd/commands/add.plan.md` carries **stale content inside feature marker pairs**:

- `tdd:step-list` pair (lines 59–61): old step-list line baked between markers
- `tdd:step9` pair (lines 495–565): the entire old STEP 9 body (~70 lines) baked between markers

`stripHtmlComments` (`scripts/build.js:78-83`) strips only the comment spans, so the wrapped content ships in the **baseline** of every provider build. Post-install, `applyEnabledFeatures` injects the current fragment — producing **two copies when enabled** and a **stale residual copy when disabled**. This is the only non-empty marker pair in the entire product layer (34 of 35 pairs are correctly empty).

The injection engine itself (`cli/src/injection-core.js`) is sound — byte-identical round-trip is proven by existing tests. No architecture change is needed. Prior plans 0062–0066 diagnosed the same defect but proposed an over-engineered solution (compiled distribution model, transactional overlay engine) on a branch that was deleted without merging; this plan is the surgical replacement.

## Problem

1. **Baked-in feature content**: `add.plan.md` ships old TDD content in the baseline — violating the invariant *OFF = absent, ON = exactly one copy* on both sides.
2. **No build gate**: nothing stops a developer from leaving content between marker pairs again. The class of bug ships silently.
3. **No end-state validation**: existing tests prove round-trip byte-identity, but no test asserts that **every** feature and plugin section lands **exactly once** when enabled and is **absent** when disabled, across the full 35-point injection matrix. "Modified > 0" is not correctness.
4. **Enabler gap (Windows)**: `parseFragmentSections` (`cli/src/injection-core.js:28`) requires a literal `\n` after the section marker — on a CRLF-materialized dev checkout (this machine, `core.autocrlf=true`), every fragment parses to 0 sections and enable/disable silently no-ops. Any new red-green matrix would be **vacuous locally** without this fix.

## Proposal

Three moves, no architecture change:

**1. Empty the marker pairs in the source** (the root fix). Remove the stale content from the `tdd:step-list` and `tdd:step9` pairs in `framwork/.codeadd/commands/add.plan.md`, leaving them empty like every other pair. The fragment `framwork/.codeadd/fragments/tdd/add.plan.md` (already current) becomes the single source of the STEP 9 content.

**2. Add a build guard** (fail-loud for the class). In `scripts/build.js`, when processing marker pairs for `extractInjectionPoints`: a standalone-line `<!-- feature:... -->`/`<!-- plugin:... -->` open/close pair with **non-empty content between markers**, or an **unbalanced** open marker without close, fails the build with file:line and the offending marker name. Same standalone-line rule as extraction — markers embedded in prose (documentation) are ignored.

**3. Red-green validation matrix** (user-required). Before applying the fixes, write the failing tests that assert the exact end-state of every injection point (35 total: tdd 9, qa-pipeline 4, gitnexus 20, playwright 2) — enabled = exactly once, disabled = absent, round-trip = byte-identical, stale variants = never present. All must be RED against the current tree; the fixes then turn them GREEN. Details in **Red-Green Validation Matrix** below.

## Scope

### Includes

- **F1** — `framwork/.codeadd/commands/add.plan.md`: empty the `tdd:step-list` pair (remove line 60 content) and the `tdd:step9` pair (remove lines 496–564 content).
- **F2** — `scripts/build.js` (`extractInjectionPoints` region): pair-content/unbalanced-marker guard, both `feature:` and `plugin:` namespaces. Fail loud with file:line.
- **F3** — `cli/tests/build.test.js` (current lines 45–48): invert the assertion that between-marker content survives the build → now asserts it is **removed**; add a guard case (fixture with non-empty pair → build throws).
- **F4** — `cli/src/injection-core.js:28`: `parseFragmentSections` regex accepts `\r?\n` after the section open marker (one-line change; makes the matrix meaningful on Windows dev checkouts). **Consultant-added enabler — see Q6.**
- **F5** — Red-green test matrix (spec below): extends `cli/tests/injection-roundtrip.integration.test.js` pattern + new cases in `cli/tests/features.test.js` / `cli/tests/plugins.test.js`. Tests are written FIRST and must fail (RED) against the current tree.
- **F6** — Rebuild artifacts: run `node scripts/build.js` to regenerate provider outputs + `injection-points.json` (the local tree currently carries stale outputs from the deleted `feature/0062` branch — 6 of 35 anchors differ from HEAD sources).

### Does NOT Include (important!)

- `distribution.json`, compiled fragments, base objects, transactional overlay engine (plans 0062–0064) — rejected as over-engineering
- Anchor fragility beyond this bug (`---`/fence ordinal anchors in `add.build` — works today, different class)
- `validate --repair` not re-applying injections (real bug, separate fix)
- Disable-side `warnMissed` asymmetry and agent-injection silent misses (real, separate)
- Re-`install` resetting plugin state to `{}` (known documented behavior; note: `organize-my-finances` manifest shows `plugins: {}` — a past gitnexus enable was lost this way, explaining the removed gitnexus paragraphs in its git diff)
- `insertBlockAfterAnchor`/`findSubsequence` CRLF hardening (untriggered)

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Q1: where to cut baked-in content | **Empty the marker pairs in the source** (not change `stripHtmlComments`) | 34/35 pairs already empty — follow the existing convention; zero risk to other commands; no compiler behavior change |
| Q2: build guard | **Yes, minimal** — non-empty pair or unbalanced marker fails the build | Turns the entire bug class into a compile-time error; no new architecture |
| Q3: scale | **F1+F2 only** for the fix itself; everything else out of scope | User directive: surgical, no over-engineering |
| Q4: repair of damaged installs | **None (no new code)** — ship a new release (e.g. v0.6.7); affected projects run `codeadd update`, which overwrites with the clean baseline and re-injects enabled features | `updater.js:166` already re-applies correctly; update requires a version bump (same-version early-exit) |
| Q5: validation strategy | **TDD red-green matrix over ALL features and plugins** — tests written first, RED before any fix, GREEN after | User-required: certify that every replace produces the exact expected end-state, not just "modified > 0" |
| Q6: CRLF in fragment parsing | **Fix `parseFragmentSections` to accept `\r?\n`** (F4) | Without it, the matrix silently no-ops on this Windows checkout (0 sections parsed → 0 injections) and the red-green cycle is meaningless locally. One line. Alternative (normalize line endings in test fixtures) rejected: it masks the real failure mode instead of guarding it. **Vetoable at build kickoff — if vetoed, tests MUST normalize fixtures and a note is left in the test file** |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Exactly-once guarantee for all 35 injection points, test-enforced forever | ~1 new integration test suite (runtime cost in CI) |
| Build-time detection of the entire baked-content class | Slightly stricter authoring rule (marker pairs must be empty — already the de-facto convention) |
| Meaningful test runs on Windows dev machines | One-line behavioral change in fragment parsing (CRLF now accepted — strictly additive) |
| Zero changes to the injection engine | Old STEP 9 variant disappears from baselines (intended; release note) |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Stale local build outputs (deleted-branch leftovers) make tests validate the wrong state | High (current tree IS stale) | F6: matrix tests run against a **fresh** `node scripts/build.js` output; CI already rebuilds before testing (`ci.yml`) |
| Guard false-positives on markers shown as prose in docs | Low | Guard applies the same standalone-line rule as `extractInjectionPoints`; prose-embedded markers are ignored (existing, tested behavior) |
| Guard breaks an existing authoring pattern elsewhere | Low | Pre-check: grep confirms `add.plan.md` is the only non-empty pair; the RED phase itself would surface any other |
| `codeadd update` overwrites user's local edits to installed command files | Certain (by design) | Document in release notes: installed command files are framework-managed |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/commands/add.plan.md` | Empty 2 marker pairs (F1) |
| `scripts/build.js` | Pair-content + unbalanced-marker guard (F2) |
| `cli/tests/build.test.js` | Invert preservation assertion + guard cases (F3) |
| `cli/src/injection-core.js` | `\r?\n` in section regex (F4) |
| `cli/tests/` (features, plugins, injection-roundtrip integration) | Red-green matrix (F5) |
| `framwork/.codeadd/fragments/**`, `cli/src/features.js`, `cli/src/plugins.js`, installer/updater | **None** — already correct |
| CLAUDE.md / README | Optional one-liner: marker pairs must be empty; guard enforces |
| Release | Version bump → tag → affected projects `codeadd update` |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every test below BEFORE applying F1–F4. Verify each fails against the current tree (this is the proof the tests bite). Then apply the fixes and drive them GREEN. No fix lands without its failing test already on record.

**Matrix coverage — all 35 injection points:**

| Namespace | Resource | Sections |
|-----------|----------|----------|
| feature `tdd` (9) | add.plan | `step-list`, `step9` |
| | add.build | `tasks-flow`, `gate`, `verify-red`, `awareness`, `verification` |
| | add.review | `step-list`, `spec-audit` |
| feature `qa-pipeline` (4) | add.plan | `step-list`, `qa-spec` |
| | add.build | `qa-fix` |
| | add.test | `e2e-dispatch` |
| plugin `gitnexus` (20) | add.new, add.plan, add.diagnose, add.hotfix, add.done | `graph-map`, `graph-plan`, `graph-trace`, `graph-impact`, `graph-reindex` |
| | add.wiki | `graph-classify`, `graph-dispatch-common`, `graph-specialist`, `graph-database`, `graph-quality`, `graph-contract` |
| | 9 agents (architecture, backend, database, frontend, ux, ux-flow, system-design, reviewer, discovery) | `graph` each |
| plugin `playwright` (2) | add.qa, qa-agent | `drive` each |

**Level 1 — build-side unit (RED → GREEN):**

1. Fixture command source with non-empty content inside a `feature:` pair → build **throws** naming file/line/marker. (RED today: build succeeds.)
2. Fixture with unbalanced open marker (no close) → build **throws**.
3. Built `add.plan` baseline contains **zero** occurrences of `## STEP 9: Test-Spec Subagent` (content removed with markers). (RED today: one baked copy.)
4. Inverted assertion: content between marker pairs does **not** survive the build (replaces current `build.test.js:45-48`).

**Level 2 — per-feature integration (real build outputs; fresh `node scripts/build.js` first):**

For each feature (`tdd`, `qa-pipeline`) on a fresh install fixture:

1. Capture baseline bytes B of every target provider command file (claude/cursor/opencode).
2. `enable` → assert **each section's signature text appears EXACTLY ONCE** in each target file (e.g. tdd/add.plan: exactly one `## STEP 9: Test-Spec Subagent` heading and one step-list line; qa-pipeline/add.build: exactly one `#### QA-Fix Flow (qa-pipeline)`). Assert `modified > 0`.
3. `disable` → assert bytes **equal B** (byte-identical round-trip).
4. Re-`enable` → bytes equal the first-enabled bytes E1 (idempotent, no duplication on re-enable).
5. **Stale-variant assertions** (the regression guard for THIS bug): the old baked strings — `(TDD feature)` step-list variant and the old STEP 9 body signature (`DISPATCH AGENT:` / `**Capability:** read-write`) — appear in **neither** the enabled nor the disabled state.

**Level 3 — per-plugin integration:**

For each plugin (`gitnexus`, `playwright`):

1. Command fragments: enable → each section exactly once across every installed provider's command files; disable → byte-identical to baseline.
2. Agent fragments: enable → `graph`/`drive` section exactly once in each target `.claude/agents/*-agent.md` (agentsSubdir = claude only); disable → byte-identical.
3. Skills: enable → `add-gitnexus` SKILL.md present in every provider skills dir; disable → dirs removed.

**Level 4 — combined states and order independence:**

1. `tdd` + `qa-pipeline` + `gitnexus` + `playwright` all enabled → every one of the 35 sections exactly once (shared anchors — e.g. add.build carries 6 points — must not collide).
2. Disable one while others stay enabled → only its sections removed; siblings untouched.
3. Enable in reversed order (plugins before features; qa-pipeline before tdd) → final bytes identical to normal order.

**RED expectations (current tree):** Level 1.1–1.3 fail (no guard; baked content present); Level 2 fails on `tdd`/add.plan exactly-once + stale-variant; on a CRLF checkout, Level 2+ fail broadly (0 injections) — resolved by F4. **GREEN = all levels pass after F1–F4.**

---

## References

- Root-cause evidence: `framwork/.codeadd/commands/add.plan.md:59-61,495-565`; duplicated output: `organize-my-finances/.opencode/commands/add.plan.md:62,64,496,568`
- `scripts/build.js` — `stripHtmlComments` (78-83), `extractInjectionPoints` (138-213), `writeInjectionPoints` (240-253)
- `cli/src/injection-core.js` — `parseFragmentSections` (26-34), `insertBlockAfterAnchor` (104-126), `removeBlockAfterAnchor` (138-152)
- Existing tests to extend: `cli/tests/injection-roundtrip.integration.test.js`, `cli/tests/features.test.js`, `cli/tests/plugins.test.js`, `cli/tests/build.test.js`
- Rejected prior art: plans 0062–0066 (deleted branch `feature/0062-distribution-integrity-migrations`, never merged)
- Docs policy: CLAUDE.md `docs/` tracking section (plans untracked by default; force-add only with stated reason)

---

## Next Steps

/add-framework--build 0067-PLAN--injection-content-exclusivity

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-22 | Initial creation — Q1–Q4 user-confirmed; Q5 (red-green matrix) user-required; Q6 (CRLF enabler) consultant-added |
| 2026-08-22 | Implemented on `test/0067-injection-content-exclusivity` — F1–F6 red-green |

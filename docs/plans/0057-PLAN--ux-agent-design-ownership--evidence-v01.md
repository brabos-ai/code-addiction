# Evidence v01 — Plan 0057: UX Agent Design Ownership

> **Date:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability` (0057 continues on the same branch)
> **Discipline:** TDD red-green (bats + vitest) per task, whole-branch cross-file consistency sweep + suite comparison in Task 5.
> Local environment: Windows 11 / Git Bash / node 22.17. CI (ubuntu) is the authoritative runner; local environmental caveats (CRLF) are noted where they apply.

## Task 1 — RED/GREEN: `status.bats` HAS_DESIGN

RED (before `status.sh` computed `HAS_DESIGN`, 3 new tests added first):

```
1..42
...
ok 17 phase=designed quando design.md existe
not ok 18 HAS_DESIGN:true when feature-level design.md exists
# (in test file framwork/.codeadd/scripts/tests/status.bats, line 168)
#   `[[ "$output" == *"HAS_DESIGN:true"* ]]' failed
not ok 19 HAS_DESIGN:true and PHASE:designed when only a subfeature has design.md
# (in test file framwork/.codeadd/scripts/tests/status.bats, line 177)
#   `[[ "$output" == *"HAS_DESIGN:true"* ]]' failed
not ok 20 HAS_DESIGN:false when no design.md exists at feature or subfeature level
# (in test file framwork/.codeadd/scripts/tests/status.bats, line 188)
#   `[[ "$output" == *"HAS_DESIGN:false"* ]]' failed
ok 21 phase=discovering when discovery.md exists without Summary for Planning section
...
```

Only the 3 new tests failed; all 39 pre-existing tests stayed green — confirming these were the only intended failures.

GREEN (after implementation):

```
1..42
ok 18 HAS_DESIGN:true when feature-level design.md exists
ok 19 HAS_DESIGN:true and PHASE:designed when only a subfeature has design.md
ok 20 HAS_DESIGN:false when no design.md exists at feature or subfeature level
...
```

All 42 tests pass, 0 failures.

## Task 5 — final bats run (status.bats + qa-preflight.bats), after all 5 tasks

`status.bats` grew from 42 → 46 tests across Tasks 1-4 (further additions unrelated to HAS_DESIGN); combined with `qa-preflight.bats`'s 21 (unaffected by this plan — different script), the suite now totals 63 tests:

```
$ npx bats framwork/.codeadd/scripts/tests/status.bats framwork/.codeadd/scripts/tests/qa-preflight.bats
1..63
ok 1 outputs BRANCH with type main
...
ok 63 phase b without FEATURE_DIR -> exit 2 with usage
```

Exit code 0. 63 passed / 0 failed.

## Task 5 — build

```
$ node scripts/build.js
Building provider files...

Build complete:
  Commands : 19 x providers -> 95 files
  Skills   : 39 skills  -> 525 files
  Agents   : 15 agents  -> 15 files
  Injection points : 35 -> framwork\.codeadd\injection-points.json
  Total    : 635 files generated
```

No lint warnings, no anchor errors. Agent count is 15 (13 pre-existing + `ux-flow-agent` + `ux-layout-agent`, shipped in Task 2), confirming the `plugin:gitnexus:graph` marker on `ux-flow-agent.md` and the `feature:qa-pipeline:step-list` / `feature:tdd:step-list` anchors on `add.plan.md`'s STEP renumber both resolved cleanly.

## Task 5 — cross-file consistency sweep (grep evidence)

```
$ grep -rn "8\.3: Frontend" framwork/.codeadd .claude          -> 0 hits (only 8.4 exists: add.plan.md:54)
$ grep -rni "yolo" framwork/                                    -> only add.review's own (unrelated, real) --yolo mode,
                                                                     and the reworded add.autopilot line describing it accurately
$ grep -rn "Do NOT write screens.json" framwork/.codeadd .claude -> 0 hits
```

Fixed in this sweep: `add.autopilot.md:287,515` (stale `--yolo`/`[STOP]` references to `add.plan`/`add.review`), `add-ecosystem/SKILL.md` Dependency Index (`add-id-convention` row now includes `add.design` + the `new-feature.md` cross-reference), `provider-map.json` `add.design` description (stale pre-refactor wording replaced), plus four cheap deferred-minor fixups (TOC clause made verbatim-identical between `add.design`:193 and `add.plan`:313; the STEP-6/8.1.4 coherence-validation item backported from `add.design` into `add.plan` 8.1.4 item 3; a SaaS-context inline annotation at `add.design`'s STEP 3 divergence point; the dead `HAS_DESIGN` extraction removed from `add.design` STEP 1.2), the `SF_DIR`-preference scope note (`add.plan`:235, scoped to `HAS_EPIC=true`) and the STEP 10.2 design.md read resolution note, the `screens.json` merge-rules removal-semantics sentence in the qa-pipeline fragment, and the same `HAS_EPIC=true` scoping applied to `add.design.md`'s parallel `design.md`-resolution line for consistency.

## Task 5 — test extension results

```
$ cd cli && npx vitest run tests/qa-reachability.smoke.test.js
Test Files  1 passed (1)
Tests  13 passed (13)
```

The 5 new "scenario 5 — UX agent design ownership" tests (all green):

1. built `add.plan` contains `### 8.1 UX Design Specialist` and `- 8.4: Frontend Specialist`
2. qa-pipeline enable/disable round-trip is still byte-identical after the STEP 8.1 renumber (anchor round-trip proof — re-asserts scenario 1's invariant explicitly under this topic)
3. provider-map registers `ux-flow-agent` + `ux-layout-agent`, and both built agent files exist under `framwork/.claude/agents/`
4. built `ux-agent.md` has no `memory:` line; built `ux-flow-agent.md` has `memory: project`
5. built `add.design` contains no `[STOP]` and no `COMPLEXITY GATE`

```
$ cd cli && npx vitest run tests/build.test.js
Test Files  1 failed (1)
Tests  9 failed | 101 passed (110)
```

The 9 remaining failures are all `has YAML frontmatter` assertions under `describe('agent source files', ...)` — the pre-existing Windows CRLF regex issue (`/^---\n/` never matches a `\r\n`-terminated line on this checkout). Fixed by this sweep (branch-introduced, not CRLF):
`contains all 15 expected agents` (was hardcoded to 13), `builds agent files to .claude/agents/` (`buildAgents` count assertion, was hardcoded to 13), and `ux-agent > has memory: project` (`ux-agent` no longer carries `memory:` by design since Task 2 — pulled out of the generic per-agent loop into its own block asserting the *absence* of `memory:`).

## Task 5 — full vitest baseline comparison

**Before this task's test fixes** (`git stash` on the two test files only, source content edits kept):

```
Test Files  5 failed | 21 passed (26)
     Tests  30 failed | 408 passed (438)
```

**After this task's test fixes:**

```
Test Files  5 failed | 21 passed (26)
     Tests  27 failed | 416 passed (443)
```

Delta: -3 failed / +3 passed within `build.test.js` (the 3 branch-introduced fixes: `contains all 15 expected agents`, `buildAgents` count, and `ux-agent`'s dedicated no-`memory:` assertion replacing the branch-broken `has memory: project` one — the surrounding describe-loop refactor is test-count-neutral, 6 assertions removed from the generic loop / 6 added in `ux-agent`'s own block); +5 new tests in `qa-reachability.smoke.test.js` scenario 5, all green, no removals there. Net: 438→443 total tests (+5), 408→416 passed (+8), 30→27 failed (-3). Full failing-test-name diff:

**Removed from the failing set (3, all fixed by this task):**

```
- tests/build.test.js > provider-map.json agents section > contains all 13 expected agents
- tests/build.test.js > agent source files > ux-agent > has memory: project
- tests/build.test.js > buildAgents > builds agent files to .claude/agents/
```

**Remaining failing set (27, IDENTICAL in content to the pre-existing environmental baseline minus the 3 above):**

```
tests/build.test.js > agent source files > backend-agent > has YAML frontmatter
tests/build.test.js > agent source files > frontend-agent > has YAML frontmatter
tests/build.test.js > agent source files > reviewer-agent > has YAML frontmatter
tests/build.test.js > agent source files > discovery-agent > has YAML frontmatter
tests/build.test.js > agent source files > architecture-agent > has YAML frontmatter
tests/build.test.js > agent source files > system-design-agent > has YAML frontmatter
tests/build.test.js > agent source files > database-agent > has YAML frontmatter
tests/build.test.js > agent source files > qa-agent > has YAML frontmatter
tests/build.test.js > agent source files > ux-agent > has YAML frontmatter
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.new exists ...
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.plan exists ...
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.diagnose exists ...
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.hotfix exists ...
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.done exists ...
tests/gitnexus-plugin.test.js > gitnexus fragments <-> command markers > fragment for add.wiki exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for discovery-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for architecture-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for system-design-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for backend-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for database-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for frontend-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for ux-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for ux-flow-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus agent injection targets > fragment for reviewer-agent exists ...
tests/gitnexus-plugin.test.js > gitnexus skills > skill add-gitnexus has a SKILL.md with matching name frontmatter
tests/injection-roundtrip.integration.test.js > feature injection round-trip ... > tdd: enable injects, never misses an anchor, disable restores byte-identically
tests/injection-roundtrip.integration.test.js > gitnexus plugin injection round-trip ... > enable injects into commands + agents, disable restores byte-identically
```

Plus 2 whole-file import failures, unchanged before/after: `tests/bin-codeadd.test.js`, `tests/uninstall-scope.test.js` (SyntaxError on this Windows/CRLF checkout — counted in `Test Files 5 failed`, not in the 27 individual `Tests` failures since the file errors before any test runs).

All 27 + 2 are the same Windows/CRLF-checkout root cause identified in Task 4's own audit (confirmed there against a clean `main` checkout: 9 failures already present on `main` before this plan existed) and in plan 0056's evidence file (26 pre-existing failures, same 5 files). No new failure category was introduced by plan 0057.

## Deliverables shipped (plan 0057, cumulative across Tasks 1-5)

| File | Kind |
|---|---|
| `framwork/.codeadd/agents/ux-flow-agent.md` | New agent (flow & interaction architect) |
| `framwork/.codeadd/agents/ux-layout-agent.md` | New agent (layout & component specialist) |
| `framwork/.codeadd/agents/ux-agent.md` | Modified — promoted to critique-mode judge, `memory:` removed |
| `framwork/.codeadd/commands/add.plan.md` | Gated STEP 8.1 UX pipeline, renumber, STEP 10.0 screens.json ownership, `--yolo` removal, sweep fixes |
| `framwork/.codeadd/commands/add.design.md` | Rewritten as thin dispatcher of the UX agent trio; epic-aware |
| `framwork/.codeadd/commands/add.build.md` | Domain-scoped plan/design/about priority |
| `framwork/.codeadd/commands/add.autopilot.md` | Stale `--yolo` dispatch-prompt wording fixed (Task 5) |
| `framwork/.codeadd/fragments/qa-pipeline/add.plan.md` | screens.json merge-rules removal-semantics sentence added (Task 5) |
| `framwork/.codeadd/scripts/status.sh` | `HAS_DESIGN` computation (feature + subfeature level) |
| `framwork/.codeadd/scripts/tests/status.bats` | +3 `HAS_DESIGN` tests (Task 1) |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Dependency Index rows corrected/extended (Task 5) |
| `framwork/.codeadd/skills/add-ux-design/SKILL.md` | Critique Rubric section added |
| `framwork/provider-map.json` | `add.design` description rewritten; `ux-flow-agent`/`ux-layout-agent` registered |
| `cli/tests/build.test.js` | Agent-roster fixture 13->15; `ux-agent` split into its own no-`memory:` block (Task 5) |
| `cli/tests/qa-reachability.smoke.test.js` | +5 "scenario 5" tests (Task 5) |

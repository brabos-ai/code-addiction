# Evidence v01 — Plan 0058: Layout Notation & The Measurable Design Contract

> **Date:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability` (0058 continues on the same branch)
> **Discipline:** grep-first sweep + build/vitest/bats verification per task, whole-branch cross-file consistency sweep + full-suite failure-set comparison in Task 4.
> Local environment: Windows 11 / Git Bash / node 22.17. CI (ubuntu) is the authoritative runner; local environmental caveats (CRLF) are noted where they apply.

## Task 1 — `feature-design` schema + `add-ux-design` notation/contract spec

`framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` (`feature-design` schema): `## Design Contract` added to the `Sections:` list, positioned after `Tokens` / before `References`; layout tree JSON shape documented under `Screens` compression; component composition notation added under `Components`; Mermaid `flowchart` permitted for branching `Flows` (arrow notation stays for linear flows); ASCII-wireframe hard ban restated with the replacement named.

`framwork/.codeadd/skills/add-ux-design/SKILL.md`: added `## Layout Tree Notation` (tree spec + compact example + no-leaf-styling ban), `## Component Composition` rule block, `## Design Contract Dimensions` table (11 rows, exact wording from the plan).

Grep proof (exact section name, zero stray casing/spacing):

```
$ grep -n "## Design Contract" framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md
144:  ...The section's exact heading is `## Design Contract` (pre-referenced by...
151:  - **`## Design Contract`** — per dimension this feature commits to...
```

## Task 2 — agent notation rewrite

`ux-layout-agent.md`: ASCII layout bullets replaced with layout tree + component composition + `## Design Contract` block emission (frontmatter, leaf constraint, no memory unchanged; `description` updated).
`ux-flow-agent.md`: flow output moved to arrow notation + Mermaid `flowchart` for branching; `plugin:gitnexus:graph` marker pair relocated off the numbered-list split (moved to sit after item 3's full sentence instead of between "Component Library Audit." and its "Extract:" continuation) — anchor changed, sidecar regenerated cleanly, no drift.
`provider-map.json` + `add-ecosystem/SKILL.md`: `ux-layout-agent` description/table cells reworded off ASCII.

Verify (from that task, re-confirmed clean in Task 4's full sweep below):

```
$ grep -rn "ASCII" framwork/.codeadd/agents/ux-layout-agent.md framwork/.codeadd/agents/ux-flow-agent.md
(no output)
```

## Task 3 — QA spec plumbing

`add-qa-spec/SKILL.md`: `expect` field rule stated — derives from the screen's `## Design Contract` rows + layout tree, never freehand.
`e2e-agent.md` + `fragments/qa-pipeline/add.test.md` (e2e-dispatch section): layer (iii) computed-style capture added — per contract dimension verified by "computed style," capture resolved values into `_tests/run-NNN/computed-styles/<screen>.<viewport>.json`; missing capture must be reported `unverifiable`, never passing.
`add.qa-setup.md` STEP 6 Conventions block: computed-style capture path convention line added.
`add-qa/SKILL.md`: overview line + UX-axis table row updated to name `## Design Contract` as the axis's source of truth (axis table otherwise untouched, per plan scope).

## Task 4 — sweep, SF_DIR glob backport, test extension, evidence, changelog

### 4.1 — SF_DIR glob backport (folded from 0057 final review)

`framwork/.codeadd/commands/add.plan.md`, STEP 8.1 preamble (before the existing "Scope dir" line), added:

```
**SF_DIR:** `SF_DIR = ${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*` (single match; the same glob `add.design` STEP 1.2 and `status.sh`'s `SF_DIR_GLOB` resolve).
```

Matches `add.design.md` STEP 1.2's `SF_DIR = ${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-* (single match)` and `status.sh`'s `SF_DIR_GLOB="$FEATURE_DIR/subfeatures/${CURRENT_SF}-*"` in substance; placed far from every injection marker (STEP 8.1 has none).

### 4.2 — grep sweep (ASCII / wireframe / stale `expect` freehand wording)

```
$ grep -rni "ASCII" framwork/.codeadd
skills/add-doc-schemas/SKILL.md:60   — "no ASCII art" (generic header-formatting ban, unrelated to layout/flow)
skills/add-doc-schemas/SKILL.md:204  — "ASCII art where forbidden" (generic hard-ban checklist item)
skills/add-doc-schemas/references/new-feature.md:157 — "neither inline SVG nor ASCII" (Flows hard-ban restatement, correct)
skills/add-doc-schemas/references/new-feature.md:161 — "ASCII wireframes (the layout tree above replaces wireframes)" (hard-ban restatement, correct)
skills/add-ux-design/SKILL.md:490    — "not an ASCII wireframe — the layout tree replaces wireframes entirely" (correct)
skills/add-token-efficiency/SKILL.md:155 — "Remove ASCII art, excessive dashes" (generic decorative-formatting rule, unrelated)
```

All six hits are either the surviving schema **ban** (explicitly kept per plan) or unrelated generic formatting guidance — zero stale layout/flow-authoring ASCII references remain.

```
$ grep -rni "wireframe" framwork/.codeadd
skills/add-doc-schemas/references/new-feature.md:161 — ban restatement (correct)
skills/add-ux-design/SKILL.md:490                    — notation intro (correct)
agents/ux-layout-agent.md:20                          — "no wireframe, no leaf-level styling" (correct)
```

No stale hits.

```
$ grep -rn "expect" framwork/.codeadd/skills/add-qa-spec/SKILL.md framwork/.codeadd/agents/e2e-agent.md \
    framwork/.codeadd/fragments/qa-pipeline/add.test.md framwork/.codeadd/commands/add.qa-setup.md
```

Found one real gap: `add.qa-setup.md` STEP 8 (the `screens.json` scaffold example) carried literal freehand `"expect": "what a correct render looks like"` / `"modal open with all fields visible"` placeholder values with no derivation rule stated at that call site (the derivation rule lived only in `add-qa-spec/SKILL.md`, not repeated where the setup command actually authors the first-cut `expect` values). **Fixed:** added the sentence `**`expect` is never freehand:** derive it from the screen's `## Design Contract` rows and layout tree in `design.md` (see `add-qa-spec`) — the example values above stand for "the derived one-liner," not invented prose.` immediately after the JSON shape example.

`provider-map.json` and `.claude/` (internal layer) were also checked for stray ASCII/wireframe mentions — zero hits outside the generic/unrelated formatting rules already covered above.

### 4.3 — schema exact-name fix

While sweeping, `new-feature.md`'s own `Sections:` line referred to the section only as prose "Design Contract" (no `##`), while `add.build.md:191` and `ux-layout-agent.md` both already cross-reference the literal heading `` `## Design Contract` ``. Fixed two lines in `new-feature.md` to carry the literal heading form so the schema reference is unambiguous and matches its own cross-references verbatim (see grep proof in Task 1 section above).

### 4.4 — build clean

```
$ node scripts/build.js
Building provider files...

Build complete:
  Commands : 19 × providers → 95 files
  Skills   : 39 skills  → 525 files
  Agents   : 15 agents  → 15 files
  Injection points : 35 → framwork\.codeadd\injection-points.json
  Total    : 635 files generated
```

No lint warnings, no anchor errors. Injection point count (35) unchanged from plan 0057's evidence — this plan touched no marker/anchor pairs.

### 4.5 — smoke suite extension (scenario 6)

```
$ cd cli && npx vitest run tests/qa-reachability.smoke.test.js
Test Files  1 passed (1)
Tests  17 passed (17)
```

New "scenario 6 — layout notation & Design Contract" (4 tests, all green):

1. built `ux-layout-agent.md` contains `layout tree` and no `ASCII layout`
2. built `new-feature.md` reference file (skill copy) ships the exact `## Design Contract` string
3. the `qa-pipeline` e2e-dispatch fragment source mentions `computed-styles`, AND the same string lands in the real injected `add.test.md` via `enableFeature` (round-trip proof, mirroring scenario 1's harness) — `disableFeature` restores afterward
4. built `add-ux-design` skill carries the `## Design Contract Dimensions` heading and the `Verified by` column header

13 pre-existing scenario-1-through-5 tests unaffected (still green).

### 4.6 — bats suite (untouched scripts, re-run per plan's Task 3 verify step)

```
$ npx bats framwork/.codeadd/scripts/tests/status.bats framwork/.codeadd/scripts/tests/qa-preflight.bats
1..63
ok 1 outputs BRANCH with type main
...
ok 63 phase b without FEATURE_DIR -> exit 2 with usage
```

Exit code 0. 63 passed / 0 failed — unchanged from plan 0057's evidence (this plan touches no `.sh`/`.bats` files).

### 4.7 — full vitest baseline: before/after failure-set comparison

**Before this plan** (per 0057 evidence v01, its final state): 443 total tests, 416 passed, 27 failed, 5 test files failed / 21 passed (26).

**After plan 0058 (all 4 tasks, cumulative):**

```
$ cd cli && npx vitest run
 Test Files  5 failed | 21 passed (26)
      Tests  27 failed | 420 passed (447)
```

Delta: +4 tests, all passing (the new scenario 6 quartet in `qa-reachability.smoke.test.js`); **failed count identical (27), and the failed-test-name set is identical** — verified by explicit enumeration below.

**Failing set (27, unchanged in content and order vs the 0057 baseline):**

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

Plus 2 whole-file import failures, unchanged: `tests/bin-codeadd.test.js`, `tests/uninstall-scope.test.js` (Windows/CRLF `SyntaxError` on this checkout, counted in `Test Files 5 failed`, not in the 27 individual `Tests` failures).

All 27 + 2 are the same Windows/CRLF-checkout environmental root cause identified in plan 0056's and 0057's evidence files — no new failure, no removed failure, no reordering. Plan 0058 introduces zero regressions and zero incidental fixes to this set (unlike 0057's Task 5, which fixed 3 branch-caused failures — 0058 touched no agent-roster fixtures or gitnexus anchors, so there was nothing in this set for it to fix).

## Deliverables shipped (plan 0058, cumulative across Tasks 1-4)

| File | Kind |
|---|---|
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | Modified — `## Design Contract` section added to `feature-design` schema; layout tree + composition notation documented; exact heading cross-reference fixed (Task 4) |
| `framwork/.codeadd/skills/add-ux-design/SKILL.md` | Modified — `## Layout Tree Notation`, `## Component Composition`, `## Design Contract Dimensions` sections added |
| `framwork/.codeadd/agents/ux-layout-agent.md` | Modified — ASCII layout replaced with layout tree + composition + `## Design Contract` emission |
| `framwork/.codeadd/agents/ux-flow-agent.md` | Modified — flow notation moved to arrows + Mermaid; `plugin:gitnexus:graph` marker relocated off the list-item split |
| `framwork/provider-map.json` | Modified — `ux-layout-agent` description reworded off ASCII |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Modified — Agents table `ux-layout-agent` row reworded off ASCII |
| `framwork/.codeadd/skills/add-qa-spec/SKILL.md` | Modified — `expect` derivation rule added (contract + layout tree, never freehand) |
| `framwork/.codeadd/agents/e2e-agent.md` | Modified — layer (iii) computed-style capture added to spec authoring |
| `framwork/.codeadd/fragments/qa-pipeline/add.test.md` | Modified — e2e-dispatch section: computed-style capture requirement + `unverifiable` rule |
| `framwork/.codeadd/commands/add.qa-setup.md` | Modified — STEP 6 computed-style path convention line (Task 3); STEP 8 `expect`-never-freehand sentence (Task 4 sweep) |
| `framwork/.codeadd/skills/add-qa/SKILL.md` | Modified — overview + UX-axis table row name `## Design Contract` as source of truth |
| `framwork/.codeadd/commands/add.plan.md` | Modified — explicit `SF_DIR` glob line backported to STEP 8.1 preamble (Task 4, folded from 0057 final review) |
| `cli/tests/qa-reachability.smoke.test.js` | Extended — "scenario 6" (4 tests): layout tree notation, exact `## Design Contract` string, computed-styles fragment + injected round-trip, dimensions table |

Evidence for plan 0057: `docs/plans/0057-PLAN--ux-agent-design-ownership--evidence-v01.md`.

## Errata (final whole-topic review, 2026-07-27)

- The line "this plan touched no marker/anchor pairs" (§Task 4 wrap-up) is wrong as stated: Task 2 deliberately RELOCATED the ux-flow-agent `plugin:gitnexus:graph` marker pair (sidecar regenerated; point count unchanged at 35 because relocation neither adds nor removes points). The number was right, the rationale was not.
- The pre/post `gitnexus-plugin.test.js` failure-list comparison the plan required at Task 2 time is evidenced via Task 4's full-suite failure-set enumeration (§4.7), which proves the same fact by name; recorded here so the obligation's location mismatch is explicit.

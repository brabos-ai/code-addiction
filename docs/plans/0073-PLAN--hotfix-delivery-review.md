# Plan: Hotfix Delivery Review — RED test before the fix, three read-only judges after it

> **Status:** implemented
> **Type:** workflow
> **Created:** 2026-08-25
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

`/add.hotfix` is the only delivery path in the ecosystem with no quality gate at all. Its single quality signal is STEP 8.3 — one line, "Verify build passes for affected apps" — and `/add.done` STEP 4.0 waives the review gate explicitly for non-feature branches (`add.done.md:112`: *"Hotfix/refactor/chore/docs branches do not require `/add.review`"*). A hotfix reaches `main` on a compiler check plus two doc-schema gates.

Two capabilities that would close this already exist in the tree and are never reached from the hotfix path:

- `add-tdd/SKILL.md` carries a **Bug-fix mode** ("write a test that reproduces it (RED), then fix to GREEN"), and `@test-agent` carries a `CORRECTION` mode specified as "ONE new failing test that pins the bug, written RED before the fix". `add.hotfix` never dispatches it, and `cli/src/features.js:43` does not list `add.hotfix` among `tdd-pipeline.commands`.
- `add-security-audit/SKILL.md` carries the full OWASP A01–A10 pass with a False Positive Prevention section. In the review path it is compressed to a single checklist bullet inside an eight-category backend reviewer prompt; on the hotfix path it is absent.

The `hotfix-about` schema already anticipates both: its **Root Cause** notation requires *"why safeguards missed it — which existing test, type, validation, or review should have caught the bug and didn't"*, and its **Verification** section names *"test added"* as the proof. The documents were written for a discipline the command never executes.

**Design decisions were taken in the consultation that produced this plan and are recorded in `## Validated Decisions` below.** No `docs/brainstorming/` document exists for this topic; the decisions live here.

## Problem

1. **A hotfix has no delivery gate.** Nothing reviews the diff for security, for conformance to documented project rules, or for the failure modes the fix itself introduces. The most common hotfix defect — the fix breaks something adjacent — is structurally invisible.
2. **`tdd-pipeline` enabled changes nothing in a hotfix.** The feature registry does not list the command, no fragment exists, and no RED step exists. A user who enabled TDD gets test-first on features and test-never on bugfixes, which is backwards: a bug is the one case where the failing test is already specified by reality.
3. **The blast radius is computed and thrown away.** STEP 4 dispatches `@feature-history-agent` ∥ `@git-history-agent`, and STEP 5 has the user *confirm* the related features and suspicious commits. That confirmed set feeds `related.md` and nothing else.
4. **Nothing judges the delivered code against the wiki.** `add-knowledge-discovery` is loaded at STEP 8.1 to consult `conventions.md` and the domain page as *input*. Its STEP 7 CONFLICT rule reports when the wiki is wrong; there is no counterpart for when the code is wrong.
5. **The code-review half of the ecosystem has no evidence contract.** `add-doc-schemas/references/review.md:5` scopes its *Finding & Evidence Discipline* to `audit-report`, `diagnose-report` and `qa-validation`. `@reviewer-agent`'s entire false-positive discipline is one line of prose: *"only report issues you are confident about."*

## Proposal

Keep `/add.hotfix` linear and self-contained. Insert one feature-gated RED step before the fix and one review step after it, both inside the command.

**Before the fix (gated on `tdd-pipeline`):** a new STEP 7.5 dispatches `@test-agent` in `CORRECTION` mode to author one failing test pinning the confirmed root cause. The coordinator — not the agent's report — runs the test and confirms it fails for the right reason. The existing STEP 8 becomes the GREEN half.

**After the fix:** a new STEP 8.5 dispatches three read-only judges in a single parallel dispatch — `@security-agent` (OWASP), `@conformance-agent` (documented project rules), `@failure-analysis-agent` (failure points and blast radius). STEP 8.6 triages their findings and runs at most one corrective pass. Because the judges are read-only and the coordinator applies, the read-only-judge contract from plan 0070 holds without borrowing `/add.review`'s machinery.

Two rules keep this from becoming noise, and they are the load-bearing half of the design:

- **Scope is the diff, not the file.** A pre-existing violation in a file the hotfix touched is reported as an observation and can never be a blocker. Without this, the first hotfix on a legacy file returns a wall of findings it did not cause, and the step gets ignored.
- **Findings are evidence-bound.** Each carries `path:line`, the rule it violates, and a concrete failure path. The coordinator **reads the cited lines** before presenting anything as a blocker — a deterministic check that kills the most common false positive, a hallucinated citation.

Placing the review before STEP 9 means `about.md` is written already carrying the review outcome, so no document is left stale by the corrective pass.

## Scope

### Includes

- **F1** — `framwork/.codeadd/agents/security-agent.md` (new): read-only OWASP judge, `readonly: true`, declaring `add-security-audit` + `add-code-review` as skills, mirroring `reviewer-agent.md`'s frontmatter dialect. Its distinguishing directive is diff-shaped: **did this change remove or weaken an existing control?** (a loosened guard, a dropped `account_id` filter, a bypassed DTO validation) — the hotfix security anti-pattern that a file-oriented checklist cannot ask. Owns the OWASP axis exclusively on this path. Carries the diff-scope rule and the evidence contract. Leaf agent, no dispatch.
- **F2** — `framwork/.codeadd/agents/conformance-agent.md` (new): read-only judge of the diff against **documented project rules**. Source is the wiki when `WIKI:present` (`conventions.md`, `architecture.md`, `domains/<area>.md`), and `CLAUDE.md` plus surrounding code when absent — so it degrades instead of no-opping on the projects without a wiki. Applies `add-knowledge-discovery` STEP 4 freshness per page (`git diff --name-only <page.commit>..HEAD -- <page.sources>`): a **stale page cannot ground a blocker** — the finding is recorded `unverifiable` with the reason. When the code is right and the page is wrong, emits a `wiki-drift` observation naming `/add.wiki update`, which is where `add-knowledge-discovery`'s STEP 7 CONFLICT rule currently dead-ends. Must NOT re-judge the OWASP axis.
- **F3** — `framwork/.codeadd/agents/failure-analysis-agent.md` (new): read-only judge of failure points introduced by the diff — unhandled error paths, null/undefined propagation, missing rollback or idempotency, resource leaks, retry semantics, ordering assumptions. Its distinguishing input is the **confirmed blast radius**: the related features and suspicious commits the user acknowledged at STEP 5, passed through as identifiers per the `add-knowledge-discovery` HANDOFF rule (paths and reasons, never inlined content). Must NOT re-judge the OWASP axis or the conformance axis.
- **F4** — `framwork/provider-map.json`: register the three agents under `agents` with one-line descriptions, matching the existing entry shape. This is what makes them build for claude/cursor/opencode as markdown and codex as TOML.
- **F5** — `framwork/.codeadd/commands/add.hotfix.md`: insert the marker-gated RED block at the end of STEP 7 (unnumbered heading, per the `add.build` fragment convention), plus **STEP 9** (judge dispatch) and **STEP 10** (triage + one bounded corrective pass), renumbering 9→11 … 14→16; update the MANDATORY SEQUENTIAL EXECUTION list, the ABSOLUTE PROHIBITIONS block, the `Rules` ALWAYS/NEVER lists and the Example Flow to match. **STEP 8.6 closes on re-verification, not on the edit:** when the corrective pass changed any file it MUST re-run STEP 8.3's build and, with `tdd-pipeline` enabled, re-run the STEP 7.5 test and confirm it is still GREEN — a correction that breaks the build or reopens the pinned bug is the failure mode a single unverified pass invites. Also amend **STEP 5.2** so the confirmed related features and suspicious commits are retained for the STEP 8.5 dispatch, not only for STEP 10 — F3's blast-radius input is exactly that set, and today the command stores it for `related.md` alone. Must NOT lose: the existing STEP 4 parallel-dispatch gate, the STEP 7 root-cause STOP, or the `<!-- plugin:gitnexus:graph-impact -->` marker at STEP 8 — see Risks.
- **F6** — `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md` (new): the RED sections injected at F5's markers. Reuses the existing `verify-red` discipline rather than restating it, and states the coordinator-verifies-RED rule and the not-testable escape.
- **F7** — `cli/src/features.js`: add `add.hotfix` to `FEATURES['tdd-pipeline'].commands`. Without it `applyEnabledFeatures` never resolves the fragment and F6 is dead weight. Reachable by `/add-framework--build` — precedent: plan 0070 F1, plan 0072 F1–F5.
- **F8** — `framwork/.codeadd/skills/add-doc-schemas/references/fix.md`: `hotfix-about` gains a `## Review` section with its depth floor (one row per finding: axis, severity, `path:line`, rule cited, disposition `fixed` / `accepted` / `unverifiable` / `pre-existing`), and the RED test is named in the existing `## Verification` section. The category's `## Shared Notation` binds the `## Review` section to the **Finding & Evidence Discipline** already defined in `references/review.md` — referenced, not restated, so one definition governs both categories.
- **F9** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: three rows in the `## Agents` table (line ~81), the `add.hotfix` command row updated to name the new steps and agents, and the `add-tdd` / `add-security-audit` skill-usage rows updated to list `add.hotfix`.

### Does NOT Include (important!)

- **No changes to `/add.review`, `/add.build`, `/add.done` or `/add.plan-to-ready`.** The three judges are hotfix-only in this plan. Promoting them to the feature path requires axis-ownership surgery on the frontend/backend reviewer prompts (removing OWASP and pattern-conformance so no axis is judged twice, per plan 0059) plus a roster update in `add.plan-to-ready`. Deferred deliberately: validate the agents where the cost of a bad prompt is low, then decide. **This plan therefore does not improve `/add.plan-to-ready`** — that was the accepted cost of keeping the hotfix path lean.
- **No `review-NNN.md` for hotfixes, and no change to the `review` doc schema.** That schema mandates `Spec Compliance Audit`, `Product Validation` and `QA Judgement` (`references/review.md:72`) — sections a hotfix cannot produce without fabricating them. Findings land in `hotfix-about`'s `## Review` section instead.
- **No `## Fix Routing` table and no routing-table changes.** The coordinator triages in-session; there is no cross-command correction contract to satisfy.
- **No merge gate.** `/add.done` STEP 4.0 keeps waiving the review for non-feature branches. The gate is the human reading STEP 8.6.
- **No adversarial refutation dispatch.** Replaced by the coordinator's citation verification, which is deterministic and free. It catches hallucinated evidence, not sound-looking reasoning on a real citation — an accepted limit, revisitable once the agents have a track record.
- **No change to `add-security-audit/SKILL.md`.** The diff-scope rule belongs in F1's prompt, not the skill: `/add.audit` loads the same skill for whole-project, file-scoped analysis and must keep it.
- **No suppression allowlist** (`docs/security/accepted.md` or equivalent).
- `CLAUDE.md` and `.claude/` are out of reach for `/add-framework--build` — see Next Steps.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Where does the hotfix review live? | Inline in `add.hotfix`, after the fix | The read-only-judge rule from 0070 is justified in `add.review` by two mechanics — invalidated QA evidence and loop convergence. A hotfix captures no QA evidence and runs no loop, so borrowing `add.review`'s 1005 lines and its feature-shaped gates buys nothing. The judges stay read-only and the coordinator applies their findings in-session — no `@fix-agent`, no routing table, since STEP 8.6's corrective pass is coordinator work, not a dispatch. |
| How many judge agents? | Three | The feared cost is steps, docs and gates — not fan-out. Three agents in one parallel dispatch is one step and one round-trip. Single-responsibility prompts are what make the evidence contract enforceable; an eight-category generalist dilutes it. |
| Axis ownership | Each judge owns its axis exclusively on this path | Plan 0059's rule: no axis judged twice. Overlap would reintroduce the dedup/contradiction problem this design has no coordinator machinery to solve. |
| False-positive control | Evidence contract + diff scoping + coordinator citation verification | The evidence contract already exists (`references/review.md` Shared Notation) and needs binding, not authoring. Diff scoping is what stops the legacy-file avalanche. Citation verification is a coordinator read, not a dispatch. |
| Blocker scope | Introduced by the diff = blocker; pre-existing = observation, never blocker | Precedent: `add.review` STEP 7 already partitions `TOUCHED_FAILURES` vs `UNTOUCHED_FAILURES` for exactly this reason. Without it the gate gets disabled in practice. |
| RED gate hardness | Hard, with a named recorded escape | A hard gate with no escape makes the agent fabricate a test to satisfy it. `RED_TEST: none — REASON: <…>` is recorded and surfaces in the `## Review` section, mirroring the `unverifiable` outcome. |
| Who confirms RED? | The coordinator runs the test itself | `@test-agent` reports `TESTS_PASSING`; RED needs the opposite plus the failure reason. Same principle as `add.review` STEP 7's "do NOT trust ticks". |
| No test runner in the project? | Report loudly, continue | Follows `fragments/tdd-pipeline/add.build.md` §detect-framework. A production bugfix must not be blocked on a missing runner. |
| Review before or after the docs? | Before STEP 9 | `about.md` then records the review outcome on first write, and no corrective pass leaves a document stale. |
| Wiki absent? | Judge against `CLAUDE.md` + surrounding code | `WIKI:absent` is a normal state. An agent that no-ops on half the projects is not a gate. |
| Where does the `features.js` edit live? | This plan, `/add-framework--build` | Plans 0070 and 0072 both carry `cli/src/*` F-blocks; `cli/` is in the executing command's reach despite CLAUDE.md's shorthand. |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A hotfix gate that costs two steps and no new document | A durable, machine-readable delivery receipt — findings live in prose-with-table form inside `about.md`, not in a schema `/add.done` can parse |
| The judges stay hotfix-only, so no axis-ownership surgery on `add.review` | The feature path and `/add.plan-to-ready` get no benefit from this plan |
| Citation verification is free and deterministic | It cannot catch a well-reasoned finding that is simply wrong |
| Diff scoping keeps the signal high | Real pre-existing vulnerabilities in touched files are reported but never block — by design |
| `/add.done` unchanged, hotfix ergonomics preserved | A user can still merge a hotfix with open blockers; the human is the gate |
| A gate that runs on every hotfix, so none slips through untouched | STEP 8.5 is unconditional — unlike STEP 7.5 it has no feature gate and no size-based escape, so even a one-line fix pays one 3-agent parallel dispatch. Accepted against the command's own "rapid" framing, because a gate a trivial fix can opt out of is a gate every fix will claim to be trivial enough to skip |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| **F5 breaks the existing `<!-- plugin:gitnexus:graph-impact -->` injection.** That marker sits at STEP 8's prerequisites (`add.hotfix.md:224`), directly adjacent to where F5 inserts. `extractInjectionPoints()` anchors it to the nearest variable-free adjacent line; F5 moving or rewording that line silently changes the sidecar anchor | High | L1.4 asserts the gitnexus anchor for `add.hotfix` still resolves and its `next` drift hint still holds; L3.2 asserts the plugin still enables on the built file |
| Judges re-judge each other's axis, producing duplicate findings with no dedup machinery | Medium | F1–F3 each carry an explicit exclusion clause; L4.2 asserts all three exclusions are present |
| Agents ignore diff scoping and return pre-existing findings as blockers | Medium | L4.1 asserts the diff-scope rule text in all three prompts; L4.8 asserts STEP 8.6 partitions by disposition and never presents a `pre-existing` finding as a blocker |
| The RED gate produces a fabricated passing-as-failing test | Medium | F6's coordinator-runs-the-test rule plus the recorded not-testable escape; L4.4 asserts both are present and that the report field alone is never the proof |
| Enabling `tdd-pipeline` after install does not reach `add.hotfix` because F7 was forgotten | Medium | L2.1 is a round-trip enable/disable on `add.hotfix`, which fails outright without F7 |
| `add.hotfix` grows past readability (361 lines today) | Low | F5 adds steps, not prose: the RED discipline is referenced from `add-tdd`, the judge prompts live in the agent files, not inline in the command |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/agents/security-agent.md` | New file (F1) |
| `framwork/.codeadd/agents/conformance-agent.md` | New file (F2) |
| `framwork/.codeadd/agents/failure-analysis-agent.md` | New file (F3) |
| `framwork/provider-map.json` | Three `agents` entries (F4) |
| `framwork/.codeadd/commands/add.hotfix.md` | STEP 7.5 / 8.5 / 8.6, step list, prohibitions, Rules, Example Flow, tdd markers (F5) |
| `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md` | New fragment (F6) |
| `cli/src/features.js` | `tdd-pipeline.commands` gains `add.hotfix` (F7) |
| `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` | `hotfix-about` `## Review` section + evidence-discipline binding (F8) |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Agents table, `add.hotfix` row, skill-usage rows (F9) |
| `framwork/.codeadd/injection-points.json` | Build-emitted; gains the `add.hotfix` tdd anchors. Not hand-edited — asserted in L1 |
| `framwork/.codeadd/skills/add-security-audit/SKILL.md` | **No change** — diff scoping stays in F1's prompt so `/add.audit` keeps file-scoped analysis |
| `framwork/.codeadd/skills/add-tdd/SKILL.md` | **No change** — its Bug-fix mode is referenced by F6, not rewritten |
| `framwork/.codeadd/agents/test-agent.md` | **No change** — its `CORRECTION` mode already specifies the RED-pins-the-bug contract. F5's dispatch supplies root cause + repro in place of the `## Fix Routing` slice its input list names, and F6 states that substitution |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level below BEFORE any F-block lands, and verify each fails against the current tree. Then drive them GREEN.

**EXPECTED END-STATE MAP for injection.** After F5+F6+F7, `add.hotfix` is the injection target of:

| Namespace | Sections | Resource |
|---|---|---|
| `feature:tdd-pipeline` | the RED sections F6 defines | `commands/add.hotfix.md` |
| `plugin:gitnexus` | `graph-impact` (pre-existing, unchanged) | `commands/add.hotfix.md` |

The build must **assert this map**, not assume it: exactly these namespaces, exactly these sections, on this one file.

### L1 — Build side (RED → GREEN)

1. `node scripts/build.js` exits 0 and emits no `lintResourcePaths` warning for any file F1–F9 touches. *RED today: F1–F3 and F6 do not exist.*
2. `framwork/.codeadd/injection-points.json` contains one entry per F6 section, keyed to `add.hotfix`, each with a variable-free `anchor.text`. *RED today: no `add.hotfix` feature entry exists.*
3. Every built provider copy of `add.hotfix` is **marker-free** — no `<!-- feature:` or `<!-- plugin:` survives the build. *RED today: passes trivially; becomes meaningful once F5 adds markers.*
4. **Anchor-preservation gate:** the sidecar entry for `plugin:gitnexus:graph-impact` on `add.hotfix` still resolves after F5, and its `next` drift hint still matches a line present below the anchor. *RED today: passes; the assertion exists to catch F5 breaking it.*
5. The three agents build for claude, cursor and opencode as markdown and for codex as TOML with the body in `developer_instructions`. *RED today: the files do not exist.*

### L2 — CLI feature toggle (integration)

1. On a scratch install, `codeadd features enable tdd-pipeline` then `disable` on `add.hotfix` is a **byte-identical round-trip** against the pristine built file. *RED today: `add.hotfix` is not in `tdd-pipeline.commands`, so nothing is injected and the test cannot distinguish success from no-op — it must assert the injected state exists between the two calls.*
2. With `tdd-pipeline` **disabled**, the installed `add.hotfix` contains no RED step and no reference to `@test-agent`.
3. With `tdd-pipeline` **enabled**, the installed `add.hotfix` contains each F6 section exactly once.

### L3 — Combination matrix

Assert the END STATE of every combination, not merely that a replace happened:

1. **All toggle states** — `tdd-pipeline` × `gitnexus` over {off,off}, {on,off}, {off,on}, {on,on}: every expected section present exactly once, every unexpected section absent, the command still coherent (step list matches the steps that exist) in all four.
2. **Shared-file non-collision** — with both enabled, the feature block and the plugin block both land at their own anchors, neither clobbering the other.
3. **Partial disable** — disabling `tdd-pipeline` leaves the gitnexus block byte-untouched, and vice versa.
4. **Order independence** — enabling gitnexus then tdd produces bytes identical to tdd then gitnexus.
5. **Full round-trip** — enable both, disable both, bytes equal the pristine built baseline.

### L4 — Behavioural acceptance (content assertions on the shipped artefacts)

1. **Diff scoping** — each of F1, F2, F3 states that a pre-existing finding is an observation and can never be a blocker. Three files, three assertions. *RED today: the files do not exist.*
2. **Axis exclusivity** — F1 excludes the conformance and failure axes; F2 excludes OWASP; F3 excludes OWASP and conformance. No axis appears as owned in two files.
3. **Evidence contract** — each judge requires `path:line` + the cited rule + a concrete failure path, and F5's STEP 8.6 requires the coordinator to read the cited lines before presenting a blocker.
4. **RED is coordinator-verified** — F6 states that the coordinator runs the test and inspects the failure reason, and that `TESTS_PASSING` from the agent report is never the proof. The not-testable escape (`RED_TEST: none — REASON`) is present and routed into the `## Review` section.
5. **Freshness gate** — F2 makes a stale wiki page unable to ground a blocker, downgrading to `unverifiable` with the reason, and names `/add.wiki update` for the `wiki-drift` case.
6. **Corrective pass is re-verified** — F5's STEP 8.6 requires, whenever the pass modified a file, a re-run of STEP 8.3's build AND (with `tdd-pipeline` on) a re-run of the STEP 7.5 test confirmed GREEN. Assert both conditions are stated as requirements, not suggestions. *RED today: STEP 8.6 does not exist.*
7. **Blast-radius retention** — F5's STEP 5.2 retains the confirmed related features and suspicious commits for STEP 8.5, and F3 names that set as its input. Asserted on both files: a retention clause with no consumer, or a consumer with no retention clause, is the same defect. *RED today: STEP 5.2 stores the set for STEP 10 only.*
8. **Disposition partition** — F5's STEP 8.6 partitions every finding by disposition (`introduced` / `pre-existing` / `unverifiable` / `accepted`) BEFORE presenting anything, and states that a `pre-existing` finding can never be presented as a blocker. This is the enforcement half of L4.1: the rule in the judge prompts is what the agents are told, this is what the coordinator does when they ignore it. *RED today: STEP 8.6 does not exist.*
9. **Step coherence** — `add.hotfix`'s step numbering is integer and contiguous 1..16 with no fractional `## STEP` heading and no orphan, and the MANDATORY SEQUENTIAL EXECUTION list names exactly the steps the bodies define. *RED today: STEP 9 and STEP 10 do not exist.*
10. **Schema round-trip** — a `hotfix-about` carrying a populated `## Review` section passes the `add-doc-schemas` validation gate, and one with the section absent fails it.
11. **Ecosystem map completeness** — `add-ecosystem/SKILL.md` lists all three agents, and its `add.hotfix` row names them. Asserted against the **provider-transformed copies**, since it is a `.codeadd/` skill and passes through `scripts/build.js` — a stale build is caught too (precedent: plan 0070 F5 coverage).

**RED expectations against the current tree:** L1.1/1.2/1.5, L2.1–2.3, L3.1–3.5 and L4.1–4.11 all fail today, because F1–F3 and F6 do not exist and `add.hotfix` is not a `tdd-pipeline` target. L1.3 and L1.4 pass today and exist as regression guards on F5. **GREEN = all levels pass after F1–F9.**

---

## Execution Order

`F1–F3 → F4 → F5 → F6 → F7 → F8 → F9`, with the validation matrix written before any of it.

- **F1–F3 first** because F4, F5 and F9 all reference agents that must exist to be registered, dispatched and mapped.
- **F4 before F5** so a dispatch added in F5 names a registered agent.
- **F5 before F6** because the fragment's sections are meaningless until their markers exist in the command source.
- **F6 before F7** because enabling the feature with no fragment on disk is a no-op the L2 test would misread as success.
- **F8 and F9 last** — documentation of what the earlier blocks established.

**Working-state boundaries.** The framework is coherent after **F4** (agents exist and build, nothing dispatches them yet) and after **F7** — but F7 is **build-safe, not user-shippable**: every step executes, yet without F8 the `hotfix-about` schema has no `## Review` section, so STEP 8.6's findings have no schema-sanctioned place to land and STEP 9's extractive write drops them. The staleness this design exists to prevent is unsolved until F8. A build that must stop should stop at F4 or F7 and say which, and stopping at F7 must be reported as incomplete rather than working.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-reading this conversation. For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the row in `## Validated Decisions` it departs from and why.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a content assertion written after the file it asserts proves nothing.
2. **F5 silently breaking the gitnexus anchor.** The build can succeed and the sidecar can regenerate while the anchor now points at rewritten prose. L1.4 and L3.2 are the only things that catch it; verify they actually ran rather than being asserted as "obviously fine".
3. **An axis judged twice.** Easy to introduce by copying the security prompt as the base for the conformance one. L4.2 must be checked against all three files, not one.
4. **The diff-scope rule present as prose but not as a rule.** A sentence mentioning pre-existing findings is not the same as a prohibition on routing them as blockers; the assertion must find the prohibition.
5. **F7 forgotten.** F6 on disk with no registry entry produces a fragment that never injects and an L2 test that passes vacuously if written to assert only the disabled state.
6. **`@test-agent` dispatched without the input substitution.** Its documented `CORRECTION` inputs name a `## Fix Routing` slice that does not exist at hotfix time; F5's dispatch must supply root cause + repro instead, and F6 must say so.

## References

- Prior art: plan **0070** (development-loop consolidation) — established read-only review, the `@test-agent` CORRECTION red-green contract, and `cli/src/features.js` as in-reach for a product plan. Plan **0059** (dual-judge QA) — established axis ownership and the `unverifiable` outcome. Plan **0072** (migration runner) — precedent for `cli/src/*` F-blocks.
- `framwork/.codeadd/commands/add.hotfix.md` — the command being changed
- `framwork/.codeadd/skills/add-doc-schemas/references/fix.md` — `hotfix-about` schema, Root Cause Notation
- `framwork/.codeadd/skills/add-doc-schemas/references/review.md` — Finding & Evidence Discipline (bound by F8)
- `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` — freshness (STEP 4), HANDOFF (STEP 6), CONFLICT (STEP 7)
- `framwork/.codeadd/skills/add-tdd/SKILL.md` — Bug-fix mode
- `cli/src/features.js`, `cli/src/injection-core.js`, `scripts/build.js` — injection engine

---

## Next Steps

/add-framework--build 0073-PLAN--hotfix-delivery-review

Then, for the internal layer (`/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/`):

- `/add-framework--self-plan` — record the three new agents in `CLAUDE.md`'s product-layer agent count (currently stated as 17) and note the hotfix review path in the Feature Injection System table, whose `tdd-pipeline` row lists only `add.plan, add.build, add.review`.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-25 | Initial creation |
| 2026-08-27 | Implemented via `/add-framework--build`. Three build-time deviations, all approved: fractional STEP numbers replaced by an unnumbered injected heading + integer STEP 9/10 (`building-commands` bans fractional steps); the RED marker moved to the end of STEP 7 because STEP 8.1's body carries resource-path variables and would have mis-anchored the block — this also left STEP 8 untouched, preserving the gitnexus anchor byte-for-byte; judges hardened with `disallowedTools` and no `memory:`, since the Claude dialect does not emit `readonly:`. Four hardcoded expectations in the existing suite moved (sidecar 38→39 in two files, agents 17→20, buildAgents 68→80) — blast radius the Ecosystem Impact table did not list. |
| 2026-08-25 | Review v02 fix: L4 gains assertion 8 (disposition partition, trailing items renumbered 9-11); the diff-scoping risk row now cites it instead of L4.3, which asserts citation verification |
| 2026-08-25 | Review v01 fixes: F5 gains corrective-pass re-verification and STEP 5.2 retention; L4 gains assertions 6-7 (renumbered 8-10); F7 working-state boundary qualified as build-safe-not-shippable; latency trade-off row added; gitnexus marker line corrected to 224; `@fix-agent` comparison reworded |

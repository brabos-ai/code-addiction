---
review_version: 02
plan: HANDOFF-qa-ux-umbrella (umbrella scope — plans 0056, 0057, 0058, 0059, 0060)
plan_changelog_audited: 2026-07-27 | 7f7b798
reviewed_at: 2026-07-27T23:14:00Z
verdict: BLOCKED
resolution: CLEARED (2026-07-27) — 4/4 high, 12/12 medium (1 pending user go-ahead), 11/13 low. 2 deferred with owners; 2 deviations recorded. See § Resolution
---

# Review v02: QA/UX Umbrella — post-fix-wave re-audit

> Verdict: **BLOCKED**
> Plan audited at changelog entry: 2026-07-27 (HEAD `7f7b798`, branch `feature/0056-qa-ux-umbrella`, 28 commits ahead of `main`)
> Diff audited: `a7eeb52..7f7b798` — 31 files, +508/−456
> Prior review: `HANDOFF-qa-ux-umbrella--review-v01.md` (verdict BLOCKED, 4 high / 9 medium / 8 low)

## Summary

**All four v01 blockers are genuinely cleared**, and the de-duplication they asked for was executed as a *move*, not a copy — verified line by line, with the four largest deletions (`add-qa/SKILL.md` −73, `add-ux-design/SKILL.md` −67, `add.plan.md` −64, `add.design.md` −69) landing byte-identically in their new homes. The highest-risk item in the wave — shrinking the UX dispatch prompts and relocating the consolidation contract into the `feature-design` schema — lost nothing load-bearing. The 35 injection points were re-derived against HEAD with zero drift, and the deliberate `feature:tdd:step9` re-anchor is sound.

The umbrella is nevertheless **BLOCKED again**, for a smaller and different reason than v01. v01 blocked on broken behaviour (an agent refusing its own dispatch; the Design Contract silently skipped on epics). v02 blocks on **the fix wave reproducing, at two new sites, the exact defect class it was sent to fix**: content was extracted into reference files and two consumers were left citing the old address — one of them an agent that is *forbidden by design* from loading the file its own justification points at. A third high is that a quarter of the wave's deliverables (three changelogs and the review of record) were written to disk but never entered the repository, in the same commit that documented the policy requiring them to.

None of this is architectural. Every high is a one-to-three-line edit or a `git add -f`.

## Findings by Severity

| Severity | Count | Topic |
|----------|-------|-------|
| high | 4 | `ux-agent` cites an authority it cannot reach; `add-qa` checklist points at a removed section; fix-wave changelogs + review v01 untracked; `ux-agent` free-form mode has unbounded write scope |
| medium | 12 | amendment A1 not propagated to 2 sites; `add.qa` READ-ONLY row vs `qa-agent` denylist; `provider-map` qa-agent description still dual-axis; `add.design` stale skill inventory; pointer-plus-restatement at `add.qa` 5.5 and `add-qa` checklist; smoke guard passes for the wrong reason; fix-mode never named at dispatch; two subdoc conventions shipped at once; `add.plan`/`add.design` already drifted; maintainer-addressed ⛔ in runtime prompts; commit message names no blocker; web docs deferral declared only in an untracked file |
| low | 13 | ecosystem coordinate inconsistency; 3 brittle test pins; nested-bold markdown bug; non-verbatim heading citation; `critique-rubric.md` double title; skills count 34 vs 39; residual `STEP 4.4` in `qa-agent`; `--yolo` live but undocumented; latent fragile anchors in `add.build`; `0057-PLAN` doesn't cite its changelog; `SAAS_CONTEXT` undocumented in `ux-flow-agent`; `package-lock` 0.4.7 |

## Plan Conformance

### v01 blockers — all four cleared

| ID | Verdict | Evidence |
|---|---|---|
| S1/Q1 — `@ux-agent` had no fix mode | **cleared** | `agents/ux-agent.md:85-105`. Fix Mode is specified, not sketched: minimal-amendment rule, the explicit "never widen a dimension merely to make a failing screen pass", the mandatory `## Design Review` row carrying `run-NNN` + finding ID (`:98`), a return-unfixed path for uncited findings, three tool-specific ⛔. Review mode's refusal was *hardened* rather than left to contradict it (`:82` "forbidden even when the fix is obvious"). `description` (`:3`) names all three modes; explicit `Write scope` at `:13`. No surviving blanket read-only claim. |
| S2 — `add.review` blind to SF-level `design.md` | **cleared** | `commands/add.review.md:59,244,383,390,399`. A grep of every `design.md` mention in the file returns exactly these five sites; all five are correct. `:244` names feature-level-only resolution "a review defect". |
| S3 — `add.autopilot` blind, plus `/design` | **cleared** | `commands/add.autopilot.md:207,233,387,601`. All four sites resolve two-scope; `:207` says `/add.design` and warns the feature-level-only check is a false alarm on epics. |
| C1/D1 — legacy-fallback removal contradicted plan 0060 | **cleared in the code and the plan of record** | `0060-PLAN…:22` (struck through), `:50`, `:84` (risk row), `:66-74` (`## Amendments` → A1 with rationale, migration impact, and an artefacts-reconciled list), `:96-98` (changelog rows); evidence `:29,:54`; changelog `### Breaking`; code `fragments/qa-pipeline/add.build.md:28-31`; schema `references/review.md:69`; test `qa-reachability.smoke.test.js:371`. **Two residual sites remain — see M1.** |

### v01 medium / low — 9 of 10 and 9 of 10 cleared

Verified with evidence: C2 (`DESIGN_FILE` threaded through every consumer of `add.qa.md`), C4, C5, D2, D3, S7, S8, S9, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q13, Q14, Q15, Q16, Q17, Q18.

Not cleared: **C3** (changelogs written but untracked → H3), **Q12 residual** (`agents/qa-agent.md:22` still hard-codes "The STEP 4.4 coverage reconciliation table" — every other agent coordinate was de-numbered), **S4/S5/S6** (deferred, but see M12), **D7** (pre-existing).

### Original five plans — still conformant after the refactor

| # | Item | Verdict | Evidence |
|---|---|---|---|
| B1 | 0059 merge rules reachable by the coordinator and ONLY by it | **pass** | `add.qa.md:18` preloads `coordinator.md`; `:209` re-states a ⛔ READ gate immediately above the merge; the 4.5 dispatch hands judges only `add-qa/SKILL.md`; `coordinator.md:3` and `add-qa/SKILL.md:73` both state judges must not load it |
| B2 | 0059 axis-ownership table (7 rows) reachable by both judges | **pass** | `add-qa/SKILL.md:31-45`, handed to both at `add.qa.md:174` |
| B3 | 0058 Design Contract table (11 dims) reachable by its consumers | **pass, one weak link** | `design-contract.md:36-48`; named explicitly by `ux-layout-agent.md:20` and `ux-agent.md:50`. `@qa-agent` reaches it only via the rendered table in `design.md` — operationally correct, but it does not declare `add-ux-design` as a skill, so it has no pointer to the dimension definitions |
| B4 | 0057 dispatch-prompt shrink lost nothing load-bearing | **pass** | Every removed instruction has a home: consolidation steps + frontmatter YAML + provenance truthfulness → `new-feature.md:143-158`; Design Review shape → `:171`; per-defect shape + severity + empty-critique → `critique-rubric.md:19,21`; `frontend_false` early exit, `HAS_FOUNDATIONS`, `SAAS_CONTEXT`, never-reuse-a-temp ⛔ and the soft-degrades all retained inline |
| B5 | The "change in BOTH or NEITHER" comment | **improved** | Replaced by a real mechanism — both commands cite the schema, which says "Change it HERE, never in one command alone" (`new-feature.md:158`) |
| B7 | 0056 preflight rows + severities | **pass** | `add.qa.md:95-105` — rows 9-12 intact with identical severities; diagnosis-not-a-gate framing, `missing`/`broken`/`not-probed` and the always-exit-0 contract untouched |
| B8 | 0060 routing table, 14 rows verbatim after the move | **pass** | `coordinator.md:22-77` |

## Diff Completeness

**31 files, 0 unaccounted.** Every changed file traces to a v01 finding ID, an action-list bullet, or a plan task. No drive-by edits. No content deleted without a new home — the four large deletions were reconciled line by line and the only text with no surviving copy is a schema-restating aside already stated canonically at `new-feature.md:160`.

Reverse check against v01's Consolidated Action List: **blockers 4/4, medium 9/10, low 9/10.**

**Untracked deliverables (→ H3).** `git ls-files docs/` returns 19 files, unchanged since `b49352e`. These exist on disk and are invisible to the repo:

| File | Consequence |
|---|---|
| `docs/changelog/2026-07-27-update-ux-agent-design-ownership.md` | C3 (0057 T5.5) reads as uncleared from the repo |
| `docs/changelog/2026-07-27-update-layout-notation-design-contract.md` | `0058-PLAN…:84` cites it → dangling reference in a fresh clone |
| `docs/changelog/2026-07-27-refactor-umbrella-review-v01-fixes.md` | The **only** durable declaration of the S4/S5/S6 deferral — so from git, the deferral is silent |
| `docs/plans/HANDOFF-qa-ux-umbrella--review-v01.md` | The review that motivated the whole commit |

`CLAUDE.md:31`, written *in this commit*, says: "to make another artefact durable, force-add it and say why here." Four artefacts were then left untracked. The policy was violated by the commit that created it.

**Clean:** `qa-preflight.sh` mode change landed (`git ls-files -s` → `100755`). The three new skill subdocs are tracked and need no registration — `scripts/build.js` `skillStrategy.postWrite` copies every non-`SKILL.md` entry recursively (verified by reading, not running). `framwork/.gitignore` covers `injection-points.json` and all provider dirs, so no stale-build drift can be committed.

**Commit hygiene (→ M11).** `7f7b798` is titled *"refactor(qa/ux): extract coordinator and design-contract references from skills"* and names **no blocker**. Blocker 1 hides inside "agents … align with routing/coordinator changes" — "align" understates authorizing an agent to write `design.md` for the first time. Blockers 2 and 3 hide inside "commands … trim duplicated guidance", which describes the opposite of what those hunks do: neither command was trimmed, both gained enforcement logic. Because the review file itself is untracked, `git log` is the only surviving artefact of the fix wave on a fresh clone — and it never says "blocker".

## Side-Effect Detection

### Regressions introduced by the fix wave

| # | file:line | What breaks | Mechanism | Sev |
|---|---|---|---|---|
| **H1** | `agents/ux-agent.md:87` | Fix Mode justifies its exclusive `design.md` write right with "implementation agents are barred from it by the capability validation in skill `add-qa`". That rule moved to `add-qa/references/coordinator.md:46` — and `coordinator.md:3` **explicitly forbids `@ux-agent` from loading that file**. `ux-agent` preloads only `add-ux-design`. The agent cites an authority it is structurally barred from reaching; `add-qa/SKILL.md` no longer contains the rule. | Extraction dangling pointer compounded by the mutual-exclusion rule the same commit introduced | **high** |
| **H2** | `skills/add-qa/SKILL.md:210` | Judge-loaded checklist: "Findings merged per the **STEP 5 rules** — deduped, higher severity wins, contradictions…". The merge rules left this file in `7f7b798`. A judge reading `add-qa` cannot resolve "the STEP 5 rules" from anything it loads — and the phrasing is the hard-coded-coordinate style this same wave removed everywhere else (Q12). | Dangling pointer + reintroduced coordinate | **high** |
| M2 | `commands/add.qa.md:47` | The READ-ONLY guardrail row grants both judges "Write only under `SCOPE_DIR/_tests/run-NNN/`". `@qa-agent` now carries `disallowedTools: Write, Edit, NotebookEdit` and cannot exercise it. The same file contradicts itself at `:203` ("Both judges write nothing outside their returned findings"), and `:221` correctly assigns screenshot copying to the coordinator. | Denylist added in the agent; the dispatching command's permission table left untouched | medium |
| M3 | `framwork/provider-map.json:139` | `qa-agent` description still reads "**Dual-axis** QA judge … validate (1) **UX quality vs design.md** and (2) functional delivery". `qa-agent.md:8` and `add-qa/SKILL.md:31` both say UX quality belongs to `@ux-agent` and that `qa-agent` must **decline** it. The `ux-agent` row was updated in this commit; its pair was not. | Asymmetric one-line edit. The registry description is what an agent-picker / soft-degrade path reads | medium |
| M4 | `commands/add.design.md:59` | "**Skill provides:** … Components, **Critique Rubric**, Checklist" — the rubric is no longer in `SKILL.md`; it is `critique-rubric.md`, a separate load. The command promises content that "Read skill `add-ux-design`" no longer delivers (only a one-line index at `SKILL.md:494`). | Stale inventory line vs progressive disclosure | medium |
| L1 | `agents/qa-agent.md:53` | Cites "section `## Root-cause Taxonomy` in skill `add-qa`"; the actual heading is `## Root-cause Taxonomy (`@qa-agent`) — functional findings`. Resolves by prefix, but `new-feature.md:159` sets the house rule "must match verbatim" and an exact grep fails. | low |
| L2 | `commands/add.review.md:244` | Nested bold: `**Resolve it per the `feature-design` **Location** rule …**` — emphasis terminates early and the tail renders unbolded in every provider output. | low |
| L3 | `commands/add.build.md:195` (`feature:qa-pipeline:qa-fix`) | Anchor text is a bare `---` at ordinal 10; three `feature:tdd:*` anchors sit on a bare ` ``` ` at ordinal 7. Currently resolve correctly in all five providers. Pre-existing, **not** introduced — and plan 0060 forbids disturbing this pair — but it is now the most fragile anchor in the set, and `add.build.md` was edited by this commit. | low (latent) |

### Verified clean

- **Injection integrity — proven, not assumed.** Exactly 35 points; all 35 re-derived in-process with `extractInjectionPoints` against HEAD sources and diffed against the sidecar: **zero drift, zero new, zero stale**. All anchors resolved against every built provider file using `injection-core.js` semantics: **135 resolutions, 0 failures, 0 `next`-drift**. No anchor is empty or carries a build-time variable. The `feature:qa-pipeline:qa-fix` adjacent prose (`add.build.md:191-194`) was not disturbed — plan 0060's constraint holds.
- **`feature:tdd:step9` re-anchor is sound**: unique prose, ordinal 1, `next` present below.
- **Subdoc distribution works.** `{{skill:}}` resolution is greedy past `/`, so `add-qa/references/coordinator.md` resolves; the file is present in all five provider dirs; built commands carry resolved paths and a repo-wide grep for surviving `{{cmd:|skill:|addpath:}}` in built output returns **zero**.
- **New pointers all resolve** — `coordinator.md`, `design-contract.md`, `critique-rubric.md`, the Consolidation contract, and all Location-rule citations were opened and their headings matched. A repo-wide grep for "table above / rubric above / section above / template above" finds no QA/UX hit pointing at moved content.
- **`ux-agent` can actually write**: no `tools:`/`disallowedTools:` in its frontmatter. Every read-only assertion about it is now mode-scoped.
- **`qa-agent`'s denylist breaks nothing**: its body asks for no file write, and the playwright fragment uses only `browser_*` MCP tools.
- **Registries match both directions**: `features.js` qa-pipeline ↔ 3 fragments; `plugins.json` gitnexus 6+9 and playwright 1+1 ↔ files; `provider-map.json` 19 commands / 39 skills / 15 agents ↔ disk, 0 missing, 0 unregistered.
- **CI** rebuilds before vitest; the bats job correctly does not (it targets the source layer).
- **`qa-preflight.sh` `set -u` is safe on every path** — `PHASE="${1:-}"`, `phase_b "${2:-}" "${3:-}"`, `BASEURL` pre-initialised, `LOCAL` assigned in every `case` branch, `SKILL` defaulted. The `local X=$(cmd)` exit-status-masking anti-pattern was **avoided**: locals are declared bare so `if BASEURL=$(node …)` still reads the real status.

## Quality / Style

| # | file:line | Principle | Correction | Sev |
|---|---|---|---|---|
| **H4** | `agents/ux-agent.md:107,124` | Write-scope contradiction in the only agent that writes. `:13` says "fix mode writes `design.md` only … Never application code"; `:124` (free-form) says "**Write specs or modify files as needed**", unbounded. `:107` still reads "outside the **critique** dispatch" — stale now that three modes exist. Combined with M8 (mode never named at dispatch), an agent can rationalize into the free-form branch and write anything | Rewrite `:107` as "outside any dispatch"; bound `:124` to proposing, not writing; add ⛔ "if you arrived via a command dispatch you are in one of the three modes above". Better: delete the free-form block entirely — it is the least-used section and drops the file from 133 to ~106 lines | high |
| M1 | `0060-PLAN…:58`; `0060-…evidence-v01.md:11` | Amendment A1 not propagated. `:58` is a **test specification** ordering that the built fragment "contains the legacy fallback sentence" — contradicting both A1 (10 lines above) and the test actually shipped at `qa-reachability.smoke.test.js:371`. Evidence `:11` still lists "legacy fallback" in the depth-floor bullet | Rewrite both to the A1 wording | medium |
| M5 | `commands/add.qa.md:218-219` | **Pointer + restatement** — the worst outcome of a de-dup pass. `:210` orders the coordinator to READ `coordinator.md` "which carries … the Fix Routing rules"; eight lines later `:218` restates all four capability rules verbatim and `:219` restates the table columns, layer order and unordered-routes rule | Delete `:218-219`; keep the citation-gate bullet (it adds behaviour) and one line: "Write `## Fix Routing` per the coordinator reference's template" | medium |
| M6 | `skills/add-qa/SKILL.md:211` | Same class, worse: the split's purpose is that judges never see routing rules, yet the judge-loaded checklist still spells out "routes pass capability validation (@e2e-agent→test-file, @ux-agent→design-spec, @qa-agent never); `## Fix Routing` table present with the fixed layer ordering" | Reduce to "[ ] Every finding carries a coordinator-derived `route` valid per `references/coordinator.md`" | medium |
| M7 | `cli/tests/qa-reachability.smoke.test.js:343` | Test passes for the wrong reason. `not.toContain('Capability validation')` is case-**sensitive** while its sibling `:342` is case-insensitive; `SKILL.md:73` and `:211` both use lowercase, so the guard is green while the duplication it exists to prevent survives (M6) | `not.toMatch(/capability validation/i)` — which will correctly fail until M6 is fixed | medium |
| M8 | `fragments/qa-pipeline/add.build.md:15-27` | Mode is not signalled at the one dispatch where guessing wrong is destructive. `/add.plan` and `/add.design` say "state **CRITIQUE MODE — read-only**"; `add.qa.md:148` says "review mode". The qa-fix fragment — the only dispatch that unlocks writes — never names the mode; the agent must infer it from the target class | Add "dispatch it in **FIX MODE**, naming the mode verbatim in the prompt" | medium |
| M9 | `add-qa/references/coordinator.md` vs `add-ux-design/{design-contract,critique-rubric}.md` | One commit shipped **both** subdoc conventions. `add-framework-development:184-192` names the house Tier-3 pattern as flat siblings, with `add-ux-design` as the worked example; `add-skill-creator:91,103` says `references/`. Repo is split 6/6. `add-qa` (180 lines, Tier 2) is now the only skill with a `references/` dir holding one file | Pick one and state it in `add-framework-development` §Tiers. Flat wins on the authoring rubric's own example → `add-qa/coordinator.md`. Do not ship both | medium |
| M10 | `add.plan.md:278` vs `add.design.md:153` | The de-dup whose goal was "both cite the schema so they cannot drift apart" introduced fresh drift in the same commit: `add.design:153` enumerates "…and the provenance-truthfulness rule" and appends "Keep the prose extractive…"; `add.plan:278` omits both | Make the two sentences byte-identical; move "extractive prose" into the schema's Consolidation contract | medium |
| M11 | `add.plan.md:281`, `add.design.md:156` | ⛔ blocks addressed to the *maintainer* sitting in a runtime prompt: "⛔ DO NOT restate the frontmatter or section shape here … both cite the schema so they cannot drift apart". Genuinely ambiguous — an agent can read "do not restate the frontmatter" as "do not write the frontmatter into design.md" | Convert to HTML comments (stripped at build); keep only the runtime-relevant `${ABOUT_SHA}` truthfulness sentence | medium |
| M12 | commit `7f7b798` message | Names no blocker; headlines a medium (see Diff Completeness) | Amend the message — branch is unpushed, no PR | medium |
| L4 | `add-ecosystem/SKILL.md:141-143` vs `:84-86` | v01 Q12 asked to keep numeric coordinates **only** in `add-ecosystem`. The wave did the inverse, and half-did it: `:141`/`:143` dropped coordinates, `:142` kept "add.plan (STEP 8.1.2), add.design (STEP 4)", and `:84-85` still carry `(8.1.1)`/`(8.1.2)`. Three sibling rows, two conventions | Restore on all rows per Q12, or strip from all six — consistently | low |
| L5 | smoke test `:348` | Brittle negative pinning table *formatting*: `not.toContain('| Failure forensics | `@qa-agent` |')` matches one exact cell rendering. Re-adding the table with any other spacing passes | Assert a regex on any row whose first cell is a known axis name | low |
| L6 | smoke test `:248` | `not.toMatch(/^ONE bounded adversarial pass/m)` is the sole guard that the rubric wasn't re-inlined; any reworded re-inlining passes silently | Assert a structural invariant instead | low |
| L7 | smoke test `:425` | `toMatch(/SF-level first, feature-level fallback/)` test-locks the exact prose Q18 asked to single-source — and every call site *also* restates the parenthetical, so the duplication survives, now pinned in four commands | Assert citation presence (`references/new-feature\.md`); drop the parenthetical from the 9 call sites | low |
| L8 | `agents/ux-agent.md:11` | Forward-reference across mode boundaries: the file-level memory note ends "would break the **Grounding Rule below**", but that rule (`:69`) is scoped inside Review Mode | Cite it as "the Grounding Rule in Review Mode" | low |
| L9 | `add-ux-design/critique-rubric.md:1,3` | H1 immediately followed by an H2 with the same title, and no orientation line. `design-contract.md:1-3` gets this right | Merge the titles; add the one-line "what this is / who loads it" blurb | low |
| L10 | `.claude/skills/add-framework-development/SKILL.md:66` | Same commit fixed the Command (21→19) and Agent (8→15) counts and `CLAUDE.md`, but left Skill at **34**. Actual: 39 | 34 → 39 | low |
| L11 | `agents/qa-agent.md:22` | Q12 residual — "The STEP 4.4 coverage reconciliation table". The identical line in `ux-agent.md` was de-coordinated in the same hunk | "the coordinator's coverage reconciliation table" | low |
| L12 | `add.review.md:13`, `add.autopilot.md:516` | `--yolo` was removed from the conventions doc (correct per S9) but is still live in two commands — now an undocumented convention | Document it where it is actually used, or note the removal was scoped to `add.plan` | low |
| L13 | `0057-PLAN…` tail; `ux-flow-agent.md:16`; `cli/package-lock.json:3,9` | `0057-PLAN` doesn't cite its new changelog (0058 does); `SAAS_CONTEXT`/`PATTERNS_TO_APPLY` appear in no agent's Inputs list after the prompt shrink; package-lock still `0.4.7` (pre-existing) | — | low |

### Done well

Worth recording, because it calibrates the verdict:

- **`qa-preflight.sh` (Q11/Q14/Q15/Q16)** — the best-executed item in the wave. `set -u` chosen deliberately with the reasoning committed as a comment, `-e` correctly rejected against the always-exit-0 contract, locals declared bare *precisely so* the `if BASEURL=$(…)` status check still works, the `172.16/12` boundary arithmetically correct with a comment explaining why `172.32` is excluded, and a negative bats case that makes the allowlist testable rather than assertable-by-construction. The runner test's new precondition is the right fix for a test that previously passed by accident of `mktemp -d` location — a test made able to fail for the right reason.
- **Q4 (`qa-agent` taxonomy)** — deleted cleanly, replaced with a citation, *keeping* the non-duplicated half and sharpening it ("an uncited class is invalid"). The paired assertion — negative on the agent, positive on the skill — is the correct test shape and should be the template for M7/L5/L6.
- **Q13 (`memory` rationale)** — real reasoning, not boilerplate, and the four notes cross-reference each other: `ux-flow-agent` explains why it is the exception, `ux-layout-agent` explains why it is not and names the exception.
- **Amendment A1** — strikethrough plus rationale, a dedicated `## Amendments` section with why / migration impact / artefacts-reconciled, risk row rewritten, changelog `### Breaking`. That is the right way to resolve a plan-vs-code contradiction, and the reconciliation list is what makes it auditable. (M1 is a two-site miss against an otherwise exemplary amendment.)
- **`HANDOFF` retired in place** rather than deleted, with a "do not follow its instructions" banner and a corrections list — the right call for a file other docs link to.

### Judgement calls

- **Prose vs verbatim dispatch prompts:** net acceptable. Prose is less deterministic than a fenced template, but every required input survived and output filenames resolve via the `**Output (temps):**` bullet directly above each prompt. The critique dispatch is the strongest of the three *because* it still names the mode verbatim — that is exactly the pattern M8 says the fix dispatch should copy.
- **Should `ux-agent` be split?** Not yet. At 133 lines it is the largest agent, but the three modes share the contract vocabulary and a split would duplicate it. The section that should go is the free-form block — the least used, and the cause of H4.
- **`disallowedTools` on `ux-agent`?** Frontmatter cannot express a per-mode denylist, so the prose `Write scope` line is the correct instrument and the Q2 answer is defensible. Worth one line in `add-framework-development`'s agent table so the next author doesn't read it as an oversight.
- **Token efficiency:** the de-dup did **not** shrink the product layer — `framwork/.codeadd` grew +5,810 bytes. Individual files shrank honestly; the extracted text returned as three new files plus pointers. The genuinely new content (Fix Mode, two GATES rows, the SF-fallback teaching) justifies part of it; M5/M6/M10/L7 do not. Routing rules now exist in **three** places where before they existed in two.

## Consolidated Action List

Status legend: `[x]` done · `[~]` deferred with a named owner · `[!]` deviation from the recommendation, rationale recorded · `[ ]` open.

**Blockers:** — **4/4 cleared**

- [x] `agents/ux-agent.md:87` — drop the "by the capability validation in skill `add-qa`" justification (H1).
  → Justification rewritten: the agent now states its exclusive write right as its own contract, notes the coordinator enforces the other half at route-derivation, and says explicitly that the reference stating it is coordinator-only and must not be loaded. No dangling pointer, and the mutual-exclusion rule is now self-consistent instead of self-defeating.
- [x] `skills/add-qa/SKILL.md:210` — "merged per the STEP 5 rules" → cite the reference (H2).
  → Both checklist rows rewritten to cite `{{skill:add-qa/references/coordinator.md}}` **and** marked "coordinator work — a judge neither loads that file nor runs this row", which fixes the deeper defect: the rows were unrunnable by the audience that loads the file.
- [x] `git add -f` the four untracked artefacts + this file; extend the `CLAUDE.md` policy (H3).
  → 5 files force-added (`git ls-files docs/` 19 → 24). Policy now states the exception covers the umbrella's **plans, evidence, reviews and changelogs**, with the reason: a plan whose changelog or review is untracked reads as unimplemented from a fresh clone.
- [x] `agents/ux-agent.md:107,124` — bound the free-form write scope (H4).
  → Kept, not deleted (see Deviations). Retitled "outside **ANY** dispatch"; a ⛔ now states that arriving via a dispatch means one of the three modes and "when in doubt, you are NOT in free-form"; step 4 bounded to the human-named path with explicit bans on application code, `about.md`, test files, `screens.json` and any `design.md` outside Fix Mode. `## Constraints` retitled "(all modes)" — its scope was ambiguous while nested under free-form.

**Medium:** — **11 cleared, 1 pending, 1 deferred**

- [x] `0060-PLAN…:58` and `0060-…evidence-v01.md:11` — propagate amendment A1 (M1).
  → Both rewritten to the A1 wording, each naming A1 as the reason and pointing at the assertion actually shipped.
- [x] `commands/add.qa.md:47` — READ-ONLY row vs `@qa-agent`'s denylist (M2).
  → Row now reads "Edit/Write on ANY file" forbidden; both judges return findings and write nothing; `@qa-agent`'s `disallowedTools` named as the enforcement; the coordinator alone writes under `run-NNN`. Resolves the self-contradiction with `:203`/`:221`.
- [x] `framwork/provider-map.json` — `qa-agent` description (M3). → rewritten to the deterministic+forensic role, explicitly stating it **declines** the judgement axes.
- [x] `commands/add.design.md:59` — "Skill provides" inventory (M4). → rubric and Design Contract notation named as separate loads; STEP 5's critique dispatch identified as what pulls the rubric.
- [x] `commands/add.qa.md:218-219` and `skills/add-qa/SKILL.md:211` — delete the restatements (M5, M6).
  → 5.5 reduced to the citation gate (behaviour, kept) + two pointer lines. Checklist row reduced to a coordinator-marked pointer.
- [x] `cli/tests/…:343` — make the guard fail on M6 (M7).
  → Rewritten to assert the **rule content** (`@e2e-agent→test-file`, `@ux-agent→design-spec`) rather than the phrase, plus a positive assertion that the pointer survives. Efficacy proven: reinstating the M6 text makes the suite fail, restoring it makes it pass. A blanket phrase ban was rejected — `SKILL.md:73` legitimately *names* the topic in its "lives elsewhere" inventory.
- [x] `fragments/qa-pipeline/add.build.md` — name **FIX MODE** verbatim (M8).
  → Added above the amendment-trail bullet, with the failure mode spelled out (the agent otherwise infers the mode from the target class and may land in a read-only mode that refuses).
- [!] Pick one subdoc convention and record it (M9). → **Chose `references/`, not flat.** See Deviations. Recorded in `add-framework-development` §Tiers with the majority list, flat marked legacy, and the "never mix inside one skill" rule. **Zero file moves.**
- [x] Make `add.plan.md:278` and `add.design.md:153` consistent; move "extractive prose" into the schema (M10).
  → Both sentences now carry the identical clause list including the provenance-truthfulness rule; the extractive-prose rule moved into the schema's Consolidation contract so it applies to both callers.
- [x] Convert the maintainer-addressed ⛔ to HTML comments (M11).
  → Both are now `<!-- MAINTAINER: … -->` (stripped at build). The runtime-relevant `${ABOUT_SHA}` truthfulness sentence was kept as a real ⛔ in both files.
- [ ] Amend `7f7b798`'s message to lead with the four blockers (M12). → **PENDING — needs your go-ahead.** It is a history rewrite and I do not commit or amend without an explicit request. The branch is unpushed, so it is still safe to do.
- [~] `web/src/pages/docs.astro` — S4/S5/S6. → **DEFERRED, owner `/add-framework--sync`.** H3 has landed, so the deferral is now durably declared in a tracked file.

**Low:** — **11/13 cleared**

- [x] **L1** verbatim heading citation → `qa-agent.md` now cites the full heading including the `(`@qa-agent`) — functional findings` qualifier.
- [x] **L2** nested bold at `add.review.md:244` → emphasis un-nested; the tail renders bold in every provider output.
- [x] **L4** `add-ecosystem` coordinate consistency → coordinates restored on all three agent rows per v01's Q12 (they live **only** in the ecosystem map).
- [!] **L5, L6, L7** brittle test pins → L5 and L6 rewritten to structural assertions. **L7 partially deviated:** the test now asserts the citation instead of the prose, but the parenthetical was **kept** at the call sites. See Deviations.
- [x] **L9** `critique-rubric.md` double title → merged, with a "who loads it / who deliberately does not" orientation line.
- [x] **L10** skills count 34 → 39.
- [x] **L11** `qa-agent.md:22` STEP 4.4 → "the coordinator's coverage reconciliation table".
- [x] **L12** `--yolo` documentation → recorded in `add-framework-development` §Conventions as a **scoped** flag (`add.review` + `add.autopilot` only), with plan 0057's reason for removing it from `add.plan` and a "grep before assuming" instruction.
- [x] **L13a** `0057-PLAN` now cites its changelog; **L13b** `SAAS_CONTEXT`/`PATTERNS_TO_APPLY` added to `ux-flow-agent`'s Inputs, noting `/add.design` passes them and `/add.plan` deliberately does not.
- [ ] **L3** `add.build.md` `---` ordinal-10 anchor → **left untouched by design.** Latent, not introduced, resolves correctly in all five providers, and plan 0060 forbids disturbing that anchor pair. Re-anchoring it is its own change with its own test.
- [ ] **L13c** `cli/package-lock.json` `0.4.7` vs `0.7.0` → pre-existing; owner `/add-framework--release`.

## Resolution

> **CLEARED 2026-07-27** — applied to the working tree, uncommitted at time of writing.

| Severity | Found | Cleared | Deviation | Deferred | Open |
|---|---|---|---|---|---|
| high | 4 | 4 | 0 | 0 | 0 |
| medium | 12 | 11 | 1 (M9) | 1 (docs.astro) | 1 (M12, pending go-ahead) |
| low | 13 | 11 | 1 (L7 partial) | 0 | 2 (L3 by design, package-lock pre-existing) |

**The v02 highs were one defect class, correctly identified.** H1 and H2 are the same failure: the v01 de-dup pass extracted content and left consumers citing the old address. H1 was worse than a dangling pointer — the agent cited a file the *same commit* forbade it to open. Both are now citations to reachable authorities, and the checklist rows additionally say which audience runs them, which is the fix the review implied but did not ask for.

### Deviations from the recommendation

Two, both deliberate:

| # | Recommended | Applied | Why |
|---|---|---|---|
| **M9** | Flat (`add-qa/coordinator.md`) — "flat wins on the authoring rubric's own example" | **`references/`** — codified, zero file moves | The evidence points the other way. `references/` is 7 skills (`add-doc-schemas`, `add-investigation`, `add-skill-creator`, both architecture skills, `add-subagent-driven-development`, `add-qa`) against flat's 5. More decisively, `add-skill-creator` — the skill whose job is teaching skill authoring — **prescribes `references/` twice** (anti-pattern table, pre-deploy checklist). `add-framework-development` cites `add-ux-design` because it is the largest Tier-3 skill, not because flat was chosen deliberately. Codifying flat would have moved a file *away* from the prescribed convention and *away* from the majority. Flat is now recorded as legacy, with a ban on mixing both inside one skill |
| **L7** | Assert the citation **and** drop the parenthetical from the 9 call sites | Assert the citation; **keep** the parenthetical | The test-lock was the real defect and it is fixed. But "(SF-level first, feature-level fallback)" is load-bearing at runtime: an agent told to "resolve per the Location rule in X" does not always load X, and the failure mode of not loading it is precisely the v01 blocker that shipped **twice** (S2 `add.review`, S3 `add.autopilot` — the Design Contract silently skipped on epics). A six-word redundant hint at the point of use is cheap defence-in-depth against a defect with a demonstrated recurrence rate. The wording is byte-identical at all sites and the authority is single-sourced |

### Verification

```
node scripts/build.js   →  650 files, 35 injection points, clean
npx vitest run          →  479 passed (479)
npx bats framwork/.codeadd/scripts/tests/*.bats  →  180 passed
```

Injection points held at 35 across the change — no anchor was disturbed, including the `feature:qa-pipeline:qa-fix` pair plan 0060 protects.

**The M7 guard was proven able to fail**, not merely observed green: reinstating the exact M6 duplication makes `qa-reachability.smoke.test.js` fail, and restoring the fix makes it pass. That is the standard the review itself set when it praised the `qa-preflight.sh` bats work, and it is what separates these guards from the three brittle pins they replace.

### Still open

| # | Item | Owner | Note |
|---|---|---|---|
| M12 | Amend `7f7b798`'s commit message to lead with the blockers | **user** | A history rewrite; not done unassisted. Branch is unpushed, so still safe |
| S4–S6 | `web/src/pages/docs.astro` | `/add-framework--sync` | Must run before the next release — shipped code and public docs currently contradict each other by test |
| L3 | `add.build.md` `---` ordinal-10 anchor | — | Left by design: latent, pre-existing, and plan 0060 forbids disturbing it |
| L13c | `cli/package-lock.json` `0.4.7` | `/add-framework--release` | Pre-existing |

## Re-review

Not required for the fixes themselves — every high and medium is either pinned by a test proven able to fail, or is a documentation edit whose correctness is visible in the diff.

Run `/add-framework--shared-review` again only when the deferred `docs.astro` sync lands, or before cutting the release that ships this branch. It would produce `HANDOFF-qa-ux-umbrella--review-v03.md`.

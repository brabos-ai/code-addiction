# Evidence: T4 — Epic loop and cross-SF judge

> **Plan:** `docs/plans/0074-PLAN--autonomous-epic-convergence-004-epic-loop.md`
> **Umbrella:** `docs/plans/0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Status:** complete
> **Closed:** 2026-08-29 — after the adversarial round and its fixes
> **Started:** 2026-08-27

---

## L0.1 — Injection-point baseline (recorded before any edit)

Captured with `node scripts/build.js` on a clean tree at branch point `feat/0074-autonomous-epic-convergence`.

**Total injection points: 39**

| Resource | Points | Namespaces |
|---|---|---|
| `architecture-agent` (agent) | 1 | plugin:gitnexus:graph |
| `backend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `database-agent` (agent) | 1 | plugin:gitnexus:graph |
| `discovery-agent` (agent) | 1 | plugin:gitnexus:graph |
| `frontend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `qa-agent` (agent) | 1 | plugin:playwright:drive |
| `reviewer-agent` (agent) | 1 | plugin:gitnexus:graph |
| `system-design-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-flow-agent` (agent) | 1 | plugin:gitnexus:graph |
| `add.build` (command) | 10 | feature:qa-pipeline:e2e-dispatch · feature:qa-pipeline:qa-fix · feature:tdd-pipeline:awareness · feature:tdd-pipeline:coverage · feature:tdd-pipeline:detect-framework · feature:tdd-pipeline:gate · feature:tdd-pipeline:tasks-flow · feature:tdd-pipeline:test-dispatch · feature:tdd-pipeline:verification · feature:tdd-pipeline:verify-red |
| `add.diagnose` (command) | 1 | plugin:gitnexus:graph-trace |
| `add.done` (command) | 1 | plugin:gitnexus:graph-reindex |
| `add.hotfix` (command) | 2 | feature:tdd-pipeline:red-gate · plugin:gitnexus:graph-impact |
| `add.new` (command) | 1 | plugin:gitnexus:graph-map |
| `add.plan` (command) | 5 | feature:qa-pipeline:qa-spec · feature:qa-pipeline:step-list · feature:tdd-pipeline:step-list · feature:tdd-pipeline:step9 · plugin:gitnexus:graph-plan |
| `add.review` (command) | 3 | feature:tdd-pipeline:spec-audit · feature:tdd-pipeline:step-list · plugin:playwright:drive |
| `add.wiki` (command) | 6 | plugin:gitnexus:graph-classify · plugin:gitnexus:graph-contract · plugin:gitnexus:graph-database · plugin:gitnexus:graph-dispatch-common · plugin:gitnexus:graph-quality · plugin:gitnexus:graph-specialist |

Baseline copy: `C:/tmp/0074-injection-baseline.json`
Checker: `C:/tmp/check-anchors.py` — compares namespace/name/section/resource AND anchor text, so a moved anchor is caught even when the total stays 39.

---

## F-block log

### F23-F31 — the outer loop

All in `framwork/.codeadd/commands/add.plan-to-ready.md`, 265 insertions / 11 deletions. **This file carries zero injection markers**, so the largest edit of the whole set carried no anchor risk — which is why T4 was sequenced last.

New content lives in a new non-STEP H2, `## Epic Mode: The Outer Loop`, between STEP 2 and STEP 3. **STEP 1-9 are unchanged in number and title**; the file already uses non-STEP H2s (Agent Dispatch Rules, Agent Rosters, Rules), so this is consistent with its shape.

Every new mechanic is gated to *"no `SFxx` given, `HAS_EPIC=true`"* and says so. **The single-subfeature path is untouched** — F23's hard constraint.

- **F24** done-ness reads `epic.md`'s `status` column, and the file states why that column is now trustworthy: the loop dispatches the build roster directly and never runs `/add.build`, so block 14.3's row-flip never fires here, and `/add.done` is not called either. **F27 is what writes it.** Without F27 every re-invocation would restart at SF01.
- **F25** STEP 9 fires **once**, at epic end; per-subfeature exits are read back internally and never printed as their own report.
- **F26** 3 iterations per subfeature, reset at each boundary; global backstop `3 x N_SF` **iterations, never legs** — the file explains that a leg is finer-grained than an iteration, so a leg-denominated backstop would trip inside the first subfeature. Per-subfeature halt is evaluated **first**; the backstop reports only when nothing else stopped the run.
- **F28** Decision Log compacted to one line per finished (or halted) subfeature.
- **F29** resume at the last checkpoint commit; the in-flight subfeature restarts with its counter reset **while STEP 3's and STEP 4's idempotency guards still apply**.
- **F30** `iterations.jsonl` logged at every leg boundary with `sf`. The boundary field was named `"leg":"decision"` rather than `"leg":"loop"` to avoid colliding with the existing `type` argument, which is already the literal `"loop"`.
- **F31** `@consistency-agent` dispatched FULL after each subfeature's plan, DELTA at epic end. Routing splits by mode: plan-time findings go to that subfeature's `plan.md` through the plan-reviewer shape; only the delta pass writes into `## Fix Routing`.

### The invariant that had to change

`ABSOLUTE INVARIANTS` L72 now reads:

> **CAP IS 3 PER SUBFEATURE, RESET AT EACH SUBFEATURE BOUNDARY.** Supersedes the old "3 per invocation" wording now that one invocation can cover a whole epic. A `3 x N_SF` global backstop and re-invocation's fresh budget remain the outer circuit breakers beyond that.

Grep for `per invocation` across the file returns three hits, all qualified: L72 and L189-190 explain the supersession itself, L578 scopes it explicitly to the non-epic case in the same sentence that contrasts the epic one. **No stale framing survives.**

### F27 — the checkpoint, and the staging trap two reviewers caught

Order is fixed: **flip the `epic.md` row -> stage -> commit -> tag -> push.**

The staging block spells out three re-include paths and says why, because `add-commit`'s rule re-includes exactly one:

```bash
git add -A -- . ':(exclude)docs/features/*'
git add -A -- "${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*" "${FEATURE_DIR}/epic.md" "${FEATURE_DIR}/review-NNN.md" "${FEATURE_DIR}/_tests/run-NNN/"
```

Re-including only the subfeature directory would leave `epic.md` out — it is a **sibling** of `subfeatures/`, not inside it — so the row flip would never reach the commit. Re-including the whole `${FEATURE_DIR}` would sweep in a later subfeature's half-written files.

Tag re-created **on the commit just made** — the first point it is true, since T2's F13 removed it from `/add.build`. Push carries the tag explicitly (`--follow-tags`), because a local-only tag is invisible to a fresh-clone resume.

Trailer is `converge-gates.sh`'s stdout verbatim. No second format invented.

### F32-F36 — agent, skill, registries

- **F32/F33** `consistency-agent.md` + `add-cross-sf-consistency/SKILL.md`. Exactly five dimensions, out-of-rubric findings forced to informational and banned from `## Fix Routing`. **No plugin marker, deliberately** — recorded in the agent file as an HTML comment so a maintainer does not read the omission as an oversight. Verified the comment cannot register as an injection point: `OPEN_MARKER_RE` is `^\s*(feature|plugin):...$`, anchored both ends, and the comment begins `No plugin:gitnexus:graph marker...`.
- **F34** registered in `provider-map.json`. First attempt rewrote the file via `json.dumps` and produced **190 changed lines for two entries** — it normalised encoding and formatting throughout. Reverted and done as a surgical text insert: **2 lines**.
- **F35** `add-commit/SKILL.md` gained the Checkpoint Trailer section: gate lines are **copied, not authored**; no trailer on a non-converged commit; and a note that a commit message is not a state file, so `NO NEW STATE` holds.
- **F36** `add-ecosystem/SKILL.md` — the agent row, the skill row, and `add.plan-to-ready`'s command row rewritten for the epic scope.

## Validation levels

| Level | Result | Evidence |
|---|---|---|
| **L5.5** build + injection parity | **PASS** | 42 skills, 22 agents, `Injection points : 39`; checker 39/39 intact by anchor text |
| **L5.6** F34 registration | **PASS** | `consistency-agent` builds to `.claude/agents/*.md` and `.codex/agents/*.toml` |
| **L5.7** F36 ecosystem registry | **PASS** | grep: agent row, skill row, command row all present |
| **L2b.1** no stale per-invocation wording | **PASS** | 3 hits, each qualified for the epic case |
| Regression: converge-gates suite | **PASS** | 38/38 after every T4 edit |
| **L1, L2, L3, L4, L6** | **NOT RUN** | see Gaps — every one needs a live epic |

## Gaps — what is NOT proven

This is the topic with the widest gap between what is written and what is executed. Stated plainly:

- **No epic was run.** L1 (scoping/order/skip), L2 (one commit per converged subfeature, no commit otherwise, truthful trailer, `git log --grep` reconstruction, backstop firing, halt), L3 (all seven cross-SF judge levels), L4 (interruption, cold restart, per-leg logging, Decision Log compaction) and L6 (three-subfeature acceptance) **all require a real project with a real epic, real QA evidence and a real branch.** None was available here.
- **`@consistency-agent` has never judged anything.** It is authored, registered and builds to every provider. Whether its five dimensions produce useful findings on real subfeature plans is unknown.
- **F27's checkpoint has never been executed.** The staging paths, the gated commit, the tag-on-the-real-commit and the `--follow-tags` push are written and reasoned; no commit has been produced by this path.
- **The `epic.md` row flip has never run**, so L2.4b/4c/4d (row inside the commit, `status.sh` truthful mid-epic, tag resolving to real work) are unverified.

What IS verified is the layer beneath: `converge-gates.sh` (38/38), the build, and the injection sidecar. The command layer above it is inspected, not executed.

_Appended as each F-block lands._

## Validation levels

_Appended as each level is run._

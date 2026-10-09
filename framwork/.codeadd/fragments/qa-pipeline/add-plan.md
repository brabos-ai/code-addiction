<!-- uses:
- skill: add--qa-spec
- script: status.cjs
-->

<!-- section:step-list -->
STEP qa-pipeline.qa-spec: Generate the QA specification
<!-- /section:step-list -->

<!-- section:qa-spec -->

### STEP qa-pipeline.qa-spec QA-Spec Subagent (qa-pipeline — runs BEFORE assembly)

**Setup check — warn once, never a stop.** `add-plan` parses none of the QA setup keys, so extract `SETUP_QA`, `SETUP_QA_STALE` and `SETUP_QA_HINT` yourself from the `status.cjs` output STEP add-plan.recent already ran (`SETUP_QA` is `present`, `stale` or `absent`). When `SETUP_QA` is `absent` or `stale`, or `SETUP_QA_STALE:yes`, print ONE warning — the `SETUP_QA_HINT` text plus "run `{{cmd:add-qa-setup}}` before `{{cmd:add-review}}`" — and continue. This is a warning, not a stop, and it runs whether or not the spec below does.

**When to run:** qa-pipeline is enabled AND the resolved `design.md` (the `feature-design` Location rule below) exists and declares at least one screen. Independent of tdd/STEP tdd-pipeline.test-spec — runs whether tdd is on or off.
**Otherwise skip:** state "no screen declared — QA spec skipped", write neither `plan-qa-spec.md` nor `_tests/screens.json`, and go on. No dispatch, no empty table.

**MANDATORY:** Load skill BEFORE dispatch: {{skill:add--qa-spec/SKILL.md}}

**Dispatch prompt:**
You are the QA/E2E SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.
Load {{skill:add--qa-spec/SKILL.md}} and follow ALL rules.
Read: about.md (RF/RN + acceptance criteria), the consolidated design.md STEP add-plan.ux-design wrote
      (UX contract — resolved per the `feature-design` Location rule in the doc schemas:
      SF-level first, feature-level fallback),
      plan-database.md/plan-backend.md/plan-frontend.md (if exist),
      FEATURE_DIR/_tests/screens.json (if exists), and docs/qa/config.json (viewport defaults).
Produce a code-free QA/E2E spec — ONE row per screen design.md declares: reachability
      intent, UX acceptance, functional scenarios (apply the CRUD heuristic on data-entity
      surfaces: create/read/update/delete/list), target viewports, capture states, a11y expectations.
Write to: docs/features/${FEATURE_ID}/plan-qa-spec.md — write the `## QA/E2E Specification`
      heading yourself, then the EXACT 9-column table from the skill. Keep under ~15 lines.
ALSO write the screen catalog `FEATURE_DIR/_tests/screens.json`, applying the skill's
      `## Read-merge-write (MANDATORY)` section exactly — the file is feature-wide while this
      plan run is scoped to one SF, so it is NEVER rewritten from scratch. Entry shape and
      the merge order both live in the skill; do not re-derive either here.
      Store reachability INTENT only — selectors are finalized post-implementation by @e2e-agent.
Flag missing UX acceptance / thin design / uncovered CRUD operations as gaps — never invent.

<!-- /section:qa-spec -->

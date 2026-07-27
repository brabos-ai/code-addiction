<!-- section:step-list -->
STEP 10.0: QA-Spec subagent       -> BEFORE assembly, generates plan-qa-spec.md — one row per screen 8.1's design.md declares, with capture states — and merges _tests/screens.json (qa-pipeline)
<!-- /section:step-list -->

<!-- section:qa-spec -->

### 10.0 QA-Spec Subagent (qa-pipeline — runs BEFORE assembly)

**When to run:** ALWAYS when qa-pipeline is enabled. Independent of tdd/STEP 9 — runs whether tdd is on or off.

**MANDATORY:** Load skill BEFORE dispatch: {{skill:add-qa-spec/SKILL.md}}

**Dispatch prompt:**
You are the QA/E2E SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.
Load {{skill:add-qa-spec/SKILL.md}} and follow ALL rules.
Read: about.md (RF/RN + acceptance criteria), the consolidated design.md STEP 8.1 wrote
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

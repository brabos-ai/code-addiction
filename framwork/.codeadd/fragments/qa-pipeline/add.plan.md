<!-- section:step-list -->
STEP 10.0: QA-Spec subagent       -> BEFORE assembly, generates plan-qa-spec.md — one row per declared screen, with capture states (qa-pipeline)
<!-- /section:step-list -->

<!-- section:qa-spec -->

### 10.0 QA-Spec Subagent (qa-pipeline — runs BEFORE assembly)

**When to run:** ALWAYS when qa-pipeline is enabled. Independent of tdd/STEP 9 — runs whether tdd is on or off.

**MANDATORY:** Load skill BEFORE dispatch: {{skill:add-qa-spec/SKILL.md}}

**Dispatch prompt:**
You are the QA/E2E SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.
Load {{skill:add-qa-spec/SKILL.md}} and follow ALL rules.
Read: about.md (RF/RN + acceptance criteria), design.md (UX contract),
      plan-database.md/plan-backend.md/plan-frontend.md (if exist),
      FEATURE_DIR/_tests/screens.json (if exists), and docs/qa/config.json (viewport defaults).
Produce a code-free QA/E2E spec — ONE row per screen design.md declares: reachability
      intent, UX acceptance, functional scenarios (apply the CRUD heuristic on data-entity
      surfaces: create/read/update/delete/list), target viewports, capture states, a11y expectations.
Write to: docs/features/${FEATURE_ID}/plan-qa-spec.md — write the `## QA/E2E Specification`
      heading yourself, then the EXACT 9-column table from the skill. Keep under ~15 lines.
Flag missing UX acceptance / thin design / uncovered CRUD operations as gaps — never invent.

<!-- /section:qa-spec -->

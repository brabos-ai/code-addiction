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
      (UX contract — SF-level `${SF_DIR}/design.md` when it exists, feature-level
      `${FEATURE_DIR}/design.md` as the legacy fallback),
      plan-database.md/plan-backend.md/plan-frontend.md (if exist),
      FEATURE_DIR/_tests/screens.json (if exists), and docs/qa/config.json (viewport defaults).
Produce a code-free QA/E2E spec — ONE row per screen design.md declares: reachability
      intent, UX acceptance, functional scenarios (apply the CRUD heuristic on data-entity
      surfaces: create/read/update/delete/list), target viewports, capture states, a11y expectations.
Write to: docs/features/${FEATURE_ID}/plan-qa-spec.md — write the `## QA/E2E Specification`
      heading yourself, then the EXACT 9-column table from the skill. Keep under ~15 lines.
ALSO write the screen catalog `FEATURE_DIR/_tests/screens.json` with READ-MERGE-WRITE
      semantics keyed by `sf` + `id` — the file is feature-wide while this plan run is
      scoped to one SF, so it is NEVER rewritten from scratch:
      1. Read the existing file (absent → start from `{"feature":"<feature-id>","screens":[]}`).
      2. Entries whose `sf` is OUT of this run's scope are preserved BYTE-IDENTICALLY —
         never reorder, reformat, or "clean up" them.
      3. An in-scope entry (same `sf` AND same `id`) is REPLACED by the newly derived one.
      4. A newly derived in-scope entry with no match is APPENDED.
      Entry shape (as scaffolded by add.qa-setup): `id`, `sf`, `name`,
      `kind` (route|modal|overlay|portal), `path` for routes OR an ordered `open` recipe for
      non-route surfaces, `auth`, `design`, `expect`. Each entry's `design` field points at the
      design.md path actually used for that screen (SF-level when it exists, feature-level fallback).
      Store reachability INTENT only — selectors are finalized post-implementation by @e2e-agent.
Flag missing UX acceptance / thin design / uncovered CRUD operations as gaps — never invent.

<!-- /section:qa-spec -->

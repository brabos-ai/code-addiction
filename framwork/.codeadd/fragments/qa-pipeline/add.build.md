<!-- section:qa-fix -->

#### QA-Routed Correction (qa-pipeline)

Findings from the QA judgement reach this command the same way every other
finding does: as rows in the `## Fix Routing` table on the highest-numbered
`review-NNN.md`. There is no separate QA entry point and no `qa` argument — one
correction contract, one path.

1. Read `## Fix Routing` from the highest `docs/features/${FEATURE_ID}/review-NNN.md`.
   Rows carried up from a per-scope `qa-validation-NNN.md` keep their `Scope`,
   route and citation state. Do NOT read `_tests/final/` — final snapshots are
   immutable delivery history, never a live fix queue.
2. Present unresolved rows grouped by severity (blocker → polish) and CONFIRM
   before changing any code. The confirmation gate is mandatory; routing decides
   *who* fixes, never *whether*.
3. **DISPATCH by ROUTE, not by severity.** Work the table in its given `Order`,
   respecting `Blocked by`: sequential across layers
   (`@database-agent → @backend-agent → @frontend-agent → @e2e-agent`), parallel
   within one agent's slice when its rows are independent. Each named agent maps
   per the **Agent Roster**; correction rows go to `@fix-agent` per the
   **Correction Dispatch** contract, with the `ATTEMPT` counter this command tracks.
   - **Present, do NOT dispatch** (surface as user decisions): manual routes
     `data-seed` / `env-boot` (name the `docs/qa/config.json` field to fix —
     `authSeed` / `bootHint`), capability-invalid routes, and `@ux-agent` routes
     missing their contract-line citation.
   - **Name the mode verbatim.** `@ux-agent` has three modes and only one may
     write; dispatch it stating **"FIX MODE — design-spec route"** in the prompt.
     Without the mode named, the agent must infer it from the target class and may
     land in a read-only mode that refuses the fix outright.
   - **Amendment trail:** a dispatched `@ux-agent` `design-spec` fix MUST append
     its amendment to `design.md`'s `## Design Review` with the originating
     `run-NNN` + finding ID — so the next review sees why the contract changed and
     never reads a green-under-amended-contract flip as a fix.
   - **No `## Fix Routing` section → STOP with the remedy.** The report predates
     routing. Do NOT guess a dispatch and do NOT fall back to severity grouping —
     tell the user to re-run `{{cmd:add.review}}`, which writes a fresh
     `review-NNN.md` carrying routes.
4. Apply fixes with CORRECTION MODE discipline: follow project patterns, frontend
   loads `add-ux-design`, the build must compile 100%. Surface all severities; the
   user chooses the fix scope.

Then re-run `{{cmd:add.review}}` so the two rounds can be compared side by side.
The QA-specific nuance above sits on top of the base **Routed Correction Contract**
in STEP 12 — the resolution annex and the finalized marker are written there,
whether or not this section was injected.

<!-- /section:qa-fix -->

<!-- section:e2e-dispatch -->

### E2E Spec Authoring (qa-pipeline) — dispatch @e2e-agent per in-scope surface

DISPATCH AGENT: @e2e-agent [read-write on test files, standard] — one per surface in plan.md ## QA/E2E Specification (every declared surface — do not skip one), AFTER the area validators return — @e2e-agent needs existing components and stable selectors, and the WAIT-ALL it requires is already in place here.
Each receives: the surface/subfeature id, the plan ## QA/E2E Specification rows (incl. capture states), FEATURE_DIR/_tests/screens.json (each entry's design field points at the screen's design.md ## Design Contract), the just-built component file paths, docs/qa/config.json.
Directive: author ONE <surface>.qa.spec — layer i assertions + layer ii capture at each capture state (written as <screen>.<state>.<viewport>.png) + layer iii computed-style capture + axe a11y — finalize the screens.json reachability recipe (append an entry if the surface is absent), then green-confirm via the qa-project managed app lifecycle. Layer iii: for each ## Design Contract dimension verified by "computed style" (spacing scale, token allowlist, typographic scale, grid/container), capture the resolved values the contract names (gap/margin/padding, resolved custom-property names, font-size/font-weight, container width + column count) per screen × viewport into _tests/run-NNN/computed-styles/<screen>.<viewport>.json (minified, beside the screenshots). HARD requirement of the conformance rubric: a contract dimension whose capture is missing must be reported unverifiable — never passing. NEVER soften an assertion to make it pass; NEVER drop a capture state silently; NEVER drop a computed-style dimension silently.
If @e2e-agent is not available in this engine, dispatch a generic subagent with this same directive AND instruct it to load the qa-project skill (conventions + managed app lifecycle) first (soft-degrade — the inline prompt then carries the full self-sufficient task).
WAIT-ALL before STEP 12.

<!-- /section:e2e-dispatch -->

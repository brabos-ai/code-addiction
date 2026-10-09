<!-- uses:
- skill: add--delivery-mode
- agent: database-agent
- agent: backend-agent
- agent: frontend-agent
- agent: e2e-agent
- agent: fix-agent
- skill: add--ux-design
- agent: ux-agent
- command: /add-done
- script: build-ledger.cjs
- mention: qa-evidence.cjs
-->

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
   **Stop kind — confirming** (`add--delivery-mode`). On an automatic delivery,
   print the grouped rows in full and continue: every agent-routed row is fixed.
   The user ran the review that produced them, and asked for its routes to be applied.
3. **DISPATCH by ROUTE, not by severity.** Work the table in its given `Order`,
   respecting `Blocked by`: sequential across layers
   (`@database-agent → @backend-agent → @frontend-agent → @e2e-agent`), and
   **one agent in flight at a time** — STEP add-build.order owns that rule and this
   dispatch sits inside it. ⛔ DO NOT overlap two rows because they look
   independent: independence of two rows is not a licence to put two writers on
   one tree. Each named agent maps per the **Agent Roster**; correction rows go to
   `@fix-agent` per the **Correction Dispatch** contract, with the `ATTEMPT`
   counter this command tracks.
   - **Present, do NOT dispatch** (surface as user decisions — **deciding**, in every delivery mode): manual routes
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
   - **No `## Fix Routing` section → STOP with the remedy** (**deciding**, in every delivery mode). The report predates
     routing. Do NOT guess a dispatch and do NOT fall back to severity grouping —
     tell the user to re-run `{{cmd:add-review}}`, which writes a fresh
     `review-NNN.md` carrying routes.
4. Apply fixes with CORRECTION MODE discipline: follow project patterns, frontend
   loads `add--ux-design`, the build must compile 100%. Surface all severities; the
   user chooses the fix scope — on an automatic delivery the scope is every
   agent-routed row, and the manual ones wait for the user as step 3 says.

`## Final Review` then writes this run's verdict.
The QA-specific nuance above sits on top of the base **Routed Correction Contract**
in STEP add-build.correct — the resolution annex and the finalized marker are written there,
whether or not this section was injected.

<!-- /section:qa-fix -->

<!-- section:e2e-dispatch -->

### E2E Spec Authoring (qa-pipeline) — ONE @e2e-agent per delivery

**When:** after every area of the delivery is implemented and validated — the area validators and the build gate have returned — and before `## Final Review`. @e2e-agent needs existing components and stable selectors, and the WAIT-ALL it requires is already in place here.

- **Normal feature:** on this build.
- **Epic:** only on the build of the last subfeature — the one whose `epic.md` row is the last not `done`, the same point the DELTA pass runs — and it covers every subfeature's `## QA/E2E Specification` rows. On every earlier subfeature write "e2e deferred to the last subfeature" and dispatch nothing.
- **IF there are no `## QA/E2E Specification` rows in scope:** dispatch nothing, say so, and go on.
- **Resume:** IF the ledger already holds a line starting `e2e: complete` for this delivery, do NOT dispatch again. The line is the only record the dispatch happened.

DISPATCH AGENT: ONE `@e2e-agent` [read-write on test files, standard] — one dispatch for the whole delivery, never a dispatch for each surface or each subfeature.
It receives: every surface (with its subfeature id) from the `## QA/E2E Specification` rows in scope, including capture states; every `FEATURE_DIR/_tests/screens.json` in scope (each entry's design field points at the screen's design.md ## Design Contract); the just-built component file paths; docs/qa/config.json; and `CAPTURE_DIR` = `${FEATURE_DIR}/_build/e2e-scratch`.
Directive: for EACH surface author ONE <surface>.qa.spec — layer i assertions + layer ii capture at each capture state (written as <screen>.<state>.<viewport>.png) + layer iii computed-style capture + axe a11y — finalize the screens.json reachability recipe (append an entry if the surface is absent), then green-confirm via the qa-project managed app lifecycle. Layer iii: for each ## Design Contract dimension verified by "computed style" (spacing scale, token allowlist, typographic scale, grid/container), capture the resolved values the contract names (gap/margin/padding, resolved custom-property names, font-size/font-weight, container width + column count) per screen × viewport into CAPTURE_DIR/computed-styles/<screen>.<viewport>.json (minified, beside the screenshots). HARD requirement of the conformance rubric: a contract dimension whose capture is missing must be reported unverifiable — never passing. NEVER soften an assertion to make it pass; NEVER drop a capture state silently; NEVER drop a computed-style dimension silently. Write every capture under CAPTURE_DIR and nowhere else. Report pass/fail per surface.
If @e2e-agent is not available in this engine, dispatch a generic subagent with this same directive AND instruct it to load the qa-project skill (conventions + managed app lifecycle) first (soft-degrade — the inline prompt then carries the full self-sufficient task).
WAIT for the report.

**No evidence is left behind.** This build never calls `qa-evidence.cjs next` and leaves no `_tests/run-NNN/`: run numbers are allocated by `{{cmd:add-review}}`, and a working run with no report is exactly what blocks a later close-out. Delete `CAPTURE_DIR` once the report is in. The build only proves the specs pass; UX and conformance are judged in `{{cmd:add-review}}`.

**Failures are a normal fix wave.** The agent fixes spec defects itself, so an assertion still failing is a gap in the delivery. Each one becomes a row `E2E-n` (surface, spec path, assertion, failure message) of a wave in STEP add-build.correct. Build the wave's `ROUTED_ROWS` yourself from the report — this wave reads no `review-NNN.md` and writes no Resolution Annex — and dispatch ONE `@fix-agent` per the Correction Dispatch contract, `MAX_ATTEMPTS = 3`. The round is build-only: its gate is build green, tests green and you re-running the specs green through the qa-project managed lifecycle. Dispatch no reviewer for it and no second `@e2e-agent`; the Final Review reads the fix diff. At the cap with rows still failing, rule each one (surface and assertion, a real gap `{{cmd:add-review}}` will see) and continue.

**Boot failed** (the agent authored the specs and deferred the first run): there is nothing to re-run. Record it in the ledger line and go on.

Then append the ledger line, once, through `build-ledger.cjs`: `e2e: complete (N surfaces, P passing)` — `P` is the count after any fix round.

<!-- /section:e2e-dispatch -->

<!-- section:next-command -->

- **QA is still owed** (qa-pipeline) — the QA judgement lives only in `{{cmd:add-review}}`. This build proves the specs pass and the Final Review reads the code; neither judges the screens. Name `{{cmd:add-review}}` for this feature or subfeature as the next step, ahead of `/add-done`. On `automatic` the build still never runs it for you.

<!-- /section:next-command -->

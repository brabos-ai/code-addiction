<!-- section:qa-fix -->

#### QA-Fix Flow (qa-pipeline) — explicit trigger only

Activate ONLY when invoked as `/add.build qa` (or an explicit `--qa` signal / report path).
This flow is OUTSIDE the §4.2 mode ladder — it never competes with bug→CORRECTION,
HAS_TASKS→TASKS, `feature N`→FEATURE, or pending→DEVELOPMENT, and a stale run must
never trigger it implicitly.

1. Detect the highest run-NNN under the in-scope feature/subfeature _tests/ and read
   its qa-validation-NNN.md.
2. Present unresolved findings grouped by SEVERITY (blocker → polish) — presentation
   stays severity-first — and CONFIRM before changing any code. The confirmation gate
   is mandatory; routing decides *who* fixes, never *whether*.
3. DISPATCH by ROUTE, not by severity. Read the report's `## Fix Routing` table and
   dispatch each agent in the table's `Order`, respecting `Blocked by`: sequential
   across layers (`@database-agent → @backend-agent → @frontend-agent → @e2e-agent`),
   parallel within one agent's slice when its findings are independent. Each named
   agent maps per §9 Named Agent Mapping (soft-degrade to a generic subagent + skill).
   - **Present, do NOT dispatch** (surface as user decisions): manual routes
     `data-seed` / `env-boot` (name the `docs/qa/config.json` field to fix —
     `authSeed` / `bootHint`), capability-invalid routes, and `@ux-agent` routes
     missing their contract-line citation.
   - **Amendment trail:** a dispatched `@ux-agent` `design-spec` fix MUST append its
     amendment to `design.md`'s `## Design Review` with the originating `run-NNN` +
     finding ID — so the next `/add.qa` sees why the contract changed and never reads
     a green-under-amended-contract flip as a fix.
   - **Legacy fallback:** when the report has NO `## Fix Routing` section (older run),
     fall back to today's severity/axis grouping and fix by root cause directly.
4. Apply fixes reusing CORRECTION MODE (C2) discipline: follow project patterns,
   frontend loads add-ux-design, the build must compile 100%. Surface all severities;
   the user chooses the fix scope.
5. On completion, suggest re-running `/add.qa <feature-id> [SFxx]` — which writes the
   next run-NNN for side-by-side comparison. Non-blocking; no forced iteration.

<!-- /section:qa-fix -->

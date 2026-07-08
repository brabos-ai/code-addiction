<!-- section:qa-fix -->

#### QA-Fix Flow (qa-pipeline) — explicit trigger only

Activate ONLY when invoked as `/add.build qa` (or an explicit `--qa` signal / report path).
This flow is OUTSIDE the §4.2 mode ladder — it never competes with bug→CORRECTION,
HAS_TASKS→TASKS, `feature N`→FEATURE, or pending→DEVELOPMENT, and a stale run must
never trigger it implicitly.

1. Detect the highest run-NNN under the in-scope feature/subfeature _tests/ and read
   its qa-validation-NNN.md.
2. If it has unresolved findings, present them grouped by severity (blocker → polish)
   and axis (functional/ux/a11y), and CONFIRM before changing any code.
3. Apply root-cause fixes reusing CORRECTION MODE (C2) discipline: follow project
   patterns, frontend loads add-ux-design, the build must compile 100%. Surface all
   severities; the user chooses the fix scope.
4. On completion, suggest re-running `/add.qa <feature-id> [SFxx]` — which writes the
   next run-NNN for side-by-side comparison. Non-blocking; no forced iteration.

<!-- /section:qa-fix -->

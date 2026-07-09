<!-- section:e2e-dispatch -->

### E2E Spec Authoring (qa-pipeline) — dispatch @e2e-agent per in-scope surface

DISPATCH AGENT: @e2e-agent [read-write on test files, standard] — one per surface in plan.md ## QA/E2E Specification (every declared surface — do not skip one), PARALLEL with the area generators.
Each receives: the surface/subfeature id, the plan ## QA/E2E Specification rows (incl. capture states), FEATURE_DIR/_tests/screens.json, the just-built component file paths, docs/qa/config.json.
Directive: author ONE <surface>.qa.spec (layer i assertions + layer ii capture at each capture state, written as <screen>.<state>.<viewport>.png + axe a11y), finalize the screens.json reachability recipe (append an entry if the surface is absent), then green-confirm via the qa-project managed app lifecycle. On boot failure → author-only + defer the first run to /add.qa (flag it). NEVER soften an assertion to make it pass; NEVER drop a capture state silently.
If @e2e-agent is not available in this engine, dispatch a generic subagent with this same directive AND instruct it to load the qa-project skill (conventions + managed app lifecycle) first (soft-degrade — the inline prompt then carries the full self-sufficient task).
WAIT-ALL with the area generators before STEP 4.

<!-- /section:e2e-dispatch -->

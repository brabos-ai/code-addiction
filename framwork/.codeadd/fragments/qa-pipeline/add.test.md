<!-- section:e2e-dispatch -->

### E2E Spec Authoring (qa-pipeline) — dispatch @e2e-agent per in-scope surface

DISPATCH AGENT: @e2e-agent [read-write on test files, standard] — one per surface in plan.md ## QA/E2E Specification (every declared surface — do not skip one), PARALLEL with the area generators.
Each receives: the surface/subfeature id, the plan ## QA/E2E Specification rows (incl. capture states), FEATURE_DIR/_tests/screens.json (each entry's design field points at the screen's design.md ## Design Contract), the just-built component file paths, docs/qa/config.json.
Directive: author ONE <surface>.qa.spec — layer i assertions + layer ii capture at each capture state (written as <screen>.<state>.<viewport>.png) + layer iii computed-style capture + axe a11y — finalize the screens.json reachability recipe (append an entry if the surface is absent), then green-confirm via the qa-project managed app lifecycle. Layer iii: for each ## Design Contract dimension verified by "computed style" (spacing scale, token allowlist, typographic scale, grid/container), capture the resolved values the contract names (gap/margin/padding, resolved custom-property names, font-size/font-weight, container width + column count) per screen × viewport into _tests/run-NNN/computed-styles/<screen>.<viewport>.json (minified, beside the screenshots). HARD requirement of the conformance rubric: a contract dimension whose capture is missing must be reported unverifiable — never passing. NEVER soften an assertion to make it pass; NEVER drop a capture state silently; NEVER drop a computed-style dimension silently.
If @e2e-agent is not available in this engine, dispatch a generic subagent with this same directive AND instruct it to load the qa-project skill (conventions + managed app lifecycle) first (soft-degrade — the inline prompt then carries the full self-sufficient task).
WAIT-ALL with the area generators before STEP 4.

<!-- /section:e2e-dispatch -->

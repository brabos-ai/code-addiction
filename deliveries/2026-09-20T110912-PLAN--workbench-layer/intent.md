---
path: architectural
topic: workbench-layer
doc: docs/brainstorming/2026-09-20T105430-workbench-layer-000-umbrella.md
delivery: automatic
---

## Decided

- Target is THIS repository only, not other projects — removes the generic/repo-specific split entirely; `add-framework--sync` keeping `web/` and `--release` keeping `cli/package.json` is correct, not a defect
- Source root is named `workbench/` — names what the directory is; `framwork/` produces, `workbench/` builds
- Layout is `workbench/{commands,skills,agents}/` as source, output written straight into the repository-root provider directories — one level, no copy step, no intermediate output tree
- A separate `scripts/build-workbench.js` that imports `scripts/build.js` — isolation from the release path without duplicating the transformation
- **`scripts/build.js` needs NO edit for this.** `buildResources(map, strategy)` reads no module-level path constant; the existing strategies hardcode `path.join(ROOT, 'framwork', '.codeadd', …)` in their own `sourcePath`. `build-workbench.js` authors its own three strategies and calls the imported function unchanged
- `workbench/provider-map.json` as its own registry — the build is registry-driven, so a second registry is what makes a second source root free
- No `npx` flag, no release packaging — `npx codeadd install` downloads a release ZIP, so routing internal development through it would mean tagging a release to test a one-line skill edit. The build IS the install
- claude + opencode only; cursor, codex and antigrav become rows in the registry later
- `.gitignore` ignores `commands/`, `skills/` and `agents/` inside each provider directory — never the directory itself, because `.claude/settings.json` is authored and tracked
- The set is three topics with hard dependencies 001 → 002 and 001 → 003; subtopic documents are NOT yet written, planning proceeds from the umbrella
- **Deliver in an isolated git worktree** — user instruction at handoff, 2026-09-20

## Open

None

# Remove: five generic skills leave the framework

## Outcome

`add--stripe`, `add--plan-based-features`, `add--optimizing-git-workflow`, `add--project-scaffolding` and `add--skill-creator` no longer ship. No command or agent loaded them. About 670K less in every install. Ticket 0060B.

## Changes

- `framwork/.codeadd/skills/`: the five folders are deleted; `framwork/provider-map.json` loses their keys.
- `add--backend-development`, `add--backend-architecture`, `add--frontend-architecture`, `add--agents-md-style`: the `mention:` rows and the pointers to the removed skills are gone; the out-of-scope bullets stay.
- `add--ecosystem`: five `mention:` rows and five table rows removed; "authoring skills" now points to the native `skill-creator` plugin.
- `web/src/pages/docs.astro`: five skill entries removed.
- `cli/tests/graph-query.test.js`: the leaf test uses `add--delivery-validation`. `cli/tests/build-artefact-graph.test.js`: neutral name in the fence test; inventory counts follow the removal.
- Workbench: `add-framework-development` tells skill authors to install the native plugin; `AGENTS.md` inventory regenerated.

## Action for installed projects

**Warning:** `codeadd update` removes `add--stripe`, `add--plan-based-features`, `add--optimizing-git-workflow`, `add--project-scaffolding` and `add--skill-creator` from your install. Local edits inside those folders are deleted with them. Empty folders may remain; they are harmless. Copy anything you want to keep before you update.

To author skills, install the native plugin:

```
/plugin marketplace add anthropics/claude-plugins-official   # only if the marketplace is not added yet
/plugin install skill-creator@claude-plugins-official
claude plugin install skill-creator@claude-plugins-official   # the same install, from a shell
```

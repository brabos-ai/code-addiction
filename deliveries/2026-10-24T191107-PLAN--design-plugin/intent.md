---
path: bounded
topic: design-plugin
doc: none
delivery: confirm
ticket: 0065B
---

## Decided

1. Problem: once `ux-design-core-slim` lands, the design core (contract, rubric, UX laws, patterns, direction) gives the plan structure but no curated data for style, palette, typography or chart choice. The ui-ux-pro-max skill (MIT, nextlevelbuilder, v2.15.0 per its `.claude-plugin/plugin.json`) supplies that data: a local searchable database and a `scripts/search.py` that needs Python 3 (standard library only, per its README). It worked well on Estanka. This card adds an opt-in `design` plugin that uses the skill when the user has already installed it. Everything below was checked on main `dfe98bb0` (v1.5.13) and on github.com/nextlevelbuilder/ui-ux-pro-max-skill README and platform templates.
2. The rule stays: "codeadd owns utilization, never installation" (`cli/src/plugins.json`, `$schema-doc.description`). The plugin ships no copy of the skill, installs nothing and has `skills: []`. `activateSkills` (`cli/src/plugins.js:112-130`) only copies a single `SKILL.md`, and the skill needs its data and scripts, which is a second reason not to bundle it.
3. Catalog entry `design` in `cli/src/plugins.json`:
   - `type: "skill"`. Update the `$schema-doc.fields.type` text from "'mcp' | 'script' | 'http'. v1 implements only 'mcp'." to include `'skill'`. No code reads `entry.type`: `rg "entry\.type" cli/src` returns nothing, and tests only use `type` inside their own fixtures.
   - `description`: "Adds ui-ux-pro-max (installed by you) as the style, palette, typography and chart source for the plan's design step".
   - `homepage`: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`.
   - `injects: ["add-plan"]`.
   - `skills: []`.
   - `agents`: `{ux-flow-agent: ["direction"]}`, `{ux-layout-agent: ["layout"]}`, `{ux-agent: ["critique"]}`.
   - `installHint` and `postEnableHint` per decision 5.
4. `detect`: a cross-platform `node -e` probe that exits 0 when any known install location holds the skill. Node is used because it is already required (>=22.19) and works the same on Windows. A shell `test -f` would not. The probe checks these locations:
   - Project, from `process.cwd()`, because `validate` runs `execSync` without a `cwd` option (`plugins.js:68-76`): `{.claude,.cursor,.agents,.agent,.opencode,.zcode}/skills/ui-ux-pro-max/SKILL.md`.
   - Home (`os.homedir()`): `{.claude,.cursor,.agents,.zcode}/skills/ui-ux-pro-max/SKILL.md` and `.config/opencode/skills/ui-ux-pro-max/SKILL.md`.
   - Claude marketplace: `${CLAUDE_CODE_PLUGIN_CACHE_DIR or ~/.claude/plugins}/installed_plugins.json` has a key starting with `ui-ux-pro-max@`.

   <p>
   Why these paths: `uipro init --ai <x>` installs to `<root>/skills/ui-ux-pro-max/SKILL.md`, with root `.claude` for claude, `.agents` for codex and for antigravity (`cli/assets/templates/platforms/{claude,codex,agent}.json`), `.cursor` for cursor, `.opencode` for opencode, and `.zcode` for zcode. `.agent` is codeadd's own antigrav dest (`cli/src/providers.js:60`). Global installs go to the home roots (README "Global Install"). Claude marketplace installs live in the plugin cache and are recorded in `installed_plugins.json` (Claude Code docs, "Plugin loading reference").
   </p>

   <p>
   A match in any one location is enough. The skill is provider-neutral content, injection only reaches providers that support it (decision 7), and checking only for the selected providers would make the install order matter. Python is not part of `detect` (decision 6).
   </p>
5. Hints. `installHint` gives both official routes and nothing else:
   - In Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`.
   - Any provider: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai <claude|codex|cursor|antigravity|opencode|zcode>`.
   - It warns against the stale `uipro-cli` package (README: "Older `uipro-cli` releases are stale"), and adds "Requires Python 3 for its search script."

   <p>
   `postEnableHint`: "design enabled: the plan's design step now consults ui-ux-pro-max. Check `python3 --version` (Windows: `py --version`); without Python the agents skip the search and use the design core. Restart the session or run `/reload-plugins` for a Claude plugin install." The printing itself already works (`plugins.js:346-357`).
   </p>
6. Python is a soft requirement. The fragments say: if `python3`/`python`/`py` is missing or the search fails, say so in one line in the temp output and continue with the design core. Never install Python. The skill's own README says the same: agents ask the human and never install software. Gating `detect` on Python would block enable on machines where only the search is missing.
7. Injection uses the existing slot mechanism (verified). A source command or agent holds `<!-- slot:<plugin>.<section> fallback="fallbacks/empty.md" -->` plus `<!-- plugin:<plugin>:<section> -->` markers. See the gitnexus examples at `agents/ux-agent.md:130-133` and `agents/ux-flow-agent.md:35-38`, and playwright at `agents/qa-agent.md:44-47`. The build collects them into the sidecar. `reconcileSlots` (`cli/src/injection-core.js:538-585`) fills a slot from `.codeadd/plugins/<name>/fragments/<resource>.md` (commands) or `fragments/agents/<resource>.md` (agents) (`injection-core.js:503-511`), using the `<!-- section:NAME -->` block (`:22-43`). It fills a slot only while the plugin is enabled and `detect` passes (`memberState`, `:513-516`). Agent fragments reach Claude only (`agentInjection`, `providers.js:14-18`, `:31`). Cursor and OpenCode get the command fragment, so the `add-plan` fragment also carries the instruction for the soft-degrade generic subagents (`add-plan.md:345`, `:351`, `:357`). Four new slots and their fragment files:
   - `commands/add-plan.md`: slot `design.plan`, inserted in STEP `add-plan.ux-design` after the gate block (`:320-338`) and before `#### STEP add-plan.dispatch-ux-flow` (`:340`). Fragment: `framwork/.codeadd/plugins/design/fragments/add-plan.md`. It tells the coordinator three things. Locate the installed skill (the first match of the decision-4 locations, or load it by name where the engine exposes it). Pass `DESIGN_SOURCE=ui-ux-pro-max <path>` in all three UX dispatch prompts, including the generic soft-degrade ones. At STEP `add-plan.ux-consolidate`, reject any ui-ux-pro-max value that contradicts `design-context.md` constraints.
   - `agents/ux-flow-agent.md`: slot `design.direction`, after Step 0 item 6 (`:42`) and before "Write the inspection to temp `design-context.md`" (`:44`). It must not sit next to the existing `gitnexus.graph` slot (`:35-38`), so they stay separate slots and are not merged into one composite slot. Fragment: `fragments/agents/ux-flow-agent.md`, section `direction`. On a new project (fewer than 5 components, `:41`) with no `docs/design-system.md`, the agent runs `search.py "<product/domain keywords>" --design-system` and takes palette, font pairing and style into `design-context.md` `theme`/`constraints`, citing the source. On an established project it may only fill dimensions the inspection left empty, and never overrides inspected tokens.
   - `agents/ux-layout-agent.md`: slot `design.layout`, after the "How You Work" intro (`:25`, the line `ux-design-core-slim` rewrites) and before item 1 (`:27`). Fragment: `fragments/agents/ux-layout-agent.md`, section `layout`. It uses `--domain typography`, `--domain chart` (chart type for data screens) and `--domain style` to fill Design Contract rows that `design-context.md` leaves `unknown`. It writes the values in the existing `Dimension | Declares | Verified by | Method` table and adds no new dimension.
   - `agents/ux-agent.md`: slot `design.critique`, in Critique Mode "How You Work" after item 2 (`:33`) and before `### Output` (`:35`). Fragment: `fragments/agents/ux-agent.md`, section `critique`. It may use `--domain ux` / `--domain color` results as evidence on the existing `critique-rubric.md` items (contrast, typography pairing, chart choice), and never adds a rubric item. Review mode and fix mode get nothing.
8. Precedence is the same in every fragment: inspected project tokens, then `docs/design-system.md` (`HAS_FOUNDATIONS`), then ui-ux-pro-max, then the `add--ux-design` defaults (`design-direction.md`, `Recommended Libraries`). The design core stays authoritative for notation and process: `design-contract.md` (layout-tree notation, contract dimensions), `critique-rubric.md` (9 items, severity), `ux-laws-principles.md` and the `feature-design` schema gate. ui-ux-pro-max is a data source and never replaces them. A user-made `design-system/<slug>/MASTER.md` (the skill's persist output) is read as an input at the `docs/design-system.md` level.
9. Writes stay inside the plan pipeline. Fragments forbid `search.py --persist`, because it writes `design-system/<slug>/MASTER.md` into the repo (README "Persist Design System"). Each agent's write scope is unchanged: flow writes `design-context.md` and `design-flow.md`, layout writes `design-layout.md`, critique writes `design-review.md`, and `design.md` remains the contract. Fragments run the script from the skill's own directory and always pass a query and a domain or `--design-system`, never a bare call.
10. No other command is injected. `add-ux`, `add-build` and the review-mode `@ux-agent` are left out to keep the change small. They can be a follow-up once the plan-side results are proven. `qa-reachability.smoke.test.js:462-468` (`playwright.agents = [qa-agent]`) is not affected.
11. Tests and fixtures:
    - `cli/tests/injection-exclusivity.integration.test.js:367-385` requires the catalog's `injects`, `agents`/`sections` and `skills` to match the fragment tree one-to-one, so the catalog and files must match exactly. The same suite enables every catalog plugin with a forced `detect` (`:255-262`, `:465`), so `design` is exercised automatically.
    - `cli/tests/fixtures/slot-membership-map-v2.json` and the frozen counts move by 4: `cli/tests/build-injection-points.test.js:155-156` (`slotCount 64 → 68`) and `cli/tests/helpers/agent-mode-points.js:15` (`BASELINE_POINTS 72 → 76`).
    - New tests in `cli/tests/plugins.test.js` for the real `detect` string, using a temp `HOME`/`USERPROFILE` and a temp cwd: it passes for a project `.claude/skills/ui-ux-pro-max/SKILL.md`, a home `.agents/skills/...` and an `installed_plugins.json` key, and fails when none exists.
12. Docs:
    - `web/src/pages/docs.astro` "Plugins" section (`:727-735`): reword "Plugins integrate external MCP tools" to "external tools (MCP servers or skills you install)". Add a `design` card after the `playwright` card (which starts at `:806`), following the same structure: header with "disabled by default" and "skill", install step with both routes, enable/disable commands, and the Python note. Also reword `docs.astro:178` ("List, enable, or disable MCP plugins") to drop "MCP" and add "design" to the example list.
    - `skills/add--ecosystem/SKILL.md` "Plugins" table (`:234-241`): add the row `design | skill | … | add-plan + 3 agents (ux-flow, ux-layout, ux critique) | —`.
    - `/add-help` reads the ecosystem map (`commands/add-help.md:65`) and already tells users to run `codeadd plugins enable` for install steps (`:192`), so it needs no change.
13. License and attribution: ui-ux-pro-max is MIT (© 2024 Next Level Builder). Nothing of it is copied into the repo. Docs and hints link to its homepage only.
14. Out of scope:
    - Bundling, vendoring or auto-installing the skill or Python.
    - Changes to `plugins.js` or `injection-core.js`; the existing mechanism covers it.
    - Agent injection for providers other than Claude (still Claude-only, by design).
    - `add-ux` / `add-build` / review-mode injection.
    - Any change to the design core files.
15. Target: next release, after `ux-design-core-slim`.
16. Acceptance criteria:
    - (a) `codeadd plugins list` shows `design`, off by default.
    - (b) `codeadd plugins enable design` with no install found exits 1 and prints the homepage and installHint. With any decision-4 location present, it enables and reports 1 command and 3 agents for Claude.
    - (c) After enable, the built `add-plan`, `ux-flow-agent`, `ux-layout-agent` and `ux-agent` contain the fragment text with no markers left. `disable` restores them byte-identical.
    - (d) If the skill is removed later, `codeadd update` lists `design` as not detected and the slots fall back empty.
    - (e) The fragments state the precedence (decision 8), the no-persist rule (decision 9) and the Python soft-fail (decision 6).
    - (f) `npm run build` and `npm run test:all` pass, with the fixture and counts updated (decision 11) and the new detect tests.
    - (g) `docs.astro` and the ecosystem table list `design`.
17. Risks:
    - Upstream path or package changes (it has already renamed `uipro-cli` to `ui-ux-pro-max-cli`). Mitigation: `detect` checks several locations, the hints link the README, and tests pin the locations.
    - The Claude plugin cache layout is Claude-internal. Mitigation: `installed_plugins.json` is the documented registry, checked by key only.
    - Style drift on established projects. Mitigation: precedence (decision 8) and the coordinator's reject at consolidation.
    - Token cost of extra searches. Mitigation: at most one `--design-system` call in flow and targeted `--domain` calls in layout and critique, only when a dimension is empty.
    - Python missing. Mitigation: soft-fail (decision 6).

## Open

None

## Card dependency

Depends on `ux-design-core-slim`, which rewrites `ux-layout-agent.md:25` (the anchor of the `design.layout` slot) and removes the bundled library docs. Blocks nothing.

## Board changes

- status: shaped
- title: design plugin: use an installed ui-ux-pro-max as the style, palette, typography and chart source for the plan's design step
- done_when: cli/src/plugins.json has a `design` entry (type skill, skills [], injects add-plan, agents ux-flow/ux-layout/ux) whose node detect finds ui-ux-pro-max in project or home skill dirs for claude/codex/cursor/antigravity/opencode/zcode or in Claude's installed_plugins.json, and whose installHint gives the official marketplace and ui-ux-pro-max-cli routes; four slots (add-plan design.plan, ux-flow-agent design.direction, ux-layout-agent design.layout, ux-agent design.critique) are filled from plugins/design/fragments with core precedence, no --persist and a Python soft-fail; enable/disable round-trips byte-identical; slot fixture and counts updated; detect tests added; docs.astro and the add--ecosystem plugins table list it; build and test:all pass.
- paths: cli/src/plugins.json, framwork/.codeadd/plugins/design/fragments/add-plan.md, framwork/.codeadd/plugins/design/fragments/agents/ux-flow-agent.md, framwork/.codeadd/plugins/design/fragments/agents/ux-layout-agent.md, framwork/.codeadd/plugins/design/fragments/agents/ux-agent.md, framwork/.codeadd/commands/add-plan.md, framwork/.codeadd/agents/ux-flow-agent.md, framwork/.codeadd/agents/ux-layout-agent.md, framwork/.codeadd/agents/ux-agent.md, cli/tests/plugins.test.js, cli/tests/fixtures/slot-membership-map-v2.json, cli/tests/build-injection-points.test.js, cli/tests/helpers/agent-mode-points.js, framwork/.codeadd/skills/add--ecosystem/SKILL.md, web/src/pages/docs.astro

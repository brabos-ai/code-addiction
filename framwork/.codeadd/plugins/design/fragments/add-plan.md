<!-- uses:
- skill: add--ux-design
- agent: ux-flow-agent
- agent: ux-layout-agent
- agent: ux-agent
-->

<!-- section:plan -->

**Design source — ui-ux-pro-max (installed by the user).**

**Precedence:** inspected project tokens (`design-context.md`) → `docs/design-system.md` (or a user-made `design-system/<slug>/MASTER.md`) → ui-ux-pro-max → `add--ux-design` defaults. ui-ux-pro-max is a data source for style, palette, typography and chart choice. It never replaces the notation, the contract dimensions, the rubric or the schema gate of the design core.

**Locate the skill once, before the first UX dispatch.** Take the first match, in this order:

1. A `ui-ux-pro-max/SKILL.md` under the project, then under the home directory, in `.claude/skills/`, `.cursor/skills/`, `.agents/skills/`, `.agent/skills/`, `.opencode/skills/` or `.zcode/skills/` (home also `.config/opencode/skills/`).
2. For a Claude marketplace install: read `installed_plugins.json` (in `$CLAUDE_CODE_PLUGIN_CACHE_DIR`, else `~/.claude/plugins/`), take the entries under `plugins["ui-ux-pro-max@…"]` (an array of objects), and look for `ui-ux-pro-max/SKILL.md` inside each `installPath`.
3. The skill loaded by name, where this engine exposes it. Take its directory from there.

Record the directory as `${DESIGN_SKILL_DIR}`. None found → say in one line that ui-ux-pro-max was not found, set no `DESIGN_SOURCE`, and continue with the design core.

**Add exactly one item to the "pass ONLY" list of each of the three UX dispatch prompts: `DESIGN_SOURCE=ui-ux-pro-max ${DESIGN_SKILL_DIR}`.** That covers `@ux-flow-agent`, `@ux-layout-agent` and `@ux-agent`, **including the generic subagents the Soft-degrade lines dispatch** when an agent is not available. Those subagents have no agent fragment, so this line is the only way the source reaches them. Tell them the same rules: the precedence above, every search carries a query and `--domain <x>` or `--design-system`, never `--persist`, and a missing `python3` (Windows: `py`) or a failed search is one line in the temp output, then the design core.

**At STEP add-plan.ux-consolidate, reject any ui-ux-pro-max value that contradicts a `design-context.md` constraint** (an inspected token, component or pattern). Keep the inspected value and say which one was kept.

<!-- /section:plan -->

# Add: an opt-in `design` plugin that uses an installed ui-ux-pro-max in the plan's design step

## Outcome

`codeadd plugins list` now shows `design`, off by default. When you have installed the ui-ux-pro-max skill yourself, enabling it makes the design step of `/add-plan` (`@ux-flow-agent`, `@ux-layout-agent`, and the `@ux-agent` critique) read it as the data source for style, palette, typography and chart choice. Precedence stays: inspected project tokens, then `docs/design-system.md`, then ui-ux-pro-max, then the `add--ux-design` defaults. Nothing is bundled or installed, and `search.py --persist` is never used. Without Python 3 the agents say so in one line and use the design core. Ticket 0065B.

## Changes

- `cli/src/plugins.json`: new `design` entry (`type: skill`, `skills: []`). Its `detect` is one cross-shell `node -e` that finds `ui-ux-pro-max/SKILL.md` in the project or home skill folders of Claude, Codex, Cursor, Antigravity, OpenCode and ZCode, or a `ui-ux-pro-max@` key in Claude's `installed_plugins.json`. `installHint` gives the two official routes (the Claude marketplace and `ui-ux-pro-max-cli`) and the Python 3 note.
- `plugins/design/fragments/`: four fragments (`add-plan`, and the three agents) that fill four new empty slots: `design.plan` in `add-plan`, `design.direction` in `ux-flow-agent`, `design.layout` in `ux-layout-agent`, `design.critique` in `ux-agent` (Critique Mode only).
- `add--ecosystem/SKILL.md`: the Plugins table and the Dependency Index list `design`. `web/src/pages/docs.astro`: a `design` card and wording for plugins that are skills.
- Tests: new `design plugin (0065B)` suite in `plugins.test.js` (catalog, detect matrix on the real string, fragment rules, slot placement). The node, slot and injection-point counts and the slot fixture move to match.

## Action for installed projects

**Note:** the four empty slots arrive with the next `codeadd update`. They render no text until you enable the plugin. To use it: install ui-ux-pro-max (`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`, or `npm install -g ui-ux-pro-max-cli` then `uipro init --ai <provider>`), then run `codeadd plugins enable design`. Agent fragments reach Claude only; Cursor and OpenCode get the `add-plan` fragment. If you remove the skill later, `codeadd update` names `design` as not detected and the slots go back to empty.

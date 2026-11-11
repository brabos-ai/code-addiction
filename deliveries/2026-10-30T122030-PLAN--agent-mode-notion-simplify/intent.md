# Intent: agent-mode-notion-simplify (0077F)

Approved by Maicon on 2026-10-30 ("Aprovado, pode seguir."). Patch v1.8.1. Fixes 0076B agent-mode-notion.

## Problem

v1.8.0 (PR #166, 0076B agent-mode-notion) over-built the Notion integration. It added two skills (`framwork/.codeadd/skills/add--notion-setup/` and `framwork/.codeadd/skills/add--notion/`), a `notion` item with an MCP check in `framwork/.codeadd/commands/add-setup.md`, a `notion` key in `framwork/.codeadd/skills/add--settings/SKILL.md` (`setup.offered.notion`), and entries in `framwork/provider-map.json`, `framwork/.codeadd/skills/add--ecosystem/SKILL.md`, `web/public/ecosystem.json` and the skills list in `AGENTS.md`. Maicon wanted only two things: remove the board (done in 0075B remove-board, keep it) and give agent-mode agents instructions to build and use a board in Notion. Framework command agents get no board instructions.

## Scope

In:
- Replace `add--notion` and `add--notion-setup` with one agent-mode skill for the Notion board, instructions only.
- Remove every reference to the two old skills and the setup/settings `notion` item.
- Link the new skill only from agent-mode docs and roles.
- Migration guidance for projects that had the old local board.
- Patch release v1.8.1.

Out:
- Any script, MCP check, token handling or tracker code in the framework.
- Board/Notion instructions in framework commands or their agents.
- Changes to the CLI migration `0006-retire-board`.
- Running the migration in other projects (each project's agents do it).

## Decided

1. Replace `add--notion` and `add--notion-setup` with ONE agent-mode skill for the Notion board (suggested name `add--agent-notion-board`; Engineer may adjust). Instructions only: how an agent-mode agent (PM, or Engineer when there is no PM) builds a Notion board database with the user (columns/status, labels, how to fill cards, a "how it works" page defined with the user as source of truth) and uses it day to day (update cards at milestones; id always shown with slug, e.g. `0075F-remove-board`). No scripts, no MCP checks, no token handling.
2. Remove the `notion` item from `/add-setup` (`commands/add-setup.md`), the `notion` key from `add--settings/SKILL.md`, and the two old skills from `provider-map.json`, `add--ecosystem/SKILL.md`, `web/public/ecosystem.json` and `AGENTS.md`. Register the single new skill there instead, referenced only from agent mode: `agent-mode/README.md` section 10, `agent-mode/roles/product-pm.md`, `agent-mode/roles/chief-engineer.md`.
3. Framework commands and their agents keep zero board/Notion instructions.
4. Migration guidance in the skill and in README section 10 for projects that had the old board: the project's PM (or Engineer if no PM) sends only in-progress and pending cards to Notion (insert or update); done/dropped cards are not migrated. Then it deletes `board.json`, the local `~/.codeadd/<key>/board/` folder and the remote `board` branch.
5. CLI migration `0006-retire-board` stays non-destructive (unchanged).
6. Code Addiction's own `board` branch on GitHub is deleted after checking that no pending card exists only there. The same flow applies to all of Maicon's projects.
7. Ship as patch v1.8.1 with only this fix.

## Acceptance criteria

- `grep -r "add--notion"` (including `add--notion-setup`) over the repo, outside `docs/deliveries/` and historical changelog entries, returns nothing.
- No `notion` item in `add-setup.md` and no `notion` key in `add--settings/SKILL.md`.
- Exactly one new skill exists, instructions only, and is linked only from agent-mode README section 10 and the two roles (plus registries: provider-map, ecosystem, AGENTS.md).
- Skill and README contain the migration guidance from decision 4.
- Tests updated (`cli/tests/agent-mode-notion.test.js`, `add-setup.test.js`, `agent-mode.test.js`, `build-artefact-graph.test.js` as needed); CI green.
- CHANGELOG entry for v1.8.1.

## Risks

- Consumers on v1.8.0 may keep the old skill folders after updating; the update must remove or overwrite them.
- Projects that already set `setup.offered.notion` keep a stale key; harmless, ignore it.
- Deleting a `board` branch before migrating pending cards loses them; the skill must order migrate first, delete last.

## Paths

- `framwork/.codeadd/skills/add--notion/` (remove)
- `framwork/.codeadd/skills/add--notion-setup/` (remove)
- `framwork/.codeadd/skills/add--agent-notion-board/SKILL.md` (new)
- `framwork/.codeadd/commands/add-setup.md`
- `framwork/.codeadd/skills/add--settings/SKILL.md`
- `framwork/.codeadd/skills/add--ecosystem/SKILL.md`
- `framwork/provider-map.json`
- `web/public/ecosystem.json`
- `AGENTS.md`
- `framwork/.codeadd/agent-mode/README.md`
- `framwork/.codeadd/agent-mode/roles/product-pm.md`
- `framwork/.codeadd/agent-mode/roles/chief-engineer.md`
- `cli/tests/*.test.js` (above)
- `CHANGELOG.md`, `docs/changelog/`

## Open: None

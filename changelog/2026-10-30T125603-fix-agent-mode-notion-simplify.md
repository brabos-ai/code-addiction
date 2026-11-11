# Fix: Notion for agent mode is one instruction-only skill, and an update removes the folders it empties

## Outcome

v1.8.0 shipped two Notion skills, a `notion` item in `/add-setup` with an MCP check and a `notion` key in the settings schema. Only instructions for agent-mode agents were wanted. Agent mode now has one skill, `add--agent-notion`, linked only from the agent-mode guide (section 10) and the two role files. No framework command or command agent says anything about a board or Notion.

## Changes

- **Prune (F1).** `pruneObsolete` in `cli/src/release-copy.js` removes each directory it leaves empty, walking up from the removed file and stopping at the first directory that is not empty. It never removes the install root or a directory directly under it, and its return value still counts files only. Before, `codeadd update` left the folder of a dropped skill behind, empty.
- **`/add-setup` (F2).** The `notion` item, its recommendation row, its values, its sub-step and its `uses:` line are gone; the MCP checkpoint is back at "STOP after step 4".
- **Settings (F3).** `setup.offered` no longer lists `notion`. A project that recorded the key keeps it; nothing reads it.
- **New skill (F4).** `add--agent-notion`: build the board with the user once (database, columns, labels, properties, fill rules, a "How it works" page the user owns), keep cards current each day, and migrate the old local board in a fixed order. Registered in `provider-map.json` and `add--ecosystem`.
- **Guide and roles (F5).** Section 10 and the two role paragraphs point at the new skill. Section 10 gives the migration order: send the in-progress and pending cards, check them, get the user's yes, then delete `.codeadd/board.json`, `~/.codeadd/<key>/board/` and the remote `board` branch, the branch last.
- **Removals (F6).** The two old skill folders, their registry entries and their ecosystem rows. The graph counts follow (skill 62 -> 60 after the new skill's +1).
- **Generated files (F7).** The `AGENTS.md` inventory and `web/public/ecosystem.json` list the new skill and neither old one.
- **Tests.** `cli/tests/release-copy.test.js` is new. `agent-mode-notion.test.js` is rewritten around the new skill, with an acceptance scan for the retired ids. The board ban in `agent-mode.test.js` L2.4 was a dead regex (backspace characters where `\b` was meant); it is a working `/board/i` over the text before section 10.

## Action for installed projects

Run `codeadd update`: the two old Notion skill folders are removed from every provider directory. A project with the old local board asks its PM agent to load `add--agent-notion` and follows section 10 of the agent-mode guide.

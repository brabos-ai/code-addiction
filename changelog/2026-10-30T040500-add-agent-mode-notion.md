# Add: agent mode can track work in Notion, through two instruction-only skills

## Outcome

After the board removal the framework had no tracker. Agent mode now has an optional Notion integration. Notion holds the cards and the workflow rules; the framework ships only markdown instructions, with no script, no API client and no sync. Without Notion, agent mode works as before.

## Changes

- **Setup skill (F1).** New `add--notion-setup`: checks the Notion MCP answers, asks once (parent page, database name, columns, labels), creates the cards database and the `Como funciona` page, links each of the six providers' MCP docs plus Notion's, and prints the two URLs. It never handles a token and writes no URL to a repo file.
- **Workflow skill (F2).** New `add--notion`: reads `Como funciona` first (it wins), finds the card by `tracker:` URL or Slug, and uses a default milestone table only where the page has no rule.
- **Registry and map (F1, F2, F3).** Both skills in `provider-map.json` and `add--ecosystem`; the `AGENTS.md` inventory block regenerated.
- **Settings (F4).** `setup.offered` accepts the `notion` key.
- **`/add-setup` (F5).** New optional `notion` item (recommended with `agent-mode`), its values in the one batch, and a Notion setup sub-step after `codeadd modify`. A Notion MCP that does not answer marks the item `failed`, lets the other items run, and reports `revisit notion`.
- **Guide and roles (F6, F7).** New section 10 in the agent-mode guide; one paragraph in each role file.
- **Review fixes.** The page title is always `Como funciona`; the setup skill reads every `## Setup answers` value; an engineer with no card reports it to the PM. The node-count snapshot test and `web/public/ecosystem.json` follow the two new skills.

## Action for installed projects

None. Run `/add-setup` and accept `notion` to opt in.


Source: Maicon, 2026-10-29 11:08 and 11:22 BRT (answers 1-4 on remove-board). Follows <code>remove-board</code> and depends on it. Checked on main <code>4813ef2e</code>. Paths are under <code>framwork/.codeadd/</code> unless stated otherwise.

```yaml
path: bounded
topic: agent-mode-notion
doc: none
delivery: confirm
ticket: none
depends_on: remove-board
```

## Decided

1. Problem: after <code>remove-board</code> the framework has no tracker. Maicon wants project management in Notion for agent mode, with nothing local and no git dependency, and with the workflow rules (columns, labels, how to fill a card) defined with the user and kept in Notion itself.
2. Notion is the single source (Open 1 answer A). No local map, no <code>.codeadd/board/</code> folder, no <code>~/.codeadd/<key>/tracker.json</code>. Slug, Feature ID, attachments and links live on the Notion card. The only repo trace is one line <code>tracker: <card URL></code> in the feature's <code>about.md</code> (and in the intent frontmatter when there is a card), written by the PM. Agents find a card by its URL, or else by searching the Slug.
3. No tracker code in the framework: no script, no API client, no sync. Only instructions in markdown. Agents call the Notion MCP the user configured. Nothing is added to <code>cli/src/features.js</code>; Notion is not a feature flag.
4. Two new skills, named by the repo convention <code>skills/add--<name>/SKILL.md</code> (every shipped skill uses <code>add--</code>; <code>add-*</code> single dash is for commands), each registered in <code>framwork/provider-map.json</code> <code>skills</code> (same place as the removed <code>add--backlog</code>, <code>:104</code>):
   - <code>add--notion-setup</code>: one-time setup with the user.
   - <code>add--notion</code>: the agents' workflow in Notion.
5. <code>add--notion-setup</code> (a): builds the database with the user. It proposes, and the user confirms or edits in one batch: properties Title (starts with the slug), Slug (text), Feature ID (text, e.g. <code>0075F</code>), Status (select/status with the columns the user chooses; default proposal: Ideia, Refinando, A fazer, Planejado, Em andamento, Em revisão, Feito, Descartado), Labels (multi-select), Type (Feature / Hotfix / Chore / Bug), Priority, Link (URL: PR/branch), Attachments (files). It creates the database through the MCP when the MCP can, otherwise it gives the user the exact property list to create by hand.
6. <code>add--notion-setup</code> (b): creates a page "Como funciona" (title in the user's language) in the same parent as the database. It holds: the columns and what each means, which pipeline milestone moves a card into each column, the labels adopted and when to use each, the fill rules (title, slug, feature id, link, attachments, who owns which column). This page is the source of truth of the flow; the skill writes its URL nowhere in the repo except the user's own agent config if the user wants (see 8).
7. <code>add--notion-setup</code> (c): MCP configuration per provider. For each provider in <code>framwork/provider-map.json</code> (today <code>claude</code>, <code>opencode</code>, <code>codex</code>) it links that provider's official MCP doc already listed there (<code>docs</code> entries) plus Notion's official MCP doc, and tells the user to finish auth in the provider's own flow (OAuth or env var). It never asks for, prints, writes or logs a token: no token in a file, prompt, settings or log. It checks the MCP answers (a search call) before step 5; if it does not, it stops with "configure the Notion MCP, restart the session, run again".
8. Where agents find the "Como funciona" page and the database: the skill reads them from the Notion workspace by title search ("Como funciona" + database name), and the setup prints the two URLs for the user to paste into the agents' own instructions (role prompt or bot memory). No repo file stores them (decision 2).
9. <code>add--notion</code> (agent workflow): first step every time is to read the "Como funciona" page; that page wins over anything in the skill. The skill gives the default milestone mapping only as a fallback when the page lacks a rule: brainstorm -> card created/Refinando with Slug; new -> Feature ID filled, <code>tracker:</code> line in <code>about.md</code>; plan -> Planejado; build -> Em andamento, then Em revisão with Link (PR); done -> Feito; hotfix -> card Type Hotfix, same path. The PM owns create/refine/priority; the engineer owns plan/build/done moves (same split as <code>roles/product-pm.md</code> and <code>roles/chief-engineer.md</code>).
10. Naming in Notion and in every message: always <code><id>-<slug></code> (rule from remove-board decision 13); title starts with the slug, Feature ID and Slug as separate properties.
11. Offered by <code>/add-setup</code> and by agent mode. <code>commands/add-setup.md</code>: one optional row <code>notion</code> in the batch table (<code>:130-140</code>, where the <code>board</code> row was), recommended yes when <code>agent-mode</code> is on, otherwise no, executed by loading <code>{{skill:add--notion-setup/SKILL.md}}</code> after the <code>codeadd modify</code> step; recorded in the <code>setup</code> record like other items (<code>add--settings</code> schema gets the <code>notion</code> key). <code>agent-mode/README.md</code> gets a short section "Track work in Notion (optional)" in place of the old section 9 (<code>:197-232</code>), pointing to both skills.
12. Roles: <code>agent-mode/roles/product-pm.md</code> and <code>agent-mode/roles/chief-engineer.md</code> get one short paragraph each: "If the project tracks work in Notion, load <code>add--notion</code> and follow the 'Como funciona' page; otherwise the handoff is the intent + <code>docs/features/<id>-<slug>/</code> only." Without Notion, agent mode works with no tracker.
13. Tests: provider-map lists both skills and they install for each provider; a grep test that both skills and the roles contain no token-like literal and no <code>backlog-</code>/<code>board.json</code> reference; <code>add-setup</code> batch shows the <code>notion</code> row. No test calls Notion.
14. Out of scope: migrating Maicon's <code>board</code> branches to Notion (done once by the agents, outside the framework), other trackers (Linear, Jira), any automatic sync.

## Open

None

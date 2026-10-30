---
name: add--notion-setup
description: Use when a project wants to track agent-mode work in Notion — one-time setup with the user. Checks the Notion MCP answers, builds the cards database and the "Como funciona" page, points at each provider's MCP configuration, and prints the two URLs. Loaded by /add-setup when the user accepts `notion`, or by an agent the user asks to set Notion up.
---

# Notion Setup

<!-- uses:
- command: /add-setup
-->

## Overview

Runs once per project, with the user. It prepares the two things the daily skill reads: a database of cards and a page named `Como funciona` that holds the workflow rules. It is instructions only: no script, no API client, no sync. Every Notion call goes through the Notion MCP the user configured in their own provider.

## When to Use

- `/add-setup` loads it for an accepted `notion` item.
- The user asks an agent to set up Notion for the project.

## When NOT to Use

- Daily card work (find, move, fill). That is the Notion workflow skill's job, and it reads the `Como funciona` page this skill creates.

## ⛔ Prohibitions

```
IF THE NOTION MCP DOES NOT ANSWER THE CHECK OF STEP 1:
  ⛔ DO NOT USE: any create, update or write call of the Notion MCP
  ⛔ DO NOT: Ask the batch of STEP 2
  ✅ DO: Print the stop of STEP 1 and end

IF ANY STEP IS ABOUT TO ASK FOR, PRINT, WRITE OR LOG A TOKEN OR KEY:
  ⛔ DO NOT USE: Write or Edit with a token, key or secret in the content
  ⛔ DO NOT: Ask the user to paste a credential, or echo one back
  ✅ DO: Point at the provider's own auth flow (OAuth login or an environment variable the provider reads) and let the user finish it there

IF THE DATABASE URL OR THE PAGE URL IS KNOWN:
  ⛔ DO NOT USE: Write or Edit to store either URL in a repository file
  ✅ DO: Print both in STEP 5 for the user to keep
```

## Procedure

### 1. Check the MCP answers

Make one search call through the Notion MCP (search for the title `Como funciona`; an empty result is an answer). When the call is not available or fails, STOP and print:

- the sentence "configure the Notion MCP, restart the session, run again";
- the table of **MCP configuration per provider** below, whole.

The table is printed on this stop on purpose: the run that finds no MCP is the run where the user needs the links.

| Provider | Its MCP documentation |
|---|---|
| claude | https://docs.anthropic.com/en/docs/claude-code/mcp |
| codex | https://developers.openai.com/codex/mcp |
| antigrav | https://antigravity.google/docs/mcp |
| opencode | https://opencode.ai/docs/mcp-servers/ |
| cursor | https://docs.cursor.com/context/model-context-protocol |
| zcode | https://zcode.z.ai/en/docs/mcp-services |

Notion's own MCP documentation: https://developers.notion.com/guides/mcp/overview

Authentication is the provider's own flow (OAuth login or an environment variable). This skill never handles the credential.

### 2. Ask once

When a `## Setup answers` block is in the session (from `/add-setup`), read every answer it carries (parent page, database name, columns, labels) and ask only what it does not cover. Use the properties table below as shown, with no second confirmation. Otherwise ask every question below in ONE numbered message, each with a RECOMMENDED answer and the reason, and WAIT once:

1. **Parent page** that will hold the database and the `Como funciona` page. No default: the user names it.
2. **Database name.** Default: the repository folder name; the user may edit it.
3. **Columns** (the Status values). Default: Ideia, Refinando, A fazer, Planejado, Em andamento, Em revisão, Feito, Descartado. The user may add, drop or rename.
4. **Labels.** No default set: the user supplies them, and an empty set is allowed.

Also show the properties the database will have, for the user to confirm or edit in the same reply:

| Property | Holds |
|---|---|
| Title | The card name; starts with the slug |
| Slug | Text: the feature slug |
| Feature ID | Text: the framework id of the feature (`<id>`) |
| Status | The columns from question 3 |
| Labels | Multi-select with the labels from question 4 |
| Type | Feature / Hotfix / Chore / Bug |
| Priority | Select or number, the user's scale |
| Link | URL: the pull request or branch |
| Attachments | Files |

### 3. Create the database

Create it through the Notion MCP, in the parent page, with the properties and values confirmed in STEP 2. When the MCP cannot create a database or a property, print the exact property list (name, type, values) for the user to create by hand in Notion, and WAIT for the user to say it is done. Then go on.

### 4. Create the `Como funciona` page

Create a page in the same parent as the database. The title is always `Como funciona`, whatever language the page is written in. The agents that read it later find it by this exact title, so the title is the page's identity: keep it. The page holds:

- the columns and what each one means;
- the pipeline milestone that moves a card into each column (brainstorm, new, plan, build, review, done, hotfix);
- the labels adopted and when to use each;
- the fill rules: title starts with the slug, Slug and Feature ID are separate properties, Link carries the pull request, Attachments carries files;
- who owns which column: the product PM creates, refines and prioritises; the engineer moves plan, build and done.

This page is the source of truth of the flow. It wins over any default in the daily skill.

### 5. Close

Print the database URL and the page URL, and tell the user to paste both into the instructions of each agent that will use Notion (its role prompt or its memory). Write them in no repository file. End by saying what was created, or what the user still has to create by hand.

## Rules

ALWAYS:
- Check the MCP before any write
- Ask every open question in one message
- Keep the page title `Como funciona`

NEVER:
- Handle, print or store a token or key
- Write the database URL or the page URL in a repository file

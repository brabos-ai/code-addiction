---
name: add--notion
description: Use when a product PM or engineer agent works on a project that tracks its work in Notion — read the "Como funciona" page first, find the card, and move it along the pipeline milestones. Falls back to a default milestone table only where the page has no rule.
---

# Notion Workflow

<!-- uses:
- mention: add--notion-setup
-->

## Overview

What an agent does with the project's cards, every time. The project's own rules live in a Notion page named `Como funciona`. This skill carries a default for the places where that page is silent. It is instructions only: the agent calls the Notion MCP the user configured, and the framework runs no script and no sync.

## When to Use

- A PM or engineer agent is about to create, find or move a card, or to write a card's link.
- The agent's role file says the project tracks work in Notion.

## When NOT to Use

- The project has no Notion setup. Without it, the handoff is the intent file and the feature folder `docs/features/<id>-<slug>/` only.
- First-time setup of the database and the page. That belongs to `add--notion-setup`.

## ⛔ Prohibitions

```
IF THE `Como funciona` PAGE HAS NOT BEEN READ IN THIS RUN:
  ⛔ DO NOT USE: any create or update call of the Notion MCP
  ✅ DO: Do STEP 1 first

IF THE PAGE AND THE DEFAULT TABLE DISAGREE:
  ⛔ DO NOT: Follow the table
  ✅ DO: Follow the page

IF A STEP IS ABOUT TO ASK FOR, PRINT, WRITE OR LOG A TOKEN OR KEY:
  ⛔ DO NOT USE: Write or Edit with a credential in the content
  ✅ DO: Use the Notion MCP as the user configured it, and nothing else
```

## Procedure

### 1. Read `Como funciona`

Find the page by a title search for `Como funciona` through the Notion MCP and read it whole. It wins over everything in this skill. The user also pasted the database URL and the page URL into the agent's instructions; use them when they are there.

When there is no such page, say that Notion is not set up, point at `add--notion-setup`, and continue the work with no tracker.

### 2. Find the card

Look in this order and stop at the first hit:

1. The `tracker: <card URL>` line in the feature's `about.md`, or in the intent file frontmatter.
2. A search in the database for the Slug property.

No card found: only the product PM creates one (see Ownership). An engineer who finds none reports it to the PM and continues with no tracker. The one exception is a hotfix: the engineer starting it creates the card, with Type Hotfix.

### 3. Move the card

Apply the page's rule for the milestone. Where the page has no rule, apply this default:

| Milestone | Card |
|---|---|
| brainstorm | Card created in Refinando, with the Slug filled |
| new | Feature ID filled; `tracker: <card URL>` written in the feature's `about.md` |
| plan | Moved to Planejado |
| build | Moved to Em andamento; then to Em revisão, with Link set to the pull request |
| done | Moved to Feito |
| hotfix | Type set to Hotfix; the same path as above |

The column names are the defaults of the setup. When the page renamed a column, use the page's name.

### Ownership

- The product PM creates the card, refines it and sets the priority.
- The engineer moves it through plan, build and done.

### Naming

Always `<id>-<slug>`, in Notion and in every message. The card title starts with the slug. Feature ID and Slug are separate properties.

## Rules

ALWAYS:
- Read `Como funciona` before any write
- Write the `tracker:` line in `about.md` when the card is first linked to a feature

NEVER:
- Handle, print or store a token or key
- Write a Notion page URL or database URL in a repository file other than the `tracker:` line

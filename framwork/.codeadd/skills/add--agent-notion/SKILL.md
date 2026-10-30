---
name: add--agent-notion
description: Use when an agent-mode agent (the product PM, or the engineer when the team has no PM) works on a project that tracks its work in Notion — build the board with the user once, keep each card current at every pipeline milestone, always name work `<id>-<slug>`, and move an old local board into Notion in a fixed order. Instructions only.
---

# Agent-Mode Notion Board

## Overview

A board in Notion that the agents of an agent-mode team keep current. This skill has three parts: build the board with the user once, use it every day, and migrate the old local board when the project had one. It is instructions only: the agent uses the Notion tools it already has, and the framework adds no script, no sync and no credential handling.

## When to Use

- The agent's role file says the project tracks work in Notion, and the agent is about to create, find or move a card.
- The user asks the PM agent (or the engineer, when there is no PM) to build the Notion board.
- The project had the old local board and the user asks to move it.

## When NOT to Use

- Any framework command or command agent. They never read or write the board.
- A project that does not track work in Notion. The handoff is then the intent file and `docs/features/<id>-<slug>/` only.

## ⛔ Prohibitions

```
IF THE "How it works" PAGE HAS NOT BEEN READ IN THIS RUN:
  ⛔ DO NOT USE: any create or update call on a card
  ✅ DO: Read the page first (Use the board, step 1)

IF A STEP IS ABOUT TO ASK FOR, PRINT, WRITE OR LOG A TOKEN OR KEY:
  ⛔ DO NOT USE: Write or Edit with a credential in the content
  ✅ DO: Use the Notion tools as the user configured them, and nothing else

IF THE DATABASE OR PAGE ADDRESS IS KNOWN:
  ⛔ DO NOT USE: Write or Edit to store either address in a repository file
  ✅ DO: Find them again by title, or ask the user

IF THE OPEN CARDS OF THE OLD BOARD ARE NOT ALL CONFIRMED IN NOTION:
  ⛔ DO NOT: Delete `.codeadd/board.json`, the local board folder or the remote `board` branch
  ✅ DO: Finish the migration order below, in that order
```

## Build the board, once, with the user

Ask everything in ONE numbered message, each question with a RECOMMENDED answer and the reason, and wait once:

1. **Database.** Its name (recommend the repository folder name) and the parent page that will hold it. The user names the parent page; there is no default.
2. **Status columns.** Recommend a default set the user can rename: Idea, Refining, To do, Planned, In progress, In review, Done, Dropped.
3. **Labels.** There is no default set. The user supplies them, and an empty set is allowed.
4. **Other properties.** At least: a title in the form `<id>-<slug>`, Type (Feature, Hotfix, Chore, Bug), Priority (the user's scale) and a link to the pull request.
5. **How a card is filled, and who moves which column.** Recommend: the PM creates and refines cards and sets the priority; the engineer moves them through plan, build and done.

Create the database with the Notion tools you already have. When you cannot create it or a property, print the exact property list (name, type, values) for the user to create by hand, and wait for them to say it is done.

Then write a page named **How it works** beside the database. The user may give it another title; when they do, use that title everywhere this skill says "How it works". The page holds:

- the columns and what moves a card into each one;
- the labels and when to use each;
- the fill rules (the title is `<id>-<slug>`, the link property holds the pull request);
- who owns which column.

That page is the source of truth. It wins over everything in this skill.

## Use the board, each day

1. **Read "How it works" before any write.** Find it by title through the Notion tools. When it does not exist, say the board is not built, offer to build it with the user, and continue the work with no card.
2. **Find the card by its `<id>-<slug>` title.** Always show the id with the slug, as in `0075F-remove-board`. No card found: the PM creates one. When the team has no PM, the engineer creates it. An engineer on a team with a PM who finds none tells the PM and continues; the one exception is a hotfix, where the engineer starting it creates the card.
3. **Update the card at each milestone.** Apply the page's rule. Only where the page has no rule, use this fallback:

| Milestone | Card |
|---|---|
| brainstorm | Card created, with the `<id>-<slug>` title |
| new | The id is filled in the title |
| plan | Moved to the planned column |
| build | Moved to in progress; then to in review, with the pull request linked |
| done | Moved to the done column |
| hotfix | Type set to Hotfix; the same path as above |

The column names above are the recommended defaults. When the page renamed a column, use the page's name.

## Migrate the old local board

Only for a project that had the old local board. First make sure the Notion board is built and "How it works" was read in this run; when the board is not built, build it first (section above). Then read the old cards from one of three places: `.codeadd/board.json` in the repository, the `board` branch of the remote, or the local clone at `~/.codeadd/<key>/board/`. `<key>` is the folder the removed board used for this project: list `~/.codeadd/`, take the one folder holding a `board/` clone whose remote is this repository, and ask the user when you find none or more than one.

1. Send only the in-progress and pending cards to Notion. The old status names are in each card's status field; when you cannot tell which are open, ask the user. Insert each one, or update it when a card with the same `<id>-<slug>` title already exists. Skip the done and dropped cards: they are not migrated.
2. Check that every card you sent is in Notion.
3. Show the user what was sent and the three deletions that come next, and wait for the user's yes.
4. After the yes, delete in this order:
   1. delete `.codeadd/board.json`;
   2. delete the local folder `~/.codeadd/<key>/board/`;
   3. delete the remote `board` branch last.

A deleted remote branch cannot be undone, which is why it goes last and only after the yes.

## Rules

ALWAYS:
- Show the card as `<id>-<slug>`
- Treat "How it works" as the source of truth over this skill
- Confirm every sent card in Notion before any deletion

NEVER:
- Run this skill from a framework command or its agents
- Delete the old board in any other order than the one above

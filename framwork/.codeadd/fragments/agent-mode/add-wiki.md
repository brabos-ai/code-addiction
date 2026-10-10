<!-- uses:
- skill: add--agent-interaction
- mention: /add-audit
- mention: /add-new
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:offer -->

**A standalone wiki run is the no-activity case.** Nothing about generating a knowledge base creates
work for an agent, so it ends with no next command. A next command appears only when the run found
something to act on.

| Run | Next activity |
|---|---|
| Standalone generation, no issues found | none — the wiki is the deliverable |
| Issues found in the tree | `/add-audit` — a deep health check on what the run surfaced |
| Context mapped and the user asked to build | `/add-new` — start building with that context |

Finish the report and its metadata, then end on the next command as the last line, on the second and
third rows only. Offer no continuation and ask no yes/no question.
⛔ **Never propose a feature on a standalone run.** The user asked for a wiki, not for a backlog.

<!-- /section:offer -->

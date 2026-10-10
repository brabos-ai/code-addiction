<!-- uses:
- skill: add--agent-interaction
- command: /add-hotfix
- command: /add-new
- command: /add-plan
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:offer -->

**This command is READ-ONLY and advisory.** The next activity exists only when the accepted route is
one an agent can pick up. Print the hotfix invocation only for an accepted hotfix route, and never
invoke it.

| Accepted route | Next activity |
|---|---|
| `hotfix` | `/add-hotfix @docs/diagnose/<file>.md` — it consumes the `## Hotfix Handoff` this report appended |
| `feature` | `/add-new` — a functional gap becomes a feature |
| `extend` | `/add-new` or `/add-plan`, per the route's own scope |
| `no-action` | none — the diagnosis was the deliverable |

Finish the report and its metadata, then end on the next command as the last line, on the first three
rows only. A `no-action` diagnosis ends with no next command. Offer no continuation and ask no yes/no
question: the bot starts the next session from that line by itself. This step supplies only the next
activity and its documents.

<!-- /section:offer -->

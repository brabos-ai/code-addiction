<!-- uses:
- skill: add--agent-interaction
- command: /add-done
- mention: /add-pull-request
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:offer -->

**This command opens a PR and stops. It never merges, and the merge is always the user's.**

| State | Next activity |
|---|---|
| PR open, awaiting review | none — a human reviews it; there is no agent activity to continue into |
| PR merged on GitHub | `/add-done` — cleanup local branch and tags |
| Scope grew, PR needs updating | `/add-pull-request` — idempotent, appends an update section |

Finish the report and its metadata, then end on the next command as the last line, on the second and
third rows only. A PR waiting on a human reviewer is the no-activity case and ends with no next command —
naming "/add-done" before the merge would send the bot into a command whose gates cannot pass yet. Offer
no continuation and ask no yes/no question.

<!-- /section:offer -->

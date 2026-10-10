<!-- uses:
- skill: add--agent-interaction
- command: /add-new
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:offer -->

**This command is advisory — it changes no code and fixes nothing.** So the next activity exists only
when there is a finding to act on.

| Audit result | Next activity |
|---|---|
| Critical findings | `/add-new` per critical issue — each becomes a feature |
| Findings below critical | none — the report is the deliverable |
| Healthy project | none — there is nothing to continue into |

Finish the report and its metadata, then end on the next command as the last line, on the first row
only. A healthy audit ends with no next command; do not invent a feature to have somewhere to point.
Offer no continuation and ask no yes/no question. This step supplies only the next activity and its
documents.

<!-- /section:offer -->

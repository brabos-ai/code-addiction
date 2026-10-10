<!-- uses:
- skill: add--agent-interaction
- skill: add--delivery-mode
- command: /add-plan
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:checkpoint-route -->

   | `EPIC_DELIVERY` | Do |
   |---|---|
   | `automatic` | Print what `SFxx` delivered, then follow {{cmd:add-plan}} for this feature — it plans the next pending subfeature — as `add--delivery-mode` describes |
   | `semi-automatic` | **STOP — deciding.** Show what `SFxx` delivered and what the next subfeature will do, and end the turn with the go-ahead as one numbered item with a RECOMMENDED line. On the go, follow {{cmd:add-plan}}. This question IS the stop |
   | absent (`confirm`) | Keep the full checkpoint report for `SFxx`, then end on `/add-plan ${FEATURE_ID}` for the next pending subfeature as the last line. No continuation offer |

**The `confirm` checkpoint keeps its whole report.** It ends on the next command as its last line, and never trades the report for a shorter one.

<!-- /section:checkpoint-route -->

<!-- section:offer -->

**On `confirm`, finish the report, the rulings table and the metadata, and end on the next command as the last line.**
Ask no yes/no question and offer no continuation: the bot starts the next session from that line by
itself. This step supplies only the next activity and its documents; `automatic` never reaches it.

⛔ **The publish question is deciding in every state and outranks this step.** On a branch with no PR,
the build asks that question as one numbered item with a RECOMMENDED line and ends the turn there; the
closing's next command comes only after the answer.

<!-- /section:offer -->

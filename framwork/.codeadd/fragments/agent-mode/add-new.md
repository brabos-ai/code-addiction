<!-- uses:
- skill: add--agent-interaction
- skill: add--delivery-mode
- command: /add-plan
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:output-cap -->
> **OUTPUT:** Agent mode — no cap on reply length. Every question goes out in one numbered batch, each with a recommendation.
<!-- /section:output-cap -->

<!-- section:confirm-wait -->

**What the user sees depends on what is left open:**

| `## Open` in the intent file | This STEP |
|---|---|
| Reads `None` | The confirmation screen alone. One screen, no questions |
| Lists items | Those questions, all at once in one numbered batch. The turn ends there; the next call prints the confirmation screen and continues |
| Absent, empty, or no intent file at all | The skill's full question set, all at once in one numbered batch. The turn ends there; the next call prints the confirmation screen and continues |

**Print the confirmation screen; it never waits for an answer.** A correction of an extraction error
arrives with the next call. **The approval never scales away — only the interrogation does.**

**Stop kind — decided by what is left open:**

| State | Kind | What this command does |
|---|---|---|
| `## Open` reads `None` | **confirming** | Print the confirmation screen in full and continue to STEP add-new.decompose, on `confirm` and on `automatic` alike — the brainstorm's approval already covered it |
| `## Open` lists items | **deciding** | Send the open questions as one batch and end the turn — no approval answered them |
| Absent, empty, or no intent file | **deciding** | Send the skill's questions as one batch and end the turn — there is no approval to have covered anything |

<!-- /section:confirm-wait -->

<!-- section:closing-route -->

**Stop kind — confirming.** The report describes work the brainstorm's approval already covered.

| `delivery:` | Do |
|---|---|
| `confirm`, or absent | Print the report, then the next command — `/add-plan` with this feature's id — as the last line, and stop. No continuation offer |
| `automatic` | Print the report and the line `(delivering automatically — continuing to /add-plan.)`, then follow {{cmd:add-plan}} with this feature's id, from its first step, as `add--delivery-mode` describes |

<!-- /section:closing-route -->

<!-- section:offer -->

**On `confirm`, finish the report and its metadata, and end on the next command as the last line.** Ask no
yes/no question and offer no continuation: the bot starts the next session from that line by itself.
This step supplies only the next activity and its documents; `automatic` never reaches it.

<!-- /section:offer -->

<!-- uses:
- skill: add--agent-interaction
- mention: add--ecosystem
- command: /add-diagnose
- command: /add-hotfix
- command: /add-new
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:output-cap -->

> **OUTPUT RULE:** Agent mode — no cap on reply length. Every question goes out in one numbered batch, each with a recommendation.
<!-- /section:output-cap -->

<!-- section:cap-scope -->

The challenge techniques apply on all three paths. If the
conversation reveals hidden complexity, apply STEP add-brainstorm.classify's one-way ratchet before continuing.

<!-- /section:cap-scope -->

<!-- section:objective-draft -->

**Draft the objective from what the user has already said, and send it as item 1 of the first question batch, with a recommendation.** One or two
sentences, in their words, answering one question: **what will be true when this is done that is not
true today?**

```
IF STARTING STEP add-brainstorm.explore ON bounded OR architectural:
  ⛔ DO NOT: Ask "what is your objective?" and wait — someone who could state it cold would have
  ⛔ DO NOT: Hand back the request as the objective — "you want X" names the thing, not what it achieves
  ⛔ DO NOT: Send the first batch without the draft objective as its item 1
  ✅ DO: Put the draft first, then every other question the request already raises, in the same message
```

<!-- /section:objective-draft -->

<!-- section:cadence -->

**Cadence (MANDATORY):** Put every clarifying or challenge question the conversation still needs into ONE
batch, and end the turn there. Do not ask one question and wait before the next.

**Every question is drawn from the objective.** A question that sharpens no part of it is a question
this conversation does not need.

**Active posture:** Go beyond the user's framing. Question premises, surface edge cases, force decisions until doubts resolve. The batch holds the questions that matter, not every question you could ask.

<!-- /section:cadence -->

<!-- section:structured-ask -->

**Put the recommendation in the batch.** Each candidate direction is an option of its question, and the
RECOMMENDED line names the one you would take and why. Call no structured-question tool.

<!-- /section:structured-ask -->

<!-- section:approval-ask -->

**This is the only approval the pipeline asks for by default.** Ask it as one numbered item of the batch,
with these three options and nothing else, and a RECOMMENDED line:

| Option | What happens |
|---|---|
| **Approve, I confirm each stage** | The intent file records `delivery: confirm`. Each stage stops for its own answer; this command stops |
| **Approve, deliver automatically** | The intent file records `delivery: automatic`, and this command follows `/add-new`. Every stage then hands off without waiting until the build asks whether to open the PR |
| **Keep discussing** | No intent file, no handoff. Return to STEP add-brainstorm.explore with what the user wants to reopen |

<!-- /section:approval-ask -->

<!-- section:offer -->

Name the route in the report's metadata:

| Route | Next activity | Documents the block points at |
|---|---|---|
| `/add-new` | Formalize the idea as a feature | The existing intent file written at STEP add-brainstorm.write-intent-file carries every settled decision; do not invent a feature id or cite its future files as existing references |
| `/add-diagnose` | Triage a suspected bug | Actual existing project evidence for the symptom; `add--ecosystem` Main Flows carries the routing |
| `/add-hotfix` | Fix a confirmed bug | Actual existing diagnosis or issue documents, when available; never fabricate a hotfix directory that the next command has not created |
| Needs more exploration | none — stay in this conversation | Name no next command |

Agent mode: no continuation offer. The closing ends on the route's command, as its last line. The last
row is the no-activity case: a brainstorm that still needs exploring has no next command, so it ends
on its open questions.

<!-- /section:offer -->

<!-- section:rules-cadence -->
- Draft the objective as item 1 of the first question batch
- Send every open question in one batch; end the turn there
<!-- /section:rules-cadence -->

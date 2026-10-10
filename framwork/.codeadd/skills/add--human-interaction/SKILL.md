---
name: add--human-interaction
description: "Use when a command talks to a person at a terminal — one question per turn, the provider's structured-question tool when it has one, confirming stops that wait on a person, and the optional fresh-context continuation offer with its eligibility and its two-response contract. The default every command loads through its agent-mode.interaction slot when the agent-mode feature is off."
---

# Human Interaction

<!-- uses:
- skill: add--delivery-mode
- skill: add--final-report
- mention: add--feature-specification
- mention: add--agent-interaction
- mention: /add-done
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Owns HOW a command talks to a person: how it asks, when a stop waits, and how a finished run offers the
next step. It is the rule set every command loaded before the agent-mode feature existed, kept as it
was. The bot version of the same four jobs is `add--agent-interaction`.

**A command loads exactly one of the two, through its `agent-mode.interaction` slot.** With the
feature off the slot holds a line that loads this skill; with it on, the slot holds the line that loads
`add--agent-interaction`. A command that loaded neither is read as human — this is the default, mirroring "absent
means `confirm`".

## When to Use

- A command is about to ask the user something, stop for an answer, or close with a next step.

## When NOT to Use

- Deciding WHICH stops wait, in which delivery mode — that is `{{skill:add--delivery-mode/SKILL.md}}`.
- What goes in the closing report — that is `{{skill:add--final-report/SKILL.md}}`.

---

## Asking

**One question per turn.** A list of questions is asked one at a time, and the next waits for the
answer — unless the step states its own question format (`add-plan`'s clarification does), which it
keeps. What to ask belongs to the command, or to `add--feature-specification` when it is writing a
spec.

**Every question carries a concrete recommendation** — which option this skill would take and why,
drawn from the codebase and from what the intent file already settled. Ask through the provider's
structured-question tool where the `structuredQuestions` capability says one exists; otherwise present
an option table with the recommendation marked.

## Stops that wait

A **confirming** stop waits on `confirm` and prints-then-continues on `automatic`; a **deciding** stop
waits in both. `{{skill:add--delivery-mode/SKILL.md}}` owns the rule and how to classify a stop — this
skill adds only that, on `confirm`, the wait is for a person.

---

## Handing Off to the Next Command

**This section is `chat-continuation-eligibility-v1`: WHO is offered a handoff, and in what form.**
What the accepted handoff contains is `chat-continuation-output-v1`, below. This section decides only
whether the first of its two turns happens.

| Mode | At the end of a command |
|---|---|
| `confirm` | Offer the optional fresh-context instructions once, after the report and its metadata, then stop |
| `automatic` | Print the next command, then **open the next command's file and follow it** |

**`confirm` no longer prints an invocation nobody asked for.** The user already knows how to type the
next command; what they do not know is which decisions the run settled, and a bare command line
throws that away. So the manual ending is one localized yes/no question, and the instruction text is
the user's to ask for.

```
IF THE RUN ENDED ON confirm AND A REAL NEXT ACTIVITY EXISTS:
  ✅ DO: Finish the full report, then ask ONCE whether to receive instructions for a fresh context
  ✅ DO: Wait — the answer comes in the next turn, and only acceptance produces the block
  ⛔ DO NOT: Print the full invocation before the user asks for it
  ⛔ DO NOT: Write a handoff file, or offer to run the next command

IF THERE IS NO REAL NEXT ACTIVITY:
  ⛔ DO NOT: Offer, and DO NOT: invent an activity to offer
  ✅ DO: Finish the report normally — a completed run, a healthy audit and a merged branch all end here
```

**"A real next activity" is one the user would plausibly start.** The command that follows in the
pipeline, the fix a diagnosis routed to, the review a build left open. It is not a suggestion you
generated because the report felt short, and it is not a feature nobody asked for.

⛔ **A deciding stop is never replaced by the offer.** A blocker, a red build, a push, the publish
question and every stop in `/add-done` keep their own handling. The offer is what a command does when
it has finished, not a substitute for a question it owes.

⛔ **Semi-automatic keeps its own decision.** Between subfeatures it stops and asks whether to
continue — that question is the one it already asked. It does not also offer continuation
instructions. Inside a subfeature it behaves as `automatic`.

**`automatic` is untouched.** It prints the handoff it always printed and follows the next command
in this same session. Nothing here adds an offer to it.

## The Second Response — `chat-continuation-output-v1`

A manual run is usually where the session ends. The user opens a new one to keep going, and that new
session knows nothing about the decisions this run settled. This section owns what the command offers
them and what it hands over when they accept.

**It owns the SHAPE, and the eligibility above owns whether the offer is made at all.** The two live in
this one skill so they cannot drift apart.

### Two responses, never one

| Response | When | What it carries |
|---|---|---|
| The report | The completion itself | All seven blocks, the command's own mandatory artefact, then its metadata |
| The instructions | Only after the user accepts the pending offer | Exactly one fenced plain-text block, and nothing else |

**They are two turns.** Folding them into one message is the failure this contract exists to prevent:
a reader who pastes the block carries the report's findings along with it, and a fresh session spends
its first act re-reading a verdict it was about to be handed.

The first response ends with one localized yes/no question — whether to receive instructions for a
fresh context — and then stops. It may name the next activity in ordinary prose; the full invocation
waits for the answer.

```
IF THE USER ACCEPTS THE PENDING OFFER:
  ✅ DO: Respond with exactly one fenced plain-text block and nothing around it
  ✅ DO: Start the block's first line with the complete next-command invocation
  ⛔ DO NOT USE: Write on any file — the handoff is chat text, never a generated document
  ⛔ DO NOT: Run the next command, follow its file, or treat acceptance as consent to anything

IF THE USER DECLINES, OR THE REPLY IS AMBIGUOUS:
  ⛔ DO NOT: Produce the block, run anything, or ask again
  ✅ DO: End the handoff there
```

⛔ **Acceptance authorizes text, nothing else.** It is not approval to execute, to stage, to publish
or to merge, and an earlier approval of any of those is never an acceptance of this offer. Scope the
answer to the last explicit pending offer.

⛔ **The accepted response is exempt from the seven blocks, the mandatory-artefact rule and the
metadata.** It is one block of instructions. Every rule above this section governs the OTHER response.

### What the block contains

**Complete for its activity, not a transcript.** It is what the next session needs to start, not what
this session said.

| Include | Never |
|---|---|
| The complete next-command invocation, with its arguments, feature id or subfeature scope | An invented file, target feature, patch or approval |
| The objective or action, in a line | A summary of the run that produced it |
| The actual official document paths that govern the activity, each with its role | A path you have not seen resolve |
| Only the confirmed decisions and restrictions needed to act | Settled questions the reader would otherwise re-ask |
| The provider-correct spelling of the invocation | A canonical command name rewritten to fit one provider |

**References stay authoritative.** Point at the official document and describe the activity; never
restate a specification into the block, because a second copy of a rule is a second thing to drift.

**On a review correction**, name the current review and its `## Fix Routing`, and carry the finding
identities and the supersession decisions with it. Keep other sessions' work and evidence intact, and
tell the recipient to check current state before reapplying anything — a fix already applied is
re-applied twice when the block does not say so.

**Use the project's real relative paths**, and keep whatever path semantics the command already had.
There is no universal `@file` handoff syntax, and the diagnosis-to-hotfix `@report` interface is
untouched by this.

**Spell the invocation the way the provider invokes it** — command-as-skill where slash commands are
unavailable — without changing which command it is.

### Who never offers

⛔ **This contract is for a top-level finishing command only.**

```
IF THIS RUN IS A WORKER, A SUBAGENT, OR A STEP NESTED INSIDE ANOTHER COMMAND:
  ⛔ DO NOT: Offer continuation, ask a question, or open a competing conversation
  ✅ DO: Report as the owning command's step told you to, and return
```

A worker that loads this skill to close out its own area is not the user's next stop, and a question
from one leaves the user two threads to choose between. A backlog operation nested inside another
command is the same case. A top-level backlog operation offers only when its host selected an actual
next development activity; otherwise it ends normally.

---

## Rules

ALWAYS:
- Offer the continuation once on `confirm`, after the report's metadata, and only for a real next activity

NEVER:
- Print the full next-command invocation on `confirm` before the user asks for it
- Offer continuation when no real next activity exists, or from a worker or nested step
- Substitute the offer for a deciding stop

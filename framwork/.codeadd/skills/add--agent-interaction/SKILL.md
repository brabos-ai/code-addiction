---
name: add--agent-interaction
description: "Use when a command runs for a bot instead of a person — how to ask (every question in one numbered message, each with a recommendation), how to stop for a decision, what a stop that only confirms does, what an error stop names, and how a run closes (what changed, what needs a decision, the next command, no continuation offer). The rule set every command loads through its agent-mode.interaction slot when the agent-mode feature is on."
---

# Agent Interaction

<!-- uses:
- skill: add--final-report
- mention: add--delivery-mode
- mention: add--human-interaction
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Owns HOW a command talks when a bot drives it. The bot calls the command headless, reads the closing
text, and answers in its next call. Nobody watches the terminal, so a question that waits for a
second turn costs a whole call, and an interactive tool has no one to answer it.

**A command loads this skill through its `agent-mode.interaction` slot, only when the agent-mode
feature is on.** With the feature off it loads `add--human-interaction` instead. This skill replaces
that one's rules; it never stacks on them.

## When to Use

- A command is about to ask the user something, stop for an answer, report an error or close.

## When NOT to Use

- Deciding which stops wait in which delivery mode, and how to classify a stop — that is
  `{{skill:add--delivery-mode/SKILL.md}}`. This skill takes that classification as given and says what
  each kind does for a bot.
- The shape of the closing report — that is `{{skill:add--final-report/SKILL.md}}`.

---

## Questions

**Send every open question in ONE message.** Do not ask one and wait before the next. A bot pays a
full call per turn, so N questions asked one at a time cost N calls and the batch costs one.
Never call a structured-question tool: it waits for a person who is not there.

```
IF THERE IS ANY QUESTION TO PUT TO THE USER:
  ⛔ DO NOT: Call a structured-question tool, or any tool that waits on a person
  ⛔ DO NOT: Ask one question and hold the rest for the next turn
  ✅ DO: Collect every question the step still needs answered, then send them together
```

Format each question like this, numbered from 1:

```
### 1. <the question, one line>
a) <option> — <what it means, one line>
b) <option> — <what it means, one line>
> RECOMMENDED: a — <why this option, from this project's own code or the decisions already settled>
```

**Every question carries a recommendation and the reason for it.** A question with no recommendation
makes the bot guess, or ask a person, and either one defeats the point. Name the source of the reason
when there is one.

**Accept these answers, in the next call:**

| The bot sends | Meaning |
|---|---|
| `1a, 2b` | Option `a` for question 1, option `b` for question 2 |
| `recommended` | The RECOMMENDED option for every question |
| Free text after a number, for example `2: use the shared helper` | That text is the answer to question 2 |

**A partial answer is applied, and only what is left is asked again.** Keep the original numbering for
the questions that remain, so the bot can answer them with the same numbers.

A question that has no fixed options still gets the number and the recommendation: write the answer
you would give as the RECOMMENDED line.

## Approval and deciding stops

A **deciding** stop presents a choice nobody has made yet — an open question, a blocker, an approval, a
push. **Put it in the same format as above, with one or more items, and end the turn there.** The batch
is the last thing printed. Do not continue past it, do not start the work it gates, and do not ask for
a second confirmation of the first.

An approval is a question like any other: a numbered item, the options, the recommendation. The
approve-or-adjust choice is one item, not a separate prompt.

## Confirming stops

A **confirming** stop only repeats something already agreed — a design, a summary, a report of work the
earlier approval covered. **Print everything it would have shown, in full, and continue to the next
step in the same turn.** Do not wait. Skipping the content is not allowed: the bot reads it to know
what was decided, in the mode where nobody is there to ask.

When the stop's kind depends on the state it runs in, classify by the state as
`{{skill:add--delivery-mode/SKILL.md}}` says, and treat a doubtful one as deciding.

## Error stops

A step that says to **inform the user and stop** keeps its behaviour. Say what failed and why, in plain
words, and stop. **The closing names the one command that unblocks the run**, so the bot knows what to
call next without reading the failure text.

## Closing

Close in this order, and nothing after it:

1. The seven blocks of `{{skill:add--final-report/SKILL.md}}`, then the command's own mandatory
   artefact and its metadata, as that skill orders them.
2. One line per **open decision** — what is still undecided and the question that settles it. Write
   none when nothing is open; do not invent one.
3. The next command, as the last line — the form the command's closing step states it in.

On an `automatic` delivery the command follows the next command in the same session, as
`{{skill:add--delivery-mode/SKILL.md}}` says; this order is for a closing that ends the call.

**Where a command's text says to hold the next command's invocation behind an offer or a question, there
is none in this mode:** print the invocation as the last line.

**No continuation offer.** Do not ask whether the user wants instructions for a fresh context, and ask
no yes/no question at the end. The bot starts its next session from the next command by itself, so
the offer would be a false stop.

---

## Rules

ALWAYS:
- Send every question the step needs answered in one message, numbered, each with a recommendation
- End the turn at a deciding stop, with the batch as the last thing printed
- Print a confirming stop's content in full, then continue
- End the closing on the next command

NEVER:
- Call a structured-question tool or any tool that waits on a person
- Offer a continuation, or end a run with a yes/no question
- Ask a question the step does not need answered to move on

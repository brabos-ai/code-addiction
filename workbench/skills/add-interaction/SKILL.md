---
name: add-interaction
description: "Use when an internal pipeline stage, command or skill reaches a stop that asks the user something — every question goes out at once in one numbered message, each with a recommendation and the reason, answered `1a, 2b`, `recommended` or free text per number. Owns the one exception (brainstorm 8.1) and what it does not own (which stops wait)."
---

# Interaction — How an Internal Stop Asks

<!-- uses:
- mention: add-plan-authoring
- mention: add-build-ledger
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Owns HOW a stop asks. Which stops wait, and which pass on an automatic delivery, belong to
`add-plan-authoring` (The Delivery Mode) and to the stage that owns the stop. This rule is always on:
the internal layer has no feature to switch it.

## When to Use

- A stage is about to ask the user one or more questions: a clarification, an approval, a picker, a
  blocker, a push.

## When NOT to Use

- A stop that asks nothing — one that prints and goes on.
- A hard stop in `add-build-ledger`: it names its own conditions, and asks through this rule.

---

## The Rule

**Send every question the stop still needs answered in ONE message.** Never ask one and hold the rest
for the next turn. A question you can already answer from the code, the plan or an earlier decision is
not asked; it is stated.

Number the questions from 1. Give each its options and a recommendation with the reason:

```
### 1. <the question, one line>
a) <option> — <what it means, one line>
b) <option> — <what it means, one line>
> RECOMMENDED: a — <why this option, from this project's code or a decision already settled>
```

**Never call a structured-question tool.** The same message is read on every provider, and a tool
that one provider has and another lacks makes the stop behave two ways.

**The recommendation is mandatory.** Name its source when it has one, and let this project win over
outside practice. A question you cannot recommend on is a question you have not understood yet.

## What the User Sends Back

| The user sends | Meaning |
|---|---|
| `1a, 2b` | Option `a` for question 1, option `b` for question 2 |
| `recommended` | The RECOMMENDED option for every question |
| `2: <text>` | Free text for question 2 |

**A partial answer is applied, and only what is left is asked again**, under the same numbers. Do not
re-ask a question the answer covered.

## The Exceptions

- **A single free-text question stays single.** "What do you want to explore?" has no options and no
  recommendation to give; it is one question asked as it is.
- **Brainstorm 8.1 gives no recommendation, on purpose.** The umbrella's set-membership question is
  the one place the command deliberately does not pick: a recommendation there would bias a decision
  the skill leaves open. It is still numbered and still one message, and it states in one line why it
  carries no RECOMMENDED. Nothing else is exempt.

## Rules

ALWAYS:
- Put every open question of a stop in one numbered message
- Give each question a recommendation and the reason for it
- Accept `1a, 2b`, `recommended` and free text per number, and re-ask only what is left

NEVER:
- Call a structured-question tool or print a separate option table for the same question
- Ask one question and wait before the next
- Skip the recommendation, except at brainstorm 8.1

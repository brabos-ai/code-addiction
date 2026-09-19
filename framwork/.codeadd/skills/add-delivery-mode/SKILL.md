---
name: add-delivery-mode
description: "Use when a pipeline command reaches a stop or its closing handoff — the two delivery modes and where each is carried, which stops wait in each mode, how one command hands off to the next, and where the automatic path ends."
---

# Delivery Mode

<!-- uses:
- mention: /add.brainstorm
- mention: /add.new
- mention: /add.plan
- mention: /add.build
- mention: /add.review
- mention: /add.done
- mention: add-doc-schemas
- mention: add-review-discipline
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Owns HOW a delivery moves through the pipeline once the user has approved it: the two modes, where
each is carried, which stops wait, how one command hands off to the next, and where the automatic
path ends. WHAT each command presents at a stop belongs to that command — every command classifies its
own stops where they sit.

## When to Use

- A command is about to stop and has to know whether the stop waits.
- A command has finished and is about to suggest, or run, the next one.

## When NOT to Use

- Writing the intent file's shape — the `brainstorm-intent` schema in `add-doc-schemas` owns it.
- `/add.done`. The close-out is never part of an automatic delivery, so nothing here reaches it.

---

## The Two Modes

**Chosen once, at `/add.brainstorm`'s approval, and carried — never asked again.**

| Mode | What the user chose |
|---|---|
| `confirm` | See every stage. Each stage stops, shows its work and waits |
| `automatic` | Deliver without waiting. Each stage hands off to the next until a stop that needs a person |

### Where the mode is carried

| Carrier | Written by | Read by |
|---|---|---|
| `delivery:` in the intent file (`docs/brainstorm/…-intent.md`) | `/add.brainstorm`, at its approval | `/add.new`, `/add.plan` |
| `Delivery` in the `plan.md` header | `/add.plan`, copied from the intent file | `/add.build`, `/add.review` |
| `delivery:` line under `## Notes` in `epic.md` | `/add.new`, at the epic split | `/add.plan`, `/add.build` — it wins over the other two for that epic |

⛔ **Absent means `confirm`.** No intent file, no field, no header line, a plan written before this
skill existed, a command run by hand — every one of them runs with a person confirming each stage.

```
IF A CARRIER IS MISSING, EMPTY OR HOLDS ANY OTHER VALUE:
  ⛔ DO NOT: Guess `automatic` from how the user seems to be working
  ✅ DO: Run as `confirm`
```

**The fall is toward waiting, never away from it.** A wrong `confirm` costs one extra answer. A wrong
`automatic` runs work nobody approved.

### The epic note has three values

On an epic, `/add.new` asks once, after the split is accepted, and writes the answer:

| `epic.md` note | Between two subfeatures |
|---|---|
| `delivery: automatic` | Continue to the next pending subfeature. The PR question comes once, at the end |
| `delivery: semi-automatic` | Stop, show what the finished subfeature delivered and what the next one will do, and wait. Inside a subfeature it behaves as `automatic` |
| absent | `confirm` |

---

## The Stopping Rule

Every stop in the pipeline is one of two kinds:

| Kind | It presents | On `confirm` | On `automatic` |
|---|---|---|---|
| **deciding** | A choice the approval did not cover — an open question, a blocker, an ambiguity, a failure, a push | Waits | **Waits** |
| **confirming** | Something the approval already covered — a design, a confirmation screen, a preview, a report of agreed work | Waits | Does not wait |

⛔ **"Does not wait" never means "does not print".** A confirming stop on `automatic` still shows
everything it would have shown, then continues.

```
IF A CONFIRMING STOP IS PASSED ON automatic:
  ⛔ DO NOT: Skip the content the stop presents
  ✅ DO: Print it in full, then continue to the next step
```

**The user is not watching in exactly this mode.** Hiding what was decided without them leaves them
nothing to check afterwards.

⛔ **Classify by the state the stop runs in, not by its marker.** One `[STOP]` can be both kinds:
`/add.build`'s publish question decides on the first push and only confirms once a PR exists.

```
IF A STOP'S KIND IS NOT OBVIOUS FROM ITS STATE:
  ⛔ DO NOT: Call it confirming to keep the delivery moving
  ✅ DO: Call it deciding, and wait
```

### Stops that are deciding in every state

- **`/add.build`'s publish question on a branch with no PR.** It is the end of an automatic delivery.
- **A build that is still red** after the fix attempts run out.
- **Any failure a command reports as STOP** — a script exiting non-zero, a missing document, a gate
  that did not pass.
- **Every stop in `/add.done`.** No mode reaches it: an automatic delivery ends at the publish question,
  and the merge is always the user's.

---

## Handing Off to the Next Command

| Mode | At the end of a command |
|---|---|
| `confirm` | Print the next command as text and stop. The user runs it |
| `automatic` | Print the same line, then **open the next command's file and follow it** |

**Following the next command means the same agent, in the same session, reads that command and runs
its steps from its first one.** No subagent, no new context. It is plain markdown, so every provider
can do it.

```
IF HANDING OFF ON automatic:
  ⛔ DO NOT: Start the next command in a subagent or a fresh context
  ⛔ DO NOT: Skip the next command's first steps because the context "is already loaded"
  ✅ DO: Read the next command's file and execute it from its first step, passing the feature id
```

**Its first steps are its own gates.** A command that skips them because the previous one already
looked at the same files runs without the checks it was written with.

The pipeline, in order:

```
/add.brainstorm → /add.new → /add.plan → /add.build (its own final review) → /add.build publish question
```

---

## Where the Automatic Path Ends

**`/add.build` reviews its own work.** Its final review runs once per delivery unit, applies one fix
wave and writes the verdict `/add.done` reads — `add-review-discipline` owns it. The build then goes to
its loop end: the checkpoint on an epic, then the next subfeature or the publish question.

**`/add.review` is not on the automatic path.** It is optional, for detail and QA, and a user runs it.
It never hands a delivery on, and nothing hands a delivery to it.

**The publish question is where the automatic path ends.** Whatever the final review left open is
printed there, never fixed silently and never dropped.

---

## Rules

ALWAYS:
- Read the mode from its carrier; run as `confirm` when the carrier is absent
- Print a confirming stop's content in full before passing it on `automatic`
- Classify a stop by the state it runs in, and call a doubtful one deciding
- Hand off on `automatic` by reading the next command's file and running it from its first step

NEVER:
- Reach `/add.done` without the user running it
- Hand an automatic delivery to `/add.review`
- Re-ask the delivery mode after `/add.brainstorm` recorded it

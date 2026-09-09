---
name: add-build-ledger
description: "Use when executing a plan's F-blocks — the build ledger, the resume rule, one commit per F-block, the ruling format, and the four hard stops. Load before the first F-block of any planned build."
---

# Build Ledger — Execution Discipline

Layer-neutral. Governs HOW execution is recorded and when it may continue. WHAT a given layer
validates belongs to that layer's own skill, which the executing command selects per F-block.

<!-- uses:
- skill: add-commit
-->

## When to Use

- Planned mode, before the first F-block.
- Re-entering a build — every entry, not only after a crash.

## When NOT to Use

- Unplanned/direct mode. No F-blocks, no ledger.

---

## F-Block Identity

**One F-block = one item of the plan's Execution Order.** Ids are `F1`, `F2`, … in every layer, each
carrying the layer tag the plan gave it. There is no separate internal `S<n>` series.

Legacy plans on disk using `S<n>` keep their ids — read them, do not renumber them.

---

## The Ledger

**Path:** `docs/plans/<plan-basename>--ledger.md` — the plan's basename with `--ledger.md` appended.

**Why it is mandatory:** it carries the rulings. `docs/plans/` is gitignored, so the ledger never
reaches a reviewer on its own. Every `Ruling:` line must be carried out of it and into the completion
report, or the decision dies on this machine.

**Append-only. Identity on the first line, written once, never rewritten.** A ledger whose identity
changes mid-build cannot be trusted. It is a **log, not a set** — the same line twice appends twice.
There is no `build-ledger.sh`; append the line yourself.

```markdown
# Build ledger — plan: docs/plans/<plan-basename>.md

F1: complete (commits a1b2c3d..a1b2c3d, build.js clean)
F2: Ruling: kept the existing key name — the plan names both — costs a rename in F4 if wrong
F2: complete (commits d4e5f6a..b7c8d9e, cli suite 0 new failures)
```

```
IF THE LEDGER HAS NOT BEEN READ THIS SESSION:
  ⛔ DO NOT USE: Write or Edit on any artefact
  ⛔ DO NOT: Re-execute any F-block
  ✅ DO: Read the ledger and apply the resume rule
```

## The Resume Rule

- An F-block with a `complete` line is **NEVER** re-executed. Not "probably done", not "let me
  re-check by re-running it". Done.
- An F-block with no line at all is the next one to execute.
- **After a compaction, trust the ledger and `git log` over your own recollection.** Recollection is
  the thing that was just erased. Where the two disagree: **git wins for what exists** — a commit in
  `git log` happened, whatever the ledger says — and **the ledger wins for what was decided**, because
  a ruling leaves no trace in a diff.

---

## One Commit per F-Block

For each F-block, in the plan's execution order:

1. **Record `BASE`** — `git rev-parse HEAD`, before touching anything for this block.
2. **Implement it**, applying the layer skill the block's tag selects.
3. **Show what changed.** This informs the user; it does not wait on them.
4. **Validate it** — that layer's checks, for this block's artefacts only.
5. **Commit it**, only once validation passed. Conventional Commits per `add-commit`, with the F-block
   id as a trailer so ledger, commit and plan can be joined later.
6. **Record `HEAD`** and append `F<n>: complete (commits <BASE>..<HEAD>, <what validated it>)`.

**Commit after validation, never before.** A commit of unvalidated work is worse than no commit: it
looks like delivered work and is not.

```
IF THIS F-BLOCK'S VALIDATION DID NOT PASS:
  ⛔ DO NOT USE: Bash to run git commit for this block
  ⛔ DO NOT: Append its `complete` line
  ⛔ DO NOT: Start the next F-block
  ✅ DO: Fix it, rule on it, or STOP
```

---

## Rulings

**Rule and continue. Do not stall on a judgement.** A conflict between two readings of the plan, an
ambiguity, a plan defect with a defensible fix — decide it, record it, keep going:

```
Ruling: <what you decided> — <why> — <what it costs if wrong>
```

All three parts are required. **The cost clause is what makes a ruling reviewable**: a human reading
"the existing key name wins" cannot tell whether to check it; a human reading "costs a rename in F4 if
wrong" can.

**A red build is not a finding, and rule-and-continue does not cover it.** Rulings are for judgements
a reasonable person could decide either way. A build that does not compile is not a judgement and
there is nothing to weigh: the block reports what failed and STOPS. Ruling a red build away would make
every other ruling worthless, because the reader could no longer tell which ones were judgements.

## The Four Hard Stops

Four things stop the session and ask the human, and only these:

1. **An irreversible or destructive operation** — a history rewrite, a data deletion, a dropped table.
2. **A security-sensitive action** — credentials, auth, permissions, secrets.
3. **A side effect outside this working tree that norms say you ask about first** — a merge, a push to
   a shared branch, a publish.
4. **A plan so broken that every path forward is a guess.** Not "a decision I would rather not make" —
   one where no reading of the plan supports any option over the others.

Everything else is a ruling. **"I am not sure" is not a fifth stop.**

**The plan-level `Design [STOP]` gate is untouched by any of this.** That gate is the human's real
decision point. Rulings replace the per-judgement stall *during* execution, never the approval that
let execution start. The two are not the same gate and must not be read as one.

---

## Completion Report — Rulings I Made

Collect **every** `Ruling:` line from the ledger, in the order made, each with its cost clause.
Exhaustive, not representative: if the ledger holds a ruling, the report holds it. A ruling that stays
in the ledger is a decision made in secret.

**If no ruling was made, say so.** Silence is indistinguishable from not having looked.

Also report the ledger path and the `BASE..HEAD` range of every committed F-block.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The ledger is scratch, I'll reconstruct it at the end" | It carries the rulings. A diff cannot show a decision |
| "I remember doing F3, no need to read the ledger" | Recollection is what compaction erases. Read it |
| "This validation is basically passing" | Basically passing gets no commit and no `complete` line |
| "The build is red but the cause is unrelated" | Not a judgement. Report and STOP |
| "I'm not sure which reading is right, I'll ask" | Not a hard stop. Rule on it, record the cost clause |
| "I'll list the interesting rulings" | Exhaustive, not representative |

## Rules

ALWAYS:
- Read the ledger on entry, before deciding anything
- Record BASE before touching an F-block
- Carry every ruling into the completion report with its cost clause

NEVER:
- Re-execute an F-block that has a `complete` line
- Commit an F-block before its validation passed
- Rewrite the identity line, or edit a line already written
- Rule away a red build

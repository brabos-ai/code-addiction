---
name: add-review-discipline
description: "Use when a command dispatches a reviewer, a cold reader or the prompt reviewer over a document or a delivery — how many times each runs, why none of them writes a file, and the rule that a finding is judged before it is applied."
---

# Review Discipline

<!-- uses:
- agent: plan-review-agent
- agent: plan-readback-agent
- agent: prompt-review-agent
- mention: /add-framework--build
- mention: /add-framework--plan
- mention: /add-framework--brainstorm
- mention: add-plan-authoring
- mention: add-build-ledger
-->

<!--
A sibling skill of the same name now lives in the PRODUCT layer, at
framwork/.codeadd/skills/add-review-discipline/. The duplication is DELIBERATE:
that layer ships to users' projects, where this directory does not exist, so
nothing there can reference anything here — and neither `uses:` block may name
the other, because a cross-layer target resolves inside its own layer and
dangles, which fails the build.

The two files carry the same subject and REACH OPPOSITE CONCLUSIONS in two
places, both on purpose:

  1. The COUNT. This layer allows no second dispatch. The product layer allows
     one, after `apply then re-gate` — it has a deterministic schema gate between
     the two reads, which re-approves the changed document and makes the second
     read a different question. Nothing here does that, so a second read here
     would only produce new opinions.

  2. DISK. Nothing here may write a report. The product layer permits exactly
     two, review-NNN.md and qa-validation-NNN.md, because qa-evidence.sh and
     converge-gates.sh consume them deterministically. Those are inputs to a
     script, not stored opinions a human must find.

DO NOT merge them, and DO NOT add a check that keeps them byte-identical.
Divergence is the intended outcome, not the failure mode.
-->

Owns HOW review is dispatched in the internal layer: the counts, the fact that nothing reaches disk,
and what the caller owes a report it receives. WHAT each reader looks for belongs to that reader's own
definition.

Three commands dispatch under this skill: `/add-framework--build`, `/add-framework--plan` and
`/add-framework--brainstorm`. **The rule lives here and only here.** It used to be restated in each of
them, which is exactly how it survived in some and died in others.

## When to Use

- A command is about to dispatch `@plan-review-agent`, `@plan-readback-agent` or
  `@prompt-review-agent`.
- A report has come back and the caller is deciding what to do with it.

## When NOT to Use

- Writing the plan document itself — that is `add-plan-authoring`.
- Executing F-blocks and recording rulings — that is `add-build-ledger`.

---

## The Readers, and the Question Each Answers

| Reader | Asks | Returns |
|---|---|---|
| `@plan-review-agent` | "Can this be executed? What breaks?" | A verdict and required fixes |
| `@plan-readback-agent` | "Would someone with a clean context build the right thing?" | A restatement and every gap it filled in |
| `@prompt-review-agent` | "Does this artefact say one thing, once, where it belongs, and does it match its neighbours?" | The eight ruler items ticked with evidence, and a verdict. In `confirm` mode, only the items it was asked about |

**No two of them are opinions on one question.** A document can satisfy every rubric and still steer a
reader into building something else, and only the readback can see that. An artefact can be
executable, read back correctly, and still contradict the agent it dispatches — and only the third
reader looks at the neighbours.

**The first two read a DOCUMENT about work. The third reads the work.** That is what puts it in the
build's audit stage rather than beside the other two, and why a plan can dispatch it before any
document exists.

## The Counts

**The adversarial reviewer runs exactly once per subject.** One dispatch, no second opinion on work it
has already graded, no confirmation pass over fixes it asked for itself. There is no second review pass.

**The cold reader runs at most twice per subject.** The second exists for one case only: a rewrite
changed the text it read, so its first reading no longer describes the document on disk. There is no
third.

**Per SUBJECT, not per run, and the distinction is what makes the second reachable at all.** No
command dispatches the cold reader twice in one invocation, and none should: a document is not
rewritten in the middle of the step that reads it. The second reading happens when the plan goes back
to `/add-framework--plan`, is revised, and `/add-framework--build` is invoked again — a different
session, the same plan, its second and last cold read. A caller counts against the plan, not against
its own lifetime.

**The asymmetry is deliberate, not an oversight.** A rewrite changes what the cold reader reads, so a
second reading answers a genuinely different question. Running the adversarial reviewer again over
lightly edited work does not — it produces new opinions, and new opinions are indistinguishable from
progress while costing another full read.

**The prompt reviewer ticks all eight items exactly once per artefact per delivery, and may then
confirm the fixes exactly once.** Two dispatches, never three, and the second is not the first
repeated:

| Pass | Mode | Scope |
|---|---|---|
| First | `audit` at plan time, or `delivery` in the build when no audit read it | All eight items |
| Second | `confirm` in the build, on an artefact whose F-block cites a ruler item | Only the cited items, plus items 1 and 2 for collateral |

**The narrow scope is what makes the second pass legal.** A full re-tick would be a second opinion on
work already graded, which is what the reviewer above is forbidden. Confirming a named fix is a
different question with a bounded answer: did this change do what it was asked to do, and did it break
anything on the way. A pre-existing defect is out of scope there — it was already either reported or
missed by the full tick, and raising it in a confirmation turns it back into a loop.

**There is no third pass.** Whatever `confirm` returns is judged, applied or ruled on, and the
delivery moves on.

```
IF A FULL TICK HAS ALREADY COME BACK FOR THIS ARTEFACT IN THIS DELIVERY:
  ⛔ DO NOT: Dispatch @prompt-review-agent for another full tick
  ✅ DO: Dispatch `mode: confirm` with the item numbers, if fixes landed — once

IF A `confirm` HAS ALREADY COME BACK FOR THIS ARTEFACT:
  ⛔ DO NOT: Dispatch it again, in any mode
  ✅ DO: Apply what you accepted, rule on the rest, and move on

IF A REPORT HAS ALREADY COME BACK FOR THIS SUBJECT:
  ⛔ DO NOT: Dispatch @plan-review-agent again
  ⛔ DO NOT: Send it the corrected text "to confirm"
  ✅ DO: Apply what you accepted, and move on
```

⛔ **`@plan-review-agent` has no confirmation pass and gets none.** It reads a document that has not
been executed, so there is nothing to confirm — only opinions to re-form.

## Nothing Reaches Disk

**No dispatch here writes a file, and none may be asked to.** A report is returned to the caller,
read, acted on, and that is the whole lifecycle. It writes no file — not a companion document, not a
versioned artefact, not a verdict for a later command to find.

The reason is not tidiness. A report on disk becomes something a downstream command can gate on, and a
gate on a stored verdict is what turns one reading into a queue: someone must produce the file, someone
must find it, and a stale one is indistinguishable from a fresh one. What is worth keeping from a
report goes where decisions already go — the build ledger, as a ruling with its cost clause.

```
IF YOU WANT TO KEEP SOMETHING FROM A REPORT:
  ⛔ DO NOT USE: Write on docs/plans/, other than the ledger
  ⛔ DO NOT USE: Write on any path matching --review-v, --audit- or --verdict
  ⛔ DO NOT: Ask any reader to save its own report
  ✅ DO: Put what survives in the ledger, as a ruling
```

**This is the one invariant the readers cannot enforce for you.** `@plan-review-agent` holds no tool
restrictions at all, `@prompt-review-agent` holds none either, and the coordinator can write anywhere.
No frontmatter here stops a report reaching disk — the rule above is the only thing that does.

## What the Caller Owes the Report

**A finding is judged before it is applied. Never applied blindly.** The reader is a leaf: it read the
document, not the conversation that produced it, and not the constraints the caller is holding. Some of
what comes back is right, some rests on context the reader could not have, and telling the two apart is
the caller's job and nobody else's.

```
IF A REPORT HAS COME BACK:
  ⛔ DO NOT: Apply every finding mechanically because a reviewer wrote it
  ⛔ DO NOT: Discard a finding without saying why
  ✅ DO: Decide each one, and record the decision where decisions are recorded
```

**Record what you discarded, with the reason.** A ledger where every finding was applied is
indistinguishable from a caller that never read them. The discard is the evidence that judgement
happened.

**A cold reader's report is not a finding list at all.** It carries no verdict, so there is nothing to
accept or reject. Compare its restatement against what was actually decided. Where they diverge, the
**document** is what needs the edit — the reader is the instrument, not the suspect. A gap it marked
that turns out to be real is a gap in the text, whoever wrote it.

## Acting on the Verdict

| Verdict | Action |
|---------|--------|
| `ok` | Deliver |
| `fix-then-ok` | Apply every **Required fix** you accept that invents no user decision. Respect **Do not change**. Deliver |
| `blocked` | Below |

**`blocked` means a user decision is missing.** Present only the blockers that need one, and WAIT. Apply
the answers and deliver.

```
IF THE USER HAS ANSWERED A BLOCKER:
  ⛔ DO NOT: Send the document back for another reading
  ⛔ DO NOT: Treat the answer as a new subject that earns a fresh pass
  ✅ DO: Apply it and deliver
```

**One exception, and it belongs to the prompt reviewer in `audit` mode.** A planning command
dispatches it before there is a document, and its `blocked` items are questions about an artefact the
plan is about to change. Those do not stop the analysis: they become plan scope like any other failed
item, and the question reaches the user in the questionnaire that command already stops on. A second
stop inside the analysis step would make one audit cost a command round-trip.

```
IF @prompt-review-agent RETURNS `blocked` IN `audit` MODE:
  ⛔ DO NOT: Halt the analysis step and wait
  ✅ DO: Carry the item into the plan, and surface its question where the command already stops
```

**A `blocked` verdict already named its blockers exactly.** The user answered those and nothing else,
so a fresh reading differs from the first only by the answers — and it will find new opinions rather
than confirm old ones. Where the answer introduced a real problem, the cold reader is the net: it runs
inside the build, over the document as it finally stands, and it is the reader that catches text which
does not tell a builder what to build.

⛔ **A blocker the reviewer itself marks mechanical is not a user decision.** Apply it and continue.
⛔ **DO NOT invent a decision to clear a blocker.**

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The edits were substantial, it deserves another look" | Substantial edits are what the cold reader's second run is for. The reviewer still gets one |
| "I'll save the report so the next command can check it" | That is the gate this skill exists to remove. Put what matters in the ledger |
| "The reviewer said it, so it must be applied" | It read the document, not the constraints you hold. Judge each one |
| "I dropped the weak findings, no need to say which" | The discard IS the evidence of judgement. Unrecorded, it looks like you never read them |
| "The readback found a gap, so the readback failed" | The document failed. The reader is the instrument |
| "The confirm pass may as well re-tick everything while it is in there" | Then it is a second opinion, not a confirmation. Only the cited items, plus 1 and 2 |
| "The confirm pass spotted an old defect, I should report it" | It was there for the full tick. Raising it now reopens what the narrow scope closed |
| "The confirm came back fix-then-ok, so it needs another confirm" | There is no third pass. Apply, rule, move on |

## Rules

ALWAYS:
- Decide each finding on its merits, and record what was discarded and why
- Treat a divergent restatement as a defect in the document, never in the reader
- Present a `blocked` verdict's blockers to the user and wait

ALSO ALWAYS:
- Pass the ruler item numbers when dispatching `mode: confirm` — without them it is a full re-tick

NEVER:
- Ask any reader to write a file
- Gate a later command on a stored verdict
- Give the adversarial reviewer a second look at work it already graded, or a confirmation pass of any kind
- Run the cold reader a third time
- Tick all eight items twice over one artefact in one delivery
- Dispatch a second `confirm` over the same artefact

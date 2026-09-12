---
name: add-review-discipline
description: "Use when a command dispatches a reviewer or a cold reader over a document — how many times each runs, what makes a second dispatch legal, how a divergence is handled at each site, and where a verdict may reach disk."
---

# Review Discipline

<!-- uses:
- skill: add-plan-review
- skill: add-feature-readback
- skill: add-subagent-driven-development
- agent: plan-reviewer-agent
- agent: readback-agent
- agent: reviewer-agent
- command: /add.brainstorm
- command: /add.build
- command: /add.new
- command: /add.plan
- command: /add.plan-to-ready
- mention: add-code-review
- mention: converge-gates.sh
- mention: qa-evidence.sh
-->

<!--
A sibling skill of the same name lives in this repository's internal development
layer, which is never distributed. The duplication is DELIBERATE: that layer's
directory does not exist in a user's project, so nothing here can reference it,
and neither `uses:` block may name the other — a cross-layer target resolves
inside its own layer and dangles, which fails the build.

The two files carry the same subject and REACH OPPOSITE CONCLUSIONS in two
places, both on purpose. This one allows one re-dispatch after a re-gate; that
one allows none, because the internal layer has no schema gate between the two
reads. This one permits two verdicts on disk; that one permits none, because
nothing internal consumes a stored verdict deterministically.

DO NOT merge them, and DO NOT add a check that keeps them byte-identical.
Divergence is the intended outcome, not the failure mode.
-->

Owns HOW review is dispatched: the counts, what makes a second dispatch legal,
what a caller owes a report it receives, and the one boundary where a verdict may
be written to disk. WHAT each reader looks for belongs to that reader's own
rubric.

## When to Use

- A command is about to dispatch `@plan-reviewer-agent` or `@readback-agent`.
- A report has come back and the caller is deciding what to do with it.

## When NOT to Use

- Writing the review rubric itself — dimensions, severity, the verdict
  definition, the caps, the output shape. That is `add-plan-review`.
- The readback's protocol and report format. That is `add-feature-readback`.
- The fix loop, `MAX_ATTEMPTS`, the model escalation and the breaker. Those are
  `add-subagent-driven-development`.
- Code review checklists. That is `add-code-review`.

---

## The Readers, and the Question Each Answers

| Reader | Asks | Returns |
|---|---|---|
| `@plan-reviewer-agent` | "Can this be executed? What breaks?" | A verdict and required fixes |
| `@readback-agent` | "Would someone with a clean context build the right thing?" | A restatement and every gap it filled in. **No verdict** |
| `@reviewer-agent` in `MODE: re-review` | "Did this fix address the finding, and did it break anything on the way?" | One `ADDRESSED` or `NOT ADDRESSED` per open finding |

**No two are opinions on one question.** A document can satisfy every rubric and
still steer a reader into building something else, and only the readback sees
that. A fix can compile, pass the rubric and miss the finding, and only the
re-review sees that.

## The Counts, and What Makes a Second Dispatch Legal

**One dispatch, plus at most one re-dispatch, and the re-dispatch is legal ONLY
after `apply → re-gate`.**

```
IF A REPORT CAME BACK AND FIXES WERE APPLIED:
  ⛔ DO NOT: Re-dispatch before re-running the schema validation gate
  ⛔ DO NOT: Re-dispatch a second time, whatever the second report says
  ✅ DO: Apply, re-gate, re-dispatch once, then act on what comes back
```

**The re-gate is what makes the second read a different question.** The document
changed, and a deterministic schema gate re-approved it. Without that gate a
second read produces new opinions over lightly edited text, and new opinions are
indistinguishable from progress while costing another full read.

⛔ `@reviewer-agent` in `MODE: re-review` is counted **per fix round**, not per
subject, and its cap is `MAX_ATTEMPTS = 3` in
`{{skill:add-subagent-driven-development/SKILL.md}}`. That skill owns the loop;
this one only names where the boundary is.

⛔ **One site gets a single dispatch and no re-dispatch at all:**
`/add.build`'s readback at 10.0.4. Its divergence becomes a ruling rather
than an edit, so no document changes and there is no re-gate to earn a second
read.

## A Readback Divergence, by Site

Three sites, three behaviours, one reason each. **All three are correct.** Left
unwritten, the next caller copies whichever site it happens to read.

| Site | On divergence | Why |
|---|---|---|
| `/add.new`, `/add.brainstorm`, `/add.plan` | Apply the fix, re-run the gate, then **present the divergence and STOP** | A human is in the session and the document is still being written. Stopping is cheap and the answer is authoritative |
| `/add.plan-to-ready` | Apply the fix, re-run the gate, **re-dispatch once, record, advance.** Never stop | Autonomous by contract. It compares against its Decision Log, because comparing a report against its own source is circular |
| `/add.build` | Record a **ruling** naming the divergence and which reading was built. Continue | Execution is starting on a plan the user already approved. A stop costs a command round-trip on a decision already taken |

⛔ **A divergent restatement is a defect in the DOCUMENT, never in the reader.**
The reader is the instrument. A gap it marked that turns out to be real is a gap
in the text, whoever wrote it.

⛔ **The readback is never a gate.** It returns no verdict, so there is nothing to
block on. No command may report a blocked state on a readback alone.

## What the Caller Owes the Report

**A finding is judged before it is applied, never applied blindly.** The reader
is a leaf: it read the document, not the conversation that produced it, and not
the constraints the caller is holding. Some of what comes back is right, some
rests on context the reader could not have, and telling the two apart is the
caller's job.

**Record what was discarded, with the reason.** A record where every finding was
applied is indistinguishable from a caller that never read them. The discard is
the evidence that judgement happened — a ledger line in `/add.build`, a
line in the closing report everywhere else.

## Acting on the Verdict

| Verdict | Action |
|---------|--------|
| `ok` | Deliver |
| `fix-then-ok` | Apply every Required fix that invents no user decision. Respect **Do not change**. Re-gate, re-dispatch once, deliver |
| `blocked` | A user decision is missing. Present only the blockers that need one, and WAIT. Apply the answers and deliver |

⛔ **A blocker the reviewer itself marks mechanical is not a user decision.**
Apply it and continue.
⛔ **DO NOT invent a decision to clear a blocker.**

## Where a Verdict May Reach Disk

**Two files, and only because a deterministic script consumes them.**

`review-NNN.md` and `qa-validation-NNN.md` are written on purpose.
`qa-evidence.sh` promotes immutable run snapshots keyed to their report numbers,
and `converge-gates.sh` reads the review's `| **Overall** |` row and its
`> **QA baseline:**` line. Neither is a stored opinion a human must find; both
are inputs to a script that produces the same answer from the same bytes.

```
IF A READER'S OUTPUT WOULD REACH DISK:
  ⛔ DO NOT USE: Write for a @plan-reviewer-agent or @readback-agent report, in any form
  ⛔ DO NOT: Gate a later command on a report no script consumes
  ✅ DO: Store a verdict only where a deterministic script reads it — today,
         review-NNN.md and qa-validation-NNN.md, and nothing else
```

⛔ **Do not import the internal layer's no-file rule and delete the review
document.** It carries the QA baseline and the routed correction contract, and
two gates read it.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The edits were substantial, it deserves another look" | One re-dispatch, after the re-gate. That IS the second look |
| "I'll re-dispatch first and re-run the gate after" | Then the reader read text no gate approved, and the second read is not a different question |
| "The reviewer said it, so it must be applied" | It read the document, not the constraints you hold. Judge each one |
| "I dropped the weak findings, no need to say which" | The discard IS the evidence of judgement. Unrecorded, it looks like you never read them |
| "The readback found a gap, so the readback failed" | The document failed. The reader is the instrument |
| "The readback diverged, so this subfeature is BLOCKED" | It issues no verdict. A blocker comes from the reviewer, never from a restatement |
| "add.build's readback diverged, I'll stop and ask" | That site rules and continues. The approval already happened |
| "No script reads it, but the file is useful to keep" | That is the gate this boundary exists to refuse |

## Rules

ALWAYS:
- Re-run the validation gate between a fix and a re-dispatch
- Decide each finding on its merits, and record what was discarded and why
- Treat a divergent restatement as a defect in the document, never in the reader

NEVER:
- Re-dispatch a reader twice over one subject
- Report a blocked state on a readback alone
- Write a `@plan-reviewer-agent` or `@readback-agent` report to disk
- Merge this skill with its internal sibling, or check them for equality

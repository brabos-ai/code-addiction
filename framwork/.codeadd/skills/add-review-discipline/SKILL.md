---
name: add-review-discipline
description: "Use when a command dispatches a reviewer or a cold reader over a document, or when /add.build runs its final review over a delivery unit — how many times each runs, what makes a second dispatch legal, how a divergence is handled at each site, and where a verdict may reach disk."
---

# Review Discipline

<!-- uses:
- skill: add-plan-review
- skill: add-feature-readback
- skill: add-subagent-driven-development
- agent: plan-reviewer-agent
- agent: readback-agent
- agent: reviewer-agent
- agent: fix-agent
- mention: /add.brainstorm
- mention: /add.review
- command: /add.build
- command: /add.new
- command: /add.plan
- mention: add-code-review
- mention: add-delivery-mode
- mention: converge-gates.sh
- mention: qa-evidence.sh
- script: review-package.sh
- script: build-ledger.sh
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
- `/add.build` has finished a delivery unit's last area and runs its final review.

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
| `@reviewer-agent` in `MODE: feature` | "What breaks only when the unit's areas are read together, and is every RF/RN met?" | Findings by severity — Critical is a `blocker` |
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

Two sites, two behaviours, one reason each. **Both are correct.** Left
unwritten, the next caller copies whichever site it happens to read.

⛔ **`/add.new` and `/add.brainstorm` are absent from this table because neither
dispatches a readback any more.** `/add.plan` runs the only one in the flow, and
its target is the whole feature folder, so nothing goes unread — it is read once
instead of twice.

| Site | On divergence | Why |
|---|---|---|
| `/add.plan` | Apply the fix, re-run the gate, then **present the divergence and STOP** | A human is in the session and the document is still being written. Stopping is cheap and the answer is authoritative — on an automatic delivery this is still a deciding stop, per `add-delivery-mode` |
| `/add.build` | Record a **ruling** naming the divergence and which reading was built. Continue | Execution is starting on a plan the user already approved. A stop costs a command round-trip on a decision already taken |

⛔ **A divergent restatement is a defect in the DOCUMENT, never in the reader.**
The reader is the instrument. A gap it marked that turns out to be real is a gap
in the text, whoever wrote it.

⛔ **The readback is never a gate.** It returns no verdict, so there is nothing to
block on. No command may report a blocked state on a readback alone.

## What a Surviving Pass Costs

**Three of these rules already have an owner, and this skill names it rather than
carrying a copy.** `{{skill:add-subagent-driven-development/SKILL.md}}` owns the fix
loop, the scoped re-review and the breaker — this file’s own When NOT to Use
already says so. Read them there:

| Rule | Owner |
|---|---|
| The re-review verdicts each open finding `ADDRESSED` / `NOT ADDRESSED` against the fix diff, never re-reading the document | `add-subagent-driven-development`, Fix Loop |
| The round cap, and adjudicating only at the cap | `add-subagent-driven-development`, The Breaker |

**One rule is not owned anywhere else, so it lives here:**

### One fix dispatch carries the whole findings list

Never one fixer per finding. A per-finding fix wave on a real delivery cost more
than every task it was reviewing, because each dispatch re-reads the same context
to change one line.

### A third pass that still finds real problems is pointing upstream

```
IF A THIRD PASS RETURNS NON-TRIVIAL FINDINGS:
  ⛔ DO NOT: Run a fourth
  ✅ DO: Fix the source — a weak spec, a contradiction, or an ambiguous rule
```

**The defect is above the change, not in it.** Another pass over the same
document buys a longer list, never a better document.

## The Build's Final Review

**`/add.build` runs this once per delivery unit — the feature, or one epic subfeature — after its last
area and before `## Loop End`.** It is what makes `/add.review` optional at close-out: the verdict it
writes is the one `converge-gates.sh` reads when no newer review exists.

1. **Package the whole unit** with `review-package.sh`. `BASE` is the commit the unit's first area started from — the ledger's
   first `complete` line for the unit names it.

   ```bash
   bash .codeadd/scripts/review-package.sh "${BASE}" "$(git rev-parse HEAD)" "${FEATURE_DIR}/_build"
   ```

   Exit 2 means an empty range: nothing was built, so there is nothing to review. Record
   `Final review: passed (after review-NNN)` and stop here.
2. **DISPATCH AGENT: `@reviewer-agent`** [read-only] with `MODE: feature`, the package path and the
   unit's `about.md` / `plan.md` paths. **In the same parallel batch**, and only when the package
   touches a sensitive area — authentication, payment, file upload, input handling or validation,
   session or token paths, the trigger `/add.review` STEP 4.1 names — dispatch a second
   `@reviewer-agent` with `MODE: owasp` and those files. On the epic's last subfeature, the DELTA
   pass's findings join this list.
3. **Number the findings** `FR-1`, `FR-2`, … in report order — the reviewer returns none — then
   **judge every one**; see What the Caller Owes the Report below. Record each discard.
4. **One `@fix-agent` wave** carrying every accepted finding, then `/add.build` STEP 12.2's scoped
   re-review of the fix diff only. There is no second wave.
5. **Sort what is still open.**
   - Not Critical → one `Ruling:` ledger line each; the delivery continues.
   - **Critical — a `blocker` — is never turned into a `Ruling:`.** It stops the delivery.
6. **Write the verdict**, through `build-ledger.sh`, exactly one of:

   ```
   Final review: passed (after review-NNN)
   Final review: ruled N (after review-NNN)
   Final review: blocked N (after review-NNN)
   ```

   `NNN` is the highest `review-NNN.md` in the feature folder at this moment, `000` when there is
   none. On `blocked`, write one line per open blocker right after it:

   ```
   Blocker suggestion: <finding id> — <ready-to-paste command>
   ```

   **The suggestion is reasoned from the unit's objective** in `about.md` / `plan.md`: the fix
   direction you recommend and the command that carries it out, whether the plan itself needs
   revisiting (`/add.plan <ID>`), or that `/add.review <ID>` would add the evidence to decide. The
   command is complete — feature ID and arguments included — so the user copies it and runs it.

```
IF A FINDING IS STILL CRITICAL AFTER THE FIX WAVE:
  ⛔ DO NOT: Write it as a Ruling: line to keep the delivery moving
  ⛔ DO NOT: Write `blocked N` with no Blocker suggestion: lines
  ✅ DO: Write `blocked N`, one suggestion per blocker, and print them before the next stop
```

**Why a ledger line and not a review document:** `review-NNN.md` belongs to `/add.review` alone. The
line is a ledger event, and `converge-gates.sh` reads it deterministically — see Where a Verdict May
Reach Disk.

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

**Two files and one ledger line, and only because a deterministic script consumes them.**

`review-NNN.md` and `qa-validation-NNN.md` are written on purpose, and so is the build's
`Final review:` line in `build-ledger.md`, which `converge-gates.sh` reads as gate 1's verdict when
no newer review exists.
`qa-evidence.sh` promotes immutable run snapshots keyed to their report numbers,
and `converge-gates.sh` reads the review's `| **Overall** |` row and its
`> **QA baseline:**` line. Neither is a stored opinion a human must find; both
are inputs to a script that produces the same answer from the same bytes.

```
IF A READER'S OUTPUT WOULD REACH DISK:
  ⛔ DO NOT USE: Write for a @plan-reviewer-agent or @readback-agent report, in any form
  ⛔ DO NOT: Gate a later command on a report no script consumes
  ✅ DO: Store a verdict only where a deterministic script reads it — today,
         review-NNN.md, qa-validation-NNN.md and the ledger's Final review: line,
         and nothing else
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
- Send one fix dispatch carrying every finding, never one per finding
- Write a blocked final review with one ready-to-paste suggestion per blocker
- Re-run the validation gate between a fix and a re-dispatch
- Decide each finding on its merits, and record what was discarded and why
- Treat a divergent restatement as a defect in the document, never in the reader

NEVER:
- Run a pass after a third that still found real problems — fix the source
- Re-dispatch a reader twice over one subject
- Report a blocked state on a readback alone
- Write a `@plan-reviewer-agent` or `@readback-agent` report to disk
- Turn a Critical finding of the build's final review into a `Ruling:`
- Merge this skill with its internal sibling, or check them for equality

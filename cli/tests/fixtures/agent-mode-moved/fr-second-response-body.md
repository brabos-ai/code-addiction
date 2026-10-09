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

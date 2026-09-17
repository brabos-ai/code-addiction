# The product pipeline catches up

**2026-09-16** · product layer, with an internal documentation sweep
· plan `2026-09-16T205633-PLAN--product-pipeline-parity`

## Why

Three internal deliveries earlier the same day gave this repository's own pipeline an objective that
travels, one approval that can carry a delivery to the PR question, and a brainstorm that drafts the
objective and recommends by name. The pipeline users install had none of it. Its objective ended with
the brainstorm, every stage asked for an approval that decided nothing, and unattended delivery lived
in a separate 958-line command, `/add.plan-to-ready`, that had to be kept consistent with the pipeline
by hand.

## What changed

**One approval, recorded once.** `/add.brainstorm` ends on three options — confirm each stage, deliver
automatically, keep discussing — and writes the answer as `delivery:` in the intent file. `/add.plan`
copies it into `plan.md`'s header. The new skill `add-delivery-mode` owns what each value does: which
stops wait (deciding) and which print and continue (confirming), and how a command hands off — the
same agent reads the next command's file and runs it from its first step.

**The chain.** On automatic, `/add.brainstorm → /add.new → /add.plan → /add.build ⇄ /add.review` runs
without waiting until a deciding stop or the build's publish question. The build ⇄ review loop runs at
most two review rounds, counted from a baseline `/add.build` writes to its ledger. After the second
review the publish question prints whatever is still open. `/add.done` is never reached unattended.

**Epics.** When `/add.new` splits a feature on automatic, it asks once: every pending subfeature
unattended, or a stop between subfeatures. The answer lives in `epic.md`.

**The objective travels.** The brainstorm drafts it and the user corrects it. The `brainstorm`,
`brainstorm-intent`, `feature` and `feature-plan` schemas all carry `## Objective`; `about.md` and
`plan.md` copy it verbatim. Each subfeature of an epic states how it serves it, or the split stops
with both readings. The plan reviewer gains a ninth dimension, `Objective fit`.

**The brainstorm conducts like the internal one.** A section checklist scaled by path; outside
practice named, with the project winning a conflict; `Used by` filled from the graph or `NOT
VERIFIED`; the architectural document always written and self-reviewed; the inline "write `about.md`
now" offer gone — `/add.new` writes it with its id, directory and gate.

**`/add.plan-to-ready` is removed.** Its three unique capabilities have new owners: `/add.build`'s new
`## Loop End` runs the Checkpoint Sequence (moved whole) and the epic-wide gate; `/add.plan` dispatches
the consistency judge's FULL pass; `/add.build` dispatches its DELTA pass. Checkpoint tags are now
pushed with the branch at the publish question, never mid-delivery. Every reference across ten skills,
the router, the close-out, README and the docs page names the new owner.

## What the checks found

Walking the chain against the final text found two gaps in `/add.build`: the publish question would
have run before the first review, and a confirmed epic's last subfeature could not reach its
checkpoint. Both were fixed. The review over the finished delivery returned twenty-two findings; five
came from this delivery and were applied, the rest predate it and are recorded as known.

## Not included

- `add.diagnose`, `add.hotfix` and `add.qa-setup` do not join the chain.
- The SVG diagrams and the docs page's hand-maintained graph are left to `add-framework--sync`.
- Existing brainstorm documents in user projects keep their old sections; nothing re-validates them.

## Cost accepted

On an automatic delivery the user sees no code until the publish question. A checkpoint tag stays
local until the branch is published, so a fresh clone cannot resume an epic before then.

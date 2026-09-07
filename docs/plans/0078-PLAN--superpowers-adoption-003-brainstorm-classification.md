# Plan: Brainstorm Path Classification — three paths, announced, with one approval gate that never scales

> **Status:** implemented
> **Type:** product (1 command)
> **Created:** 2026-09-07
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-003-brainstorm-classification.md`.
It carries the path definitions, the red flags and the rejected alternatives; this plan names the F-blocks
and their proof.

Independent of topics 001 and 002. It can land at any point; it is sequenced last only because it is the
smallest.

## Problem

**`add.brainstorm` has no classification at all.** Its seven steps run the same way for every topic:
context → one-question-at-a-time exploration → 2-3 candidate directions → document → schema gate →
`@plan-reviewer-agent` → `@readback-agent` → handoff.

So a feasibility question costs a design document, and a one-file change against code that is already here
costs a schema gate and two agent dispatches. The only way out today is the user manually stopping the
command — which is the user compensating for the command, not the command doing its job.

## Proposal

One command, four F-blocks. The exploration technique, the schema gate, the reviewer and the readback are
untouched; what changes is **which requests reach them**.

## Scope

### Includes

- **F1** — `framwork/.codeadd/commands/add.brainstorm.md`: a classification step between STEP 1 (context) and
  STEP 2 (exploration). It sorts the request into **spike**, **bounded** or **architectural**, **says the
  classification out loud in one line**, and continues on that path unless the user overrides it. The
  announcement is its own turn — classifying and asking the first question in one breath denies the user the
  correction. Two rules travel with the definitions: **bounded measures the repository, not familiarity**
  (no existing flow to read and modify ⇒ architectural), and **when in doubt between two paths, take the
  heavier one**.
- **F2** — Same file: path routing. **Spike** — present the question and the probe in 2-3 sentences, get a
  nod, investigate, report a recommendation; anything built is labelled throwaway; STEPS 3, 4 and 5 are
  skipped entirely. **Bounded** — the clarifying questions that matter, then a short design **in chat**
  (approach, files touched, how it is tested); STEPS 3-5 skipped. **Architectural** — today's flow, byte
  unchanged. **STEP 6's handoff runs on all three paths**: a spike still routes to `/add.diagnose`, a bounded
  design still routes to `/add.new`.
- **F3** — Same file: two rules stated as rules, not as prose. **The ratchet is one-way** — hidden complexity
  discovered mid-conversation upgrades the path (stop, say so, re-classify, continue heavier); nothing
  downgrades; a spike whose answer is "yes, and here is how" is not permission to build, it is a new request
  with its own classification. **The approval gate never scales** — every path ends with the user approving
  the intent before implementation; what scales with simplicity is the artifact, never the approval.
- **F4** — Same file: a red-flags table naming the rationalisations that defeat the mechanism — "too simple
  to need a design", "I'll call it bounded and skip the spec", "I understand this kind of app so it's
  bounded", "the spike works so I'll keep the code", "it grew but I'm almost done" — each with the reality
  that answers it. Plus an MIT credit line to
  [`obra/superpowers` `brainstorming`](https://github.com/obra/superpowers/tree/main/skills/brainstorming),
  matching the form `add-investigation/SKILL.md:177` already uses.

### Does NOT Include (important!)

- **Changing the one-question-per-turn cadence or the 20-word `OUTPUT RULE`.** Both stay exactly as they are.
- **Changing the `brainstorm` schema, STEP 4's validation gate, STEP 5's `@plan-reviewer-agent` verdict
  handling, or the `@readback-agent` sub-step.** All four keep working exactly as today — on the
  architectural path.
- **The visual companion** from the upstream skill. It depends on a local server the framework does not ship,
  and four of five providers could not run it.
- **The internal command.** `0078-SELF-PLAN--superpowers-adoption-003-brainstorm-classification` owns it.
- Anything in topics 001 or 002.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| The classification is announced, not internal | A classification the user cannot see is one they cannot correct, and they are the one who knows whether the flow already exists | Routing silently on an internal judgement |
| The announcement is its own turn | Classifying and asking in one breath denies the correction the announcement exists to invite | Announcing inline with the first question |
| Bounded is measured against the repository | Familiarity with a kind of change is not the same as having the flow in front of you; this is the misclassification that costs most | Letting the model judge by confidence |
| The ratchet is one-way | Downgrading mid-conversation is how a task talks itself out of the process it needed | Re-classification in both directions |
| The approval gate is identical on all three paths | "Too simple to need approval" is where unexamined assumptions cost the most | Skipping approval on the spike path |
| STEP 6's handoff runs on all three paths | A spike that found a bug still has somewhere to go | Binding the handoff to the architectural path |

## Accepted Trade-offs

- **A misclassified request costs a restart.** Accepted, and mitigated by announcing before the first
  question — the user corrects it at the cheapest possible moment.
- **Spike and bounded produce no durable record.** Accepted — that is the point. Recording every answer as a
  document is what this change exists to stop.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| Everything is classified bounded to skip the document | High | High | F4's table names it; F1 requires bounded to point at the existing flow being changed; L4.2 tests a request with no existing flow and expects architectural |
| The path is announced but the command proceeds without waiting | Medium | High | F1 requires the announcement to be its own turn; L4.1 checks the transcript for two turns, not one |
| A conversation that grows stays on the light path | Medium | High | F3's ratchet is stated as a rule and repeated in F4's table as a rationalisation |
| The architectural path is subtly altered while adding the routing | Medium | High | L3 is a preservation level: STEPS 3-6 must be byte-identical in substance |

## Ecosystem Impact

| Artefact | Action | Reason |
|---|---|---|
| `framwork/.codeadd/commands/add.brainstorm.md` | modify | all four F-blocks |

Nothing else. No skill, no agent, no schema, no registry entry, no script. Command count unchanged at 16.

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.**

### L1 — Build-side (RED → GREEN)

1. `node scripts/build.js` exits 0 and `add.brainstorm.md` builds to all 5 providers.
   *Green today; a preservation guard.*
2. `checkArtefactGraph` emits no new warning against a pre-F1 baseline.

### L2 — Command content (RED → GREEN)

1. The command defines all three paths, names them, and instructs that the classification be **announced**.
   *RED today: no classification exists.*
2. The "bounded measures the repository" rule and the "when in doubt, take the heavier path" rule are both
   present. *RED today.*
3. The one-way ratchet and the "approval never scales" rule are both present. *RED today.*
4. The red-flags table is present with at least the five rationalisations named in F4, and the MIT credit
   line is present. *RED today.*

### L3 — Preservation (green throughout)

1. The `OUTPUT RULE` 20-word cap and the one-question-per-turn cadence survive verbatim.
2. STEP 3's schema load, STEP 4's validation gate, STEP 5's `@plan-reviewer-agent` verdict loop and readback,
   and STEP 6's `[HARD STOP]` all survive in substance. **A diff that touches their logic fails this level**,
   whatever it does to the routing.
3. The `⛔ HARD GATE — READ-ONLY + NO-INVOKE` block survives verbatim. The new paths inherit it; none of them
   may invoke another command.

### L4 — Behavioural acceptance (dogfood, manual)

1. Ask a feasibility question ("can the build gate read a nested `.gitignore`?"). The command announces
   **spike** in its own turn, waits, then probes and reports a recommendation. **No document is written and
   `@plan-reviewer-agent` is never dispatched.**
2. Ask for a change to a flow that does not exist in the repo. The command announces **architectural**, not
   bounded — this is the misclassification the plan is most exposed to.
3. Ask for a flag on an existing command. The command announces **bounded**, asks the questions that matter,
   presents a short design in chat, and **stops** until approval.
4. Start a bounded conversation that turns out to need a new subsystem. The command stops, says the path is
   upgrading, and re-classifies as architectural.

**RED expectations against the current tree:** L2.1–L2.4 and all of L4 fail today.
**GREEN = every level passes after F1–F4.**

## Execution Order

`F1 → F2 → F3 → F4`, with the whole matrix written and confirmed RED before F1.

- **F1 before F2** because the routing switches on a classification that must already be defined.
- **F3 and F4 are one landing.** The ratchet stated in prose without its rationalisation in the table is the
  rule most likely to be talked around, and the table without the rule has nothing to point at.
- **L3's baseline is captured before F1** — the pre-change text of STEPS 3-6, so preservation is proved by
  comparison and not by assertion.

**Safe stopping points:** none inside this plan. It is four F-blocks in one file, and a command that
classifies without routing (F1 without F2) announces a decision it then ignores — worse than not classifying
at all. Land all four or none.

## Reviewer Handoff

`/add-framework--shared-review` must audit this without re-reading the design doc. The evidence file carries:

- **What changed** — the four F-blocks against one file.
- **The L3 baseline**, captured verbatim before F1, beside its post-change re-read. This is the level that
  matters most: the plan's whole claim is that the architectural path is untouched.
- **The four L4 transcripts.** L4.2 and L4.4 are the two the build is most likely to claim rather than run.

Specific gaps a reviewer must actively hunt:

1. The architectural path altered "while we were in there" — L3.2 exists precisely because that edit is
   tempting and invisible in a summary.
2. F1 landed without the its-own-turn requirement, collapsing the announcement into the first question.
3. The red-flags table present but toothless — a table of five entries that does not include
   "I'll call it bounded and skip the spec" is missing the one that matters.

## References

- Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-003-brainstorm-classification.md`
- Umbrella: `docs/plans/0078-PLAN--superpowers-adoption-000-umbrella.md`
- Internal twin: `docs/plans/0078-SELF-PLAN--superpowers-adoption-003-brainstorm-classification.md`
- Upstream: `superpowers@6.3.0` `brainstorming` (MIT, Jesse Vincent)
- Credit precedent: `add-investigation/SKILL.md:177`

## Next Steps

/add-framework--build 0078-PLAN--superpowers-adoption-003-brainstorm-classification

Then, for the internal layer:

- `/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-003-brainstorm-classification`

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `26a746b` on branch `feat/superpowers-adoption` (PR #34) |

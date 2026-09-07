# Brainstorm: Superpowers Adoption 003 — Brainstorm Path Classification

> **Status:** final (ready for `/add-framework--self-plan` + `/add-framework--plan`)
> **Date:** 2026-09-07
> **Type:** command
> **Umbrella:** `docs/brainstorming/2026-09-07T005046-superpowers-adoption-000-umbrella.md`
> **Depends on:** nothing — independent of topics 001 and 002

## Discovery

Measured against the live repo at `58e916d`:

- **`add.brainstorm.md` has no classification at all.** Its seven steps run the same way for every topic:
  context → one-question-at-a-time exploration → 2-3 candidate directions → document → schema gate →
  `@plan-reviewer-agent` → `@readback-agent` → handoff.
- **`add-framework--shared-brainstorm.md` classifies, but on a different axis and in secret.**
  `### 2.2 Classification` sorts the idea by *type* (command / skill / script / workflow / product /
  architecture), *scope* (simple / complex) and *framework impact* — then states
  **"Do NOT reveal classification explicitly yet."** `### 3.1` sizes the same idea again as
  umbrella-worthy or not.
- **Both always produce a document.** There is no path where the answer is a sentence in chat.
  `add.brainstorm` STEP 3 is gated on "ONLY IF User Requests", but every path that produces anything runs
  STEP 4's schema gate, STEP 5's `@plan-reviewer-agent` and the `@readback-agent`.
- **`### 4.1` is already credited** as *"Conversational Exploration (Adapted from superpowers:brainstorming)"*.
  The exploration technique was ported; the path classification was not.
- **The exploration cadence is one question per turn**, capped at 20 output words in `add.brainstorm`
  (its `OUTPUT RULE`). A three-question topic costs three round trips whatever its size.

## Context & Motivation

The two brainstorm commands are built for one shape of question: an architectural one. That is the right
default, and it is what makes them good. But every question pays the architectural price.

Superpowers' contribution here is small and specific: **classify the request by how much process it needs,
say the classification out loud, and let the human override it.** Three paths, one approval gate that never
scales down.

## Problem / Opportunity

**A feasibility question costs a design document.** "Can the build gate read a nested `.gitignore`?" has an
answer, not a spec. Today the only routes are a full exploration or the user manually stopping the command.

**A one-file change costs a schema gate and two agent dispatches.** Adding a flag to an existing command is
bounded work against code that is already here to read. The document, the `brainstorm` schema validation, the
`@plan-reviewer-agent` dispatch and the `@readback-agent` dispatch all run anyway.

**The secret classification cannot be corrected.** `add-framework--shared-brainstorm.md:138` explicitly
forbids revealing it. A classification the human cannot see is one they cannot argue with — and they are the
one who knows whether the flow being changed already exists in the repo.

**And the risk runs the other way too.** Nothing today upgrades a conversation that started small and turned
out not to be. A brainstorm that discovers hidden complexity halfway has no rule telling it to stop and
re-classify.

## Proposal

### Part 1 — Three paths, announced before the first question

A new step runs before exploration in both commands. It classifies the request, **says the classification out
loud in one line**, and continues on that path unless the human overrides it.

| path | what it is | what it produces |
|---|---|---|
| **spike** | a feasibility question — "can we…", "is it possible…", "quick and dirty is fine" | an answer. Present the question and the probe in 2-3 sentences, get a nod, investigate, report a recommendation. Anything built is labelled throwaway. No document. |
| **bounded** | a well-scoped change to code **that already exists in this repo** | the clarifying questions that matter, then a short design **in chat** — approach, files touched, how it is tested. No document. |
| **architectural** | new subsystems, changes that restructure how parts fit together, or that alter an interface others depend on | the current full flow: exploration, 2-3 candidate directions, document, schema gate, `@plan-reviewer-agent`, `@readback-agent`, handoff. |

**Bounded measures the repository, not familiarity.** Understanding the kind of change is not enough — if
there is no existing flow to read and modify, the work is architectural. In `add-framework--*` this is
concrete: a change to an artefact that already exists is bounded; a new command, skill or agent is not.

**When in doubt between two paths, take the heavier one.**

### Part 2 — The ratchet is one-way

Hidden complexity discovered mid-conversation **upgrades** the path: stop, say so, re-classify, continue on
the heavier path. Nothing downgrades mid-conversation. A spike whose answer is "yes, and here is how" does
not become permission to build — that is a new request and gets its own classification.

### Part 3 — The approval gate never scales

Every path ends with the human approving the intent before anything is implemented. What scales with
simplicity is the **artifact**, never the approval. A bounded design may be two sentences in chat; it is
still presented, and the command still stops until the human says yes.

This is already true of both commands — `add.brainstorm`'s STEP 6 is a `[HARD STOP]` that prints a suggested
command as text and refuses to invoke it. The new paths inherit that rule rather than replacing it.

### Part 4 — What each command keeps

**`add.brainstorm` (product):** the three paths route STEP 2. The spike path skips STEPS 3-5 entirely; the
bounded path skips them too and delivers its short design in chat; the architectural path is today's flow
unchanged. STEP 6's handoff runs on all three — a spike still routes to `/add.diagnose`, a bounded design
still routes to `/add.new`.

**`add-framework--shared-brainstorm` (internal):** the new classification joins `### 2.2` and **replaces its
secrecy rule**. The existing type/scope/impact sizing is not removed — it answers a different question
(*which* artefacts, *how many* topics) and still feeds STEP 3's decomposition offer. What changes is that the
effort path is announced, and that STEPS 5-6 (document, `@plan-review-agent`) run only on the architectural
path.

**`add-framework--shared-brainstorm`'s existing credit line stays**, and a second one is added for the
path classification.

## Scope

### Includes

- A classification step in both commands, announced in one line, overridable by the human.
- Spike, bounded and architectural routing, with the document / gate / review steps bound to the
  architectural path only.
- The one-way ratchet rule.
- An explicit statement that the approval gate does not scale with the path.
- Replacing `add-framework--shared-brainstorm.md:138`'s "do not reveal" instruction.
- A red-flags table in both commands, naming the rationalisations that skip the gate.
- MIT credit to `obra/superpowers brainstorming` for the path classification.

### Does NOT Include

- Removing the existing type / scope / framework-impact classification in the internal command — it answers
  a different question and still feeds decomposition.
- Changing the one-question-per-turn cadence or the 20-word output rule.
- Changing the schema, the `@plan-reviewer-agent` verdict handling, or the readback — all three keep working
  exactly as today on the architectural path.
- The visual companion from superpowers' brainstorming skill — it depends on a local server the framework
  does not ship.
- Anything in topics 001 or 002.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| The classification is announced, not internal | A classification the human cannot see is one they cannot correct, and they are the one who knows whether the flow already exists | Keeping `2.2`'s "do not reveal" and routing silently |
| The existing type/scope classification stays alongside | It answers "which artefacts, how many topics"; the new one answers "how much process". Different questions | Replacing it — decomposition would lose its input |
| Bounded is measured against the repository | Familiarity with a kind of change is not the same as having the flow in front of you; this is the misclassification that costs most | Letting the model judge by confidence |
| The ratchet is one-way | Downgrading mid-conversation is how a task talks itself out of the process it needed | Allowing re-classification in both directions |
| The approval gate is identical on all three paths | "Too simple to need approval" is where unexamined assumptions cost the most | Skipping approval on the spike path |
| No visual companion | It depends on a local server the framework does not ship, and four of five providers could not run it | Porting it behind a capability flag |

## Accepted Trade-offs

- **A misclassified request costs a restart.** Accepted, and mitigated by announcing the classification
  before the first question — the human corrects it in one line, at the cheapest possible moment.
- **Two classifications now run in the internal command.** Accepted: they are asked at different steps and
  answer different questions, and collapsing them would lose the decomposition input.
- **Spike and bounded paths produce no durable record.** Accepted — that is the point. A spike's output is an
  answer, and recording every answer as a document is what the change exists to stop.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| Everything gets classified bounded to skip the document | High | High | "Reaching for a label to skip work IS the doubt — take the heavier path" is a named red flag; bounded requires pointing at the existing flow being changed |
| A spike's throwaway code is kept | Medium | Medium | Anything built on a spike path is labelled throwaway in the report; keeping it is a new request with its own classification |
| The path is announced but the command proceeds without waiting | Medium | High | The announcement and the first question are separate turns; the existing `[HARD STOP]` discipline covers the approval |
| A conversation that grows stays on the light path | Medium | High | The ratchet rule is stated as a red flag, not only as prose: "it grew, but I'm almost done" is listed as a rationalisation |

## Ecosystem Impact

**Product layer:**

- `framwork/.codeadd/commands/add.brainstorm.md` — new classification step, path routing on STEPS 3-5,
  red-flags table, credit line

**Internal layer:**

- `.claude/commands/add-framework--shared-brainstorm.md` — `### 2.2` gains the effort classification and
  loses the secrecy rule; STEPS 5-6 bind to the architectural path; red-flags table; second credit line
- `.opencode/commands/add-framework--shared-brainstorm.md` — mirrored adapter

**Not touched:** every skill, every agent, `provider-map.json`, `scripts/build.js`, the schemas.

## Next Steps

1. `/add-framework--plan` for the product half — one command file.
2. `/add-framework--self-plan` for the internal half — one command file plus its adapter.
3. Independent of topics 001 and 002; can land at any point.

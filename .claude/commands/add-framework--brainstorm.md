# ADD Brainstorm - Collaborative Ideation & Design Explorer

<!-- uses:
- skill: add-artefact-graph
- agent: framework-discovery-agent
- agent: plan-review-agent
- skill: add-final-report
- skill: add-review-discipline
- mention: /add-framework--build
- command: /add-framework--plan
- mention: add-plan-authoring
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Transforms rough ideas into fully-formed, final designs ready for `/add-framework--plan`. Pairs discovery-first ecosystem context with conversational exploration. Outputs documented designs with zero open questions.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**

```
STEP 1: Capture topic & discover context → detect mode, capture topic, dispatch agent
STEP 2: Understand the idea            → clarifying questions + 2.2 classification — PATH ANNOUNCED, OWN TURN
STEP 3: Validate complexity            → ARCHITECTURAL PATH ONLY — simple or umbrella-worthy
STEP 4: Explore & validate decisions   → conversational ideation (abbreviated on spike / bounded)
STEP 5: Generate design document       → ARCHITECTURAL PATH ONLY — write draft design (no open questions)
STEP 6: Review design                  → ARCHITECTURAL PATH ONLY — @plan-review-agent before any delivery
STEP 7: Completion & next steps [HARD STOP] → ALL THREE PATHS — print suggested command as text, STOP
STEP 8: Continue Mode (JUMP FROM STEP 1.0 only) → topic refinement from umbrella spec
```

**⛔ HARD GATE — ROLE BOUNDARY:**

`brainstorm` DISCUSSES, EXPLORES, DOCUMENTS. It NEVER implements code AND NEVER invokes another command.

```
IF ABOUT TO INVOKE A COMMAND OR SKILL (ANY STEP):
  ⛔ DO NOT USE: Skill tool (invoking any skill or command)
  ⛔ DO NOT invoke: /add-framework--plan
  ⛔ DO NOT invoke: /add-framework--build
  ✅ DO: At STEP 7 handoff, print the suggested command as plain text, then STOP
```

---

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF USER ASKS OPEN-ENDED QUESTION DURING STEP 4:
  ⛔ DO NOT MOVE TO STEP 5 (document generation)
  ⛔ DO NOT LEAVE UNANSWERED QUESTIONS IN DESIGN
  ✅ DO: Continue asking until every section is 100% clear and validated

IF DESIGN DOCUMENT IS INCOMPLETE:
  ⛔ DO NOT WRITE TO docs/brainstorming/
  ⛔ DO NOT SUGGEST /add-framework--plan
  ⛔ DO NOT MARK AS ready-for-implementation
  ✅ DO: Return to STEP 4, identify missing sections, continue exploration

IF DESIGN FILE NOT YET REVIEWED BY @plan-review-agent:
  ⛔ DO NOT: Present the design path or next-step commands as delivered
  ✅ DO: Run STEP 6

IF REVIEW VERDICT IS blocked:
  ⛔ DO NOT present the design as ready
  ⛔ DO NOT print next-step commands
  ✅ DO: Return to STEP 4 with the blockers — do not invent answers

IF USER WANTS TO REFINE A TOPIC FROM UMBRELLA:
  ⛔ DO NOT PROCEED WITHOUT UMBRELLA SPEC REFERENCE
  ✅ DO: Ask user to provide the umbrella path in the SET form STEP 5.1 declares (a unique slug fragment also resolves)

```

---

## STEP 1: Capture Topic & Discover Context

### 1.0 Detect Invocation Mode

Inspect the user's invocation string:

- IF input matches pattern `vamos refinar [topic] -> ref: [path-to-umbrella.md]` (or English equivalent `refine [topic] -> ref: [path]`):
  - Extract `[topic]` and `[path]`
  - IF `[path]` missing → STOP and ask user to provide the umbrella path, in the SET form STEP 5.1 declares
  - **Resolve `[path]`:** the full basename always works; otherwise match it as a **substring** of the basenames in `docs/brainstorming/` (a 24-character timestamp prefix is not typeable). Both naming forms resolve — the timestamped one and the legacy `YYYY-MM-DD-[topic]` one. Exactly one match → use it. More than one → ⛔ STOP, print every candidate and ask which. **NEVER guess.** No match → list `docs/brainstorming/` and STOP.
  - Verify file exists at `docs/brainstorming/[resolved path]`
  - → JUMP to **STEP 8 (Continue Mode)**
- ELSE (new idea) → proceed to STEP 1.1

### 1.1 Capture Topic

IF topic or idea is present in the invocation args → extract it directly and proceed to STEP 1.2.

IF no topic in args → ask: "What do you want to explore?" Wait for the user's response before continuing.

Listen for:
- Raw idea / problem statement
- Type hint (command / skill / script / workflow / product / architecture)
- Scope signal (single artefact vs. multi-topic)

### 1.2 Ask the Delivery Index, Then Dispatch Framework Discovery (SILENT)

**Ask the index BEFORE dispatching the agent. This command is the one most likely to re-invent something that already shipped and was dropped.**

**The question, for each artefact name the topic plausibly touches:** was this built before, and was
it dropped?

**LOAD `add-artefact-graph` and resolve that question to a verb there.** ⛔ DO NOT name a verb from
memory — the skill owns which one answers which question, and a verb named here is a verb an agent
runs once and stops at.

The index answers what the graph cannot. The graph describes what exists **today**; it holds no time
axis and is rebuilt from scratch on every build. A `gone` or `superseded` entry is the most valuable
answer this step can return — it means the idea was tried, and it points at what replaced it.

If the index reports itself unavailable → say so and continue. An absent index means no close-out has
run yet, which is information, not a failure.

**"What does this relate to TODAY" is a second question, and the same skill owns it too.** A topic
touching an existing artefact almost always raises it, and `### 4.5` is where this command answers it
against the design. Load the skill before reaching for grep.

Then dispatch `@framework-discovery-agent` with:
- `topic`: captured topic from STEP 1.1
- `scope`: `both`
- `prior_deliveries`: the resolved entries from the lookup above — id, status, name and what each item was — or `none`

**The agent does not parse the index.** Resolved entries travel in the dispatch payload, exactly as selected context already does — a third parser of the delivery index, in an agent's head, is what `prior_deliveries` avoids. It says nothing about the agent's other capabilities: it queries the artefact graph itself, over MCP or the CLI, and that is how it answers a relationship question.

DO NOT show the agent's raw report verbatim to the user. Use the report internally as grounding context for the rest of the session.

### 1.3 Present Targeted Context Summary

Using the discovery report from STEP 1.2, present a brief (3–5 item) summary of relevant existing artefacts and prior decisions that relate to the user's topic.

IF the agent returned "no strong matches" → say: "This looks like novel territory — no strong matches to existing artefacts or past plans."

---

## STEP 2: Understand the Idea

### 2.1 Clarifying Questions (One at a Time)

Ask questions one per message to refine understanding:

- Purpose: "What problem does this solve?"
- Users: "Who benefits from this?"
- Success criteria: "How do you know if it works?"
- Constraints: "Are there limitations we must respect?"
- Dependencies: "Does it build on anything in the landscape?"

### 2.2 Classification

**Two classifications run at this step, and they answer different questions. Neither replaces the other.**

- **Sizing** (2.2.1) answers *which artefacts, and how many topics*. It feeds STEP 3's decomposition offer and
  the layer note STEP 7.3 carries into the design document. It stays internal.
- **Effort path** (2.2.2) answers *how much process this request needs*. It routes STEPS 3 through 7. It is
  announced.

A future reader must not collapse them: delete the sizing and STEP 3 has no input; delete the effort path and
every request pays the architectural price.

#### 2.2.1 Sizing (INTERNAL — feeds STEP 3)

Internally classify:
- **Type** — command / skill / script / workflow / product / architecture
- **Scope** — simple (one artefact) or complex (multi-topic, needs umbrella)
- **Framework impact** — affects existing commands/skills or additive

This sizing is **not announced**. It is an implementation detail of STEP 3's decomposition offer and the
layer note STEP 7.3 carries into the design document, not a decision the user needs to correct.

#### 2.2.2 Effort Path (ANNOUNCED — OWN TURN)

Sort the request into **exactly one** of three paths, then **say it out loud in one line and STOP**.

A classification the user cannot see is one they cannot correct — and they are the one who knows whether the
artefact being changed already exists.

```
IF you have decided the path:
  ⛔ DO NOT: Announce the path and ask the next question in the same turn
  ⛔ DO NOT: Classify silently and continue to STEP 3
  ✅ DO: Print the one-line announcement, WAIT for the user's turn, THEN continue on that path
```

| Path | The request is | Announce (one line, then stop) |
|------|---------------|-------------------------------|
| **spike** | a feasibility question — "can we…", "is it possible…", "quick and dirty is fine" | `Path: spike — I'll probe and report back. Override with bounded or architectural.` |
| **bounded** | a change to a command, skill, agent or script **that already exists** in this repo | `Path: bounded — questions, then a short design in chat. Override if this needs a document.` |
| **architectural** | a **new** artefact of any kind, a change that restructures how artefacts fit together, or one that alters an interface others depend on | `Path: architectural — full exploration and a design document. Override if that is too much.` |

**Bounded measures the repository, not familiarity.** Understanding the *kind* of change is not enough. Here
the test is concrete: a change to a command, skill, agent or script **that already exists** is bounded; a
**new** artefact of any kind is architectural — there is no existing flow to open, read and modify, whatever
the change resembles. Bounded requires you to name the existing artefact being changed.

**When in doubt between two paths, take the heavier one.** Reaching for the lighter label to skip work IS
the doubt.

#### 2.2.3 The ratchet is one-way

Hidden complexity discovered mid-conversation **upgrades** the path: stop, say the path is upgrading,
re-classify, continue on the heavier path. **Nothing ever downgrades mid-conversation.**

A spike whose answer is "yes, and here is how" is **not permission to build**. That is a new request, and it
gets its own classification.

#### 2.2.4 The approval gate never scales

Every path ends with the user approving the intent **before** anything is implemented. What scales with
simplicity is the **artifact** — never the approval. A bounded design may be two sentences in chat; it is
still presented, and this command still stops until the user says yes.

#### 2.2.5 Red flags — rationalisations that defeat the mechanism

| Rationalisation | Reality |
|---|---|
| "This is too simple to need a design" | Simple is the condition for a **short** design, never for **no** design. Two sentences still get approved. |
| "I'll call it bounded and skip the spec" | Picking a label for the work it avoids is the doubt itself. Take the heavier path. |
| "I know this codebase, so it's bounded" | Bounded measures the repository. A new command, skill, agent or script has no existing flow to read and modify ⇒ architectural. |
| "The spike worked, so I'll keep it" | Spike output is throwaway by definition. Keeping it is a new request with its own classification. |
| "It grew, but I'm almost done" | Growth upgrades the path. Nearly finished on the wrong path is not nearly finished. |
| "The user is in a hurry — announce and ask together" | The announcement costs one line and is the only moment a misclassification is cheap to fix. |

Continue to STEP 3.

---

## STEP 3: Validate Complexity

**Path routing (from STEP 2.2.2) — this table governs STEPS 3 through 7:**

| Path | STEPS 3 and 4 | STEPS 5 and 6 | STEP 7 |
|------|---------------|---------------|--------|
| **spike** | Skip STEP 3. Present the question and the probe in **2-3 sentences**, get a nod, then investigate — `### 1.2`'s `@framework-discovery-agent` dispatch stays available and is the right probe tool. Report a recommendation. Anything built is labelled **throwaway**. | **Skipped entirely.** Nothing is written to `docs/brainstorming/`. | 7.1 reports the recommendation, 7.2 omits the document path, 7.3 does NOT route to the planner, 7.4 does not apply. |
| **bounded** | Skip STEP 3. In STEP 4, ask only the clarifying questions that matter, then present a **short design in chat**: which artefacts change, what changes in each, and how it is proved. STOP until the user approves. | **Skipped entirely.** Nothing is written to `docs/brainstorming/`. | Runs in full. 7.1 reports the design, 7.2 omits the document path, 7.4 does not apply. |
| **architectural** | Everything written below and in STEP 4, unchanged — including the decomposition offer. | Run as written. | Runs in full, as written. |

⛔ **`7.1` runs on all three paths.** `add-final-report` reports the WORK, not a file — a spike's
recommendation and a bounded design in chat are the work, and they are exactly what its blocks 2 and
3 carry. A path that skipped the report would leave its only deliverable as loose conversation the
user has to scroll back through.

**What varies is one metadata line, not the report.** `7.2` prints a document path only where 5.3
wrote one; every other line it carries is about the work and prints on every path.

**STEP 7's `[HARD STOP]` runs on all three paths, but only two of them route.** A bounded design routes
to `/add-framework--plan` and writes an intent file; an architectural one writes both files and routes.
**A spike reports its recommendation and stops** — routing it onward would contradict `2.2.3`, which
already calls its follow-up a new request. What never changes is that the user approves.

The `⛔ HARD GATE — ROLE BOUNDARY` applies unchanged on all three paths: no path may invoke another command,
and **only the architectural path writes a file**. The one-question-at-a-time cadence applies on all three.
If the conversation reveals hidden complexity, apply STEP 2.2.3's one-way ratchet before continuing.

### 3.1 Detect Scope

If idea involves:
- Multiple independent sub-problems ✓ umbrella-worthy
- Clear dependencies between subtopics ✓ umbrella-worthy
- Single, focused problem ✓ simple design doc

### 3.2 Offer Decomposition (If Needed)

If umbrella-worthy:

Present: "This idea breaks into N topics: [Topic 1], [Topic 2], [Topic 3]. Should we:
- A) Explore all together in an umbrella spec + refine each topic separately later?
- B) Start with just [Topic 1] first, then add the others?"

Wait for response → adjust approach.

### 3.3 Confirm Approach With User

Before proceeding to exploration, confirm:
- Simple idea → single design doc
- Complex idea → umbrella spec + subtopic refinement flow

---

## STEP 4: Explore & Validate Decisions

### 4.1 Conversational Exploration (Adapted from superpowers:brainstorming)

**Which sections run is decided by STEP 3's routing table, not here.** That table is the newer,
deliberate design and it governs STEPS 3 through 7; the list below is the `architectural` path's
full set.

| Path | Sections below |
|---|---|
| **architectural** | All eight. ⛔ DO NOT skip any |
| **bounded** | `Scope`, `Ecosystem Impact` and `Key Decisions` — the three the short design in chat has to state. The rest are asked only where the conversation raises them |
| **spike** | None as a checklist. A spike states a question and a probe, and reports a recommendation |

```
[ ] Context & Motivation — why this idea matters
[ ] Problem / Opportunity — what's bad today or what's missing
[ ] Proposed Solution — 2-3 alternatives with trade-offs
[ ] Type of Artefact — command / skill / script / etc.
[ ] Scope (Includes / Does NOT Include) — explicit boundaries
[ ] Ecosystem Impact — which commands/skills are affected
[ ] Key Decisions — table of validated choices
[ ] Trade-offs & Risks — what we gain / give up, risk mitigations
```

### 4.2 Question Loop

For each section:
1. Ask ONE clarifying question related to the section, **and say which answer you would give**
2. User responds
3. Check: Is this section 100% clear and validated?
   - If NO → ask follow-up question (return to step 2 of this loop)
   - If YES → move to next section
4. When all sections complete → confirm with user: "Does this summary match your vision?"

**Every question carries a recommendation (MANDATORY).** Name the option you would take and why, in
concrete terms drawn from this repository — what already exists, what it would break, what a
neighbouring artefact already does. Never a generic "it depends".

```
IF ASKING A QUESTION WITH OPTIONS:
  ⛔ DO NOT: List them and stop, leaving the choice unweighted
  ⛔ DO NOT: Recommend by restating the user’s own preference back to them
  ✅ DO: Name the one you would take, with the reason, then let them override
```

**A command that exists to help someone decide, and refuses to say what it would do, has handed the
work back.** The user still chooses — they now choose against a position.

**Ask through the provider’s structured-question tool**, marking the recommended option. The internal
layer ships to one provider, so there is no capability flag to check and no markdown fallback to keep.

**Close what you can close.** A question carried to the handoff lands in the intent file’s `## Open`
and becomes a question `/add-framework--plan` has to ask instead — which is the redundancy this whole
flow removes.

### 4.3 Discovery Integration

Weave the discovery agent report (from STEP 1.2) into the conversation naturally:
- When discussing scope: reference ranked artefacts that already exist
- When discussing impact: show which existing commands/skills relate. **The report's relationships come from the graph**, so they are the same answer `### 4.5` asks for — carry them there rather than re-querying, and treat anything the report marked NOT VERIFIED as still unanswered
- When discussing decisions: surface relevant prior decisions from ranked plans
- Prevent duplicative thinking by grounding ideas in the discovered landscape

### 4.4 Validation Checkpoint

**A checkbox binds only where its section ran.** STEP 3's table decides that, so a path that never
opened a section is not blocked by the box that checks it — the box is unmet, not failed.

Before STEP 5:
- [ ] Every section that ran has a clear answer (no "maybe", no "TBD")
- [ ] No contradictions between the sections that ran
- [ ] User has approved the summary — **all three paths**, and no path skips it
- [ ] Scope is explicit (includes + excludes both stated) — **architectural and bounded**
- [ ] Ecosystem impact is identified — **architectural and bounded**; `### 4.5` then asks who calls
      each artefact in it

If a checkbox that binds this path fails → return to the relevant section and continue exploring.

⛔ **The approval box binds every path.** A spike reports a recommendation and a bounded design is
presented in chat; both are approved by the user before STEP 7, and neither is a document the user
can read later instead.

### 4.5 Ask Who Calls Every Artefact This Design Changes [GATE]

**The question this step answers, in full:** for every artefact the design changes — who calls it
today, and is that answer complete?

**Both halves are the question.** "Who calls it" is one query. "Is that answer complete" is a second
one for any artefact a fragment injects into, and a check against what the graph cannot see for every
artefact. A design that answered only the first half is the failure this step exists to prevent: a
coordinator ran one verb, got a list, and shipped a table missing a direct caller.

**LOAD `add-artefact-graph`.** It resolves the question to its verb, says when one query is not
enough, and carries the standing list of what no query reaches. ⛔ DO NOT pick a verb from memory.

```
IF AN ARTEFACT IN THE DESIGN HAS NO ANSWER TO BOTH HALVES:
  ⛔ DO NOT USE: Write on docs/brainstorming/
  ⛔ DO NOT: Present the design in chat as ready for approval
  ⛔ DO NOT: Fill the caller column from filenames, grep or recollection
  ✅ DO: Ask the graph, and fill it from the answer

IF YOU HAVE NO ROUTE TO THE GRAPH:
  ⛔ DO NOT: Leave the column blank, which reads as "nothing calls it"
  ✅ DO: Write NOT VERIFIED in it, and say the route was missing
```

**A blank and a NOT VERIFIED are different claims.** Blank says nothing depends on this artefact,
which is a finding. NOT VERIFIED says nobody asked. A reader who cannot tell them apart grades the
risk of the change on an answer that was never given.

**On the `bounded` path this binds the short design in chat**, which names which artefacts change and
is approved by the user like any document. On `spike` there is no design to gate — a spike reports a
recommendation, and STEP 3's table already says it writes nothing.

---

## STEP 5: Generate Design Document

### 5.1 Determine Output Path

- Simple idea → `docs/brainstorming/YYYY-MM-DDTHHMMSS-[topic].md`
- Umbrella spec → the SET form declared below, whose umbrella member ends `-000-umbrella.md`

Timestamp format: `YYYY-MM-DDTHHMMSS`, **local time**, `T` between the date and the time, **no separators inside `HHMMSS`** — Windows forbids `:` in a filename. Lexicographic sort equals chronological sort, so two brainstorms written the same day no longer sort arbitrarily. Topic slug: kebab-case from idea.

**Brainstorms carry NO kind marker** — unlike plans, which keep `PLAN` (and the legacy `SELF-PLAN` on
files already written). Internal brainstorms live in `docs/brainstorming/` of this repo, product ones in `docs/brainstorm/` of the user's repo: different directories in different repositories, so a marker would carry no information.

**A brainstorm SET allocates its timestamp once, at the umbrella, and every subtopic reuses it
verbatim — and every member carries an `NNN` ordinal. THIS IS THE ONE DECLARATION; every other site
in this file points here rather than repeating the pattern.**

```
docs/brainstorming/2026-09-07T005046-[topic]-000-umbrella.md
docs/brainstorming/2026-09-07T005046-[topic]-001-[subtopic].md
docs/brainstorming/2026-09-07T005046-[topic]-002-[subtopic].md
```

**The ordinal carries refinement order** — `000` is the umbrella, `001` onward are the subtopics in
the order they will be planned. It is the same convention `add-plan-authoring` already documents for a
plan set, and the files already on disk in `docs/brainstorming/` use it.

⛔ **A STANDALONE brainstorm takes NO ordinal.** `YYYY-MM-DDTHHMMSS-[topic].md` is complete as it
stands: there is no set, so there is nothing to order. Only a set member is numbered, and a blind
replace that adds `-000-` to a standalone name is the failure this warning exists to prevent.

**Pre-existing brainstorms keep their `YYYY-MM-DD-[topic].md` names.** Both forms coexist; only a NEW brainstorm uses the timestamp.

### 5.2 Write Design Document

**No-code rule:** Design docs must contain no full class/method implementations. One short illustrative snippet is allowed if it clarifies the design; describe all other behavior in prose.

**For simple ideas:**

```markdown
# Brainstorm: [Topic]

> **Status:** final (ready for /add-framework--plan)
> **Date:** YYYY-MM-DD
> **Type:** [command|skill|script|workflow|product|architecture]

## Discovery

[Summary of relevant artefacts and prior decisions from framework-discovery-agent report]
- [Skill/Agent/Command] — what it does, why it's relevant to this idea
- [Plan <slug>] — prior decision relevant to this design

## Context & Motivation

[From conversation: why this matters, what prompted it, connection to strategy]

## Problem / Opportunity

[What's bad today or what's missing]

## Proposed Solution

[High-level approach + 2-3 alternatives with trade-offs + recommended option]

## Type of Artefact

[command|skill|script|workflow|product|architecture]

## Scope

### Includes
- [item]
- [item]

### Does NOT Include
- [item]

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| [decision] | [why] | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| [command/skill] | [every direct caller the graph returned, or NOT VERIFIED] | [how it's affected] | [required change or "none"] |

[The `Called by` column is filled from a graph answer and from nothing else — `### 4.5`'s own query,
or the discovery report's, which is the same graph. An empty cell claims nothing calls the artefact;
write NOT VERIFIED where the question could not be asked.]

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| [benefit] | [cost] |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| [risk] | High/Med/Low | [how to avoid] |

## Next Steps

Run: `/add-framework--plan [idea]`
```

**For umbrella specs:**

Same structure +

```markdown
## Decomposition Map

| Subtopic | Design Path | Purpose |
|----------|-------------|---------|
| [Topic 1] | the SET form's `-001-[topic1].md` member | [what it covers] |
| [Topic 2] | the SET form's `-002-[topic2].md` member | [what it covers] |

[Every row reuses the umbrella's timestamp verbatim — that is what keeps the set grouped in the directory.]

## Dependencies & Relationships

[How subtopics relate; recommended order of refinement]
```

### 5.3 Write to File

Create file in `docs/brainstorming/` with content from 5.2. Do NOT commit — wait for explicit user request. DO NOT announce the path as delivered — proceed immediately to STEP 6.

---

## STEP 6: Review Design (BEFORE ANY DELIVERY)

**GATE CHECK:** Design file from STEP 5 exists? IF NO → return to STEP 5. DO NOT proceed.

DO NOT show the design path or next-step commands until this STEP completes with a deliverable verdict.

**DISPATCH AGENT:** `@plan-review-agent`
- **Capability:** read-only
- **Complexity:** standard
- **Input:**
  - `path`: design file written in STEP 5
  - `kind`: `design`
  - `layer`: `both`

**WAIT:** Agent report received. ⛔ DO NOT proceed without it.

### 6.1 Act on Verdict

**`add-review-discipline` owns this.** Load it. It carries the verdict table, how many times the
reviewer runs, and what you owe a report you receive. `ok` and `fix-then-ok` both continue to STEP 7;
`blocked` is 6.2.

### 6.2 User decisions required [STOP]

Present only the blockers that need a user decision. DO NOT present the design as delivered. WAIT.
After answers: apply them and go to STEP 7.

**Exploration is the one thing that reopens.** If the answers show the design space was never closed,
return to STEP 4 and carry on exploring — what comes out is a different document, and STEP 6 reviews
it once as it would any other. What does not happen is the same document going back for a second
opinion.

⛔ DO NOT invent decisions to clear blockers.

### Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only)
2. Read the **Complexity** hint (`standard`)
3. Choose the best available agent/task mechanism that satisfies the capability
4. Prefer `@plan-review-agent` when the engine can address it by name
5. Verify the report is received before acting on the verdict

---

## STEP 7: Completion & Next Steps [HARD STOP]

### 7.1 Report in the Shape

**LOAD `add-final-report`.** It owns the seven blocks, the banned phrasings and the self-check. Emit
the report FIRST — the document path, the verdict and the next command come after it.

A design proposes rather than executes, so block 2 is titled `What will be done` and written in the
future tense. Fill `How it works` with the mechanism the design settles on, for a reader who was not
in the conversation.

```
IF THIS RUN TOOK THE spike OR bounded PATH:
  ⛔ DO NOT: Skip this step because no file was written
  ✅ DO: Emit the same seven blocks over the recommendation or the chat design — that is the work
```

### 7.2 Metadata, After the Report

- The design document path: `docs/brainstorming/YYYY-MM-DDTHHMMSS-[topic].md` — **omitted on `spike`
  and `bounded`**, which write no file. Omit the line; never print a path that resolves to nothing.
- The review verdict and the fixes applied, one line each, if any
- The 3-5 key validated decisions — from the design document, or from the conversation that settled
  them where no document exists

### 7.3 Next Step Guidance [HARD STOP]

One command formalizes both layers, so there is no layer routing left to do here. Carry STEP 2.2's
"Framework impact" classification into the design document as the layer each affected artefact sits
in — the planning command reads it as the starting point for its own F-block tags. **An ambiguous
layer is a note in the document, not a question to the user.**

#### Write the intent file first — `bounded` and `architectural`

Write `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` before printing the handoff. Its shape,
its naming and the `## Open` convention are owned by `add-plan-authoring` — read **The Intent File**
there rather than restating it here.

It carries the path classified at `2.2.2`, every decision this conversation closed, and whatever it
could not. **On `architectural` it reuses the design document’s timestamp** so the pair sorts
adjacent; on `bounded` it is the only artefact and takes its own.

```
IF ABOUT TO WRITE `## Open`:
  ⛔ DO NOT: Park a question there that one more turn of conversation would settle
  ⛔ DO NOT: Leave the section empty as a way of saying "nothing open"
  ✅ DO: Write the literal `None` when everything closed — an empty section reads as absent,
         and absent makes the planner run its full questionnaire
```

⛔ **Nothing is written on `spike`.** A spike’s output is a recommendation, and keeping it is a new
request with its own classification.

#### Then route

**Name both files in the handoff**, verbatim, whichever this path wrote. The planning command reads
`docs/brainstorming/` and needs to know which file — a handoff naming only the idea leaves it matching
a topic against a directory of timestamped basenames, and in Continue Mode that directory holds a
whole set sharing one timestamp.

On `architectural`, print this and STOP:

```
Idea is ready to formalize. Run: /add-framework--plan [idea]
Design: docs/brainstorming/<the file written at 5.3>
Intent: docs/brainstorming/<the intent file written above>
(brainstorm stops here — it does not run the next command for you.)
```

On `bounded`, there is no design document, so that line is omitted and the `Intent:` line stands alone.

⛔ **On `spike`, do NOT route to the planner at all.** A spike’s terminal state is its recommendation.
Sending it to a full planning pass contradicts this command’s own ratchet — `2.2.3` already says a
spike whose answer is "yes, and here is how" is a NEW request, which gets its own classification and
its own run. Report the recommendation and stop.

### 7.4 Offer Refinement (If Umbrella)

Umbrella specs exist only on the `architectural` path, so this sub-step does not apply on the other
two. That is a condition it already carried, not a path carve-out.

If umbrella spec: "You can now refine individual subtopics by running `/add-framework--brainstorm vamos refinar [topic] -> ref: [the umbrella's own filename]`"

---

## STEP 8: Continue Mode (Topic Refinement from Umbrella)

Triggered when STEP 1.0 detects a refinement invocation.

### 8.1 Load Umbrella Spec

Read the referenced umbrella spec file at the path captured in STEP 1.0.

### 8.2 Dispatch Framework Discovery Agent (SILENT)

Dispatch `@framework-discovery-agent` with:
- `topic`: subtopic extracted in STEP 8.1
- `scope`: `both`

Use the report as grounding context for the exploration. Do NOT show raw output verbatim.

### 8.3 Start STEP 2 (Understand the Idea) — Clarifying Questions Only

Ask clarifying questions specific to the subtopic, grounded in the umbrella's context. This is
`2.1` only.

```
IF IN CONTINUE MODE:
  ⛔ DO NOT: Re-run 2.2's effort-path classification for a subtopic
  ⛔ DO NOT: Consult STEP 3's routing table to decide whether this subtopic writes a document
  ✅ DO: Treat every subtopic as `architectural`, and run 8.4 as written
```

**A subtopic inherits the umbrella's path, and the path is always `architectural`.** Decomposition
exists on no other path — STEP 3's table skips STEP 3 entirely for `spike` and `bounded`, and `7.4`
says umbrella specs are architectural-only. Re-classifying here could return `bounded`, and 8.4 would
then be writing a document that path forbids.

### 8.4 Follow STEP 4-7 for Subtopic

Generate the subtopic design doc as the SET form's next `-NNN-[subtopic].md` member — reusing the umbrella's timestamp verbatim, and taking the next ordinal in the Decomposition Map's order. Review via STEP 6 before STEP 7 delivery.

---

## Rules

ALWAYS:
- Capture topic BEFORE dispatching discovery agent (STEP 1.1 before 1.2)
- Dispatch `@framework-discovery-agent` silently before any exploration
- Announce the classified effort path in its own turn, before continuing to STEP 3
- End every path with the user approving the intent before anything is implemented
- Ask one question at a time during exploration
- Validate every section 100% before writing design doc
- Write design documents in Markdown (100% English)
- Store outputs in `docs/brainstorming/` only
- Confirm no open questions before printing the next-command suggestion
- Dispatch `@plan-review-agent` before any design delivery, including Continue Mode
- Record each affected artefact's layer in the design doc, for the planner's F-block tags
- Use natural language invocation (no flags/modes in command itself)

NEVER:
- Show the raw discovery agent report verbatim to the user
- Dump a full artefact landscape before the user has shared their topic
- Leave open questions in design documents
- Create umbrella specs without explicit decomposition
- Write documents outside `docs/brainstorming/`
- Proceed to `/add-framework--build` or implementation (brainstorm's output is design only)
- Invoke any command or skill via Skill tool or slash — handoff is text-only, on every path
- Downgrade an effort path mid-conversation — the ratchet only goes up
- Treat a spike's answer as permission to build — that is a new request with its own classification
- Write full class/method implementations in design docs (one illustrative snippet allowed)
- Use informative language ("it's recommended") — use imperative ("CONFIRM", "VALIDATE")
- Create design docs until all validation checkboxes pass
- Present an unreviewed design as delivered
- Invent decisions to clear review blockers

---

## Credits

- Conversational exploration (`### 4.1`) adapted from
  [obra/superpowers `brainstorming`](https://github.com/obra/superpowers/tree/main/skills/brainstorming)
  by Jesse Vincent (MIT).
- Three-path classification (spike / bounded / architectural), announcing the path before continuing, the
  one-way ratchet and the "approval never scales" rule adapted from the same skill (MIT).

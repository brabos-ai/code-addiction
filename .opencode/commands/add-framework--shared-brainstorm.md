---
description: Develops rough ADD ideas into complete designs ready for planning.
---

# ADD Brainstorm - Collaborative Ideation & Design Explorer

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **INPUT:** $ARGUMENTS

Transforms rough ideas into fully-formed, final designs ready for `/add-framework--plan`. Pairs discovery-first ecosystem context with conversational exploration. Outputs documented designs with zero open questions.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**

```
STEP 1: Capture topic & discover context → detect mode, capture topic, dispatch agent
STEP 2: Understand the idea            → ask clarifying questions (one at a time)
STEP 3: Validate complexity            → detect if scope is simple or umbrella-worthy
STEP 4: Explore & validate decisions   → conversational ideation until all questions answered
STEP 5: Generate design document       → write final design (no open questions)
STEP 6: Completion & next steps [HARD STOP] → print suggested command as text, STOP
STEP 7: Continue Mode (JUMP FROM STEP 1.0 only) → topic refinement from umbrella spec
```

**⛔ HARD GATE — ROLE BOUNDARY:**

`shared-brainstorm` DISCUSSES, EXPLORES, DOCUMENTS. It NEVER implements code AND NEVER invokes another command.

```
IF ABOUT TO INVOKE A COMMAND OR SKILL (ANY STEP):
  ⛔ DO NOT USE: Skill tool (invoking any skill or command)
  ⛔ DO NOT invoke: /add-framework--plan
  ⛔ DO NOT invoke: /add-framework--self-plan
  ⛔ DO NOT invoke: /add-framework--build
  ⛔ DO NOT invoke: /add-framework--self-build
  ✅ DO: At STEP 6 handoff, print the suggested command as plain text, then STOP
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

IF USER WANTS TO REFINE A TOPIC FROM UMBRELLA:
  ⛔ DO NOT PROCEED WITHOUT UMBRELLA SPEC REFERENCE
  ✅ DO: Ask user to provide -> ref: YYYY-MM-DD-[name]-umbrella.md path

```

---

## STEP 1: Capture Topic & Discover Context

### 1.0 Detect Invocation Mode

Inspect the user's invocation string:

- IF input matches pattern `vamos refinar [topic] -> ref: [path-to-umbrella.md]` (or English equivalent `refine [topic] -> ref: [path]`):
  - Extract `[topic]` and `[path]`
  - IF `[path]` missing → STOP and ask user to provide `-> ref: YYYY-MM-DD-[name]-umbrella.md`
  - Verify file exists at `docs/brainstorming/[path]`
  - → JUMP to **STEP 7 (Continue Mode)**
- ELSE (new idea) → proceed to STEP 1.1

### 1.1 Capture Topic

IF topic or idea is present in the invocation args → extract it directly and proceed to STEP 1.2.

IF no topic in args → ask: "What do you want to explore?" Wait for the user's response before continuing.

Listen for:
- Raw idea / problem statement
- Type hint (command / skill / script / workflow / product / architecture)
- Scope signal (single artefact vs. multi-topic)

### 1.2 Dispatch Framework Discovery Agent (SILENT)

Dispatch `@framework-discovery-agent` with:
- `topic`: captured topic from STEP 1.1
- `scope`: `both`

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

Internally classify:
- **Type** — command / skill / script / workflow / product / architecture
- **Scope** — simple (one artefact) or complex (multi-topic, needs umbrella)
- **Framework impact** — affects existing commands/skills or additive

Do NOT reveal classification explicitly yet. Continue to STEP 3.

---

## STEP 3: Validate Complexity

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

Guide user through these sections (DO NOT skip any):

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
1. Ask clarifying question related to section
2. User responds
3. Check: Is this section 100% clear and validated? 
   - If NO → ask follow-up question (return to step 2 of this loop)
   - If YES → move to next section
4. When all sections complete → confirm with user: "Does this summary match your vision?"

### 4.3 Discovery Integration

Weave the discovery agent report (from STEP 1.2) into the conversation naturally:
- When discussing scope: reference ranked artefacts that already exist
- When discussing impact: show which existing commands/skills relate
- When discussing decisions: surface relevant prior decisions from ranked plans
- Prevent duplicative thinking by grounding ideas in the discovered landscape

### 4.4 Validation Checkpoint

Before STEP 5:
- [ ] Every section has a clear answer (no "maybe", no "TBD")
- [ ] No contradictions between sections
- [ ] User has approved the summary
- [ ] Scope is explicit (includes + excludes both stated)
- [ ] Ecosystem impact is identified

If ANY checkbox fails → return to relevant section and continue exploring.

---

## STEP 5: Generate Design Document

### 5.1 Determine Output Path

- Simple idea → `docs/brainstorming/YYYY-MM-DD-[topic].md`
- Umbrella spec → `docs/brainstorming/YYYY-MM-DD-[topic]-umbrella.md`

Date format: YYYY-MM-DD (today's date). Topic slug: kebab-case from idea.

### 5.2 Write Design Document

**No-code rule:** Design docs must contain no full class/method implementations. One short illustrative snippet is allowed if it clarifies the design; describe all other behavior in prose.

**For simple ideas:**

```markdown
# Brainstorm: [Topic]

> **Status:** final (ready for /add-framework--plan or /add-framework--self-plan)
> **Date:** YYYY-MM-DD
> **Type:** [command|skill|script|workflow|product|architecture]

## Discovery

[Summary of relevant artefacts and prior decisions from framework-discovery-agent report]
- [Skill/Agent/Command] — what it does, why it's relevant to this idea
- [Plan NNNN] — prior decision relevant to this design

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

| Component | Impact | Action |
|-----------|--------|--------|
| [command/skill] | [how it's affected] | [required change or "none"] |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| [benefit] | [cost] |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| [risk] | High/Med/Low | [how to avoid] |

## Next Steps

[product layer idea] Run: `/add-framework--plan [idea]`
[internal layer idea] Run: `/add-framework--self-plan [idea]`
```

**For umbrella specs:**

Same structure +

```markdown
## Decomposition Map

| Subtopic | Design Path | Purpose |
|----------|-------------|---------|
| [Topic 1] | YYYY-MM-DD-[topic1].md | [what it covers] |
| [Topic 2] | YYYY-MM-DD-[topic2].md | [what it covers] |

## Dependencies & Relationships

[How subtopics relate; recommended order of refinement]
```

### 5.3 Write to File

Create file in `docs/brainstorming/` with content from 5.2. Do NOT commit — wait for explicit user request.

---

## STEP 6: Completion & Next Steps [HARD STOP]

### 6.1 Display Design Document Path

Show: "Design document created: `docs/brainstorming/YYYY-MM-DD-[topic].md`"

### 6.2 Summarize Key Decisions

Bullet list of 3-5 key validated decisions from the design.

### 6.3 Next Step Guidance [HARD STOP]

Determine the target layer from STEP 2.2 "Framework impact" classification:
- IF product layer (`framwork/.codeadd/`) → suggest `/add-framework--plan`
- IF internal layer (`.opencode/`, `scripts/`, `CLAUDE.md`) → suggest `/add-framework--self-plan`
- IF layer is ambiguous → ask the user which layer, then print the correct command

Print ONLY one of the following (matching the detected layer), then STOP:

```
[product layer]  Idea is ready to formalize. Run: /add-framework--plan [idea]
[internal layer] Idea is ready to formalize. Run: /add-framework--self-plan [idea]
(shared-brainstorm stops here — it does not run the next command for you.)
```

### 6.4 Offer Refinement (If Umbrella)

If umbrella spec: "You can now refine individual subtopics by running `/add-framework--shared-brainstorm vamos refinar [topic] -> ref: YYYY-MM-DD-[name]-umbrella.md`"

---

## STEP 7: Continue Mode (Topic Refinement from Umbrella)

Triggered when STEP 1.0 detects a refinement invocation.

### 7.1 Load Umbrella Spec

Read the referenced umbrella spec file at the path captured in STEP 1.0.

### 7.2 Dispatch Framework Discovery Agent (SILENT)

Dispatch `@framework-discovery-agent` with:
- `topic`: subtopic extracted in STEP 7.1
- `scope`: `both`

Use the report as grounding context for the exploration. Do NOT show raw output verbatim.

### 7.3 Start STEP 2 (Understand the Idea)

Ask clarifying questions specific to the subtopic, grounded in the umbrella's context.

### 7.4 Follow STEP 4-6 for Subtopic

Generate subtopic design doc in `docs/brainstorming/YYYY-MM-DD-[subtopic].md`.

---

## Rules

ALWAYS:
- Capture topic BEFORE dispatching discovery agent (STEP 1.1 before 1.2)
- Dispatch `@framework-discovery-agent` silently before any exploration
- Ask one question at a time during exploration
- Validate every section 100% before writing design doc
- Write design documents in Markdown (100% English)
- Store outputs in `docs/brainstorming/` only
- Confirm no open questions before printing the next-command suggestion
- Route internal-layer ideas to `/add-framework--self-plan`, not `/add-framework--plan`
- Use natural language invocation (no flags/modes in command itself)

NEVER:
- Show the raw discovery agent report verbatim to the user
- Dump a full artefact landscape before the user has shared their topic
- Leave open questions in design documents
- Create umbrella specs without explicit decomposition
- Write documents outside `docs/brainstorming/`
- Proceed to `/add-framework--build` or implementation (brainstorm's output is design only)
- Invoke any command or skill via Skill tool or slash — handoff is text-only
- Write full class/method implementations in design docs (one illustrative snippet allowed)
- Use informative language ("it's recommended") — use imperative ("CONFIRM", "VALIDATE")
- Create design docs until all validation checkboxes pass

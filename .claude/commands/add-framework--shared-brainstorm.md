# ADD Brainstorm - Collaborative Ideation & Design Explorer

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Transforms rough ideas into fully-formed, final designs ready for `/add-framework--plan`. Pairs discovery-first ecosystem context with conversational exploration. Outputs documented designs with zero open questions.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**

```
STEP 1: Bootstrap ecosystem context    → detect mode, run script, show landscape
STEP 2: Understand the idea            → ask clarifying questions (one at a time)
STEP 3: Validate complexity            → detect if scope is simple or umbrella-worthy
STEP 4: Explore & validate decisions   → conversational ideation until all questions answered
STEP 5: Generate design document       → write final design (no open questions)
STEP 6: Completion & next steps        → suggest /add-framework--plan, display design path
STEP 7: Continue Mode (alt entry)      → topic refinement from umbrella spec
```

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

## STEP 1: Bootstrap Ecosystem Context

### 1.0 Detect Invocation Mode

Inspect the user's invocation string:

- IF input matches pattern `vamos refinar [topic] -> ref: [path-to-umbrella.md]` (or English equivalent `refine [topic] -> ref: [path]`):
  - Extract `[topic]` and `[path]`
  - IF `[path]` missing → STOP and ask user to provide `-> ref: YYYY-MM-DD-[name]-umbrella.md`
  - Verify file exists at `docs/brainstorming/[path]`
  - → JUMP to **STEP 7 (Continue Mode)**
- ELSE (new idea) → proceed to STEP 1.1

### 1.1 Execute Bootstrap Script

```bash
bash .claude/bootstrap-framework-context.sh
```

### 1.2 Display Landscape to User

Present output in readable format:
- Active skills (name + one-line description)
- Active agents (listing)
- Active commands (listing)
- Active scripts (listing)
- Key framework context snippets

Say: "Here's the current ADD framework landscape. This context helps us avoid duplicating work and understand what's already possible."

### 1.3 Capture Initial Idea

Ask user to describe what they want to explore. Listen for:
- Raw idea / problem statement
- Type hint (command / skill / script / workflow / product / architecture)
- Scope signal (single artefact vs. multi-topic)

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

Weave bootstrap output into conversation naturally:
- When discussing scope: reference what already exists (from bootstrap)
- When discussing impact: show which existing commands/skills relate
- Prevent duplicative thinking by grounding ideas in discovered landscape

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

**For simple ideas:**

```markdown
# Brainstorm: [Topic]

> **Status:** final (ready for /add-framework--plan)
> **Date:** YYYY-MM-DD
> **Type:** [command|skill|script|workflow|product|architecture]

## Discovery

[Summary of relevant skills, agents, commands, scripts from bootstrap]
- [Skill name] — what it does, why it's relevant to this idea
- [Agent/Command/Script] — brief relevance

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

Run: `/add-framework--plan [idea]`
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

## STEP 6: Completion & Next Steps

### 6.1 Display Design Document Path

Show: "Design document created: `docs/brainstorming/YYYY-MM-DD-[topic].md`"

### 6.2 Summarize Key Decisions

Bullet list of 3-5 key validated decisions from the design.

### 6.3 Next Step Guidance

Display: "Ready for formal planning. Run: `/add-framework--plan [idea]` to create a plan and move toward implementation."

### 6.4 Offer Refinement (If Umbrella)

If umbrella spec: "You can now refine individual subtopics by running `/add-framework--shared-brainstorm vamos refinar [topic] -> ref: YYYY-MM-DD-[name]-umbrella.md`"

---

## STEP 7: Continue Mode (Topic Refinement from Umbrella)

Triggered when STEP 1.0 detects a refinement invocation.

### 7.1 Load Umbrella Spec

Read the referenced umbrella spec file at the path captured in STEP 1.0.

### 7.2 Load Bootstrap Context

Re-run bootstrap to refresh ecosystem landscape.

### 7.3 Start STEP 2 (Understand the Idea)

Ask clarifying questions specific to the subtopic, grounded in the umbrella's context.

### 7.4 Follow STEP 4-6 for Subtopic

Generate subtopic design doc in `docs/brainstorming/YYYY-MM-DD-[subtopic].md`.

---

## Rules

ALWAYS:
- Execute bootstrap script FIRST (user must see ecosystem landscape before ideating)
- Ask one question at a time during exploration
- Validate every section 100% before writing design doc
- Write design documents in Markdown (100% English)
- Store outputs in `docs/brainstorming/` only
- Confirm no open questions before suggesting `/add-framework--plan`
- Use natural language invocation (no flags/modes in command itself)

NEVER:
- Leave open questions in design documents
- Create umbrella specs without explicit decomposition
- Skip the bootstrap phase (ecosystem context first)
- Write documents outside `docs/brainstorming/`
- Proceed to `/add-framework--build` or implementation (brainstorm's output is design only)
- Use informative language ("it's recommended") — use imperative ("CONFIRM", "VALIDATE")
- Create design docs until all validation checkboxes pass

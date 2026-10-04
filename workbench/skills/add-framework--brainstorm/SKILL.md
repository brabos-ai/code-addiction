---
name: add-framework--brainstorm
description: "Use when an idea for the framework itself needs shaping before any plan — explores it with the user, classifies it spike, bounded or architectural, writes the design and intent files, and ends on one approval that can start the rest of the internal pipeline. First stage of brainstorm → plan → build → done."
---

# ADD Brainstorm - Collaborative Ideation & Design Explorer

<!-- uses:
- skill: add-artefact-graph
- agent: framework-discovery-agent
- agent: plan-review-agent
- skill: add-final-report
- skill: add-review-discipline
- mention: add-framework--build
- mention: add-framework--done
- handoff: add-framework--plan
- skill: add-plan-authoring
- skill: building-commands/references/agent-dispatch.md
- mention: building-commands
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Transforms rough ideas into fully-formed, final designs ready for `/add-framework--plan`. Pairs discovery-first ecosystem context with conversational exploration. Outputs documented designs with zero open questions.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**

```
STEP 1: Capture topic & discover context → detect mode, capture topic, dispatch agent
STEP 2: Understand the idea            → objective drafted (2.1.1), clarifying questions, 2.2 classification — PATH STATED, NO STOP
STEP 3: Validate complexity            → ARCHITECTURAL PATH ONLY — simple or umbrella-worthy
STEP 4: Explore & validate decisions   → conversational ideation (abbreviated on spike / bounded)
STEP 5: Generate design document       → ARCHITECTURAL PATH ONLY — write draft design (no open questions)
STEP 6: Review design                  → ARCHITECTURAL PATH ONLY — @plan-review-agent before any delivery
STEP 7: Completion & approval [HARD STOP] → ALL THREE PATHS report; bounded/architectural ask the three-option approval
STEP 8: Continue Mode (JUMP FROM STEP 1.0 only) → topic refinement from umbrella spec
```

**⛔ HARD GATE — ROLE BOUNDARY:**

`brainstorm` DISCUSSES, EXPLORES, DOCUMENTS. It NEVER implements code AND NEVER invokes another command.

```
IF ABOUT TO INVOKE A COMMAND OR SKILL (ANY STEP):
  ⛔ DO NOT: Load another skill or command, by whatever mechanism this provider offers
  ⛔ DO NOT invoke: /add-framework--plan
  ⛔ DO NOT invoke: /add-framework--build
  ✅ DO: At STEP 7 handoff, print the suggested command as plain text, then STOP
```

**A chain the user authorised is not initiative.** The gate above bans this skill deciding, on its own,
to run the next stage. When the user picks `Approve, deliver automatically` at STEP 7.3, loading
`/add-framework--plan` is the user's decision carried out, and it is the one load this skill makes:

```
IF THE USER CHOSE "Approve, deliver automatically" AT STEP 7.3:
  ✅ DO: Load /add-framework--plan with the intent file, after writing it — and nothing else
  ⛔ DO NOT invoke: /add-framework--build — the plan hands off to it, not this skill
  ⛔ DO NOT invoke: /add-framework--done — no path reaches it unattended
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

**A ticket id in the invocation (`[0-9]{4}B`) is resolved here.** Read that ticket and use it as exploration
input; `add-plan-authoring` owns the rules, under **The Ticket** — load it rather than acting from memory.

IF no topic in args → ask: "What do you want to explore?" Wait for the user's response before continuing.

Listen for:
- Raw idea / problem statement
- Type hint (command / skill / script / workflow / product / architecture)
- Scope signal (single artefact vs. multi-topic)

### 1.2 Ask the Delivery Index, Then Dispatch Framework Discovery (SILENT)

**Ask the index BEFORE dispatching the agent. This skill is the one most likely to re-invent something that already shipped and was dropped.**

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
touching an existing artefact almost always raises it, and `### 4.5` is where this skill answers it
against the design. Load the skill before reaching for grep.

**DISPATCH AGENT:** `@framework-discovery-agent`
- **Capability:** read-only
- **Complexity:** standard
- **Input:** `topic` (captured at STEP 1.1), `scope: both`, and `prior_deliveries` — the resolved
  entries from the lookup above, each with its id, status, name and what the item was.
  **Omit `prior_deliveries` entirely when the lookup resolved nothing.** The agent declares the field
  optional and reads its absence as "the caller resolved none"; it has no branch for a literal
  `"none"`, so sending one takes the filled path with a string that means the opposite.

**The agent does not parse the index.** Resolved entries travel in the dispatch payload, exactly as selected context already does — a third parser of the delivery index, in an agent's head, is what `prior_deliveries` avoids. It says nothing about the agent's other capabilities: it queries the artefact graph itself, over MCP or the CLI, and that is how it answers a relationship question.

DO NOT show the agent's raw report verbatim to the user. Use the report internally as grounding context for the rest of the session.

### 1.3 Present Targeted Context Summary

Using the discovery report from STEP 1.2, present a brief (3–5 item) summary of relevant existing artefacts and prior decisions that relate to the user's topic.

IF the agent returned "no strong matches" → say: "This looks like novel territory — no strong matches to existing artefacts or past plans."

---

## STEP 2: Understand the Idea

### 2.1 Clarifying Questions (One at a Time)

#### 2.1.1 Draft the objective FIRST, and have the user correct it

**Write a draft objective from what the user has already said, and ask them to correct it.** One or
two sentences, in their own words, answering one question: **what will be true when this is done that
is not true today?**

```
IF STARTING STEP 2:
  ⛔ DO NOT: Ask "what is your objective?" and wait — someone who could state it cold would have
  ⛔ DO NOT: Hand back the request as the objective — "you want X" names the thing, not what it achieves
  ⛔ DO NOT: Continue to 2.1.2 or 2.2 with the objective still unstated
  ✅ DO: Propose the draft, then let them correct it
```

**Drafting it is the work, not a courtesy.** A user brings a problem, a symptom or a half-formed idea;
turning that into a statement of what they are trying to achieve is the first thing this skill is
for. It is the same move `### 4.2` already makes for options — name the one you would take, then let
them override.

**Everything downstream reads this.** `### 4.2`'s questions are drawn from it, `### 5.2` writes it as
the design's first section, `### 8.1` hands it to every subtopic, and the plan carries it to the
build. An objective corrected here costs one line; one corrected after the plan is written costs the
plan.

#### 2.1.2 Then refine it

Ask questions one per message. Each one sharpens the objective or the shape of the work:

- Purpose: "What problem does this solve?"
- Users: "Who benefits from this?"
- Success criteria: "How do you know if it works?"
- Constraints: "Are there limitations we must respect?"
- Dependencies: "Does it build on anything in the landscape?"

**Where an answer contradicts the drafted objective, the objective is what changes.** It was a draft;
these five questions are how it stops being one.

### 2.2 Classification

**Two classifications run at this step, and they answer different questions. Neither replaces the other.**

- **Sizing** (2.2.1) answers *which artefacts, and how many topics*. It feeds STEP 3's decomposition offer and
  the layer note STEP 7.3 carries into the design document. It stays internal.
- **Effort path** (2.2.2) answers *how much process this request needs*. It routes STEPS 3 through 7. It is
  stated in one line, in the same turn as whatever comes next, and it is NOT put to the user for approval.

A future reader must not collapse them: delete the sizing and STEP 3 has no input; delete the effort path and
every request pays the architectural price.

#### 2.2.1 Sizing (INTERNAL — feeds STEP 3)

Internally classify:
- **Type** — command / skill / script / workflow / product / architecture
- **Scope** — simple (one artefact) or complex (multi-topic, needs umbrella)
- **Framework impact** — affects existing commands/skills or additive

This sizing is **not announced**. It is an implementation detail of STEP 3's decomposition offer and the
layer note STEP 7.3 carries into the design document, not a decision the user needs to correct.

#### 2.2.2 Effort Path (STATED — NO STOP)

Sort the request into **exactly one** of three paths, **state it in one line, and keep going in the same
turn.**

**This is YOUR call, not the user's.** The path measures the repository — whether the artefact being
changed already exists — and that is something you read off disk. The user cannot be expected to know
what `bounded` and `architectural` mean here, so asking them to confirm or override buys nothing and
costs a full round trip on every idea. State it so it is on the record, then continue.

```
IF you have decided the path:
  ⛔ DO NOT: Ask the user to confirm, approve or override the path
  ⛔ DO NOT: End the turn on the path line and wait
  ⛔ DO NOT: Classify silently — the line is still printed
  ✅ DO: Print the one line, then continue on that path in the SAME turn
```

| Path | The request is | State (one line, then continue) |
|------|---------------|-------------------------------|
| **spike** | a feasibility question — "can we…", "is it possible…", "quick and dirty is fine" | `Path: spike — I'll probe and report back.` |
| **bounded** | a change to a command, skill, agent or script **that already exists** in this repo | `Path: bounded — questions, then a short design in chat.` |
| **architectural** | a **new** artefact of any kind, a change that restructures how artefacts fit together, or one that alters an interface others depend on | `Path: architectural — full exploration and a design document.` |

**The user can still change it, unprompted.** If they say the path is wrong, re-classify and carry on.
What is removed is the question, not their ability to answer it.

**Bounded measures the repository, not familiarity.** Understanding the *kind* of change is not enough. Here
the test is concrete: a change to a command, skill, agent or script **that already exists** is bounded; a
**new** artefact of any kind is architectural — there is no existing flow to open, read and modify, whatever
the change resembles. Bounded requires you to name the existing artefact being changed.

**Ticket — the entry write, once the path is stated.** When STEP 1.1 resolved a ticket and the path is
`bounded` or `architectural`, write `refining` now. **On `spike`, write nothing:** a spike's answer is not
permission to build, and a ticket moved by one that ends in "no" would stay there with nothing behind it.
`add-plan-authoring` owns the rules, under **The Ticket**.

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
still presented, and this skill still stops until the user says yes.

#### 2.2.5 Red flags — rationalisations that defeat the mechanism

| Rationalisation | Reality |
|---|---|
| "This is too simple to need a design" | Simple is the condition for a **short** design, never for **no** design. Two sentences still get approved. |
| "I'll call it bounded and skip the spec" | Picking a label for the work it avoids is the doubt itself. Take the heavier path. |
| "I know this codebase, so it's bounded" | Bounded measures the repository. A new command, skill, agent or script has no existing flow to read and modify ⇒ architectural. |
| "The spike worked, so I'll keep it" | Spike output is throwaway by definition. Keeping it is a new request with its own classification. |
| "It grew, but I'm almost done" | Growth upgrades the path. Nearly finished on the wrong path is not nearly finished. |
| "The user should confirm the path" | They cannot — the path measures the repository, which you read and they do not. Decide it, state it, move on. |
| "Nobody answers the line, so I'll drop it" | The line is the record of which path this run took. STEP 7 reports it and the intent file carries it. |

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

**Every question carries a recommendation (MANDATORY).** Name the option you would take and why.
Never a generic "it depends".

**Two sources, and the question is drawn from the objective settled at 2.1.1** — a question that does
not sharpen some part of it is a question this conversation does not need:

| Source | What it supplies | Required form |
|---|---|---|
| **This repository** | What already exists, what it would break, what a neighbouring artefact already does | A path, an artefact name, or a line |
| **Comparable products, frameworks and conventions** | What the user cannot derive from this tree — what others already settled on this subject | **The name of the thing.** "superpowers' brainstorming does X", "BMAD's intent file does Y", "conventional commits does Z" |

```
IF BRINGING IN OUTSIDE PRACTICE:
  ⛔ DO NOT: Say "widely adopted", "industry standard" or "most teams" with nothing named
  ⛔ DO NOT: Go and fetch it — this skill needs no network, and a named recollection the user can
             check is worth more than a link they will not open
  ⛔ DO NOT: Let outside practice override a convention this repository settled for a recorded reason
  ✅ DO: Name the product, framework or convention, and say what it does
```

**A name is what makes it checkable.** "Widely adopted" cannot be argued with, which is why it is
worthless; "superpowers does X" can be looked at and contradicted. The name may turn out to be stale
or wrong — that is the point, because the user can see it and say so.

⛔ **Where the two sources conflict, this repository wins.** Its conventions were settled for reasons
recorded in its own documents. Outside practice is an input to the decision, never an authority over
it.

```
IF ASKING A QUESTION WITH OPTIONS:
  ⛔ DO NOT: List them and stop, leaving the choice unweighted
  ⛔ DO NOT: Recommend by restating the user’s own preference back to them
  ✅ DO: Name the one you would take, with the reason, then let them override
```

**A command that exists to help someone decide, and refuses to say what it would do, has handed the
work back.** The user still chooses — they now choose against a position.

**Ask through the provider’s structured-question tool** where the `structuredQuestions` capability
declares one, marking the recommended option. Where it declares none, present the same content as an
option table with the recommendation stated below it.

⛔ **The workbench no longer ships to one provider, and that sentence used to say it did.** It built
to Claude Code alone, so this step could assume a structured-question tool and keep no fallback.
`workbench/provider-map.json` now targets opencode too, which declares `structuredQuestions: false` —
and the option table is not a downgrade: it carries the same options and the same marked
recommendation, in text.

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
> **Ticket:** [the id STEP 1.1 resolved — omit the line when there is none; see `add-plan-authoring`, The Ticket]

## Objective

[The objective settled at 2.1.1, in the user's own words. One or two sentences answering: what will be
true when this is done that is not true today?]

[A SET member does NOT write its own here — `8.1` copied the umbrella's verbatim and added the line
saying how this subtopic serves it. Both go in, in that order.]

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

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| [decision] | [which PART of the objective this advances] | [why this choice is sound] | ✅ |
| The gate stops rather than warns | the "nothing reaches the build unchecked" half | A warning is what let the last one through | ✅ |

[`Serves` names a PART, never the whole objective. A table where every row serves everything records
nothing. A decision that cannot fill it is sound work on something this design is not for — say so in
the row rather than deleting it.]

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

| Subtopic | Design Path | Serves the objective by | Purpose |
|----------|-------------|-------------------------|---------|
| [Topic 1] | the SET form's `-001-[topic1].md` member | [which part of the objective it advances] | [what it covers] |
| [Topic 2] | the SET form's `-002-[topic2].md` member | [which part of the objective it advances] | [what it covers] |

[Every row reuses the umbrella's timestamp verbatim — that is what keeps the set grouped in the directory.]

[Worked example of the third column, from a set that shipped: `| Merge without squash | ...-002-... |
preserves the per-F-block history a fast delivery produces | ... |`. It names a PART of the objective.
⛔ **A row that cannot fill that cell is a subtopic this umbrella should not carry** — and it is far
cheaper to find out here than at `8.1`, after the refinement.]

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

### Dispatching the Agents Above

**`building-commands/references/agent-dispatch.md` owns them** — read its **Agent Dispatch Rules** and
apply them to every `DISPATCH AGENT` block in this skill. The block names the capability and the complexity; the rules say how to honour them.

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
- **The ticket, when STEP 1.1 resolved one — on every path, the spike included.** A spike writes no file,
  so this line is the only place its ticket surfaces; `add-plan-authoring`, The Ticket, says what the other
  paths record

### 7.3 Approval and Next Step [HARD STOP]

One stage formalizes both layers, so there is no layer routing left to do here. Carry STEP 2.2's
"Framework impact" classification into the design document as the layer each affected artefact sits
in — the planning stage reads it as the starting point for its own F-block tags. **An ambiguous
layer is a note in the document, not a question to the user.**

#### Ask for the one approval — `bounded` and `architectural`

**This is the only approval the pipeline asks for by default.** Present it through the provider's
structured-question tool where the `structuredQuestions` capability declares one — otherwise as an
option table with the recommendation marked — with these three options and nothing else:

| Option | What happens |
|---|---|
| **Approve, I confirm each stage** | Today's behaviour. The intent file records `delivery: confirm`, the handoff below is printed as text, and this skill stops |
| **Approve, deliver automatically** | The intent file records `delivery: automatic`, and this skill loads `/add-framework--plan` and continues. Every stage then hands off without waiting, **up to and including the build**. `add-framework--build` STEP 9 asks whether to open the PR — **that question is the terminus** |
| **Keep discussing** | No intent file, no handoff. Return to STEP 4 with what the user wants to reopen |

**Stop kind — deciding, in every state, and so is every stop in this skill before it.** The delivery
mode does not exist until this question is answered, so nothing earlier can be a stop the approval
already covered: the decomposition offer at `3.2`, the summary approval at `4.4`, the blockers at
`6.2` and the set-membership stop at `8.1` all wait. **`2.2.2` is not in that list — it never stops.**

⛔ **The close-out is never reached unattended.** No option runs `/add-framework--done`, and the
automatic path ends at a question the user answers. The merge is approved on every path.

**What "without waiting" means is owned by `add-plan-authoring`** — read **The Delivery Mode**
there. It says which stops still wait on the automatic path, and that a stop which passes through still
prints what it would have shown.

```
IF THE USER HAS NOT CHOSEN ONE OF THE THREE OPTIONS:
  ⛔ DO NOT USE: Write on docs/brainstorming/ for the intent file
  ⛔ DO NOT: Load /add-framework--plan, by whatever mechanism this provider offers
  ✅ DO: Ask, and WAIT

IF THE ANSWER IS "Keep discussing":
  ⛔ DO NOT: Write the intent file or print a handoff
  ✅ DO: Return to STEP 4
```

#### Write the intent file — `bounded` and `architectural`

Write `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` once the user has approved, before any
handoff. Its shape, its naming, the `delivery:` field and the `## Open` convention are owned by
`add-plan-authoring` — read **The Intent File** there rather than restating it here.

It carries the path classified at `2.2.2`, the approval option as `delivery:`, every decision this
conversation closed, whatever it could not, and `ticket:` when STEP 1.1 resolved one. **On `architectural` it reuses the design document’s
timestamp** so the pair sorts adjacent; on `bounded` it is the only artefact and takes its own.

**Ticket — the exit write.** When STEP 1.1 resolved a ticket, write `shaped` once the intent file is written.
It follows the intent file and not `7.1`'s report, because the report comes before the approval that lets
the file exist. `add-plan-authoring` owns the rules, under **The Ticket**.

```
IF ABOUT TO WRITE `## Open`:
  ⛔ DO NOT: Park a question there that one more turn of conversation would settle
  ⛔ DO NOT: Leave the section empty as a way of saying "nothing open"
  ✅ DO: Write the literal `None` when everything closed — an empty section reads as absent,
         and absent makes the planner run its full questionnaire
```

⛔ **Nothing is written on `spike`, and a spike is asked no three-option question.** A spike’s output
is a recommendation, and keeping it is a new request with its own classification.

#### Then route

**Name both files in the handoff**, verbatim, whichever this path wrote. The planning stage reads
`docs/brainstorming/` and needs to know which file — a handoff naming only the idea leaves it matching
a topic against a directory of timestamped basenames, and in Continue Mode that directory holds a
whole set sharing one timestamp.

On `delivery: confirm` and `architectural`, print this and STOP:

```
Idea is ready to formalize. Run: /add-framework--plan [idea]
Design: docs/brainstorming/<the file written at 5.3>
Intent: docs/brainstorming/<the intent file written above>
(brainstorm stops here — it does not run the next stage for you.)
```

On `bounded`, there is no design document, so that line is omitted and the `Intent:` line stands alone.

On `delivery: automatic`, print the same lines with the last one reading `(delivering automatically —
the build will ask before opening the PR.)`, then load `/add-framework--plan` with the intent file as
its argument and continue there.

⛔ **On `spike`, do NOT route to the planner at all.** A spike’s terminal state is its recommendation.
Sending it to a full planning pass contradicts this skill’s own ratchet — `2.2.3` already says a
spike whose answer is "yes, and here is how" is a NEW request, which gets its own classification and
its own run. Report the recommendation and stop.

### 7.4 Offer Refinement (If Umbrella)

Umbrella specs exist only on the `architectural` path, so this sub-step does not apply on the other
two. That is a condition it already carried, not a path carve-out.

If umbrella spec: "You can now refine individual subtopics by running `/add-framework--brainstorm vamos refinar [topic] -> ref: [the umbrella's own filename]`"

---

## STEP 8: Continue Mode (Topic Refinement from Umbrella)

Triggered when STEP 1.0 detects a refinement invocation.

### 8.1 Load Umbrella Spec, and Inherit Its Objective

Read the referenced umbrella spec file at the path captured in STEP 1.0.

**Copy its `## Objective` into this subtopic VERBATIM**, then write one line beneath it: **how this
subtopic serves that objective.**

```
IF REFINING A SUBTOPIC FROM AN UMBRELLA:
  ⛔ DO NOT: Let the subtopic author an objective of its own — a set with several objectives is
             several sets
  ⛔ DO NOT: Paraphrase, narrow or "clarify" the umbrella's objective on the way in
  ⛔ DO NOT: Write the serves-line from the umbrella's own Decomposition Map cell — that cell is what
             the map CLAIMED; this line is what the refined subtopic can actually support
  ✅ DO: Copy the objective byte for byte, then state what this subtopic advances in it
```

**Worked example of the line**, from a set that shipped: *"Serves the objective by preserving the
per-F-block history a fast delivery produces, so removing ceremony at the front does not cost the
record at the back."* One clause, naming a PART of the objective — never the whole of it restated.

⛔ **A subtopic that cannot write that line is not a member of this set. STOP and say so**, naming
which of the two readings applies — the command does not pick between them:

| Reading | What it means | What happens next |
|---|---|---|
| The subtopic belongs elsewhere | It is real work, on a different objective | It becomes its own brainstorm, not a member here. The umbrella's Decomposition Map drops the row |
| The umbrella's objective is too narrow | The subtopic serves the actual goal; the objective was written smaller than the goal | The **umbrella** is corrected first, and every sibling re-checked against the wider objective |

**Both readings have been true at once, which is why neither is assumed.** A set shipped here had a
subtopic that did not serve the objective **and** an umbrella whose objective was written too narrowly
to see it — the subtopic was refined, planned, reviewed and reworked before anyone read the two side
by side. A gate that allowed only one diagnosis would have mis-read it.

⛔ **This STOP presents a decision; it is not a confirmation.** Nothing downstream can recover a
subtopic that serves nothing: the planner will carry it, the reviewer will pass it, and the build will
deliver it.

### 8.2 Ask the Delivery Index, Then Dispatch Framework Discovery (SILENT)

**Ask the index BEFORE dispatching the agent, exactly as `### 1.2` requires.** ⛔ **Continue Mode
reaches this step by jumping from `1.0`, so it never ran `1.2` and the lookup is owed here or
nowhere.** `### 1.2` owns the question and the verb — load `add-artefact-graph` and resolve it there.

**The reason `1.2` gives applies at least as strongly here.** That step calls this skill *"the one
most likely to re-invent something that already shipped and was dropped"*, and a subtopic refinement
is where an idea first becomes a concrete artefact proposal. A `gone` or `superseded` entry is the
answer that changes the design.

**DISPATCH AGENT:** `@framework-discovery-agent`
- **Capability:** read-only
- **Complexity:** standard
- **Input:** `topic` (the subtopic extracted at STEP 8.1), `scope: both`, and `prior_deliveries` on
  the same terms `### 1.2` states — **omitted entirely when the lookup resolved nothing.**

Use the report as grounding context for the exploration. Do NOT show raw output verbatim.

### 8.3 Start STEP 2 (Understand the Idea) — Clarifying Questions Only

Ask clarifying questions specific to the subtopic, grounded in the umbrella's context. This is
**`2.1.2` only.**

⛔ **NOT `2.1.1`. `8.1` already settled the objective for this subtopic, by copying the umbrella's.**
`2.1.1` drafts a fresh one and gates on it being stated; running it here would author the very thing
`8.1` forbids a subtopic to author. The five questions at `2.1.2` still run — they sharpen how this
subtopic serves the inherited objective, which is a different job from writing one.

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
- State the classified effort path in one line and continue in the same turn — never ask the user to confirm it
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
- Load any command or skill on its own initiative, by whatever mechanism this provider offers — handoff is text-only on every path except the one `Approve, deliver automatically` authorises
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

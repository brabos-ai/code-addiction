# Feature Discovery & Documentation

<!-- uses:
- skill: add-doc-schemas
- skill: add-delivery-mode
- skill: add-feature-specification
- skill: add-final-report
- skill: add-id-convention
- skill: add-knowledge-discovery
- skill: add-plan-review
- skill: add-review-discipline
- skill: add-doc-schemas/references/new-feature.md
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
- skill: add-subagent-driven-development
- skill: add-subagent-driven-development/references/dispatch-rules.md
- agent: plan-reviewer-agent
- command: /add.brainstorm
- command: /add.build
- command: /add.plan
- command: /add.wiki
- script: init.sh
- script: status.sh
-->

> **REF:** `CLAUDE.md` for architecture patterns
> **OUTPUT:** Max 20 words per response. Tables/lists are exceptions. Straight to the point.
> **The closing report at `## Completion` is exempt** — it reports in the shape `add-final-report`
> owns, and a 20-word stub is not that shape.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Full feature discovery command BEFORE implementation.

**IMPORTANT:** This command is READ-ONLY for project code. May only create/edit documentation in `docs/features/`.

---

## STEP 1: Load Skills + Validate Context

**Load schemas and conventions (ONE-TIME):**
- `{{skill:add-doc-schemas/SKILL.md}}` (feature schema, validation gate)
- `{{skill:add-id-convention/SKILL.md}}` (ID/branch format)
- `{{skill:add-plan-review/SKILL.md}}` (fresh-reader review)

All subsequent steps reference these loaded skills; DO NOT reload.

### 1.1 Resolve the Intent File — BEFORE anything else

`/add.brainstorm` writes `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md` carrying the path it
classified and every decision it closed. **Finding it is what stops this command re-asking them.**

Match the argument as a **substring** of the basenames of `docs/brainstorm/*-intent.md`. A full
basename always works; a 24-character timestamp prefix is not typeable, so a slug fragment is the
normal argument.

| Result | Do |
|---|---|
| Exactly one match | That is the file. Read it |
| More than one | ⛔ STOP. Print every candidate basename and ask which |
| No argument | Match the description's keywords against the basenames |
| Nothing credible | Continue with no intent file — STEP 3 runs the three-fact test instead |

```
IF TWO OR MORE INTENT FILES MATCH:
  ⛔ DO NOT: Pick the newest one because it is the newest
  ⛔ DO NOT USE: Write on about.md until the user has named which
  ✅ DO: Print the candidates and ask — another exploration's decisions written into
         this feature's about.md is worse than one question
```

**Read three things from it before anything else:**

| Field | Carries | Absent |
|---|---|---|
| `delivery:` | `confirm` or `automatic` — how every stop below behaves, per `{{skill:add-delivery-mode/SKILL.md}}` | `confirm` |
| `## Objective` | The outcome this feature is for. `add-feature-specification` copies it into `about.md`, and STEP 5 checks every subfeature against it | The skill drafts one with the user |
| `ticket:` | The backlog ticket this work came from. STEP 2 copies it into `about.md`, per the `add.new` row of `{{skill:add-backlog/references/lifecycle.md}}` | No ticket — the normal case |

**Stop kind — the two-match STOP above is deciding, in every state.** Nothing approved which exploration
an ambiguous argument meant.

**An intent file is consumed once.** Record its path in `about.md` when STEP 6 writes the document.
Continue Mode reads `about.md` from then on, which is the source of truth from that point — the intent
file is never read a second time.

**Validate Execution Context:**

- [CONTINUE MODE] Feature resolved from argument, or from current branch if it is a feature branch, or by listing `docs/features/` pending entries and asking. If `about.md` exists AND carries its validated decisions → skip STEP 2 and STEP 3, proceed to STEP 4.
- [NEW FEATURE] If no existing feature docs match, proceed to STEP 2.

---

## Execution Constraints & Modes

**READ-ONLY GUARANTEE:**
- ⛔ DO NOT MODIFY: src/, apps/, libs/, packages/, configs, commands, skills
- ⛔ DO NOT: Run build/test/deploy, write code, implement features
- ✅ MAY: Create `docs/features/[XXXX]F-[name]/**/*.md`, run init.sh (NO git writes — branch is created later by /add.build)

**Operation Modes:**
- `/add.new [description]` — Create new feature
- `/add.new [slug-fragment]` — Create from a named intent file (see STEP 1.1)
- `/add.new F0018` — Continue existing feature (F-ID)
- `/add.new continue` — Continue feature from current branch **or most recent pending feature**

**Ceremony is measured, never matched against a word list.** The intent file's `path:` decides it; with
no intent file, `{{skill:add-feature-specification/SKILL.md}}`'s three-fact test measures it — intent
gaps, irreversible actions, footprint. Clean on all three takes the light path.

```
IF DECIDING HOW MUCH CEREMONY THIS REQUEST NEEDS:
  ⛔ DO NOT: Classify from keywords in the request ("fix", "add field", "create")
  ⛔ DO NOT: Assume the light path because the request reads small
  ✅ DO: Read `path:` from the intent file, or run the three-fact test
```

**A keyword is not a measurement.** "Add a field" is a migration on a table with ten million rows as
often as it is a one-line change, and the word list cannot tell those apart.

---

## STEP 2: Init + Allocate ID + Create Structure (NEW FEATURES ONLY)

**Execute init + allocate ID (`status.sh next-id F`):**

```bash
bash .codeadd/scripts/init.sh
bash .codeadd/scripts/status.sh next-id F
```

Parse RECENT_CHANGELOGS (feature history). Read `docs/product/product.md` if it exists. Match user request keywords against changelog; if match found, read full `changelog.md` for patterns/files/implementations.

**Allocate ID** (e.g., `0042F`). Using ID/branch conventions from STEP 1 skills, infer branch type (`feature`|`fix`|`refactor`|`docs`) and name (kebab-case, 2-4 words).

**Create structure:**
1. Record decision: add `branch: [type]/[NNNN]F-[name]` to the skeleton about.md frontmatter (NO git writes — /add.build creates the branch)
2. `mkdir docs/features/[NNNN]F-[name]/`
3. Create skeleton `about.md` with frontmatter (now including `branch:`, and `ticket:` on the line after it when STEP 1.1 read one; full content in STEP 4)

```
IF STEP 1.1 READ A ticket:
  ⛔ DO NOT USE: Bash to run backlog-commit.sh or any other board write — this command
                 makes NO git writes, and the READ-ONLY GUARANTEE above says so
  ⛔ DO NOT: Set the ticket's work_id here, though the feature id is now in hand —
             /add.build owns that write
  ✅ DO: Copy the id into about.md frontmatter, and stop there
```

**Output:** Feature ID, branch (recorded — created by /add.build), directory.

---

## STEP 3: Deep Discovery (FULL PATH ONLY)

**Determine the path first.** Read `path:` from the intent file resolved at STEP 1.1. With no intent
file, load `{{skill:add-feature-specification/SKILL.md}}` and run its three-fact test.

| Classification | This STEP |
|---|---|
| `bounded`, or clean on all three facts | **Skipped.** Run the INDEX and GRAPH steps below and nothing else — they are cheap, they dispatch no agent, and they are what stops this feature rebuilding something already delivered |
| `architectural`, or any fact flagged | Everything below, as written |

⛔ **The light path skips the two agent dispatches, never the index and graph queries.** Those are the
check that costs nothing and catches the expensive mistake.

**Goal:** Collect rich context for the decisions the intent file left open.

**Dispatch sequential agents (agent 2 depends on agent 1 output):**

1. **Agent: Past Features Discovery**
   - **Input:** RECENT_CHANGELOGS + skeleton about.md
   - **Output:** `docs/features/${FEATURE_ID}/past-features.md`
   - Extract keywords from about.md. For each feature in RECENT_CHANGELOGS, check Quick Ref in changelog.md (fallback: first 30 lines). For matches, read iterations.jsonl + about.md, classify relationship. Write past-features.md.
   - **WAIT:** Verify past-features.md exists before continuing.

2. **Agent: Codebase Discovery**
   - **Input:** past-features.md + skeleton about.md + feature request + selected wiki pages (if any, see Knowledge Base Check below)
   - **Output:** `docs/features/${FEATURE_ID}/discovery.md`
   - **Knowledge Base Check (before dispatch):** Load `{{skill:add-knowledge-discovery/SKILL.md}}` and run its **INDEX step, its GRAPH step and then its wiki steps**, in that order.
     - **INDEX and GRAPH run first, and run unconditionally.** Both are standalone, neither reads the wiki, and together they produce the ranked delivery-index entries and `RELATED_WORK`. **GRAPH question:** does this request already exist as delivered work, and what would it depend on? Resolve it in the skill's action table; do not name an action here.
     - **Then the wiki.** This command never runs the full context mapper, so check presence directly: test whether `.codeadd/wiki/index.md` exists. IF present: SELECT the minimal page set for the request's domain(s), freshness-check each, and pass their paths + one-line reasons + freshness verdicts into the dispatch prompt below with the instruction to build on documented knowledge instead of re-deriving it, and to flag any wiki-vs-code contradiction in its return. IF absent: note "knowledge base unavailable — /add.wiki generates it" and dispatch without it.

```
IF THE WIKI IS ABSENT:
  ⛔ DO NOT: Skip the INDEX and GRAPH steps along with it
  ✅ DO: Run both anyway — neither reads the wiki, and RELATED_WORK is what
         STEP 6.1 writes its relations from
```

   - **`RELATED_WORK` destination:** it has two, and one result serves both, never re-derived. Its ids and relations go to **`add-feature-specification`, which shows what already exists on the STEP 4 confirmation screen**; and into the document's `## Relations`, where a prerequisite becomes `depends_on`. The intent file's `## Prior art` covers the same ground for anything it already names — do not query twice for one answer.

```
IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:
  ⛔ DO NOT: Carry on as though the step ran
  ✅ DO: Fill it with the hits, with `none` when the graph answered and had no match,
         or with `NOT VERIFIED` plus the reason when the graph could not be reached
```

   - Read past-features.md FIRST. Prioritize files touched by related features. Perform deep analysis: reusable functionality, existing patterns, integration points, prerequisites. Include "Related Features" section with table + refs. Write discovery.md using the section list above.

<!-- plugin:gitnexus:graph-map -->
<!-- /plugin:gitnexus:graph-map -->

**Coordinator: Deep Thinking (before STEP 4)**

Evaluate using agent outputs:
- Impact on existing features (from past-features.md)?
- Edge cases + error flows (timeout, conflict, partial failure)?
- Consistency between requirements?
- Missing UX gaps?
- Implicit assumptions (auth, permissions, ordering)?
- Non-obvious scenarios?
- Related features with correct relation types?
- Technology decisions pre-decided by codebase?

Feed the result to `add-feature-specification` as grounding. Anything it raises that the intent file
already settled is context for the confirmation screen, never a new question.

---

## STEP 4: Confirm What Will Be Written [STOP]

**LOAD `{{skill:add-feature-specification/SKILL.md}}`.** It owns what goes into `about.md`: reading the
intent file, extracting its closed decisions, asking only what is still open, the three-fact test, and
the confirmation screen. **This STEP owns the `[STOP]` around it and nothing else.**

```
IF A DECISION IS ALREADY UNDER `## Decided` IN THE INTENT FILE:
  ⛔ DO NOT: Ask about it, confirm it as a question, or offer alternatives to it
  ⛔ DO NOT: Rebuild the five-section questionnaire this STEP used to carry
  ✅ DO: Show it on the confirmation screen as settled, and move on
```

**What the user sees depends on what is left open:**

| `## Open` in the intent file | This STEP |
|---|---|
| Reads `None` | The confirmation screen alone. One screen, no questions |
| Lists items | Those questions, one per turn, then the confirmation screen |
| Absent, empty, or no intent file at all | The skill’s full question set, then the confirmation screen |

**STOP AND WAIT after the confirmation screen** — except where the table below says the stop passes.
The user corrects an extraction error or waves it through. **The approval never scales away — only the
interrogation does.**

**Stop kind — decided by what is left open:**

| State | Kind | On `delivery: automatic` |
|---|---|---|
| `## Open` reads `None` | **confirming** | Print the confirmation screen in full and continue to STEP 5 — the brainstorm's approval already covered it |
| `## Open` lists items | **deciding** | Ask them and wait — no approval answered them |
| Absent, empty, or no intent file | **deciding** | Wait — there is no approval to have covered anything |

On `delivery: confirm` every row waits.

⛔ **A confirmation screen that asks questions is a questionnaire wearing a different name.** It
restates what is about to be written and invites a correction. It does not re-open settled decisions.

---

## STEP 5: Decomposition Gate

**Skipped entirely on the light path.** A `bounded` change is one flow by definition, and the three-fact
test already put anything larger on the full path.

**Analyze the confirmed scope for independent user flows.**

**Independent flow** = testable in isolation, distinct objective, could be own PR. Keywords: "will also", "and then", "another flow".

**IF N = 1:** Skip decomposition, continue to STEP 6.
**IF N >= 2 [STOP]:** Propose decomposition. **Each subfeature states, in one line, how it serves the
feature's `## Objective`** — naming a PART of it, never the whole objective restated:

```
Identified [N] independent flows:

SF01: [name] — [objective]
      Serves the feature objective by: [the part of it this subfeature advances]
SF02: [name] — [objective]
      Serves the feature objective by: [the part of it this subfeature advances]

Suggested order:
1. SF01 (no deps)
2. SF02 (depends on SF01)

Decompose as subfeatures? (yes/no)
```

```
IF A SUBFEATURE CANNOT WRITE ITS "SERVES THE FEATURE OBJECTIVE BY" LINE:
  ⛔ DO NOT: Propose it as a member of this epic
  ⛔ DO NOT: Pick between the two readings below on the user's behalf
  ✅ DO: STOP, name the subfeature, and present both readings
```

| Reading | What it means | What happens next |
|---|---|---|
| The subfeature belongs elsewhere | It is real work, on a different objective | It leaves this epic and becomes its own feature, through its own `/add.brainstorm` or `/add.new` |
| The feature's objective is too narrow | The subfeature serves the real goal; the objective was written smaller than it | `about.md`'s `## Objective` is corrected first, and every other subfeature is checked again against it |

**Both readings can be true at once, which is why neither is assumed.** Nothing downstream recovers a
subfeature that serves nothing: the plan will carry it, the reviewer will pass it, and the build will
deliver it.

**Stop kind — the decomposition proposal and this membership STOP are both deciding, in every state.**
Whether to split the feature, and whether a subfeature belongs, were never part of the brainstorm's
approval.

**IF epic confirmed:**
1. Create `docs/features/${FEATURE_ID}/epic.md` per the `epic` schema — READ it in `{{skill:add-doc-schemas/references/new-feature.md}}` (the schema body lives in that reference file, NOT in the `SKILL.md` index loaded in STEP 1): frontmatter `id: [NNNN]F`, `type: epic`, `related: [[NNNN]F]` — `id` is the BARE feature id (`0042F`), the same value `about.md` carries, NEVER the `${FEATURE_ID}` directory name (`0042F-user-preferences`), which the schema rejects; TL;DR; **Subfeatures** table with a **required header row naming every column** (`id | name | objective | status | dependencies | checkpoint`), then one row per subfeature — `status` starts `pending`, leave `dependencies`/`checkpoint` cells empty unless known; Order (optional) and Notes (optional) sections
2. Create `docs/features/${FEATURE_ID}/subfeatures/SF01-[name]/` directory
3. Create a compact `about.md` per subfeature through `{{skill:add-feature-specification/SKILL.md}}` — hand it the feature's `## Objective` and that subfeature's "serves the feature objective by" line; the skill writes the objective, `## Relations` (`part_of` the epic) and the rest
4. **On `delivery: automatic` only — ask once how the epic runs** (deciding, in every state), with the recommendation marked:

   | Option | What happens |
   |---|---|
   | **Continue automatic** (recommended when the subfeatures are independent) | Every pending subfeature runs in dependency order, each through plan, build and review. The PR question comes once, at the end |
   | **Semi-automatic** (recommended when a later subfeature depends on what an earlier one decides) | Each subfeature runs unattended, then the delivery stops before the next one starts, showing what was delivered and what comes next |

   Write the answer as one line under `epic.md`'s `## Notes`: `delivery: automatic` or
   `delivery: semi-automatic`. `{{skill:add-delivery-mode/SKILL.md}}` owns what each value does, and
   `/add.plan` and `/add.build` read that line rather than asking again.

   On `delivery: confirm`, ask nothing and write no line — the epic runs one command at a time.
5. Continue to STEP 6

**IF single feature:** Continue to STEP 6.

---

## STEP 6: Document (Feature + Codebase Analysis)

**Completeness Check:**
Verify every item the confirmation screen showed was accepted or corrected, and that no `## Open` item
is still unanswered. IF MISSING → ask that item alone.

**Consistency Check:**
- New route/endpoint → Backend MANDATORY
- New field/entity → Database MANDATORY
- User needs UI → Frontend MANDATORY
- NEVER exclude layers needed to deliver validated scope

**`add-feature-specification`, loaded at STEP 4, writes the document.** It owns the schema load, the
sections and the extraction. This STEP owns the path and the provenance:

- **Path:** `docs/features/[NNNN]F-[name]/about.md`
- **Provenance:** record the intent file path consumed at STEP 1.1 in the frontmatter. Continue Mode
  reads `about.md` from then on and never re-reads the intent file.

⛔ **DO NOT restate the skill’s authoring rules here.** Two copies drift, and the drift is invisible
until a document written by one entry point fails a gate the other passes.

### 6.1 Hand the relationship material to the skill

The relationships are already in hand from STEP 3: `past-features.md` carries a **Related Features**
table with ids, `RELATED_WORK` from the Knowledge Base Check carries more, `discovery.md` names the
prerequisites, and the intent file’s `## Prior art` carries whatever the brainstorm already found.

**Pass all four to `{{skill:add-feature-specification/SKILL.md}}`, which writes `## Relations`,
`## Observations` and `tags:` from them.** This sub-step routes the material; it discovers nothing and
asks nothing.

⛔ **DO NOT write those sections here.** The skill is the single writer of `about.md` — a rule kept in
this command drifts from the schema the skill writes against, and produces two readings of one document.

**Dispatch Agent: Codebase Analysis**
- **Input:** Feature name, about.md path
- **Output:** Write `docs/features/${FEATURE_ID}/discovery.md` (prerequisites, related files, existing patterns)

---

## STEP 7: Validation Gate

Execute validation gate for `feature` schema (from STEP 1 skills).

**MANDATORY.** DO NOT skip. DO NOT mark complete until gate returns `PASS`.

---

## STEP 8: Plan Review — FULL PATH ONLY

Schema gate PASSED (STEP 7). Do not present `about.md` or the next command as delivered yet.

| Classification | This STEP |
|---|---|
| `bounded`, or clean on all three facts | **Skipped.** Zero agent dispatches — go to Completion |
| `architectural`, or any fact flagged | Dispatch the reviewer below |

⛔ **On the light path `about.md` receives no verdict-bearing review, and that is deliberate.** The
schema gate still ran, the confirmation screen caught extraction errors, and the three-fact test
already excluded irreversible actions and large footprints from this path. A weak document still
surfaces at `/add.plan`, in the verdict on the plan derived from it.

**Before any dispatch in this command:** read `{{skill:add-subagent-driven-development/references/dispatch-rules.md}}` — a fresh dispatch leaves the engine's resume and session fields empty; only an id an earlier dispatch returned is ever passed.

1. **DISPATCH** `@plan-reviewer-agent` in fresh context (does NOT see this conversation) with `path` = about.md’s path and `kind: feature`. **Fallback:** if the provider has no subagent dispatch, apply `{{skill:add-plan-review/SKILL.md}}` inline, explicitly forgetting this conversation.
2. **Act on the verdict.** **LOAD `{{skill:add-review-discipline/SKILL.md}}`.** Its **Acting on the Verdict** table governs this dispatch. Read it there. Do NOT mark `about.md` delivered while a blocker stands.

**Stop kind — a `blocked` verdict is deciding in every state.** Its blockers are decisions nobody made,
so an automatic delivery waits on them exactly as a confirmed one does.

⛔ **Do NOT read that skill’s readback-divergence table as governing this step.** It names the sites that dispatch a readback, and this command is not one of them any more.

⛔ **This command dispatches no readback.** The single readback of the whole flow runs at `/add.plan`,
whose target is `docs/features/${FEATURE_ID}` — which already contains this `about.md`. The read moved;
it was not removed.

---

## Continue Mode (Re-Invocation)

**Detect:** Feature ID from argument, from current branch (if feature branch), else list pending features and ask.

**Skip Logic:**
- If `about.md` exists AND carries its validated decisions → Skip STEP 4, proceed to STEP 5
- If `discovery.md` exists AND contains "Related Features" → Skip STEP 3 discovery agents, proceed to STEP 5
- If validation gate passed (logged state) → Skip STEP 7, proceed to STEP 8 (full path) or Completion (light path)

**Load iterations.jsonl** (if exists) to understand prior implementations/pivots. Avoid re-work.

**Create TodoList with ONLY missing steps.** Continue execution.

---

## Completion

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the artefact paths and the next command come after it.

This command documents a feature rather than building it, so block 2 is titled `What will be done`
and written in the future tense. Fill `How it works` with what the documented feature will do for the
user, not with what the document contains.

Then, after the seven blocks, summarize the created artifacts and suggest the next command based on discovery: `/add.plan` for technical planning (design is produced inside `/add.plan`’s own UX step when the feature touches UI), `/add.build` for implementation.

**Stop kind — confirming.** The report describes work the brainstorm's approval already covered.

| `delivery:` | Do |
|---|---|
| `confirm`, or absent | Print the report and the suggestion, and STOP. The user runs the next command |
| `automatic` | Print the report and the line `(delivering automatically — continuing to /add.plan.)`, then follow {{cmd:add.plan}} with this feature's id, from its first step, as `add-delivery-mode` describes |

⛔ **On `automatic` the next command is always `/add.plan`, never `/add.build`.** The plan is where the
objective reaches the reviewer and where an epic's consistency check runs.

---

## Execution Rules

**ALWAYS:**
- Resolve the intent file before anything else, and stop rather than guess between two matches
- Measure ceremony from `path:` or the three-fact test, never from keywords in the request
- Run the INDEX and GRAPH queries on both paths — the light path skips agents, not the cheap checks
- Record the consumed intent file path in `about.md`
- Read `delivery:` from the intent file, and treat an absent one as `confirm`
- Check every proposed subfeature against the feature's objective before proposing the split

**NEVER:**
- Ask again about anything under `## Decided` in the intent file
- Restate `add-feature-specification`’s authoring rules in this command
- Read `## Open` as closed when the section is empty or absent
- Proceed without response to [STOP] points
- Exclude layers that make the feature unusable
- Dispatch a readback — `/add.plan` owns the only one in this flow
- Let the reviewer see this conversation (fresh context only)
- Pass a deciding stop on `automatic` — only a confirming stop passes

---
name: building-commands
description: Use when designing command workflows or refactoring existing commands — applies prompting best practices to ensure agents execute intended logic instead of skipping steps or rationalizing. Use this skill whenever creating new commands, reviewing why a command skipped steps or executed out of order, fixing agent compliance issues, converting Phase-based commands to STEP-based, or when /add-framework--build or /add.build needs to generate a command. Also use when the user mentions "o agente pulou", "agent skipped", "command não funciona", or asks to improve prompt quality of any .md command file.
---

# Building Commands

<!-- uses:
- skill: add-final-report
- command: /add-framework--build
- skill: building-commands/references/agent-dispatch.md
- mention: add-framework-development
- mention: add-review-discipline
-->

<!--
`add.md` and `add.ux` below are PRODUCT commands and are named in prose on
purpose. They are deliberately NOT declared: `uses:` targets resolve inside the
declaring artefact's own layer (scripts/build.js), so `- command: /add.md` from
here would resolve to `internal/command/add.md`, which does not exist, and the
dangling gate would fail the build. The prose sniff skips cross-layer names.

The same applies to the product `add-final-report`. `- skill: add-final-report`
above resolves to the INTERNAL one, which is correct — the product sibling
carries the same name and cannot be addressed from here at all.
-->

## Overview

**Commands fail not from unclear logic but from unclear PRESSURE POINTS.** Agents skip steps when gates are implicit, execute wrong order when sequence isn't mandatory, and rationalize when checklists are vague timelines instead of checkboxes.

**Core principles:**
1. **Imperative > Informative** — Commands are ORDERS, not documentation
2. **Tool-specific prohibitions** — "DO NOT USE Grep" instead of "STOP"
3. **Gates block** — Execution path impossible to get wrong
4. **Checklists verify** — Checkboxes, not timelines

---

## When to Use

**Symptoms you need this skill:**
- Commands have optional "recommendations" agents skip
- Investigations jump to code before reading docs
- Agents skip branch creation / environment setup steps
- Build/test failures reveal missing validation points
- Post-command status doesn't match what was supposed to happen

**Apply when designing/refactoring commands:** hotfix, dev, done, feature, plan, etc.

**NOT for:** Single-line commands, emergency fixes (use quick judgment)

---

## Command Structure

The high-level flow every command follows: load context → gate check → investigate → execute → complete. Prohibitions sit at the top so the agent processes them before any action.

```
1. LANG header (MANDATORY)
2. ⛔ Blocking section — prohibitions BEFORE instructions
3. STEP 1: Load context
4. STEP 2: Validate/discover (gate check)
5. STEP 3: Investigate (docs → code)
6. STEP N: Execute
7. STEP N+1: Complete (inform user)
8. Rules — ALWAYS/NEVER markdown
```

### Template

```markdown
# Command Name

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

[1-line description]

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: [action]            → [constraint]
STEP 2: [action]            → [constraint]

**⛔ ABSOLUTE PROHIBITIONS:**

IF [condition]:
  ⛔ DO NOT USE: [specific tool]
  ✅ DO: [correct action]

---

## STEP 1: ...

---

## Rules

ALWAYS:
- [verb] ...

NEVER:
- [verb] ...
```

---

## Language Rule (MANDATORY)

**ALL commands MUST be written 100% in English.** Commands are consumed by multiple providers and contributors across languages — English is the common denominator. User interaction language is handled by the LANG header.

**MANDATORY first line after title:**
```markdown
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
```

This ensures:
- Command logic, headers, rules, gates → **English**
- Agent responses to user → **user's detected language**
- Git commits, branches, code → **English**

**DO NOT create "detect language" blocks.** The LANG header is sufficient. Modern models detect language automatically from user input. Blocks like "FIRST ACTION: DETECT RESPONSE LANGUAGE → 1. Read user's message → 2. Set RESPONSE_LANG..." waste tokens and add zero behavioral value.

---

## Imperative Language (FUNDAMENTAL)

Commands are ORDERS, not documentation. Agents treat informative text as optional context. Imperative text is processed as mandatory instruction.

```
❌ "It's recommended to create the branch before editing code"
✅ "CREATE the branch. DO NOT edit code on main."

❌ Phase 1: Quick Discovery
✅ STEP 1: Run Context Mapper (FIRST COMMAND)

❌ "The suggested order is: docs → code → implementation"
✅ "MANDATORY ORDER: 1) READ docs 2) INVESTIGATE code 3) IMPLEMENT"
```

Use `STEP N:` for sequential mandatory actions, `N.1`/`N.2` for sub-actions. Add imperative context: `(FIRST COMMAND)`, `(MANDATORY if main)`, `(BEFORE code)`.

---

## Gate Implementation

**NOT:** "Recommended: Check X"
**YES:** "⛔ GATE: If X not true → STOP, do Y first"

Agents respect explicit blockers more than recommendations. The reason generic gates fail is that saying "STOP" doesn't prevent the agent from using Grep/Read — you need to **prohibit specific tools**.

```
❌ WEAK (agent ignores):
⛔ GATE: Branch must be fix/F*
   If main → create branch first

✅ STRONG (agent obeys):
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on code files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation or implementation
  ✅ DO: Create branch IMMEDIATELY
```

**Why it works:** "STOP" is vague. "DO NOT USE Grep" is specific and verifiable.

### Condition Block Format

Prohibitions must be **tied to specific conditions**:

```
IF [condition]:
  ⛔ DO NOT USE: [specific tool]
  ⛔ DO NOT: [specific action]
  ✅ DO: [correct action]
```

### Top-of-File Placement

Prohibitions must come BEFORE instructions. If they're in the middle or end, the agent has already started executing wrong. Agent reads top-down — prohibitions at the top are processed before any action.

---

## Checklists, Not Timelines

Checkboxes are verifiable — either done or not. Timelines are estimates the agent ignores because there's no verification mechanism.

```
❌ BAD:
Phase 2: Rapid Investigation (5-10 minutes)
- Analyze flow
- Find root cause

✅ GOOD:
### PRE-INVESTIGATION
- [ ] Script executed
- [ ] RECENT_CHANGELOGS analyzed
- [ ] Feature docs read

### DURING
- [ ] Root cause identified
- [ ] Confirmed with user
```

---

## Investigation Order (MANDATORY)

```
1. Parse script output → identify related features
2. READ docs (changelog, about.md) → understand WHAT changed + WHY
3. NOW search code → understand HOW (with context from docs)
```

Most bugs relate to recent changes. Script output points directly to the relevant context. Jumping to code without reading docs means investigating blind.

---

## No `## Spec` Section (PROHIBITED)

DO NOT add a `## Spec` section to commands or skills. Output paths, modes, schemas, write boundaries, and similar metadata belong in the frontmatter `description` and the STEP body — not in a separate JSON metadata block at the top of the file.

Why: nothing programmatically consumes `## Spec` (build.js, CLI, runtime all ignore it). It duplicates information already in the description and STEPs, which creates drift risk. Open-source contributors must mentally pretty-print minified JSON to read it.

```
❌ DO NOT — top-of-file metadata block:
## Spec
```json
{"outputs":{"plan":"docs/features/${FEATURE_ID}/plan.md"},"schema":"feature-plan"}
```

✅ DO — state output and schema in prose where they're used:
## STEP 9: Write plan.md
Write to `docs/features/${FEATURE_ID}/plan.md` per the `feature-plan` schema.
```

If a JSON example genuinely helps (e.g., showing the shape of an output document), put it under a heading that names what it is — `## Output Format`, `## Output Template` — inside the section that explains the output. Not as a metadata block at the top.

---

## Bash Blocks: Intent Over Script

**DO NOT prescribe bash commands for operations the LLM already knows.** `git branch --show-current`, `cat file | grep`, `git checkout && git merge` — these waste tokens stating the obvious.

**Use explicit bash ONLY when:**
- A past error proved the LLM gets it wrong without guidance (e.g., `git fetch --tags` before listing tags)
- The exact command matters and is non-obvious (e.g., specific flags, pipe chains)
- The command has side effects that must be precise (e.g., `sed` with exact regex)

```
❌ BAD (obvious):
Execute: git branch --show-current
If not main, display error and stop.

✅ GOOD (intent):
Verify current branch is `main`. If not → show current branch, instruct to switch, STOP.

✅ GOOD (non-obvious, learned from error):
Execute:
  git fetch --tags
  git tag --sort=-v:refname
CRITICAL: Without fetch, remote tags are invisible locally.
```

---

## Display Templates: Let the LLM Generate

**DO NOT prescribe fixed message templates.** The LLM generates better contextual messages than hardcoded templates. Templates waste tokens for worse output.

**Exception:** Output format templates that define downstream structure (changelog format, report format) ARE useful — they define what the output looks like, not what the error message says.

```
❌ BAD (fixed error message):
If NOT_FOUND, display:
  "GitHub CLI (gh) not found. Install: ..."

✅ GOOD (intent):
If gh not found → show install instructions for user's platform and STOP.

✅ GOOD (output format template):
Format changelog (omit empty sections):
  ## Commands
  - Added: [list]
  - Modified: [list]
```

---

## The Closing Step Reports in One Shape

**Every command that finishes work ends by loading `add-final-report` and reporting through it.** Not
its own invented list of facts — that is what produced twenty-one different closings, none of which
told the user how the delivered thing works.

Load the one in the command's OWN layer. An internal command loads the internal skill; a product
command loads the product one with `{{skill:add-final-report/SKILL.md}}`. **They carry the same seven
blocks and different vocabulary, and neither can reference the other** — the internal layer's
directory does not exist in a user's project.

The shape WRAPS the command's facts, it does not replace them. Whatever the closing step already
demanded still gets reported: a rulings table, a gate matrix, a per-area file count. Those print
whole, after the seven blocks and before the metadata. Plain facts fold into the blocks.

```
IF WRITING OR REVISING A COMMAND'S CLOSING STEP:
  ⛔ DO NOT: Invent a fact list for it
  ⛔ DO NOT: Drop a fact the step already demanded to make room for the shape
  ⛔ DO NOT: Load the skill at STEP 1 — it is needed at the end, and a shape carried
             through fifteen steps is a shape the agent no longer has
  ✅ DO: Load add-final-report at that step and fill its blocks
```

**Two commands are exempt, and only these two.** `add.md` routes to another command and `add.ux`
rewrites an instruction. Neither finishes work, so a delivery report on either is noise. A command
that writes a file, changes state, or opens a PR is not exempt.

---

## Rules Section Format

Commands end with a `## Rules` section using ALWAYS/NEVER markdown. This format uses ~30% fewer tokens than JSON for flat lists, has higher compliance with native imperative language, and aligns with condition blocks already used in commands.

```markdown
## Rules

ALWAYS:
- Complete STEP 3 inspection before ANY layout proposal
- Load relevant skill BEFORE implementing
- Log iteration BEFORE informing user

NEVER:
- Commit or stage any code
- Skip discovery phase
- Proceed without response to [STOP]
```

**Conventions:**
- Each item starts with a verb in infinitive form
- No numbering (permanent rules, not sequence)
- One rule per item — a sentence that needs a second clause is two rules
- Rules MUST contain ONLY information NOT derivable from STEP order or condition blocks

**Test each rule:** "If I remove this rule, would the LLM behave differently given the STEPs and prohibitions?" If NO → redundant, remove it.

```
❌ REDUNDANT (already in STEP order):
ALWAYS: Merge main into production before creating tag  ← STEP 6 before STEP 8

✅ NOT REDUNDANT (business knowledge outside STEPs):
NEVER: Run node scripts/build.js — pipeline's job
```

---

## Log Iteration (Mandatory Completion Step)

Every command that modifies code MUST log iteration before user notification. Iteration tracking enables pattern discovery across runs — without it, the same mistakes repeat because there's no history to learn from.

```bash
bash .fnd/scripts/log-iteration.sh "type" "slug" "what" "files"
```

**Types:** fix, enhance, refactor, add, remove, config

---

## Agent Dispatch

Commands that orchestrate multiple subagents MUST use intent-based dispatch for portability across agent engines. Read `references/agent-dispatch.md` for the full pattern (capability levels, complexity hints, dispatch/wait blocks).

---

## Refactoring Workflow

When refactoring an existing command using this skill:

**STEP 1: Read** — Read the target command completely.

**STEP 2: Audit** — Tick the ruler below yourself, item by item, and list every violation with the
line it sits on. You are the author here; the reviewer that ticks it independently is
`@prompt-review-agent`, and it runs on the delivery, not on your draft.

**STEP 3: Classify** — For each section of the command, assign one action:

| Action | When |
|--------|------|
| **KEEP** | Business logic, domain knowledge, learned-from-error rules |
| **REMOVE** | Spec JSON duplicating STEPs, detect-language blocks, obvious bash, fixed display templates, redundant rules |
| **SIMPLIFY** | Verbose STEPs → intent-only (remove bash/templates, keep what the step must achieve) |
| **REFORMAT** | Rules JSON → ALWAYS/NEVER markdown, PT-BR → English, Phase → STEP |

**STEP 4: Rewrite** — Rewrite the command preserving all business logic. Verify no domain knowledge was lost by comparing KEEP items against the new version.

---

## The Ruler

**Eight items. Every one is ticked, with evidence, before an artefact is published.** The author ticks
them while writing; `@prompt-review-agent` ticks them independently on the delivery. It applies to
every `.md` artefact in either layer — command, skill or agent.

**Evidence, not opinion.** A tick needs the tool output that answers the item (family A) or a line
number and the quoted passage (family B). An item nobody can produce evidence for is not ticked.

```
⛔ NO ITEM HERE MEASURES SIZE:
  ⛔ DO NOT: Add a word, line or character budget to any item
  ⛔ DO NOT: Reject a passage for being long, or accept one for being short
  ✅ DO: Ask whether the passage changes what the executor does — that is item 7
```

A budget makes the writer contort the text to fit instead of removing what has no reason to exist.
The two failures look nothing alike and only one of them matters.

Each item below carries one **Expected** and one **Not expected** example. Where the repository
contains a real instance, that is what is quoted. Where the gates already reject the defect, the
tree cannot supply one and a minimal fragment stands in.

---

### Family A — answered by a tool

The MCP server over the artefact graph answers these three. **`node scripts/build.js` is where two of
them already fail a build**, so family A is mostly a confirmation that the gates ran — its value is
the third item and the neighbour list it produces for family B.

```
IF THE QUESTION IS "WHAT DOES THIS ARTEFACT RELATE TO":
  ⛔ DO NOT USE: Grep to reconstruct it from prose
  ✅ DO: Ask the artefact-graph MCP — `neighbors`, `dependencies`, `impact`
  ✅ DO: Report family A as NOT VERIFIED when the MCP does not answer
```

### 1. Graph closed

The `uses:` block and the prose agree, in both directions. Every agent the artefact dispatches, skill
it loads, command it hands off to and script it runs is declared. Every artefact named in the prose
carries an edge — or a `mention:` when the prose points away from it. No declared edge goes unnamed.

**Expected** — the declaration and the prose naming the same agent:

```
<!-- uses:
- agent: plan-readback-agent
-->
  ✅ DO: Dispatch @plan-readback-agent and WAIT for its restatement
```

**Not expected** — a dispatch the block never declares. `build.js` rejects this as an undeclared
reference:

```
<!-- uses:
- skill: add-review-discipline
-->
STEP 6 dispatches @plan-review-agent and waits for the verdict.
```

### 2. References resolve

Every pointer lands on something that exists: a STEP or sub-step number, a skill or agent name, a
`references/` subdoc, a script path. Every heading and every STEP number is unique in the file.

**Expected** — a load that names its owner, which exists:

```
**LOAD `add-final-report`.** It owns the seven blocks, the banned phrasings and the self-check.
```

**Not expected** — two sections numbered alike, so "§ 8" resolves to neither. Both of these are in
`add-framework-development` today:

```
# 8. Patterns to Enforce
# 8. Declaring Relationships — the `<!-- uses: -->` Block
```

### 3. Mandatory form

The skeleton this skill defines, in full: a LANG header; English throughout; a top-of-file blocking
section before any instruction; STEP rather than Phase; sequential integer numbering; imperative
verbs; gates carrying tool-specific prohibitions in the `IF [condition]: ⛔ DO NOT USE [tool]` shape,
wherever a wrong action is temptingly available; a `## Rules` section as ALWAYS/NEVER markdown with
each rule starting on an infinitive and none numbered; `{{cmd:NAME}}` and `{{skill:NAME/FILE}}` for
resource references and the literal `.codeadd/scripts/` for scripts, per `add-resource-path-convention`;
intent-based agent dispatch with no hardcoded engine identifier; a closing step that loads
`add-final-report` from its own layer at that step; iteration logging where the command modifies code.
No `## Spec` section, and no "recommendation" where a gate belongs.

**Expected** — a gate that names the tool it forbids and the state that forbids it:

```
IF THE CURRENT F-BLOCK IS TAGGED [internal]:
  ⛔ DO NOT USE: Write or Edit on framwork/.codeadd/
  ✅ DO: Load add-framework-internal-layer and apply its checks
```

**Not expected** — documentary heading, and a stop with no tool named:

```
**Phase 1:** Load the context, then STOP if the branch is wrong.
```

---

### Family B — read and judged

Three items ask about this artefact alone; two ask about it against the neighbours family A listed.
**Every failure carries a line number and the quoted passage.** A finding with no quote is not a
finding.

### 4. Contract with the neighbours

What a step sends is what the receiver says it takes. What the step expects back is the shape the
receiver returns. What the artefact says a neighbour does is what that neighbour does. Scope: every
`DISPATCHES`, `USES_SKILL` and `HANDS_OFF_TO` edge family A listed, read at depth 1.

**Expected** — the caller sends `path`, and the agent's own input contract takes `path`:

```
- **Input:** `path` — the plan file resolved at STEP 1.1
- `path`: file to review (required)
```

**Not expected** — a caller inventing a field the receiver never reads:

```
- **Input:** `artefact`, `severity_floor: medium`
- `path`: file to review (required)
```

### 5. Single owner

Each rule lives in one artefact. A second artefact that needs it delegates by name instead of
restating it. Two copies drift, and the drift is invisible until they disagree.

**Expected** — the delegation, naming the owner:

```
**`add-review-discipline` owns this.** Load it. It carries the verdict table, how many times the
reviewer runs, and what you owe a report you receive.
```

**Not expected** — a command carrying its own copy of a checklist a skill owns. This is what STEP 3
of `add-framework--build` did until this ruler replaced it:

```
### building-commands Checklist (APPLY to every `.md` artefact)
[ ] STEP (imperative), never Phase (documentary)
[ ] LANG header present
```

### 6. No ambiguity between STEPs

The execution order has one reading. No step contradicts another. No decision has two owners. Two
artefacts loaded at the same moment do not hand the executor opposing rules.

**Expected** — a step that says why it exists, so a later reader cannot reorder it by accident:

```
**This is what makes "exactly once" auditable.** STEP 5.1 resumes from the ledger's `complete` lines.
Without this line a review that found nothing leaves no trace at all.
```

**Not expected** — two rules, both loaded on the same F-block, pulling opposite ways. Removing the
first is why `add-framework-development` no longer sets a description budget:

```
- Token efficiency: JSON minified, a hard cap per description
- Reject a passage for being long: never. Ask whether it changes what the executor does
```

### 7. No filler

Every passage changes what the executor does. Verbose restatement fails here, and so does the same
rule said twice in different words.

**Reinforcement is not repetition, and the difference is placement.** A prohibition restated at the
exact point where skipping it is tempting is load-bearing. The same prohibition restated where nobody
was tempted is filler.

**Expected** — the rule repeated where the shortcut lives, with the cost of taking it:

```
⛔ **`ADD_GRAPH_WARNINGS=1` is not optional.** Without it `build.js` prints `N graph warning(s)` and
nothing else, so a block that greps the output for a warning finds none and reports clean against
warnings it never saw.
```

**Not expected** — the same rule in the top block, again as prose inside the step, again under
`## Rules`, none of the three at a decision point:

```
Remember that validation is important and should be run.
ALWAYS: Run validation
```

### 8. Cold-executable

Each step states what it does, on what input, producing what, and where that goes. A reader holding
only this file executes it without asking a question.

**Expected** — a dispatch a cold reader can perform:

```
**DISPATCH AGENT:** `@plan-readback-agent`
- **Capability:** read-only
- **Input:** `path` — the plan file resolved at STEP 1.1

**WAIT** for the restatement. ⛔ DO NOT start an F-block without it.
```

**Not expected** — an instruction that names no input, no output and no destination:

```
Review the artefact for quality and proceed when it looks right.
```

---

### Verdicts

`@prompt-review-agent` owns the verdict vocabulary and `add-review-discipline` owns how many times it
runs. Two things belong here, because they are properties of the ruler rather than of the reviewer:

- **Items 4 and 6 are the only ones whose failure can need a person.** Which side of a mismatched
  contract is right, and which of two steps owns a decision, are not derivable from the text that
  contains the contradiction.
- **Every other item's failure has a mechanical fix.** A dangling reference, a duplicate heading, a
  copied rule, a passage that goes — none of these need a decision, so none of them block.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Informative language ("it's recommended") | Imperative ("EXECUTE", "DO NOT") |
| Generic gate ("STOP, create branch") | Tool prohibition: "DO NOT USE Grep if BRANCH=main" |
| Prohibitions in middle of file | Move to TOP-OF-FILE before instructions |
| Using "Phase" (documentary) | Use "STEP" (imperative) |
| Command written in PT-BR or mixed | Command 100% in English + LANG header |
| `## Spec` section at top of file | Remove — prohibited (see "No `## Spec` Section") |
| Bash blocks for obvious operations | Use intent: "Verify branch is main. If not → STOP" |
| Fixed display/error message templates | Let the LLM generate contextual messages |
| Rules that restate STEP order | Remove — STEP sequence already enforces this |
| "DETECT LANGUAGE" blocks after LANG header | Remove — LANG header is sufficient |
| `{"do":[...],"dont":[...]}` for rules | Use ALWAYS/NEVER markdown |
| Closing step with its own invented fact list | Load `add-final-report` and fill its blocks |
| Loading `add-final-report` at STEP 1 | Load it at the closing step, where it is used |

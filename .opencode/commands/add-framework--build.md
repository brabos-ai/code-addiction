---
description: Implements approved plans in the ADD framework product layer.
---

# ADD Build - Command, Skill & Script Executor

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **SKILL:** Apply `building-commands` to ALL outputs
> **INPUT:** $ARGUMENTS

Executor that transforms plans into functional artefacts (commands, skills, scripts) within the code-addiction framework (`framwork/`).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load plan/context         → READ FIRST
STEP 2: Design approved?         → IF NO: STOP AND PRESENT
STEP 3: Load skills              → building-commands + ecosystem-map
STEP 4: Implement                → ONLY AFTER 1-3 (in framwork/); ledger first, then one F-block at a time
STEP 5: Test                     → ONLY AFTER implementing; the F-block is committed once it passes
STEP 6: Document                 → ONLY AFTER tests pass
STEP 7: Completion               → Final summary + every ruling made
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF PLAN/CONTEXT NOT LOADED:
  ⛔ DO NOT USE: Write in framwork/
  ⛔ DO NOT: Implement any artefact
  ✅ DO: Load plan or ask for description

IF DESIGN NOT APPROVED:
  ⛔ DO NOT USE: Write to create artefacts in framwork/
  ⛔ DO NOT USE: Edit on existing artefacts in framwork/
  ⛔ DO NOT: Implement
  ✅ DO: Present design and wait for approval

IF building-commands SKILL NOT LOADED:
  ⛔ DO NOT USE: Write on commands
  ⛔ DO NOT: Create command structure
  ✅ DO: Load the `building-commands` skill with the Skill tool

IF THE LEDGER HAS NOT BEEN READ (planned mode, STEP 4.1 not complete):
  ⛔ DO NOT USE: Write in framwork/
  ⛔ DO NOT USE: Edit in framwork/
  ⛔ DO NOT: Re-execute any F-block
  ✅ DO: Read docs/plans/<plan-basename>--ledger.md and apply the resume rule

IF AN F-BLOCK'S VALIDATION HAS NOT PASSED:
  ⛔ DO NOT USE: Bash to run git commit for that block
  ⛔ DO NOT: Append that block's `complete` line to the ledger
  ⛔ DO NOT: Start the next F-block
  ✅ DO: Fix it, rule on it, or STOP — see STEP 4.3
```

---

## Operation Mode

```
/add-framework--build [plan]                    → Execute specific plan (full basename or unique slug substring)
/add-framework--build [type] [name]             → Direct build (no plan, for simple artefacts)
```

**Examples:**
```
/add-framework--build 2026-09-07T005046-PLAN--hotfix-optimization
/add-framework--build hotfix-optimization
/add-framework--build command add-diagnose
/add-framework--build skill skill-creator
/add-framework--build cli migrations
```

**Valid types:** `command` | `skill` | `script` | `workflow` | `cli`

> To optimize an existing artefact: use `/add-framework--build [type] [name]` → the design phase detects the artefact already exists and presents analysis vs building-commands before editing.

**Source of truth paths:**

| Type | Path | Built by `build.js`? |
|------|------|----------------------|
| Command | `framwork/.codeadd/commands/*.md` | Yes — provider files generated |
| Skill | `framwork/.codeadd/skills/*/SKILL.md` | Yes — provider files generated |
| Script | `framwork/.codeadd/scripts/*` | No — shipped verbatim |
| CLI source | `cli/src/*.js` + `cli/tests/*.test.js` | No — published as the npm package |
| Claude Command | `.claude/commands/*.md` | No — internal layer |

---

## STEP 1: Load Context (MANDATORY)

### 1.0 Verify Framework Structure

Verify `framwork/` exists and list its provider directories.

### 1.1 If plan specified

**Resolve `[plan]` BEFORE reading anything.** The full basename always works; otherwise match `[plan]` as a **substring** of the basenames of `docs/plans/*-PLAN--*.md` **minus every `*-SELF-PLAN--*.md`** (and excluding `--review-v*` / `--evidence-v*` companions). The exclusion is load-bearing: the glob `*-PLAN--*` also matches `*-SELF-PLAN--*`, and a topic is normally split into a product plan and an internal one **sharing the slug** — so without it every paired set resolves to two candidates and stops — a 24-character timestamp prefix is not typeable, so a unique slug fragment is the normal argument. **Both naming forms resolve**: the timestamped `YYYY-MM-DDTHHMMSS-PLAN--[slug]` and the legacy `NNNN-PLAN--[slug]`.

- **Exactly one match** → that is the plan. Read it.
- **More than one match** → ⛔ STOP. Print every candidate basename and ask which one. **NEVER guess.**
- **No match** → list the plans in `docs/plans/` and STOP.

**Extract from plan:**
- Artefact type (command/skill/script/workflow)
- Scope (includes/excludes)
- Validated decisions
- Accepted trade-offs

### 1.2 If direct build (no plan)

**Only for SIMPLE builds.** Collect:

```markdown
**Type:** [command|skill|script|workflow]
**Name:** [kebab-case]
**Purpose:** [1 line]
**Scope:** [what it does / what it does NOT]
**Providers:** all (default) or specific list from provider-map.json
```

**If complex:** Recommend `/add-framework--plan` first.

### 1.3 Worktree for Risky Builds

```
IF build involves multiple artefacts OR modifies existing commands/skills:
  → RECOMMEND user create branch + worktree before implementing
  → Reason: clean isolation, easy discard if something goes wrong
  → On problems: discard worktree (no manual rollback)
  → After implementing: /add-framework--sync to validate ecosystem consistency
```

---

## STEP 2: Design [STOP]

**⛔ GATE:** Do not implement without design approval.

### 2.1 Present Design

Present a design document showing: artefact type, path, proposed structure, planned gates (if command), and building-commands checklist.

### 2.2 Wait for Approval

**STOP AND WAIT.** Only proceed after explicit approval or requested adjustments.

---

## STEP 3: Load Skills (MANDATORY)

**BEFORE implementing, READ:**

```
.claude/skills/building-commands/SKILL.md                     # ALWAYS
.claude/skills/add-resource-path-convention/SKILL.md          # ALWAYS (path references)
framwork/.codeadd/skills/add-ecosystem/SKILL.md               # ALWAYS (ecosystem overview)
framwork/.codeadd/skills/add-token-efficiency/SKILL.md        # ALWAYS
framwork/.codeadd/skills/add-documentation-style/SKILL.md     # If generating docs
framwork/.codeadd/skills/add-skill-creator/SKILL.md           # IF type=skill
framwork/.codeadd/skills/                                      # Reference of existing skills
```

### building-commands Checklist (APPLY)

```
[ ] Top-of-file blocking section (prohibitions BEFORE instructions)
[ ] Uses STEP (imperative) instead of Phase (documentary)
[ ] Sequential INTEGER numbering (1, 2, 3... NEVER 2.5, 6.5)
[ ] Imperative language (EXECUTE, DO NOT, CONFIRM)
[ ] Gates use TOOL-SPECIFIC prohibitions
[ ] Condition blocks: IF [condition]: ⛔ DO NOT USE [tool]
[ ] Mandatory explicit order
[ ] Checklists with checkboxes (not timelines)
[ ] No `## Spec` section (prohibited — see building-commands "No `## Spec` Section")
[ ] Bash blocks only where non-obvious or learned from errors
[ ] No fixed display/error message templates
[ ] Rules: ALWAYS/NEVER markdown, no duplication of STEP order
```

**⛔ FRACTIONAL NUMBERING PROHIBITED:**
```
❌ WRONG: STEP 6, STEP 6.5, STEP 7
✅ RIGHT: STEP 6, STEP 7, STEP 8  (renumber the sequence)
```

---

## STEP 4: Implement

### 4.1 The Build Ledger (MANDATORY in planned mode, BEFORE the first F-block)

**Path:** `docs/plans/<plan-basename>--ledger.md` — the plan's own basename with `--ledger.md` appended.
Direct-build mode (no plan) has no F-blocks, so it has no ledger: skip to 4.4.

**Tracked, not scratch.** It carries the rulings, and a reviewer who cannot see what was decided on their
behalf cannot review it. `docs/` is versioned like any other directory, so the ledger is committed with the
work it records — there is nothing to force-add.

**Append-only, one line per event, identity on the first line:**

```markdown
# Build ledger — plan: docs/plans/0078-PLAN--durable-executor.md

F1: complete (commits a1b2c3d..a1b2c3d, build.js clean)
F2: Ruling: kept the existing key name — the plan names both — costs a rename in F4 if wrong
F2: complete (commits d4e5f6a..b7c8d9e, cli suite 0 new failures)
F3: complete (commits b7c8d9e..c1d2e3f, build.js clean)
```

**The identity first line is written once, on creation.** A ledger whose identity changes mid-build is a
ledger that cannot be trusted, so the header is never rewritten. The internal layer ships no
`build-ledger.sh` — append the line yourself, and never rewrite a line already written. It is a **log, not a
set**: the same line twice appends twice.

**The resume rule.** On entry — every entry, not only after a crash — read the ledger if it exists BEFORE
deciding anything:

- **An F-block with a `complete` line is NEVER re-executed.** Not "probably done", not "let me re-check by
  re-running it". Done.
- **An F-block with no line at all is the next one to execute.**
- **After a compaction, trust the ledger and `git log` over your own recollection.** Your recollection is the
  thing that was just erased; the ledger and the commit graph are not. Where the two disagree, git wins for
  *what exists* — a commit in `git log` happened, whatever the ledger says — and the ledger wins for *what
  was decided*, because a ruling leaves no trace in a diff.

### 4.2 One Commit per F-block

Execute the plan's F-blocks one at a time, in its execution order:

1. **Record `BASE`** — `git rev-parse HEAD`, before touching anything for this block.
2. **Implement the block** — 4.4 for the artefact type, 4.5 while writing.
3. **Validate it** — STEP 5, for this block only.
4. **Commit it**, once that validation passed. Message follows the Conventional Commits logic in
   `.opencode/skills/add-commit/SKILL.md`, with the F-block id as a trailer so the ledger, the commit and the
   plan can be joined later.
5. **Record `HEAD`** and append the block's `complete` line with its `BASE..HEAD` bracket.

**Commit after validation, never before.** An F-block whose `node scripts/build.js` run failed gets no
commit — it gets a fix, a ruling or a stop. A commit of unvalidated work is worse than no commit: it looks
like delivered work and is not.

### 4.3 Rulings, and the Four Hard Stops

**Rule and continue. Do not stall on a judgement.** A conflict between two readings of the plan, an
ambiguity, a plan defect with a defensible fix — decide it yourself, record it in the ledger, and keep going:

```
Ruling: <what you decided> — <why> — <what it costs if wrong>
```

All three parts are required. The cost clause is what makes a ruling reviewable — a human reading "the
existing key name wins" cannot tell whether to check it; a human reading "costs a rename in F4 if wrong"
can. A session parked on a question costs a day. A wrong ruling costs rework the human can see and undo.

**A red build is not a finding, and rule-and-continue does not cover it.** Rulings are for judgements a
reasonable person could decide either way. A build that does not compile is not a judgement and there is
nothing to weigh: STEP 5 still stands, and an F-block whose `node scripts/build.js` run or `cli/` suite is
red reports what failed and STOPS. Ruling a red build away would make every other ruling worthless, because
the reader could no longer tell which ones were judgements.

**Four things stop the session and ask the human, and only these:**

1. **An irreversible or destructive operation** — a history rewrite, a data deletion, a dropped table.
2. **A security-sensitive action** — anything touching credentials, auth, permissions or secrets.
3. **A side effect outside this working tree that norms say you ask about first** — a merge, a push to a
   shared branch, a publish.
4. **A plan so broken that every path forward is a guess.** Not "a decision I would rather not make" — one
   where no reading of the plan supports any option over the others.

Everything else is a ruling. "I am not sure" is not a fifth stop.

**The plan-level `Design [STOP]` gate at STEP 2 is unchanged.** That gate is the human's real decision point
and nothing here touches it. What this section removes is the per-judgement stall *during* execution, never
the approval that let execution start.

### 4.4 By Artefact Type

#### Command (framwork/.claude/commands/*.md + framwork/.codeadd/commands/*.md)

**Register in `framwork/provider-map.json` (MANDATORY for new commands):**

```json
"commands": {
  "[name]": { "description": "[description from command frontmatter]" }
}
```

Default providers = all (claude, codex, antigrav, cursor, opencode). Omit `providers` field to use all.

**Mandatory command structure:**

```markdown
# [Command Name]

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

[1-line description]

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
[numbered list]

**⛔ ABSOLUTE PROHIBITIONS:**
[condition blocks with tools]

---

## STEP 1: ...
## STEP 2: ...

---

## Rules

ALWAYS:
- [verb] ...

NEVER:
- [verb] ...
```

**NOTE:** Create ONLY in source of truth (`framwork/.codeadd/commands/`). Provider files are generated by `build.js` via `provider-map.json`.

#### Skill (framwork/.codeadd/skills/*/SKILL.md)

**Register in `framwork/provider-map.json` (MANDATORY for new skills):**

```json
"skills": {
  "[name]": { "providers": ["claude", "antigrav", "cursor", "opencode"] }
}
```

Use `["antigrav"]` for internal skills (not exposed to end user).

**Mandatory structure:**

```markdown
---
name: [kebab-case]
description: [when to use - max 20 words]
---

# [Name]

## Overview
[2-3 lines]

## When to Use
[list]

## When NOT to Use
[list]

## Core [specific sections]

## Validation Checklist
[checkboxes]
```

#### Script (framwork/.codeadd/scripts/*)

**Mandatory structure:**

```bash
#!/bin/bash
# ============================================
# [SCRIPT NAME]
# [1-line description]
# ============================================
# Usage: bash framwork/.codeadd/scripts/[name].sh [args]
# Dependencies: [list]
# ============================================

# --- Detection ---
[detect context]

# --- Execution ---
[main logic]

# --- Output ---
[structured output]
```

#### CLI Source (cli/src/*.js + cli/tests/*.test.js)

The npm package that installs the framework into a user's project. It is NOT an artefact of the product layer.

```
⛔ DO NOT: Register anything in framwork/provider-map.json — cli/ is not in the registry
⛔ DO NOT: Run node scripts/build.js expecting it to emit cli/ output — it never touches cli/
⛔ DO NOT: Apply the building-commands checklist to JavaScript — it governs .md artefacts only
⛔ DO NOT: Bump the version in cli/package.json — that is /add-framework--release's job
✅ DO: Edit cli/src/ and cli/tests/ directly; they ship as written
```

**Module convention:** one concern per module, owning its registry, its state helpers and its `export async function <name>(cwd, args, scope)` command entry. Follow `cli/src/features.js` and `cli/src/plugins.js`.

**A new subcommand is not reachable until it is registered.** Add it to the dispatch AND the help text in `cli/src/cli.js`.

**TESTS ARE MANDATORY, NOT OPTIONAL.** Every changed module needs coverage in `cli/tests/`. When the plan specifies a RED-first matrix, write each assertion and CONFIRM IT FAILS before writing the implementation — a test authored after the fix proves nothing.

Run tests serially. Parallel workers race on shared fixtures and produce failures unrelated to the change:

```bash
cd cli && npx vitest run --no-file-parallelism
```

CRITICAL: a parallel `npx vitest run` reports failures that vanish serially. Never diagnose a failure without re-running serially first, and never accept a green parallel run as proof.

If node output is polluted by `Debugger listening on ws://...`, an editor injected `NODE_OPTIONS`. Clear it (`unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS`) before trusting any assertion on stdout/stderr.

**Before claiming done:** compare failures against a baseline on a clean tree (`git stash`), because this suite has pre-existing flakiness. Report the delta, never the raw count.

### 4.5 Validate During Implementation

At each section written, verify:

```
[ ] Imperative language? (not informative)
[ ] Gates have tool-specific prohibitions?
[ ] Order is mandatory? (not suggested)
[ ] Checkboxes? (not timelines)
```

---

## STEP 5: Test

### 5.1 Mental Test (MANDATORY for command | skill | script | workflow)

Simulate artefact execution with 3 scenarios: happy path, gate violation, edge case.

### 5.2 Validate vs building-commands (command | skill | script | workflow)

```
[ ] Can the agent skip gates? (must be impossible)
[ ] Are prohibitions specific? (tools, not generic)
[ ] Is the order bypassable? (must not be)
```

### 5.3 Execute the Test Suite (MANDATORY if type=cli)

A mental test is NOT evidence for JavaScript. Run it.

```
IF type=cli AND the suite has not been run serially:
  ⛔ DO NOT: Report the build as complete
  ⛔ DO NOT: Update the plan status in STEP 6
  ⛔ DO NOT: Claim a validation level passed
  ✅ DO: Run `cd cli && npx vitest run --no-file-parallelism` and read the result

IF any test fails:
  ⛔ DO NOT: Attribute it to flakiness without evidence
  ✅ DO: Re-run serially, then baseline against a clean tree, then report the delta
```

Verify every RED-first assertion the plan specified was observed failing BEFORE its implementation landed. An assertion that was never RED is an untested F-block regardless of its current colour.

**If fails:** Go back to STEP 4 and fix.

### 5.4 Commit the F-block and Record It (MANDATORY in planned mode)

This STEP is per F-block, not once at the end. As soon as this block's validation above passed:

1. Commit the block — message per `.opencode/skills/add-commit/SKILL.md`, F-block id as a trailer.
2. `git rev-parse HEAD` for `HEAD`.
3. Append `F<n>: complete (commits <BASE>..<HEAD>, <what validated it>)` to the ledger.
4. Return to STEP 4.2 for the next F-block.

```
IF THE VALIDATION ABOVE DID NOT PASS:
  ⛔ DO NOT USE: Bash to run git commit
  ⛔ DO NOT: Append a `complete` line
  ✅ DO: Fix it (STEP 4) or STOP — a red build is not a finding (STEP 4.3)
```

---

## STEP 6: Document

### 6.1 Changelog (MANDATORY if new/major)

```
docs/changelog/YYYY-MM-DD-[action]-[what].md
```

**Actions:** `add` | `update` | `refactor` | `remove`

### 6.2 Update plan (if exists)

Set plan status: `draft` → `implemented`

---

## STEP 7: Completion

Show summary: artefact path, type, plan link, files created/updated, validations passed, usage instructions.

### 7.1 Rulings I Made (MANDATORY in planned mode)

Collect **every** `Ruling:` line from the ledger into a "Rulings I made" section, in the order they were
made, each with what it costs if wrong. Exhaustive, not representative: if the ledger holds a ruling, this
section holds it. A ruling that stays in the ledger and never reaches the human is a decision made in
secret. If no ruling was made, say so — silence is indistinguishable from not having looked.

### 7.2 Also Report, Always

- the ledger path and the `BASE..HEAD` range of every committed F-block.

---

## Rules

ALWAYS:
- Read the ledger on entry and apply the resume rule before executing anything
- Record BASE before an F-block and commit it only after its validation passed
- Append one ledger line per F-block, carrying its BASE..HEAD bracket
- Record a judgement as `Ruling: <what> — <why> — <cost if wrong>` and continue
- Surface EVERY ruling in the completion report
- Load building-commands skill before creating any command
- Apply ALL patterns from the skill
- Test mentally before finalizing
- Document changes and update ecosystem map
- Use sequential INTEGER numbering (1,2,3)
- Renumber steps when inserting new ones
- Register new command/skill in framwork/provider-map.json
- Create source file in framwork/.codeadd/ (source of truth)
- Run the cli/ suite serially before reporting any result from it
- Baseline a failing cli/ test against a clean tree before blaming the change

NEVER:
- Re-execute an F-block that already has a `complete` line in the ledger
- Commit an F-block before its validation passed
- Rule away a red build — a failing build.js or cli/ run reports and STOPS
- Rewrite the ledger's identity line, or edit a line already written
- Stall on a judgement — only the four hard stops stop the session
- Skip the STEP 2 `Design [STOP]` gate — rulings replace per-judgement stalls, never that approval
- Register cli/ artefacts in provider-map.json — cli/ is outside the build registry
- Bump cli/package.json version — that belongs to /add-framework--release
- Report a cli/ build complete on a mental test alone
- Implement without plan/context loaded
- Skip design approval
- Use informative language in commands ("it's recommended")
- Create generic gates (without tool-specific prohibitions)
- Use Phase instead of STEP
- Use fractional numbering (2.5, 6.5)
- Insert steps without renumbering
- Create provider files manually (use framwork/.codeadd/ + provider-map.json)
- Add a `## Spec` section to commands or skills (prohibited)

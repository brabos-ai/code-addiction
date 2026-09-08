---
description: Implements approved changes in the OpenCode internal development layer.
---

# ADD Self-Build — Internal Infrastructure Builder

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **SKILL:** Apply `building-commands` to ALL command/skill outputs
> **INPUT:** $ARGUMENTS

Evolves artefacts in the internal development layer (`.opencode/`, `scripts/`, `CLAUDE.md`). Operates in two modes: pontual (quick changes) or planned (from `/add-framework--self-plan` document).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Load context              → CLAUDE.md + plan or target artefact
STEP 2: Design approved?          → IF NO: present proposal and WAIT
STEP 3: Load skills               → building-commands (if modifying commands/skills)
STEP 4: Implement                 → ONLY AFTER 1-3; ledger first, then one F-block at a time
STEP 5: Validate                  → verify artefact coherence; the F-block is committed once it passes
STEP 6: Completion                → summary of changes + every ruling made

**⛔ ABSOLUTE PROHIBITIONS:**

IF CONTEXT NOT LOADED (STEP 1 not complete):
  ⛔ DO NOT USE: Write on .opencode/
  ⛔ DO NOT USE: Edit on .opencode/
  ⛔ DO NOT USE: Write on scripts/
  ⛔ DO NOT USE: Edit on scripts/
  ⛔ DO NOT: Implement any change
  ✅ DO: Read CLAUDE.md and target artefacts first

IF DESIGN NOT APPROVED (STEP 2 not complete):
  ⛔ DO NOT USE: Write to create artefacts in .opencode/
  ⛔ DO NOT USE: Edit on existing artefacts in .opencode/
  ⛔ DO NOT USE: Write on scripts/
  ⛔ DO NOT: Implement
  ✅ DO: Present proposal and wait for approval

IF building-commands SKILL NOT LOADED (STEP 3, when modifying commands/skills):
  ⛔ DO NOT USE: Write on .opencode/commands/
  ⛔ DO NOT USE: Write on .opencode/skills/
  ⛔ DO NOT: Create or modify command/skill structure
  ✅ DO: Load the `building-commands` skill with the Skill tool

IF THE LEDGER HAS NOT BEEN READ (planned mode, STEP 4.1 not complete):
  ⛔ DO NOT USE: Write on .opencode/
  ⛔ DO NOT USE: Edit on .opencode/
  ⛔ DO NOT: Re-execute any F-block
  ✅ DO: Read docs/plans/<plan-basename>--ledger.md and apply the resume rule

IF AN F-BLOCK'S VALIDATION HAS NOT PASSED (STEP 5 for that block):
  ⛔ DO NOT USE: Bash to run git commit for that block
  ⛔ DO NOT: Append that block's `complete` line to the ledger
  ⛔ DO NOT: Start the next F-block
  ✅ DO: Fix it, rule on it, or STOP — see STEP 4.3

ALWAYS:
  ⛔ DO NOT USE: Write on framwork/.codeadd/
  ⛔ DO NOT USE: Edit on framwork/.codeadd/
  ⛔ DO NOT USE: Write on framwork/ provider directories
  ⛔ DO NOT: Modify product layer artefacts — that is /add-framework--build's job
  ⛔ DO NOT: Run node scripts/build.js — only modifies internal layer

---

## Operation Mode

/add-framework--self-build [plan]                     → Execute plan from add-framework--self-plan (full basename or unique slug substring)
/add-framework--self-build [target] [description]     → Pontual change (no plan required)

**Examples:**
/add-framework--self-build 2026-09-07T005046-SELF-PLAN--refactor-gates
/add-framework--self-build refactor-gates
/add-framework--self-build add-framework--sync "add retry logic for failed agent dispatches"
/add-framework--self-build building-commands "add section about agent memory patterns"
/add-framework--self-build CLAUDE.md "update pipeline section with new provider"

**Valid targets:** command name (`add-framework--plan`, `add-framework--sync`), skill name (`building-commands`), agent name (`readme-analyzer`), script name (`build.js`), or `CLAUDE.md`.

---

## STEP 1: Load Context (MANDATORY)

### 1.1 Read Structural Map

Read `CLAUDE.md` at project root.

### 1.2 If Plan specified

**Resolve `[plan]` BEFORE reading anything.** The full basename always works; otherwise match `[plan]` as a **substring** of the basenames of `docs/plans/*-SELF-PLAN--*.md` (excluding `--review-v*` and `--evidence-v*` companions) — a 24-character timestamp prefix is not typeable, so a unique slug fragment is the normal argument. **Both naming forms resolve**: the timestamped `YYYY-MM-DDTHHMMSS-SELF-PLAN--[slug]` and the legacy `NNNN-SELF-PLAN--[slug]`.

- **Exactly one match** → that is the plan. Read it.
- **More than one match** → ⛔ STOP. Print every candidate basename and ask which one. **NEVER guess.**
- **No match** → list the plans in `docs/plans/` and STOP.

**Extract from plan:**
- Artefacts to modify/create/remove
- Execution order
- Validated decisions

### 1.3 If Pontual change (no plan)

Read the target artefact. Collect:

**Target:** [file path resolved from target name]
**Change:** [user's description]
**Impact:** [quick assessment — which other artefacts depend on this?]

**If change is complex (3+ artefacts, cross-cutting, or high risk):** Recommend `/add-framework--self-plan` first.

---

## STEP 2: Design [STOP]

### 2.1 Present Proposal

**For planned mode:** Summarize the plan and confirm execution order. Show which files will be created/modified/removed.

**For pontual mode:** Present a concise proposal showing: what changes, why, impact on dependents.

### 2.2 Wait for Approval

**STOP AND WAIT.** Only proceed after explicit approval or requested adjustments.

---

## STEP 3: Load Skills

**IF modifying commands or skills, READ:**

.opencode/skills/building-commands/SKILL.md                   # ALWAYS for commands/skills
.opencode/skills/add-framework-development/SKILL.md           # For artefact type decisions

### building-commands Checklist (APPLY when creating/modifying commands or skills)

- [ ] Top-of-file blocking section (prohibitions BEFORE instructions)
- [ ] Uses STEP (imperative) instead of Phase (documentary)
- [ ] Sequential INTEGER numbering (1, 2, 3... NEVER 2.5, 6.5)
- [ ] Imperative language (EXECUTE, DO NOT, CONFIRM)
- [ ] Gates use TOOL-SPECIFIC prohibitions
- [ ] Condition blocks: IF [condition]: ⛔ DO NOT USE [tool]
- [ ] LANG header present (English command, user-language responses)
- [ ] Rules: ALWAYS/NEVER markdown, no duplication of STEP order
- [ ] No fixed display/error message templates
- [ ] Bash blocks only where non-obvious or learned from errors

**IF modifying scripts or CLAUDE.md:** Skip this step, proceed to STEP 4.

---

## STEP 4: Implement

### 4.1 The Build Ledger (MANDATORY in planned mode, BEFORE the first F-block)

**Path:** `docs/plans/<plan-basename>--ledger.md` — the plan's own basename with `--ledger.md` appended.
Pontual mode has no F-blocks, so it has no ledger: skip to 4.4.

**An F-block is one item of the plan's Execution Order** (`S1`, `S2`, … in a self-plan).

**Tracked, not scratch.** It carries the rulings, and a reviewer who cannot see what was decided on their
behalf cannot review it. `docs/plans/` is gitignored, so the ledger is LOCAL — it never reaches a
reviewer on its own. That is what makes STEP 7.1 mandatory: every `Ruling:` line has to be carried out
of the ledger and into the completion report, or the decision dies on this machine.

**Append-only, one line per event, identity on the first line:**

```markdown
# Build ledger — plan: docs/plans/0078-SELF-PLAN--durable-executor.md

S1: complete (commits a1b2c3d..a1b2c3d, coherence + dependency checks clean)
S2: Ruling: kept the existing STEP numbering — renumbering would break two cross-references — costs a stale pointer in S4 if wrong
S2: complete (commits d4e5f6a..b7c8d9e, coherence + dependency checks clean)
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

### 4.2 Planned Mode — One Commit per F-block

For each F-block in the plan's execution order, in order:

1. **Record `BASE`** — `git rev-parse HEAD`, before touching anything for this block.
2. Read the target artefact (or confirm the path for a new artefact).
3. Apply the change.
4. Show what changed to the user.
5. **Validate it** — STEP 5's coherence and dependency checks, for this block's artefacts only.
6. **Commit it**, once that validation passed. Message follows the Conventional Commits logic in
   `.opencode/skills/add-commit/SKILL.md`, with the F-block id as a trailer so the ledger, the commit and the
   plan can be joined later.
7. **Record `HEAD`** and append `S<n>: complete (commits <BASE>..<HEAD>, <what validated it>)` to the ledger.

**Commit after validation, never before.** An F-block whose checks failed gets no commit — it gets a fix, a
ruling or a stop. A commit of unvalidated work is worse than no commit: it looks like delivered work and is
not.

**There is no per-item approval stall.** Showing what changed (step 4) informs the user; it does not wait on
them. Judgements are ruled on and recorded — see 4.3.

### 4.3 Rulings, and the Four Hard Stops

**Rule and continue. Do not stall on a judgement.** A conflict between two readings of the plan, an
ambiguity, a plan defect with a defensible fix — decide it yourself, record it in the ledger, and keep going:

```
Ruling: <what you decided> — <why> — <what it costs if wrong>
```

All three parts are required. The cost clause is what makes a ruling reviewable — a human reading "kept the
existing numbering" cannot tell whether to check it; a human reading "costs a stale pointer in S4 if wrong"
can. A session parked on a question costs a day. A wrong ruling costs rework the human can see and undo.

**A red build is not a finding, and rule-and-continue does not cover it.** Rulings are for judgements a
reasonable person could decide either way. A validation that fails is not a judgement and there is nothing to
weigh: STEP 5 still stands, and an F-block whose coherence or dependency check fails — or whose test suite is
red — reports what failed and STOPS. Ruling a red build away would make every other ruling worthless, because
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
and nothing here touches it. What 4.2 removes is the per-item stall *during* execution, never the approval
that let execution start. The two are not the same gate and must not be read as one.

### 4.4 Pontual Mode — Direct Change

1. Apply the change to the target artefact
2. Show what changed

### 4.5 Lifecycle Actions

| Action | How |
|--------|-----|
| **Create** | Write new file at correct path, following artefact conventions |
| **Modify** | Edit existing file, preserve structure and business logic |
| **Deprecate** | Add deprecation notice at top of file, update dependents to reference replacement |
| **Remove** | Delete file, update all dependents that referenced it |

### 4.6 Update CLAUDE.md (if artefact list changed)

If a command, skill, or agent was created or removed, update the Internal Layer table in CLAUDE.md to reflect the change.

---

## STEP 5: Validate

**In planned mode this STEP runs per F-block, before that block's commit — not once at the end.**

### 5.1 Coherence Check

For each modified artefact:

- [ ] File is well-formed (valid markdown, correct structure)
- [ ] No broken references to other internal artefacts
- [ ] If command/skill: passes building-commands validation checklist
- [ ] CLAUDE.md reflects current state (if artefact list changed)

### 5.2 Dependency Check

- [ ] No command references a removed skill
- [ ] No command dispatches a removed agent
- [ ] All new artefacts are referenced where needed

**If validation fails:** Fix the issue, do not proceed to completion until valid.

### 5.3 Commit the F-block and Record It (MANDATORY in planned mode)

As soon as this F-block's checks above passed:

1. Commit the block — message per `.opencode/skills/add-commit/SKILL.md`, F-block id as a trailer.
2. `git rev-parse HEAD` for `HEAD`.
3. Append `S<n>: complete (commits <BASE>..<HEAD>, <what validated it>)` to the ledger.
4. Return to STEP 4.2 for the next F-block.

```
IF THE CHECKS ABOVE DID NOT PASS:
  ⛔ DO NOT USE: Bash to run git commit
  ⛔ DO NOT: Append a `complete` line
  ✅ DO: Fix it (STEP 4) or STOP — a red build is not a finding (STEP 4.3)
```

---

## STEP 6: Completion

Show summary:

- Artefacts created/modified/removed (with paths)
- Plan reference (if planned mode)
- Ledger path, and the `BASE..HEAD` range of every committed F-block
- Validation status
- If plan exists: update plan status to `implemented`

### 6.1 Rulings I Made (MANDATORY in planned mode)

Collect **every** `Ruling:` line from the ledger into a "Rulings I made" section, in the order they were
made, each with what it costs if wrong. Exhaustive, not representative: if the ledger holds a ruling, this
section holds it. A ruling that stays in the ledger and never reaches the human is a decision made in
secret. If no ruling was made, say so — silence is indistinguishable from not having looked.

---

## Rules

ALWAYS:
- Read CLAUDE.md before any change
- Load building-commands skill before creating/modifying commands or skills
- Present the proposal and wait for the STEP 2 `Design [STOP]` approval before implementing
- Read the ledger on entry and apply the resume rule before executing anything
- Record BASE before an F-block and commit it only after its validation passed
- Append one ledger line per F-block, carrying its BASE..HEAD bracket
- Record a judgement as `Ruling: <what> — <why> — <cost if wrong>` and continue
- Surface EVERY ruling in the completion report
- Validate artefact coherence after every change
- Update CLAUDE.md internal layer table when creating or removing artefacts
- Check dependencies when removing or renaming artefacts

NEVER:
- Re-execute an F-block that already has a `complete` line in the ledger
- Commit an F-block before its validation passed
- Rule away a red build — a failing check reports and STOPS
- Rewrite the ledger's identity line, or edit a line already written
- Stall on a judgement, or wait for approval between F-blocks — only the four hard stops stop the session
- Skip the STEP 2 `Design [STOP]` gate — rulings replace the per-item stall, never that approval
- Write to framwork/.codeadd/ — that is /add-framework--build's job
- Write to framwork/ provider directories
- Run node scripts/build.js
- Implement without loading context first
- Skip design approval
- Modify product layer artefacts
- Use informative language in commands ("it's recommended")
- Create generic gates (without tool-specific prohibitions)

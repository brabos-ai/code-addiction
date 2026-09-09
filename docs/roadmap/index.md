# Roadmap

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

---

## 2. Development history that survives the worktree

**Problem.** `docs/plans/`, `docs/brainstorming/` and `docs/evidence/` are gitignored by design — and
they hold the richest record of a delivery: the plan's reasoning, the ledger's `Ruling:` lines, the
evidence report's defect list. `/add-framework--done` STEP 8 lists `docs/plans/` and
`docs/brainstorming/` as "kept" because nothing in that STEP deletes them. But when the build ran
inside a git worktree — the normal case for planned work — those gitignored files exist only inside
that worktree's own directory. STEP 8.1 removes the worktree, and every one of them goes with it. The
command's own table calls this "kept"; on a worktree build it is not. Today the only thing that
reliably reaches `main` is a summary: the ledger's rulings copied by hand into the completion report,
the changelog's prose. The document itself is never asked to survive, only its extract.

**Target.** A delivery's working documents — the plan and its ledger, at minimum — reach `main`,
tracked and durable, before the worktree that held them is ever removed. No document survives
close-out on the strength of a table cell that says it does.

### 2.0 — A schema for the durable history directory

- Decide the tracked (not gitignored) location a finished plan's documents move to, and its shape —
  one directory per plan, named after the plan's basename, so `docs/delivered.jsonl`'s `origin` and
  the moved copy resolve to the same id.
- Decide the minimum set that moves. The plan and its ledger are the load-bearing two; settle whether
  the evidence report and a review companion move too, or stay a `docs/changelog/`-only summary as
  today.
- **Done when:** the schema is written down as a convention a command can target — the directory
  name, what moves into it, and what does not.

### 2.1 — `add-framework--done` moves the documents before the worktree goes

- The move runs **before** STEP 8.1 removes the worktree. Ordering is the whole fix: a step that runs
  after the worktree is gone has nothing left to move.
- Folds into the existing STEP 6 commit — the delivery-index entry and the changelog already commit
  and push there, and STEP 7 already merges that branch via `gh`. No second commit-and-push cycle to
  invent.
- **Done when:** `/add-framework--done` never runs STEP 8.1 while a plan's ledger exists only inside
  the worktree being removed.

### 2.2 — No file is asked to survive twice

- `docs/evidence/` keeps its current fate — STEP 8 deletes the plan's local copy after merge — but
  only once whatever is worth keeping from it has already moved into the durable directory. Never
  delete a gitignored original before its durable copy is committed.
- **Done when:** every path STEP 8 deletes already has a durable copy on `main`, or was never meant to
  survive by 2.0's schema.

### 2.3 — The warning becomes unnecessary, not suppressed

- Once 2.1 makes the sync structural, there is nothing left for an ad-hoc "this wasn't synced to
  main" check to catch. The fix is the missing step, not a suppressed warning.
- **Done when:** closing out a plan leaves no gitignored file that was the only copy of something
  `add-doc-schemas` or `add-build-ledger` calls load-bearing.

---

## 3. One executive-summary shape for every command's final report

**Problem.** What a command hands back at the end is inconsistent. Some name a file, a verdict and
a next command and stop there; others bury the actual change inside status prose. The user is left
asking "but what was actually delivered, and how does it work?" One shape for this already exists —
`.claude/skills/add-plan-authoring/SKILL.md`'s "Completion — The Executive Summary" — but it is
scoped to `add-framework--plan`'s output alone.

**Target.** Every command that finishes work, in either layer, ends its response the same way: a
TL;DR line, bullet points of what was delivered, and a short "how it works" digest — plain, direct
language, no jargon, no filler ("improves consistency" says nothing; the concrete change does).

### 3.0 — Lift the executive-summary shape out and make it the standard for every command

**Scope:** both
**TLDR:** every command ends the same way — TL;DR, bullets of what shipped, a short how-it-works digest.

- Generalize `.claude/skills/add-plan-authoring/SKILL.md`'s "Completion — The Executive Summary"
  section into a shared shape, instead of reinventing one: TL;DR first, then what was delivered as
  bullets, then a short "how it works" digest anyone can read without the surrounding context.
- One piece of work covers both layers — internal commands (`.claude/commands/*.md`) and product
  commands (`framwork/.codeadd/commands/*.md`) end their responses in the same shape.
- **Done when:** the shape is written once as a shared reference and at least one command per layer
  (e.g. `add-framework--done` and `add.build`) closes with a report in that shape.

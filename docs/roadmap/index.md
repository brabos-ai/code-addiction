# Roadmap

Working roadmap for the internal layer (`.claude/`). Items are listed in execution order —
the number **is** the priority. An item may only start once every item above it is done.

> **Scope:** internal layer only. The product layer (`framwork/.codeadd/`) is untouched by
> this track and keeps its current review flow.

---

## 1. Review, reshaped: one pass, no loops

**Problem.** Review today is a loop. `/add-framework--review` versions itself
(`--review-v01`, `--review-v02`, …), the plan reviewer is re-dispatched on every blocker,
and `/add-framework--done` refuses to close until it finds a favourable verdict file.
Every one of those is an invitation to grade the same work twice.

**Target.** Review happens **once**, inside the build, and produces no artefact anyone
downstream has to wait for.

### 1.0 — Single review pass across the whole internal layer

- Review runs **exactly once** per plan. There is no re-review, no `vNN` sequence, no
  "re-enter review after applying the fixes".
- Findings from that single pass are applied in the same run that produced them.
- Sweep every internal-layer artefact that assumes a review loop and remove the assumption:
  - `.claude/commands/add-framework--build.md`
  - `.claude/commands/add-framework--review.md`
  - `.claude/commands/add-framework--done.md`
  - `.claude/skills/add-plan-authoring/SKILL.md` — the Review Dispatch section and its
    re-dispatch rules
- **Done when:** no internal artefact instructs a second review of the same subject.

### 1.1 — Review moves into `add-framework--build`, `add-framework--review` is removed

- The review step becomes a STEP inside `.claude/commands/add-framework--build.md`.
- `.claude/commands/add-framework--review.md` is **deleted**, not deprecated.
- Fold in what is worth keeping from it: the plan-resolution rules and the read-only
  guarantees of the audit subagents. Drop the verdict file and the `vNN` versioning.
- Sweep the references it leaves behind: `<!-- uses: -->` blocks, the artefact graph, the
  ecosystem map, `README.md`, and any command that names `/add-framework--review`.
- **Done when:** `grep -r "add-framework--review"` returns nothing outside history.

### 1.2 — New agent: isolated readback of the document

- Create an agent whose only job is to read a document **in total isolation** and report
  back what it understood must be done.
- Hard constraint: **no external sources**. No repository reads, no sibling plans, no
  git history, no web. The document is the entire context.
- It returns an **executive summary** to the main agent: the goal, the changes it believes
  are being asked for, and anything it could not resolve from the text alone.
- Purpose is coherence, not correctness. It answers one question: *would an agent with a
  clean context know what to build from this document?* Gaps in the summary are gaps in
  the document.
- **Runs at most 2x.** The second run exists to confirm a rewrite closed the gap the first
  run found. There is no third.
- **Done when:** the agent exists, is registered, and the build dispatches it before the
  first F-block.

### 1.3 — The adversarial review agent runs once

- The adversarial reviewer (`plan-review-agent` and whatever the build inherits from
  `/add-framework--review`) is dispatched **exactly once** per run.
- No re-dispatch after applying findings. No "double-check" pass.
- Note the asymmetry, it is deliberate: the readback agent (1.2) may run twice because a
  rewrite changes what it reads. The adversarial reviewer may not, because re-running it
  on lightly-edited work only produces new opinions.
- **Done when:** the dispatch is a single call with no re-entry path.

### 1.4 — Remove the review gate from `add-framework--done`

- Delete STEP 2.3, "The review gate", from `.claude/commands/add-framework--done.md`.
- Close-out no longer looks for a `--review-vNN.md` companion and no longer reads a verdict.
- The **ledger gate stays**. It is the one that catches a build that stopped halfway, and
  that is a different failure from an unreviewed one.
- Update the frontmatter, the STEP map, the prohibitions list, and the migration table so
  none of them still mention a review verdict.
- **Done when:** `/add-framework--done` closes a branch with no review artefact on disk.

### 1.5 — Remove the re-dispatch of the reviewer

- The re-review pass goes away. A `fix-then-ok` verdict is applied and the work moves on.
  Nothing dispatches a reviewer a second time to grade the fixes it just asked for.
- This is 1.3's rule applied to the planning side. 1.3 covers the reviewer inside the
  build; this covers every command that reviews a document before delivering it.
- Targets, all in the internal layer:
  - `.claude/skills/add-plan-authoring/SKILL.md` — the `fix-then-ok` row that says
    "Re-dispatch ONCE", the "re-enter review" instruction in the blocker path, the same
    instruction in the update path, and the rationalization row that argues a blocker
    earns a re-dispatch
  - `.claude/commands/add-framework--plan.md` — the "Re-dispatch ONCE" line in its review step
  - `.claude/commands/add-framework--brainstorm.md` — the same row in its own verdict table
  - `.claude/commands/add-framework--review.md` — removed entirely by 1.1, so nothing to do
    here beyond confirming it went
- **Out of scope:** `add-framework--sync` re-dispatches an agent that failed to report back.
  That is a retry on a missing result, not a second opinion on the same work. It stays.
- **Done when:** `grep -rn "re-dispatch\|re-enter review" .claude/` returns nothing.

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

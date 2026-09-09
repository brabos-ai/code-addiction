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

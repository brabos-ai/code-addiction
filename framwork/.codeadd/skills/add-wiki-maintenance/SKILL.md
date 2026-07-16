---
name: add-wiki-maintenance
description: Use for incremental project-wiki updates — loaded by /add.wiki update (manual drift) and add.done STEP 4.9 (pre-merge, automatic). Diff-driven surgical edits only, never full rewrites.
---

# Wiki Maintenance — Update Discipline

## Overview

Keeps `{{addpath:wiki/}}` accurate between full `/add.wiki` regenerations. Two triggers share this ONE discipline; only evidence collection (STEP 2) differs. Surgical edits, computed candidates before judgment, no-op is a valid outcome.

## When to Use

- `add.done` STEP 4.9, pre-merge — automatic, evidence = branch diff + feature context
- `/add.wiki update` — manual, evidence = tiered git-log chain from `.meta.json`

## When NOT to Use

- No wiki exists yet → full generation (`/add.wiki`), not this skill
- Rewriting/regenerating a page wholesale → `/add.wiki` owns full generation, this skill never does

## WRITE BOUNDARY

Only three writers touch `{{addpath:wiki/}}`: `/add.wiki` (full gen), this skill's executions (surgical edits), the user. `INSTRUCTIONS.md` is NEVER machine-written — read-only steering, always. This skill never touches CLAUDE.md (owned by `/add.wiki` STEP 6).

## NO-OP IS A FIRST-CLASS OUTCOME

Nothing relevant changed and the wiki is accurate → edit nothing, report "wiki already current". Still advance `.meta.json` (STEP 8) — a verified-current run is information, not nothing.

## The 9-Step Sequence

### STEP 1 — GATE
`{{addpath:wiki/index.md}}` exists? IF NO → STOP. The caller (add.done or /add.wiki) handles the "run /add.wiki first" suggestion; this skill does not generate.

### STEP 2 — EVIDENCE (trigger-specific)

**add.done trigger:**
- `CHANGED_FILES` from `done.sh` (the branch diff, already computed in STEP 1 of add.done)
- Feature context: `about.md` / changelog just written in add.done STEP 4.5 — grounds impact in stated intent, not just file names

**`/add.wiki update` trigger — tiered chain:**
```
1. .meta.json has gitHead → git log <gitHead>..HEAD --name-status --oneline
                             + git diff --name-status HEAD (uncommitted)
2. No gitHead, has updatedAt → git log --since <updatedAt> --name-status --oneline
3. Neither → last 20 commits (--max-count=20 --name-status)
             + explicit best-effort warning
             + suggest full /add.wiki if drift looks large
```

**Cheap pre-check (manual trigger, before any analysis):** `gitHead` == current HEAD AND worktree clean → report "wiki already current". Still advance `.meta.json` only if `gitHead` differs from current HEAD — if identical, nothing to write; stop here.

### STEP 3 — CANDIDATES (computed, not judged)
For each wiki page: candidate iff changed files ∩ frontmatter `sources` globs ≠ ∅. Deterministic, mechanical, runs BEFORE any model judgment — this is the corpus's `sources` frontmatter earning its keep.

### STEP 4 — IMPACT PLAN (judged)
For each candidate + any page you believe is affected beyond the computed set: `source change → page → edit needed → why`. A page not tied to a relevant change is NOT edited — computed candidates seed the plan, judgment only extends it.

### STEP 5 — SURGICAL EDITS (hard rules)
- Prefer replacing one stale sentence over adding new paragraphs. Preserve existing structure/wording when accurate.
- Only edit pages made inaccurate, incomplete, or misleading by the changes. Do not refresh every page.
- **No formatting-only edits:** no table reformatting, blank-line normalization, reordering, or wording polish unless the surrounding content is already changing for accuracy.
- **Soft diff budget:** <~5 changed source files → touch ≤1-2 pages. Avoid the hub unless navigation/product-level facts changed. Believing >3 pages need edits → re-examine the impact plan (STEP 4) before proceeding, don't just proceed.
- Canonical-home dedup: detail stays in its canonical page; other mentions stay brief or link-only.
- Renames/deletions (`R`/`D` in evidence): remove or repoint obsolete claims and stale `sources` globs. A page whose entire source area vanished is deleted and delisted from the hub.
- **Backlog promotion:** changes touching a backlogged area → document it, remove the Backlog entry. Never let the backlog grow silently.
- Terminology (hub section) is a hard constraint: edits use canonical terms; new concepts may add a term (cap 15, hub-enforced).
- Page size caps apply: 300-line target, 500-line hard cap. Over cap on edit → split per `/add.wiki` §5 rules, don't just keep appending.

### STEP 6 — STAMPS
Every EDITED page: bump frontmatter `commit` (current short sha) and `generated` (today). Untouched pages keep their stamps unchanged — that is the entire point of per-page provenance; touching stamps on untouched pages destroys the staleness signal.

### STEP 7 — HUB SYNC
Pages added, removed, or description-changed → update `index.md` entries + Backlog. Re-verify link↔file bijection (excluding `index.md`, `INSTRUCTIONS.md`, non-`.md` files like `.meta.json`).

### STEP 8 — META
Rewrite `{{addpath:wiki/.meta.json}}` at the END of EVERY completed run, including verified-current no-ops:
```json
{"updatedAt":"<ISO-8601>","command":"update","gitHead":"<current short sha>"}
```
Advancing `gitHead` on a no-op keeps the staleness signal honest and lets the next run's cheap pre-check fire.

### STEP 9 — REPORT
Pages edited / added / removed / promoted from backlog — or explicit "wiki already current". Any wiki-vs-code contradiction noticed mid-session (including ones surfaced by consumption commands reporting drift) is evidence for STEP 4/5 edits — treat it as input, not a side note to discard.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "I'll refresh this page while I'm in there" | Formatting-only edits are forbidden unless content is already changing for accuracy. Leave it. |
| "3+ pages feel relevant, I'll just edit them" | Re-examine the impact plan first — over-budget edits usually mean the plan is wrong, not the budget. |
| "No gitHead, I'll skip evidence collection" | Fall through the tier chain (last 20 commits) with an explicit best-effort warning — never silently do nothing. |
| "Nothing changed, skip writing .meta.json" | Advance it anyway — that's what makes the next pre-check fire. |
| "This page's stamp looks old, I'll bump it too" | Untouched pages keep their stamps. Bumping without an edit is a lie about provenance. |
| "The hub mentions this fact, I'll update it for consistency" | Hub edits require navigation/product-level relevance, not incidental consistency. |

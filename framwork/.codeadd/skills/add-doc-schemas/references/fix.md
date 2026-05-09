# Fix Category — Schemas & Voice

Category file for hotfix docs. Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns hotfix-specific schemas and notation.

**Schemas in this category:** `hotfix-about`, `hotfix-related`.

## Shared Notation

### Symptom Notation

The shape used by both schemas in this category (and shared with `diagnose-report` in the review category):

- **when** — under what conditions or load the issue occurs
- **where** — component, endpoint, file, or environment scope
- **impact** — observable user-facing or system-facing effect
- **detection** — the signal that surfaces it (alert, log line, user report, metric)

### Root Cause Notation

A root-cause section MUST explain *why*, not just *where*:

1. **Trigger** — the input or state that activates the bug
2. **Faulty path or state** — the specific code/data that misbehaves
3. **Why safeguards missed it** — which existing test, type, validation, or review *should* have caught the bug and didn't, and why

Skipping the third point is the most common failure mode of a hotfix postmortem. The root-cause section exists to feed back into review/test discipline; without "why safeguards missed it" it is just a fix log.

## Schemas

### hotfix-about

For `/add.hotfix` (creates `docs/features/[NNNN]H-<slug>/about.md`).

- **Frontmatter:** `id: [NNNN]H`, `type: hotfix-about`, `severity:`, `related: []`
- **Sections:** TL;DR · Symptom · Root Cause · Fix · Verification
- **Depth floor:**
  - **Symptom** — when it occurs, where (component/endpoint/file), observable impact, affected users or scope, detection signal. Use Symptom Notation above.
  - **Root Cause** — the actual mechanism per Root Cause Notation above. The trigger, the faulty code path or data state, why existing safeguards (tests, types, validation) failed to catch it. This section MUST explain *why*, not just *where*.
  - **Fix** — file-level list of changes with the intent of each change (not a diff).
  - **Verification** — the check that proves the fix works: test added, manual repro no longer reproduces, metric returned to baseline.
- **Compression:** Symptom = bullets `when / where / impact / detection`. Root Cause = topic sentence + extractive bullets tracing the mechanism. Fix = bullets `path:line — what changed — why`. Verification = checklist.
- **Hard bans:** blame narrative, long stack traces inline (link instead), post-mortem opinion without evidence.
- **Avoid unless load-bearing:** skipping the "why safeguards missed it" — that failure analysis is the whole point of the Root Cause section.

### hotfix-related

For `/add.hotfix` (creates `docs/features/[NNNN]H-<slug>/related.md`, listing impacted assets).

- **Frontmatter:** `id: [NNNN]H-related`, `type: hotfix-related`, `related: [[NNNN]H]`
- **Sections:** TL;DR · Impacted Files · Impacted Docs · Follow-ups
- **Depth floor:**
  - **Impacted Files** — every file touched by the fix, with `path:line — reason`. No implicit scope.
  - **Impacted Docs** — every existing doc that now contains stale info because of this fix.
  - **Follow-ups** — every non-blocking cleanup, test debt, or monitoring task the fix surfaced. Each item actionable.
- **Compression:** all list-only, no prose.
- **Hard bans:** duplicating the about.md fix description; prose paragraphs.

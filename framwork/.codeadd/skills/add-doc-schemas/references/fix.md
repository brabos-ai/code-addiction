# Fix Category — Schemas & Voice

Category file for hotfix docs. Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns hotfix-specific schemas and notation.

**Schemas in this category:** `hotfix-about`.

## Shared Notation

### Symptom Notation

The shape used by both schemas in this category (and shared with `diagnose-report` in the review category):

- **when** — under what conditions or load the issue occurs
- **where** — component, endpoint, file, or environment scope
- **impact** — observable user-facing or system-facing effect
- **detection** — the signal that surfaces it (alert, log line, user report, metric)

### Finding Evidence (delegated)

The `## Review` section of `hotfix-about` records judged findings. Those findings obey the **Finding & Evidence Discipline** defined in `{{skill:add-doc-schemas/references/review.md}}` — evidence reference forms, and the rule that a severity without supporting evidence is an opinion in disguise. One definition governs both categories; it is referenced here, never restated.

### Root Cause Notation

A root-cause section MUST explain *why*, not just *where*:

1. **Trigger** — the input or state that activates the bug
2. **Faulty path or state** — the specific code/data that misbehaves
3. **Why safeguards missed it** — which existing test, type, validation, or review *should* have caught the bug and didn't, and why

Skipping the third point is the most common failure mode of a hotfix postmortem. The root-cause section exists to feed back into review/test discipline; without "why safeguards missed it" it is just a fix log.

## Schemas

### hotfix-about

For `/add.hotfix` (creates `docs/features/[NNNN]H-<slug>/about.md`).

- **Frontmatter:** `id: [NNNN]H`, `type: hotfix-about`, `severity:`, `related: []`, `tags: []`
- **Sections:** TL;DR · Symptom · Root Cause · Fix · Verification · Review · Relations · Observations
- **Depth floor:**
  - **Symptom** — when it occurs, where (component/endpoint/file), observable impact, affected users or scope, detection signal. Use Symptom Notation above.
  - **Root Cause** — the actual mechanism per Root Cause Notation above. The trigger, the faulty code path or data state, why existing safeguards (tests, types, validation) failed to catch it. This section MUST explain *why*, not just *where*.
  - **Fix** — file-level list of changes with the intent of each change (not a diff).
  - **Verification** — the check that proves the fix works: test added, manual repro no longer reproduces, metric returned to baseline. When a test pinned the bug, name it (`path::test name`); when none could, carry the recorded escape `RED_TEST: none — REASON: <…>` verbatim.
  - **Review** — the triaged outcome of the delivery review, one row per finding: axis (security / conformance / failure), severity, `path:line`, the rule cited, and **disposition** (`fixed` / `accepted` / `unverifiable` / `pre-existing`). List every axis that was judged, including one that could not run and why — an omitted axis is indistinguishable from a passed one. Empty of findings is a valid state; the section itself is not optional.
  - **Relations** — one `- caused_by [[<id>]]` line per work item whose change produced this bug, per the Relations & Observations section of `{{skill:add-doc-schemas/SKILL.md}}`. **Sourced from the candidate set `/add.hotfix` already confirmed with the user during its history synthesis**, never from a fresh question. A hotfix whose cause resolves to no recorded work item writes the section with the single word `None`.
  - **Observations** — `- [<category>] <text>` lines carrying the facts the postmortem surfaced: the trigger, the measured impact, the safeguard that missed it. This is where the analysis that used to spread across prose becomes findable.
- **Compression:** Symptom = bullets `when / where / impact / detection`. Root Cause = topic sentence + extractive bullets tracing the mechanism. Fix = bullets `path:line — what changed — why`. Verification = checklist. Review = table. Relations and Observations = one line each, no prose.
- **Hard bans:** blame narrative, long stack traces inline (link instead), post-mortem opinion without evidence, a Review row with no `path:line`, recording a `pre-existing` finding as though this change caused it, and a `caused_by` relation the user never confirmed.
- **Avoid unless load-bearing:** skipping the "why safeguards missed it" — that failure analysis is the whole point of the Root Cause section.

### hotfix-related (retired)

⛔ **This schema is retired. Nothing writes `related.md` any more.**

```
IF ABOUT TO WRITE docs/features/[NNNN]H-<slug>/related.md:
  ⛔ DO NOT USE: Write on any related.md path
  ⛔ DO NOT: Allocate a `[NNNN]H-related` id
  ✅ DO: Put the relationships in the about.md `## Relations` section instead
```

**It is recorded here rather than deleted, because both of its filled sections were harvested and a reader needs to know where they went.** Measured across a real installation of 19 hotfixes: 15 carried an explained relationship in `## Follow-ups` and 18 carried a real `## Impacted Files` list. That was the richest relationship content in the corpus, and deleting the schema without saying so would have lost the trail.

| The old section | Where it lives now |
|---|---|
| `## Follow-ups` | The `about.md` `## Relations` section. A Follow-up naming another document was already a typed edge with its reason written out; it becomes a `- <type> [[<id>]] — <why>` line |
| `## Impacted Files` | The node's **file set** in the graph index, which is what the `touched_by` action crosses against a wiki reference page's `sources` globs |
| `## Impacted Docs` | Nothing. It duplicated `## Relations` before `## Relations` existed |
| `## TL;DR` | Nothing. The `about.md` already carries the one that matters |

**An existing `related.md` is a user file and is never deleted.** The `codeadd update` migration reads both filled sections, harvests them into the new format, and leaves the file exactly as it found it. A brownfield project keeps every one of them on disk as history, and nothing writes another.

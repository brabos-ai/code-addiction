# Fix Category — Schemas & Voice

Category file for hotfix docs. Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns hotfix-specific schemas and notation.

**Schemas in this category:** `hotfix`.

## Shared Notation

### Symptom Notation

The shape used by both schemas in this category (and shared with `diagnose-report` in the review category):

- **when** — under what conditions or load the issue occurs
- **where** — component, endpoint, file, or environment scope
- **impact** — observable user-facing or system-facing effect
- **detection** — the signal that surfaces it (alert, log line, user report, metric)

### Finding Evidence (delegated)

The `## Review` section of `hotfix` records judged findings. Those findings obey the **Finding & Evidence Discipline** defined in `{{skill:add-doc-schemas/references/review.md}}` — evidence reference forms, and the rule that a severity without supporting evidence is an opinion in disguise. One definition governs both categories; it is referenced here, never restated.

### Root Cause Notation

A root-cause section MUST explain *why*, not just *where*:

1. **Trigger** — the input or state that activates the bug
2. **Faulty path or state** — the specific code/data that misbehaves
3. **Why safeguards missed it** — which existing test, type, validation, or review *should* have caught the bug and didn't, and why

Skipping the third point is the most common failure mode of a hotfix postmortem. The root-cause section exists to feed back into review/test discipline; without "why safeguards missed it" it is just a fix log.

## Schemas

### hotfix

For `/add.hotfix` (creates `docs/features/[NNNN]H-<slug>/about.md`).

- **Frontmatter:** `id: [NNNN]H`, `type: hotfix`, `severity:`, `related: []`, `tags: []`, and optionally `ticket: [NNNN]B`
  - **`ticket:`** (optional) — the backlog ticket this hotfix works, when its invocation named one. Written by `/add.hotfix` before the file is fingerprinted. **Absent is the normal case**, which is why it is not in the validation gate's required set. What each command does with it is owned by `{{skill:add-backlog/references/lifecycle.md}}`; nothing here restates it.
- **Sections:** TL;DR · Symptom · Root Cause · Fix · Verification · Review · Relations · Observations
- **Depth floor:**
  - **Symptom** — when it occurs, where (component/endpoint/file), observable impact, affected users or scope, detection signal. Use Symptom Notation above.
  - **Root Cause** — the actual mechanism per Root Cause Notation above. The trigger, the faulty code path or data state, why existing safeguards (tests, types, validation) failed to catch it. This section MUST explain *why*, not just *where*.
  - **Fix** — file-level list of changes with the intent of each change (not a diff).
  - **Verification** — the check that proves the fix works: test added, manual repro no longer reproduces, metric returned to baseline. When a test pinned the bug, name it (`path::test name`); when none could, carry the recorded escape `RED_TEST: none — REASON: <…>` verbatim.
  - **Review** — the current hotfix-local delivery receipt. It starts with these scalar lines exactly once and in this order:

    ```text
    status: passed | blocked
    reviewer: named | generic | inline
    reviewed-at: <RFC3339 UTC>
    reviewed-tree: sha256:<64 lowercase hex>
    build: passed | blocked
    pinned-test: passed | none:<reason> | blocked
    ```

    `### Reviewed Paths` follows. Its fenced `text` manifest has one sorted line per required delivery path: `<present|deleted>\t<mode>\t<content-sha256-or-dash>\t<path-hex>`. Include tracked deletions and both sides of a rename. Include `about.md` itself. Fingerprinting normalizes only `reviewed-tree`, the content hash in `about.md`'s own manifest row, and the close-out-owned `## Addendum: Additional Deliveries` block. `### Findings` follows with table `ID | Severity | Confidence | Citation | Route | Disposition | Re-review | Detail`. Severity is `blocker | major | minor | polish`; confidence is `confirmed | needs-verification`; disposition is `fixed | accepted | pre-existing | unverifiable | open`; re-review is `addressed | not-addressed | not-run`. An empty review writes the header and separator with no data row.

    `status: passed` requires `build: passed`, a pinned test of `passed` or `none:<reason>`, and every blocker or major finding either `fixed` plus `addressed`, or `accepted` by an explicit user decision. A blocker or major with `unverifiable`, `open`, `not-addressed`, or `not-run` makes the receipt blocked. Open minor and polish findings are allowed and remain in the table. Every other combination is schema-invalid.
  - **Relations** — one `- caused_by [[<id>]]` line per work item whose change produced this bug, per the Relations & Observations section of `{{skill:add-doc-schemas/SKILL.md}}`. **Sourced from the candidate set `/add.hotfix` already confirmed with the user during its history synthesis**, never from a fresh question. A hotfix whose cause resolves to no recorded work item writes the section with the single word `None`.
  - **Observations** — `- [<category>] <text>` lines carrying the facts the postmortem surfaced: the trigger, the measured impact, the safeguard that missed it. This is where the analysis that used to spread across prose becomes findable.
- **Compression:** Symptom = bullets `when / where / impact / detection`. Root Cause = topic sentence + extractive bullets tracing the mechanism. Fix = bullets `path:line — what changed — why`. Verification = checklist. Review = scalars + path manifest + findings table. Relations and Observations = one line each, no prose.
- **Hard bans:** blame narrative, long stack traces inline (link instead), post-mortem opinion without evidence, a Review finding with no citation, recording a `pre-existing` finding as though this change caused it, a `caused_by` relation the user never confirmed, creating a hotfix `review-NNN.md`, omitting a delivered path, changing a hotfix-owned file after fingerprinting, and marking a blocker or major receipt passed while its finding remains unresolved.
- **Avoid unless load-bearing:** skipping the "why safeguards missed it" — that failure analysis is the whole point of the Root Cause section.

# Brainstorm: Hotfix Diagnosis Handoff and Review Gate

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-19
> **Type:** workflow

## Objective

A hotfix that starts from an accepted `/add.diagnose` report will reuse that investigation instead of
repeating history discovery and root-cause analysis. Every hotfix will finish with its own current,
verifiable review receipt, proceed directly to `/add.done`, and never require or recommend
`/add.review`.

## Discovery

- `add.hotfix` already reviews its delivery through three parallel judges and records the result in
  `about.md`; it does not structurally depend on `add.review`.
- `add.done` already skips the feature review gate for hotfix branches, but it does not positively
  validate that the hotfix's own review ran or still describes the current tree.
- `status.sh` is the remaining misleading surface: its phase recommendation can emit
  `/add.review or /add.done` without considering that the current branch is a hotfix.
- `add.build` supplies the preferred mechanism: `reviewer-agent`, routed correction, and a scoped
  re-review that proves findings were addressed.
- `add.diagnose` can persist a diagnosis, but persistence is currently optional and the report does
  not carry a machine-readable hotfix handoff or the commit at which the evidence was collected.
- Prior delivery `2026-09-17T153506-PLAN--cut-review-and-build-loop-cost` established one review and
  one correction wave as the cost boundary for the feature review/build loop. Prior delivery
  `2026-09-11T014333-PLAN--product-close-out-parity` established the current `add.done` gate model.

## Context & Motivation

The present commands duplicate work at the point where an accepted diagnosis becomes a hotfix.
`add.diagnose` has already reconstructed history, traced the code, compared hypotheses, and selected
a root cause. A new `add.hotfix` run nevertheless starts its own history and investigation sequence.

At the other end, a hotfix has an internal review but close-out only exempts it from the feature
review gate. Exemption is not proof. There is no deterministic check that the hotfix review passed or
that no relevant code changed after it.

## Problem / Opportunity

Three gaps make the flow slower or weaker than intended:

1. The diagnose-to-hotfix boundary is conversational instead of a file contract, so a cold hotfix
   cannot safely reuse the investigation.
2. The hotfix review uses a separate three-judge model instead of the bounded reviewer/correction/
   re-review mechanism used by the build path.
3. The close-out knows that hotfix does not need `add.review`, but it cannot validate the hotfix's own
   receipt or its freshness.

## Proposed Solution

### 1. Persist an accepted diagnosis

Change `add.diagnose` so user agreement with the diagnosis is the persistence decision. An accepted
diagnosis is always written to `docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md`, including `no-action` and
non-hotfix routes. A rejected diagnosis is not written; exploration resumes instead.

Record the repository state used by the investigation:

- `diagnosed-commit`: the full `HEAD` SHA
- `diagnosed-branch`: the current branch
- the evidence-backed files and symbols in the selected causal chain
- a content baseline for every staged, unstaged, deleted, or nonignored untracked path present during
  diagnosis

When the selected route is `hotfix`, append a structured `## Hotfix Handoff` carrying:

- the accepted root cause and observable predicate
- evidence-backed findings with stable IDs and `path:line` citations
- the files/symbols whose changes can invalidate the diagnosis
- implementation boundaries and risks
- the `caused_by` relationships shown to and confirmed by the user
- route value `hotfix`

The handoff has one canonical shape. Keys occur exactly once; a missing or duplicate key fails the
schema. The section starts with these scalar lines in this order:

```text
route: hotfix
accepted: true
diagnosed-branch: <branch>
diagnosed-commit: <40 lowercase hex SHA>
predicate: <WHEN / THEN / BUT CURRENTLY>
root-cause: <accepted causal chain>
```

It then carries three required subsections:

1. `### Findings`: table `ID | Severity | Area | Citation | Symbol | Finding | Required change`.
   IDs are `DIAG-F001` onward; citations are `path:line`; severity is
   `blocker | major | minor | polish`; no blank cell is allowed except `Symbol`.
2. `### Confirmed Relations`: the accepted `- caused_by [[<id>]] - <reason>` lines, or `None`.
3. `### Working Tree Baseline`: one fenced `text` block. A clean tree contains the single word
   `clean`. Otherwise each tab-separated line is
   `<state>\t<mode>\t<content-sha256-or-dash>\t<path-hex>`, sorted by decoded path bytes. States are
   `staged`, `unstaged`, `deleted`, or `untracked`. `path-hex` makes tabs, newlines, spaces, and other
   unusual path bytes unambiguous. A symlink hashes its target bytes; a deletion uses `-`; an empty
   file hashes its zero-byte content. Multiple states for one path are allowed because staged and
   unstaged content can coexist; duplicate state/path pairs fail validation.

The report's normal `Hypotheses` and `Evidence` sections remain the human-readable evidence chain.
The handoff is the receiver contract and does not duplicate rejected hypotheses.

After writing and validating the report, print a copy-ready command using the relative document path
with the requested at-sign file reference:

`/add.hotfix @docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md`

The command remains a suggestion. `add.diagnose` never invokes `add.hotfix` itself.

### 2. Add a diagnosis-backed hotfix entry path

`add.hotfix` accepts an optional `@docs/diagnose/*.md` argument.

Without it, the normal path remains available and performs the current history discovery,
investigation, root-cause confirmation, and relation confirmation.

With it, the command validates the report before creating or changing code:

1. The document passes the `diagnose-report` schema.
2. The accepted route is `hotfix` and the handoff is complete.
3. The report carries a full `diagnosed-commit` and the commit exists locally.
4. The current repository delta does not invalidate the cited causal chain.

The fourth check is incremental:

- Clean tree and `HEAD == diagnosed-commit`: pass without rereading every cited file.
- `HEAD != diagnosed-commit`: inspect only `diagnosed-commit..HEAD`.
- Dirty tree: compare staged, unstaged, deleted, and nonignored untracked state against the report's
  per-state content baseline. State that existed during diagnosis is not new drift; only a changed,
  added, or removed baseline entry is.
- A delta that does not touch a handoff file, symbol, or cited hunk is unrelated and does not block.
- A delta that can change a finding or its causal chain blocks and requires a new `/add.diagnose`.
- An unreachable diagnosed commit also blocks; the command never silently falls back to a full
  investigation while claiming to have consumed the report.
- A handoff with a missing, duplicate, malformed, or unknown field blocks before branch creation.

After this gate passes, the invocation itself is approval to apply the accepted fix. The command:

- allocates the hotfix ID and branch as usual
- copies the accepted symptom, root cause, evidence, relationships, and boundaries into working
  context
- skips history discovery, hypothesis generation, code tracing, root-cause confirmation, and a
  second relationship question
- implements the smallest fix that addresses the handoff findings
- runs the existing build and optional TDD verification

### 3. Replace the hotfix's three-judge review

Replace `security-agent`, `conformance-agent`, and `failure-analysis-agent` in the hotfix delivery
review with the bounded mechanism shared with `add.build`:

1. Dispatch `reviewer-agent` in its general task mode against the hotfix report, changed files,
   accepted root cause, and verification result.
2. Dispatch its OWASP mode only when the changed paths touch authentication, payment, upload, input
   handling, session, token, or another caller-identified sensitive area.
3. Verify every blocking citation before routing it.
4. Route confirmed findings into one correction wave. Prefer one `fix-agent` dispatch for the whole
   ordered wave; if full-access subagent dispatch is unavailable, the coordinator applies the same
   routed rows inline.
5. Re-review only the original open findings and the paths changed by that correction wave.

The coordinator translates reviewer output into the hotfix routing vocabulary without changing the
reviewer's judgement:

| Reviewer severity | Hotfix severity |
|---|---|
| `Critical` | `blocker` |
| `Important` | `major` |
| `Minor` | `minor` |

`polish` is accepted only when a reviewer explicitly emits that existing framework severity; the
coordinator never downgrades a `Minor` to create it. The coordinator allocates `HF-R001` onward after
sorting by severity, path, and line. It derives `Area` and `Route` from the owning path, and leaves
`Blocked by` empty unless the finding itself names a causal dependency.

The one `fix-agent` call receives the current hotfix `about.md`, the diagnose report when present,
`AREAS`, the full ordered `ROUTED_ROWS`, `ATTEMPT=1`, `MAX_ATTEMPTS=1`, and build errors verbatim.
The rows use the agent's existing table shape. There is no second dispatch. A generic full-access
subagent or the coordinator applies the same whole wave when the named agent is unavailable.

Because hotfix code is still uncommitted, `hotfix-gates.sh snapshot-wave` captures the routed paths
immediately before correction into an OS temporary directory and returns its path. After correction,
`hotfix-gates.sh diff-wave` emits a correction-only package from that snapshot and the current paths,
including adds, deletes, modes, and symlink targets. `reviewer-agent` `MODE: re-review` is amended to
accept either its existing commit-range package or this deterministic snapshot package. The verdict
contract stays unchanged.

If read-only subagent dispatch is unavailable, the coordinator performs the review inline using the
same inputs, checklist, finding fields, and citation gate. The receipt records `reviewer: inline` so
the weaker independence is visible rather than hidden.

The correction cap is one wave. Any `blocker` or `major` finding still open after re-review blocks
completion. `minor` and `polish` findings are recorded and do not extend the loop.

### 4. Make `about.md` the hotfix review receipt

Keep the receipt in `about.md` `## Review`; do not create `review-NNN.md` for hotfixes. Update the
hotfix schema so the section contains:

- `status: passed | blocked`
- reviewer route: named agent, generic subagent, or inline
- review timestamp
- reviewed-tree fingerprint
- each finding's ID, severity, confidence, citation, route, disposition, and re-review verdict
- open minor/polish observations
- build and pinned-test result used by the review

The exact section begins with these required scalar lines, once each and in this order:

```text
status: passed | blocked
reviewer: named | generic | inline
reviewed-at: <RFC3339 UTC>
reviewed-tree: sha256:<64 lowercase hex>
build: passed | blocked
pinned-test: passed | none:<reason> | blocked
```

It then contains `### Reviewed Paths`, whose fenced `text` manifest uses
`<state>\t<mode>\t<content-sha256-or-dash>\t<path-hex>`, and `### Findings`, whose table is
`ID | Severity | Confidence | Citation | Route | Disposition | Re-review | Detail`. Disposition is
`fixed | accepted | pre-existing | unverifiable | open`; re-review is
`addressed | not-addressed | not-run`. An empty review writes an empty table, not an omitted section.

`status: passed` requires build `passed`, pinned test `passed` or a recorded `none:<reason>`, and every
`blocker`/`major` row to be `fixed` plus `addressed`, or `accepted` by an explicit user decision.
`unverifiable`, `open`, or `not-addressed` at either severity makes the receipt `blocked`. Open
`minor`/`polish` rows are allowed but remain visible. Any other combination is schema-invalid.

The reviewed-tree fingerprint covers the explicit Reviewed Paths manifest: every branch-delivery
source, test, config, migration, and hotfix document path, plus every path changed by correction.
Tracked deletions are explicit. A rename is old-path deletion plus new-path content. Paths are hex
encoded and sorted by decoded bytes. Content is hashed as raw bytes, so CRLF is not normalized;
empty files, executable mode, symlinks, and unusual names remain distinct.

`about.md` is included, not excluded. To avoid a self-referential hash, the script replaces only the
`reviewed-tree:` value and the content hash in `about.md`'s own Reviewed Paths row with the literal
`<SELF>` before hashing. It also removes the close-out-owned
`## Addendum: Additional Deliveries` block, if present. It does not normalize `status`, findings,
dispositions, build result, or any other review content. Scratch snapshots and later close-out outputs
(`changelog.md`, delivery-index entries, and wiki files) are outside the manifest rather than broad
exclusions.

Write order is fixed: finish implementation and correction, run build/test, append `iterations.jsonl`,
write the complete `about.md` receipt with `reviewed-tree: sha256:<PENDING>`, calculate the manifest
with that one value normalized to `<SELF>`, then replace `<PENDING>` with the final hash. No hotfix
file changes after this point.

### 5. Give both gates one deterministic owner

Add `hotfix-gates.sh` with three responsibilities:

- Diagnosis freshness: parse the handoff state, enumerate the delta since `diagnosed-commit`, include
  pending changes, and report exact changed/overlapping paths for the command to judge against cited
  hunks and symbols.
- Review freshness: calculate the reviewed-tree fingerprint and validate the final `about.md`
  receipt's status and fingerprint against the current tree.
- Correction isolation: capture and compare the one correction wave for re-review.

The script reports facts and deterministic verdicts. It does not make semantic edits or decide that
a changed hunk preserves a causal chain; `add.hotfix` makes that bounded judgement from the script's
delta output and the report evidence.

### 6. Gate hotfix close-out positively

In `add.done`, keep the existing feature-only `converge-gates.sh` path. Add a separate hotfix-only
preflight that calls `hotfix-gates.sh` against the resolved hotfix directory.

The hotfix gate passes only when:

- `about.md` has a complete `## Review` receipt
- receipt status is `passed`
- no `blocker` or `major` remains open
- the current reviewed-tree fingerprint equals the recorded fingerprint

On failure, stop before changelog, delivery-index write, commit, push, or merge. The remedy is to rerun
`/add.hotfix` so its own review becomes current. Never send a hotfix to `/add.review`.

Apply it to `add.done` routes explicitly:

- **Normal:** validate the current working tree before any close-out write.
- **Resume:** validate again. Changelog, delivery-index, wiki, and the normalized Additional
  Deliveries addendum do not stale the reviewed manifest, so a refused merge can resume safely.
- **Closed out:** keep the existing early stop; no gate is rerun after delivery is already indexed and
  merged.
- **Recovery:** validate the receipt and Reviewed Paths against the merge commit tree, not today's
  `main`. `hotfix-gates.sh review --tree <merge-commit>` reads every manifest path from that commit.
  A missing or blocked receipt prevents recovery from authoring an index entry that claims a gated
  hotfix.

### 7. Correct routing and ecosystem text

- Make `status.sh` branch-aware at its recommendation site: a completed hotfix recommends only
  `/add.done`.
- Keep feature recommendations unchanged.
- Update `add-ecosystem` to describe `diagnose -> hotfix @report -> done` and the new reviewer/fix-agent
  usage.
- Preserve the TDD fragment's statement that no `## Fix Routing` table exists yet at the RED gate;
  that remains true before implementation. Update only step references made stale by the hotfix
  rewrite, while preserving its single injection point and existing anchors.

## Alternatives Considered

| Alternative | Why not selected |
|---|---|
| Keep the three hotfix judges | Preserves specialized axes, but keeps a second review model and costs three dispatches on every hotfix. |
| Add `review-NNN.md` to hotfix | Copies the feature review lifecycle, QA-baseline assumptions, and numbering without adding evidence beyond the existing `about.md`. |
| Trust only a stored `passed` value | Allows code changes after review to merge under stale evidence. |
| Invalidate diagnosis on any new commit | Safe but needlessly rejects unrelated history; incremental delta inspection preserves speed without hiding drift. |
| Re-read all cited files on every handoff | Repeats work even when `HEAD` equals the diagnosis SHA; the SHA and delta are enough to decide whether evidence may have moved. |
| Accept conversational diagnosis context | Cannot be reproduced after compaction or in a new session and gives `add.hotfix` no file contract to validate. |

## Type of Artefact

This is a product-layer workflow change across existing commands and schemas plus one new shipped
script. It alters the handoff contract between commands, so it requires an architectural plan rather
than an isolated command edit.

## Scope

### Includes

- Accepted-diagnosis persistence and hotfix handoff in `add.diagnose`
- SHA and pending-tree state in the diagnose report contract
- `@relative/path` input and fast path in `add.hotfix`
- Incremental diagnosis drift validation
- Reviewer-agent, conditional OWASP, one correction wave, and scoped re-review
- Inline review/correction fallback where subagent dispatch is unavailable
- Hotfix review receipt and reviewed-tree fingerprint in `about.md`
- New deterministic `hotfix-gates.sh`
- Hotfix-only gate in `add.done`
- Branch-aware `status.sh` recommendation
- Ecosystem, schema, graph declarations, provider outputs, and focused tests

### Concrete Artefact Set

- `framwork/.codeadd/commands/add.diagnose.md`
- `framwork/.codeadd/commands/add.hotfix.md`
- `framwork/.codeadd/commands/add.done.md`
- `framwork/.codeadd/skills/add-doc-schemas/references/review.md`
- `framwork/.codeadd/skills/add-doc-schemas/references/fix.md`
- `framwork/.codeadd/agents/reviewer-agent.md`
- `framwork/.codeadd/agents/fix-agent.md` only if its existing input contract cannot accept the
  fully populated hotfix wave; prefer no change
- `framwork/.codeadd/skills/add-ecosystem/SKILL.md`
- `framwork/.codeadd/scripts/hotfix-gates.sh`
- `framwork/.codeadd/scripts/status.sh`
- `framwork/.codeadd/scripts/tests/hotfix-gates.bats`
- `framwork/.codeadd/scripts/tests/status.bats`
- `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md`
- `cli/tests/hotfix-review-0073.test.js` and the focused CLI tests that pin judge dispatch, contiguous
  hotfix steps, ecosystem rows, graph edges, injection counts, and anchors
- `framwork/provider-map.json` only where script registration/build mapping requires it

Run the product build to regenerate provider outputs, inventory, injection sidecars, and the artefact
graph. Do not edit generated outputs or sidecars by hand.

### Does NOT Include

- A `review-NNN.md` or QA baseline for hotfixes
- Changes to feature `/add.review` or its feature-only close-out gates
- Automatic invocation of `add.hotfix` by `add.diagnose`
- Reusing an unpersisted conversational diagnosis
- More than one hotfix correction wave
- Reworking unrelated `status.sh` recommendations
- Adding `qa-pipeline` to hotfix

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Persist every diagnosis the user accepts | reproducible handoff | Agreement becomes a durable decision rather than session memory | Yes |
| Print `/add.hotfix @<relative-report>` | low-friction transition | The user can copy one explicit command and the receiver gets an exact input | Yes |
| Record diagnosis branch and full HEAD SHA | avoid repeated investigation | Equality proves no committed drift; a range bounds any later inspection | Yes |
| Inspect only post-diagnosis commits and pending changes | fast but safe reuse | Unchanged evidence is not reread; relevant drift is still visible | Yes |
| Confirm `caused_by` links in diagnose | no repeated question | The same approval that accepts the root cause accepts the shown causal links | Yes |
| Replace three judges with reviewer-agent plus conditional OWASP | one review model | Aligns hotfix with the bounded build review and reduces dispatch cost | Yes |
| Allow inline review fallback | provider portability | The workflow remains usable where subagent dispatch is unavailable, with the weaker independence recorded | Yes |
| Limit correction to one wave | rapid hotfix boundary | Important unresolved findings block instead of creating an open-ended loop | Yes |
| Keep the receipt in `about.md` | hotfix-local proof | Avoids importing feature review numbering and QA semantics | Yes |
| Require a reviewed-tree fingerprint at done | current evidence | A passed review cannot authorize later code changes | Yes |
| Put both gates in `hotfix-gates.sh` | deterministic ownership | Producer and consumer use one implementation instead of duplicated prompt rules | Yes |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|---|---|---|---|
| `add.diagnose` | `add`, `add.brainstorm`, `add-investigation`; GitNexus fragment injects into it | Accepted output becomes a durable handoff carrying repository state | Change command, schema use, close report, and tests |
| `add.hotfix` | `add`, `add.brainstorm`, `add.diagnose`, `add.done`, `add-doc-schemas`, `add-investigation`; TDD and GitNexus fragments inject into it | Adds diagnosis-backed path and replaces review mechanism | Change command declarations, steps, examples, fragment assumptions, and tests |
| `add.done` | `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`, `add-doc-schemas`, `add-qa`; docs-pruning, QA-review, and GitNexus fragments point to or inject into it | Adds a positive hotfix receipt/freshness gate | Change hotfix branch path without changing feature gates |
| `status.sh` | 19 direct artefact consumers | Hotfix recommendation becomes branch-aware | Change only the recommendation condition; run the full script suite |
| `add-doc-schemas/references/review.md` | `add-doc-schemas`, `add-cross-sf-consistency` | Diagnose report gains repository state and structured hotfix handoff | Extend schema and validation examples |
| `add-doc-schemas/references/fix.md` | `add-doc-schemas` | Hotfix Review changes from three axes to receipt, findings, verdicts, and fingerprint | Replace the old Review depth floor |
| `add-ecosystem` | `add`, `add.audit`, `add.diagnose`, `add.done`, `add.hotfix`, `add.wiki` | Flow and agent map change | Update routing and ownership descriptions |
| `reviewer-agent` | 9 direct artefact consumers | Hotfix reuses task/re-review contracts | Extend re-review input to accept the script's correction-only snapshot package as well as the existing commit-range package |
| `fix-agent` | `add.build`, QA build fragment, `add-subagent-driven-development` | Hotfix becomes a new dispatcher | Add the hotfix dispatch edge; do not change agent behavior unless its current input contract is insufficient |
| `hotfix-gates.sh` | new; intended direct callers are `add.hotfix` and `add.done` | Owns diagnosis and review freshness | Create, register, document exit codes, and add Bats coverage |

`security-agent`, `conformance-agent`, and `failure-analysis-agent` remain registered and unchanged.
Only their direct dispatch edges from `add.hotfix` are removed. Other consumers keep using them. The
ecosystem map and tests must describe that narrower relationship rather than treating this as agent
removal.

The graph cannot see `provider-map.json`, top-level build scripts, tests, `CLAUDE.md`, or equality
constraints between ordinary files. The plan must inspect those manually. Commands with injected
fragments were checked from both sides; their fragment dependencies and anchors remain in scope.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| No repeated investigation after an accepted diagnosis | The diagnose report and schema become more structured |
| One bounded review model across build and hotfix | The always-on three-axis hotfix review is removed |
| Deterministic close-out proof | One new shipped script and its test surface |
| Safe reuse across sessions | The fast path requires a persisted file |
| Lower drift-check cost through SHA ranges | Semantic relevance of an overlapping hunk still needs command judgement |
| Provider portability through inline fallback | Inline review is less independent than a subagent review |

| Risk | Probability | Mitigation |
|---|---|---|
| A diff changes behavior without touching a listed handoff path | Medium | Handoff carries the full causal-chain path set and symbols, not only the final fault line; plugin impact data remains additive where available |
| Untracked files are omitted from freshness checks | Medium | Script explicitly includes nonignored untracked paths in diagnosis delta and review fingerprint |
| Writing `about.md` changes its own fingerprint | High | Script owns a narrow bookkeeping exclusion list and tests receipt-write idempotency |
| `status.sh` branch condition regresses feature recommendations | Medium | Add branch-matrix tests and run all status Bats cases because the script has 19 direct consumers |
| Inline review is mistaken for independent review | Medium | Record reviewer route in the receipt and final report |
| Existing hotfix tests hardcode 14 contiguous steps and judge names | High | Plan explicit test migrations before command rewrite; preserve feature/plugin anchors byte-for-byte where required |
| Diagnose reports created before this change are passed to hotfix | Medium | Schema/handoff gate rejects them with a clear instruction to rerun diagnose; no compatibility shim |
| Diagnosis commit is absent after history rewrite or shallow clone | Low | Block and require a new diagnosis; never infer freshness from timestamps |
| A dirty tree already inspected by diagnose is mistaken for later drift | Medium | Persist per-state path, mode, and content hashes and compare current state against that exact baseline |
| Close-out's own documents stale a Resume run | Medium | Fingerprint only the reviewed manifest and normalize the one close-out-owned about.md addendum |

## Verification Strategy

- Command structure tests prove both hotfix entry paths and that diagnose-backed execution skips the
  investigation steps but not implementation, verification, review, documentation, or logging.
- Diagnose schema tests prove accepted diagnoses always persist and hotfix routes carry a complete
  handoff, SHA, branch, findings, and confirmed relations.
- Script tests cover same SHA, unrelated later commit, overlapping later commit, staged change,
  unstaged change, untracked file, deleted file, missing commit, dirty state already present during
  diagnose versus later dirty drift, passed review, stale fingerprint, blocked receipt, and
  bookkeeping-only writes.
- Close-out tests prove feature gates are unchanged, a current hotfix receipt passes, and missing,
  blocked, or stale receipts stop before any write or merge. Cover Normal followed by Resume,
  Closed out, and Recovery against the merge commit tree.
- Status tests cover feature and hotfix recommendations independently.
- Review tests prove general review, conditional OWASP, one correction wave, scoped re-review,
  unresolved blocker/major stop, minor/polish recording, severity mapping, `fix-agent` inputs with
  `MAX_ATTEMPTS=1`, uncommitted correction-only re-review, and inline fallback disclosure.
- Format tests cover CRLF raw-byte hashing, stable byte ordering, rename, symlink, executable mode,
  empty files, unusual path names, malformed/missing/duplicate handoff fields, and tampering with
  `about.md` outside the one normalized fingerprint value.
- Diagnose tests cover accepted `hotfix`, `feature`, `extend`, and `no-action` routes being persisted;
  rejected diagnoses remain unwritten. Reports from the old schema are rejected by the hotfix path.
- Build and graph tests prove declarations resolve, generated providers contain no markers, existing
  injection anchors remain valid, and the new script ships.
- Run `node scripts/build.js`, the relevant CLI tests, script Bats tests, and the full validation suite
  selected by the plan.

## Next Steps

Run: `/add-framework--plan hotfix diagnosis handoff and review gate`

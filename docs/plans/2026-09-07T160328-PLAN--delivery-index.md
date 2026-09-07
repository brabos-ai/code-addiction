# Plan: Delivery Index — a tracked, self-verifying record of what each feature shipped

> **Status:** implemented
> **Type:** architecture
> **Created:** 2026-09-07
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Generated documentation cites features that were discarded, and features that never reached `main` because their branch died. The cost the owner named: incorrect mapping, wasted tokens, lost time.

The failure is live in this repository. `doc-reviewer-agent` and the `add-doc-reviewer` skill are both deleted — absent from `framwork/.codeadd/`, zero in `provider-map.json` — yet **74 occurrences across 13 files** survive, including `ecosystem.md`, `web/src/pages/docs.astro` and the built `web/dist/docs/index.html`. The deleted skill is drawn in the ecosystem map and published on the documentation site.

**Every decision in this plan was taken and reviewed in the design set below, and approved by the owner on 2026-09-07. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-07T123919-delivery-index-01-product-umbrella.md` | Why the index exists; the five states; the two delivery paths; the reading order of the whole set |
| `docs/brainstorming/2026-09-07T123919-delivery-index-02-product-schema.md` | **The record — owned for both layers.** Fields, the `{what, at, find}` anchor, the four statuses, the search corpus, the nine hard bans |
| `docs/brainstorming/2026-09-07T123919-delivery-index-03-product-write-verify.md` | `delivered.sh`'s three modes and their invocation; where `/add.done` writes; hotfix routing; the over-match thresholds; 25 RED cases |
| `docs/brainstorming/2026-09-07T123919-delivery-index-04-product-consumption.md` | Who reads it and where; the wiki-blind exemption; the `docs-pruning` list and its derivation rule; 14 RED cases |

The internal layer (`05`–`08`) is **out of scope here** and routed to a companion `/add-framework--self-plan`.

## Global Constraints

- Scripts are **not** registered in `provider-map.json` — its keys are `providers`, `commands`, `skills`, `agents`; `collectNodes()` pushes every file in `framwork/.codeadd/scripts/` with `registered = true` hardcoded (`scripts/build.js:845`)
- A name appearing in prose with no declared relationship to it **fails the build** — `failures.push('artefact-graph: undeclared reference …')` at `scripts/build.js:1117`, whose own comment states it: *"'Named in prose but undeclared' is a hard gate: the name is right there, so the fix is mechanical"* (`:1134`). `'script'` is in `SNIFFABLE_KINDS`, so naming `delivered.sh` in a command's prose without declaring it **breaks the build**
- The **inverse** direction — declared but never named in prose — only **warns** (`:1142`), deliberately, because `(conditional)` is an unproven waiver. Warnings print as a bare count unless `ADD_GRAPH_WARNINGS=1` (`:1165`)
- `node scripts/build.js` exits 0, and `ADD_GRAPH_WARNINGS=1 node scripts/build.js` emits no **new** warning naming an artefact this plan touches
- `done.sh --merge` remains the sole git owner: "Do NOT stage, commit, push, move, or delete evidence here. `done.sh --merge` remains the sole git owner" (`add.done.md`)
- `/add.done` STEP 7 is `INFORMATIVE ONLY (NO confirmation)`, and its prohibitions forbid asking the user to confirm the merge (`add.done.md`)
- The installer's `.gitignore` block lists installed directories only — `getInstalledDirs()` returns `.codeadd/` plus provider dests (`cli/src/gitignore.js`), so `docs/` is never ignored by the framework and `docs/delivered.jsonl` is tracked by default
- Fragment sections are `<!-- section:NAME -->`…`<!-- /section:NAME -->`; command markers are `<!-- feature:FEATURE:SECTION -->`…`<!-- /feature:FEATURE:SECTION -->`, stripped at build into `injection-points.json` (CLAUDE.md, Feature Injection System)
- `add-doc-schemas` references register as `- skill: add-doc-schemas/references/<name>.md` inside its `<!-- uses: -->` block

## Problem

1. **Nothing records what a feature delivered.** `docs/features/` accumulates one folder per feature ever started, all weighted equally. An agent in the discovery phase cannot separate shipped from abandoned from never-merged, so it reads and cites them all.
2. **Nothing detects that a cited thing is gone.** A deleted endpoint, table or screen keeps being named in documentation forever, because no mechanism compares documentation against the source.
3. **"Was this tried before?" has no cheap answer.** `@feature-history-agent` and `@git-history-agent` re-scan docs and commits from scratch on every invocation; neither has an index to start from.
4. **Feature folders are permanent.** Ten files each, forever, including scaffolding whose purpose ended at the merge.

## Proposal

Ship a **per-project delivery index** at `docs/delivered.jsonl`: one JSONL line per delivered feature, written only after a merge is proven, carrying searchable words, commit hashes, and 1–5 public-surface items each anchored to a source file by a literal substring. A verification pass re-checks the anchors and repairs stale pointers.

The work sequences into four stages, and the order is a dependency chain, not a preference. **The format comes first** — nothing below can be reviewed against an undefined record. **The writer comes second**, because the reader has nothing to read until entries exist. **The reader third.** **The optional pruning feature last**, because deleting documentation before the index provably carries entries inverts the whole design.

Everything the design set argues is referenced, never restated. This plan states which files change, what changes about them, what each must not lose, and how each is proven.

## Scope

### Includes

#### T1 — Format and script (ref: `…-02-product-schema.md`, `…-03-product-write-verify.md`)

- **F1** — `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` (**new**): documents the JSONL record — every field, the `{what, at, find}` item anchor, the four statuses and their decision rules, the search corpus, and the nine hard bans. **It must NOT acquire the shape of the other references in that directory:** no YAML frontmatter template, no `id:` under the skill's ID convention, no TL;DR, no depth floors, no Decision Log. Every other reference there describes a Markdown document an agent authors; this one describes a minified machine log, and forcing it into `receipt.md`'s template is the specific failure to avoid. Contract: schema doc, "The record" and "Hard bans".
  - **Produces:** `delivery-index record` — the field list, the anchor shape, the four statuses and the nine hard bans
- **F2** — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`: register the new reference in its `<!-- uses: -->` block, and add its row wherever the skill lists what it covers. Must NOT reclassify it as a doc schema.
  - **Consumes:** `delivery-index record` (F1)
- **F3** — `framwork/.codeadd/scripts/delivered.sh` (**new**): three modes — `write` (record on stdin as one JSON object), `read <query> [--layer] [--limit N] [--no-verify]`, `verify [<id>] [--repair]`. `set -u` only, never `-e`. Exit 0 for probe results, 1 for a write the filesystem refuses, 2 for caller error **including a record that breaks a hard ban**, which also prints `REFUSED=<ban>`. The search corpus is every file git does not ignore (`git ls-files --cached --others --exclude-standard`), minus `docs/`, minus the index — **never a filesystem walk and never tracked-only.** Contract: **schema doc**, "What the search may look at" (the corpus rule lives there, not in write-verify); **write-verify doc**, §7 (the three modes and their invocation).
  - **Consumes:** `delivery-index record` (F1)
  - **Produces:** `delivered.sh write` emits `ENTRY=<id>` / `CREATED=<bool>` / `LINES=<n>`; `delivered.sh read` emits matching entries as JSONL pre-sorted `live→changed→superseded→gone`, latest-wins applied, default limit 10; `delivered.sh verify` emits `<id>=<status>` per entry plus `REPAIRED=<n>`
- **F4** — `framwork/.codeadd/scripts/tests/delivered.bats` (**new**): the RED suite, following `converge-gates.bats` — contract documented at the top with this plan's reference, fixture helpers, assertions on exit codes and `KEY=VALUE` output.
  - **Consumes:** the three mode contracts as specified in F3's `Produces` line — **the specification, not the implementation**
  - ⛔ **F4 is WRITTEN BEFORE F3 and confirmed RED.** The numbering is a reference order, not an execution order: this plan's own discipline is "every level written and confirmed failing BEFORE any F-block lands", and its Reviewer Handoff item 1 says a test written after the fix proves nothing. **Intra-T1 execution order: F4 (red) → F1 → F3 (green) → F2.**

#### T2 — The write path (ref: `…-03-product-write-verify.md`)

- **F5** — `framwork/.codeadd/commands/add.done.md` STEP 6: author the entry beside the changelog and **leave it in the working tree**. Item selection is the shape filter from the design doc; `find` selection applies the over-match thresholds (refuse 0 files, accept ≤5, flag 6–20, refuse >20). Hotfix/refactor/chore routing runs `verify` first, then matches at the hunk containing the item's `find` **and** on a pure rename by path; no match anywhere means a new entry under the branch's own `[NNNN][L]`. Add `- script: delivered.sh` to the `<!-- uses: -->` block — **without it the build fails on the prose-name gate.** Must NOT stage, commit or push.
  - **Consumes:** `delivered.sh write` (F3); `delivered.sh verify` (F3) — the hotfix routing runs a report-only verify before matching
  - **Produces:** `STEP 6 entry` — `docs/delivered.jsonl` carrying the new line, uncommitted, in the working tree
- **F6** — `framwork/.codeadd/commands/add.done.md` STEP 7: the preview renders the proposed entry in full — name, words, and every item with its `find`. Must NOT become a confirmation gate; STEP 7 stays `INFORMATIVE ONLY`.
  - **Consumes:** `STEP 6 entry` (F5)
- **F7** — `framwork/.codeadd/scripts/done.sh`: **the staging needs no change** — `done.sh:265` already runs `git add -A -- . ':(exclude)docs/features/*'`, whose only exclusion is `docs/features`, so `docs/delivered.jsonl` is committed today with no edit. F7 is therefore **only** the deterministic pre-check that selects the direct-commit mode — `git diff main...HEAD` excluding STEP-6-authored paths; empty means `main` already carries the branch's content, so the squash contributes nothing. **Never select the mode by catching a merge conflict.** Must NOT lose FIX-14's empty-diff handling.
  - **Consumes:** `STEP 6 entry` (F5)
  - **Produces:** `done.sh direct-commit mode` — selected by the pre-check, commits entry and changelog onto `main` without the squash
- **F8** — `framwork/.codeadd/commands/add.pull-request.md`: one sentence beside the existing post-merge guidance — an index entry is still owed, and `/add.done` is what writes it. Not a new policy, not a gate.

#### T3 — The read path (ref: `…-04-product-consumption.md`)

- **F9** — `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md`: an INDEX step ahead of PRESENCE, **loadable standalone without PRESENCE and the wiki**; amend the *When NOT to Use* bullet so the wiki stays out of `/add.hotfix` STEPs 4–6 while the index does not, **and add the new STEP 4 `--no-verify` entry point to the *When to Use* list**, which today names only the STEP 8.1 load — leaving it out documents the skill as unreachable at the step F10 reaches it from. Absence of the index is a no-op with a note, exactly as the wiki's absence already is. Add `- script: delivered.sh` to the `<!-- uses: -->` block. **All three pieces must land together — the INDEX procedure, the *When NOT to Use* amendment, and the *When to Use* addition.** Any two without the third leave the skill contradicting itself or documenting an entry point as unreachable.
  - **Consumes:** `delivered.sh read` (F3)
  - **Produces:** `standalone INDEX sub-procedure` — the index lookup, invocable without the wiki portion
- **F10** — `framwork/.codeadd/commands/add.hotfix.md`: load the standalone INDEX step at **STEP 4** with `--no-verify`, and carry the ranked, status-labelled results into the `@feature-history-agent` dispatch payload. `--no-verify` is load-bearing: this command forbids `Grep on code files` before the history agents are dispatched, and a verifying read greps source. The full verifying read stays at STEP 8.1, inside the normal skill load. Add `- script: delivered.sh` to the `<!-- uses: -->` block. Must NOT change the agent's method — only its starting point.
  - **Consumes:** `standalone INDEX sub-procedure` (F9); `delivered.sh read` (F3)
- **F11** — `framwork/.codeadd/commands/add.brainstorm.md` STEP 1: load `add-knowledge-discovery`, **remove** the unranked `implemented features from docs/features/` sweep, and deep-read `about.md` for the entries the index matched. Keep the `status.sh` parse and the `RECENT_CHANGELOGS` matching. Add `- skill: add-knowledge-discovery` to the `<!-- uses: -->` block.
  - **Consumes:** `standalone INDEX sub-procedure` (F9)

#### T4 — The `docs-pruning` feature (ref: `…-04-product-consumption.md`)

- **F12** — `cli/src/features.js`: register `docs-pruning` with `default: false` and `commands: ['add.done']`, following the `qa-pipeline` entry's shape.
  - **Produces:** `feature key docs-pruning` — the registry key, which doubles as the fragment directory name
- **F13** — `framwork/.codeadd/fragments/docs-pruning/add.done.md` (**new**): the cleanup block, wrapped in `<!-- section:NAME -->`. Deletes `discovery.md`, `tasks.md`, `epic.md` and `review-*.md` — **and nothing else.** Two hard refusals: never delete a file git does not track, and never run when no index entry was written this run.
  - **Consumes:** `feature key docs-pruning` (F12)
  - **Produces:** `fragment section docs-pruning:<NAME>`
- **F14** — `framwork/.codeadd/commands/add.done.md`: the `<!-- feature:docs-pruning:<NAME> -->` marker at STEP 6, positioned **after** the entry write so the second refusal is structurally satisfiable. The build strips it into `injection-points.json`.
  - **Consumes:** `fragment section docs-pruning:<NAME>` (F13); `STEP 6 entry` (F5)

### Does NOT Include

- **The entire internal layer** — `/add-framework--done`, `graph.js history`, the MCP tool, the internal index, the `.gitignore` negation and the `CLAUDE.md` policy change. `/add-framework--build` reaches neither `.claude/` nor `CLAUDE.md`'s policy prose. Routed to `/add-framework--self-plan` (documents `05`–`08`).
- **The `CLAUDE.md` `docs/` tracking-policy edit** — gated behind a trigger that only an internal `/add-framework--done` run can fire.
- **Backfill** for features delivered before the index exists. Absence must keep meaning "no `/add.done` ran", and a partial backfill would make absence mean two things.
- **Level 3 pruning** — deleting the whole feature folder. Rejected in the design; `about.md` is evidence for the wiki's incremental update path.
- **Deleting `plan.md` or `iterations.*`** — both have post-merge readers (`/add.hotfix` STEP 4, `/add.diagnose` STEP 5, `/add.new` STEP 3).
- **Any change to `gitnexus`, `/add.wiki`, `add-wiki-maintenance`, `@feature-history-agent`'s method, or `@git-history-agent`.**
- **Fixing `ecosystem.md` and `web/src/pages/docs.astro`**, which still draw the deleted `doc-reviewer-agent`. That is `/add-framework--sync`, independent of this plan.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| What is one entry? | One feature carrying 1–5 anchored items | Schema doc — a feature alone cannot be checked against source; an item alone loses what it was for |
| How is an item anchored? | A literal substring (`find`), one contiguous token, byte-exact | Schema doc — the receipt schema's own recorded reason for hashing only owner-scoped paths |
| What decides `live`/`changed`/`gone`? | Presence of `find`, over a corpus scoped by `.gitignore` | Schema doc, "What the search may look at" — a walk reports deleted things alive; tracked-only reports uncommitted work dead |
| Does `changed` mean modified? | **No — it means moved.** The index repairs its own pointer | Schema doc — an always-true status carries no information |
| **How does an entry's status aggregate from its items?** | `superseded` (declared) wins. Else **ALL** items `gone` → `gone`. Else **ANY** item `gone` or `changed` → `changed`. Else `live` | **The design left this open and the build had to rule on it.** Derived, not invented: `gone` is defined as "absent from the source", and an entry with four live items is not absent. ⛔ **"ANY item gone → entry gone" is wrong** — it would bury a mostly-alive feature on the loss of one item, and the umbrella's own pitch was that a feature marks itself dead when its capabilities have **all** vanished |
| When is an entry written? | STEP 6 of `/add.done`; `done.sh --merge` commits it at STEP 8 | Write-verify doc — the path generated documentation already takes |
| Is the item list confirmed? | **No.** The agent authors it, STEP 7 previews it | Write-verify doc — `/add.done` forbids confirmation gates |
| Where is the index read? | Inside `add-knowledge-discovery`, ahead of the wiki | Consumption doc — five commands already load that skill |
| May the index enter `/add.hotfix` STEP 4? | Yes, with `--no-verify` | Consumption doc — the wiki-blind rule guards against narrative; the index is not narrative, but the no-grep rule still binds |
| What may `docs-pruning` delete? | `discovery.md`, `tasks.md`, `epic.md`, `review-*.md` — files no command reads after the merge | Consumption doc, measured. **Reverses part of the umbrella's original level-2 list** |
| Is `docs-pruning` on by default? | **No** | Consumption doc — deleting a user's documentation is their call |
| Does `delivered.sh` need a `provider-map.json` entry? | No | `scripts/build.js:845` pushes scripts with `registered = true` |
| **Who supplies `v` and `ts` on a write?** | **`delivered.sh` generates both.** The caller supplies neither | `log-jsonl.sh:50` generates its own `TS=$(date -u …)`, and the schema describes `ts` as "same format `log-jsonl.sh` already emits". ⛔ **Hard ban 1 governs lines on disk, not the `write` input** — demanding a caller-supplied timestamp is busywork and lets an agent invent a wrong one |
| **What does exit 2 cover?** | Caller error **and** an unmet hard dependency. A hard-ban violation prints `REFUSED=<ban>`; a missing `node` prints `ERROR=node-missing` | Two different failures must be distinguishable by output, not merged under one code. `qa-preflight.sh` already declares node as a hard dependency ("node >= 18 … guaranteed by the CLI") |
| **Is the `read` query case-sensitive?** | **No.** The human query is case-insensitive; `find` stays byte-exact and case-sensitive | The schema fixes `find`'s matching and says nothing about the query. "Google" must find "google" |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A cheap first answer to "have we built this?" | The agent authors 3–5 items per feature and the user only *sees* them |
| Discarded work stops being cited as live | A new tracked file that must itself be kept honest |
| Feature folders lose the four files that multiply | Four pruned, not six — `plan.md` and `iterations.*` have post-merge readers |
| Verification that costs one grep per item in the common case | A corpus search for every item that has moved |
| One delivery path for both merge routes | The `/add.pull-request` route pays one extra commit on `main` |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The search is implemented as a filesystem walk and reports a deleted thing alive — failing on this design's own motivating example | **High** | Hard ban 8 in F1; **L1.6 and L1.7 are its RED pair** — delete an artefact leaving a stale copy on disk, and create an uncommitted source file |
| `find` strings are chosen too generically and every item reports `live` forever | **High** | The thresholds in F3, refused at write time; **L1.9** asserts the >20-file refusal |
| Three F-blocks edit `add.done.md`, one of them adding an injection marker near existing `plugin:gitnexus` markers, breaking an anchor | **High** | This is the failure class plan `0074-001` documented. **L2.3 asserts the injection-point total and every anchor's resolution after each F-block**, and F5/F6/F14 land in that order with a build between each |
| A `<!-- uses: -->` declaration is added to satisfy the hard gate, but the prose never actually names the target — a phantom edge, which only **warns** | Medium | The hard gate cannot see this direction. **L2.2b** greps `ADD_GRAPH_WARNINGS=1` output; a phantom edge silences a real finding later, which is why the warning exists |
| `docs-pruning` is enabled before the index carries entries and prunes folders with no record | Medium | F13's second refusal; **L4.4** asserts nothing is deleted when the entry write did not happen |
| The `/add.pull-request` squash conflicts or duplicates a diff | Medium | **L5.4** is the reproduction; F7's pre-check and direct-commit mode are the named fallback |
| The `add-knowledge-discovery` procedure edit lands without the *When NOT to Use* amendment, leaving the skill self-contradictory | Medium | F9 states both halves as one unit; **L3.5** asserts hotfix STEP 4 loads the index and no wiki page |
| Pruning is interrupted between STEP 6 and STEP 8, leaving files missing with no commit | Low | Recoverable by `git checkout -- <paths>` because F13 refuses untracked files; **L4.6** asserts it |

## Ecosystem Impact

| Component | Necessary action | F |
|-----------|------------------|---|
| `framwork/.codeadd/skills/add-doc-schemas/references/delivery-index.md` | **New** — format reference, not a doc schema | F1 |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | Register the reference in `<!-- uses: -->` | F2 |
| `framwork/.codeadd/scripts/delivered.sh` | **New** — three modes | F3 |
| `framwork/.codeadd/scripts/tests/delivered.bats` | **New** — RED suite | F4 |
| `framwork/.codeadd/commands/add.done.md` | STEP 6 authors the entry; STEP 7 previews it; `docs-pruning` marker at STEP 6; `- script: delivered.sh` in `<!-- uses: -->` | F5, F6, F14 |
| `framwork/.codeadd/scripts/done.sh` | Commits the entry; PR-path pre-check and direct-commit mode | F7 |
| `framwork/.codeadd/commands/add.pull-request.md` | One sentence: an entry is owed | F8 |
| `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md` | INDEX step, standalone-loadable; *When NOT to Use* amended; `- script: delivered.sh` | F9 |
| `framwork/.codeadd/commands/add.hotfix.md` | STEP 4 `--no-verify` load; agent dispatch payload; `- script: delivered.sh` | F10 |
| `framwork/.codeadd/commands/add.brainstorm.md` | STEP 1 swap + `about.md` deep-read; `- skill: add-knowledge-discovery` | F11 |
| `cli/src/features.js` | Register `docs-pruning`, `default: false` | F12 |
| `framwork/.codeadd/fragments/docs-pruning/add.done.md` | **New** — cleanup fragment | F13 |
| `framwork/.codeadd/injection-points.json` | Regenerated — one more anchor | build side-effect of F14 |
| `framwork/.codeadd/artefact-graph.json` | Regenerated — one new `script` node (F3), one new `reference` node (F1), one new `fragment` node (F13), and four new edges | build side-effect of F1, F3, F5, F9, F10, F11, F13 |
| `provider-map.json` | **None** — scripts are not registered there | — |
| `cli/tests/delivery-index.test.js` | **New** — the home for L2, L3 and L4's assertions. L2.4b states F2 and F12 are covered by no other level, so the matrix needs a file; naming follows `hotfix-review-0073.test.js` | matrix |
| `cli/tests/injection-exclusivity.integration.test.js`, `injection-roundtrip.integration.test.js` | **None** — both already iterate generically over `FEATURES` and the sidecar, so **L4.1–L4.5 exercise `docs-pruning` automatically** once F12+F13+F14 land, and are RED before. Do not write duplicates | — |
| `docs/delivered.jsonl` (user project) | Created by the first `/add.done` run; never scaffolded empty | runtime |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written and confirmed failing against the current tree BEFORE any F-block lands.

**EXPECTED END-STATE MAP for `add.done.md` injection** — the build must ASSERT this, not assume it:

| Namespace | Name | Sections into `add.done` | Source |
|---|---|---|---|
| `plugin` | `gitnexus` | exactly **1**, `plugin:gitnexus:graph-reindex` — unchanged | `cli/src/plugins.json` → `injects` |
| `feature` | `docs-pruning` | **1 new section**, at STEP 6 | F13, F14 |

`tdd-pipeline` and `qa-pipeline` inject into `add.plan`, `add.build`, `add.review` and `add.hotfix` — **never `add.done`** — so the only shared-anchor surface on this file is `gitnexus` plus `docs-pruning`.

**Measured baseline (2026-09-07, before any F-block):** `injection-points.json` holds **39** points, of which `add.done` carries exactly one — `plugin:gitnexus:graph-reindex`. **After F14: 40 total, 2 on `add.done`.** Assert those numbers, not a relative "+1".

### L1 — `delivered.sh` unit (`delivered.bats`) — RED → GREEN

1. `write` accepts a valid record on stdin, appends one line, prints `ENTRY=` / `CREATED=` / `LINES=`. *RED: the script does not exist.*
2. `read <query>` matches on `name`, `words`, `id`, `items[].what` and `items[].find`; returns at most 10; pre-sorted `live → changed → superseded → gone`.
3. Two lines for one `id` → `read` returns only the later one.
4. A corrupt line mid-file → skipped, reported by number, other entries still returned.
5. `verify` without `--repair` on a drifted index → statuses reported, file byte-identical afterwards.
6. **Delete an artefact, leave a stale copy in a gitignored directory → `gone`.** *This is the design's own motivating example; a walk-based implementation returns `live` or `changed` here.*
7. **Create a source file, do not commit it, anchor an item into it → `live`.** *A `git ls-files`-only implementation returns `gone`.*
8. Each hard ban, one per run → exit **2** with `REFUSED=<ban>`: absent `find`; `find` with whitespace; six items; item anchored into `docs/`; item anchored into an ignored path; `status` outside the four values; `superseded` without `superseded_by`.
9. `find` matching more than 20 files → refused.
10. `find` absent from `at`, present in exactly one other file → `changed`; `--repair` rewrites `at` to it.
11. `find` absent from `at`, present in three other files → `changed`, `at` **unchanged** even with `--repair`.
12. `--no-verify` returns stored statuses and opens no source file.
13. Bad mode → exit 2. `write` into a read-only filesystem → exit **1**, never 0.

### L2 — Build integrity

1. `node scripts/build.js` exits 0 with no new warning after every F-block.
2. `artefact-graph.json` gains exactly one `script` node (`delivered.sh`), one `reference` node (`add-doc-schemas/references/delivery-index.md`), one `fragment` node (`docs-pruning/add.done.md`), and the four new edges from `add.done`, `add.hotfix`, `add-knowledge-discovery` and `add.brainstorm`. Assert positively — `node scripts/graph.js dependencies add.done` lists `delivered.sh`, and the same for the other three. **RED today: `'script'` is in `SNIFFABLE_KINDS`, so the moment a command names `delivered.sh` in prose without a `<!-- uses: -->` declaration, `build.js:1117` fails the build.** The build is the primary gate here; this level asserts the declarations landed *correctly*, not merely that something landed.
2b. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` emits **zero warnings — not "no new ones".** The measured baseline is **0**, so any warning at all is this plan's. This catches the *inverse* direction the build only warns about (`:1142`) — a declaration added to a `<!-- uses: -->` block whose prose never actually names the target, which the hard gate cannot see.
3. **Injection-point total equals the current baseline + 1**, and every existing anchor on `add.done.md` still resolves. Run after F5, after F6, and after F14 — not once at the end.
4. `contracts.json` unchanged — this plan materializes no new `## Materializes` block.
4b. **F2 and F12 land, asserted directly** — `add-doc-schemas/SKILL.md` carries `- skill: add-doc-schemas/references/delivery-index.md` and the row naming what it covers; `cli/src/features.js` exports `docs-pruning` with `default: false`. Neither is covered by any other level: F2's row is prose the graph does not model, and F12 is a JS object the build does not read.
5. `delivered.sh` exists under `framwork/.codeadd/scripts/`, is packaged by `release.yml`, and installs unchanged to `.codeadd/scripts/` whichever providers are selected. **There is no per-provider script directory** — CLAUDE.md's Resource Path Variables table states scripts are "Always `.codeadd/scripts/` (no variable needed)", and no `framwork/<provider>/scripts/` exists. Do not invent one.

### L3 — Command integration

1. `/add.done` STEP 6 produces an entry in the working tree and commits nothing itself.
2. `/add.done` STEP 7 renders the entry in full and **does not block** — no prompt, no confirmation.
3. `done.sh --merge` commits the entry together with the changelog; the branch's final commit carries both.
4. `/add.pull-request` output names the owed entry.
5. **`/add.hotfix` STEP 4 receives ranked index results and loads no wiki page**, and reads no source file — the call used `--no-verify`. *RED today: the skill cannot load at STEP 4 at all.*
6. `/add.brainstorm` STEP 1 runs the ranked lookup and the `about.md` deep-read; the unranked `docs/features/` sweep is gone. *RED today: the sweep is present and the skill is not loaded.*
7. Index absent → every consumer proceeds with a note; nothing errors.

### L4 — `docs-pruning` toggle combination matrix

1. **All toggle states on `add.done`** — with `docs-pruning` off, the cleanup section is absent; with it on, present exactly once; the command is coherent in both.
2. **Shared-anchor non-collision** — with `gitnexus` enabled *and* `docs-pruning` enabled, both blocks land, deterministically ordered, neither clobbering the other.
3. **Partial disable** — disabling `docs-pruning` leaves the `gitnexus` block byte-untouched, and vice versa.
4. **Order independence** — enabling `gitnexus` then `docs-pruning` produces bytes identical to the reverse order.
5. **Full round-trip** — enable both, disable both, bytes equal the pristine baseline.
6. Enabled, entry written → `discovery.md`, `tasks.md`, `epic.md`, `review-*.md` deleted; **`plan.md`, `about.md`, `design.md`, `changelog.md`, `decisions.jsonl`, `iterations.*` intact.**
7. Enabled, index write failed → nothing deleted. Enabled, `docs/` untracked → nothing deleted, notice printed. A `docs` branch → no entry, therefore no pruning.
8. Interrupt between STEP 6 and STEP 8 → `git checkout -- <paths>` restores every pruned file.

### L5 — Behavioural acceptance

1. Deliver a feature end to end through `/add.done`; `main` carries exactly one entry for it, with 1–5 items, each `find` resolving in the source.
2. Delete one of that feature's items from the source; `verify` reports `gone`; a discovery read returns the entry **labelled**, never hidden.
3. Move another item to a different file; `verify --repair` rewrites `at`; the entry reads `changed`.
4. **The `/add.pull-request` path** — branch content already on `main` via a GitHub squash merge, one new STEP 6 commit on the branch, then `done.sh --merge`: resolves cleanly, entry lands once, no duplicated diff. *If this fails, F7's direct-commit mode is the specified fallback and this test asserts the pre-check selects it.*
5. A hotfix touching a file that holds another entry's item, at a hunk not containing that item's `find` → that entry gets **no** line. A branch renaming an item's `at` file with no content change → the entry **does** get a line.
6. After pruning, `/add.hotfix` still finds `about.md`, `changelog.md` and `plan.md`; `/add.diagnose` still has `plan.md`; `/add.new` still reads `iterations.jsonl`.
7. F1–F14 all landed — checked by grep for each new file and each `<!-- uses: -->` declaration.

**RED expectations against the current tree:** L1 entirely (no script). L2.2 fails the build the moment a command names `delivered.sh` without declaring it. L2.3 has no new anchor to count. L3.1–L3.4 have no step to run; L3.5 cannot load the skill at STEP 4; L3.6 finds the sweep present. L4 entirely (no feature registered). L5.1–L5.5 have no index; L5.6 passes today and must still pass after; L5.7 finds no artefact. **GREEN = all levels pass after F1–F14.**

---

## Execution Order

`T1 → T2 → T3 → T4`, with the validation matrix written and confirmed RED before any of it.

- **T1 first** because nothing below can be reviewed against an undefined record, and F3 cannot be written against an unwritten reference.
- **T2 before T3** because the reader has nothing to read until the writer produces entries; L3's assertions need L1 green.
- **T4 last** because `docs-pruning` deletes documentation, and its second refusal — never prune when no entry was written — is only structurally satisfiable once F5 exists.
- **Three F-blocks edit `add.done.md`, and they do NOT all sit in T2.** Land **F5 → F6** in T2, then **F14** in T4 after F12 → F13, because F14 consumes F13's fragment section and cannot land before it exists. Run `node scripts/build.js` immediately after **each** of the three. The one-file, build-between-each discipline **spans T2 and T4** — it is not a T2-local rule. That file already carries `plugin:gitnexus` markers; building once at the end would report an anchor break without saying which edit caused it.

**Safe stopping points.** The framework is coherent and shippable at the end of **T1** (a script and a reference nobody calls yet — inert), and at the end of **T3** (index written and read, no pruning). It is **not** coherent mid-T2: between F5 and F7 the entry is authored but nothing commits it.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-reading the design set. For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing. **L1.6, L1.7 and L2.2 are the three most likely to be written green.**
2. **A `<!-- uses: -->` declaration omitted or pointed at the wrong target.** F5, F9, F10 and F11 each add one. The build catches a *missing* declaration hard (`build.js:1117`) — but only if the build actually ran after that F-block, which is why the order discipline matters. It does **not** catch a declaration whose prose never names the target; that is L2.2b's job.
3. **The `add-knowledge-discovery` amendment landing partially.** F9 has **three** pieces: the INDEX procedure step, the *When NOT to Use* amendment, and the *When to Use* addition for the STEP 4 entry point. Two without the third leaves the skill either self-contradictory (wiki-blind at STEPs 4–6 *and* the index loads there) or documenting F10's entry point as unreachable. Check all three, not the procedure alone.
4. **`docs-pruning` deleting more than its four files.** Confirm against L4.6's kept list, not against the umbrella's original level-2 text, which this plan deliberately narrows.
5. **The `--no-verify` flag quietly dropped from `/add.hotfix` STEP 4**, which would make the index read grep source in violation of that command's own prohibition table.

## References

- Design set: `docs/brainstorming/2026-09-07T123919-delivery-index-01-product-umbrella.md` through `-04-product-consumption.md` (documents `05`–`08` cover the internal layer and are out of scope here)
- Prior art: `0074-PLAN--autonomous-epic-convergence-001-convergence-gate.md` — the model for shipping a new script: F-blocks plus a bats suite, an L1–L4 matrix with explicit RED expectations, and the injection-surface risk treated as a first-class concern
- `scripts/build.js` — `collectNodes()` (script registration), `extractUses()` (the prose-name gate), `extractInjectionPoints()` (marker stripping)
- `cli/src/features.js`, `cli/src/injection-core.js`, `cli/src/gitignore.js`
- `framwork/.codeadd/scripts/tests/converge-gates.bats` — the bats convention this plan's F4 follows

---

## Next Steps

/add-framework--build delivery-index

Then, for the internal layer — `/add-framework--build` reaches neither `.claude/` nor `CLAUDE.md`'s policy prose:

- `/add-framework--self-plan delivery index for the internal layer -> ref: docs/brainstorming/2026-09-07T123919-delivery-index-05-internal-umbrella.md`

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation from the approved design set `2026-09-07T123919` |
| 2026-09-07 | **Reverted an incorrect edit.** An intermediate revision claimed the prose-name gate only warns, based on the section comment at `build.js:1078` ("WARN: declaration vs prose, both directions"). The code below it splits the two directions: prose-but-undeclared is `failures.push` (`:1117`, comment at `:1134` calls it "a hard gate"); only declared-but-unnamed warns (`:1142`). CLAUDE.md is correct. Global Constraints, L2.2, the risk rows and the Reviewer Handoff item are restored, with line numbers so the claim is checkable |
| 2026-09-07 | **Build design review.** Five rulings arrived from `/add-framework--build`; three approved, **two rejected as design gaps this plan should have closed**: entry-status aggregation (the build proposed "any item gone → entry gone"; corrected to ALL-gone, derived from `gone` meaning "absent from the source") and who supplies `v`/`ts` (corrected to the script, per `log-jsonl.sh:50`). Also recorded: F4 is written before F3 and the intra-T1 order is explicit; F7 needs no staging change (`done.sh:265` already covers it); `cli/tests/delivery-index.test.js` and the two generic injection suites added to Ecosystem Impact; the measured 39→40 injection baseline and the 0-warning baseline replace relative assertions |
| 2026-09-07 | Review round 2 (`ok`): Ecosystem Impact's graph row now names the new `reference` and `fragment` nodes; F9 and Reviewer Handoff item 3 now name all three pieces that must land together |
| 2026-09-07 | Review round 1 (`fix-then-ok`): F14's stage corrected — it consumes F13 and lands in T4, not T2, so the build-between-each-edit discipline spans both stages (B1). L2.5's per-provider script claim replaced — scripts have no per-provider directory (B2). F3's corpus citation split to the schema doc (A1). F5 now declares it consumes `delivered.sh verify` (A2). L2.2 extended to the new `reference` and `fragment` nodes, plus L2.4b covering F2 and F12 (A3). F9 also updates *When to Use* (N1) |
| 2026-09-07 | **Implemented** by `/add-framework--build` — F1-F14 in 12 commits (`483f7c4..d969558`), ledger at `...--ledger.md`. Two plan corrections ruled during the build: the merge pre-check needs TWO dots, not three (three-dot is merge-base relative and would make the direct-commit mode dead code on the PR route), and F13 lands before F12 (`features.test.js` asserts key->fragment with no inverse, so registry-first leaves a real test red). Changelog: `docs/changelog/2026-09-07-add-delivery-index.md` |

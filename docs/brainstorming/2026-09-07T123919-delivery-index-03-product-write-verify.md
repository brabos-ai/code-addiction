# Brainstorm: Delivery Index — Write and Verification

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **03 of 08**, subtopic 2 of `2026-09-07T123919-delivery-index-01-product-umbrella.md`
> **Consumes:** the record shape from `2026-09-07T123919-delivery-index-02-product-schema.md`, verbatim

## Discovery

- **`/add.done` step order** — `1` collect context via `done.sh`, `2` detect branch type, `3` resolve directory, `4` validate delivery, `5` promote QA evidence, `6` **generate documentation** (changelog, decisions, wiki), `7` preview *(informative only, no confirmation)*, `8` execute merge *(automatic)*.
- **STEP 6's existing commit discipline** — the command states outright that wiki edits *"stay in the working tree — do NOT commit them here. `done.sh --merge` (STEP 8) commits wiki edits together with the changelog."* A generated artefact already has a defined path from authoring to commit, and this design uses it rather than inventing a second one.
- **STEP 6 already reads the material** — it describes every HIGH-priority changed file in ~10 words and maps it to an iteration. The inputs for proposing items exist at exactly the step where the entry must be written.
- **`/add.done` is deliberately non-interactive** — STEP 7 is `INFORMATIVE ONLY (NO confirmation)` and the prohibitions table forbids asking the user to confirm the merge. Any step that blocks on a question contradicts the command's own design.
- **`qa-preflight.sh`'s output contract** — `KEY=STATUS` lines; *"Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse."* Uses `set -u` only, because `-e` would turn a probe result into an exit code.
- **`build-ledger.sh`'s one departure** — a write the filesystem refuses exits `1`, because the always-0 rule governs probe *results*, and a line that silently fails to land is the one case where exit 0 would lie.
- **`graph.js` / `build.js` separation** — the query engine never writes; the writer is a different file. Plan 0077 records this as deliberate.
- **`/add.pull-request`** — creates a real `gh` PR and its own guidance ends with *"After PR is merged on GitHub, run `/add.done` for branch cleanup."*

## Context & Motivation

The schema fixed what a line looks like. Nothing yet says who produces one, at which moment, from what material, or how a line stops being true.

Two failure modes are already visible from the umbrella and must be designed against rather than discovered later: an entry written for something that did not ship, and an entry that quietly stops matching reality. The first is solved by *when*; the second is the entire reason a verification pass exists.

## Problem / Opportunity

| Question this topic must answer | Why it cannot be deferred further |
|---|---|
| At which `/add.done` step is the entry written, and who commits it? | The umbrella's guarantee is positional — get the step wrong and the entry either misses the squash or lands without a proven merge |
| Who chooses the 3–5 items and the `words`? | The schema requires them and forbids more than five; something must produce them |
| How does a hotfix find the entry to append to? | Explicitly deferred here by the umbrella |
| When does verification run, and does it write? | An index that can go stale but is never checked is the disease with extra steps |
| What happens on the `/add.pull-request` path? | The umbrella named it as the hole and deferred the choice here |

## Proposed Solution

### 1. The write is STEP 6, and `done.sh --merge` commits it

The entry is authored at **STEP 6, alongside the changelog**, and left in the working tree. STEP 8's `done.sh --merge` commits it with everything else STEP 6 produced.

This is not a new mechanism — it is the path the wiki edits already take, stated in the command's own text. Three properties fall out for free:

- STEP 4's delivery gates have already passed, so nothing is written for a feature that failed review.
- The entry rides into the squash on the `/add.done`-only path, exactly as the umbrella requires.
- `done.sh --merge` stays the sole git owner. Nothing here stages, commits or pushes.

#### The `/add.pull-request` path, described accurately

An earlier draft of this document said the checkout "is already on `main`" there. **It is not, and it cannot be:** `/add.done` STEP 2 derives `BRANCH_TYPE` and `FEATURE_NUMBER` from `CURRENT_BRANCH` and stops with "no ID found" unless it matches `[type]/[NNNN][L]-*`. The real state is subtler and has to be stated, because it is the one place this design touches git mechanics it does not own:

- The checkout is still the feature branch, un-merged **locally**.
- `main` already carries equivalent content, applied by GitHub's squash merge as a *new* commit with a different SHA — so the branch's commits are **not ancestors of `main`**.
- STEP 6 adds one more commit to that branch.
- `done.sh --merge` then runs `git merge --squash "$CURRENT_BRANCH"`, computing from the original merge base — which means it re-applies content `main` already has, **plus** the new entry.

`done.sh` already anticipates the *fully* redundant case: FIX-14 handles an empty diff by reporting `MERGE_COMMIT=SKIPPED`. This is the *partially* redundant case — mostly-applied content plus one genuinely new commit — and it is untested territory that this design must not assume its way through.

**So it is specified as a test with a named fallback, not as a claim:**

- RED test 18 below must prove `done.sh --merge` resolves this cleanly — no conflict, no duplicated diff.
- **If it does not**, `done.sh --merge` gains a mode that commits only the index entry and changelog directly onto `main`, skipping the squash. That is the one extra commit the umbrella already budgeted for, and it keeps `done.sh --merge` the sole git owner rather than introducing a second committer.

**That mode is selected by a deterministic pre-check, never by catching a conflict.** Discovering the situation as a merge failure and retrying would be exactly the guessing this document rejects everywhere else. The check:

> `git diff main...HEAD`, excluding the paths STEP 6 authored. **Empty → the branch's content is already on `main`**, so the squash has nothing to contribute and the direct-commit mode runs. Non-empty → the normal squash.

It answers the real question — *is there anything here `main` does not already have?* — before anything is attempted.

**Only the squash-merge button needs this.** A merge-commit or rebase strategy leaves the branch's commits as ancestors of `main`, so the merge base becomes the branch tip and the later squash is trivially clean. Those settings are not overlooked; they are the case that needs no handling.

The write step itself is identical on both paths. Only the merge mechanics differ, and they belong to `done.sh`.

### 2. The agent authors the entry; the preview shows it; nobody is asked

STEP 6 already describes every HIGH-priority changed file and maps it to an iteration. The item list is derived from that material plus `tasks.md`, filtered to public surface.

**It does not ask.** `/add.done` is explicitly non-interactive — STEP 7 is informative and the prohibitions forbid a confirmation gate. Adding a blocking question here would contradict the command's design for the sake of one list.

Instead, **STEP 7's preview renders the proposed entry in full** — name, words, and every item with its `find` string. The user sees it before the merge without being stopped by it. This is honestly weaker than confirmation, and the mitigation is structural rather than procedural: a wrong entry is corrected by appending a new line, which is what the format is for. The umbrella's trade-off row should be read as "the user *sees* a 3–5 item list", not "signs off on one".

### 3. Item selection: a filter, not a judgement call

Public surface is recognisable by shape, and the rule is written so two runs over the same diff produce the same list:

| Include | Exclude |
|---|---|
| A route or endpoint path | A file that only gained an import or an export line |
| A table, collection or migration name | A config key, env var or dependency bump |
| A screen, route or exported component | An internal helper, type or private function |
| A CLI command, flag or feature name | A test file |
| A public function others call across a module boundary | Anything whose name does not appear outside its own file |

The last exclusion is the general rule the others are instances of: **if nothing outside the defining file names it, no document will cite it, and it does not belong in an index built to stop miscitation.**

When more than five survive the filter, the entry keeps the five whose `find` strings are most specific, and the preview says how many were dropped. It does not silently truncate.

### 4. `find` selection and the over-matching guard

`find` is taken from the item's own identifier — `oauth_tokens`, `/auth/google`, `LoginGoogle` — never a description.

The schema names over-matching as the top risk and leaves the threshold here. Measured **in files, not occurrences**, over the schema's corpus:

| Match count | Action |
|---|---|
| 0 files | **Refused.** Schema hard ban 3 — an anchor born broken |
| 1–5 files | Accepted silently. A definition plus its call sites |
| 6–20 files | Accepted, and the preview flags it as loosely anchored |
| > 20 files | **Refused.** Pick a more specific string |

These numbers are a declared tunable, not a discovery. They are recorded here with their reasoning so a later change is a decision rather than a drift: a real identifier appears in its definition and its callers, which is single digits in practice; a word generic enough to appear in twenty files is a word, not a name. **Tuning them requires evidence and an updated line here.**

**They are absolute counts, and that is a known limitation.** Twenty files is very generic in a fifty-file project and could be a perfectly specific identifier in a large monorepo. A fraction of the tracked corpus was considered and rejected for now: a percentage makes the threshold move under the author's feet as the project grows, so two identical anchors written a year apart get different verdicts. Absolute counts are wrong in a predictable direction, which is easier to notice and correct than a rule that is quietly right-ish everywhere. If a large monorepo produces false refusals in practice, that is the evidence the tunable was declared for.

### 5. A hotfix appends to what it touched — no question, no guessing

The umbrella deferred "how a hotfix resolves which `id` to append to". The answer needs no interaction:

> **Run `verify` first, then intersect at the `find` level, not the file level.**
>
> 1. `delivered.sh verify` (report-only) refreshes nothing but resolves each item's *current* location.
> 2. For each item, the branch matches it when the diff **touches a hunk containing that item's `find` string** — not merely when it touches the same file. **A pure rename of the item's `at` file also matches**, by path.
> 3. Every entry with at least one matched item gets a new line carrying the branch's commit.

Both steps exist to kill a specific wrong answer:

- **Without the `verify` first**, an item that has already moved carries a stale `at`. A branch touching its *new* location would intersect nothing and silently get no line — a false negative, and precisely the case the schema's `changed` status exists to surface.
- **Without the hunk-level check**, a shared file — a routes table, a schema module — makes every entry with an item in it a match, however unrelated the change. That is the schema's over-matching risk arriving through the back door.
- **Without the rename clause**, hunk-matching alone would introduce a *new* false negative that file-level matching never had: `git` reports a pure rename as `R100` with **zero hunks**, so a branch that only relocates an item's file would match nothing at all. Path and hunks are both consulted, for opposite failure modes.

If nothing matches anywhere, the branch created new surface rather than changing existing surface, so it gets **its own entry under its own `[NNNN][L]` id** — the branch's own type letter, whatever it is. The same rule covers `hotfix`, `refactor` and `chore` without a special case each. A `docs` branch touches no source surface and therefore writes nothing.

**When `tasks.md` is absent** — routine on hotfix, refactor and chore branches — items are derived from the diff plus `about.md` and the commit messages. The absence is not a failure; `tasks.md` is a convenience when it exists.

### 6. Verification reports; repair is opt-in

Two rules, and the first is inherited rather than invented:

> **A probe never mutates.** `graph.js` queries and `build.js` writes; plan 0077 records the split as deliberate, and plan 0074's whole subject is gates that grade their own work.

So `verify` **reports** `ID=STATUS` lines and exits 0. `verify --repair` is the only form that appends corrected lines, and it is never the default.

**Verification runs in two places, at two scales:**

- **On read, in memory, bounded to what is being returned.** `read` returns at most ten entries by default, so the check is bounded by that, not by the file. It runs in two tiers, which is what keeps it cheap: **one grep per item at its recorded `at`** settles the common case as `live`; only an item that fails that first grep costs the corpus-wide search needed to separate `changed` from `gone`. A healthy result set is therefore ten-to-thirty single-file greps, and the expensive search is paid only where something actually moved. Status is reported in memory; nothing is written. This is why the index cannot answer with stale confidence even if nobody ever sweeps it.
- **On demand, over everything.** `verify --repair` after a merge, while git is already in hand, is the cheap moment; `/add.done` offers it as a one-line suggestion. There is no schedule and no daemon: a scheduled checker is one more thing that can be stale, and the read-time check already covers the case that matters.

### 7. One script, three modes

`framwork/.codeadd/scripts/delivered.sh`, following `done.sh`'s mode-switched precedent rather than adding three files to a 17-script directory.

| Mode | Writes? | Output | Exit |
|---|---|---|---|
| `write` | yes | `ENTRY=<id>`, `CREATED=<true\|false>`, `LINES=<n>` | 0; **1** if the filesystem refuses the write; 2 on misuse |
| `read` | never | matching entries, one per line, latest-wins already applied | 0 always; 2 on misuse |
| `verify` | only with `--repair` | `<id>=<status>` per entry, plus `REPAIRED=<n>` | 0 always; **1** if `--repair` cannot write; 2 on misuse |

**Invocation, which a builder cannot invent:**

| Mode | Call |
|---|---|
| `write` | `delivered.sh write < record.json` — **the record arrives on stdin as one JSON object** matching the schema |
| `read` | `delivered.sh read <query> [--layer product\|internal] [--limit N] [--no-verify]` — `<query>` is free text matched against `name`, `words`, `id`, and each item's `what` and `find`. Default limit **10** |

**`--no-verify` returns stored statuses and touches no source file.** It exists for one real caller: `/add.hotfix` STEP 4, whose own prohibition table forbids grepping code before the history agents are dispatched. A verifying read there would break that rule, so triage gets the stored status — which is whatever the last `verify` established, not a guess — and the verifying read happens later, at fix time. Any consumer under a similar no-code-access constraint uses the same flag rather than an exemption.
| `verify` | `delivered.sh verify [<id>] [--repair]` — no id means every entry |

**`read` output is pre-sorted by the script, not by its callers.** `live` → `changed` → `superseded` → `gone`, with latest-wins already applied. Ordering belongs to the read contract for plan 0075's reason: several consumers each sorting a shared structure is how two of them come to disagree. The consuming skill renders what it receives; it does not re-rank.

**A record that violates a hard ban exits 2, printing `REFUSED=<ban>`.** The schema is part of this interface, so passing a record the format forbids is caller error in the same sense a bad mode is — it needs no fourth exit code, and inventing one would mean explaining a code the rest of the script family does not have. What it does need is a machine-readable reason, hence `REFUSED=`. The three-code doctrine is unchanged: **0** probe results, **1** a write the filesystem refused, **2** the caller passed something wrong — a bad mode, bad arguments, or a record that breaks a hard ban.

**Why `write` takes stdin rather than positional arguments.** `build-ledger.sh`'s `<LEDGER_FILE> <LINE>` shape works because its payload is one opaque string. A delivery record carries a nested array of 1–5 items with three fields each — a dozen values *with structure*. Flattening that into positional arguments would invent a second serialisation of a format that already has one. The record is passed as the JSON it already is, and the script validates it against the schema's hard bans before appending.

`set -u` only, never `-e` — `-e` would turn a probe result into an exit code, which is `qa-preflight.sh`'s stated reason. The exit-1-on-refused-write departure is `build-ledger.sh`'s, for its stated reason.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Write the entry at STEP 8, inside `done.sh --merge`** | Puts authoring judgement inside the one script that owns git. STEP 6 already exists for generated documentation and already has the material |
| **Block at STEP 7 for confirmation of the item list** | Contradicts `/add.done`'s own prohibition on confirmation gates. The correction path — append a line — is cheaper than a gate on every delivery |
| **Ask the user which entry a hotfix belongs to** | Same contradiction, and the diff already answers it deterministically |
| **A scheduled or CI verification sweep** | A checker that runs on a timer is one more thing that can be stale, and it cannot help the read that happens between sweeps. Read-time verification covers the case that matters and costs a few greps |
| **Verify-and-repair as the default** | A probe that mutates is exactly what plans 0074 and 0077 forbid. Repair stays explicit |
| **Three separate scripts** | 17 scripts is already a lot to hold. `done.sh` and `qa-evidence.sh` both establish mode switching |

## Type of Artefact

Architecture — one new script, edits to two `/add.done` steps, one line added to `/add.pull-request`.

## Scope

### Includes

- The write's position in `/add.done` and its commit path
- Item selection rules and the five-item overflow behaviour
- `find` selection and the over-matching thresholds, with their reasoning
- Hotfix / refactor / chore / docs branch resolution
- Verification: what runs on read, what runs on demand, and what may write
- `delivered.sh` and its three modes, output keys and exit codes
- The `/add.pull-request` notice
- The RED test matrix

### Does NOT Include

- The record shape — schema subtopic, consumed verbatim
- Which commands read the index and where — consumption subtopic
- The `docs-pruning` feature — consumption subtopic
- The internal layer's write trigger — the internal umbrella's `done-command` subtopic
- Backfill of features delivered before this exists

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **Write at STEP 6; `done.sh --merge` commits it** | The path generated documentation already takes, stated in the command's own text. STEP 4's gates have passed, the entry rides the squash, and `done.sh --merge` stays the sole git owner | ✅ |
| **One write step serves both delivery paths; the merge mechanics differ and belong to `done.sh`** | The checkout is a feature branch on both paths — `/add.done` STEP 2 requires it. What differs is that `main` already carries equivalent content on the PR path, making the squash *partially* redundant, which `done.sh`'s FIX-14 does not cover. Specified as RED test 18 with a named fallback rather than assumed | ✅ |
| **The agent authors; STEP 7 previews; nobody is asked** | `/add.done` explicitly forbids confirmation gates. A blocking question for one list would contradict the command's design; append-a-line is the cheaper correction | ✅ |
| **Item selection is a shape filter, not a judgement** | Two runs over one diff must produce one list. The general rule — nothing outside the defining file names it, so no document will cite it — makes the specific rows derivable rather than arbitrary | ✅ |
| **Overflow keeps the five most specific and says how many were dropped** | Silent truncation would hide exactly the information the user needs to notice the feature was too big | ✅ |
| **Over-matching thresholds: refuse 0, accept ≤5, flag 6–20, refuse >20 — measured in files** | A real identifier appears in its definition and its callers. A string in twenty files is a word, not a name. Declared as tunable, so a change is a decision, not drift | ✅ |
| **Hotfix routing runs `verify` first, then matches at the `find` level, not the file level** | Two wrong answers avoided. A stale `at` would make a branch touching the item's new location match nothing; a file-level match would attribute every change in a shared routes or schema file to every entry with an item in it. Matching the hunk that contains the `find` string is the same specificity the verification already uses | ✅ |
| **No match anywhere means a new entry under the branch's own `[NNNN][L]`** | Covers hotfix, refactor and chore with one rule and no per-type special case. A `docs` branch touches no surface and writes nothing | ✅ |
| **`tasks.md` is a convenience, not a precondition** | Hotfix, refactor and chore branches routinely have none. Items fall back to the diff plus `about.md` and commit messages | ✅ |
| **`write` takes the record on stdin as JSON** | The record has nested structure — 1–5 items of three fields. Positional arguments would invent a second serialisation of a format that already has one | ✅ |
| **`read` caps at ten, verifies in two tiers, and sorts by status itself** | One grep per item settles the common `live` case; only a failed first grep costs the corpus search. Ordering belongs to the read contract, not to callers — several consumers each sorting one shared structure is how two of them come to disagree (plan 0075) | ✅ |
| **A hard-ban violation exits 2 with `REFUSED=<ban>`** | The schema is part of the interface, so a forbidden record is caller error in the same sense a bad mode is. A fourth exit code would be one the rest of the script family does not have; the reason belongs in the output, not in a new code | ✅ |
| **The PR-path fallback is chosen by a pre-check, never by catching a conflict** | Discovering it as a merge failure and retrying is the guessing this document rejects everywhere else. `git diff main...HEAD` minus STEP-6 paths answers it before anything is attempted | ✅ |
| **Hotfix routing consults both hunks and paths** | Hunks alone miss a pure rename (`R100`, zero hunks); paths alone over-attribute in shared files. The two clauses exist for opposite failure modes | ✅ |
| **Verification reports; `--repair` is the only writer, never default** | Plan 0077's query/write split and plan 0074's rule against self-grading gates. A probe that mutates is the failure both were written about | ✅ |
| **Read-time verification, bounded to the entries returned** | Makes stale confidence structurally impossible without a scheduler. Costs a handful of greps for the three-to-ten entries actually being returned | ✅ |
| **No schedule, no daemon** | A timed checker is one more thing that can be stale and cannot help the read between sweeps | ✅ |
| **One script, three modes** | `done.sh` and `qa-evidence.sh` both do this, and the script directory is already large | ✅ |
| **`/add.pull-request` gains a notice, not a new policy** | It already tells users to run `/add.done` afterwards. One sentence saying an entry is owed is the smallest change that closes the umbrella's fifth-state hole | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `/add.done` STEP 6 | Authors the entry beside the changelog | Add a sub-step; do not commit here |
| `/add.done` STEP 7 | Preview renders the proposed entry in full | Extend the preview |
| `done.sh --merge` | Commits one more generated file | None — it already commits STEP 6's output |
| `/add.pull-request` | Gains one line: an index entry is owed, `/add.done` writes it | Add the sentence next to the existing post-merge guidance |
| `framwork/.codeadd/scripts/delivered.sh` | New | Create with three modes |
| `provider-map.json` | Scripts are not registered per provider, but the artefact graph gates unregistered artefacts | Verify against the graph's rules when building |
| `add-doc-schemas` | The write must satisfy the schema reference | None here — schema subtopic owns it |
| `cli/tests/` | Script contract needs coverage | Add the RED matrix below |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| The entry cannot exist without a passed gate and a merge | Authoring quality rests on an agent's filter, not a human's sign-off |
| One write path for both delivery routes | The PR path pays one extra commit |
| An index that self-checks at the moment of use | A few greps on every discovery read |
| Deterministic hotfix routing with no question | An entry can accumulate lines from many branches |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The agent authors weak items under end-of-feature fatigue and nobody notices, because nobody is asked | **High** | The honest cost of a non-interactive command. STEP 7's full preview is the visibility; the append-a-line correction is the remedy. Revisit only with evidence of real damage — a confirmation gate contradicts `/add.done` and should not be added casually |
| The over-match thresholds are wrong and either refuse good anchors or admit generic ones | Med | Both directions are visible: a refusal is loud at write time, a loose anchor is flagged in the preview. The numbers are declared tunable with their reasoning recorded |
| Read-time verification makes discovery noticeably slower | Low | Bounded to the entries actually returned, not the file. If it ever bites, the bound is the lever, not the removal |
| `--repair` is wired into an automated flow and starts mutating silently | Med | Never the default, and the mode table says so. `/add.done` may only *suggest* it |
| The `/add.pull-request` notice is ignored and the fifth state persists | Med | Accepted and already recorded in the umbrella. A notice is the smallest honest fix; forcing `/add.done` is a policy change nobody asked for |

## RED Test Matrix

Every row must fail before the implementation exists — the discovery report's distinction between a mechanical gate and a judgement gate:

| # | Setup | Expected |
|---|---|---|
| 1 | Delete an artefact; leave a stale copy in a gitignored directory | `gone` — not `live`, not `changed` |
| 2 | Create a source file, do not commit it, anchor an item into it | `live` — an uncommitted file is not garbage |
| 3 | `find` containing a space or a newline | Refused at write |
| 4 | `find` absent from the corpus at write time | Refused at write |
| 5 | `find` matching in more than 20 files | Refused at write |
| 6 | An entry with six items | Refused at write |
| 7 | An item anchored into `docs/` | Refused at write |
| 8 | `find` absent from `at`, present in exactly one other file | `changed`, and `--repair` rewrites `at` to it |
| 9 | `find` absent from `at`, present in three other files | `changed`, and `at` is **unchanged** even with `--repair` |
| 10 | Two lines for one `id` | `read` returns only the later one |
| 11 | A corrupt line mid-file | Skipped, reported by number, other entries still returned |
| 12 | `verify` without `--repair` on a drifted index | Reports statuses; file is byte-identical afterwards |
| 13 | A hotfix touching a file listed in two entries' items | Both entries gain a line |
| 14 | A hotfix touching nothing in any entry | A new entry under the hotfix's own id |
| 15 | A `docs` branch | Nothing written |
| 16 | `delivered.sh` with a bad mode | Exit 2 |
| 17 | `write` into a read-only filesystem | Exit 1, never 0 |
| 18 | **The `/add.pull-request` path**: branch content already on `main` via a GitHub squash merge, then one new STEP 6 commit on the branch, then `done.sh --merge` | Resolves cleanly — no conflict, no duplicated diff, entry lands once. **If this fails, the fallback in §1 applies** |
| 19 | A branch touching a file that holds another entry's item, at a hunk not containing that item's `find` | That entry gets **no** line |
| 20 | A branch touching an item whose recorded `at` is stale, at the item's current location | The entry **does** get a line — `verify` ran first |
| 21 | A hotfix branch with no `tasks.md` | Items derived from diff + `about.md` + commit messages; write succeeds |
| 22 | `read` matching more than ten entries | Ten returned, **pre-sorted `live` → `changed` → `superseded` → `gone` by the script**; the cap is visible in the output |
| 23 | A branch that renames an item's `at` file with **no content change** (`R100`, zero hunks) | The entry gets a line — the rename matches by path |
| 24 | Each of the schema's hard bans, one per run | Exit **2** with `REFUSED=<ban>` naming which one |
| 25 | The PR path where `git diff main...HEAD` minus STEP-6 paths is empty | Direct-commit mode selected **before** any merge is attempted |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```

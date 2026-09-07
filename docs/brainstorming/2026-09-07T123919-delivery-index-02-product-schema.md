# Brainstorm: Delivery Index — Schema and Entry Identity

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **02 of 08**, subtopic 1 of `2026-09-07T123919-delivery-index-01-product-umbrella.md`
> **Owns:** the index format for **both layers**. The internal umbrella consumes this verbatim and records only deltas.

## Discovery

- **`add-doc-schemas/references/receipt.md`** — the closest existing precedent: a machine-readable record with a stable id, an `owner` field marking which paths a command solely owns, and an append-only Decision Log. Establishes that a hash on a *shared* file reports drift on every healthy project — the single most important constraint on this design.
- **`framwork/.codeadd/injection-points.json`** — the framework's only existing **content anchor**: `{text, ordinal, position, next}` locates a spot in a file by adjacent prose plus a drift hint, deliberately *not* by line number or file hash. This schema's item anchor is the same idea, narrowed.
- **`build-ledger.sh`** — append-only doctrine, stated in the script itself: *"IT IS A LOG, NOT A SET: the same line twice appends twice."* De-duplicating would erase round 1 followed by round 2.
- **`log-jsonl.sh`** — the established JSONL writer. Every line it emits carries `ts`, `agent`, `type`, then caller fields. Proof that a *log* in this framework carries time.
- **The three build-emitted sidecars** (`contracts.json`, `injection-points.json`, `artefact-graph.json`) — all `{version: 1, …}`, deterministically sorted, **no timestamp**, so two builds diff byte-identically. This index deliberately does *not* follow that pattern; see Key Decisions.
- **`artefact-graph.json` node identity** — `<layer>/<kind>/<name>`, layer-scoped *because* `add-commit` exists in both layers. Any id that must join across layers carries its layer.
- **`add-id-convention`** — `[NNNN][L]`, the id every ADD project already allocates for features, hotfixes, refactors, chores and docs. Consumed by `next-id.sh`, `get-branch-metadata.sh`, `build-setup.sh` and `done.sh`.
- **`add-token-efficiency`** — JSON is data and ships minified; Markdown is instructions.
- **`cli/src/gitignore.js`** — `getInstalledDirs()` **always** includes `.codeadd/` in the block written into the user's `.gitignore`. Settles the file's location by elimination: framework-installed directories are untracked in user projects, and the umbrella requires this file to be tracked.

## Context & Motivation

The umbrella settled *what* the index is for and *when* it is written. It deliberately left *what an entry actually looks like* to this topic, because the other two subtopics are guesswork without it: a write step cannot be specified against an undefined record, and a consumption step cannot promise an answer whose shape nobody has fixed.

Two constraints from the umbrella govern everything below and are not reopened here:

- **It is a discovery index, not a code map.** Every field must earn its place by answering *"have we built something like this, and can I still cite it?"*
- **It must be lean.** The owner named this as a design rule, not a preference: an index that grows a line per touched file is an index nobody reads, which is the failure being fixed.

## Problem / Opportunity

The framework has never had to solve the specific problem this schema poses, and the discovery scan says so directly: **there is no unified scheme for a stable anchor into source.** What exists is adjacent but wrong-shaped:

| Existing mechanism | Why it does not transfer |
|---|---|
| `contracts.json` **shape hash** | Hashes a block the command solely owns. An index item points at a *source* file that many features touch over time; a file hash would report drift on every healthy project — exactly the failure the receipt's `owner` field exists to prevent |
| `injection-points.json` **content anchor** | Right idea, wrong target: it locates a spot to *insert* text, needs `ordinal`/`position`/`next`, and fails loud when the anchor line is rewritten. An index item needs to answer "does this still exist and where", and must survive rewriting |
| `path:line` **evidence refs** (plan 0073) | Line numbers rot on the first edit above them |

The opportunity is that a much weaker anchor is sufficient. The index does not need to find a *place*; it needs to confirm a *thing exists*. That is a substring search, and a substring survives reformatting, reordering, and moving to another file.

## Proposed Solution

### The file

`docs/delivered.jsonl`, tracked in git, flat directly under `docs/`. One JSON object per line, minified, UTF-8, LF.

Location is settled by elimination rather than taste: `.codeadd/` is always gitignored by the installer, and the umbrella requires the index to survive a fresh clone.

### One record type, and every line is complete

There is a single record shape. **Any line is a full snapshot of an entry; a later line for the same `id` supersedes every earlier one.**

This is the pivot of the design, and it is chosen against the more obvious delta-log:

> If a status change were written as a *delta* line, a `grep` for "google" would return the original entry and the reader would never see that the thing is now `gone` — the index would answer discovery questions with stale confidence. That is the exact failure being fixed, reproduced by the storage format. Full snapshots cost duplication on the rare lines that change, and make **every** line independently trustworthy.

### The record

```
{"v":1,"ts":"2026-09-07T12:39:19Z","id":"0042F","layer":"product","by":"done","status":"live","name":"login com Google","words":"login google oauth token social sso conta","commits":["a1b2c3d"],"origin":"docs/features/0042F-login-google/","items":[{"what":"POST /auth/google","at":"src/auth/google.ts","find":"/auth/google"},{"what":"tabela oauth_tokens","at":"db/migrations/0042.sql","find":"oauth_tokens"},{"what":"botão LoginGoogle","at":"ui/Login.tsx","find":"LoginGoogle"}]}
```

| Field | Required | Meaning |
|---|---|---|
| `v` | yes | Schema version, **on every line**, not in a header |
| `ts` | yes | UTC ISO-8601, second precision — same format `log-jsonl.sh` already emits |
| `id` | yes | The entry's identity. Product: the `[NNNN][L]` id the project already allocated. Internal: **the plan file's basename without extension**, verbatim — not a slug, not a number. CLAUDE.md documents two coexisting plan-naming schemes resolvable by unique slug substring; a substring is a *lookup* convenience and would let two lines for one plan carry different `id` values, silently breaking last-line-wins |
| `layer` | yes | `product` \| `internal` — one schema, two layers, following the artefact graph's layer-scoped identity rule |
| `by` | yes | `done` \| `verify` \| `human` — who wrote this line. Makes "a machine repaired this" distinguishable from "a person declared this" |
| `status` | yes | `live` \| `changed` \| `gone` \| `superseded` |
| `name` | yes | Human label, in whatever language the project writes docs in |
| `words` | yes | Free-text search surface — the words someone would actually type. `0042F` finds nothing; `login google oauth` finds it |
| `commits` | yes, ≥1 | Short hashes. Where to go look, never an explanation |
| `origin` | yes | The feature directory or plan path this came from. Survives level-2 pruning, which keeps the directory |
| `items` | yes, 1–5 | What was delivered |
| `superseded_by` | only when `status` is `superseded` | The `id` that replaced this one |
| `node` | optional, internal only | The `artefact-graph.json` node id, for the join the internal umbrella describes |

### The item anchor — the part that is genuinely new

Each item is `{what, at, find}`:

- **`what`** — the human name of the delivered thing (`POST /auth/google`)
- **`at`** — the file it was in when recorded. **A hint, not the identity**
- **`find`** — a literal substring that must still be present in the source if the thing still exists

`find` is the whole mechanism. It is not a hash, not a line number, and not a structural query. It survives reformatting, reordering, refactoring and moving between files — the four things that break every alternative the framework already has.

**That survival is conditional on its shape, so the shape is a rule, not a suggestion:**

- **One contiguous token. No spaces, no line breaks.** A multi-word `find` is exactly what a formatter wraps, and a wrapped string silently flips a live item to `gone`. `oauth_tokens` and `/auth/google` qualify; `POST /auth/google` does not — that belongs in `what`.
- **Byte-exact and case-sensitive.** Case-insensitive matching doubles the over-matching risk for no benefit, and every anchor here names a real identifier that already has a fixed casing.
- **As close as possible to the thing's own name.** A fragment that could belong to anything else is the failure mode named in the risk table.

### The four statuses, and how each is decided

| Status | Decided by | Rule |
|---|---|---|
| `live` | script | `find` is present in the file named by `at` |
| `changed` | script | `find` is **not** at `at`, but exists elsewhere in the source. The thing lives; the recorded pointer was wrong |
| `gone` | script | `find` appears nowhere in the source |
| `superseded` | human | Declared, and only ever declared. Carries `superseded_by` |

Three of the four are script-provable, satisfying plan 0074's rule. The fourth is the one the umbrella already established cannot be derived.

**The index repairs its own pointers.** When the verification pass resolves a `changed` item, it writes a new full line with `at` updated to where the thing actually is. So `changed` does not mean "something is broken here" — it means **"a pointer was just repaired, and documentation elsewhere probably still points at the old path."** For an index built to stop miscitation, that is the most useful signal it can emit.

**`changed` means moved, not modified.** A status meaning "this file was edited since we recorded it" would be permanently true for every actively-developed file, and a status that is always on carries no information — the umbrella's own risk table names being learned into noise as the failure mode to avoid. Modification history is what `git log` and `gitnexus` are for, and both are better at it.

#### What the search may look at

One rule, and it must be stated precisely because getting it wrong makes the mechanism produce the exact false answer it exists to prevent:

> **The corpus is every file git does not ignore, minus `docs/`, minus the index itself.** Never a raw filesystem walk, and — equally — never restricted to committed files.

The scoping key is **`.gitignore`, not commit status**. Concretely: `git ls-files --cached --others --exclude-standard`, which returns tracked files *plus* files that exist but have never been committed, excluding only what the project's ignore rules exclude.

Both halves of that are load-bearing, and getting either wrong breaks the mechanism in opposite directions:

- **Not a filesystem walk.** A walk finds build output, `node_modules`, and — the case that matters — **stale local copies of deleted artefacts**. This repo is the proof: `framwork/.gitignore` ignores `.claude/`, `.cursor/` and `.opencode/`, yet three copies of the deleted `add-doc-reviewer` skill still sit in the working tree as leftovers from build and install testing. A walk would find them and report a deleted artefact as `live` or `changed`, never `gone` — failing on the very example the internal umbrella is built around. Honouring `.gitignore` excludes all of it with one rule instead of a directory list that rots, and in a user's project it inherits the installer's ignore block for free, so `.codeadd/` and every provider directory drop out without being named.
- **Not "tracked only" either.** *A file that is merely uncommitted is not garbage.* A source file created an hour ago and not yet committed is real work, and an anchor that legitimately resolves there must resolve. Restricting the corpus to `git ls-files` would report it `gone` — inventing the same false answer the walk invents, from the opposite direction. The project already said what it considers noise, in its `.gitignore`; the index takes that statement at face value and adds nothing of its own.
- **Minus `docs/` and the index.** A `find` string quoted in the documentation being audited would otherwise keep its own item `live` forever — the index validating itself from its own citations. This subtraction is total: **an item may never anchor into `docs/` at all.** An item is delivered surface, and documentation is not surface — so there is no case where `at` legitimately points there, and no exemption is needed for the direct at-file check.

**Taking `.gitignore` at face value has one real exception.** A project may deliberately ignore something that *is* genuine cited surface — a generated API client, regenerated by a build step but still the thing a document names. An item anchored there would resolve to a permanent false `gone`: this design's failure, running backwards. The corpus rule does not bend for it. Instead, **the write step rejects a `find` whose `at` the project ignores**, so the item is refused loudly at authoring time rather than lying quietly forever. A project in that position anchors on something not ignored — the spec the client is generated *from*, typically — which is the more stable anchor anyway.

**Hard ban 3's write-time check uses this identical corpus.** A different scope at write time than at verify time means an item can be born `live` and immediately verify as `gone`.

#### When `find` matches in more than one place

The repair rule presupposes a single answer, and often there is not one:

- `find` at `at`, and also elsewhere → **`live`**. The recorded location is still correct; other matches are irrelevant.
- `find` not at `at`, exactly one match elsewhere → **`changed`**, and `at` is repaired to that match.
- `find` not at `at`, more than one match elsewhere → **`changed`, and `at` is left exactly as recorded.** No automatic repair without a unique match: repointing at the wrong file is worse than an admittedly stale pointer, because a wrong pointer looks freshly verified.

An entry can therefore sit at `changed` indefinitely when a thing moved *and* was duplicated. That is accepted: the status is still true and still actionable. The schema deliberately carries **no field for candidate matches or an ambiguity flag** — adding one would put a code-navigation concern into a discovery index, which the umbrella put out of scope. A human resolves it by editing `find` to something unique, which is a new line like any other correction.

### Reading rules

1. Parse line by line. A line that fails to parse is **skipped and reported by number**, never fatal. An index that refuses to answer because one line is corrupt is worse than one that answers about the rest and says so.
2. Group by `id`. The **last** line wins.
3. **Dead entries are returned, never filtered.** `gone` and `superseded` results are the answer to *"did we try this before?"* — hiding them would repeat the original failure with the sign flipped. A consumer may rank them lower; it may not drop them.

### Hard bans

Following the discovery report's finding that a schema without explicit bans accumulates exceptions in prose:

1. **No line without all required fields.** Absence is never inferred as a default.
2. **No entry with zero commits.** An entry with no commit cannot be traced and cannot have been written after a proven merge.
3. **No `find` string that is absent from the source at write time**, checked against the same corpus the verification uses. Writing an already-broken anchor makes the item permanently `gone` and silently poisons the index.
4. **No `find` containing whitespace or a line break.** A wrapped anchor turns a live item into a false `gone` the next time a formatter runs.
5. **No more than 5 items.** Enforced, not advised — this is where "lean" is mechanically defended. A delivery that genuinely needs more was two deliveries.
6. **Never rewrite or delete a line.** Corrections are new lines.
7. **No `status` outside the four values**, and no `superseded` without `superseded_by`.
8. **The anchor check honours `.gitignore` — neither a filesystem walk nor a tracked-files-only scan.** The `live`/`changed`/`gone` resolution, and its write-time counterpart in ban 3, run over every file the project does not ignore, committed or not. A walk reports deleted things alive; a tracked-only scan reports uncommitted work dead. This binds the anchor check specifically and says nothing about unrelated searches a consumer may perform.
9. **No item anchored into `docs/`, or into a path the project ignores.** Both produce an item that can never verify honestly — the first always `live`, the second always `gone`. Rejected at write time.

Every one of these is a string or count check, testable RED before anything depends on it — the discovery report's distinction between a mechanical gate and a judgement gate.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Delta lines instead of full snapshots** | Smaller file, but a `grep` returns the original entry without its current status. The format itself would answer discovery questions with stale confidence |
| **A content hash per item** (`contracts.json`'s `shape`) | The receipt schema already learned this: a hash over a file many features touch reports drift on every healthy project. That is why the receipt hashes only `owner: setup` paths |
| **A `{version, entries[]}` envelope like the sidecars** | Sidecars are build-emitted and rewritten wholesale; this file is appended to over years and must tolerate a crash mid-write. An envelope requires rewriting the whole file to add one entry |
| **Line numbers or `path:line` anchors** | Rot on the first edit above them |
| **A structural query (AST, symbol lookup)** | Requires a language-aware toolchain per project. That is `gitnexus`, it is optional, and the umbrella put it out of scope |
| **Separate schemas per layer** | The umbrella's stated reason stands: two schemas become two incompatible indexes within a release |

## Type of Artefact

Architecture — a schema plus its reference document. No executable is specified here; the scripts belong to the write-verify subtopic.

## Scope

### Includes

- The record shape, every field, and which are required
- Entry identity, and its relationship to `[NNNN][L]` and to artefact-graph node ids
- The `{what, at, find}` item anchor and why it is a substring
- Exact decision rules for the four statuses, the search corpus, and the multi-match tie-break
- The required shape of a `find` string
- Reading rules: last-line-wins, corrupt-line tolerance, and the ban on filtering dead entries
- The nine hard bans
- Schema versioning, and the layer deltas the internal umbrella consumes
- Where the schema is documented: a new `add-doc-schemas/references/delivery-index.md`

### Does NOT Include

- Who writes a line and at which step of `/add.done` — write-verify subtopic
- How `find` strings and `words` are proposed at authoring time — write-verify subtopic
- How a hotfix resolves which `id` to append to — write-verify subtopic, per the umbrella
- The reader's CLI surface and which commands call it — consumption subtopic
- Any migration for indexes written under a future `v: 2` — no `v: 1` data exists yet
- Per-item status. Status is entry-level; item detail lives in the `at` values a repair updates

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **Every line is a complete snapshot; last line for an `id` wins** | A delta log makes `grep` return an entry without its current status — the format itself would cause the stale citation this design exists to prevent | ✅ |
| **Item anchor is a literal substring (`find`), not a hash and not a line** | The only anchor that survives reformatting, reordering, refactoring and file moves. A file hash was rejected for the receipt schema's own recorded reason: drift on every healthy project | ✅ |
| **`at` is a hint; `find` is the identity** | Answers the topic's stated requirement — identity stable across renames — without any rename-tracking machinery | ✅ |
| **`changed` means *moved*, not *modified*** | "Edited since recorded" is permanently true for active files, and an always-on status carries no information. Modification history is `git log`'s job | ✅ |
| **A repair rewrites `at` and records `changed`** | Turns the status into the actionable signal: documentation elsewhere still points at the old path | ✅ |
| **`v` on every line, no header line** | A log accumulates lines across schema versions; a single header cannot say which version a given line was written under. This deviates from the sidecars' envelope deliberately | ✅ |
| **The file carries `ts`, unlike the sidecars** | Sidecars omit timestamps so two builds diff byte-identically. This is not build output — it is a log, and `log-jsonl.sh` establishes that logs here carry time | ✅ |
| **Location `docs/delivered.jsonl`** | Settled by elimination, and this half applies to every user project: `cli/src/gitignore.js`'s `getInstalledDirs()` always ignores `.codeadd/`, while the umbrella requires the index to survive a fresh clone — so it cannot live in framework-installed state. *Separately, and only inside code-addiction's own repo:* keeping it flat under `docs/` means the internal index needs a single `!docs/delivered.jsonl` negation against `docs/*`, not the directory chain `.opencode/` requires | ✅ |
| **The search corpus is scoped by `.gitignore`, not by commit status** | Two opposite failures, one rule. A filesystem walk finds build output and stale local copies of deleted artefacts — this repo has three such copies of a deleted skill in the working tree right now, and a walk would report it alive, failing on the internal umbrella's flagship example. A tracked-files-only scan fails the other way: **an uncommitted file is not garbage**, and an anchor resolving into work created an hour ago would be reported `gone`. The project already declared what it considers noise; the index adds nothing to that declaration. In a user's project it inherits the installer's ignore block for free | ✅ |
| **No automatic repair without a unique match** | Repointing `at` at the wrong file is worse than leaving a stale pointer, because a wrong pointer looks freshly verified | ✅ |
| **`find` is one contiguous token, byte-exact, case-sensitive** | A multi-word anchor is what a formatter wraps, and a wrapped anchor becomes a false `gone`. Case-insensitivity would only widen over-matching, the top risk | ✅ |
| **1–5 items, enforced** | The place where "lean" stops being a preference and becomes a check. A delivery needing more was two deliveries | ✅ |
| **The verification search excludes `docs/` and the index itself** | Otherwise a `find` string quoted in the documentation being audited keeps its own item `live` forever — the index validating itself from its own citations | ✅ |
| **Dead entries are returned, never filtered** | *"Did we try this before?"* is the primary question. Hiding `gone` and `superseded` repeats the original failure inverted | ✅ |
| **One schema, `layer` field, `node` optional for internal** | The umbrella's single-owner rule, made concrete with the artefact graph's layer-scoped identity convention | ✅ |
| **A corrupt line is skipped and reported, never fatal** | A discovery aid that refuses to answer is worse than one that answers partially and says so | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add-doc-schemas` | Gains a **format reference**, not a doc schema | Create `references/delivery-index.md` documenting the JSONL record only. It gets **no** YAML frontmatter template, no `id:` under the skill's ID convention, no TL;DR, no depth floors and no Decision Log — every other reference there describes a markdown document an agent authors, and this describes a minified machine log. Register it in `SKILL.md` under a heading that says so, so a builder does not force it into the `receipt.md` template |
| `docs/delivered.jsonl` | New tracked file in the user's project | Created on first write, never scaffolded empty |
| `add-id-convention` | The entry `id` is the id it already defines | None — this schema consumes it |
| `artefact-graph.json` | Joined by the optional internal-only `node` field, one direction only | None |
| `contracts.json` / `add.qa-setup` | Neither materializes this file, so no `## Materializes` contract entry is owed | None — recorded so a reader does not look for one |
| `.gitignore` (user project) | The installer's ADD block must not swallow `docs/` | None today — the block lists only installed directories. Recorded as a constraint on any future block change |
| Write script, verify script, reader | All three consume this schema | Specified in write-verify and consumption subtopics |
| Internal layer | Consumes this schema verbatim; deltas are `layer: "internal"`, a plan id, and the optional `node` | Recorded in the internal umbrella's entry-join subtopic |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Every line is independently trustworthy — a naive grep plus "take the last match" is already correct | Duplication on the rare lines that change |
| An anchor that survives the four most common refactors | Certainty: a substring can be coincidentally present |
| Identity that needs no rename tracking | `find` must be chosen well, and a bad choice is silent until verification |
| A status that means something actionable | No answer to "was this modified?" — deliberately delegated |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A `find` string is too generic (`login`, `user`) and every item reports `live` forever | **High** | The most likely way this schema fails in practice. Hard ban 3 catches only *absent* strings, not over-matching ones. The write step must reject a `find` matching implausibly many places — the threshold belongs to write-verify, but the requirement is recorded here |
| The search is implemented as a filesystem walk and finds a deleted thing in build output or a stale local copy, reporting it alive | **High** | The single most likely implementation slip, and it fails on the internal umbrella's own motivating example. Hard ban 8 exists for exactly this; the write-verify subtopic must prove it RED — delete an artefact, leave a stale copy on disk, assert `gone` |
| The search is implemented as `git ls-files` and reports uncommitted work as `gone` — the same slip, mirrored | Med | The tempting simplification, because `git ls-files` is the shorter command. Ban 8 forbids it explicitly, and its RED test is the mirror of the one above: create a source file, do not commit it, assert the anchor resolves `live` |
| A `find` string is coincidentally present after the thing is deleted, so `gone` never fires | Med | Same lever: specificity at write time. Prefer a string carrying the thing's own name over a generic fragment |
| The file grows unbounded over years | Low | One line per delivery plus rare repairs. A thousand deliveries is well inside grep and `JSON.parse`-per-line range; revisit only with evidence |
| Full-snapshot lines make a stale line look authoritative to a careless reader | Med | Reading rule 2 is the answer, and it must be implemented in the shared reader rather than reinvented per consumer — the coherence lesson from plan 0075 |
| `v: 2` arrives and old lines cannot be read | Low | `v` is per line, so a reader dispatches per line. No migration is possible to get wrong because no `v: 1` data exists yet |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```

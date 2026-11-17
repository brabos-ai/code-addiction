# Delivery Index — Record Format

**This is a format reference, not a doc schema.** Every other file under `references/` describes a Markdown
document an agent authors, with frontmatter, depth floors and a Decision Log. This one describes a
**minified machine log**: `.codeadd/docs/delivered.jsonl`, one JSON object per line, written by
`.codeadd/scripts/delivered.cjs` and read by `add--knowledge-discovery`. It has no frontmatter template, no
`id:` under the skill's ID convention, no TL;DR, no depth floors and no Decision Log, because none of those
apply to a log a script appends to.

Nothing here is authored by hand in normal operation. A human writes a line only to declare `superseded`,
which no script can derive.

## The file

`.codeadd/docs/delivered.jsonl` — tracked on the `codeadd-docs` branch, flat directly under `.codeadd/docs/`, UTF-8, LF, one minified JSON object
per line.

The location is settled by elimination, not taste: the installer always gitignores `.codeadd/`, and this
file must survive a fresh clone. It is **never scaffolded empty** — it appears on the first `/add-done` that
writes an entry, and its absence means "no `/add-done` has run", which is information a scaffolded empty
file would destroy.

**Every line is a complete snapshot. A later line for the same `id` supersedes every earlier one.**

This is chosen against the more obvious delta log, and for one reason: if a status change were written as a
delta, a `grep` for "google" would return the original entry and the reader would never see that the thing
is now `gone` — the storage format would reproduce the exact stale-citation failure the index exists to
prevent. Full snapshots cost duplication on the rare lines that change, and make **every** line
independently trustworthy.

## The record

```
{"v":1,"ts":"2026-09-07T12:39:19Z","id":"0042F","layer":"product","by":"done","status":"live","name":"login com Google","words":"login google oauth token social sso conta","commits":["a1b2c3d"],"origin":".codeadd/docs/features/0042F-login-google/","items":[{"what":"POST /auth/google","at":"src/auth/google.ts","find":"/auth/google"},{"what":"tabela oauth_tokens","at":"db/migrations/0042.sql","find":"oauth_tokens"},{"what":"botão LoginGoogle","at":"ui/Login.tsx","find":"LoginGoogle"}]}
```

| Field | Required | Meaning |
|---|---|---|
| `v` | yes | Schema version, **on every line**, never in a header. A log accumulates lines across versions; one header cannot say which version a given line was written under |
| `ts` | yes | UTC ISO-8601, second precision — the format `log-jsonl.cjs` already emits |
| `id` | yes | The entry's identity. Product: the `[NNNN][L]` id the project already allocated. Internal: the plan file's basename without extension, **verbatim** — not a slug, because a substring is a lookup convenience and would let two lines for one plan carry different ids, silently breaking last-line-wins |
| `layer` | yes | `product` \| `internal` |
| `by` | yes | `done` \| `verify` \| `human` — who wrote this line. Makes "a machine repaired this" distinguishable from "a person declared this" |
| `status` | yes | `live` \| `changed` \| `gone` \| `superseded` |
| `name` | yes | Human label, in whatever language the project writes docs in |
| `words` | yes | Free-text search surface — the words someone would actually type, **written in English AND the team's language** (the language the project's docs are written in), so a search in either finds the entry. `0042F` finds nothing in `words`; `login google oauth` finds it. `read` also searches `id`, `name`, `node` and each item's `what` and `find`, never an item's `at` |
| `commits` | yes, ≥1 | Short hashes. Where to go look, never an explanation |
| `origin` | yes | **A directory that survives**, never a file that does not. Product: the feature directory, which pruning keeps. Internal: `.codeadd/docs/deliveries/<id>/`, the archived plan documents. **Never spelled with the retired top-level documentation folder** — the path from before the docs moved under `.codeadd/docs/`; `write` refuses it (`REFUSED=origin-legacy-path`) |
| `items` | yes, ≥1 | What was delivered. **No upper bound** — a delivery that touched twenty artefacts records twenty, and one that touched two records two |
| `superseded_by` | only when `status` is `superseded` | The `id` that replaced this one |
| `node` | optional, internal only | The `artefact-graph.json` node id. **Part of the `read` search surface**, beside `words`, so a query for the bare artefact name finds the entry even when no other field spells it |
| `code_sha` | optional | The code commit that delivered the entry, recorded by the close-out after the code commit. `touched` answers `complete` from it; an entry without it answers `curated` only. Additive — `v` stays `1` |
| `pr` | optional | The delivery's pull request number, or `null` when there was none. Additive — `v` stays `1` |

⛔ **`items` has no ceiling, and removing the old one was deliberate.** It was capped at five with no
stated reason, and a cap with no reason is a cap that gets hit: a delivery touching twenty artefacts had
to drop fifteen real items to be writable at all, and the dropped ones are exactly what a later reader
searches for. The cost of a long `items` list is a longer line in a log nobody reads top to bottom; the
cost of a short one is a delivered artefact the index cannot find. Those are not comparable.

⛔ **`origin` may not name a path the project ignores.** The value is there so a reader can go back to why a
delivery happened, and a gitignored path answers that on exactly one machine. The internal layer wrote
`.codeadd/docs/plans/<id>.md` until its close-out began archiving those documents to `.codeadd/docs/deliveries/<id>/`; that
is the value now, and it is chosen for the same reason the feature directory is — it is still there
afterwards. A line written before the docs moved still carries the retired top-level folder. Hard ban 6 forbids rewriting it, so
`verify --repair` appends a NEW line with the origin under `.codeadd/docs/` and reports
`ORIGIN_REPAIRED=<n>` and, for each rewritten origin whose target document is absent (an early plan that
was never archived), `ORIGIN_UNRESOLVED=<id>`. Until it runs, `read` and `get` print the current path for
such a line, so no result shows the legacy form.

**`v` and `ts` are generated by the script, never supplied by the caller.** The `write` input carries every
other required field. Hard ban 1 governs lines on disk, not the shape of the write input — demanding a
caller-supplied timestamp is busywork, and it lets an agent invent a wrong one.

**Unlike the build-emitted sidecars, this file carries `ts`.** Sidecars omit timestamps so two builds diff
byte-identically. This is not build output; it is a log, and logs here carry time.

## The item anchor

Each item is `{what, at, find}`:

- **`what`** — the human name of the delivered thing (`POST /auth/google`)
- **`at`** — the file it was in when recorded. **A hint, not the identity**
- **`find`** — a literal substring that must still be present in the source if the thing still exists

`find` is the whole mechanism. It is not a hash, not a line number and not a structural query. It survives
reformatting, reordering, refactoring and moving between files — the four things that break every
alternative. A file hash was rejected for the reason the receipt schema already recorded: a hash over a file
many features touch reports drift on every healthy project.

**That survival is conditional on its shape, so the shape is a rule:**

- **One contiguous token. No spaces, no line breaks.** A multi-word `find` is exactly what a formatter
  wraps, and a wrapped string silently flips a live item to `gone`. `oauth_tokens` and `/auth/google`
  qualify; `POST /auth/google` does not — that belongs in `what`.
- **Byte-exact and case-sensitive.** Case-insensitive matching doubles the over-matching risk for no
  benefit, and every anchor names a real identifier with a fixed casing.
- **As close as possible to the thing's own name.** A fragment that could belong to anything else is the
  top failure mode of this format.

## The four statuses

| Status | Decided by | Rule |
|---|---|---|
| `live` | script | `find` is present in the file named by `at` |
| `changed` | script | `find` is **not** at `at`, but exists elsewhere in the corpus. The thing lives; the recorded pointer was wrong |
| `gone` | script | `find` appears nowhere in the corpus |
| `superseded` | human | Declared, and only ever declared. Carries `superseded_by` |

**`changed` means moved, not modified.** A status meaning "this file was edited since we recorded it" is
permanently true for every actively developed file, and an always-on status carries no information.
Modification history is what `git log` is for.

**The index repairs its own pointers.** When verification resolves a `changed` item to a unique location, it
appends a new full line with `at` updated. So `changed` reads as *"a pointer was just repaired, and
documentation elsewhere probably still points at the old path"* — the most useful signal an index built to
stop miscitation can emit.

### How an entry's status aggregates from its items

Status is **entry-level**; the item detail lives in the `at` values a repair updates. The four item results
collapse in this order:

1. `superseded` — declared on the entry — **wins over everything.** It is never recomputed, even when every
   item's source is long gone.
2. Otherwise, **ALL** items `gone` → the entry is `gone`.
3. Otherwise, **ANY** item `gone` or `changed` → the entry is `changed`.
4. Otherwise → `live`.

⛔ **"Any item `gone` makes the entry `gone`" is wrong.** `gone` is defined as *absent from the source*, and
an entry with four live items and one deleted one is not absent — it is a feature that lost a capability,
which is exactly what `changed` says. The wrong rule buries a mostly-alive feature on a single deletion,
and a feature marks itself dead only when its capabilities have **all** vanished.

## What the search may look at

One rule, stated precisely because getting it wrong makes the mechanism produce the exact false answer it
exists to prevent:

> **The corpus is every file git does not ignore, minus `.codeadd/docs/`, minus the index itself.** Never a raw
> filesystem walk, and — equally — never restricted to committed files.

The scoping key is **`.gitignore`, not commit status**. Concretely
`git ls-files --cached --others --exclude-standard`, which returns tracked files *plus* files that exist but
have never been committed, excluding only what the project's ignore rules exclude.

Both halves are load-bearing, and getting either wrong breaks the mechanism in opposite directions:

- **Not a filesystem walk.** A walk finds build output, `node_modules`, and — the case that matters —
  **stale local copies of deleted artefacts**. It would report a deleted thing as `live` or `changed`,
  never `gone`. Honouring `.gitignore` excludes all of it with one rule instead of a directory list that
  rots, and in a user's project it inherits the installer's ignore block for free.
- **Not "tracked only" either.** A file that is merely uncommitted is not garbage. A source file created an
  hour ago is real work, and an anchor that legitimately resolves there must resolve. `git ls-files` alone
  would report it `gone` — the same false answer, from the opposite direction.
- **Minus `.codeadd/docs/` and the index.** A `find` string quoted in the documentation being audited would
  otherwise keep its own item `live` forever — the index validating itself from its own citations. This
  subtraction is total: **an item may never anchor into `.codeadd/docs/` at all.**

**Taking `.gitignore` at face value has one real exception**, and the corpus rule does not bend for it. A
project may deliberately ignore something that *is* cited surface — a generated API client, say. An item
anchored there would resolve to a permanent false `gone`. Instead of an exemption, **the write step rejects
a `find` whose `at` the project ignores**, so the item is refused loudly at authoring time rather than lying
quietly forever. Anchor on the spec the client is generated *from*, which is the more stable anchor anyway.

**Hard ban 3's write-time check uses this identical corpus.** A different scope at write time than at verify
time means an item can be born `live` and immediately verify as `gone`.

## When `find` matches in more than one place

- `find` at `at`, and also elsewhere → **`live`**. The recorded location is still correct; other matches are
  irrelevant.
- `find` not at `at`, exactly one match elsewhere → **`changed`**, and `at` is repaired to that match.
- `find` not at `at`, more than one match elsewhere → **`changed`, and `at` is left exactly as recorded.**

No automatic repair without a unique match: repointing at the wrong file is worse than an admittedly stale
pointer, because a wrong pointer looks freshly verified. An entry can therefore sit at `changed`
indefinitely when a thing moved *and* was duplicated. That is accepted — the status is still true and still
actionable. There is deliberately **no field for candidate matches and no ambiguity flag**: that would put a
code-navigation concern into a discovery index. A human resolves it by editing `find` to something unique,
which is a new line like any other correction.

## Reading rules

1. **Parse line by line. A line that fails to parse is skipped and reported by number**, never fatal. An
   index that refuses to answer because one line is corrupt is worse than one that answers about the rest
   and says so.
2. **Group by `id`. The last line wins.**
3. **Match a whole word or a word prefix, never a loose fragment.** Query and entry are lowercased, folded
   to ASCII (`relevância` meets `relevancia`) and split on non-alphanumerics, so `add-wiki--update` is
   `add`, `wiki`, `update`. A query term matches an entry token that equals it or starts with it — `auth`
   reaches `authGoogleHandler`, `ken` does not reach `tokens`. Terms under 3 letters (`MIN_TERM_LEN`) and the
   pt and en stopwords (`de`, `da`, `para`, `the`, `of`…) are dropped. **A query made only of dropped terms
   matches NOTHING** — `STOP=no-terms` — never everything. The fields searched, with their weights: id 3,
   name 3, words 2, node 2, what 1, find 1 (`what` and `find` are the items'; `at` is never searched,
   because `--repair` rewrites it).
4. **Rank with BM25** (plain JS, no dependency): a rare term outweighs a common one. Each row's `score` is
   normalised 0–1 against the first row, so the first is always `1`.
5. **One row per supersession chain.** If the current version matched, the row is that version and
   `replaces` lists the older ids that matched too; if only an older version matched, that version is the
   row, with `status: superseded` and `superseded_by` naming the current one (rendered
   `superseded→ID`). `COLLAPSED` counts the rows folded away; `MATCHED` counts after the fold.
6. **Order: score DESCENDING, then the stored status (`live` → `changed` → `superseded` → `gone`), then
   recency NEWEST FIRST, then id ASCENDING**, and the reader applies it — consumers render what they
   receive and never re-rank. Status is a tie-break only.
7. **The size is controlled by relevance, never by a blind cut.** Default 5 rows, at most 20
   (`--limit`, above 20 is a usage error, exit 2); `--offset N` continues the ranked list. A page stops at
   the first row — from its second row on — that scores under `FLOOR` of the first (`STOP=floor`) or under
   `DROP_RATIO` of the row before it (`STOP=drop`); the first row of a page is always returned, so an
   `offset` always advances. A budget of `BUDGET_TOKENS` (`CHARS_PER_TOKEN` characters each) then drops
   WHOLE rows from the end, keeping at least one (`STOP=budget`); a row or the JSON is never cut in the
   middle. Verification runs on the returned rows only, after the cut.
8. **A row is lean**: `id`, `kind` (`delivery`), `layer`, `status`, `superseded_by` and `replaces` when set,
   `title` (the `name`), `score`, `snippet` (about `SNIPPET_CHARS` characters of the highest-weight field
   holding a match, cut on word boundaries) and `path` (the `origin`). The commits and the items are not in
   a row: `get <id>` returns the full latest record.
9. **The read emits** `MATCHED=`, `COLLAPSED=`, `RETURNED=`, `OFFSET=`, `NEXT_OFFSET=` (empty when there is
   no next page), `STOP=` (`drop`, `floor`, `limit`, `budget`, `end` or `no-terms`) and `SKIPPED_LINES=`, then
   one JSON row per line. **`get <id>`** emits `FOUND=0|1`, `TRUNCATED=commits:N,items:M` when the record
   exceeded `GET_BUDGET_TOKENS` and dropped `commits`, then `items`, from the tail, and the record as one
   parseable JSON line. Graph and MCP `history` are a different question — which entries record one
   artefact — and read the index through their own exact-node reader, not this ranking.

### The tunables, as declared

Changing any of them needs before/after numbers from the eval suite (`cli/tests/evals/search-precision/`)
and an updated line here, the same treatment the over-match thresholds get.

| Tunable | Value | Means |
|---|---|---|
| `DEFAULT_LIMIT` | `5` | rows per page when `--limit` is absent |
| `MAX_LIMIT` | `20` | the most rows a page may carry |
| `MIN_TERM_LEN` | `3` | shorter query terms are ignored |
| `K1` | `1.2` | BM25 term-frequency saturation |
| `B` | `0.75` | BM25 length normalisation |
| `FLOOR` | `0.3` | a row under this share of the first row ends the page |
| `DROP_RATIO` | `0.5` | a row under this share of the row before it ends the page |
| `BUDGET_TOKENS` | `2000` | the size of a page, in tokens |
| `CHARS_PER_TOKEN` | `4` | how a token is estimated, with no tokenizer dependency |
| `SNIPPET_CHARS` | `200` | the length of a row's snippet |
| `GET_BUDGET_TOKENS` | `4000` | the size of a `get` record before it drops `commits`, then `items` |

## The impact question — which deliveries touched a path

`delivered.cjs touched <path>...` answers it, in two layers that are labelled on every returned entry and
never merged into one list.

⛔ **The label is `answer`, never `layer`.** `layer` is already this record's own `product | internal`
field; writing the answer layer there would overwrite it, and a caller would lose the one thing
`--layer` filters on.

**The delivery's commit is RECORDED, on the entry.** The index lives on the docs branch, so no code history can be walked
to find it. The close-out writes `code_sha` — the code commit that delivered the entry — and `pr` (the pull request number,
or `null`) onto the entry after the code commit exists. On a route where the merge commit does not exist yet at that moment,
`code_sha` is the branch tip, and `delivered.cjs stamp <id> --code-sha <sha>` appends the corrected line (corrections are
new lines, per hard ban 6; stamping the same values twice appends nothing). `touched` reads `code_sha` and diffs that commit.

⛔ **An entry with no `code_sha`, or one git cannot resolve, answers `curated` only.** It is never given a guessed
commit and never falls back to walking history — an entry written before this field existed simply has no `complete` answer
until it is stamped.

⛔ **`commits` cannot answer this and is not asked to.** It holds the BRANCH shas. On the local route a squash makes every
one of them unreachable from the default branch. On the PR route they ARE reachable, but as individual F-block commits,
none of which is the delivery as a whole. Either way the stored list is not the delivery's commit.

| `answer` | Where the path came from | What it is worth |
|---|---|---|
| `complete` | The recorded `code_sha` commit's own diff | Exact and whole. Every file that delivery changed |
| `curated` | The entry's `items[].at` anchors, each carrying its verified status | A sample — `at` is capped at 5 — but the only file pointer that self-heals, because `verify --repair` reappoints it against the current tree |

⛔ **`matched` has a different shape per layer, and a caller must read `answer` before parsing it.**
On a `complete` hit it is a list of paths; on a `curated` hit it is a list of `{at, what, find}` anchors.
One field, two shapes, because the two layers know different things about a hit.

**`CURATED_ONLY` counts the HITS, never the index.** An entry that could not derive its commit and did
not match anything is not a narrower answer, it is not an answer at all.

**The two are not redundant and must not be flattened into one list.** The complete layer says what
changed; the curated layer says which change was load-bearing enough to anchor, and whether it is
still there. A reader that cannot tell them apart will read a five-item sample as a full diff.

**Three cases answer from the curated layer, and they are one fact to a caller: the commit cannot
answer, the anchors can.** An index line recorded outside
the normal flow — the close-out's recovery route writes one on `main` after the merge, with a message
like `chore(delivery-index): record …` — resolves to a commit that touches only `.codeadd/docs/`. That commit
describes the recording, not the delivery. Such an entry answers from the curated layer alone, and
`CURATED_ONLY` counts them so a reader knows how much of the index could not answer completely. A
history git cannot walk, such as a shallow clone, is treated identically: degraded, counted, never an
error. So is a delivery that genuinely only changed documentation — its commit is honestly `.codeadd/docs/`-only
and there is no non-docs file for a path query to match, so nothing is lost by routing it the same way.

⛔ **Nothing is repaired to fix this.** Hard ban 6 forbids rewriting a line, and an entry that answers
from the curated layer is answering honestly rather than failing.

## Hard bans

1. **No line without all required fields.** Absence is never inferred as a default.
2. **No entry with zero commits.** An entry with no commit cannot be traced and cannot have been written
   after a proven merge.
3. **No `find` string absent from the source at write time**, checked against the same corpus verification
   uses. Writing an already-broken anchor makes the item permanently `gone` and silently poisons the index.
   **Not checked on a `superseded` line** — see below.
4. **No `find` containing whitespace or a line break.**
5. **No more than 5 items** — and no fewer than 1. Enforced, not advised: this is where "lean" is
   mechanically defended. A delivery that genuinely needs more was two deliveries.
6. **Never rewrite or delete a line.** Corrections are new lines.
7. **No `status` outside the four values**, no `superseded` without `superseded_by`, and no
   `superseded_by` naming an id the index does not already hold.
8. **The anchor check honours `.gitignore`** — neither a filesystem walk nor a tracked-files-only scan. This
   binds the anchor check specifically and says nothing about unrelated searches a consumer may perform.
9. **No item anchored into `.codeadd/docs/`, or into a path the project ignores.** Both produce an item that can
   never verify honestly — the first always `live`, the second always `gone`.

Every one of these is a string or count check, testable before anything depends on it.

**A `superseded` line is declared, not anchored.** It is written after its replacement deleted its files,
so the checks that read the repository as it is now do not run on it: ban 3, the over-match thresholds
below, and the ignored-path half of ban 9 — a path can become ignored after the line was written, as
build output that used to be tracked does. It reports no `LOOSE=`. Every other ban still runs, ban 4
and the `.codeadd/docs/` half of ban 9 included: they check the line's own text, not the repository. Its `superseded_by` is what it carries instead, so ban 7 requires that
pointer to resolve.

## `REFUSED=` vocabulary

A record breaking a hard ban is caller error in the same sense a bad mode is: `delivered.cjs write` exits
**2** and prints `REFUSED=<name>`. The names are the machine-readable contract — a consumer branches on
them, so they are listed here rather than left implicit in the script.

Thirteen names cover nine bans: ban 7 has three distinguishable ways to break and ban 9 has two, and three
names cover what no numbered ban states — input that is not a record, the over-match threshold, and an
origin spelled with the retired top-level documentation folder.

| `REFUSED=` | Ban | The record did this |
|---|---|---|
| `invalid-json` | — | stdin was not one parseable JSON object |
| `missing-field` | 1 | a required field is absent, including an item without `what`, `at` or `find` |
| `no-commits` | 2 | `commits` is empty |
| `find-absent` | 3 | the `find` string appears in **0** corpus files |
| `find-whitespace` | 4 | `find` contains a space, tab or line break |
| `no-items` | 5 | `items` is empty |
| `bad-status` | 7 | `status` is outside `live` \| `changed` \| `gone` \| `superseded` |
| `superseded-without-by` | 7 | `status` is `superseded` with no `superseded_by` |
| `superseded-by-unknown` | 7 | `superseded_by` names an id no line of the index carries — an absent index resolves nothing |
| `item-in-docs` | 9 | an item's `at` is under `.codeadd/docs/` |
| `item-ignored` | 9 | an item's `at` is a path the project's `.gitignore` excludes — never on a `superseded` line |
| `find-over-matched` | — | the `find` string appears in **more than 20** corpus files |
| `origin-legacy-path` | — | `origin` starts with the retired top-level documentation folder, the path replaced when the docs moved under `.codeadd/docs/` |

Bans 6 and 8 carry no `REFUSED=` name because neither is something a caller can submit: they are structural
promises the script keeps — it only ever appends, and it only ever searches the corpus.

**The over-match thresholds**, measured in **files, not occurrences**, over the corpus above. None of
them applies to a `superseded` line:

| Match count | Action |
|---|---|
| 0 files | **Refused** — `REFUSED=find-absent`. Ban 3: an anchor born broken |
| 1–5 files | Accepted silently. A definition plus its call sites |
| 6–20 files | Accepted, and reported as `LOOSE=<find>` so the preview can flag it as loosely anchored |
| > 20 files | **Refused** — `REFUSED=find-over-matched`. Pick a more specific string |

These numbers are a **declared tunable, not a discovery**: a real identifier appears in its definition and
its callers, which is single digits in practice; a word generic enough to appear in twenty files is a word,
not a name. They are absolute counts, which is a known limitation — twenty files is very generic in a
fifty-file project and could be specific in a large monorepo. A fraction of the corpus was considered and
rejected: a percentage moves the threshold under the author's feet as the project grows, so two identical
anchors written a year apart get different verdicts. **Changing them requires evidence and an updated line
here.**

## Exit codes

`delivered.cjs` follows the script family's three-code doctrine, with one deliberate departure.

| Exit | Means |
|---|---|
| `0` | A probe result, whatever it says. `read`, `get` and `verify` always exit 0, including on an absent index |
| `1` | **The filesystem refused a write.** The departure: the always-0 rule governs probe *results*, and an entry that silently fails to land is the one case where exit 0 would be a lie |
| `2` | Caller error — a bad mode, bad arguments, a record breaking a hard ban (`REFUSED=<name>`), an out-of-range `--limit` or a non-whole `--offset` on `read`, or an unmet hard dependency (`ERROR=not-a-git-repository`) |

**The two exit-2 causes are distinguishable by output, never by code.** A fourth exit code would be one the
rest of the script family does not have; the reason belongs in the output.

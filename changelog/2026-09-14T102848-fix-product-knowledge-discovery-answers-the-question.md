# Product knowledge discovery answers the question it was asked

Six product commands consult the delivery index and the docs knowledge graph
through one skill, at the step where they decide whether the work in front of
them has already been done. Both halves of that consultation were broken, and
both failed the same way: by returning a confident empty answer instead of an
error.

## The index step

`delivered.sh read` joined an entry's text into one string and tested whether
the whole query appeared in it, contiguously. The skill asks its callers for
"the terms from the task" — plural. Measured against this repository's own index
on 2026-09-14: `read "knowledge graph"` matched, `read "graph knowledge"` did
not, and neither did `read "hotfix relations"`. An agent following the skill got
`MATCHED=0` and concluded nothing had shipped before, which is the exact failure
the step exists to prevent.

The query is now split on whitespace and each term matched on its own, as a
substring rather than on a word boundary — the haystack carries byte-exact
identifiers like `authGoogleHandler`, and a word-boundary rule would stop `auth`
from reaching it. An entry is scored by how many distinct terms it hit, and the
score sorts above recency within a status rank.

The read also cut with a single `slice(0, limit)` over a list sorted
`live → changed → superseded → gone`, so every query matching more than the cap
took its cut from the `gone` end. Three documents promised the opposite, and a
`gone` entry is the one that says a thing was tried and abandoned. There are now
two independent caps — five live, two dead — with no backfill of unused dead
slots into live ones, and six output keys
(`MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE`, `RETURNED_DEAD`, `LIVE_CAP`,
`DEAD_CAP`) in place of `MATCHED` / `RETURNED` / `LIMIT`, because
`MATCHED 40 RETURNED 7` never said whether a dead entry was dropped.

## The graph step

The step wrote two literal invocations, `--action=search` and
`--action=touched_by`. The docs corpus implements eleven actions, and an agent
runs what is written and stops, so seven of them were unreachable from any
product artefact.

A command now states its question in one sentence and resolves it in a
question-to-action table covering all eleven — the shape the internal layer
proved on 2026-09-13, carried across the layer boundary. Two outcomes that used
to share one no-op branch are separate: an empty answer is a finding, because it
says the area is new; a missing route is not, and carries a `NOT VERIFIED`
label, because a caller that receives a filename-derived list with no marking
cannot tell it from a graph answer. `RELATED_WORK` is never blank, and each of
the six commands gates on that.

`add.done`'s two `--action=` calls stay, with the reason recorded: an operation
has exactly one call, so naming it removes no choice.

## The gitnexus plugin

`## Command-intent resolution` pinned each codeadd command to one native skill,
so a planning run that needed to trace an error had the mapping pointing the
other way. Resolution now runs off the intent in hand against the intent table
that was already there, and all nine agent fragments state the question that
agent arrives with instead of naming a skill. The six command fragments were
already correct and are untouched.

## Breaking

- **`delivered.sh read` output keys.** `MATCHED`, `RETURNED` and `LIMIT` are
  gone. Both in-repo consumers parse `KEY=VALUE` generically and needed no
  change; anything else reading those three names does.
- **The default live cap dropped from 10 to 5**, and `--limit N` now sets the
  live cap only. The dead cap is fixed at 2 and no argument raises it. Both
  numbers are a declared tunable: changing either needs evidence and an updated
  line in `delivery-index.md`.
- **`graph.js history` and the MCP `history` action** inherit the dead cap. They
  now print how many dead entries were cut rather than showing two in silence.

## A gap this surfaced

Making the path-shaped question explicit is what exposed that it has no answer.
`touched_by` matches against a work item's file set, and in the docs corpus that
set is filled by exactly one thing — a `hotfix-related` attachment, a schema
retired months ago and written by nothing. So `touched_by` returns no work items
in any project on the current format; only its wiki-page half answers.

`add.review` STEP 2.2 and `add.hotfix` STEP 9.1 both ask it and both receive
pages only. Neither command caused this and neither is a regression — the same
query landed in the same half-empty place before, without saying so.

Registered as roadmap item 1.3, which requires the legacy branch deleted rather
than kept: the coupling that hid this is a live reader propping up a dead schema.

## Not included

Roadmap item 1.2, the migration command for old installs. `cli/src/migrations.js`
migration 0002 already harvests the relationships a brownfield project wrote;
what is left is the project that declared none, and that has no design yet.

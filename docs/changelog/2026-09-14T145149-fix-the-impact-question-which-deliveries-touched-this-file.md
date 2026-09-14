# The impact question: which deliveries touched this file

"Who has already changed this file?" had no working answer in a project on the
current document format. `touched_by` matched a query's paths against a work
item's file set, and exactly one thing ever filled that set: an attachment of a
schema that was retired and that nothing writes. Its wiki-page half answered;
its work-item half returned an empty list in every greenfield project.

The retirement note said otherwise, and that is what hid it. It claimed the file
list "lives now" in the graph index — true only while a legacy `related.md`
stayed on disk — and credited the migration with harvesting it, when the
migration only counted it and left the list for the indexer to read out of the
legacy document.

## The delivery's commit is derived, never stored

The close-out commits the index line on the branch and the merge squashes that
branch, so **the commit that introduced an entry's line is the commit that
delivered it**. One pickaxe over `docs/delivered.jsonl` recovers it:

```bash
git log --format=%h -S'"id":"<id>"' -- docs/delivered.jsonl | tail -1
```

Measured over this repository's twenty entries: all twenty resolve. Seventeen to
a commit carrying a code diff, three to a `docs/`-only commit — index lines
recorded outside the normal flow, which the `docs/`-only shape detects.

An earlier draft stored the commit in the record instead. The review blocked it
on two verified consequences: the second index line had no route to `main`, and
hard ban 1 forces it to restate `items`, which `doWrite` re-validates and can
refuse outright. Deriving needs no field, no second write and no route.

The branch shas the record already carries cannot answer this. A squash makes
them unreachable — measured, they intersect `git log` on `main` at zero for
every delivery already merged.

## Two layers, labelled, never merged

`delivered.sh touched <path>...` answers in two:

- **`answer: complete`** — the path is in the delivery's own commit. The whole
  diff.
- **`answer: curated`** — the path is one of the entry's `items[].at` anchors, at
  most five, each carrying its verified status. A sample of what was
  load-bearing, and whether it is still there.

`matched` is a path list on the first and an anchor list on the second, so a
caller reads `answer` before parsing it. `CURATED_ONLY` counts the hits that
could answer from anchors alone. `INDEX_PRESENT` separates an empty answer from
an absent index.

`touched_by`'s work-item half now delegates to that mode on the docs corpus —
the rule `mcp/engine.mjs` already states for `history`: *"THE READ IS DELEGATED,
NEVER REIMPLEMENTED."* The artefacts corpus does not delegate; there a node's
`files` is its own path and the question is which artefact owns a file.

## The legacy reader is deleted, with nothing kept for it

`mcp/corpora.mjs`'s `hotfix-related` branch and `parseImpactedFiles` are gone.
No flag, no conditional, no `files ?? []` left as a courtesy. The
`### hotfix-related (retired)` section is deleted from `fix.md` in full.

**Migration 0002 knows nothing about the legacy lists either.** A first pass kept
a counter and a report line saying they were found and not carried — which was
still a live read of a dead schema's section name, kept on the reasoning that a
user who hand-wrote those lists deserved to be told. That reasoning was wrong:
nobody hand-writes them. `/add.hotfix` STEP 12 wrote them, so there is no author
to inform and no content to preserve. "Nothing of the dead format survives" is
one grep; "everything except a report line" is an exception the next author
widens. The files stay on disk, untouched, like every other file the migration
does not own.

**The prohibition that section carried did not go with it.** It held a gate
against writing a new `related.md`, and deleting it silently would have left
nothing stopping one. Verified before deleting: `add.hotfix.md:100` and `:105`
already carry both halves, in the command that would otherwise write the file.

**The measured baseline it carried is recorded here so it outlives the section:**
across a real installation of 19 hotfixes, 15 carried an explained relationship
in `## Follow-ups` and 18 carried a real `## Impacted Files` list. That was the
richest relationship content in the corpus, and it is why decision 36 filled a
node's file set from it in the first place. What that decision never got was a
successor for the format that followed.

## Breaking

- **`touched_by` on the docs corpus returns a different shape.** Work-item hits
  carry `answer`, `commit` and a layer-dependent `matched`; the result can carry
  `curatedOnly` and `unavailable`. An `unavailable` result with an empty
  `workItems` is **not** "no delivery touched this path" — it is the question
  going unasked.
- **A docs-corpus node's `files` is now always empty.** The field stays on the
  shape because `get` exposes it and the artefacts corpus fills it from the
  node's own path.
- **`.codeadd/` is gitignored at the repository root.** The docs-corpus cache was
  untracked, and `delivered.sh`'s corpus is every file git does not ignore — so
  it had become a member of the anchor-verification haystack, which is the exact
  failure that rule exists to prevent.

## Cost

One query over this repository's index costs 2.65s. A first implementation asked
git twice per entry and cost 10.3s; a second read each commit's index blob and
cost 13.0s. The shipped design makes three calls plus one per queried path, and
`cli/tests/impact-question-touched-by.test.js` prints the measured number rather
than asserting a guessed threshold.

## Not included

- **Converting the legacy `## Impacted Files` lists.** With the derived commit as
  the complete source, a hand-written list is worse than the commit's own diff.
- **A documented git fallback for a project with no index at all.** It still
  answers empty. Roadmap item 1.3 names both of these in its "Done when" and
  neither is met — the item needs correcting rather than closing as written.

# Project backlog — the format and the script that owns it

> **Date:** 2026-09-20
> **Plan:** `docs/plans/2026-09-20T111051-PLAN--project-backlog-001-format-and-script.md`
> **Layer:** product

Subtopic 001 of the project-backlog set. It builds the durable place — the file format and the
script that owns it — so the capture skill (002), the command hooks (003) and the internal rename
(004) each have somewhere to write and one definition of what a ticket is.

## Added

- **`framwork/.codeadd/scripts/backlog.sh`** — owns `docs/backlog.jsonl` and
  `docs/backlog.definitions.json` in a user's project. Seven modes: `add`, `update`, `comment`,
  `move`, `remove`, `list`, `search`. The three that take a record read it as JSON on stdin,
  following `delivered.sh write`. `set -u` and never `-e`, `node` checked before any file I/O, and
  no git command anywhere — reaching the base branch belongs to the skill that calls it.
- **`framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`** — the record format: the two
  files, the thirteen ticket fields, the user-owned status vocabulary, the seven hard bans and the
  six `REFUSED=` names. The script implements it rather than extending it.
- **`framwork/.codeadd/scripts/tests/backlog.bats`** — 47 assertions, written RED before any
  implementation. `NEXT_ID_AGREE`, `DEFS_PRESERVED` and `LINES_BYTE_STABLE` are the three the
  F-blocks consume by name.

## Changed

- **`framwork/.codeadd/scripts/next-id.sh` and `framwork/.codeadd/scripts/status.sh`** — both now
  fold the ids already on `docs/backlog.jsonl` into the one global counter, and `B` joins
  `status.sh`'s allowlist, which stays an allowlist. Both read the board by grep and stay pure bash;
  a JSON parse there would make `node` a dependency of every `/add.new`.
- **`framwork/.codeadd/skills/add-id-convention/SKILL.md`** — the `B` letter, the rule that it is the
  one letter with no branch, and the fact that the two allocators are separate implementations held
  together by one test and nothing else.
- **`framwork/.codeadd/skills/add-doc-schemas/SKILL.md`** — one row in the format-reference table and
  two `uses:` declarations. Additive.

## Fixed

**A live id-allocation bug, found while making the two allocators agree.** Both grepped the whole
`find` path rather than the directory name, and `status.sh next-id` matched `[0-9]{4}` where
`next-id.sh` matched `[0-9]{4}[A-Z]`. A feature slug ending in a year — `docs/features/0001F-auth-2024`
— made `status.sh` return `2025F` against `next-id.sh`'s `0002F`. Every command allocates through
`status.sh`, so that path burnt two thousand ids silently. A parent directory carrying four digits
did the same thing. Both now match the basename only, and `L2.1b` pins it.

## What CI caught that no local run could

Three checks failed on the first push, and none of the four audit scopes could have found them.

**Seven `test-scripts` failures, all exit 127.** Seven assertions executed `backlog.sh` directly
inside a `run bash -c "... | ..."` pipe instead of going through `bash`, so they depended on the
execute bit. `chmod +x` had been run locally; git recorded `100644`, because `core.filemode` is off
on Windows. A fresh CI checkout got "command not found", and bats reported a wrong exit code rather
than a missing file — which is what hid the cause.

The fix is the test, not the mode. Every usage line in this framework reads
`bash .codeadd/scripts/<x>.sh`, the shipped scripts are a mix of 644 and 755 in git, and
`delivered.sh` — the model for this one — is 644. A test that executes the file directly asserts
over a bit nothing else relies on, and it passes on any checkout where someone ran chmod.

**A guard on `delivered.sh read`.** `references/backlog.md` carried that string in a sentence citing
how the delivery index treats a damaged line. The guard walks every `.md` for the literal and asserts
exactly two artefacts carry it. Adding the reference to its expected list would have exempted it from
a check it should never have entered, so the sentence was reworded.

**Two exact node counts** in `cli/tests/build-artefact-graph.test.js`, `+1` script and `+1` reference,
in the byKind snapshot and in the total. The side-effect audit reported that no test pins a count; it
read `graph-query.test.js`, which uses thresholds, and missed this file, which pins exact numbers in
two separate places.

## Not included

The `add-backlog` skill (002), the ticket lifecycle hooks in the five commands (003), the git route
to the base branch and its temporary worktree (002), the internal rename of `add-framework--roadmap`
(004), atomic writes, a `BACKLOG_OPEN:` line in `status.sh`, and a row in `add-ecosystem`'s
Dependency Index — the script has no caller until 002, so the row would be empty.

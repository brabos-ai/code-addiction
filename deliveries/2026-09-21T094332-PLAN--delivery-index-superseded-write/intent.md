---
path: bounded
topic: delivery-index-superseded-write
doc: none
delivery: automatic
---

Backlog item 2.2 — let the delivery index record a supersession.

**Objective:** any delivery replaced by another can be recorded as `superseded` in the index even after its files are deleted; the `fast-local-bats` entry points at the parallel-tests entry, and nothing of the old runner survives in the repository.

## Decided
- `delivered.sh write` skips `find-absent` and `find-over-matched` (and the LOOSE count) for a line whose `status` is `superseded` — those checks read the repository, and a superseded entry's files are expected to be gone; the read side already never recomputes `superseded` (line 299).
- Every other per-item and record-level check still runs on a `superseded` line (`missing-field`, `find-whitespace`, `item-in-docs`, `item-ignored`, `no-items`, `superseded-without-by`, …) — they guard the shape of the line, not the repository.
- `write` refuses a `superseded_by` that names no id present in the index, with a new code `REFUSED=superseded-by-unknown` — the entry's only value is its pointer; a typo would point at nothing and no read would warn.
- `add-doc-schemas/references/delivery-index.md` documents the exemption in the hard-ban table and adds the new code to the `REFUSED=` vocabulary.
- `framwork/.codeadd/scripts/tests/delivered.bats` gains three cases: `superseded` with absent anchors is accepted; unknown `superseded_by` is refused; `changed` with an absent anchor is still refused.
- Append one line to `docs/delivered.jsonl`: `2026-09-10T230600-PLAN--fast-local-bats`, `status: superseded`, `superseded_by: 2026-09-21T001942-PLAN--parallel-tests-in-one-container` (target id verified present in the index), written through the fixed `delivered.sh write`.
- Sweep is already clean (discovery, 2026-09-21): `run-bats|bats\.Dockerfile|CODEADD_BATS_` outside `docs/` hits only the absence assertions in `cli/tests/run-tests.test.js`. Remaining work: add to the `scripts/run-tests.js` header how to prune the old images (`docker image ls codeadd-bats`).
- Layers: `delivered.sh`, `delivered.bats`, `delivery-index.md` are product; `docs/delivered.jsonl` and `scripts/run-tests.js` are internal.
- Callers of `delivered.sh` per the graph (`impact --depth 1`): `add.done`, `add.hotfix`, `add-knowledge-discovery` — none writes `superseded`, none is affected. The internal close-out (`add-framework--done`) was not in the graph answer: NOT VERIFIED; it only gains the ability to write `superseded`.
- Out of scope: an automated step or subcommand that declares `superseded`; deleting the Docker images.

## Open
None

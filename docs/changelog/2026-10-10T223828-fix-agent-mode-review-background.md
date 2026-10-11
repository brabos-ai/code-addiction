# Agent mode: no turn ends with work pending, and a QA `broken` that says why

## Outcome

A command run headless no longer ends its turn to wait for agents or long commands, so the result closes after the work, not before. When the QA preflight reports `QA_CONTRACT_MATCH=broken`, it prints the receipt shape, the receipt's version, the shipped shape, the version that last changed the QA setup and the action to take. Ticket 0044B.

## Why

An `/add-review` run with `--json-schema` in Organize My Finances put its gates and spec-audit agents in the background and ended its turn to wait. The engine read the end of the turn as the end of the run, so the reviewers were never dispatched and the review was never written. The `broken` row on the same project was correct (the receipt held a 1.2.4 shape), but it gave no reason.

## Changes

- `dispatch-rules.md` (shared by every dispatching command): new section `Foreground Only — No Turn Ends With Work Pending`. Agents and long shell commands run in the foreground, parallel agents go out in one message, no turn ends while work is pending. One carve-out: the app server a step boots on purpose (the `qa-project` Managed App Lifecycle).
- `add--agent-interaction`: one paragraph under `Closing` — close only after every agent and command finished.
- `add-audit`: the two gate lines say "re-dispatch the missing agent" instead of "wait or re-dispatch".
- `scripts/build.js`: the setup contract takes an optional `changed-in: MAJOR.MINOR.PATCH`, left out of the hash like `shape:` (first line only) and written to `contracts.json` as `changed_in`, after `shape`. The shape-mismatch error names both lines.
- `add-qa-setup`: `changed-in: 1.3.2` beside the shape. The shape stays `sha256:2326519b34fdd1fe`, so no installed project is affected.
- `qa-preflight.cjs`: on `broken` only, five more rows — `QA_CONTRACT_RECEIPT_SHAPE`, `QA_CONTRACT_RECEIPT_VERSION`, `QA_CONTRACT_SHIPPED_SHAPE`, `QA_CONTRACT_CHANGED_IN`, `QA_CONTRACT_ACTION`. `unknown` when the sidecar or the receipt does not carry the version. The comparison did not change.
- `qa-pipeline` fragment of `add-review`: row 9 quotes those rows.
- `AGENTS.md`: the `contracts.json` row lists `changed_in` and `qa-preflight.cjs` as a reader.
- Tests: `dispatch-rules.test.js` (rule present, no `run_in_background` in product text), `build-contracts.test.js` (hash exclusion, format, key order, second `changed-in:` still hashed, shipped shape and version), `qa-preflight.test.cjs` (broken rows, unknown fallbacks, silence on `ok`, no leak between contracts). RED first on each.

## Validation

`node scripts/run-tests.js framework`: 89 cli files / 2407 tests and 776 script tests pass. `node scripts/build.js` exit 0, no warning. Four read-only audits of the delivery found nothing to fix; ten findings were judged and rejected, each with a ruling in the ledger.

## Left for later

Proof in Organize My Finances after release: re-run `/add-review 0035F` headless and check the review is written. The boot lines in `add-qa-setup` (inside `## Materializes`) and the fragments still say "boot in the background"; the rule's carve-out covers them, and rewording the one in the contract would move the shape. `/add-qa-setup` does not read `dispatch-rules.md`.

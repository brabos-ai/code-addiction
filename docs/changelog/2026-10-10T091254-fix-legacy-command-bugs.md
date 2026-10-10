# add-review, add-hotfix and add-new match what they write

## Outcome

Three legacy commands no longer name files they do not write, and `add-new` re-entry skips the steps already done.

## Why

`add-review` listed its review under `docs/reviews/`, but writes it in the feature folder. `add-hotfix` listed a `fix-report.md` nobody writes. `add-new` on the light path skipped discovery without writing `discovery.md`, which `/add-plan` needs. On re-entry with a validated `about.md`, it also went back to confirm instead of decompose. Ticket 0040B.

## Changes

- `framwork/.codeadd/commands/add-review.md`: review path is `docs/features/${FEATURE_ID}/review-NNN.md`.
- `framwork/.codeadd/commands/add-hotfix.md`: removed the `fix-report.md` row.
- `framwork/.codeadd/commands/add-new.md`: light path writes `discovery.md`; re-entry goes straight to decompose.
- `cli/tests/legacy-command-paths.test.js`: new test for these paths.

## Validation

CI green on head `9dc57eb`: native suites, board and CodeQL. PR #127.

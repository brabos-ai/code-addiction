# All supported local tests run in Linux Docker

## Delivery

Extends PR #109 on `local-tests-linux-container`. Implementation range: `2c74d1d..69993ce`; plan: `2026-10-06T150212-PLAN--local-tests-linux-container`.

## Changes

- Route root, CLI and board test entrypoints through one dispatcher on every host OS. Missing Docker refuses execution; local native overrides and fallback are prohibited.
- Bind container receipts and explicitly authorized Linux GitHub Actions to canonical outer selections and authorized active leaves. Release CI authorizes CLI and package selections separately.
- Framework scope runs CLI, scripts and package smoke; all additionally runs board typecheck/unit and built Chromium E2E. Individual suites retain supported filters and argument boundaries; empty and skipped-only selections fail. Unverifiable custom reporters refuse explicitly.
- Preserve copied-source isolation, read-only worktree Git mapping, CLI watch synchronization, cancellation and failure propagation. Watch begins synchronization after worker readiness; cancellation stops initialization and subsequent group leaves.
- Export coverage and browser evidence, including persisted Playwright HTML reports. Preserve assertion failures and surface evidence-export failures.
- Align internal test guidance with supported dispatcher commands; isolate board-tool integration checks in the provisioned board suite.

## Validation

Final `npm run test:all` exited **0** in Linux Docker on `69993ce`:

| Gate | Result |
|---|---|
| CLI | 1,890 passed across 77 files |
| Scripts | 654 passed |
| Package smoke | Passed |
| Board | Typecheck passed; 126 unit tests passed across 9 files |
| Built Chromium E2E | 163 passed; 20 viewport-specific skips |

Receipt-free explicit Linux CI dispatcher success/mismatch refusal, a real temporary worktree run, watch edit/add/delete and dependency-change restart, and signal cancellation were verified. Cancellation returned transport exit 130 with a passing orchestration harness. Temporary worktree and watch fixture were removed.

Final browser evidence: `.test-artifacts/board-e2e/5c737e26-2181-4c83-b644-7308efb05964/{test-results,playwright-report}`. Full acceptance log: `sh_11324a092001od1KhrHDyucw63.out` in the session shell output directory.

## Review

Independent audits ran once. Consolidated dispositions: **24 findings, 12 applied, 12 rejected**. Parent baseline comparison established all twelve rejected prompt items as pre-existing, unchanged structural defects outside the test-policy diff; each remains recorded with a separate ruling and follow-up cost in the build ledger. The prompt reviewer did not give a clean verdict; earlier author ruler claims were corrected accordingly.

Graph callers and product-layer history were accounted for by the plan. Root code, packages, tests and workflows are outside artefact-node coverage. Inventory was already current, and workbench regeneration passed.

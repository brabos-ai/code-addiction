# Remove backlog shell wrappers

## Outcome

The backlog now distributes only its native Node entries. Removed
`framwork/.codeadd/scripts/backlog.sh` and `backlog-commit.sh`; retained all six canonical
CJS modules and the existing local/publication behavior.

## Breaking change and migration

External callers of either Bash wrapper must use Node directly:

- Reads and local operations: `node .codeadd/scripts/backlog-cli.cjs <mode> [args]`.
- Writes requiring Git publication: `node .codeadd/scripts/backlog-commit.cjs <mode> [args]`.
- Agent records travel through `--record-file <path>`. Both native entries continue to accept
  stdin when that option is absent.

Install/reinstall/update use the existing manifest-owned cleanup. Old wrapper files tracked in
the prior manifest are removed when filesystem permissions permit. Untracked/manual copies
are preserved; unlink-failure behavior is unchanged. No name-based cleanup was introduced.

The earlier node-only-board and native-node-backlog deliveries intentionally preserved wrappers.
This delivery supersedes that compatibility decision; their historical documents remain unchanged.

## Changes

- Migrated Bats invocations to Node while preserving behavioral cases. Removed shell-only
  guard/flag assertions; retained native no-process and empty-PATH coverage.
- Removed compatibility recipes/metadata from product skills, lifecycle/schema references and help.
- Aligned source-backed distribution fixtures, placeholders and graph expectations.
- Added reinstall/update tests for both tracked-wrapper retirement and untracked-file preservation.
- Updated internal backlog capture/lifecycle guidance and regenerated the AGENTS inventory.

## Validation

- Official CLI runner: 76 files, 1,789 tests passed in the Linux Docker runner.
- Backlog/publication Bats: 66 tests passed in the official Docker runner.
- Board native-backlog/server suites: typecheck plus 31 tests passed on Windows.
- Native PowerShell smoke: Node/Git publication to a disposable bare remote, read and remote
  content verified; no Bash/WSL and no real-board test writes.
- Product and workbench builds passed; zero new warnings; inventory current.
- Source-backed retirement assertion was RED before deletion and GREEN afterward.
- Four read-only audit scopes completed. No new runtime/workflow regressions found.
  Pre-existing prompt-quality findings were recorded as out of scope in the build ledger.

## Limits

macOS execution was not performed. The graph history query remains unavailable through
`delivered.sh` on this host; its separate fix is not part of this change. Other Bash scripts,
ticket schema, publication/recovery behavior and the board UI/API were not migrated.

## Commits

| Block | Commit | Change |
|---|---|---|
| F1 product | `008a901` | Native behavioral coverage |
| F2 product | `f0d76d1` | Wrapper removal, instructions and distribution fixtures |
| F3 product | `b1c33ed` | Manifest-owned migration proofs |
| F4 internal | `1e772e2` | Internal guidance and generated inventory |

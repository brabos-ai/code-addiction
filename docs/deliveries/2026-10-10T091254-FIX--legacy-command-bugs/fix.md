# Fix: legacy-command-bugs

> **Kind:** fix
> **Branch:** fix/legacy-command-bugs
> **Head:** 9dc57eb8e6379ac14dd1faa2b0e5785e7412975d
> **PR:** https://github.com/brabos-ai/code-addiction/pull/127
> **Ticket:** 0040B

## What changed

- 7128ae5 fix(commands): align add-review, add-hotfix and add-new with what they write. add-review points to the review file where it is written, add-hotfix drops a row for a file it never writes, add-new writes discovery.md on the light path.
- 9dc57eb fix(add-new): re-entry with a validated about.md goes straight to decompose.

Files: A cli/tests/legacy-command-paths.test.js; M add-hotfix.md, add-new.md, add-review.md under framwork/.codeadd/commands/.

## Validation

CI green on head 9dc57eb: native suites (ubuntu-latest, Node 22.19.0), board, CodeQL (2 analyses). Run https://github.com/brabos-ai/code-addiction/actions/runs/38051157727

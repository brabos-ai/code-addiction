---
path: architectural
topic: product-artefact-names
doc: docs/brainstorming/2026-09-26T112831-product-artefact-names.md
delivery: automatic
ticket: 0010B
---

## Decided
- Product commands use `add-<name>`; product skills, including plugin skills, use `add--<name>` — the distinction remains visible on skill-only providers.
- Keep root command `add` and existing internal identities; no old-name aliases — one canonical product namespace.
- Migrate active sources, references, registries, build, installer, injection, tests and public docs; preserve historical records — avoid broken current references without rewriting history.
- Build an internal bulk rename utility and usage skill first, then use them in this migration — future agents can repeat safe renames.
- Derive the rename map from the registry and plugin skills, allow explicit overrides, and preview deterministic JSONL via stream or file — agents can inspect large changes selectively.
- In stream mode send JSONL to stdout and summary to stderr; in file mode send JSONL to file and summary to stdout — keep the preview parseable.
- Apply accepts the exact preview via file or stdin and preflights its completeness, source hashes and destination conflicts before writing — stale or incomplete previews cause zero writes.
- Use TDD red/green for utility, naming, six-provider output, old-install cleanup (including activated GitNexus skill), injection and graph relationships — prove the new naming contract and prevent regressions.

## Open
None

---
path: architectural
topic: product-agent-mode-claude-code
doc: docs/brainstorming/2026-10-08T191240-product-agent-mode-claude-code.md
delivery: confirm
ticket: 0031B
---

## Decided
- The schema applies to any installed command — the caller passes it; nothing in a command decides
- Guide and schema live in `framwork/.codeadd/agent-mode/` (`README.md`, `result.schema.json`) — the one provider-independent installed path; install and update already copy all of `.codeadd/`
- Same 12 keys, types and enums as the workbench schema, product descriptions only, held equal by a test — one format for a bot on either side
- `needs-approval` is carried by the schema's `status` description only; no prompt change — 0029B proof, 0030B ban on output instructions
- Guide: call, resume, one stop rule, main flows one line each, "Claude Code only"; a test checks every named command exists — a per-stop table would drift
- `AGENTS.md` pointer is one verbatim line in add-wiki's `codeadd-shell` block — no new marker; the installer never touches the user's `AGENTS.md`
- No shipped validator — `--json-schema` already validates
- Proof: automated tests plus one manual headless `/add-brainstorm` run resumed with `--resume`, one attempt, mismatch is a hard stop
- Test-loss guard is out — ticket 0032B; other providers are separate tickets

## Open
None

---
path: architectural
ticket: 0038B
topic: agent-mode-feature
doc: docs/brainstorming/2026-10-09T145554-agent-mode-feature.md
delivery: confirm
---
## Decided
- Product feature named `agent-mode`, off by default, enabled with `--enable-feature agent-mode` — one name for folder, guide and feature; the installer already supports it.
- Human-only passages move into `agent-mode.*` slot fallbacks (today's text verbatim); the agent member replaces them — replacing beats stacking an override.
- A member is never empty: an empty member brings the fallback back (`composeSlot`), so "removed" passages get a one-line neutral member.
- Generic rules live in two new product skills, `add--human-interaction` and `add--agent-interaction`, selected by one `agent-mode.interaction` slot per command — skills cannot carry slots.
- Human-only sections leave `add--delivery-mode`, `add--final-report` and `add--feature-specification`; they keep a mode-neutral pointer; no interaction skill loaded means human.
- Specific behaviour stays in per-command slots; slot only what hangs, misleads or costs a pointless round trip (inventory in the design).
- Confirming stops pass through; deciding stops end the turn as one numbered batch with a recommendation each; answers `1a, 2b` / `recommended` / free text.
- No continuation offer under agent-mode; the closing ends on open decisions and the next command.
- `result.schema.json` unchanged.
- `/add-done` keeps its automatic merge; the agent-mode guide is corrected. Under agent-mode its CI check does not `--watch`; pending CI ends `stopped` and is re-run.
- `add-review` staging consent auto-stages under agent-mode; its `AskUserQuestion` is keyed on `structuredQuestions` for everyone (bug fix, in the fallback).
- Internal layer: no feature; every stop that asks sends all questions at once, numbered, with a recommendation, via one new internal skill `add-interaction`. Exception: brainstorm 8.1 stays without a recommendation, stated explicitly.
- Proof: three named render checks (command off-render, extracted sections byte-compared, on-render with no fallback text) plus one manual live run brainstorm → new → plan with stated pass criteria.
## Open
None
Plan command: `/add-framework--plan docs/brainstorming/2026-10-09T145554-agent-mode-feature-intent.md`

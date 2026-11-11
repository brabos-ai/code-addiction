---
path: architectural
topic: opencode-dispatch-and-gitnexus-repo
doc: docs/brainstorming/2026-09-17T131724-opencode-dispatch-and-gitnexus-repo.md
delivery: automatic
---

## Decided
- Dispatch rule lives in new `add-subagent-driven-development/references/dispatch-rules.md` — one owner, no 595-line skill load
- The rule names no provider: a new dispatch never fills a resume/session field; pass only an id an earlier dispatch in this session returned
- All seven dispatching commands (`add.audit`, `add.build`, `add.diagnose`, `add.hotfix`, `add.plan`, `add.review`, `add.wiki`) point at it via `{{skill:}}` and declare it in `<!-- uses: -->`
- `add.build` gets a gitnexus `graph` marker + fragment on the DIRECT edit path, and joins `gitnexus.injects` — the reported failure came from its main session
- `add.review` gets no gitnexus fragment — its orchestrator never calls GitNexus; `@reviewer-agent` is already covered
- All 16 gitnexus fragments (7 command, 9 agent) state the repo rule inline in one line; it applies to every provider
- Proof: `cli/tests/gitnexus-plugin.test.js` expects seven injected commands and asserts the repo line in every gitnexus fragment
- Out of scope: the `add.wiki` coordinator block, provider-named text, build-time per-provider injection

## Open
None

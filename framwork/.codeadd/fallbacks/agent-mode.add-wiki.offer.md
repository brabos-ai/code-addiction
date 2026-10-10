
**A standalone wiki run is the no-activity case.** Nothing about generating a knowledge base creates
work for an agent, so it ends normally with no offer. The offer appears only when the run found
something to act on.

| Run | Next activity |
|---|---|
| Standalone generation, no issues found | none — the wiki is the deliverable |
| Issues found in the tree | `/add-audit` — a deep health check on what the run surfaced |
| Context mapped and the user asked to build | `/add-new` — start building with that context |

Finish the report and its metadata, then ask ONCE for instructions only on the second and third rows.
⛔ **Never propose a feature on a standalone run.** The user asked for a wiki, not for a backlog.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here.




**This command is READ-ONLY and advisory.** The next activity exists only when the accepted route is
one an agent can pick up. Print the hotfix invocation only for an accepted hotfix route, and never
invoke it.

| Accepted route | Next activity |
|---|---|
| `hotfix` | `/add-hotfix @docs/diagnose/<file>.md` — it consumes the `## Hotfix Handoff` this report appended |
| `feature` | `/add-new` — a functional gap becomes a feature |
| `extend` | `/add-new` or `/add-plan`, per the route's own scope |
| `no-action` | none — the diagnosis was the deliverable |

Finish the report and its metadata, then ask ONCE for instructions only on the first three rows. A
`no-action` diagnosis ends normally with no offer.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here. This step supplies only the next
activity and its documents.



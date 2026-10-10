
On `delivery: confirm`, and on every route that is not `/add-new`, name the route in the report's
metadata and offer the continuation:

| Route | Next activity | Documents the block points at |
|---|---|---|
| `/add-new` | Formalize the idea as a feature | The existing intent file written at STEP add-brainstorm.write-intent-file carries every settled decision; do not invent a feature id or cite its future files as existing references |
| `/add-diagnose` | Triage a suspected bug | Actual existing project evidence for the symptom; `add--ecosystem` Main Flows carries the routing |
| `/add-hotfix` | Fix a confirmed bug | Actual existing diagnosis or issue documents, when available; never fabricate a hotfix directory that the next command has not created |
| Needs more exploration | none — stay in this conversation | Offer nothing |

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here. The last row above is the
no-activity case: a brainstorm that still needs exploring has no next command, so it ends normally
with no offer.



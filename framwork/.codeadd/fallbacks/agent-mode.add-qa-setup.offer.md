
**Item 8 above is a real next activity whenever the audit can run.** Where it cannot — no feature
yet, no `screens.json`, an unavailable MCP server — the remaining steps are the user's own manual
work and there is nothing to continue into.

| State | Next activity |
|---|---|
| Feature exists and the audit can run | `/add-review` on the feature, scoped to the SFxx subfeature when one exists — its QA sections validate the rendered result (UX + functional) |
| No feature or no `screens.json` yet | none — build the feature first |
| Migration branch awaiting review | none — that is a human review of an open PR |

Finish the ordered hand-off list, then its metadata, then ask ONCE for instructions only on the first
row.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here.



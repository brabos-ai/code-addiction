
**This command opens a PR and stops. It never merges, and the merge is always the user's.**

| State | Next activity |
|---|---|
| PR open, awaiting review | none — a human reviews it; there is no agent activity to continue into |
| PR merged on GitHub | `/add-done` — cleanup local branch and tags |
| Scope grew, PR needs updating | `/add-pull-request` — idempotent, appends an update section |

Finish the report and its metadata, then ask ONCE for instructions only on the second and third rows.
A PR waiting on a human reviewer is the no-activity case and ends normally with no offer — offering
"/add-done" before the merge would send the user into a command whose gates cannot pass yet.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here.




**On `confirm`, finish the report, then its metadata, and only then ask ONCE whether the user wants
instructions for continuing in a fresh context.** Then stop and wait.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here. This step supplies only the next
activity and its documents; `automatic` never reaches it.




**On `confirm`, finish the report, the rulings table and the metadata, and only then ask ONCE whether
the user wants instructions for continuing in a fresh context.** Then stop and wait.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here. This step supplies only the next
activity and its documents; `automatic` never reaches it.

⛔ **The publish question is deciding in every state and outranks this step.** On a branch with no PR,
the build asks that question and waits; it does not offer continuation in its place, and the two are
never merged into one prompt.



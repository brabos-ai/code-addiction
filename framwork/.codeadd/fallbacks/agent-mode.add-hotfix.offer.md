
**This command stays advisory about what happens next.** It fixed a bug and stopped. It does not
merge, and it never routes to `/add-review` — the diagnose `@docs/diagnose/<file>.md` handoff and the
route to `/add-done` are untouched by this step.

| State | Next activity |
|---|---|
| Fix built, branch ready | `/add-done` — finalize the branch |
| Build red | none yet — a red build is a deciding stop of its own |

Finish the report and its metadata, then ask ONCE for instructions on the first row only.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here.



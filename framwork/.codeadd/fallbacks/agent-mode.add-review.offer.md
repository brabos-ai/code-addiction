
**A review never inherits the automatic path — but a review can be run inside one.** Nothing hands a
delivery to `/add-review`, so the review itself never gains automatic execution: it always stops, and
the user always runs the next command. What the carrier changes is only whether a person is there to
answer.

| How the review was invoked | Ending |
|---|---|
| By hand, no automatic carrier | `confirm` — finish the report, then ask ONCE for fresh-context instructions, then wait |
| From inside an automatic delivery | Stop under the rule above. **No offer** — there is no one at the keyboard to answer it, and a question the delivery cannot answer is noise |

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here. The
`BLOCKED`-with-only-manual-routes row is the no-activity case: it offers nothing, because the
remaining work is the user's to do by hand.



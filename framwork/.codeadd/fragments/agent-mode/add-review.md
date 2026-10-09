<!-- uses:
- skill: add--agent-interaction
- command: /add-build
- mention: /add-review
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:staging-consent -->

**Stop kind — confirming.** A bot started this review on purpose, and staging is reversible: do not ask,
on any delivery mode. Print one line naming what is being staged and stage it as "If user agrees (Yes)"
below does — `/add-build` commits per task, so what is left unstaged is this delivery's own work.

**If there are unstaged changes:** take the consent as given and go on to "If user agrees (Yes)".

<!-- /section:staging-consent -->

<!-- section:offer -->

**A review never inherits the automatic path — but a review can be run inside one.** Nothing hands a
delivery to `/add-review`, so the review itself never gains automatic execution: it always stops, and
the next command is the user's to run.

| How the review was invoked | Ending |
|---|---|
| By hand, no automatic carrier | Finish the report, then end on the next command as the last line. No continuation offer |
| From inside an automatic delivery | Stop under the rule above, ending on the next command as the last line |

Agent mode: no continuation offer. The `BLOCKED`-with-only-manual-routes row is the no-activity case: it
names no next command, because the remaining work is the user's to do by hand.

<!-- /section:offer -->

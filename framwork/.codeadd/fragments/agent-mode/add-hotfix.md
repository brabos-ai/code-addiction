<!-- uses:
- skill: add--agent-interaction
- command: /add-done
- mention: /add-review
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:offer -->

**This command stays advisory about what happens next.** It fixed a bug and stopped. It does not
merge, and it never routes to `/add-review` — the diagnose `@docs/diagnose/<file>.md` handoff and the
route to `/add-done` are untouched by this step.

| State | Next activity |
|---|---|
| Fix built, branch ready | `/add-done` — finalize the branch |
| Build red | none yet — a red build is a deciding stop of its own |

Finish the report and its metadata, then end on the next command as the last line, on the first row
only. Offer no continuation and ask no yes/no question: the bot starts the next session from that line
by itself.

<!-- /section:offer -->

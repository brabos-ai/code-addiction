<!-- uses:
- skill: add--backlog
- skill: add--backlog/references/lifecycle.md
-->

<!-- section:ticket-close -->

### STEP board.close-ticket Close the Ticket

**Only after the merge landed, on either route.** Before it, the ticket would read `done` for work that
is not on the main branch, and a refused merge would leave it lying.

If `${DIR}/about.md`'s frontmatter carries `ticket:`, follow the `add-done` row of
`{{skill:add--backlog/references/lifecycle.md}}`: read the ticket, and set `status` to `awaiting-release` when that read prints `RELEASE_FLOW=yes`, else to `done`
— **unless it already reads `done` or `awaiting-release`**. A Resume run reaches this sub-step again, and the read is
what stops it writing twice. No `ticket:`, nothing to do.

```
IF CLOSING THE TICKET FAILS OR IS REFUSED:
  ⛔ DO NOT: Treat it as a failed delivery — the merge already landed
  ⛔ DO NOT: Retry the push or resolve a rebase on the user's behalf
  ✅ DO: Carry the one line saying what did not happen into STEP add-done.complete, and continue
```
<!-- /section:ticket-close -->

<!-- section:ticket-carry -->
- **The ticket result from STEP board.close-ticket** — which status was written (`done` or `awaiting-release`), already closed, or what did not happen. Omit the line when `about.md` carries no `ticket:`.
<!-- /section:ticket-carry -->

<!-- section:ticket-report -->
- **The ticket result from STEP board.close-ticket** — which status was written (`done` or `awaiting-release`), already closed, or what did not happen. Omit the line when
  `about.md` carries no `ticket:`. A ticket that silently stays open after its work merged is the
  failure STEP board.close-ticket exists to prevent, so a close that did not land reaches the user here or nowhere.
<!-- /section:ticket-report -->

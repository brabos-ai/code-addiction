<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
- mention: /add.new
-->

<!-- section:ticket-resolve -->
- **TICKET:** if the invocation carries a backlog ticket id — the literal pattern `[0-9]{4}B` — follow
  the `add.brainstorm` row of `{{skill:add-backlog/references/lifecycle.md}}`: read that ticket and use
  it as input to the exploration. **Declared, never inferred** — with no id in the invocation there is
  no ticket, whatever the topic resembles
<!-- /section:ticket-resolve -->

<!-- section:ticket-frontmatter -->

**Ticket:** when STEP 1 resolved one, write `ticket: <id>` into the document's frontmatter.
<!-- /section:ticket-frontmatter -->

<!-- section:ticket-report -->

**Also after the report: the ticket id, when STEP 1 resolved one.** On the `spike` path this line is the
only place the ticket survives — a spike writes no file to carry it — so it is never omitted there.
<!-- /section:ticket-report -->

<!-- section:ticket-intent -->

**It also carries `ticket: <id>` in its frontmatter when STEP 1 resolved one** — this file is what
`/add.new` reads, so it is the carrier the ticket travels on. **A spike writes no intent file and
therefore carries no ticket**; name the ticket in 5.1's report instead.
<!-- /section:ticket-intent -->

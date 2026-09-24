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

<!-- section:ticket-refining -->

**Ticket — the entry write.** When STEP 1 resolved a ticket and the path you just stated is `bounded` or
`architectural`, write `refining` now, per the `add.brainstorm` row of
`{{skill:add-backlog/references/lifecycle.md}}`. **On `spike`, write nothing** — a spike's answer is not
permission to build, and a ticket moved by one that ends in "no" would stay there with nothing behind it.
<!-- /section:ticket-refining -->

<!-- section:ticket-shaped -->

**Ticket — the exit write.** Once the gate passed and the intent file exists, write `shaped`, per the
`add.brainstorm` row of `{{skill:add-backlog/references/lifecycle.md}}`. It follows the intent file and not
the report, because the report came before the approval. A write that did not land is one line printed
with 5.4's handoff.
<!-- /section:ticket-shaped -->

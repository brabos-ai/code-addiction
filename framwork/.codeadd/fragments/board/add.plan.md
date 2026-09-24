<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
-->

<!-- section:ticket-read -->

**Ticket (read here, once):** when `about.md`'s frontmatter carries `ticket:`, follow the `add.plan` row
of `{{skill:add-backlog/references/lifecycle.md}}` — read that ticket and record its `done_when`,
`notes` and `paths` as `${TICKET}`. Its `notes` and `paths` inform the scope STEP 6 determines. **Its
`done_when` is a definition of finished the user already wrote**, so STEP 9.1 writes it into `plan.md`
under the objective, where the plan reviewer can check the plan against it — a plan that contradicts it
has re-decided something without saying so. Read-only — this command writes nothing to the board. No
`ticket:`, no ticket.
<!-- /section:ticket-read -->

<!-- section:ticket-done-when -->

**When STEP 4 recorded `${TICKET}`**, add one more line under the objective: `**Done when (ticket
<id>):**` followed by the ticket's `done_when`, copied verbatim — for the same reason the objective is
copied: the reviewer reads `plan.md` alone.
<!-- /section:ticket-done-when -->

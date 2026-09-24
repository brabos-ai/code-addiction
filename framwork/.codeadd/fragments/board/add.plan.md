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
has re-decided something without saying so. Then write `planning`, per the same row — the write
reaches the base branch and leaves this tree untouched. No `ticket:`, no ticket.
<!-- /section:ticket-read -->

<!-- section:ticket-done-when -->

**When STEP 4 recorded `${TICKET}`**, add one more line under the objective: `**Done when (ticket
<id>):**` followed by the ticket's `done_when`, copied verbatim — for the same reason the objective is
copied: the reviewer reads `plan.md` alone.
<!-- /section:ticket-done-when -->

<!-- section:ticket-planned -->

**Before the report — the ticket's exit write.** When `about.md` carries `ticket:`, write `planned`, per
the `add.plan` row of `{{skill:add-backlog/references/lifecycle.md}}` — the plan is written and STEP 12's
review passed. On an epic's later subfeatures that row writes nothing, and that is correct. Then carry into
the report one line for each board write this run made that did not land.
<!-- /section:ticket-planned -->

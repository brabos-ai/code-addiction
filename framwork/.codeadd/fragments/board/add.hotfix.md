<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
- mention: /add.new
- mention: /add.done
-->

<!-- section:ticket-resolve -->

### 1.2 Resolve a backlog ticket

If the invocation carries a backlog ticket id — the literal pattern `[0-9]{4}B` — store it as `TICKET` and
follow the `add.hotfix` row of `{{skill:add-backlog/references/lifecycle.md}}`: read that ticket and use
its `notes`, `paths` and `done_when` as input to the investigation. **Declared, never inferred** — with no
id in the invocation there is no ticket, whatever the bug resembles. A hotfix runs no `/add.new`, so
nothing else will hand it one.
<!-- /section:ticket-resolve -->

<!-- section:ticket-doing -->

**Ticket.** When STEP 1.2 stored a `TICKET`, and only now that the branch is confirmed: ONE board write
setting `work_id` to this hotfix's id and `status` to `doing`, per the `add.hotfix` row of
`{{skill:add-backlog/references/lifecycle.md}}`. **Never a stop:** a refused or degraded write is one line
in the completion report, and the hotfix continues.
<!-- /section:ticket-doing -->

<!-- section:ticket-frontmatter -->

**Ticket:** when STEP 1.2 stored a `TICKET`, write `ticket: <id>` into this `about.md`'s frontmatter now —
before 12.2 fingerprints the file, after which nothing may change. `/add.done` reads it from here to close
the ticket, per the `add.hotfix` row of `{{skill:add-backlog/references/lifecycle.md}}`.
<!-- /section:ticket-frontmatter -->

<!-- section:ticket-report -->

When STEP 1.2 stored a `TICKET`, also state what STEP 3's ticket write did — set to `doing`, already
`doing`, or what did not happen. **The ticket stays at `doing` here, and never reaches `in-review`:** a
hotfix opens no PR, and `/add.done` closes it — per the `add.hotfix` row of
`{{skill:add-backlog/references/lifecycle.md}}`.
<!-- /section:ticket-report -->

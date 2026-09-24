<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
- mention: build-setup.sh
-->

<!-- section:ticket-doing -->

**Ticket.** If `about.md`'s frontmatter carries `ticket:`, follow the `add.build` row of `{{skill:add-backlog/references/lifecycle.md}}`: ONE board write setting `work_id` to `FEATURE_ID` and `status` to `doing`, skipped when the ticket already reads both. **Here, and not earlier** — until `build-setup.sh` returned, the run could still stop, and a ticket marked `doing` for a build that never started is a lie the board cannot correct. **Never a stop:** a refused or degraded write is one line in the build's final report, and the build continues.
<!-- /section:ticket-doing -->

<!-- section:ticket-attention -->
  It also names STEP 2's ticket write, when that write did not land.
<!-- /section:ticket-attention -->

<!-- section:ticket-metadata -->

**With a ticket:** the metadata also says what STEP 2's ticket write did — set to `doing`, already
`doing`, or what did not happen.
<!-- /section:ticket-metadata -->

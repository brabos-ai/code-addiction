<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
- script: backlog-commit.sh
-->

<!-- section:ticket-intent-field -->
| `ticket:` | The backlog ticket this work came from. STEP 2 copies it into `about.md`, per the `add.new` row of `{{skill:add-backlog/references/lifecycle.md}}` | No ticket — the normal case |
<!-- /section:ticket-intent-field -->

<!-- section:ticket-skeleton -->

When STEP 1.1 read a `ticket:`, the skeleton's frontmatter carries it too, on the line after `branch:`.
Then make ONE board write, carrying `feature` — the id just allocated — and `refining`, per the `add.new`
row of `{{skill:add-backlog/references/lifecycle.md}}`. When that row says `refining` is skipped, the write
still carries `feature`: the pointer is never skipped, only the status.

```
IF STEP 1.1 READ A ticket:
  ⛔ DO NOT: Set the ticket's work_id here, though the feature id is now in hand —
             /add.build owns that write, and the lifecycle row says why
  ✅ DO: Copy the id into about.md, then make the one board write the row describes
```
<!-- /section:ticket-skeleton -->

<!-- section:ticket-board-write -->
- ✅ MAY: Make the board writes the `add.new` row of `{{skill:add-backlog/references/lifecycle.md}}` describes — `backlog-commit.sh` commits them to the base branch through its own worktree, so this tree and this branch stay untouched
<!-- /section:ticket-board-write -->

<!-- section:ticket-shaped -->

**Before the report — the ticket's exit write.** When `about.md` carries `ticket:` and the validation gate
passed, write `shaped`, per the `add.new` row of `{{skill:add-backlog/references/lifecycle.md}}`. It sits
here rather than beside the gate because Continue Mode skips the gate step once it passed. Then carry into
the report one line for each board write this run made that did not land.
<!-- /section:ticket-shaped -->

<!-- uses:
- skill: add-backlog
- skill: add-backlog/references/lifecycle.md
-->

<!-- section:ticket-intent-field -->
| `ticket:` | The backlog ticket this work came from. STEP 2 copies it into `about.md`, per the `add.new` row of `{{skill:add-backlog/references/lifecycle.md}}` | No ticket — the normal case |
<!-- /section:ticket-intent-field -->

<!-- section:ticket-skeleton -->

When STEP 1.1 read a `ticket:`, the skeleton's frontmatter carries it too, on the line after `branch:`.

```
IF STEP 1.1 READ A ticket:
  ⛔ DO NOT USE: Bash to run backlog-commit.sh or any other board write — this command
                 makes NO git writes, and the READ-ONLY GUARANTEE above says so
  ⛔ DO NOT: Set the ticket's work_id here, though the feature id is now in hand —
             /add.build owns that write
  ✅ DO: Copy the id into about.md frontmatter, and stop there
```
<!-- /section:ticket-skeleton -->

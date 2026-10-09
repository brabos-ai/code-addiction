<!-- uses:
- skill: add--agent-interaction
- mention: add--ecosystem
- command: /add-new
- command: /add-build
- mention: /add-done
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:ci-watch -->

```bash
gh pr checks --fail-fast
```

**Read the checks once; do not watch them.** A watch can outlive the call that runs it. When any required
check is still pending, do not wait and do not merge: report that CI is pending and end on `/add-done` as
the next command. The documents are already pushed, so the next run takes the Resume route, re-reads the
checks and merges when they are green. A check that has finished is read exactly as below.

<!-- /section:ci-watch -->

<!-- section:offer -->

**Every stop in this command is deciding, and none of them is this one.** The merge already happened
by the time this runs, so the closing names what comes next — never a substitute for a gate, and never
a merge consent.

**The FIRST row is the test for whether there is a next activity at all, so it is evaluated first.**
A merged branch carries no goal of its own; the branch type only says what the delivery *was*. Read
the rows top-to-bottom and stop at the first match, exactly as `add--ecosystem` Main Flows does.

| State after the merge | Next activity |
|---|---|
| **No next goal was stated for this work** | none — the delivery is closed |
| Feature branch, back on main, next feature stated | `/add-new` — start that feature |
| Epic, subfeatures still pending, next one stated | `/add-build feature N` — the next subfeature |
| Hotfix, and the user has said what comes next | `/add-new` — return to feature work |

Finish the report and its metadata, then end on the next command as the last line, on rows 2 to 4
only. No continuation offer.

⛔ **Never propose a new feature the user did not ask for.** "Back on main" and "was an epic" are
facts about what shipped, not intentions about what comes next. Reading either as a reason to start
something is how a close-out launches an epic its user never requested, and it is why row 1 is
evaluated before all three.

<!-- /section:offer -->

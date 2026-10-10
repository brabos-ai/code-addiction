
**Every stop in this command is deciding, and none of them is this one.** The merge already happened
by the time this runs, so the offer is a question about what comes next — never a substitute for a
gate, and never a merge consent.

**The FIRST row is the test for whether there is a next activity at all, so it is evaluated first.**
A merged branch carries no goal of its own; the branch type only says what the delivery *was*. Read
the rows top-to-bottom and stop at the first match, exactly as `add--ecosystem` Main Flows does.

| State after the merge | Next activity |
|---|---|
| **No next goal was stated for this work** | none — the delivery is closed |
| Feature branch, back on main, next feature stated | `/add-new` — start that feature |
| Epic, subfeatures still pending, next one stated | `/add-build feature N` — the next subfeature |
| Hotfix, and the user has said what comes next | `/add-new` — return to feature work |

Finish the report and its metadata, then ask ONCE for instructions only on rows 2 to 4.

⛔ **Never propose a new feature the user did not ask for.** "Back on main" and "was an epic" are
facts about what shipped, not intentions about what comes next. Reading either as a reason to start
something is how a close-out launches an epic its user never requested, and it is why row 1 is
evaluated before all three.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by
`{{skill:add--human-interaction/SKILL.md}}`. Do not restate them here.



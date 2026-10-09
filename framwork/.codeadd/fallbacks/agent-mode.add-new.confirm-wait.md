
**What the user sees depends on what is left open:**

| `## Open` in the intent file | This STEP |
|---|---|
| Reads `None` | The confirmation screen alone. One screen, no questions |
| Lists items | Those questions, one per turn, then the confirmation screen |
| Absent, empty, or no intent file at all | The skill’s full question set, then the confirmation screen |

**STOP AND WAIT after the confirmation screen** — except where the table below says the stop passes.
The user corrects an extraction error or waves it through. **The approval never scales away — only the
interrogation does.**

**Stop kind — decided by what is left open:**

| State | Kind | On `delivery: automatic` |
|---|---|---|
| `## Open` reads `None` | **confirming** | Print the confirmation screen in full and continue to STEP add-new.decompose — the brainstorm's approval already covered it |
| `## Open` lists items | **deciding** | Ask them and wait — no approval answered them |
| Absent, empty, or no intent file | **deciding** | Wait — there is no approval to have covered anything |

On `delivery: confirm` every row waits.



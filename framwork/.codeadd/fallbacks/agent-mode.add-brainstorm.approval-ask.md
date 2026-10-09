
**This is the only approval the pipeline asks for by default.** Ask it through the provider's
structured-question tool where the `structuredQuestions` capability declares one — otherwise as an
option table — with these three options and nothing else:

| Option | What happens |
|---|---|
| **Approve, I confirm each stage** | The intent file records `delivery: confirm`. Each stage stops and offers optional fresh-context instructions; this command stops |
| **Approve, deliver automatically** | The intent file records `delivery: automatic`, and this command follows `/add-new`. Every stage then hands off without waiting until the build asks whether to open the PR |
| **Keep discussing** | No intent file, no handoff. Return to STEP add-brainstorm.explore with what the user wants to reopen |



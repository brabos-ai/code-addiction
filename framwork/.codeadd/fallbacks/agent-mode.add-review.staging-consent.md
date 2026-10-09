
**Stop kind — confirming.** On `DELIVERY=automatic`, do not ask: print one line naming what is being
staged and stage it as "If user agrees (Yes)" below does — `/add-build` commits per task, so what is left
unstaged on an automatic delivery is this delivery's own work. On `confirm`, ask.

**If there are unstaged changes:**

Ask the user through the provider's structured-question tool where the `structuredQuestions` capability
declares one; where it declares none, present the same prompt as an option table:

```
Detected uncommitted changes in your working directory.

To include the changes in the next commit along with review corrections, I can stage them (git add).

Can I stage your changes?
- Yes: I stage and proceed with the review
- No: I keep as-is and proceed (changes remain unstaged)
```



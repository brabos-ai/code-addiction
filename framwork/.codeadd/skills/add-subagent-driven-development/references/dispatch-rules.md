# Dispatch Rules — Starting a Subagent

Reference material for the `add-subagent-driven-development` skill. Every command that dispatches a
subagent points here, so the rule lives once.

---

## A Fresh Dispatch Leaves Resume Fields Empty

Many engines' subagent tools carry an optional field that **continues an earlier subagent** instead of
starting a new one — named something like resume id, session id or task id. The engine accepts only an
id it issued itself, in its own format.

```
IF DISPATCHING A SUBAGENT FOR THE FIRST TIME IN THIS STEP:
  ⛔ DO NOT: Fill any resume, session or task-continuation field
  ⛔ DO NOT: Invent an id for it — a UUID, a task label, a feature id or a counter
  ✅ DO: Leave the field out entirely, and let the engine create the session

IF CONTINUING A SUBAGENT THAT ALREADY RAN:
  ✅ DO: Pass only the id an earlier dispatch in this same session returned, exactly as returned
  ⛔ DO NOT: Pass an id from a previous session, a document or a ledger
```

**An invented id is not harmless.** The engine rejects the dispatch, the step retries, and a build that
dispatches per task pays that failure on every task.

**The ids in this workflow are not session ids.** A task id (`T01`), a feature id or a batch number
identifies work on disk. None of them belongs in the dispatch tool's resume field.

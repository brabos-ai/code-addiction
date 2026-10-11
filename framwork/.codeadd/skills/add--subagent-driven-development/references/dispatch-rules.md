# Dispatch Rules — Starting a Subagent

Reference material for the `add--subagent-driven-development` skill. Every command that dispatches a
subagent points here, so the rule lives once.

---

## Foreground Only — No Turn Ends With Work Pending

A subagent or a long shell command can run in a background or asynchronous mode of the dispatch or
shell tool. A run that ends its turn to wait for that work is read as finished, so its result closes
before the work does and the step that needed the work never happens.

```
IF DISPATCHING A SUBAGENT OR RUNNING A LONG SHELL COMMAND (A GATE, A BUILD, A TEST RUN):
  ⛔ DO NOT: Choose a background or asynchronous mode of the dispatch or shell tool
  ⛔ DO NOT: Dispatch parallel agents one per message
  ✅ DO: Run it in the foreground — parallel agents go out as several calls in one message
  ✅ DO: Give a long shell command a timeout that covers it

IF AN AGENT OR A COMMAND IS STILL PENDING:
  ⛔ DO NOT: End the turn to wait, or emit the closing or the result
  ✅ DO: Wait for it inside the turn, then continue
```

**Never end the turn while an agent or a command is pending.**

**One carve-out: an app server a step boots on purpose** (the `qa-project` Managed App Lifecycle) is
not pending work. The step owns that process and tears it down by that lifecycle; nothing waits for it
to finish.

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

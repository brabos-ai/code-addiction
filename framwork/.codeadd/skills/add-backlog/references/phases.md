# The Phase Model — What a Status Means

**The model a ticket moves through, and nothing about how it moves.** Which command writes which status,
and when, is `{{skill:add-backlog/references/lifecycle.md}}`'s job. This file answers the question a reader
of the board asks — *what does this column mean, and is anyone in it?* — and that reader may never write a
status at all.

---

## Nine Statuses, Seven Columns

| Column | Something is running | Nothing is — the ticket is parked |
|---|---|---|
| `backlog` | — | `open` |
| `shaping` | `refining` | `shaped` |
| `planning` | `planning` | `planned` |
| `building` | `doing` | — |
| `review` | — | `in-review` |
| `done` | — | `done` |
| `dropped` | — | `dropped` |

**A status is the machine state. A column is what a person reads.** Nine of one over seven of the other is
possible because a phase with both a running state and a parked one keeps both in the same column:

- `refining` and `shaped` are both **shaping** — the work is being defined, or it has been and nobody has
  taken it into planning.
- `planning` and `planned` are both **planning** — a plan is being written, or it is approved and nobody has
  started building.

**That pairing is the whole point of the model.** A board that shows `planning` for both "someone is
writing the plan" and "the plan has been sitting approved for a week" hides the one thing a board is looked
at for. The pair keeps them apart without spending a column on each.

## What Each Status Means

| Status | Means |
|---|---|
| `open` | Decided, and nobody has picked it up |
| `refining` | The work is being shaped — a brainstorm or a feature definition is running |
| `shaped` | The feature is defined and waiting to be planned |
| `planning` | A plan is being written |
| `planned` | The plan is approved and waiting to be built |
| `doing` | The build is running |
| `in-review` | The work is built and a pull request is open |
| `done` | Delivered |
| `dropped` | Decided against. Nobody moves a ticket here but a person |

## Three Things the Model Does Not Say

**It says nothing about order.** A ticket can reach `doing` from `open` without passing through the
statuses between — a fix that needs no definition and no plan is the common case. Nothing refuses a status
because the one before it was skipped, and the model offers no "next" status to compute.

**`order` is not a position in the flow.** In `docs/backlog.definitions.json` a status's `order` sorts it
within its column and a column's `order` sorts the columns. Neither is a phase, and a status is read by its
name. Reorder the statuses and nothing about what they mean changes.

**The names are a contract, not an enforcement.** They are the ones the pipeline writes, and the format
reference says so. A project may rename one, and every write naming it is then refused — loudly, one refusal
per write. `{{skill:add-doc-schemas/references/backlog.md}}` owns the format, the fields and who owns
which key.

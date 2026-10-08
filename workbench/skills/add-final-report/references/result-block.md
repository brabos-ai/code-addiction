# The Result Block — schema v1

The shape of the `codeadd-result` block. `add-final-report` owns when it is printed and in which mode;
this file owns only what is inside it. No command restates this table.

The block is one fenced code block. The fence info string is `codeadd-result`. The body is one JSON
object. A caller finds the block by that fence and rejects any `v` it does not know.

## Fields

| Field | Type | Meaning |
|---|---|---|
| `v` | int | Schema version. Starts at `1`. A breaking change bumps it |
| `status` | `done` \| `stopped` \| `needs-approval` \| `failed` | The outcome. See Status below |
| `stage` | string | The command name, for example `add-framework--build` |
| `branch` | string \| null | The current branch |
| `commits` | string[] | Short SHAs this run created, in order. `[]` when none |
| `tests` | `{before, after}` \| null | Each side is `{passed, failed, skipped}` counts, or `null` when that run did not happen |
| `pr` | `{number, url}` \| null | The pull request this run opened or updated |
| `ci` | `success` \| `failure` \| `pending` \| `none` \| null | The required-checks state on the head SHA, when the command read it |
| `ticket` | `{id, status, sha, pushed}` \| null | The last board write this run made. `sha: null, pushed: false` when it degraded |
| `next_step` | string \| null | The Continuation Line verbatim, or `null` when the command prints none |
| `needs_approval` | bool | `true` when the run is waiting on the user |
| `reason` | string \| null | The gate, stop or question, in one line |

## Status

`add-final-report` points here for these meanings; they are stated once, in this file.

- `done` — the command finished its work.
- `stopped` — a gate or a hard stop ended the run on purpose.
- `needs-approval` — the run is waiting on the user.
- `failed` — an error the command did not plan for.

## Rules

- Every key is always present. An absent key and a `null` one must not mean two things to a parser.
- Use `null` for unknown. Never omit a key, never invent a value.
- `needs_approval` is `true` exactly when `status` is `needs-approval`.
- `stage` is never empty. `reason` is non-null and non-empty when `status` is not `done`. On `done` it is `null` unless the run has a caveat worth one line.
- The block holds no other key. A new field is a new `v`.

## Headless callers

The stop-rule line makes the agent run `node scripts/output-mode.js`. A headless caller (`claude -p`) must allow that command, for example `Bash(node scripts/output-mode.js)` in its permissions. When the command is denied, the resolver cannot run and the run falls to `prose`: the caller gets the report and no block. This repository's `.claude/settings.json` carries that allow rule.

## One example per status

```codeadd-result
{
  "v": 1,
  "status": "done",
  "stage": "add-framework--build",
  "branch": "feat/example",
  "commits": ["a1b2c3d", "e4f5a6b"],
  "tests": {
    "before": { "passed": 655, "failed": 0, "skipped": 0 },
    "after": { "passed": 690, "failed": 0, "skipped": 0 }
  },
  "pr": { "number": 12, "url": "https://github.com/owner/repo/pull/12" },
  "ci": "pending",
  "ticket": { "id": "0028B", "status": "in-review", "sha": "abc1234", "pushed": true },
  "next_step": "/add-framework--done docs/plans/2026-10-07T192430-PLAN--example.md",
  "needs_approval": false,
  "reason": null
}
```

```codeadd-result
{
  "v": 1,
  "status": "stopped",
  "stage": "add-framework--backlog",
  "branch": "main",
  "commits": [],
  "tests": null,
  "pr": null,
  "ci": null,
  "ticket": null,
  "next_step": null,
  "needs_approval": false,
  "reason": "ticket 9999B is not on the board; nothing was written"
}
```

```codeadd-result
{
  "v": 1,
  "status": "needs-approval",
  "stage": "add-framework--build",
  "branch": "feat/example",
  "commits": ["a1b2c3d"],
  "tests": null,
  "pr": null,
  "ci": null,
  "ticket": null,
  "next_step": null,
  "needs_approval": true,
  "reason": "the first push of this branch needs the user's answer"
}
```

```codeadd-result
{
  "v": 1,
  "status": "failed",
  "stage": "add-framework--build",
  "branch": "feat/example",
  "commits": [],
  "tests": null,
  "pr": null,
  "ci": null,
  "ticket": null,
  "next_step": null,
  "needs_approval": false,
  "reason": "node scripts/build.js exited 1 on F3"
}
```

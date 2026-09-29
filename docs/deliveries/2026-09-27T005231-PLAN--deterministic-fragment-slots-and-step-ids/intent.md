---
path: architectural
topic: deterministic-fragment-slots-and-step-ids
doc: docs/brainstorming/2026-09-27T004331-deterministic-fragment-slots-and-step-ids.md
delivery: confirm
ticket: 0007B
---

## Decided
- Deliver tickets 0007B and 0014B in one plan — deterministic ordering and group fallback share one composition engine.
- Migrate all product command and agent injection points to explicit slots — no parallel legacy composition path.
- Use member marker order, separate reusable fallback files, and generated sidecar metadata — one authored source of truth.
- Re-render from pristine per-provider baselines on install, update and toggles — stale fragment text cannot survive.
- Warn and use fallback on invalid runtime members; retain manifest enabled state — users keep the framework and a future update retries.
- Migrate STEP IDs in distributed product commands to readable owner-qualified IDs; leave workbench commands unchanged.
- Add only an internal authoring skill to the workbench — it guides future fragment changes.
- Develop the eventual implementation in a worktree and prepare a PR at the end of the build, without merging it automatically.

## Open
None

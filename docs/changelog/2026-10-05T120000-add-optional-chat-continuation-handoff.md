# Optional chat continuation handoff

## Outcome

A finishing command can now hand a fresh session the next activity without creating a second source of truth. After a complete manual report, an eligible command offers continuation instructions once. Acceptance returns exactly one copyable block; it executes nothing and writes no handoff file.

## Why

The original request asked for a persisted prompt under each feature. The user replaced that design with a chat-only handoff: the next session needs the command, the official documents, and the decisions already settled, not another document to maintain.

Automatic delivery keeps its existing same-session execution. A deciding stop, including every close-out decision, is never replaced by the offer.

## Changes

- `add--final-report` owns the two-response shape: the full report first, then one invocation-first instruction block only after acceptance.
- `add--delivery-mode` owns eligibility. Manual completion offers continuation only when a real next activity exists; automatic mode follows the next command as before.
- The twelve finishing commands select their concrete next activity and point at the two shared contracts. `add` and `add-ux` remain exempt routers.
- `add--ecosystem` records the optional manual handoff and the no-activity cases.
- Contract and regression tests pin the owners, the twelve adapters, the discarded file design, and the preserved automatic and close-out boundaries.

## Validation

The product build reports zero graph warnings. The final suite has 77 files and 1853 passing tests. CI on PR #102 is green for CLI on Node 20 and 22, scripts, board, Analyze, and CodeQL.

Behavioral checks used real producer and recipient conversations. They cover acceptance, decline, no-activity cases, automatic first-step execution, and the semi-automatic checkpoint. A fixture cannot prove an end-to-end feature implementation when its review metadata or target file is absent; those limits are recorded rather than treated as product success.

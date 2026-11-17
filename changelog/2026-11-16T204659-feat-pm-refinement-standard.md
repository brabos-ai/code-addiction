# Feature — a refined card has six parts, and in Notion the card body is the intent

**Date:** 2026-11-16 · **Type:** feature · **Plan:** `2026-11-16T204659-PLAN--pm-refinement-standard` · **Release:** minor (v1.10.0) · **Backlog:** 0081F

## Summary
The product PM refines a card into six parts (Problem, Objective, What we expect, Decided, Open, Acceptance criteria). In a Notion project that card body is the intent: no intent subpage is created, and existing subpages are left alone.

## Why
A card and a separate intent subpage could drift apart. One body removes the second copy.

## What changed
- `roles/product-pm.md` defines the refined card, with an example; `roles/chief-engineer.md` reads the card body as the intent.
- `add--agent-notion` fills the card body and creates no intent subpage; the guide sections 9 and 10 follow the same rule.
- `add-brainstorm` asks the missing parts before its approval; `new-feature.md` lists the six sections.
- Tests: product-pipeline-parity, agent-mode and agent-mode-notion gained L1.1–L1.7 (red, then green).

## Decisions worth knowing
- "Six parts" is read as the six sections above. The cold reader marked implementation-level gaps, judged out of scope for a card.

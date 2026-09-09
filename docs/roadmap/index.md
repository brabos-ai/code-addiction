# Roadmap

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

---

## 3. One executive-summary shape for every command's final report

**Problem.** What a command hands back at the end is inconsistent. Some name a file, a verdict and
a next command and stop there; others bury the actual change inside status prose. The user is left
asking "but what was actually delivered, and how does it work?" One shape for this already exists —
`.claude/skills/add-plan-authoring/SKILL.md`'s "Completion — The Executive Summary" — but it is
scoped to `add-framework--plan`'s output alone.

**Target.** Every command that finishes work, in either layer, ends its response the same way: a
TL;DR line, bullet points of what was delivered, and a short "how it works" digest — plain, direct
language, no jargon, no filler ("improves consistency" says nothing; the concrete change does).

### 3.0 — Lift the executive-summary shape out and make it the standard for every command

**Scope:** both
**TLDR:** every command ends the same way — TL;DR, bullets of what shipped, a short how-it-works digest.

- Generalize `.claude/skills/add-plan-authoring/SKILL.md`'s "Completion — The Executive Summary"
  section into a shared shape, instead of reinventing one: TL;DR first, then what was delivered as
  bullets, then a short "how it works" digest anyone can read without the surrounding context.
- One piece of work covers both layers — internal commands (`.claude/commands/*.md`) and product
  commands (`framwork/.codeadd/commands/*.md`) end their responses in the same shape.
- **Done when:** the shape is written once as a shared reference and at least one command per layer
  (e.g. `add-framework--done` and `add.build`) closes with a report in that shape.

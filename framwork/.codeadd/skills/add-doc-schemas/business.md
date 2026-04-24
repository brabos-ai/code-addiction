# Business Voice & Notation

Voice, notation, and anti-patterns for business-facing docs: feature specs, discovery, brainstorms.

> **Structure is defined by the schemas in `{{skill:add-doc-schemas/SKILL.md}}`** (`feature-about`, `brainstorm`, and feature-discovery content). This file covers only *how to write* the content those schemas require — voice, requirement notation, decision tables, and anti-patterns. It does NOT prescribe section lists; those live in the schema registry.

**Use when:** writing or reviewing about.md, discovery.md, or brainstorm docs.

---

## Principle

Clarity on **what** and **why**. Enough context to understand decisions without reading the source. Structured bullets over long paragraphs. Every statement carries a fact, a constraint, a decision, or a link — never filler.

Depth over brevity. A requirement that omits the condition is worse than a requirement that takes two lines.

---

## Requirement Notation

Use stable IDs so specs can be referenced from plans, tests, and reviews.

### Format

```
- **[ID]:** [actor] [action] [object] [condition/context]
```

IDs are per-doc, monotonically increasing. Prefixes:

| Prefix | Kind |
|---|---|
| `RF` | Functional requirement |
| `RNF` | Non-functional requirement (performance, security, reliability) |
| `RN` | Business rule |

### Examples

```
- **RF01:** User can mark a notification as read with a single click.
- **RF02:** System groups notifications of the same type within a 24h window.
- **RNF01:** The list loads in under 200ms for up to 100 items.
- **RN01:** An unread notification older than 30 days is archived automatically.
- **RN02:** Free-plan users are capped at 50 stored notifications.
- **RN03:** Security notifications are always sent by email in addition to in-app.
```

Keep each line self-contained. If a requirement needs more than one line, split it or promote it to a sub-heading — do not bury conditions in prose.

---

## Decision Notation

Every non-trivial decision carries the alternative that was rejected and why. A decision without an alternative is a preference, not a decision.

### Table form (default)

```markdown
| Decision | Rationale | Alternative rejected |
|---|---|---|
| WebSocket | Real-time without polling overhead | SSE — weaker mobile support |
| PostgreSQL | Already in the stack | MongoDB — adds operational surface |
```

### Expanded form (when the decision is load-bearing)

```markdown
### Decision: [title]

**Context:** [what made this decision necessary]

**Options considered:**
1. **[Option A]** — [description] — pros / cons
2. **[Option B]** — [description] — pros / cons

**Choice:** [Option X], because [primary reason].

**Consequences:** [downstream impacts, constraints it introduces].
```

Use the expanded form only when the table form would lose information — typically for architectural choices with long-lived consequences.

---

## Scope Notation

Split into **Includes** and **Does NOT Include**. The exclusion list is the more valuable half: it prevents scope creep and documents why a seemingly-related feature was left out.

```markdown
### Includes
- [item that IS in scope]
- [item that IS in scope]

### Does NOT Include
- [item left out] — [one-line reason]
- [item left out] — [one-line reason]
```

The reason on each exclusion is mandatory. "Out of scope" without a reason is a future argument waiting to happen.

---

## Brainstorm Voice

Brainstorm docs capture exploration, not decisions. Voice rules:

- **User-perspective language.** Describe the pain the user feels, not the system behaviour. Save the technical vocabulary for discovery/plan.
- **Pros and cons for every candidate direction.** Directions without a cons list are proposals in disguise.
- **Open threads explicit.** Any unresolved question blocks commitment. Naming it is the point.
- **No verdict.** The doc closes with open threads and a pointer to the next command (`/add.new`, `/add.plan`), not with "we will build X".

---

## Anti-Patterns

| Wrong | Right |
|---|---|
| Long paragraphs explaining requirements | Bulleted `**[ID]:**` lines |
| "The system should be fast" | `**RNF01:** response under 200ms` |
| Decisions without alternatives | Table row with rejected alternative |
| Edge cases described but not handled | `**[case]:** [defined handling]` |
| Vague acceptance criteria | Verifiable, testable criteria |
| Technical jargon in brainstorm | User-perspective language |
| Scope list with no exclusions | Explicit "Does NOT Include" with reasons |
| Dropping requirement conditions to shorten the line | Keep the condition; split the line if needed |

---

## Checklist

- [ ] Requirements use `**[ID]:**` prefix (RF / RNF / RN)
- [ ] Every RN states condition → result
- [ ] Decisions carry a rejected alternative
- [ ] Scope has both Includes and Does NOT Include, with reasons on exclusions
- [ ] Acceptance criteria are verifiable and testable
- [ ] Brainstorm uses user-perspective language, no technical jargon
- [ ] No filler sentences (every line is fact, constraint, decision, or link)

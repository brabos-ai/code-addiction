# Plan Document Template

<!-- uses:
- command: /add-framework--build
-->

Sections marked *(optional)* apply when the plan earns them. A single-artefact plan may omit them; a
multi-topic plan may not. Every other section is mandatory, `None` included.

```markdown
# Plan: [Name] — [one-line what changes]

> **Status:** draft | approved | implemented
> **Layers:** product | internal | both
> **Type:** command | skill | agent | script | workflow | product | architecture | cross-cutting
> **Created:** YYYY-MM-DD

---

## Context

[Why this need arose. Connect it to the pain point.]

[IF design docs exist:]
**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/YYYY-MM-DDTHHMMSS-[topic].md` | [which decisions/contracts live there] |

## Global Constraints

[Every requirement binding the WHOLE plan. One line each, exact value copied verbatim, source cited.
`None` when there are none — never omit the section.]

- Agents build only for a provider declaring an `agents` pattern (provider-map.json → providers)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)

## Problem

1. **[Headline]** — [what is bad today / missing / the user pain]

## Proposal

[The recommended solution at high level. Name the sequencing logic if the work has stages.]

## Current State *(optional)*

[What exists today and how it works. A table of affected artefacts with their dependants.]

## Scope

### Includes

[Multi-topic: group under `#### T[N] — [topic] (ref: [design doc])` headings.]

- **F1** [product|internal] — `path/to/file`: [what changes]. [What it must NOT lose.] [Ref to the
  design section carrying its contract.]
  - **Produces:** [what a later F-block reads. Omit the line when nothing.]
  - **Consumes:** [that same string, verbatim] ([the earlier F-block that produces it]). [Omit when nothing.]
- **F2** [product|internal] — ...

### Does NOT Include (important!)

- [item explicitly out of scope, with the reason if non-obvious]

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| [question] | [choice] | [why this one, or the design doc that argues it] |

## Accepted Trade-offs *(optional)*

| We gain | We give up |
|---------|------------|

## Risks and Mitigations *(optional)*

| Risk | Probability | Mitigation |
|------|-------------|------------|
| [risk] | High/Medium/Low | [how to avoid — name the F-block or validation level that operationalizes it] |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| [file] | product/internal | create/modify/rename/remove | [why, with the F-block id] |

[The COMPLETE map. Any file an F-block touches and this table omits is a file the reviewer will miss.]

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

[IF the change touches feature/plugin injection: state the EXPECTED END-STATE MAP — which namespace
injects which sections into which resource, and the total count. The build must ASSERT the map.]

### L1 — [Unit / build-side] (RED → GREEN)

1. [assertion] *RED today: [why it currently fails].*

### L2 — [Integration]

1. [assertion]

### L[N] — Combination matrix *(optional — when more than one toggle exists)*

Assert the END STATE of every combination, not merely that a change happened:

1. **All toggle states** — every expected section exactly once, every unexpected one absent.
2. **Shared-anchor non-collision** — sections sharing an anchor all land, deterministically ordered.
3. **Partial disable** — disabling one leaves siblings byte-untouched.
4. **Order independence** — reversed enable order produces identical final bytes.
5. **Full round-trip** — enable everything, disable everything, bytes equal the pristine baseline.

### L[N] — Behavioural acceptance

1. [what the change must DO, not just what it must contain]

**RED expectations against the current tree:** [which levels fail today and why].
**GREEN = all levels pass after F1–F[N].**

---

## Execution Order

[Numbered or arrow form. Every F-block appears exactly once, with its layer tag.]

- **F1 first** because [dependency reason].

[State which boundaries leave the repo in a working state, so a build that must stop knows where.]

[State any per-F-block validation the build must run beyond the layer default.]

## Reviewer Handoff

The review command must be able to audit this without re-reading the design docs. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. [plan-specific gap]

## References *(optional)*

- Design set: [brainstorm paths]
- Prior art this plan builds on: [plan basename — what it established]

---

## Next Steps

/add-framework--build [slug]

[One command executes every F-block, whichever layer each is tagged. Do NOT route part of the plan to
a second command.]

## Plan Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial creation |
```

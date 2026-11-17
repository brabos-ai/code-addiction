# Plan: pm-refinement-standard (0081F) — the PM role says what a refined card must hold, the intent template carries "What we expect" and WHEN/THEN, and in a Notion project the card body is the intent

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-11-16
> **Delivery:** confirm
> **Backlog ID:** 0081F · **Release:** v1.10.0 · **Card:** https://app.notion.com/p/41ae0000aeae81bcbd34e8b3be3e1cd7

---

## Objective

[from the card body — no design document; copied verbatim, translated only in the line below]

> Todo card que passa por refinamento chega na engenharia como o card de um PM que sabe o que quer: qual é
> o problema, qual é o objetivo, quando é usado, como é a saída, como saber que está pronto e o que fica de
> fora. Tudo em visão de produto, nunca dizendo como implementar, e no próprio corpo do card.

(Every card that goes through refinement reaches engineering as the card of a PM who knows what they want:
what the problem is, what the objective is, when it is used, what the output looks like, how to know it is
done and what stays out. All of it from the product view, never saying how to implement, and in the card
body itself.)

**When this build is done:** `agent-mode/roles/product-pm.md` carries a "refined card" section naming the
six parts (Problem, Objective, What we expect, Decided, Open — each with a recommendation — and WHEN/THEN
acceptance criteria), the four parts of "What we expect", the fictitious-example and size rules, and the
rule that in a Notion project the card body is the intent with no subpage. The product intent template —
the `brainstorm-intent` schema — requires the same "What we expect" and WHEN/THEN sections, so a project
without Notion hands off the same shape in its intent file. `chief-engineer.md`, the agent-mode guide and
`add--agent-notion` stop naming a separate intent file as the Notion handoff. Tests in `cli/tests/` fail
if any of those parts disappears.

## Context

PM-refined cards reach engineering as loose text. `product-pm.md` (2.7 KB) covers commands, boundaries,
handoff, release and when to ask, but never says what a refined card must contain. The intent lived on a
subpage separate from the card: one more click, and the two drift apart.

**Every decision here was taken in the card. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `.codeadd/docs/brainstorming/pm-refinement-standard-intent.md` (the card body; also `/home/codeaddiction/terminals/intents/pm-refinement-standard-intent.md`) | Problem, objective, the example card, done criteria, out of scope, Decisions 1–11, `Em aberto: Nenhum` |

The intent file carries no `path:` and no `delivery:` frontmatter. Per `add-plan-authoring` that means
the full plan shape and `Delivery: confirm`. The run was unattended by instruction: STEP 4 printed no
questionnaire, and every leftover choice below is decided by the card's own recommendation and marked so.

## Global Constraints

- The intent is the card body, with no "intent" subpage. Its parts: Problema, Objetivo, O que esperamos, Decisões, Em aberto (each with a recommendation) and Critérios de aceite in WHEN/THEN (card, Decision 1)
- "O que esperamos" has 4 parts: momento de uso; exemplo concreto da saída marcado como fictício (arquivo, tela ou CLI); critério de pronto que o usuário consegue conferir; o que fica fora do card (card, Decision 2)
- Market research with sources only in an open feature; the card's size follows the delivery's size; a roadmap card stays short (card, Decision 3)
- Always the product view, never how to implement (card, Decision 4)
- The output example is mandatory in every card; in a bug or hotfix it is one line: the expected correct behaviour (card, Decision 8)
- Cards that already have an intent subpage stay as they are; the rule binds new cards (card, Decision 6)
- In a project without Notion the handoff stays the `/add-brainstorm` intent file plus the feature folder (card, Decision 11)
- No change to the Notion board or its properties, and no rewrite of existing cards (card, Fora do escopo)
- The role files never contain the word `board` (case-insensitive), `shaped` or `ticket` — `cli/tests/agent-mode.test.js` T1.5 forbids them; "Backlog" alone is allowed
- New tested behaviour is written strict TDD: the test is written first and seen RED against the tree before the change, then GREEN (operator rule for this plan)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **No refined-card standard.** `product-pm.md` names no part a refined card must hold, so cards arrive as loose text with no expected output and no done criterion.
2. **The intent template has no product-view expectation.** The `brainstorm-intent` schema (`add--doc-schemas/references/new-feature.md:207`) carries Objective · Decided · Open · Prior art · Rejected — no problem, no moment of use, no output example, no done criterion, no WHEN/THEN.
3. **The Notion handoff points at a separate intent file.** `product-pm.md` (17, 32–36, 50, 56–57), `chief-engineer.md` (34, 40–43, 51–56), the guide (`agent-mode/README.md` §9 and §10) and `add--agent-notion` (21) all name the intent file as the handoff, which is what produced the subpage beside the card.

## Proposal

Write the standard once in the PM role, and mirror its required parts in the one product intent template
there is — the `brainstorm-intent` schema — so a project with Notion (card body) and one without (intent
file) hand engineering the same shape. Then rewrite every place that names a separate intent file as the
Notion handoff, keeping the no-Notion handoff exactly as it is. Each change is driven by a test written
RED first.

Sequencing: the schema first (it is the shape the role points at), then its writer and its reader, then
the PM role, then the engineer role, the guide and the Notion skill, which only change how the handoff
is named.

## Current State

| Artefact | Today | Depth-1 dependants (graph) |
|---|---|---|
| `framwork/.codeadd/skills/add--doc-schemas/references/new-feature.md` (`brainstorm-intent`) | Five sections, no product-view expectation | `add--doc-schemas`: 27 → **HIGH**. Real readers of this one schema: `add-brainstorm` (writer, validation gate), `add--feature-specification` via `add-new` (reader, unchanged — additive sections) |
| `framwork/.codeadd/commands/add-brainstorm.md` | STEP `write-intent-file` lists what the file carries; bounded path's short design already has objective, who uses it, how it is tested | not queried as the subject; it changes in one paragraph — risk carried by the schema row |
| `framwork/.codeadd/agent-mode/roles/product-pm.md`, `chief-engineer.md`, `agent-mode/README.md` | Handoff = intent file + feature folder | NOT VERIFIED — `agent-mode/` is not a graph node (not registered in `provider-map.json`); readers are the agents told to read them and `cli/tests/agent-mode*.test.js` |
| `framwork/.codeadd/skills/add--agent-notion/SKILL.md` | "When NOT to Use" says the no-Notion handoff is the intent file; nothing says the card body is the intent | 0 → **LOW** |

Delivery index (layer `product`): `add--agent-notion` and `add--doc-schemas` have no entry by node. By
text, `2026-10-30T122030-PLAN--agent-mode-notion-simplify` (live) replaced `…--agent-mode-notion`
(superseded) and established the current skill; `2026-10-20T130553-PLAN--agent-team-roles` (live)
created the two role files. Nothing tried and dropped a refined-card standard.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/new-feature.md`, schema `brainstorm-intent`: Sections become **Problem · Objective · What we expect · Decided · Open · Acceptance criteria · Prior art · Rejected**. Depth floor adds: **Problem** — the user pain in product terms; **What we expect** — the four labelled parts of Decision 2, the output example marked fictitious, one line (the expected correct behaviour) for a bug or hotfix; **Acceptance criteria** — at least one `WHEN … THEN …` line, written as what the user checks; **Open** — each bullet now carries a recommendation. Hard bans add: an output example not marked fictitious; an acceptance criterion that names an implementation. Must NOT lose: the `None` rule for Open, the empty-reads-as-absent rule, the one-screen intent, the frontmatter line (`delivery: confirm|automatic` is asserted by `product-pipeline-parity` L1.4). No `{{doc-schema}}` bump (Validated Decisions).
  - **Produces:** `brainstorm-intent` sections `What we expect` and `Acceptance criteria`
- **F2** [product] — `framwork/.codeadd/commands/add-brainstorm.md`, STEP `add-brainstorm.write-intent-file`: the paragraph listing what the intent file carries names the problem, the four parts of "What we expect" and the WHEN/THEN acceptance criteria, because the validation gate it already runs — `add--doc-schemas` check 4, "Depth floors met" — walks every depth-floor fact F1 adds and would otherwise force the writer to invent a problem, an output example and WHEN/THEN lines the user never saw, or to write `unknown`. The bounded path's "short design in chat" names the output example and the done criterion beside "who uses it" and "how it is tested". Must NOT lose: the `## Open` `None` block, the validation gate, the spike rule.
  - **Consumes:** `brainstorm-intent` sections `What we expect` and `Acceptance criteria` (F1)
- **F3** [product] — `framwork/.codeadd/agent-mode/roles/product-pm.md`: a new H2 `## Refined card` (the four role headings T1.1 counts stay exactly once) naming the six parts of Decision 1, the four parts of Decision 2, Decisions 3, 4 and 8, and the fictitious example card from the card body as its illustration, translated to English with its content unchanged. It says the card body IS the intent in a Notion project, with no intent subpage, and that cards already holding a subpage stay as they are (Decision 6). It states the flow of Decision 7: PM refines in the card body → user reviews it in Backlog → `/add-new` → To do → handoff; and that the PM answers `/add-new`'s questions from the card body's Decided section. The handoff text the card cites as lines 17, 32–36, 50 and 56–57 (anchor on the text — the numbers shift once the new H2 lands; rewrite them first) changes per Decision 11: with Notion the handoff is the card (body = intent) plus the feature folder; without Notion it stays the intent file plus the feature folder. Must NOT lose: `/add-brainstorm`, `/add-new`, `-intent.md`, `about.md`, `never implements`, `otherwise the handoff is the intent` (T1.4, T1.5, L1.11).
  - **Produces:** `product-pm.md` section `## Refined card`
- **F4** [product] — `framwork/.codeadd/agent-mode/roles/chief-engineer.md`: the text the card cites as lines 34, 40–43 and 51–56 (anchor on the text, not the numbers) per Decision 11. With Notion, the engineer reads the card body (the intent) and the feature folder to run `/add-plan`; line 54 "no intent file is assigned to you" becomes "no card is assigned to you" in a Notion project, and stays the intent file without Notion. Must NOT lose: T1.3, T1.5 and L1.11 anchors.
  - **Consumes:** `product-pm.md` section `## Refined card` (F3) — the engineer role points at it for what a card holds, never restates it
- **F5** [product] — `framwork/.codeadd/agent-mode/README.md`, §9 (the two lines naming the intent-file handoff and "which engineer takes which intent file") and §10 (the closing "Without Notion" line): §10 says the card body is the intent and points at `roles/product-pm.md` § Refined card; §9 keeps the no-Notion handoff. Must NOT lose: T1.6 anchors (`section 2`, `-intent.md`, `/add-review`, both role paths) and L1.9 anchors.
  - **Consumes:** `product-pm.md` section `## Refined card` (F3)
- **F6** [product] — `framwork/.codeadd/skills/add--agent-notion/SKILL.md`: line 21 keeps the no-Notion handoff; the "Use the board, each day" section says the card body is the intent, filled in the shape of `product-pm.md` § Refined card, with no intent subpage, and that existing subpages are left alone. Must NOT lose: the Prohibitions block, the migration order, the instructions-only nature.
  - **Consumes:** `product-pm.md` section `## Refined card` (F3)

### Does NOT Include (important!)

- Saying in a card how to implement — that is the engineer's `/add-plan` (card, Fora do escopo)
- Changing the Notion board or its properties, and rewriting existing cards (card, Fora do escopo)
- The Grok Bot template (Decision 10): it is still pending and is not in this repository (no file names it). When it is written it follows `product-pm.md` § Refined card; this plan has nothing on disk to change
- Any change to `/add-plan` saving the intent copy on `codeadd-docs` (Decision 5 and 11: it "continua") — no F-block
- Changing how `/add-new` resolves an intent file: it still reads `*-intent.md`; in a Notion project the PM answers its questions from the card body
- A `{{doc-schema}}` bump or a migration of existing intent files
- Carrying the intent's "What we expect" and WHEN/THEN into `about.md` (`add--feature-specification`): the card names only the role and the template (Decision 5) and says the plan "pode referenciá-los" (Decision 9). Until a follow-up card takes it, `/add-new` in a project without Notion reads the new sections as context with no rule copying them — a known gap, recorded rather than built unasked

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Which file is "o template do intent"? | The `brainstorm-intent` schema in `add--doc-schemas/references/new-feature.md` | It is the only product intent template; `add-brainstorm` writes against it and validates. Keeping one shape for the card body (Notion) and the intent file (no Notion) is what Decision 11 needs. Alternative rejected: a card template only inside the PM role — the no-Notion handoff would carry none of the parts the done criteria require of "o template" |
| Map card part names onto the schema | Problema → Problem, Objetivo → Objective, O que esperamos → What we expect, Decisões → Decided, Em aberto → Open, Critérios de aceite → Acceptance criteria | Keeps the existing English section names `add--feature-specification` and `add-new` already read (`## Decided`, `## Open`) |
| Bump `{{doc-schema}}`? | No | The change is additive; an intent file is consumed once, and `add--feature-specification` reads only the sections it names, so an intent without the new ones reads as before. A bump would force a migration path for one-shot files |
| Carry WHEN/THEN into `about.md`? | No — out of scope, recorded as a follow-up | The card limits the change to the role and the template (Decision 5) and never names `add--feature-specification`. Plan review A1 |
| How does `/add-new` get a Notion card's decisions? | The PM runs `/add-new` and answers its questions from the card body's Decided section (role rule, F3); no command change | Card scope names only the role and the template; the PM role already says "decide alone when the answer is in the intent" |
| Grok Bot template | No F-block; recorded as out of scope | Not in the repository (unattended run: decided by the card's own "ainda pendente") |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One shape for both handoffs | The intent file grows by three sections, against its "one screen" goal — a roadmap card stays short (Decision 3) |
| No command change for the Notion flow | `/add-new` in a Notion project still asks its questions; the PM answers them from the card |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `add-brainstorm`'s validation gate fails on intents written before F2 collects the new parts | Medium | F2 lands in the same build as F1; L1.2 asserts the writer names every new part |
| Existing role/guide tests (T1.4–T1.6, L1.9, L1.11) break when the handoff text changes | Medium | Each F-block lists the anchors it must keep; L1 runs the full `agent-mode*.test.js` |
| Role text uses "board" and trips T1.5 | Medium | Global constraint; T1.5 stays in the run |
| The Refined card section turns into implementation guidance | Low | L1.3 asserts the "never how to implement" rule is present; L3 cold read checks the example |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--doc-schemas/references/new-feature.md` | product | modify | F1 |
| `framwork/.codeadd/commands/add-brainstorm.md` | product | modify | F2 |
| `framwork/.codeadd/agent-mode/roles/product-pm.md` | product | modify | F3 |
| `framwork/.codeadd/agent-mode/roles/chief-engineer.md` | product | modify | F4 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F5 |
| `framwork/.codeadd/skills/add--agent-notion/SKILL.md` | product | modify | F6 |
| `cli/tests/agent-mode.test.js` | product | modify | L1.3–L1.6 (F3, F4, F5) |
| `cli/tests/agent-mode-notion.test.js` | product | modify | L1.7 (F6) |
| `cli/tests/product-pipeline-parity.test.js` | product | modify | L1.1–L1.2 (F1, F2) |

AGENTS.md: not changed — it names no intent section and no handoff shape.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write each level BEFORE its F-block lands and run it against the current tree
— it must fail. Then drive it GREEN. `npm --prefix cli test -- <file>` per file.

### L1 — Content tests (RED → GREEN)

1. **(F1)** `product-pipeline-parity.test.js`: the `brainstorm-intent` Sections line names, in order, `Problem`, `Objective`, `What we expect`, `Decided`, `Open`, `Acceptance criteria`, `Prior art`, `Rejected`; the schema text names the four parts (moment of use, output example, done when, out of scope), the word `fictitious`, `WHEN` and `THEN`, and that each Open item carries a recommendation; the existing L1.4 assertions still pass. *RED today: the Sections line is `Objective · Decided · Open · Prior art · Rejected`.*
2. **(F2)** same file: `add-brainstorm.md`'s write-intent-file step names `Problem`, `What we expect` and `Acceptance criteria`, and the bounded path's short design names the output example and the done criterion. *RED today: the file names none of them.*
3. **(F3)** `agent-mode.test.js`: `product-pm.md` has exactly one `## Refined card` heading; inside it: Problem, Objective, What we expect, Decided, Open, Acceptance criteria, `WHEN`, `THEN`, the four parts, `fictitious`, the bug/hotfix one-line rule, the open-feature-only market research rule, a never-how-to-implement sentence, and "card body" with "no subpage"/"no intent subpage". T1.1–T1.5 and L1.11 unchanged and GREEN. *RED today: no such heading.*
4. **(F3)** same file: `product-pm.md` names the flow `Backlog` → `/add-new` and says cards with an existing intent subpage stay as they are. *RED today.*
5. **(F4)** same file: `chief-engineer.md` names "card body" for a Notion project and contains `no card is assigned`; it still names `-intent.md` for the no-Notion case. *RED today: only "no intent file is assigned".*
6. **(F5)** same file: guide §10 names `card body` and `roles/product-pm.md`; T1.6 and L1.9 still GREEN. *RED today.*
7. **(F6)** `agent-mode-notion.test.js`: `add--agent-notion` "Use the board, each day" section names `card body`, `Refined card` and that no intent subpage is created; the existing `F4 — add--agent-notion` describe block still GREEN. *RED today.*

### L2 — Build

1. `node scripts/build.js` exits 0 with no new warning; `npm --prefix cli test` is fully GREEN (the agent-mode, notion, parity, doc-schema and inventory suites included).

### L3 — Behavioural acceptance

1. **Cold read of the example card (card done criterion 5).** Dispatch a cold reader (read-only, no other context) over `product-pm.md` § Refined card's example and ask it to state what must be delivered. Pass: it names the saved draft, the reopen-in-the-same-state outcome, the < 2 s done criterion and the excluded co-editing, and marks no gap it filled itself. It is given the one example and nothing else and answers in one pass — the card's "menos de 2 minutos" is read as a single read with no follow-up lookup. The build records the reader's answer in the ledger.
2. **Product view only.** A read of the six F1/F3 sections finds no file path, function, library or schema detail presented as something the card must specify.

**RED expectations against the current tree:** L1.1–L1.7 fail today. **GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6.

- **F1 first** — it is the shape F2 writes.
- **F2 next** — writer and schema must agree before any build ships them; after F2 the repo is coherent for projects without Notion.
- **F3 before F4–F6** — they point at its `## Refined card` section and must not restate it.
- Every boundary after F2 leaves the repo working; a build that must stop stops there.
- Each F-block runs its own L1 item RED before the change; L2 runs after F6; L3 runs once, after F6.

## Reviewer Handoff

For each F-block the build leaves in its ledger: files touched, the L-level that covers it with its RED and GREEN state, and any departure from the card with the Decision it departs from.

Gaps a reviewer must actively hunt:

1. An L1 item never seen RED — a test written after the text proves nothing.
2. A role or guide line that still names a separate intent file as the Notion handoff (Decision 11's listed lines).
3. The no-Notion handoff weakened — it must still be the intent file plus the feature folder.
4. Implementation advice slipped into the Refined card section or the schema (Decision 4).

## References

- Prior art: `2026-10-20T130553-PLAN--agent-team-roles` (role files), `2026-10-30T122030-PLAN--agent-mode-notion-simplify` (`add--agent-notion`)
- Sibling v1.10.0 plan: `2026-11-16T203957-PLAN--docs-search-precision`

---

## Next Steps

/add-framework--build .codeadd/docs/plans/2026-11-16T204659-PLAN--pm-refinement-standard.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-16 | Initial creation |
| 2026-11-16 | Plan review fix-then-ok: removed the `add--feature-specification` F-block (scope beyond the card, A1) and renumbered the rest; F2 names the gate check it serves (A2); example card translated to English (A3); L3.1 states the 2-minute reading (A4); anchors on the "Use the board, each day" heading and on text instead of line numbers (N1, N2) |

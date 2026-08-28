# New-Feature Category — Schemas & Voice

Category file for the new-feature lifecycle: discovery, specification, planning, design, exploratory ideation. Universal rules (output-length doctrine, language, formatting, ID convention, validation gate) live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns only what is specific to new-feature docs — section-shape conventions, requirement notation, decision notation, scope notation, and voice rules shared across the five schemas below.

**Schemas in this category:** `feature-about`, `feature-plan`, `feature-design`, `brainstorm`, `epic`.

## Shared Notation

These notation rules apply to every schema in this category. A schema may extend them but MUST NOT contradict them.

### Requirement Notation

Use stable IDs so specs can be referenced from plans, tests, and reviews.

```
- **[ID]:** [actor] [action] [object] [condition/context]
```

IDs are per-doc, monotonically increasing. Prefixes:

| Prefix | Kind |
|---|---|
| `RF` | Functional requirement |
| `RNF` | Non-functional requirement (performance, security, reliability) |
| `RN` | Business rule |

**Examples:**

```
- **RF01:** User can mark a notification as read with a single click.
- **RF02:** System groups notifications of the same type within a 24h window.
- **RNF01:** The list loads in under 200ms for up to 100 items.
- **RN01:** An unread notification older than 30 days is archived automatically.
- **RN02:** Free-plan users are capped at 50 stored notifications.
- **RN03:** Security notifications are always sent by email in addition to in-app.
```

Keep each line self-contained. If a requirement needs more than one line, split it or promote it to a sub-heading — do not bury conditions in prose.

### Decision Notation

Every non-trivial decision carries the alternative that was rejected and why. A decision without an alternative is a preference, not a decision.

**Table form (default):**

```markdown
| Decision | Rationale | Alternative rejected |
|---|---|---|
| WebSocket | Real-time without polling overhead | SSE — weaker mobile support |
| PostgreSQL | Already in the stack | MongoDB — adds operational surface |
```

**Expanded form (when the decision is load-bearing):**

```markdown
### Decision: [title]

**Context:** [what made this decision necessary]

**Options considered:**
1. **[Option A]** — [description] — pros / cons
2. **[Option B]** — [description] — pros / cons

**Choice:** [Option X], because [primary reason].

**Consequences:** [downstream impacts, constraints it introduces].
```

Use the expanded form only when the table form would lose information — typically architectural choices with long-lived consequences.

### Scope Notation

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

### Brainstorm Voice

Brainstorm docs capture exploration, not decisions. Voice rules:

- **User-perspective language.** Describe the pain the user feels, not the system behaviour. Save the technical vocabulary for plan/design.
- **Pros and cons for every candidate direction.** Directions without a cons list are proposals in disguise.
- **Open threads explicit.** Any unresolved question blocks commitment. Naming it is the point.
- **No verdict.** The doc closes with open threads and a pointer to the next command (`/add.new`, `/add.plan`), not with "we will build X".

## Schemas

### feature-about

For `/add.new` (creates `docs/features/<slug>/about.md`).

- **Frontmatter:** `id: [NNNN]F`, `type: feature-about`, `slug:`, `status:`, `branch: [type]/[NNNN][L]-[slug]`, `related: []`
  - **`branch:`** (required for new docs) — the branch `/add.build` will create. Post-`/` slug MUST equal the docs dir name (Hard Invariant). Decided once by `/add.new` with full discovery context; immutable thereafter (`build-setup.sh` executes it verbatim).
- **Sections (ordered):** TL;DR · Problem · Users · Scope (Includes / Does NOT Include) · Success Metrics · References
- **Depth floor:**
  - **Problem** — who is affected, what breaks or is missing, observable signal/evidence, current workaround if any.
  - **Users** — for each role: role name, goal with this feature, current pain.
  - **Scope** — explicit in/out lists per Scope Notation above. "Does NOT Include" must cover the three most likely scope-creep requests with reasoning (one line each).
  - **Success Metrics** — per metric: definition, target, measurement source. No vanity metrics.
  - **References** — every external doc, issue, PRD, or prior feature that informed this spec.
- **Compression:** Users = table `role | goal | pain`. Metrics = table `metric | target | source`. Problem = topic sentence + extractive bullets. Requirements (when present) use Requirement Notation above. References = `{{doc:}}` / URL list.
- **Hard bans:** aspirational language, inline design/UI details, code snippets.
- **Avoid unless load-bearing:** roadmap prose; long historical narrative (link to prior doc instead).

### feature-plan

For `/add.plan` (feature mode, creates `docs/features/<slug>/plan.md`).

- **Frontmatter:** `id: [NNNN]F` (same as about), `type: feature-plan`, `related: [[NNNN]F]`
- **Sections:** TL;DR · Context (link `{{doc:[NNNN]F}}`) · Architecture Decisions · Tasks · Risks · Validation
- **Depth floor:**
  - **Context** — one paragraph summarizing the about.md hook + what this plan adds on top. Not a restatement.
  - **Architecture Decisions** — per decision: the choice, the real rationale (not "because it's clean"), at least one alternative considered and why rejected, and the constraint that made it necessary. Use Decision Notation above.
  - **Tasks** — each task has: area, action, acceptance signal (how you'll know it's done). Ordered by dependency. `tasks.md` itself is owned by `{{skill:add-tasks-checklist/SKILL.md}}` — this Plan section is a higher-level breakdown that feeds into it.
  - **Risks** — per risk: probability estimate, impact if it fires, concrete mitigation or monitoring hook.
  - **Validation** — the exact checks (tests, manual steps, metrics) that gate "done".
- **Compression:**
  - Decisions = table `decision | rationale | alternatives rejected | triggering constraint`.
  - Tasks (inline) = `- [ ] area: action — signal` bullets.
  - Tasks (when referenced by ID elsewhere) = minified JSON: `[{"id":1,"area":"backend","task":"create NotificationEntity","signal":"migration + unit test","estimate":"S"}]`. Estimates use S/M/L; never hour estimates.
  - Risks = table `risk | prob | impact | mitigation`.
  - Path / dep / config blocks = minified JSON, one line per logical object: `{"files":{"create":["path/a.ts"],"modify":["path/existing.ts"]}}`, `{"deps":{"npm":["package@version"],"internal":["@add/domain"]}}`, `{"config":{"env":["VAR_NAME"],"files":["path/config.ts"]}}`. Pin versions (no `^` or `~`). Never inline secret values — names only.
  - Flow notation = arrow chains: `request → validate → enqueue → send → callback`. Branches as sub-lines. Keep flows compact per line; split by sub-heading when one line covers too many steps.
- **Hard bans:** duplicating about.md problem statement verbatim; tasks without an acceptance signal; rules or rationale inside JSON objects (rules belong in tables/prose); pretty-printed JSON in the doc.
- **Avoid unless load-bearing:** narrative rationale outside the decisions table.

### feature-design

For `/add.plan` STEP 8.1 — the sole writer of this doc, through the UX pipeline (`@ux-flow-agent` → `@ux-layout-agent` → `@ux-agent` critique → coordinator consolidation).

**Location.** Subfeature-scoped by default: `<feature-dir>/subfeatures/SFxx-<slug>/design.md` when the feature is an epic, `<feature-dir>/design.md` otherwise. Consumers resolve the SF-level file first and fall back to the feature-level one (legacy path, and the shape produced before designs became SF-scoped).

- **Frontmatter** — the exact block both callers write, verbatim:

```yaml
---
id: [NNNN]F            # SF-qualified as [NNNN]F-SFxx when the design is scoped to a subfeature
type: feature-design
created: YYYY-MM-DD    # today on FIRST write; NEVER overwritten on a re-run
updated: YYYY-MM-DD    # today, on EVERY write
related: [[NNNN]F]
provenance: sha256:<hash of the about.md bytes the design was derived from>
---
```

  `id` follows `{{skill:add-id-convention/SKILL.md}}`. `provenance` is the ONLY freshness signal (never mtime, never git status, never "it looks recent") — `/add.plan`'s design gate skips regeneration on a provenance match. ⛔ **Provenance truthfulness:** the hash asserts that the temps just consolidated were derived from the CURRENT `about.md`. It is true only because the authoring dispatches always re-ran — never stamp it over a reused or partially stale temp, or the design gate skips regeneration forever after.

- **Consolidation contract.** `design.md` is written by the COORDINATOR, never by re-dispatching an authoring agent to apply the critique: read the four temps (`design-context.md`, `design-flow.md`, `design-layout.md`, `design-review.md`); decide EVERY critique item `accepted`/`rejected` with a one-line rationale and apply the accepted ones while writing; validate coherence (every classified action has a UI element, every screen a layout, entry points match navigation) and fill the gaps found; write the doc; append `## Design Review`; run this schema's validation gate; only then delete the temps. Keep the prose extractive throughout — tables, bullets, `step → step` sequences, minified JSON for tokens (see Compression below). Change this shape HERE, never in the command.
- **Sections:** TL;DR · TOC · Screens · Components · Flows · Tokens · Design Contract · References · Design Review. The section's exact heading is `## Design Contract` (pre-referenced by `add.build.md`'s domain-scoped priority rule — must match verbatim); it sits after `Tokens` (it inherits and restates the token/scale commitments declared there) and before `References`.
- **TOC:** always present — the section list exceeds 3 H2s, so the universal TOC rule in `{{skill:add-doc-schemas/SKILL.md}}` applies unconditionally to this schema.
- **Depth floor:**
  - **Screens** — per screen: purpose, primary action, entry points, empty/loading/error states noted, plus the layout tree (see Compression below).
  - **Components** — per component: name, source (shadcn path or `new`), props if new, states it owns, and what it is composed of (child components, named from the real inventory in `design-context.md`).
  - **Flows** — the critical user journeys as `step → step → step` with decision branches annotated; a branching journey may instead use a Mermaid `flowchart` block (see Compression below).
  - **Tokens** — any non-default tokens the feature introduces (colors, spacing, breakpoints).
  - **`## Design Contract`** — per dimension this feature commits to: what it declares, how it is verified, by what method. Values are inherited from `design-context.md` — this section restates only this feature's commitments and justified deviations. A project dimension left undefined is written `unknown — <why>`, never invented.
  - **References** — design-system doc, inspiration links, related feature designs.
  - **Design Review** — the critic's decision trail: table `Item | Severity | Decision | Rationale`, one row per defect the critique raised, each `accepted`/`rejected` with a one-line rationale. An empty critique yields the row-free section carrying the critic's rubric-by-rubric justification in one line.
- **Compression:**
  - Screens = table `screen | purpose | primary action | entry` plus one minified JSON **layout tree** per screen: `{"screen":"<id>","regions":[{"role":"header","order":1,"span":{"mobile":"full","desktop":"full"},"component":"<real component name>","contains":["..."],"primaryCta":"<action id, on the region that holds it>"}]}`. Regions/roles/spans/order/component names ONLY — no CSS, no `px`, no per-element styling in the tree.
  - Components = bullets `name — source — props/states — composed-of: [child component names]`.
  - Flows = sequence lines (arrow notation as in `feature-plan` above) for linear flows; a Mermaid `flowchart` block is permitted for branching journeys (neither inline SVG nor ASCII — see Hard bans).
  - Tokens = minified JSON.
  - Design Contract = markdown table only, columns `Dimension | Declares | Verified by | Method`. Only dimensions with a named verification method belong — the verifiability rule; a claim with no verification method (e.g. "uses TanStack Query") is a plan concern, not a contract line.
  - Design Review = table only.
- **Hard bans:** inline SVG, ASCII wireframes (the layout tree above replaces wireframes), fabricated component libraries, per-element styling in the layout tree (no CSS, no `px` — regions/roles/spans/order/component names only), a `Design Review` section that omits the rationale column.
- **Avoid unless load-bearing:** multiple canonical examples per component (one suffices).

### brainstorm

For `/add.brainstorm` (creates `docs/brainstorm/YYYY-MM-DD-<slug>.md`). Date prefix is mandatory for chronological tree ordering.

- **Frontmatter:** `id: BRN-<slug>`, `type: brainstorm`, `related: []`
- **Sections:** TL;DR · Questions Explored · Candidate Directions · Open Threads
- **Depth floor:**
  - **Questions Explored** — the actual open questions the session surfaced.
  - **Candidate Directions** — per direction: one-line summary, pros, cons, open issues. Enough for a future plan to pick it up without re-discovering.
  - **Open Threads** — unresolved questions that must be decided before committing to a direction.
- **Compression:** bullets only. Directions = `name — summary — pros/cons — open issues`. Voice follows Brainstorm Voice rules above.
- **Hard bans:** committing to implementation, final decisions (those belong in plan), technical jargon that obscures the user-perspective framing, full class/method implementations or multi-line code blocks (a single illustrative one-shot snippet is allowed to anchor a direction).

### epic

For `/add.new` STEP 5 (creates `docs/features/<slug>/epic.md` when the feature decomposes into subfeatures). Row `status` is updated by `/add.build` STEP 16 (block 14.3) and by `/add.plan-to-ready`'s checkpoint step; the `checkpoint` cell is written **only by whoever creates the checkpoint commit and its tag**. Read by `/add.plan` STEP 8.0, `/add.done` STEP 4.1, `status.sh`, and `converge-gates.sh`.

**Compatibility.** `/add.new` STEP 5 has always written this doc freeform ("subfeature table + order + notes" — no fixed frontmatter, TL;DR, or section headings). This schema is additive: every existing `epic.md` is valid as written, nothing gets rewritten. Universal Document Requirements (frontmatter, TL;DR, TOC) bind schema-aware writes going forward; a pre-schema doc missing any of them is read as-is — warn, never fail. The one contract that already binds every `epic.md`, old or new, is the Subfeatures row shape below.

**Reading a legacy table.** `/add.new` STEP 5 never specified a header, so pre-schema docs carry whatever header that run invented. Consumers resolve columns **by header name**, and apply exactly one rule for the legacy case: *a data row with more cells than the header declares has its trailing extra cell read as `checkpoint`* — that cell is the only one `/add.build` STEP 16 has ever appended (block 14.3 turns a 4-cell `pending` row into a 5-cell `done` row). One deterministic rule, no inspection of cell contents. A schema-conforming doc never hits it, because its header declares every column it uses.

- **Frontmatter:** `id: [NNNN]F` (same as about), `type: epic`, `related: [[NNNN]F]`
- **Sections:** TL;DR · Subfeatures · Order (optional) · Notes (optional)
- **Depth floor:**
  - **Subfeatures** — one markdown table with a **required header row naming every column it uses**, then one row per subfeature. The header is what makes this table machine-readable and is the single thing this schema adds that `/add.new` never had. Columns: `id` (`SFxx`, zero-padded, unique, ascending), `name`, `objective`, `status` (required — exactly one of `pending`, `in_progress`, `done`, the literal values `status.sh` and `/add.build` STEP 16 block 14.3 grep for; no others), `dependencies` (**optional** — comma-separated `SFxx` ids this row depends on; absent cell = no dependencies), `checkpoint` (**optional** — the checkpoint tag name minus its `checkpoint/` prefix, shape `<FEATURE_ID>-<SFxx>-done`, written by the command that creates the checkpoint commit the tag points at — `/add.build` never commits, so it never writes this cell; absent cell = no checkpoint recorded yet). Both optional columns are resolved **by header name**, never by guessing at cell contents — see the Compatibility rule above for the one legacy case where a header is absent or short.
  - **Order** (when present) — legacy narrative dependency order (`1. SF01 (no deps)`, `2. SF02 (depends on SF01)`); superseded by the `dependencies` column but still valid on existing docs. Resolve order from `dependencies` when populated, from this section otherwise.
  - **Notes** — anything not captured by the table (cross-SF constraints, shared resources). Extractive bullets only.
- **Compression:** Subfeatures = markdown table `id | name | objective | status | dependencies | checkpoint`. Order = numbered list, one SF per line. Notes = bullets.
- **Hard bans:** a `status` value outside `pending`/`in_progress`/`done`; a `dependencies` cell naming an id absent from the table; a dependency cycle (an epic whose order cannot be resolved is invalid at the document, not at the loop); a duplicate subfeature `id`; hand-editing `checkpoint` (machine-written only, and only by the command that made the commit it names — a checkpoint cell naming a tag that resolves to no commit is the defect this column exists to make visible).

## Anti-Patterns

| Wrong | Right |
|---|---|
| Long paragraphs explaining requirements | Bulleted `**[ID]:**` lines per Requirement Notation |
| "The system should be fast" | `**RNF01:** response under 200ms` |
| Decisions without alternatives | Table row with rejected alternative |
| Edge cases described but not handled | `**[case]:** [defined handling]` |
| Vague acceptance criteria | Verifiable, testable criteria |
| Technical jargon in brainstorm | User-perspective language |
| Scope list with no exclusions | Explicit "Does NOT Include" with reasons |
| Dropping requirement conditions to shorten the line | Keep the condition; split the line if needed |
| "Several files will be created" | `{"create":["path/a.ts","path/b.ts"]}` |
| Paragraphs describing structure | JSON with explicit paths |
| Tasks without estimates or signals | `task — signal — estimate` |
| Pretty-printed JSON spanning many lines | Minified, one line per object |
| Rules or rationale inside a JSON object | Markdown table or prose |
| Version ranges (`^1.2.0`) in plans | Pinned versions (`1.2.0`) |
| Hour estimates | S/M/L |

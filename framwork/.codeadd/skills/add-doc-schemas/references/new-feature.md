# New-Feature Category — Schemas & Voice

Category file for the new-feature lifecycle: discovery, specification, planning, design, exploratory ideation. Universal rules (output-length doctrine, language, formatting, ID convention, validation gate) live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns only what is specific to new-feature docs — section-shape conventions, requirement notation, decision notation, scope notation, and voice rules shared across the four schemas below.

**Schemas in this category:** `feature-about`, `feature-plan`, `feature-design`, `brainstorm`.

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

For `/add.design` (creates `docs/features/<slug>/design.md`).

- **Frontmatter:** `id: [NNNN]F`, `type: feature-design`, `related: [[NNNN]F]`
- **Sections:** TL;DR · Screens · Components · Flows · Tokens · References
- **Depth floor:**
  - **Screens** — per screen: purpose, primary action, entry points, empty/loading/error states noted.
  - **Components** — per component: name, source (shadcn path or `new`), props if new, states it owns.
  - **Flows** — the critical user journeys as `step → step → step` with decision branches annotated.
  - **Tokens** — any non-default tokens the feature introduces (colors, spacing, breakpoints).
  - **References** — design-system doc, inspiration links, related feature designs.
- **Compression:** Screens = table `screen | purpose | primary action | entry`. Components = bullets `name — source — props/states`. Flows = sequence lines (arrow notation as in `feature-plan` above). Tokens = minified JSON.
- **Hard bans:** inline SVG, ASCII wireframes, fabricated component libraries.
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

# Brainstorm 03: Layout Proposal Notation & The Measurable Design Contract

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** skill + schema (+ agent behaviour)
> **Layer:** product (`framwork/.codeadd/`)
> **Umbrella:** `2026-07-26-00-qa-ux-umbrella.md` · **Depends on:** `02` · **Blocks:** `04`

## Discovery

- **`feature-design` schema** (`add-doc-schemas/references/new-feature.md`) — sections `TL;DR · Screens · Components · Flows · Tokens · References`. Compression: `Screens` = table `screen | purpose | primary action | entry`; `Components` = bullets `name — source — props/states`; `Flows` = arrow-notation sequence lines; `Tokens` = minified JSON. **Hard bans: inline SVG, ASCII wireframes, fabricated component libraries.**
- **`add.design` STEP 6 / LAYOUT dispatch** — task bullets mandate *"ASCII layout per screen (mobile-first 320px, md/lg breakpoint notes)"*, output `design-layout.md`, consolidated into `design.md`. **This directly violates the schema it must pass at STEP 9.**
- **`add-doc-schemas` anti-patterns table** — *"Paragraphs describing structure → JSON with explicit paths"*, *"Pretty-printed JSON spanning many lines → Minified, one line per object"*, *"Rules or rationale inside a JSON object → Markdown table or prose"*.
- **`add.qa-setup` STEP 3** — installs `@playwright/test` (mandatory) and chromium, each **functionally verified** by trivial invocation. The generated `qa-project` skill carries the screenshot API and the Managed App Lifecycle.
- **`add-qa` skill** — prior decision: *"There is no pixel-diff and no Figma baseline — fidelity is agent judgement against `design.md`."* Viewports `desktop 1440 / tablet 768 / mobile 375` from `config.json`.
- **`qa-agent` Axis 1** — judges *"layout / hierarchy / spacing / alignment, design tokens / colors / typography, a single primary CTA where the design calls for it, and the correct state"* — all against prose.
- **`add.design` STEP 3.6** — already writes `design-context.md` as extractive JSON: `theme.colors`, `theme.spacing`, `theme.fonts`, `theme.radius`, `darkMode`, `layout.shell/sidebar/topbar/contentMaxWidth`, `components[]`, `constraints[]`.
- **`add-ux-design` skill** — mobile-first from 320px, WCAG 2.1 AA minimum, prefer shadcn/Tailwind over custom.

## Context & Motivation

Two problems converge on the same artefact.

**The schema and the command contradict each other.** `add.design` is instructed to produce ASCII wireframes; the `feature-design` schema hard-bans them; STEP 9 then runs a validation gate against that schema. The gate either passes something it should reject or the command cannot complete. This has been latent because the ASCII lives mostly in the temp `design-layout.md` and gets lossily paraphrased at consolidation — meaning the most detailed layout information the agents produce is **thrown away** before the judge ever sees it.

**Prose cannot be measured.** The umbrella reframes pixel-perfect as *measurable conformance to a declared design system*. That only works if `design.md` declares values a reviewer can check against a screenshot. Today it declares intent ("clear hierarchy", "adequate spacing"), which is why the QA UX axis is the weakest of the four.

The owner additionally asked for the layout proposal to use current agent-native techniques rather than ASCII — any free, non-paid-tool approach the market has adopted.

## Problem / Opportunity

| Problem | Effect |
|---|---|
| ASCII wireframes are mandated by the command and banned by the schema | The validation gate is either dishonest or blocking |
| Layout detail is produced in temps then paraphrased away at consolidation | The judge never receives the most precise information available |
| ASCII is imprecise and drifts | Column widths, alignment, and spacing cannot be expressed reliably in monospace |
| `design.md` declares intent, not values | No conformance judgement is possible; "pixel perfect" stays out of scope |
| The critic reviews prose | Weakest possible modality for a visual artefact — and asymmetric with the post-delivery reviewer, who reviews images |
| `@playwright/test` + chromium are installed and idle at design time | A rendering capability the framework already paid for goes unused before implementation |

## Proposed Solution

Three layers. The first two change what `design.md` contains; the third changes how the proposal is critiqued.

### Layer 1 — Layout notation: structured tree, not wireframe

Replace ASCII with two normative, schema-legal forms.

**Layout tree** — a nested region structure per screen, expressed as minified JSON per the schema's compression rules. Each region declares its role, order, span behaviour per breakpoint, and the component that fills it. This is diffable, unambiguous, and directly consumable by `@frontend-agent`.

```json
{"screen":"entry-form","regions":[{"role":"header","order":1,"span":{"mobile":"full","desktop":"full"},"component":"DialogHeader","contains":["title","close"]},{"role":"body","order":2,"span":{"mobile":"full","desktop":"2col"},"component":"Form","contains":["amount","category","date","notes"]},{"role":"footer","order":3,"span":{"mobile":"full","desktop":"full"},"component":"DialogFooter","contains":["cancel","submit"],"primaryCta":"submit"}]}
```

**Component composition** — the existing `Components` bullets gain the composition relationship, so the layout is expressed as a tree of *named components from the real library* rather than boxes. This is why the schema bans "fabricated component libraries": composition is only meaningful against the inventory `@ux-flow-agent` collected in `design-context.md`.

**Flows** stay in arrow notation when linear; a **Mermaid `flowchart`** is permitted when the journey has branches, since Mermaid is free, text-based, and renders natively in GitHub and most Markdown viewers. Mermaid is neither inline SVG nor an ASCII wireframe, so no schema ban is touched.

### Layer 2 — The measurable design contract

A new `## Design Contract` section in `design.md`, carrying **only values a run can verify**.

**Format is a markdown table, not JSON.** `add-doc-schemas:59` states *"JSON = DATA. Markdown = INSTRUCTIONS. … Rules, instructions, orientation, constraints, and behavioral guidance MUST use markdown. Never put rules inside JSON objects."* Every contract dimension below is a constraint the implementation must satisfy, so JSON would violate the rule. Pure data the contract *references* — the inherited token set, the spacing steps — stays minified JSON in the existing `Tokens` section. (The earlier draft justified JSON by citing the anti-pattern *"Paragraphs describing structure → JSON with explicit paths"*; that licenses JSON for structure, not for rules.)

Each dimension declares **how it is verified**, because "judge it from a PNG" is not a capability that reliably exists. A vision model cannot measure pixel gaps, read a computed `font-size`, sample exact RGB pairs, or compute a 4.5:1 ratio — and full-page screenshots are downscaled before the model sees them, so every pixel claim carries an unknown scale factor. Dimensions are therefore split by **verification method**:

| Dimension | Declares | Verified by | Method |
|---|---|---|---|
| Spacing scale | the permitted step set | computed style | captured `gap`/`margin`/`padding` values compared to the step set |
| Token allowlist | colour/type tokens this feature may use | computed style | resolved custom-property names, not sampled pixels |
| Typographic scale | permitted sizes/weights per role | computed style | captured `font-size`/`font-weight` |
| Grid / container | max width, gutters, columns per breakpoint | computed style | captured container width + column count |
| Minimum tap target | e.g. 44px | **axe-core** (`target-size`) | deterministic rule, already owned by `@qa-agent` |
| Contrast target | WCAG level | **axe-core** (`color-contrast`) | deterministic rule, already owned by `@qa-agent` |
| Breakpoint behaviour | per screen, what reflows at each viewport | screenshot | agent judgement — did the declared reflow happen |
| Required states | per screen: which of `empty`/`loading`/`error`/`success` must exist | evidence set | set comparison of captured state files; no vision needed |
| Primary CTA count | per screen, normally 1 | screenshot | agent judgement — how many actions read as primary |
| Visual hierarchy | intended reading order | screenshot | agent judgement |
| Optical alignment | baselines, icon/label pairing | screenshot | agent judgement |

The consequence for `04`: **the conformance axis is mostly deterministic, and the agent judges only what genuinely needs eyes.** The `<surface>.qa.spec` that `@e2e-agent` already authors must additionally capture the computed-style values the contract names, alongside the screenshots. That is a cheap, exact capture and it converts "measure from an image" into "compare two numbers".

**The verifiability rule:** a line belongs in the contract only if it names a verification method from the table above. "Uses TanStack Query" is a plan concern and has none. This keeps the section from degenerating into a second copy of the plan **and** from declaring checks nothing can perform.

Where a project has not defined a dimension (no spacing scale exists), inherit what exists and flag the rest as a gap — never invent a scale. Same discipline as `add.qa-setup` STEP 7 flagging thin designs.

Most values are **inherited** from `design-context.md` (the project's existing tokens, spacing, breakpoints) — the contract restates only what this feature commits to, plus any deviation, with the deviation justified. That keeps the block short and makes drift visible.

`screens.json`'s `expect` field (`"what a correct render looks like"`) derives from this section rather than being written freehand.

### Layer 3 — Rendered mock critique: **cut**

An earlier draft proposed that `@ux-layout-agent` write a throwaway static HTML mock per screen, screenshot it headless with the already-installed `@playwright/test` + chromium, and have `@ux-agent` critique the image instead of the prose. Adversarial review killed it on four independent grounds, each sufficient:

1. **It is circular, not "the same modality".** The layout agent would author the mock *from its own `design-layout.md`*, then the critic would measure that render. A defect in the spec is faithfully reproduced by the mock, so the render can only surface transcription errors — never spec errors, which is the entire point of a critique. The delivery review compares *implementation vs contract*; a mock review compares *a spec against a rendering of that same spec by its own author*.
2. **The tooling is not there at plan time.** `@playwright/test`, chromium, **and** `docs/qa/config.json` (which supplies the viewports) are installed exclusively by `/add.qa-setup`, which is not in the canonical flow and is not a prerequisite of `add.plan`. On any project that has not run it, the mechanism never fires — including the default install that `01` deliberately preserves.
3. **It violates `add.plan`'s own invariant.** `add.plan.md:42`: *"NEVER write implementation code in plan.md (only contracts, schemas, structure)"*, and STEP 8 temp output is fixed to `plan-[area].md`. This document's own Alternatives table rejects an HTML/Tailwind skeleton for contradicting *"NO code examples, only structure"* — then reinstated it as a mock.
4. **Its own risk table conceded the outcome.** "The mock is mistaken for a fidelity target and the critic raises cosmetic findings" was rated **High**, mitigated by instructing the critic to disregard most of what it sees. A mechanism whose likely output must be largely discounted does not pay for its cost.

**What survives:** the critique reads the layout tree, the composition, and the contract — structured, diffable artefacts. State-completeness is a set comparison against the layout tree and needs no browser. The one genuinely visual check, hierarchy, is judgement rather than measurement and does not improve by being applied to a self-authored render.

**Where a render *is* non-circular:** against the real implementation. That is what `add.qa` already does, and `04` is where it belongs.

This removes `03`'s dependency on `add.qa-setup`, on chromium, and on `config.json`; deletes the `_design-mock/` write surface and the proposed `.gitignore` edit; and leaves `04` unaffected, since the reviewer rubric consumes the **contract**, not the mock.

### Alternatives considered

| Option | Verdict |
|---|---|
| Keep ASCII wireframes and lift the schema ban | **Rejected.** ASCII cannot express alignment or spacing reliably, does not survive consolidation, and is not checkable. The ban is correct; the command is wrong |
| Inline SVG wireframes | **Rejected.** Hard-banned by the schema, token-expensive, and no more assertable than ASCII |
| Mermaid `block-beta` for layout | **Rejected as normative.** Renderer support is uneven across viewers, and it is still a diagram — the structured tree is more precise and a real render is more convincing. Permitted only as optional illustration |
| HTML/JSX + Tailwind skeleton as the normative spec | **Rejected.** Blurs spec and implementation, contradicts the area-agent rule *"NO code examples, only structure"*, and freezes markup decisions before the frontend agent plans. Retained only as the throwaway mock in Layer 3 |
| Persist the mock screenshots as a QA baseline | **Rejected.** Recreates the pixel-diff/baseline model the umbrella excluded, and the mock is not component-accurate enough to be a fair baseline |
| Render the mock with a Tailwind CDN build | **Rejected.** External network dependency at plan time; token inlining from `design-context.md` is deterministic and offline |
| Contract as prose checklist instead of JSON | **Rejected.** The schema's anti-pattern table already rules against paragraphs describing structure |

## Type of Artefact

Skill and schema changes, plus behaviour added to `@ux-layout-agent` and `@ux-agent` (both created/rewritten in `02`).

## Scope

### Includes

- `feature-design` schema: `## Design Contract` added **as a markdown table** with a declared ordinal position and required/optional status; `Screens`/`Components` compression extended for the layout tree and composition; ASCII ban restated with the replacement named; Mermaid `flowchart` permitted for branching flows
- `add-ux-design` skill: the layout-tree notation spec, the composition rules, the contract dimension table with verification methods, and the verifiability rule
- `@ux-layout-agent`: emits the layout tree, the composition, and the contract block
- **All three ASCII mandates removed from `add.design`**: STEP 6 task bullets, the FLOW dispatch *"create ASCII flow diagram"* (`:208`), and Inline Mode *"mobile ASCII layout (320px)"* (`:238`). Replacing only the first leaves the STEP 9 gate with grounds to FAIL
- `add-qa-spec` skill: `screens.json` `expect` derived from `## Design Contract`
- `<surface>.qa.spec` (via `@e2e-agent`) captures the computed-style values the contract names, alongside screenshots
- **Framework version bump at release** with the affected-command list, per `add-doc-schemas` Self-Governance (*"Changes to the schema registry are breaking by default"*). There is no schema-version field anywhere in the framework and nothing migrates docs on update — the CLI has no awareness of the user's `docs/` tree — so the bump is a release-notes obligation, not a gate mechanism

### Does NOT Include

- The rendered mock loop, `_design-mock/`, and the `.gitignore` edit — **cut**, see Layer 3
- Any baseline-image comparison or pixel-diff tooling
- The reviewer rubric that consumes the contract — `04`
- Design-token authoring (`add.design` Foundations mode)
- Changing `config.json` viewports
- Mermaid for layout as a normative form
- Removing the pre-existing numeric line caps in `add.design` (`LINE_LIMIT: 80/100`) and `fragments/qa-pipeline/add.plan.md` (*"under ~15 lines"*), which violate `add-doc-schemas`' prohibition on numeric advisories — noted as a separate cleanup, not bundled here

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Layout expressed as a minified JSON region tree, not ASCII | Assertable, diffable, survives consolidation, and complies with the existing schema ban and compression rules | ✅ |
| Component composition is tied to the real inventory from `design-context.md` | The schema already bans fabricated component libraries; composition is meaningless otherwise | ✅ |
| Mermaid `flowchart` allowed for branching flows only | Free, text-based, natively rendered, and touches no schema ban; arrow notation stays for linear flows to avoid token cost | ✅ |
| `## Design Contract` is a **markdown table**, not minified JSON | `add-doc-schemas:59` — *"Never put rules inside JSON objects."* Every dimension is a constraint, not data | ✅ |
| Each dimension names its **verification method** (computed style / axe / evidence set / judgement) | A vision model cannot measure px gaps, font sizes, or contrast ratios from a downscaled PNG. Declaring checks nothing can perform is worse than declaring none | ✅ |
| Tap target and contrast are delegated to axe-core, not the visual judge | `target-size` and `color-contrast` are existing deterministic rules already owned by `@qa-agent`; duplicating them in a visual rubric guarantees double findings | ✅ |
| The persisted spec captures computed-style values the contract names | Converts "measure from an image" into "compare two numbers" — cheap, exact, and it is the only way the conformance axis works at all | ✅ |
| Contract inherits from `design-context.md` and restates only commitments and justified deviations | Keeps the block short and makes drift visible | ✅ |
| **The rendered mock loop is cut** | Circular (author renders its own spec), tooling absent at plan time, violates `add.plan`'s no-code invariant, and its own risk table conceded the output must be largely discounted | ✅ |
| All three ASCII mandates removed, not just STEP 6 | `:208` and `:238` also mandate ASCII; leaving them keeps the STEP 9 gate failing | ✅ |
| `screens.json` `expect` derives from the contract | One source for "what correct looks like" instead of freehand text | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add-doc-schemas` (`references/new-feature.md`) | `feature-design` gains `## Design Contract` (markdown table, appended to the `Sections:` list — no optionality notation, since none exists in any schema and the gate never checks section presence); compression rules extended; Mermaid allowance noted; framework version bump at release | Modify |
| `add-ux-design` skill | Layout-tree notation, composition rules, contract dimensions + verification methods, verifiability rule | Modify |
| `ux-layout-agent` | Emits tree + composition + contract | Modify (created in `02`) |
| `add.design` | **All three** ASCII mandates removed (`STEP 6` bullets, `:208`, `:238`) | Modify |
| `e2e-agent` / `qa-project` skill | Spec additionally captures the computed-style values the contract names | **Modify (new)** |
| `add-qa-spec` skill | `expect` derived from the contract | Modify |
| `add-qa` skill | Overview notes the contract as the UX axis source of truth | Modify |
| `frontend-agent` | **Verified: no change needed for delivery.** It reads whole files (`frontend-agent.md:22` — *"Read project context (about.md, plan.md, design.md)"*), the dispatch passes whole files (`add.build.md:336` + `:118`), and `add-frontend-development/SKILL.md:25` says *"If design.md exists: Follow the specs exactly (components, props, states, layout)"*. A new section arrives as content automatically | None |
| `add.plan` STEP 8.1, `.gitignore` | No longer touched — the mock loop is cut | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A contract whose checks can actually be performed | A stricter authoring bar on `design.md` |
| Layout detail that survives consolidation | The intuitive readability of a wireframe sketch |
| Conformance that is mostly deterministic, not vibes | A new capture requirement on the persisted spec |
| The command stops violating its own schema | — |
| No new plan-time tooling dependency (mock cut) | No visual check of the proposal before implementation |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Computed-style capture is not implemented, and the contract silently reverts to un-performable visual checks | **High** | The capture requirement is a hard dependency of `04`'s rubric, not an enhancement. A contract dimension whose verification method is unavailable must be reported as unverifiable, never as passing |
| The layout tree becomes verbose | Med | Minified one-object-per-line per existing compression rules; regions only, never leaf-level styling. **No numeric line cap** — `add-doc-schemas` prohibits numeric advisories on agent output, and the "schema line budget" cited in an earlier draft does not exist |
| Contract and `design-context.md` diverge over the feature's life | Med | Contract restates only commitments and deviations. Note that **`design.md` drift semantics are an unresolved umbrella follow-up** that this dependency makes load-bearing |
| Mermaid renders as an error block in a provider that lacks support | Low | Optional and branch-only; arrow notation remains the default and is always valid |
| Agents write leaf-level CSS into the tree, recreating implementation-in-spec | Med | Schema hard-ban: no per-element styling in the layout tree — regions, roles, spans, and component names only |
| Contract dimensions the project has not defined (no spacing scale exists) | Med | Inherit what exists, flag the rest as a gap rather than inventing a scale |
| ~~Adding `## Design Contract` fails every pre-existing `design.md`~~ | **Not a risk** | Discovery disproved it: the validation gate's 8 checks never enumerate a schema's `Sections:` list. Only TL;DR and TOC are structurally verified; check 4 walks depth floors per H2/H3 *present in the schema* and its remedy is corrective (*"add the missing content"*), with no FAIL path for an absent section. No optionality notation is needed — and none exists in any schema to copy |
| A contract dimension the project never defined has no honest representation | Low | The gate already prescribes the form: *"If a fact is genuinely unknowable, write `unknown — <why>` rather than omit."* Use it verbatim instead of inventing a gap notation |
| `@frontend-agent` receives the layout tree but nothing verifies it *used* it | Med | Delivery is verified (see Ecosystem Impact), but **no gate checks consumption** — nothing in the framework names a `design.md` section, and no output contract references one. Authority comes from two changes already in scope: the section is added to the `feature-design` `Sections:` list, and `add.build`'s precedence is domain-scoped in `02` so `plan.md` cannot outrank it. The feedback loop is `04`'s conformance findings; there is no pre-emptive check, and that is accepted |

## Next Steps

Run: `/add-framework--plan implement docs/brainstorming/2026-07-26-03-layout-notation-design-contract.md`

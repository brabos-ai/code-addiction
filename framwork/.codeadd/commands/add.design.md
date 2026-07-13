# Design UX Specialist for SaaS

> **MODE:** AUTONOMOUS for features (infer->confirm->execute). INVESTIGATIVE only for foundations.
> **DOCS:** Feature design -> `docs/features/${FEATURE_ID}/design.md`. Foundations only when user requests.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner -> explain why; advanced -> essentials only).
> **ARGS:** `/add.design [F[NNNN]]` — explicit `F[NNNN]` targets a feature off-branch (overrides branch detection).

Coordinator for SaaS UX design specs. Dispatches specialized subagents for complex features (>=3 screens) or works inline for simple ones. Analyzes existing design system, detects SaaS context, maps screen flows, classifies actions, and creates text-based layout and component specs for AI agents.

Runs AFTER `/feature`, BEFORE `/plan` or `/dev`.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

**Reuse feature ID:** `add.design` does NOT allocate a new ID. Read `id: [NNNN]F` from the feature's `about.md` in STEP 1.2. The generated `design.md` carries the SAME `[NNNN]F` with `related: [[NNNN]F]`.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

```
STEP 1:  Load Context & Skills       -> RUN FIRST
STEP 2:  Detect SaaS Context         -> AFTER skill loaded
STEP 3:  Inspect Design System       -> MANDATORY before any proposal
STEP 4:  Complexity Gate             -> Decide inline vs subagent mode
STEP 5:  Flow & Interaction Analysis -> Subagent dispatch OR inline
STEP 6:  Layout & Component Spec    -> Subagent dispatch OR inline (AFTER Step 5)
STEP 7:  Confirm Design [STOP]      -> WAIT for user confirmation
STEP 8:  Write Documentation        -> Consolidation + write design.md + cleanup
STEP 9:  Validation Gate             -> feature-design schema gate
STEP 10: Completion                  -> INFORM user
```

**⛔ ABSOLUTE PROHIBITIONS (DO NOT SKIP):**

- **UX-DESIGN SKILL NOT LOADED:** Stop immediately. Read skill add-ux-design FIRST before any work.
- **DESIGN SYSTEM INSPECTION NOT COMPLETE (STEP 3):** Do NOT propose layouts. Complete inspection FIRST.
- **COMPLEXITY GATE NOT EVALUATED (STEP 4):** Do NOT dispatch subagents. Evaluate gate FIRST.
- **SUBAGENT MODE / FLOW INCOMPLETE (STEP 5):** Do NOT dispatch Layout subagent. Flow must complete FIRST (Layout depends on Flow output).
- **DESIGN NOT CONFIRMED BY USER:** Do NOT write design.md. Present design and WAIT for confirmation.
- **NO FRONTEND EXISTS:** Inform user, skip design.
- **FEATURE NOT RESOLVED (STEP 1.2):** Do NOT propose or write design. List `docs/features/` and WAIT for user choice.

---

## STEP 1: Load Context & Skills (RUN FIRST)

### 1.1: Load UX Design Skill (REQUIRED)

Read skill `add-ux-design`.

**Skill provides:** SaaS UX patterns, Context Detection, Mobile-first, States, Typography/Colors/Spacing, Components, Checklist

**RULE:** The ux-design skill is the SINGLE SOURCE OF TRUTH. NEVER duplicate patterns here.

### 1.2: Load Feature Context

Run `status.sh`. **Feature targeting (detection order):** explicit `F[NNNN]` argument > `FEATURE_ID` from status.sh (branch) > **ask-gate**: list features from `docs/features/` and WAIT for user choice (NEVER proceed without a resolved feature).

Then read `about.md` and `discovery.md` for the resolved feature.

**Extract:** `FEATURE_ID`, `FEATURE_DIR`, `HAS_FOUNDATIONS`, `FRONTEND.EXISTS`, `FRONTEND.UI_COMPONENTS`

### 1.3: Skill Docs Lookup (as needed)

When you need reference docs for specific components, utilities, patterns, charts, or tables, search the corresponding doc files within skill `add-ux-design`.

**GATE CHECK:** Is ux-design skill loaded? IF NO -> STOP. Load skill FIRST.

---

## STEP 2: Detect SaaS Context (AFTER skill loaded)

USE the Context Detection table from ux-design skill. Analyze about.md/discovery.md for keywords -> Apply matching SaaS patterns. Multiple contexts supported (e.g. "Team Settings" -> Settings + Workspace).

**Store:**
```
SAAS_CONTEXT=[detected from ux-design Context Detection table]
PATTERNS_TO_APPLY=[matching patterns from SaaS UX Pattern Library]
```

---

## STEP 3: Inspect Design System (MANDATORY)

> **CRITICAL:** NEVER propose layouts without completing this step. All proposals MUST align with existing visual patterns.

Inspect the project's design system by searching and reading relevant files in each area. Each subsection is independent — extract only what is specified.

### 3.1: Theme & Tokens (Required)

Analyze tailwind config files and CSS files with custom properties (globals.css, index.css, etc.).

**Extract:** colors (primary, secondary, accent, muted, background, foreground, border, destructive), spacing (base unit, common gaps, padding), border-radius values, font families (headings, body, mono), dark mode (yes/no, strategy).

### 3.2: Layout Shell (Required)

Find and read layout-related components (layout, shell, sidebar, header, topbar, navbar, footer, app-shell, dashboard-layout, page-layout).

**Extract:** shell (name, path, structure), sidebar (width, collapsible, position), topbar (height, position, contents), content area (max-width, padding, responsive).

### 3.3: Component Library Audit (Required)

Audit available UI components and check for component index/exports.

**Extract:** full list of existing UI components with paths, shadcn status (yes/no, which installed).

### 3.4: Visual Patterns Reference (Required for Subagent Mode)

Find and read 3-5 representative pages (dashboard, settings, list, detail, form).

**Extract:** page headers, cards, lists, forms, buttons usage patterns.

### 3.5: Frontend Readiness Check

```json
{"frontend_false":"Backend-only, skip design","frontend_true_lt5":"New project, use ux-design defaults","frontend_true_gte5":"MUST follow patterns from inspection"}
```

**IF HAS_FOUNDATIONS=true:** Read `docs/design-system.md` and use tokens.

### 3.6: Write Design Context (Required Output for Subagent Mode)

Write temp file: `docs/features/${FEATURE_ID}/design-context.md`

**Structure (Extractive format, no prose):**

```json
{
  "theme": {
    "colors": {"primary":"[hsl]","secondary":"[hsl]","...":"..."},
    "spacing": {"1":"0.25rem","2":"0.5rem","...":"..."},
    "fonts": {"display":"[family]","body":"[family]","mono":"[family]"},
    "radius": "[value]",
    "darkMode": true|false
  },
  "layout": {
    "shell": "[name]",
    "sidebar": {"width":"[px]","collapsible":true|false},
    "topbar": {"height":"[px]","fixed":true|false},
    "contentMaxWidth": "[px/css]"
  },
  "components": ["[path/name]",...],
  "constraints": ["MUST use [token]", "AVOID [pattern]", "MATCH [value]"]
}
```

**GATE CHECK:** No frontend -> inform user, skip design, STOP. Missing 3.1-3.3 -> Complete FIRST. Complete -> STEP 4.

---

## STEP 4: Complexity Gate

Count screens/pages from about.md and discovery.md. Check for complexity keywords (wizard, onboarding, multi-step, flow, dashboard, settings-panel).

```
IF SCREEN_COUNT < 3 AND no complexity keywords:
  -> MODE = INLINE (coordinator handles Steps 5-6 directly)

IF SCREEN_COUNT >= 3 OR complexity keywords found:
  -> MODE = SUBAGENT (verify design-context.md exists, dispatch subagents)
```

Inform user which mode was selected and why.

**GATE CHECK:** Steps 1-3 must be complete before evaluating.

---

## STEP 5 & 6: Subagent Dispatch (Parameterized Template)

### Subagent Template (Reducer Pattern)

DISPATCH AGENT: @ux-agent with parameters below.

```
You are the {{FLOW_TYPE}} SPECIALIST for feature ${FEATURE_ID}.

## Bootstrap
Read: design-context.md{{READ_PRIOR_FLOW}}, about.md, discovery.md for ${FEATURE_ID}.
Load: skill add-ux-design files {{SKILL_FILES}}.

## Task
{{TASK_BULLETS}}

## Output
Write to: {{OUTPUT_PATH}}
{{OUTPUT_SPEC}}

## Rules
- {{CORE_CONSTRAINT}}
- Keep output under {{LINE_LIMIT}} lines
{{NO_OVERLAP_RULE}}
```

### Parameter Sets (Dispatch Configuration)

**FLOW DISPATCH (STEP 5):**
```json
{
  "FLOW_TYPE": "FLOW & INTERACTION ARCHITECT",
  "READ_PRIOR_FLOW": "",
  "SKILL_FILES": "ux-laws-principles.md, modern-patterns.md",
  "TASK_BULLETS": "- Map ALL screens and create ASCII flow diagram\n- Classify ALL user actions (Action Classification Matrix)\n- Map entry points per screen (nav, Cmd+K, URL, notification, breadcrumb)\n- Define state transitions between screens",
  "OUTPUT_PATH": "docs/features/${FEATURE_ID}/design-flow.md",
  "OUTPUT_SPEC": "Tables: Flow Diagram, Screen Inventory (screen/purpose/parent/depth), Action Classification Matrix (action/frequency/type/access/screen), Entry Points, State Transitions.",
  "CORE_CONSTRAINT": "Apply UX laws and modern patterns from skill docs",
  "LINE_LIMIT": "80",
  "NO_OVERLAP_RULE": "- NO layout specs (Layout subagent handles that)"
}
```

**LAYOUT DISPATCH (STEP 6, only after FLOW complete):**
```json
{
  "FLOW_TYPE": "LAYOUT & COMPONENT SPECIALIST",
  "READ_PRIOR_FLOW": ", design-flow.md (MANDATORY)",
  "SKILL_FILES": "shadcn-docs.md, tailwind-v3-docs.md, motion-dev-docs.md",
  "TASK_BULLETS": "- ASCII layout per screen (mobile-first 320px, md/lg breakpoint notes)\n- Spec new components only (existing = path reference)\n- Map states (loading/empty/error) per screen\n- Ensure ALL actions from matrix have UI elements\n- Flow context per layout (where user comes from / goes to)",
  "OUTPUT_PATH": "docs/features/${FEATURE_ID}/design-layout.md",
  "OUTPUT_SPEC": "Per screen: pattern, flow context, mobile ASCII layout, breakpoints, components table, states.\nNew components: location, pattern, props, uses, mobile specs, actions served, behavior.",
  "CORE_CONSTRAINT": "Follow design-context.md constraints; reuse existing components by path reference",
  "LINE_LIMIT": "100",
  "NO_OVERLAP_RULE": "- NO flow analysis (already in design-flow.md)"
}
```

**Dispatch idempotency guard:** Check if output file exists before dispatching. If yes, skip and proceed to next step. If FLOW exists but LAYOUT missing, dispatch LAYOUT only (Layout depends on Flow).

### Inline Mode (Complexity < 3 screens)

**STEP 5 (Flow):** Coordinator creates compact Action Classification table directly. Store in memory for Step 7.

**STEP 6 (Layout):** Coordinator creates layout specs directly using patterns from ux-design skill. Per page: pattern, mobile ASCII layout (320px), md/lg breakpoints, components table (existing w/ path, new w/ location), states. For new components: location, pattern, props, uses, mobile specs, actions served, behavior. Store in memory for Step 7.

---

## STEP 7: Confirm Design [STOP]

**PREREQUISITE:** Steps 1-6 MUST be complete.

Present consolidated design summary to user. Include: SaaS context, patterns, mode, alignment with existing system. In subagent mode: read temp files, show flow diagram, screen inventory, action matrix, layouts summary, new components. In inline mode: show pages, reuse/new components, action classification, design constraints applied.

**ONE question only.** No aesthetic preferences, no alternatives.

**GATE CHECK:** User must confirm before proceeding. IF NO -> WAIT. DO NOT proceed.

---

## STEP 8: Write Documentation

**Schema load (MANDATORY).** EXECUTE schema `feature-design` from `{{skill:add-doc-schemas/SKILL.md}}`. Reuse `[NNNN]F` from about.md. Apply cache technique per `{{skill:add-doc-schemas/SKILL.md}}`.

### 8A: Subagent Mode -- Consolidation

1. Read design-flow.md and design-layout.md
2. Validate: every action has a UI element, every screen has a layout, entry points match navigation
3. Fill gaps if validation finds missing items
4. Write to `docs/features/${FEATURE_ID}/design.md` following the `feature-design` schema
5. Cleanup temp files: delete design-context.md, design-flow.md, design-layout.md

### 8B: Inline Mode -- Direct Write

Write to `docs/features/${FEATURE_ID}/design.md` following the `feature-design` schema. Delete design-context.md if exists.

Extractive only — tables, bullets, `step → step` sequences, minified JSON for tokens.

---

## STEP 9: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-design`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 10: Completion

Inform the user that design is complete. Include: feature ID, SaaS context, patterns applied, mode used, path to design.md, artifact summary (screen flow, actions classified, entry points mapped), and next steps (`/plan`, `/dev`, `/autopilot`).

---

## Foundations Mode (User Request Only)

**Triggers:** "create design system", "configure foundations", "define visual patterns"

**1. Discovery:** Ask about tone (Professional/Modern/Friendly/Minimalist), references (Stripe, Linear, Notion, Vercel), colors (defined or suggest?), audience (B2B/B2C).

**2. Analyze:** Read existing CSS variables, tailwind config, and list available UI components.

**3. Propose 2 options -> User chooses -> Generate design-system.md**

**design-system.md template:**
```markdown
# Design System Foundations

**Stack:** [framework]+[ui]+[bundler] | **Tone:** [chosen]

## Spec
{"breakpoints":{"mobile":"320-767","tablet":"768-1023","desktop":"1024+"},"spacing":{"1":"0.25rem","2":"0.5rem","4":"1rem","6":"1.5rem","8":"2rem"},"fonts":{"display":"[font]","body":"[font]","mono":"[font]"},"colors":{"primary":"[hsl]","secondary":"[hsl]","accent":"[hsl]","destructive":"[hsl]","muted":"[hsl]","bg":"[hsl]","fg":"[hsl]"},"components":{"ui":[],"layout":[],"features":[]},"conventions":{"naming":"[pattern]","exports":"[pattern]","props":"[pattern]"}}

## Mobile Checklist
["Touch 44px","Input 16px+","Focus visible","WCAG AA","Reduced motion"]
```

---

## Core Rules

**MANDATORY FLOW:**
1. Load ux-design skill (STEP 1) — single source of truth
2. Complete STEP 3 inspection before any layout proposal
3. Output Design Context Summary before STEP 4
4. Evaluate complexity gate before dispatching subagents
5. Execute subagents sequentially: Flow → Layout (Layout depends on Flow)
6. User confirmation (STEP 7) before consolidation
7. Validate coherence during consolidation (Step 8)
8. Cleanup all temp files after writing design.md

**DESIGN INVARIANTS:**
- Align with existing theme/layout/patterns — map existing before proposing
- Use mobile-first (320px base)
- Reuse existing components by path reference
- New components must follow project conventions
- States (loading/empty/error) mapped per screen
- Entry points and actions classified and matched to UI elements

**PROHIBITIONS (enforce in all steps):**
- Do NOT propose layouts that conflict with detected patterns
- Do NOT skip STEP 3 inspection, even for simple features
- Do NOT duplicate patterns (use ux-design skill)
- Do NOT auto-create design-system.md (Foundations mode only on user request)
- Do NOT dispatch Layout before Flow completes
- Do NOT leave temp files after consolidation
- Do NOT ask aesthetic questions or present multiple options in feature mode
- Do NOT omit critical info (props, paths, states, actions)
- Do NOT use generic layouts when project has established patterns
- Do NOT run Foundations mode without discovery questions and user decisions

---

## Error Handling

| Error | Action |
|-------|--------|
| No frontend detected | Inform user, skip design |
| about.md not found | Degrade: design without feature context |
| discovery.md not found | Proceed with about.md only |
| No UI components found | Treat as new project (use ux-design defaults) |
| Subagent fails to write output | Re-dispatch ONCE, then handle inline |
| design-flow.md missing before Layout dispatch | STOP. Re-run Flow subagent |
| Temp files exist from previous run | Delete before starting new run |
| Major pattern inconsistencies | Flag to user before proceeding |

<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-ux.md -->
---
description: Lightweight UX refinement - loads ux-design skill and applies to free-form instructions
---

# UX Lightweight Command

Lightweight UX loader. Loads ux-design skill, discovers project design patterns, then applies UX knowledge to the user's free-form instruction.

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Run feature-status script          → CONTEXT FIRST
STEP 2: Load ux-design skill              → READ skill
STEP 3: Discover project design patterns   → BEFORE proposing changes
STEP 4: Load complementary skill docs      → Based on user intent
STEP 5: Apply UX to user instruction       → Execute
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF UX-DESIGN SKILL NOT LOADED:
  ⛔ DO NOT USE: Edit on any file
  ⛔ DO NOT USE: Write on any file
  ⛔ DO NOT: Propose UX patterns or create components
  ✅ DO: Read .codeadd/skills/ux-design/SKILL.md FIRST

IF PROJECT DESIGN PATTERNS NOT DISCOVERED:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT USE: Write on code files
  ⛔ DO NOT: Propose layouts or components
  ✅ DO: Complete STEP 2 FIRST
```

---

## STEP 1: Run Feature Status (CONTEXT)

```bash
bash .codeadd/scripts/status.sh
```

Parse the output to understand project context (branch, feature, recent changes).

---

## STEP 2: Load UX Design Skill (REQUIRED)

READ `.codeadd/skills/ux-design/SKILL.md` — this is the single source of truth for UX knowledge.

---

## STEP 3: Discover Project Design Patterns

> NEVER propose UI changes without understanding the existing project patterns first.

**DISCOVER autonomously:**
- Tailwind config (search for `tailwind.config.*` wherever it exists)
- CSS variables / design tokens (search for CSS files with `--` custom properties)
- Available UI components (search for `components/ui/` directory wherever it exists)
- Existing page/layout patterns (sample 2-3 existing pages if relevant)

**EXTRACT:** colors, spacing, radius, fonts, dark mode, available components.

**INFORM user** with a brief summary of what was detected.

---

## STEP 4: Load Complementary Skill Docs

**ANALYZE** user's `$ARGUMENTS` and load relevant docs from `.codeadd/skills/ux-design/`:

**Available docs:**
| Doc | Covers |
|-----|--------|
| `shadcn-docs.md` | UI components (button, dialog, form, card, input) |
| `tailwind-v3-docs.md` | Styling, spacing, colors, responsive |
| `motion-dev-docs.md` | Animations, transitions, micro-interactions |
| `recharts-docs.md` | Charts, graphs, data visualization |
| `tanstack-table-docs.md` | Tables, grids, sorting, filtering |
| `tanstack-query-docs.md` | Data fetching, cache, mutations |
| `tanstack-router-docs.md` | Routing, navigation |
| `ux-laws-principles.md` | UX laws (Fitts, Hick, Jakob, Doherty) |
| `modern-patterns.md` | Modern interaction patterns, visual trends |
| `ux-writing.md` | Microcopy, error messages, empty states |

Load whichever docs are relevant to the user's intent. If nothing specific matches, SKILL.md alone is sufficient.

---

## STEP 5: Apply UX to User Instruction

EXECUTE the user's free-form instruction applying:
- UX principles from loaded skill + docs
- Project design patterns discovered in STEP 3
- Reuse existing components — don't recreate what exists
- Mobile-first approach (from ux-design skill)

Output a brief summary of what was done and which UX considerations were applied.

---

## Rules

ALWAYS:
- Run status.sh for context before anything
- Load ux-design skill before proposing any changes
- Discover project design patterns before editing code
- Reuse existing components instead of recreating them
- Apply mobile-first approach from ux-design skill
- Summarize what was done and UX considerations applied

NEVER:
- Edit or write files without loading ux-design skill
- Propose layouts without discovering project patterns first
- Recreate components that already exist in the project
- Ignore existing design tokens, colors, or spacing

# UX Lightweight Command

Lightweight UX loader. Loads ux-design skill, discovers project design patterns, then applies UX knowledge to the user's free-form instruction.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

```
STEP 1 → Run feature-status script (context)
STEP 2 → Load ux-design skill (required)
STEP 3 → Discover project design patterns
STEP 4 → Load complementary skill docs
STEP 5 → Apply UX to user instruction
```

**PROHIBITIONS — until skill is loaded:**
- NEVER Edit/Write any file before reading skill `add-ux-design`
- NEVER propose UX patterns, layouts, or components before STEP 3 completes

---

## STEP 1: Run Feature Status

```bash
bash .codeadd/scripts/status.sh
```

Parse output to understand project context (branch, feature, recent changes).

---

## STEP 2: Load UX Design Skill

READ skill `add-ux-design` — single source of truth for UX knowledge.

---

## STEP 3: Discover Project Design Patterns

**DISCOVER autonomously:**
- Tailwind config (`tailwind.config.*`)
- CSS variables / design tokens (files with `--` custom properties)
- Available UI components (`components/ui/` directory)
- Existing page/layout patterns (sample 2-3 pages if relevant)

**EXTRACT:** colors, spacing, radius, fonts, dark mode, available components.
**INFORM user** with a brief summary of what was detected.

---

## STEP 4: Load Complementary Skill Docs

**ANALYZE** user's `$ARGUMENTS` and load relevant docs from skill `add-ux-design`:

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

If nothing specific matches, SKILL.md alone is sufficient.

---

## STEP 5: Apply UX to User Instruction

EXECUTE the user's free-form instruction applying:
- UX principles from loaded skill + docs
- Project design patterns discovered in STEP 3
- Reuse existing components — NEVER recreate what exists
- Mobile-first approach

Output a brief summary of what was done and which UX considerations were applied.

---

## Rules

ALWAYS:
- Load ux-design skill before proposing any changes
- Discover project patterns before editing code
- Reuse existing components instead of recreating them

NEVER:
- Edit/Write files without loading ux-design skill first
- Propose layouts without discovering project patterns
- Ignore existing design tokens, colors, or spacing

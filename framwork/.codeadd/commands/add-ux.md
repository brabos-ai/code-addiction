# UX Lightweight Command

<!-- uses:
- skill: add--ux-design
- script: status.cjs
-->

Lightweight UX loader. Loads ux-design skill, discovers project design patterns, then applies UX knowledge to the user's free-form instruction.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

```
STEP add-ux.status → Run feature-status script (context)
STEP add-ux.load-skill → Load ux-design skill (required)
STEP add-ux.discover → Discover project design patterns
STEP add-ux.docs → Load complementary skill docs
STEP add-ux.apply → Apply UX to user instruction
```

**CONSTRAINTS — BLOCKING GATES:**
- Do not edit/write files until skill `add--ux-design` is loaded (STEP add-ux.load-skill)
- Do not propose patterns/layouts/components until design patterns are discovered (STEP add-ux.discover)
- Do not skip project pattern discovery — reuse existing components always

---

## STEP add-ux.status: Run status.cjs

```bash
node .codeadd/scripts/status.cjs
```

Parse output to understand project context (branch, feature, recent changes).

---

## STEP add-ux.load-skill: Load UX Design Skill

READ skill `add--ux-design` — single source of truth for UX knowledge.

---

## STEP add-ux.discover: Discover Project Design Patterns

**DISCOVER autonomously:**
- Tailwind config (`tailwind.config.*`)
- CSS variables / design tokens (files with `--` custom properties)
- Available UI components (`components/ui/` directory)
- Existing page/layout patterns (sample 2-3 pages if relevant)

**EXTRACT:** colors, spacing, radius, fonts, dark mode, available components.
**INFORM user** with a brief summary of what was detected.

---

## STEP add-ux.docs: Load Complementary Skill Docs

**ANALYZE** user's `$ARGUMENTS` and load relevant docs from skill `add--ux-design`:

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

## STEP add-ux.apply: Apply UX to User Instruction

EXECUTE the user's free-form instruction applying:
- UX principles from loaded skill + docs
- Project design patterns discovered in STEP add-ux.discover
- Reuse existing components — NEVER recreate what exists
- Mobile-first approach

Output a brief summary of what was done and which UX considerations were applied.

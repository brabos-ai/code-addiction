# Design UX Specialist for SaaS

> **MODE:** AUTONOMOUS for features (dispatch -> critique -> consolidate, no approval ask). INVESTIGATIVE only for foundations.
> **DOCS:** Feature design -> `${SCOPE_DIR}/design.md`. Foundations only when user requests.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner -> explain why; advanced -> essentials only).
> **ARGS:** `/add.design [F[NNNN]]` — explicit `F[NNNN]` targets a feature off-branch (overrides branch detection).

Thin coordinator for SaaS UX design specs. Dispatches three specialized agents — `@ux-flow-agent` (design-system inspection + flow) then `@ux-layout-agent` (layout + components) then `@ux-agent` in critique mode — and consolidates their outputs into `design.md` itself. The coordinator authors nothing but the consolidation; all inspection, flow, and layout work lives in the agents.

**Same artefact, two entry points.** `/add.plan` STEP 8.1 runs this exact pipeline automatically whenever a feature touches UI. This command is the manual entry point: run it when you want the design contract produced (or regenerated) on its own, before or independently of planning. Both write the same `design.md` with the same conventions — never diverge from `add.plan` 8.1's semantics when editing this command.

Runs AFTER `/add.new`, BEFORE `/add.plan` or `/add.build`.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules). Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

**Reuse feature ID:** `add.design` does NOT allocate a new ID. Read `id: [NNNN]F` from the resolved scope's `about.md` in STEP 1.2. The generated `design.md` carries `[NNNN]F` with `related: [[NNNN]F]` — or the SF-qualified form `[NNNN]F-SFxx` when the design is scoped to a subfeature (see `{{skill:add-id-convention/SKILL.md}}`).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

```
STEP 1: Load Context & Skills          -> RUN FIRST (resolve FEATURE + SCOPE_DIR + ABOUT_SHA)
STEP 2: Detect SaaS Context            -> AFTER skill loaded
STEP 3: DISPATCH @ux-flow-agent        -> design-context.md + design-flow.md
STEP 4: DISPATCH @ux-layout-agent      -> design-layout.md (AFTER Step 3)
STEP 5: DISPATCH @ux-agent (critique)  -> design-review.md (AFTER Step 4)
STEP 6: Coordinator Consolidation      -> write design.md + ## Design Review
STEP 7: Validation Gate                -> feature-design schema gate
STEP 8: Cleanup Temporary Files        -> only AFTER the gate returns PASS
STEP 9: Completion                     -> INFORM user (no approval ask)
```

**⛔ ABSOLUTE PROHIBITIONS (DO NOT SKIP):**

- **UX-DESIGN SKILL NOT LOADED:** Stop immediately. Read skill add-ux-design FIRST before any work.
- **FEATURE NOT RESOLVED (STEP 1.2):** Do NOT dispatch or write design. List `docs/features/` and WAIT for user choice.
- **SCOPE_DIR NOT RESOLVED (STEP 1.2):** Do NOT dispatch. Temps and `design.md` both live in `${SCOPE_DIR}`; an unresolved scope writes the design to the wrong directory.
- **FLOW INCOMPLETE (STEP 3):** Do NOT dispatch `@ux-layout-agent`. `design-flow.md` must exist FIRST (Layout depends on Flow).
- **LAYOUT INCOMPLETE (STEP 4):** Do NOT dispatch the critic. `design-layout.md` must exist FIRST.
- **NO FRONTEND EXISTS:** `@ux-flow-agent` reports `frontend_false` -> inform user, skip design, STOP.
- **STALE TEMP REUSE:** Do NOT skip a dispatch because its temp file already exists. Every run re-derives all temps from the CURRENT `about.md` — reusing one and then stamping the current `provenance` hash on `design.md` is a lie that makes `add.plan` 8.1.0 skip regeneration forever.
- **COORDINATOR RE-DISPATCH:** Do NOT re-dispatch `@ux-layout-agent` to apply the critique. YOU apply accepted items while writing `design.md`.
- **HUMAN APPROVAL GATE:** This command has NO stop-and-wait-for-approval step. Every accept/reject decision belongs to the coordinator. Do NOT invent one.

---

## STEP 1: Load Context & Skills (RUN FIRST)

### 1.1: Load UX Design Skill (REQUIRED)

Read skill `add-ux-design`.

**Skill provides:** SaaS UX patterns, Context Detection, Mobile-first, States, Typography/Colors/Spacing, Components, Critique Rubric, Checklist

**RULE:** The ux-design skill is the SINGLE SOURCE OF TRUTH. NEVER duplicate patterns here.

### 1.2: Load Feature Context & Resolve Scope

Run `status.sh`. **Feature targeting (detection order):** explicit `F[NNNN]` argument > `FEATURE_ID` from status.sh (branch) > **ask-gate**: list features from `docs/features/` and WAIT for user choice (NEVER proceed without a resolved feature).

**Extract from status.sh:** `FEATURE_ID`, `FEATURE_DIR`, `HAS_FOUNDATIONS`, `HAS_EPIC`, `EPIC_CURRENT_SF`.

**Scope dir (epic awareness — identical rule to `add.plan` 8.1 and `/add.qa`):**

```
IF HAS_EPIC=true:  SF_DIR    = ${FEATURE_DIR}/subfeatures/${EPIC_CURRENT_SF}-*   (single match)
                   SCOPE_DIR = ${SF_DIR}
                   SF_SUFFIX = " (subfeature ${EPIC_CURRENT_SF})"
ELSE:              SCOPE_DIR = ${FEATURE_DIR}
                   SF_SUFFIX = ""     (empty)
```

ALL temps AND the final `design.md` live in `${SCOPE_DIR}`. Never write them to `${FEATURE_DIR}` when `HAS_EPIC=true`.

**`design.md` resolution (for consumers, and for the re-run `created:` lookup):** resolve it per the `feature-design` **Location** rule in `{{skill:add-doc-schemas/references/new-feature.md}}` (SF-level first, feature-level fallback).

**Read:** `${ABOUT_PATH}` (= `${SF_DIR}/about.md` when HAS_EPIC=true, else `${FEATURE_DIR}/about.md`) and `${FEATURE_DIR}/discovery.md`.

**Provenance hash (same bytes `add.plan` 8.1 hashes):**

```bash
sha256sum "${ABOUT_PATH}" | cut -d' ' -f1     # macOS: shasum -a 256 "${ABOUT_PATH}" | cut -d' ' -f1
```

→ `${ABOUT_SHA}`. STEP 6 writes it as `provenance: sha256:${ABOUT_SHA}`.

**No idempotency skip here.** `add.plan` 8.1.0 skips on a provenance match because it runs automatically; invoking `/add.design` IS the explicit intent to (re)produce the design, so the pipeline always runs — end to end. If `design.md` already exists, say so and note that it will be regenerated. The same applies to every temp: STEPS 3-5 re-derive `design-context.md`, `design-flow.md`, `design-layout.md` and `design-review.md` from the `about.md` you just hashed, so the `${ABOUT_SHA}` STEP 6 stamps is always truthful.

### 1.3: Skill Docs Lookup (as needed)

When you need reference docs for specific components, utilities, patterns, charts, or tables, search the corresponding doc files within skill `add-ux-design`.

**GATE CHECK:** Is ux-design skill loaded? Is FEATURE resolved? Is SCOPE_DIR resolved? IF NO to any -> STOP and resolve it FIRST.

---

## STEP 2: Detect SaaS Context (AFTER skill loaded)

USE the Context Detection table from ux-design skill. Analyze about.md/discovery.md for keywords -> Apply matching SaaS patterns. Multiple contexts supported (e.g. "Team Settings" -> Settings + Workspace).

**Store (passed into the STEP 3 dispatch as a context signal — the agents still derive their own):**
```
SAAS_CONTEXT=[detected from ux-design Context Detection table]
PATTERNS_TO_APPLY=[matching patterns from SaaS UX Pattern Library]
```

---

## STEP 3: DISPATCH @ux-flow-agent (flow & interaction)

The design-system inspection lives INSIDE this agent (Step 0 of its definition) — the coordinator does not inspect anything itself.

- **Output (temps):** `${SCOPE_DIR}/design-context.md` + `${SCOPE_DIR}/design-flow.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}` (exact — never invent a path), the two output paths above, the inputs `${ABOUT_PATH}` + `${FEATURE_DIR}/discovery.md`, `HAS_FOUNDATIONS=${HAS_FOUNDATIONS}`, and the STEP 2 signal `${SAAS_CONTEXT}` / `${PATTERNS_TO_APPLY}`. Instruct it to follow its own agent definition — do NOT restate the method here — and to report `frontend_false` and STOP without writing, if the project has no frontend at all.
- **Early exit:** IF the agent reports `frontend_false` → no `design.md` is written. Inform the user (backend-only scope), skip STEPS 4-8, and STOP.
- **Soft-degrade:** if `@ux-flow-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.
- **Always dispatch — never reuse a leftover temp.** If `design-context.md` / `design-flow.md` survive an interrupted run, the agent OVERWRITES them. Reusing them would let a temp derived from an older `about.md` be consolidated under the CURRENT `${ABOUT_SHA}` in STEP 6, and `add.plan` 8.1.0 would then skip regeneration on that false provenance match. There is no mtime/"looks recent" escape hatch — see the ⛔ in STEP 6.
- **(add.design-only, intentional):** STEP 2's `${SAAS_CONTEXT}`/`${PATTERNS_TO_APPLY}` signal passed into this dispatch has no equivalent in `add.plan` 8.1.1 — the automatic pipeline lets `@ux-flow-agent` derive context on its own; the manual entry point pre-computes it for a faster, more deliberate standalone run.

---

## STEP 4: DISPATCH @ux-layout-agent (layout & components)

**PREREQUISITE:** `${SCOPE_DIR}/design-flow.md` MUST exist. IF missing -> re-run STEP 3.

- **Output (temp):** `${SCOPE_DIR}/design-layout.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}`, then pass ONLY: target directory `${SCOPE_DIR}`, the MANDATORY inputs `${SCOPE_DIR}/design-flow.md` + `${SCOPE_DIR}/design-context.md` (read FIRST), the fallback context `${ABOUT_PATH}` / `${FEATURE_DIR}/discovery.md`, and the output path above. Instruct it to follow its own agent definition — the layout method lives there, not here.
- **Soft-degrade:** if `@ux-layout-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill.
- **Always dispatch — never reuse a leftover temp.** A surviving `design-layout.md` is OVERWRITTEN, for the same false-provenance reason as STEP 3.

---

## STEP 5: DISPATCH @ux-agent (critique mode — adversarial, ONE bounded pass)

**PREREQUISITE:** `${SCOPE_DIR}/design-layout.md` MUST exist.

- **Output (temp):** `${SCOPE_DIR}/design-review.md`
- **Prompt:** name the agent's role for feature `${FEATURE_ID}${SF_SUFFIX}` and state **CRITIQUE MODE — read-only**, then pass ONLY: target directory `${SCOPE_DIR}`, the inputs `design-flow.md` / `design-layout.md` / `design-context.md` at that directory, and the output path above. The rubric, the per-defect shape, the severity scale and the empty-critique rule are its agent definition's — do NOT restate them. State that it NEVER edits `design-flow.md`, `design-layout.md`, or `design.md`: it reports, the coordinator decides.
- **Soft-degrade:** if `@ux-agent` is not available in this engine, dispatch a generic subagent with this same directive + the `add-ux-design` skill (the rubric is `{{skill:add-ux-design/critique-rubric.md}}`).

---

## STEP 6: Coordinator Consolidation → `design.md`

**Schema load (MANDATORY).** EXECUTE schema `feature-design` from `{{skill:add-doc-schemas/SKILL.md}}`. Apply the cache technique per `{{skill:add-doc-schemas/SKILL.md}}`.

Execute the **Consolidation contract** for schema `feature-design` in `{{skill:add-doc-schemas/references/new-feature.md}}` — the four temps, the accept/reject decision trail, the coherence validation, the section list, the exact frontmatter block, the `## Design Review` table shape and the provenance-truthfulness rule all live there. Set `provenance: sha256:${ABOUT_SHA}` and write to `${SCOPE_DIR}/design.md`. Keep the prose extractive — tables, bullets, `step → step` sequences, minified JSON for tokens.

⛔ DO NOT re-dispatch `@ux-layout-agent` to apply the critique — consolidation is coordinator work.
⛔ DO NOT restate the frontmatter or section shape here. It is shared with `/add.plan`'s design step; both cite the schema so they cannot drift apart. `${ABOUT_SHA}` is only truthful because STEPS 3-5 always re-ran — never stamp it over a reused temp.

---

## STEP 7: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `feature-design` against the `design.md` you just wrote.

⛔ DO NOT skip. DO NOT proceed to cleanup or mark the command complete until the gate returns `PASS`.

---

## STEP 8: Cleanup Temporary Files

```bash
cd "${SCOPE_DIR}"
rm -f design-context.md design-flow.md design-layout.md design-review.md
```

Delete only AFTER `design.md` is written and the STEP 7 gate returned `PASS`.

---

## STEP 9: Completion

Inform the user that design is complete — this is a report, NOT an approval ask. Include: feature ID (SF-qualified when epic), SaaS context, patterns applied, path to `design.md`, artifact summary (screens, actions classified, entry points mapped, new components), the `## Design Review` outcome (how many items accepted/rejected, or the empty-critique justification), and next steps (`/add.plan`, `/add.build`, `/add.autopilot`).

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
2. Resolve FEATURE and SCOPE_DIR before any dispatch (STEP 1.2) — epic runs write to the subfeature dir
3. Execute the three dispatches SEQUENTIALLY: Flow → Layout → Critique (each depends on the previous)
4. The coordinator — never a subagent — decides every critique item and writes `design.md` (STEP 6)
5. Validation gate must return `PASS` (STEP 7) before cleanup (STEP 8)
6. Cleanup all temp files after `design.md` passes the gate
7. Report the result (STEP 9); never ask for approval

**DESIGN INVARIANTS:**
- Align with existing theme/layout/patterns — `@ux-flow-agent`'s inspection maps what exists before anything is proposed
- Use mobile-first (320px base)
- Reuse existing components by path reference
- New components must follow project conventions
- States (loading/empty/error) mapped per screen
- Entry points and actions classified and matched to UI elements

**PROHIBITIONS (enforce in all steps):**
- Do NOT propose layouts yourself — the agents author, the coordinator consolidates
- Do NOT skip the design-system inspection by dispatching layout work before `@ux-flow-agent` ran
- Do NOT duplicate patterns (use ux-design skill)
- Do NOT auto-create design-system.md (Foundations mode only on user request)
- Do NOT dispatch Layout before Flow completes, nor the critic before Layout completes
- Do NOT leave temp files after consolidation, and do NOT reuse leftovers from an interrupted run — re-derive them
- Do NOT judge any artefact "still fresh" from file mtime or git status; the `about.md` provenance hash is the only freshness signal
- Do NOT ask aesthetic questions, present multiple options, or ask the user to approve the design
- Do NOT omit critical info (props, paths, states, actions)
- Do NOT use generic layouts when project has established patterns
- Do NOT run Foundations mode without discovery questions and user decisions

---

## Error Handling

| Error | Action |
|-------|--------|
| `@ux-flow-agent` reports `frontend_false` | Inform user, skip design, STOP |
| about.md not found | STOP — the feature is unresolved; list `docs/features/` and ask |
| discovery.md not found | Proceed with about.md only; note the degraded context in the dispatch prompts |
| HAS_EPIC=true but no `EPIC_CURRENT_SF` | STOP. Ask which subfeature to design — never default to `${FEATURE_DIR}` |
| No UI components found | `@ux-flow-agent` treats it as a new project (ux-design defaults) |
| Subagent fails to write its output | Re-dispatch ONCE with the same prompt; if it fails again, STOP and report |
| design-flow.md missing before Layout dispatch | STOP. Re-run STEP 3 |
| design-review.md missing before consolidation | Re-run STEP 5 once; if still missing, consolidate and record "critique unavailable" in `## Design Review` |
| Temp files exist from previous run | Ignore them and run STEPS 3-5 normally — each dispatch overwrites its own output. NEVER reuse a temp, and NEVER judge one "still fresh" by mtime or git status |
| Validation gate returns FAIL | Fix `design.md` and re-run STEP 7 — do NOT clean up temps until it passes |

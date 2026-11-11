# Remove the owner/product onboarding

**Date:** 2026-09-15
**Plan:** `2026-09-14T215223-PLAN--remove-owner-product-onboarding`
**Layers:** product (one `[internal]` block for a stale example)

## TL;DR

`/add.init`, `docs/product/owner.md`, `docs/product/product.md`, the `owner` and `product` doc schemas
and the `add-product-discovery` skill are gone. The feature they made up never worked: its writer and
its four readers disagreed about both the path and the format, so the "adapt to the owner's profile"
instruction carried by 13 commands had never once fired.

## What was broken

`/add.init` wrote `docs/product/owner.md` with schema frontmatter and named sections. Four readers
looked for something else:

| Reader | Looked for |
|---|---|
| `add.md` STEP 1 | `docs/owner.md` — no `product/` segment |
| `add.plan.md` STEP 1 | `docs/owner.md` — same |
| `status.sh` | `docs/owner.md`, then grepped `^Nome:`, `^Nivel:`, `^Idioma:` |
| `init.sh` | the same wrong path and the same plain-text lines |

Neither script's grep could ever match a schema-based document, so both always fell through to their
`unknown|intermediate|en-us` defaults — on every run of every command that claimed to honour the
profile.

## What changed

- **Deleted:** `commands/add.init.md`, `skills/add-product-discovery/SKILL.md`,
  `skills/add-doc-schemas/references/product.md`, and both `provider-map.json` entries.
- **Every reference removed first, in its own commit**, so `node scripts/build.js`'s
  dangling-`uses:`-target gate stayed green at each step: the top-of-file `> **OWNER:**` banner in 13
  commands, `add.md`'s and `add.plan.md`'s whole STEP 1 (with the renumbering that follows), body
  parse-lists in `add.brainstorm.md`, `add.diagnose.md` and `add.qa-setup.md`, the `OWNER` blocks in
  `status.sh` and `init.sh` with their bats assertions, and the catalog rows and mention edges in
  `add-ecosystem`, `add-feature-specification`, `add-health-check`, `add-project-scaffolding` and
  `add-doc-schemas`.
- **Two gaps the plan never named, found by the build's own sweep:** `cli/src/installer.js` told every
  fresh install to run `/add.init` as its first step (now points at `/add`), and
  `.claude/commands/add-framework--sync.md` named it in a diagram example — `[internal]`, so it got its
  own F-block rather than being folded into a `[product]` one.
- **A phantom-edge side effect, fixed per file.** In `add.audit.md`, `add.new.md`, `add.ux.md` and
  `add.wiki.md` the deleted banner was the only non-fenced prose naming `status.sh`, so removing it
  left four new graph warnings. The two commands that really invoke it got a true inline mention; the
  two that never did had the dead `- script: status.sh` declaration removed instead.
- **Counts and step numbers the removal moved** are updated with the reason inline: three node kinds
  and two totals in `build-artefact-graph.test.js`, one dependant count in `mcp-server.test.js`, and
  every `add.plan` step number the qa fragments anchor on (`8.4` → `7.4`, `STEP 10` → `STEP 9`,
  `### 8.1` → `### 7.1`).

## What survives on purpose

`add.new.md` and `add.brainstorm.md` keep their optional `docs/product/product.md` read. Both already
treat it as "if it exists", so with no writer left it is a no-op rather than a break. `docs/prd/` and
the `prd` schema are untouched — a different directory in a different schema category.

## Verification

`node scripts/build.js` clean at every F-block (225 nodes, 866 edges, no new warning), bats 425/425 on
the F1 script edits, and a whole-repo sweep showing no surviving reference outside historical
documents and regenerated provider output.

⚠️ The full `cli` suite does not give a stable verdict on the machine this was built on — the suite
rewrites the build sidecars while it runs, so the result depends on file order, and the same machine's
untouched `main` checkout fails the same MCP tests. Every failure attributable to this delivery was
reproduced in isolation, fixed, and re-verified in isolation. **CI owns the verdict for this branch.**

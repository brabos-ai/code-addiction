<!-- uses:
- skill: add--ux-design
-->

<!-- section:layout -->

**Design source — ui-ux-pro-max.** Only when the prompt carries `DESIGN_SOURCE=ui-ux-pro-max <dir>`.

**Precedence:** inspected project tokens (`design-context.md`) → `docs/design-system.md` (or a user-made `design-system/<slug>/MASTER.md`) → ui-ux-pro-max → `add--ux-design` defaults.

- Use it ONLY for `## Design Contract` rows you would otherwise write as `unknown`. From `<dir>`, one targeted search per empty row: `python3 scripts/search.py "<keywords>" --domain typography`, `--domain chart` (chart type for a data screen) or `--domain style`.
- Write the value in the existing `Dimension | Declares | Verified by | Method` table and cite ui-ux-pro-max in the row. Add no dimension.
- Never pass `--persist` — your write scope is `design-layout.md`.
- No `python3` (on Windows try `py`), or the search fails: leave the row `unknown — <why>` as the design core says, with one line noting the search did not run.

<!-- /section:layout -->

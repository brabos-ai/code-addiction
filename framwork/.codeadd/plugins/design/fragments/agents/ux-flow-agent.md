<!-- uses:
- skill: add--ux-design
-->

<!-- section:direction -->

**Design source — ui-ux-pro-max.** Only when the prompt carries `DESIGN_SOURCE=ui-ux-pro-max <dir>`.

**Precedence:** inspected project tokens → `docs/design-system.md` (or a user-made `design-system/<slug>/MASTER.md`) → ui-ux-pro-max → `add--ux-design` defaults.

- **New project** (fewer than 5 components) with no `docs/design-system.md`: run at most ONE search from `<dir>`: `python3 scripts/search.py "<product and domain keywords>" --design-system`. Take palette, font pairing and style into `design-context.md` `theme` and `constraints`, and cite ui-ux-pro-max as the source.
- **Established project:** fill ONLY the dimensions the inspection left empty. Never override an inspected token.
- Never pass `--persist` — it writes `design-system/<slug>/MASTER.md` into the repo, and your write scope is `design-context.md` and `design-flow.md`.
- No `python3` (on Windows try `py`), or the search fails: say so in one line in `design-context.md` and continue with the design core.

<!-- /section:direction -->

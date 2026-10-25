<!-- uses:
- skill: add--ux-design
-->

<!-- section:critique -->

**Design source — ui-ux-pro-max.** Critique Mode only, and only when the prompt carries `DESIGN_SOURCE=ui-ux-pro-max <dir>`.

**Precedence:** inspected project tokens (`design-context.md`) → `docs/design-system.md` (or a user-made `design-system/<slug>/MASTER.md`) → ui-ux-pro-max → `add--ux-design` defaults.

- Use results ONLY as evidence on items that already exist in `critique-rubric.md` (contrast, typography pairing, chart choice). From `<dir>`: `python3 scripts/search.py "<keywords>" --domain ux` or `--domain color`. Add no rubric item and change no severity.
- Never pass `--persist` — your write scope is `design-review.md`.
- No `python3` (on Windows try `py`), or the search fails: say so in one line in `design-review.md` and critique with the design core alone.

<!-- /section:critique -->

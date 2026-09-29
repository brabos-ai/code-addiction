---
name: add-framework-injection
description: Use when planning or building a change to product injection — slot markers, fallback files, baseline rendering, or stable STEP IDs. Internal only. Does not ship to users.
---

# Injection authoring

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Owns how a product command or agent declares an injection slot, which fallback it uses, and how a STEP ID is named. The build extracts the slot. The CLI renders from a saved baseline. This skill does not restate that code.

## When to Use

- An F-block adds, moves, or removes a feature or plugin marker in `framwork/.codeadd/`.
- An F-block adds a fallback file or changes which slot points at it.
- An F-block renames a product STEP ID or a fragment section that lands in an installed command.

## When NOT to Use

- A change that does not touch injection markers, fallbacks, baselines, or STEP IDs.
- Numbered STEPs in `workbench/`. Those stay numbered.

## Declare a slot

Wrap every standalone feature or plugin marker pair in one slot. A slot is a maximal run of pairs separated only by whitespace. One non-whitespace line starts a new slot.

```
<!-- slot:NAME fallback="fallbacks/FILE.md" -->
<!-- feature:name:section -->
<!-- /feature:name:section -->
<!-- /slot:NAME -->
```

Member order inside the slot is the installed order. It does not follow the order features were enabled.

The fallback path is relative to `framwork/.codeadd/`, starts with `fallbacks/`, and has no `..`. `fallbacks/empty.md` is zero bytes. Only the shared `add-plan` step-list slot uses `fallbacks/plan-specs.md`.

A member pair is empty. The body lives in the fragment file. Only member marker pairs and whitespace may occur between the slot markers. A marker outside a slot fails the build.

## Render

The installer saves a pristine copy of each slotted provider file before composition. Enable, disable, install, and update re-render that file from the baseline plus the current manifest. They do not append to the previous installed text.

A valid enabled member contributes its section, in source order. A missing file, missing section, or bad payload warns with resource, slot, and member, skips that member, and leaves the manifest flag on. The fallback is used only when zero members contribute. An empty fallback adds no bytes and no blank line.

Plugin tool detection stays the gate it already is. A plugin that fails detection does not contribute. Its skills still follow the plugin enable path.

## STEP IDs

A product step ID is `STEP <owner>.<subject>`. The owner is the command, feature, or plugin. The subject names the action. The same ID appears in the overview and the heading. Section names such as `step-list` and `step9` stay section names. They are not step IDs.

`STEP tdd-pipeline.test-spec` comes before `STEP qa-pipeline.qa-spec` in the `add-plan` step list, whatever enable order was used. An absent QA section does not mean qa-pipeline is off when the manifest still requests it.

## Validation

- [ ] Every marker pair sits in exactly one slot
- [ ] Only `add-plan` step-list uses the nonempty fallback
- [ ] Reversed enable order produces the same installed bytes
- [ ] `node scripts/build.js` exits 0 with no new warning

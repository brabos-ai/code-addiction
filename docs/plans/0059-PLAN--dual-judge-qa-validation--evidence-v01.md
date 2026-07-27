# Evidence v01 — Plan 0059: Dual-Judge QA Validation

> **Date:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability` (0059 continues on the same branch)
> **Discipline:** subagent-driven-development protocol per the umbrella handoff, resumed in a fresh session. Tasks 1–3 were implemented + reviewed on another machine (commits `3ecf880`, `6ef8d41`, `38c01e1`, `8fdb63d`); Tasks 4–5 implemented + verified here. Source of truth is git history + the plans + `HANDOFF-qa-ux-umbrella.md`.
> Local environment: Linux / WSL2 / node 22. This checkout materializes **LF** line endings, so the Windows-only CRLF vitest failures the handoff enumerated (27) do not occur here — full vitest is **464/464 green**.

## Resumption verification (T3 anchor question — the handoff's open item)

The handoff left one correctness question unanswered before Task 4: T3 deleted `qa-agent.md`'s old `### Step 0.5`, which sat below the `plugin:playwright:drive` marker, changing the anchor's `next` drift hint. Resolved as **safe** by reading `scripts/build.js` (`extractInjectionPoints`) + `cli/src/injection-core.js` (`insertBlockAfterAnchor` / `existsBelow`):

- `next` is **recomputed from the current file on every build** (`build.js:184`) and ships as a matched pair with the marker-free provider file in the same release. The drift guard (`injection-core.js:116-121`) only fails loud when the recorded `next` is absent *below the anchor in the installed file*.
- **Fresh install, regenerated sidecar:** `next="### Axis 1…"` matches the shipped `qa-agent.md` → injection succeeds.
- **Old install, old sidecar:** it also holds the *old* `qa-agent.md` (both shipped together) → old `next` matches its own file → enable/disable work.
- A changed `next` never crosses a release boundary, so it cannot break injection. The guard fires only on genuine post-install user hand-edits — its intended behavior, untouched by T3.

Empirical confirmation from the regenerated sidecar: `plugin:playwright:drive` on `qa-agent` has `anchor.text` = "By default you judge from the persisted evidence…", `ordinal: 1`, `position: after`, `next: "### Axis 1 — Functional delivery…"`. **T3 marked clean.**

## Task 4 — `qa-validation` schema + `add-qa` skill + ecosystem

Commit `042996f`.

`framwork/.codeadd/skills/add-doc-schemas/references/review.md` (`qa-validation` schema): `type` extended to `ux | functional | a11y | spec-gap`; `root cause` REQUIRED on `type: functional` findings (7-value taxonomy named inline); `unverifiable` check outcome added; **`Responsiveness` + `Accessibility` added to the `Sections:` list** (they existed only in the report template, invisible to the gate's depth-floor walk); `## TOC` required (report carries 9+ H2 sections); `dual-axis` reframed to `dual-judge`; per-judge Summary counts + coverage-is-coordinator's noted; hard bans extended (functional finding without a root cause; a not-run check recorded as passing instead of `unverifiable`).

`framwork/.codeadd/skills/add-qa/SKILL.md`: frontmatter `dual-axis` → `dual-judge`; Overview rewritten to the two-parallel-judges model; the single-judge 4-axis Validation Model table replaced with an **Axis ownership** table (mirrors `add.qa` STEP 4.5 verbatim) + the "no axis judged twice" invariant + the "deterministic conformance compares numbers, not images" distinction (preserves the no-pixel-diff/no-baseline decision); new **Review-mode Approval Rubric summary**, **Root-cause Taxonomy** table, and **Merge Rules** (dedupe/precedence/severity/contradiction); Severity taxonomy `type` enum gains `spec-gap` + the `unverifiable` note; report template gains `## TOC`, a per-judge Summary table, `spec-gap` in the finding heading enum, and a `Root cause / Conformance` finding line; Validation Checklist rewritten to the dual-judge invariants.

`framwork/.codeadd/skills/add-ecosystem/SKILL.md`: `add.qa` command row → dual-judge dispatch; `add-qa` skill row → dual-judge + root-cause taxonomy + merge rules; `ux-agent` agent row gains review mode + `add.qa (STEP 4.5 review, ∥ qa-agent)` dispatch; `qa-agent` agent row rewritten (deterministic+forensic half, no memory); Dependency Index rows for `qa-agent`, `ux-agent`, and `add-ux-design (design.md) → add.qa` updated; all `4-axis`/`4 axes` wording retired.

## Task 5 — sweep + tests + evidence + changelog

Commit: this commit.

**Grep sweep (source only, brainstorming excluded as historical):**

```
$ grep -rniE "4-axis|four-axis|dual-axis|4 axes|four axes" framwork/.codeadd/
(no output)                       # add-qa-migration "dual-axis" → "dual-judge" fixed
$ grep -rniE "step 0\.5" framwork/.codeadd/
(no output)                       # Step 0.5 fully removed (T3) + no stray refs
```

Sweep fixes applied:
- `plugins/playwright/fragments/add.qa.md`: single-judge framing → "the `@qa-agent` half of the dual judge additionally drives"; `@ux-agent` judges from persisted PNGs, does not drive.
- `plugins/playwright/fragments/agents/qa-agent.md`: the stale "read-PNG axes (UX / functional / responsiveness / a11y)" line → "functional delivery, deterministic conformance, and ALL a11y" (UX-judgement + responsiveness are `@ux-agent`'s).
- `skills/add-qa-migration/SKILL.md:22`: `dual-axis QA model` → `dual-judge QA model`.
- `agents/ux-agent.md` spec-gap section: `six dimensions` coherence fix — spec-gap applies to the **five declarable** dimensions (breakpoint, primary-CTA count, hierarchy, optical alignment, required states); "Overall UX quality" (#6) is a holistic read, never a spec-gap.

**Test fixtures:** `cli/tests/build.test.js` already pins `qa-agent` has NO `memory:` line (added with T3) — no fixture change needed.

**Smoke suite extended (scenario 7, +6 tests → 23 total):** built `add.qa` dispatches `@ux-agent` ∥ `@qa-agent` with `WAIT-ALL` + run-NNN resolved at STEP 4.1; built `qa-agent` has no `memory:` line + a root-cause taxonomy; built `ux-agent` carries the review rubric ("context, not immunity") + `spec-gap`; built `review.md` reference declares `spec-gap` + `unverifiable`; built `add-qa` skill documents Axis ownership + Root-cause Taxonomy + Merge Rules with no stale `N-axis` wording; and the `plugin:playwright:drive` anchor text is **pinned** on both `add.qa` (`WAIT-ALL before STEP 5.`) and `qa-agent` so any future edit to the adjacent prose fails loud.

**Verification:**

```
$ node scripts/build.js
  Injection points : 35   Total : 635 files generated     # clean, no anchor warnings
$ cd cli && npx vitest run tests/qa-reachability.smoke.test.js
  Test Files 1 passed (1)   Tests 23 passed (23)
$ npx vitest run
  Test Files 26 passed (26)   Tests 464 passed (464)       # LF checkout: 0 CRLF failures
```

bats not installed on this checkout; Tasks 4–5 changed **no shell scripts** (only skills/agents/fragments/tests), so the bats suite is unaffected by this plan.

## Framework version bump obligation

This plan changes the `qa-validation` doc schema (new `type` values, required `root cause`, new required sections). Per the umbrella convention, `add-framework--release` must bump the framework version when cutting the release that ships this. Recorded here and in the changelog so it is not missed.

## Status

Plan 0059 Tasks 1–5 complete. Pending: whole-topic final review (diff `f35db0e..HEAD`), then plan 0060.

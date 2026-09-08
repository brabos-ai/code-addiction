# Brainstorm: Rename the `tdd` Feature to `tdd-pipeline`

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** architecture
> **Umbrella:** `2026-08-24-development-loop-consolidation-000-umbrella.md` (topic 01 of 05)

## Discovery

- `cli/src/features.js:36-47` — the whole registry is two literal entries. `tdd` carries `description`, `default: true`, `commands: ['add.plan','add.build','add.review']`. The `commands` array is **documentation only**: nothing filters injection by it, because the real scoping comes from the build-emitted sidecar.
- `features.js:55-67` — `getFragments(cwd, featureName)` reads `.codeadd/fragments/<featureName>/*.md`. **The object key doubles as a directory name.**
- `features.js:152-168` — `applyEnabledFeatures` resolves each registry entry as `featureStates[name] ?? meta.default`. This single line is the whole migration hazard.
- `features.js:235-238` — `codeadd features enable|disable <name>` rejects any name not literally present as a key.
- `cli/src/updater.js:152-168` — `previousFeatures` is written back verbatim, unfiltered, then `applyEnabledFeatures` runs against the **new** registry.
- `framwork/.codeadd/scripts/qa-preflight.sh:38-39` — a **second, independent** hardcode of a literal manifest key (`'qa-pipeline'`), living in a script that ships into every installed project. Its own comment disclaims duplicating the defaults registry but still duplicates the key string.
- Three hand-maintained tables mirror the registry: `CLAUDE.md:134-135`, `skills/add-ecosystem/SKILL.md:107-108`, `web/src/pages/docs.astro:582-590`.
- `cli/tests/features.test.js` alone contains ~94 occurrences of the literal strings `tdd` / `qa-pipeline` (89 + 5, case-sensitive).
- **Plan 0067** proved the injection engine round-trips byte-identically; the risk here is not injection, it is key resolution.

## Context & Motivation

The umbrella renames `tdd` to `tdd-pipeline` so the two optional features read as a matched pair (`tdd-pipeline`, `qa-pipeline`) rather than as a discipline and a pipeline. Topic 03 folds unit and integration test generation into `add.build` under this feature, which makes the "pipeline" reading the accurate one: with the feature off there is no test generation at all, not merely no test-first ordering.

This topic goes first because it is mechanical and independent, and because topic 03 should write the final key once instead of writing `tdd` and renaming it later.

## Problem / Opportunity

A bare rename is a silent data-loss bug, not a cosmetic change. Traced end to end:

1. An installed project's `manifest.json` holds `"features": { "tdd": false }` — the user explicitly disabled it.
2. `codeadd update` copies `previousFeatures` back verbatim (`updater.js:152`), then calls `applyEnabledFeatures`.
3. `applyEnabledFeatures` looks up `featureStates['tdd-pipeline']`, gets `undefined`, and falls back to `meta.default`, which is `true`.
4. **TDD is silently re-enabled for a user who explicitly turned it off**, and their fragments are injected back into three commands.
5. The orphaned `manifest.features.tdd` key is never read again and never cleaned — `readManifest` / `saveManifest` round-trip the JSON as-is, so it lingers as dead data forever.
6. `codeadd features disable tdd` — muscle memory, or a line in someone's setup script — now hard-fails with `Unknown feature "tdd"`.

Failure mode 5 deserves emphasis because it is the one alias resolution alone does **not** fix: `applyEnabledFeatures` calls `saveManifest` only when a feature resolves enabled, so a manifest holding a disabled legacy key is never rewritten by a passive `codeadd update`.
7. `applyFromZip` only writes entries present in the release zip and never deletes; `.codeadd/fragments/tdd/*.md` remains on disk beside the new `fragments/tdd-pipeline/*.md`.

Separately, the investigation surfaced that `qa-preflight.sh` duplicates the manifest key string outside the registry. Any future rename of `qa-pipeline` has the same class of bug waiting in a shell script, and nothing today would catch it.

## Proposed Solution

**Recommended — an `aliases` field on the registry entry, resolved before the default.**

`FEATURES['tdd-pipeline']` gains `aliases: ['tdd']`. Resolution becomes: explicit new key, then any alias key, then `meta.default`. Enable and disable accept an alias, act on the canonical key, and print a one-line deprecation notice. On any write, the manifest is normalised — the canonical key is written and the alias key is dropped, so the migration happens once, silently, on the first update.

Alias resolution alone kills failure modes 1 through 4 and 6: nobody is silently re-enabled, and `features disable tdd` keeps working. Failure mode 5 — the orphaned `tdd` key lingering as dead data — needs one more thing, because `applyEnabledFeatures` only reaches a `saveManifest` when a feature resolves **enabled**; a manifest holding `{"tdd": false}` never writes at all. So `applyEnabledFeatures` gains an unconditional normalisation pass: on every run it rewrites `manifest.features` with canonical keys and drops resolved aliases, regardless of enabled state. That is a new write path inside `features.js` — still not `updater.js`, and still not a one-shot migration script with no retirement date.

Orphaned `fragments/tdd/` files remain on disk but are inert: the sidecar has no point naming them, so nothing reads them.

**Alternative A — a one-shot migration in `updater.js`.** Rewrites `manifest.features` on update. Rejected: it only helps projects that run `update`, it does nothing for `features disable tdd` muscle memory, and the migration code has no natural retirement date.

**Alternative B — no alias, document the breaking change.** Rejected: the failure is silent. A user who disabled TDD gets it back with no output that says so.

**Adjacent hardening (in scope):** extract the manifest key probe in `qa-preflight.sh` so the literal string appears once, and add a test that fails when a registry key has no corresponding fragment directory. The rename is the occasion to close the class of bug, not just the instance.

## Type of Artefact

architecture (CLI feature registry, shipped script, fragment directory, documentation tables)

## Scope

### Includes

- `cli/src/features.js`: key rename, `aliases: ['tdd']`, alias-aware resolution in `applyEnabledFeatures`, `getFeatureStates`, and the `features` CLI entrypoint
- An unconditional normalisation pass in `applyEnabledFeatures`: canonical keys written, resolved alias keys dropped, on every run regardless of enabled state
- Deprecation notice on alias use in `features enable|disable` (`list` takes no feature argument, so it instead annotates any row whose manifest still carries a legacy alias key)
- `framwork/.codeadd/fragments/tdd/` renamed to `fragments/tdd-pipeline/`
- Re-keying the 9 `feature:tdd:*` markers in `add.plan.md`, `add.build.md`, `add.review.md` to `feature:tdd-pipeline:*`
- Extracting the duplicated manifest key probe in `qa-preflight.sh`
- A CLI test guard in `cli/tests/features.test.js` asserting every `FEATURES` key has a matching directory under `framwork/.codeadd/fragments/` (a test, not a build gate: `scripts/build.js` has no reference to the CLI registry today, and wiring one would be new cross-package coupling)
- Updating the three hand-maintained tables (`CLAUDE.md`, `add-ecosystem/SKILL.md`, `docs.astro`)
- `cli/src/installer.js:287` display string ("TDD is enabled by default")
- Re-anchoring the affected CLI tests

### Does NOT Include

- Renaming `qa-pipeline` (it is already correctly named)
- Renaming the `add-tdd` **skill** or its `provider-map.json` entry — the skill is a distinct artefact and its name is not the feature key
- Changing the `tdd-pipeline` default (stays `true`) or its fragment content
- Moving unit/integration generation into the feature — that is topic 03
- Deleting orphaned `fragments/tdd/` from already-installed projects

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Alias field on the registry, not a migration script | Covers update, enable, disable and list in one mechanism; no code with an undefined retirement date | ✅ |
| Alias resolved **before** `meta.default` | The default fallback is the exact line that causes silent re-enablement | ✅ |
| Normalisation is an unconditional pass in `applyEnabledFeatures`, not a side effect of enable/disable | `saveManifest` is only reached when a feature resolves enabled, so the disabled-legacy-key case — the exact motivating scenario — would otherwise never be cleaned | ✅ |
| Alias use prints a deprecation notice, does not fail | Someone's script calls `features disable tdd`; failing it converts a rename into an outage | ✅ |
| Orphaned `fragments/tdd/` is left on disk, inert | `applyFromZip` never deletes by design; the sidecar names no point in that directory, so nothing reads it. Deleting would need a new destructive code path for no benefit | ✅ |
| `qa-preflight.sh`'s duplicated key probe is extracted in this topic | It is the same class of bug, found during this investigation, in a file that ships to every project | ✅ |
| The `add-tdd` skill keeps its name | Skill names and feature keys are separate namespaces; renaming it would churn `provider-map.json`, every command that loads it, and the docs, for symmetry alone | ✅ |
| The guard is a CLI test, not a build gate | The key doubles as a directory name (`getFragments`); a mismatch is currently a silent no-op. `build.js` has no CLI-registry import today, and adding one for this is more coupling than the check is worth | ✅ |
| The `CLAUDE.md` feature-table row is routed through a companion `/add-framework--self-plan` | Plan 0067 did carry a `CLAUDE.md` one-liner inside a product-layer plan, but the repo's own layer table assigns `CLAUDE.md` to `add-framework--self-build`, and topics 02, 03 and 05 all use the companion pattern. Consistency across the umbrella beats reusing a one-off precedent | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `cli/src/features.js` | Key rename, alias resolution at 3 sites (`applyEnabledFeatures`, `getFeatureStates`, the `features` CLI entrypoint), plus a new unconditional normalisation pass | Rewrite the registry entry, the three resolution sites, and add the normalisation write |
| `cli/src/installer.js:287` | Display string names "TDD" | Update copy |
| `framwork/.codeadd/fragments/tdd/` | Directory rename (3 files) | `git mv` to `fragments/tdd-pipeline/` |
| `commands/add.plan.md` | 2 markers (`tdd:step-list` L59-60, `tdd:step9` L494-495) | Re-key |
| `commands/add.build.md` | 5 markers (`tasks-flow`, `gate`, `verify-red` L266-271; `awareness` L283-284; `verification` L512-513) | Re-key |
| `commands/add.review.md` | 2 markers (`tdd:step-list` L28-29, `tdd:spec-audit` L346-347) | Re-key |
| `framwork/.codeadd/scripts/qa-preflight.sh:38-39` | Duplicated manifest key literal | Extract to a single named probe |
| `framwork/.codeadd/scripts/tests/qa-preflight.bats:41,48` | Fixtures name the key literally | Update alongside the probe |
| `CLAUDE.md:134-135` | Feature table | Internal layer — companion `/add-framework--self-plan`; `/add-framework--build` does not reach `CLAUDE.md` |
| `skills/add-ecosystem/SKILL.md:107-108` | Feature table plus ~10 prose cross-references | Update |
| `web/src/pages/docs.astro:582-590` | Hand-written feature card with default badge | Update |
| `cli/tests/features.test.js` | ~94 occurrences of the literal keys | Re-anchor; add alias-resolution cases; add the registry-key-to-fragment-directory guard case |
| `cli/tests/build-injection-points.test.js` | 28 occurrences | Re-anchor |
| `cli/tests/updater.test.js`, `install.e2e.test.js` | Feature state round-trip | Add a case proving an explicitly-disabled `tdd` stays disabled after update |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A matched feature pair (`tdd-pipeline`, `qa-pipeline`) that reads as one system | A permanent alias entry in the registry |
| No silent state loss on update | Registry resolution grows one indirection |
| One duplicated-key class of bug closed, not just its instance | A slightly larger diff than the rename alone |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Alias resolution ordering implemented wrong (default wins over alias) | Medium | A regression test that sets `{"tdd": false}` in a manifest, runs update, and asserts the feature is still disabled |
| A marker is re-keyed in source but its sidecar anchor changes, silently breaking injection | Medium | Plan 0067's exactly-once red-green matrix is already the acceptance check; extend it to the renamed key |
| A hand-maintained table is missed and drifts | Medium | All three are enumerated above; `add-ecosystem/SKILL.md` also carries prose references beyond the table |
| Someone renames `qa-pipeline` later and repeats the bug in `qa-preflight.sh` | Low after this change | The extracted probe leaves exactly one place to change |

## Next Steps

Run: `/add-framework--plan rename the tdd feature to tdd-pipeline with a deprecation alias`

Then, as a companion for the internal layer (`/add-framework--build` does not reach `CLAUDE.md`):

Run: `/add-framework--self-plan update the CLAUDE.md feature table for the tdd-pipeline rename`

# Fix — the QA auth seed leaves the committed settings, and the docs-branch rollout is tightened

**Date:** 2026-11-12 · **Type:** fix · **Plan:** `2026-11-12T162612-PLAN--docs-branch-fixes` · **Release:** patch (v1.9.2), tagged by `add-framework--release`

## Summary

`qa.authSeed` is a credential, and it sat in the committed `.codeadd/settings.json`. It now lives only in the gitignored
`.codeadd/settings.local.json`. A migration moves an existing value, and every command, skill, agent and script that read or
described the old place now reads the local file. Because the value was committed before, users must rotate any seed that
reached a remote.

## What shipped

- **The secret fix.** The managed gitignore block names the local settings file. Migration `0007-move-qa-auth-seed` and `docs migrate` move the value and print a rotation warning. The installer and uninstaller treat the local file as the user's data. `qa-preflight` and `status` read the seed from it.
- **Docs-branch tightening.** `docs migrate` stamps converted docs, lists the ones that need an update (`NEEDS_UPDATE`), and prints a per-run summary. A guard test fails when a legacy docs path is tracked. `sync` and `release` prompts say who stages and where notes come from.
- **Release changelog.** `scripts/changelog-promote.cjs` promotes `[Unreleased]` to the release heading, and `create-release-tag.cjs` refuses a stable tag with no heading.

## Why

The seed was the only secret the framework asked users to commit. Moving it fixes the exposure going forward; the rotation warning covers what already leaked. The rest closes gaps the v1.9.0 docs-branch rollout left in migration and release.

## Notes

Four cli tests fail on `main` in the docker runner before this change (baseline in the ledger); CI on the branch head was green.

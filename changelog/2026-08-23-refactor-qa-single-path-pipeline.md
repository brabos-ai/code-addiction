# 2026-08-23 — refactor: QA single-path pipeline

Plan: `0068-PLAN--qa-single-path-pipeline`

## Commands
- Modified: `add.qa` (preflight rows 9–10 hard-gate on receipt + shape match; Phase B renumbered 11–14)
- Modified: `add.qa-setup` (binary FIRST-RUN / CURRENT / STALE; per-key config merge; empty catalog scaffold only; `setup-shape` receipt; no deltas)
- Modified: `add.plan` (sole design producer; dropped `/add.design` refs; no `expect` derivation)
- Modified: `add.new`, `add.autopilot` (next step is `/add.plan`)
- Removed: `add.design`

## Skills
- Modified: `add-setup-contract` (compare-and-route only)
- Modified: `add-qa-spec`, `add-qa` (deleted catalog `expect`)
- Modified: `add-doc-schemas` receipt + `new-feature` (one caller)
- Modified: `add-ecosystem`, `add-id-convention`, `add-ux-design/critique-rubric`
- Removed: `add-qa/references/setup-contract.md`

## Scripts
- Modified: `qa-preflight.sh` (`QA_RECEIPT`, `QA_CONTRACT_MATCH`)
- Modified: `status.sh` (`SETUP_QA_STALE`; dropped `SETUP_QA_CONTRACT` / `SETUP_QA_BEHIND`)
- Modified: `scripts/build.js` (`extractContract` identity is `shape` only; CRLF-tolerant parse)

## Agents
- Modified: `ux-flow-agent`, `ux-layout-agent`, `ux-agent` (dispatched by `add.plan` only)

## Other
- `provider-map.json`: 18 commands
- Tests rewritten for shape identity
- Docs: `CLAUDE.md`, `README.md`, `docs.astro`, `ecosystem.md`
- Internal: `add-framework--sync` auxiliary list

# Dispatch without an invented resume id, GitNexus with the right repo

**Date:** 2026-09-17
**Plan:** `2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo`
**Layers:** product (commands, skill reference, gitnexus plugin fragments and catalog, cli tests)

## TL;DR

A `/add.build` run on OpenCode failed twice dispatching `@backend-agent` — the model put an invented
UUID in the task tool's resume field — and once calling `gitnexus_impact` with two repositories
indexed. Every dispatching command now reads one rule that keeps resume fields empty on a fresh
dispatch, and every GitNexus fragment carries the repo rule itself.

## What changed

- **New `add-subagent-driven-development/references/dispatch-rules.md`.** A fresh dispatch fills no
  resume, session or task-continuation field; only an id an earlier dispatch in the same session
  returned is ever passed. It names no provider.
- **Eight commands point at it** before their first dispatch and declare it in `uses:` — `add.audit`,
  `add.build`, `add.diagnose`, `add.hotfix`, `add.new`, `add.plan`, `add.review`, `add.wiki`.
  `cli/tests/dispatch-rules.test.js` scans every command containing `DISPATCH`, so a new dispatching
  command without the pointer fails the suite.
- **`add.build` gets GitNexus guidance.** New `plugin:gitnexus:graph-build` marker at STEP 10.0, new
  `plugins/gitnexus/fragments/add.build.md`, and `add.build` added to `gitnexus.injects`. A project
  with the plugin enabled receives it on `codeadd update`.
- **All 16 GitNexus fragments state the repo rule** inside an injected section: more than one repo
  indexed → `list_repos` once, pass `repo` on every call. `add.wiki` also passes it into each analyzer
  prompt. `cli/tests/gitnexus-plugin.test.js` asserts it per fragment.
- **`add-ecosystem`'s plugin table** lists `add.build` among the gitnexus targets.
- Count locks moved with comments: injection points 45 → 46, gitnexus points 20 → 21, graph nodes
  225 → 227 (+1 reference, +1 fragment).

## Not included

- A gitnexus fragment for `add.review` — its orchestrator never calls GitNexus; `@reviewer-agent` is
  covered by its own fragment.
- `web/src/pages/docs.astro` still lists six gitnexus targets; `/add-framework--sync` regenerates it.
- A live re-run of `/add.build` on OpenCode with two indexed repos — a manual check after release.

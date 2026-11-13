# qa-project-seed

Source: Maicon, 2026-11-12 (America/Sao_Paulo). Literal directive: no fallback; `/add-qa-setup` must inspect how the project works and its prerequisites and plan a way to have the data seeded and ready every time a QA test runs; the seed may live outside git, but it must be project-based, with nothing hardcoded. Then the Engineer's recommendation, aligned with Maicon: the seed evolves per feature. Last, Maicon's rule that seed instructions exist only when the QA feature is on. PM decisions below. Related: [Correções pós-v1.9.1 do docs-branch](https://app.notion.com/p/416e0000aeae812ab748d3323ec7479e) (v1.9.2 moved `authSeed` to `.codeadd/settings.local.json`; this card replaces that for QA). Checked on main `12f91289` (v1.9.2). Paths are under `framwork/.codeadd/` (product) unless stated otherwise. Patch v1.9.3.

Maicon later approved versioning the seed in git without secrets, and approved running plan, build, done, sync and release for v1.9.3 without check-ins.

Card: https://app.notion.com/p/417e0000aeae81ceb698d136437d5cb2
Intent: https://app.notion.com/p/417e0000aeae8171943ae0d8aafcd4c1

```yaml
path: architectural
topic: qa-project-seed
doc: none
delivery: confirm
ticket: none
```

## Investigation evidence (file:line)

- `framwork/.codeadd/skills/add--settings/SKILL.md:64-77`
- `framwork/.codeadd/commands/add-qa-setup.md:147,206-207,339-356`
- `framwork/.codeadd/commands/add-setup.md:145`
- `framwork/.codeadd/agents/e2e-agent.md:21`
- `framwork/.codeadd/plugins/playwright/fragments/agents/qa-agent.md:19`
- `framwork/.codeadd/skills/add--qa/SKILL.md:83,132,222`
- `cli/src/migrations.js:527,566,598`
- the agent-mode qa-setup fragments

Additional locations recorded in the refined intent: `skills/add--settings/SKILL.md:119`, `commands/add-qa-setup.md:462`, `agents/qa-agent.md:27`, `skills/add--qa/SKILL.md:128-132`, `skills/add--qa/references/coordinator.md:70`, `skills/add--setup-contract/SKILL.md:68`, `fragments/qa-pipeline/add-build.md:46`, `plugins/playwright/fragments/add-review.md:8`, `scripts/qa-preflight.cjs:15,234-239`, `scripts/status.cjs:32,457`, `cli/src/migrations.js:524-566,597-598` (`0007-move-qa-auth-seed`), `cli/src/docs-migrate.js:115-118,215-247`, `cli/src/gitignore.js:11`.

## Decided

1. Problem: QA assumes a sign-in as a test user. `authSeed` is a free-text hint that `/add-qa-setup` always asks for, without inspecting the project. There is no path for a project with no auth, QA agents improvise a form login, and migration 0007 and the v1.9.2 CHANGELOG talk about a "test password" as if every project had one. Where it lives today: the investigation evidence above.

2. Remove `authSeed` from the framework entirely: the settings schema, qa-setup, add-setup, the QA and e2e agents, the Playwright plugin fragments, the QA skill and coordinator, the preflight and status scripts, `docs-migrate.js` and the migration text. The password vocabulary also leaves the product instructions. No fallback and no compatibility path.

3. `/add-qa-setup` (`commands/add-qa-setup.md`) analyzes the project before it writes anything:
   - the auth model (none, session, OAuth, API key, magic link, ...);
   - the data stores, the required services and how they boot;
   - existing seed, fixture and migration scripts;
   - the env vars they need.
   It then plans and generates a project-specific seed/setup that brings the environment to a ready state: services up if needed, data seeded, and a test identity created when the project has auth. It reuses the project's own seed and migration tooling when it exists, and only generates glue when it does not. Nothing is hardcoded. It detects rather than assumes, and asks only what it cannot infer. "No auth" is valid.

4. Location and tracking (replaces the first draft's gitignored location, because the seed now changes inside feature PRs):
   - The generated seed artifacts live in `.codeadd/qa/` in the code branch and are tracked in git: the seed script, plus a short README of what it does and its prerequisites.
   - The generated `.gitignore` gets `!.codeadd/qa/` in the managed block of `cli/src/gitignore.js`, next to the `.codeadd/*` line and its existing exceptions.
   - The seed holds no secrets. It names env vars only; the values come from the environment or the project's `.env`, which stays ignored.
   - Tracked `.codeadd/settings.json` holds only non-secret config: `qa.seed.command` (how to run it) and `qa.seed.env` (the list of required env var NAMES).
   - The v1.9.2 handling of `qa.authSeed` in `.codeadd/settings.local.json` is superseded: it is removed there too.
   Maicon said the seed *may* live outside git, not that it must. Tracking it is what makes per-feature evolution (decision 5) and fresh clones (decision 8) work. Maicon later confirmed: version the seed without secrets.

5. The seed evolves per feature:
   - `/add-qa-setup` runs once to create the base, and runs again only when the project base changes (for example, the auth model).
   - When a feature needs new QA data or prerequisites, `/add-plan` adds a task to update the seed.
   - `/add-build` updates the seed in the same PR as the feature.
   - The build's internal review checks that the new screens have the data they need in the seed.

6. Injection only through QA fragments (Maicon's rule): every instruction about updating the seed or the test environment in plan, build and review is injected only through fragments conditional on the QA feature being enabled. That is the `qa-pipeline` feature (`cli/src/features.js:63`), whose fragments `fragments/qa-pipeline/add-plan.md`, `add-build.md` and `add-review.md` are injected by `cli/src/injection-core.js`. With QA disabled, none of it appears in the compiled commands or skills. No seed text goes into the base command bodies. A test must prove that a build without QA contains none of them.

7. QA runs execute the seed first. `skills/add--qa`, the QA and e2e agents and the Playwright plugin run `qa.seed.command` before every run. They use the identity and data it reports: the seed prints machine-readable output (e.g. JSON on stdout with the base URL and how to authenticate, by env var names). If the seed is missing or fails, QA stops with a clear error that says to run `/add-qa-setup`. There is no improvised login and no fallback.

8. Fresh clone: the seed is tracked, so a fresh clone runs QA without rerunning `/add-qa-setup`, once the env vars named in `qa.seed.env` are set. QA still stops with the same clear error when the seed is missing or fails.

9. Projects without auth are first-class: the seed only prepares data and services and reports no identity.

10. Migration `0008` in `cli/src/migrations.js`:
    - it removes `qa.authSeed` from `.codeadd/settings.json` and `.codeadd/settings.local.json`;
    - it prints a clear BREAKING notice: the QA config changed, rerun `/add-qa-setup` (Estanka is affected).
    The `0007` description and notes (`migrations.js:565-566,598`) lose the universal "test password" wording wherever they are user-facing. Past CHANGELOG entries are not rewritten. The v1.9.3 CHANGELOG entry states the change as breaking for QA.

11. Release: patch v1.9.3 (Maicon's choice, despite the breaking QA config).

12. Acceptance criteria:
    - A grep of the product (`framwork/.codeadd/`, `cli/src/`) for `authSeed` and "test password" returns nothing except the removal code of migration `0008`.
    - `/add-qa-setup` on a no-auth fixture and on an auth fixture produces a project-based seed in `.codeadd/qa/`, with the README and `qa.seed.command`/`qa.seed.env`. Only the auth fixture creates an identity, and both reuse the project's own seed tooling when it exists.
    - The seed is tracked: `git check-ignore .codeadd/qa/<seed>` matches nothing on a fresh install, and the seed files hold env var names only, no secret values.
    - A QA run executes `qa.seed.command` first and uses its output. With the seed missing or failing, it stops with the "run /add-qa-setup" error and does not attempt a login.
    - A fresh clone with the env vars set runs QA without `/add-qa-setup`.
    - With QA enabled, the plan template carries a seed-update task when the feature needs new QA data, and the review checks seed data coverage for new screens.
    - Test: a build with the `qa-pipeline` feature disabled contains none of the seed and test-environment snippets in any compiled command or skill. The same build with it enabled contains all of them.
    - `codeadd update` on a fixture with `authSeed` runs `0008`, removes it from both settings files and prints the BREAKING notice.
    - No secret value is in any tracked file.

## Constraints

- Follow TDD red-green for bug fixes and for new behavior covered by tests.
- Keep everything stack-agnostic.
- Keep docs in English.
- Follow the repo hard rules (`{{cmd:}}`/`{{skill:}}` refs, register in `provider-map.json`, no bash dependencies).

## Open

None

```bash
/add-framework--plan <this intent>
```

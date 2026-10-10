# agent-mode: a feature that makes the commands talk to a bot, and an internal pipeline that asks in batches

## Outcome

With the `agent-mode` feature on, the twelve commands that ask or close swap their human-only passages for bot ones. Every question a step needs answered arrives in one numbered message, each with a recommendation. No interactive tool is called. A stop that only repeats something already agreed prints and goes on. No command ends with an offer to continue: each ends on what changed, what still needs a decision and the next command. With the feature off, the installed commands read as before, apart from one line that loads the interaction skill and a changed owner pointer in the offer paragraph. In the internal pipeline, every stop that asks sends all its questions at once, numbered, each with a recommendation.

## Why

The commands were written for a person at a terminal: one question per turn, a structured-question tool, a yes/no offer to continue after every report. A bot that drives them with `claude -p` and `--resume` pays a call for each of those, or hangs on a tool nobody can answer. The guide also said `/add-done` stops before the merge, which it never did.

## Changes

- `cli/src/features.js`: the `agent-mode` feature, off by default, listing the twelve commands.
- `cli/src/injection-core.js`: a slot's fallback resolves `{{cmd:}}`, `{{skill:}}` and `{{addpath:}}` per provider at install, like a member.
- `scripts/build.js`: fallbacks are linted for raw `.codeadd/` paths. For the providers flagged `featureInjection: false` in `provider-map.json` (codex, antigravity, zcode) the build writes an agent-mode slot's fallback in place, because the installer cannot render a slot there.
- `framwork/.codeadd/skills/add--human-interaction` (new): the human rules, moved byte for byte out of `add--delivery-mode`, `add--final-report` and `add--feature-specification`, which keep a mode-neutral pointer.
- `framwork/.codeadd/skills/add--agent-interaction` (new): questions in one numbered batch, deciding stops that end the turn, confirming stops that print and continue, error stops that name the unblocking command, and a closing with no offer.
- The twelve commands (`add-brainstorm`, `add-new`, `add-plan`, `add-build`, `add-review`, `add-done`, `add-diagnose`, `add-hotfix`, `add-qa-setup`, `add-pull-request`, `add-audit`, `add-wiki`): 42 `agent-mode.*` slots. Fallbacks in `framwork/.codeadd/fallbacks/agent-mode.*` hold today's text; the bot versions are in `framwork/.codeadd/fragments/agent-mode/`.
- `add-review`: the staging consent no longer names `AskUserQuestion`; it uses the structured-question tool where the provider has one and an option table elsewhere, for every user. Under agent-mode it takes the consent as given.
- `add-done`: under agent-mode the CI check reads once with no `--watch`; pending CI ends on `/add-done`, and the Resume route merges when it is green. The merge is still automatic.
- `framwork/.codeadd/agent-mode/README.md`: how to turn the mode on, the answer format, the corrected `/add-done` line, chained stages, the providers it reaches, and which result event counts.
- `framwork/.codeadd/skills/add--ecosystem`, `AGENTS.md`: the feature, the skills and the owners.
- Internal: `workbench/skills/add-interaction` (new) and the batch format in `add-framework--brainstorm` (8.1 stays without a recommendation, and says why), `--plan`, `--build`, `--done`, `add-plan-authoring`, `add-build-ledger`, `add-review-discipline`, `add-framework--release`, `add-framework--backlog`, `add-commit`, `building-commands` and `add-framework-injection`. The workbench schema mirror says "numbered question batch" in three descriptions.
- Tests: `cli/tests/agent-mode-feature.test.js` (slots, fragments, on and off renders, the combination matrix, the moved sections, the guide, the internal batch), `cli/tests/helpers/agent-mode-points.js` and `with-fallbacks.js`, and the frozen-count suites now derive the agent-mode share from the fragment files.

## Not done

No change to `result.schema.json`. `/add-done` still merges without a stop. The fragments of other features (`qa-pipeline/add-build.md` 24-31, tdd, board) keep their human stops under agent-mode, and so do the handoff step headings, two lines of `add-brainstorm`, and every error stop. Codex, Antigravity and ZCode installs ignore the flag. The README and the web docs are left to `/add-framework--sync`. Two pre-existing wrong paths in the offer tables of `add-review` and `add-hotfix`, and a contradiction in `add-new` between its re-entry rules, were found and left alone.

# Add: `/add-brainstorm` decides the stack foundations on an empty repo

## Outcome

On a repo with no code and no `AGENTS.md`, `/add-brainstorm` takes the architectural path (`Path: architectural (greenfield)`), asks one five-item foundations question (stack, tenancy, layering, validation, data access/ORM) with a recommendation and a named precedent per item, gated by the architecture skills' over-engineering lists. After either Approve option it writes `.codeadd/wiki/conventions.md` (`## Stack Conventions`, every row `decided`), a minimal `.codeadd/wiki/index.md` and `.meta.json`, and a minimal `AGENTS.md` with the three managed blocks, then the intent file. "Keep discussing" writes nothing. A fresh repo with no commit no longer stops the brainstorm at `status.cjs`. Ticket 0064B.

## Changes

- `add-brainstorm.md`: a `GREENFIELD` trigger evaluated once in load-context, a tolerated `status.cjs` exit 1 or 2 on greenfield only, the new `greenfield-foundations` sub-step inside explore, the foundation writes in `write-intent-file` (before the intent file), the first-commit line in the report, and a gate-table row for the four files. Every non-greenfield run reads the same instructions as before.
- `add-brainstorm.md` `uses:` gains `add--backend-architecture`, `add--frontend-architecture`, `add--agents-md-style`, `add--architecture-discovery` (all conditional), `/add-wiki` and `migrate-context-files.cjs`.
- `add--ecosystem/SKILL.md` and `web/src/pages/docs.astro`: the `/add-brainstorm` description and the Used By cells of the four consulted skills. `web/public/artefact-graph.mmd` regenerated for the new edge.
- New `cli/tests/brainstorm-greenfield.test.js` pins the text, the 0062B contract this writes into, and the three `status.cjs` behaviours the tolerance relies on. `status.cjs` is unchanged.

## Action for installed projects

**Note:** only an empty repo (no `AGENTS.md`, no source files) takes the new path. Nothing changes for any other project.

**Note:** the minimal `index.md` and the `decided` rows are replaced or checked by the next `/add-wiki` run: a full `/add-wiki` rewrites the hub, and `/add-wiki update` marks a `decided` row `detected` when code confirms it or `drift:` when code contradicts it. Until code exists, the rows stay as decided.

**Note:** after a greenfield brainstorm on a repo with no commit, run `git init` and make a first commit before `/add-new`, because `/add-new` runs `status.cjs` too.

> **Kind:** fix
> **Branch:** fix/diagnose-qa-setup
> **Head:** 88106604f893a7430c7c68a7c90b960a933adfb6
> **PR:** https://github.com/brabos-ai/code-addiction/pull/125
> **Ticket:** 0037B

# Fix: diagnose-qa-setup

## What changed

Commits (`git log --oneline main..HEAD`):

- `8810660` fix(commands): resolve add-diagnose and add-qa-setup contradictions — drops the Rules line in `add-diagnose` that asked to confirm the reformulation before investigating, and declares in `add-qa-setup` who runs the install (npm/npx in the command after confirmation; sudo or interactive installs follow `add--dev-environment-setup`).

Files (`git diff --name-status main...HEAD`):

- M `framwork/.codeadd/commands/add-diagnose.md`
- M `framwork/.codeadd/commands/add-qa-setup.md`

## Validation

Head `88106604f893a7430c7c68a7c90b960a933adfb6`. Run https://github.com/brabos-ai/code-addiction/actions/runs/37983041296

- native suites (ubuntu-latest, Node 22.19.0): success
- board: success
- CodeQL, Analyze (actions), Analyze (javascript-typescript): success

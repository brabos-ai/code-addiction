# Contributing to ADD Commands Scripts

Thanks for contributing.

## Development setup

1. Fork and clone the repository.
2. Install CLI dependencies:

```bash
cd cli
npm ci
```

3. Run tests:

```bash
npm test
```

## Branch and PR flow

1. Create a branch from `main`.
2. Make focused changes with tests.
3. Open a Pull Request using the PR template.

## Commit guidance

Use clear, scoped commit messages. Conventional Commits are recommended:

- `feat: add new provider detection`
- `fix: handle missing manifest file`
- `docs: improve quickstart section`

## Code quality expectations

- Keep changes minimal and targeted.
- Add or update tests for behavioral changes.
- Preserve backward compatibility where possible.
- Update docs when commands or flows change.

## Reporting bugs

Use the bug report template and include:
- Steps to reproduce
- Expected vs actual behavior
- Node version
- OS and shell


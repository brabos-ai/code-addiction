# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Added
- Open source governance files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`)
- GitHub templates for issues and pull requests
- CI and release workflows
- Root-level README for public onboarding
- Agent team section (`## 10`) in the agent-mode guide, and two role files, `roles/product-pm.md` and `roles/chief-engineer.md`
- Agent-mode board management guide (`agent-mode/board-management.md`): who writes the board, how each stage is mirrored to an external tracker, and how concurrent writes behave


### Fixed
- An existing board definitions file now gains the default statuses it lacks (`refining`, `shaped`, `planning`, `planned`, `in-review`, and `awaiting-release` when the release step is on), through `codeadd migrate` and on the write that names one. The pipeline's own status writes stop being refused as `unknown-status` on old boards; entries the user wrote are never edited

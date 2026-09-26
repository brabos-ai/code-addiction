---
name: add-product-artefact-renaming
description: "Use when renaming product command or skill identities in bulk; derive a registry-backed map, inspect deterministic JSONL preview and apply only the checked preview."
---

# Rename Product Artefacts

<!-- uses:
- skill: add-artefact-graph
-->

## When to Use

- Renaming one or more product commands or skills in `framwork/.codeadd/`.
- Changing provider registry names, frontmatter, fragments, plugin skills and active references in one delivery.

## When NOT to Use

- Renaming internal workbench identities, agents, features or scripts: this tool maps product commands and skills only.
- Rewriting archived deliveries, tickets, changelogs or documents in existing users' projects: preserve history.

## Procedure

1. Ask `add-artefact-graph` who calls every target and what each target needs. For an injected command, query each fragment returned by its direct impact separately. Inspect active non-artefact references too; `AGENTS.md`, CLI code and tests are not graph nodes.
2. Write tests that fail on the old identity. Read `framwork/provider-map.json` and `cli/src/plugins.json`; the tool derives the default old→new map from them. Pass `--map <file>` only to override mappings for active names; the override file has `commands` and `skills` objects.
3. Run `node scripts/rename-product-artefacts.js preview --scope product --output <scratch-file>` for large migrations, or omit `--output` to get JSONL on stdout and the summary on stderr. `--root <repo>` is optional. `--scope docs` previews current README, AGENTS.md, web and workbench text separately; `--scope all` combines both, but never use it in an F-block with only one layer tag.
4. Read the summary's `records`, `files` and `bytes`. Read the JSONL selectively by path and record type. Check each move and excerpt, especially fragments, frontmatter, runtime references and paths. A header carries the map and scope; a footer closes the preview. Do not treat a truncated or absent footer as approval.
5. Run `node scripts/rename-product-artefacts.js apply --scope product --preview <scratch-file>`. `--preview -` reads the same JSONL from stdin. Use exactly the scope, map and root of preview. Apply regenerates the preview, checks its bytes and all source hashes/destinations before writing anything; a stale or modified preview is rejected, so rerun preview instead of bypassing checks.
6. Sweep active files outside the tool's scope, run the product build with graph warnings enabled, query new node IDs and their edges, then run install/update and provider-specific tests. Do not report success based on filename changes alone.

## Rules

ALWAYS:
- Treat the JSONL as a checked work list for the agent, not a human approval gate.
- Keep command and skill renames in the same F-block as their active dependants.
- Leave workbench identities and historical records unchanged.

NEVER:
- Apply a stale preview or bypass destination preflight.
- Assume that a command emitted as a `SKILL.md` changes its command identity.

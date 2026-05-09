# History Category — Schemas & Voice

Category file for changelog and history docs. Universal rules live in `{{skill:add-doc-schemas/SKILL.md}}`. This file owns history-specific schemas and notation.

**Schemas in this category:** `changelog`.

## Shared Notation

### Changelog Voice

Conventional-Commit-style bullets. Granular enough to point at the change that landed, not the theme of the release.

```markdown
## Changes
- feat(notifications): add in-app notification center — {{doc:F0012}}
- fix(api): handle missing read receipts on legacy rows — {{doc:H0013}}
- refactor(domain): extract NotificationPolicy from service

## Breaking
- `POST /notifications` now requires `channel` field (was optional). Migration: default existing clients to `channel=in-app`.

## Migration
1. Update clients to send `channel` in every POST.
2. Run `yarn migrate 20260424_notification_channel.ts`.
3. Rollback: revert migration; `channel` returns to optional.
```

Breaking changes are **never** omitted to make the release look smoother. If unsure whether a change is breaking, list it and mark `impact: unclear`.

## Schemas

### changelog

For `/add.done` (creates `docs/changelog/CHG[NNNN].md` or appends).

- **Frontmatter:** `id: CHG[NNNN]`, `type: changelog`, `date:`, `related: [[NNNN]F | [NNNN]H]`
- **Sections:** TL;DR · Changes · Breaking · Migration
- **Depth floor:**
  - **Changes** — every merged change as `type(scope): summary — {{doc:<ID>}}` when applicable. Granular enough that a reader can locate the relevant PR/commit.
  - **Breaking** — every breaking change with: what breaks, for whom, from which version. `none` is valid if true.
  - **Migration** — step-by-step migration instructions when breaking is non-empty. Include rollback notes.
- **Compression:** Changes = Conventional-Commit-style bullets per Changelog Voice above. Breaking = bullets or `none`. Migration = numbered steps.
- **Hard bans:** release marketing copy, subjective adjectives, omitting breaking changes to make the release look smoother.

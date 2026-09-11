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

**Location:** `<feature-dir>/changelog.md` — one per delivery, in the feature's own
directory, on an epic as well as on a simple feature. `docs/changelog/` is the
framework repository's own directory and does not exist in a user's project.

**Written first by `{{cmd:add.pull-request}}` STEP 3** when a PR is opened
mid-build, **otherwise by `{{cmd:add.done}}` 6.3.** Two writers, one document.

```
⛔ ONE CHANGELOG PER DELIVERY:
  ⛔ DO NOT: Allocate a second CHG[NNNN] for a delivery that already has one
  ⛔ DO NOT: Skip the narrative because the file exists
  ✅ DO: Find that file, COMPLEMENT it in place, and keep its id and its name
```

⛔ **A skip is not idempotency.** Idempotent means running twice leaves the same
correct state. Skipping leaves the state the FIRST run produced, which is only
correct when nothing changed in between — and something always did, or the second
run would not be happening. A feature whose PR opened mid-build otherwise merges
with a changelog describing the work that existed when the PR opened.

**Complementing follows the cache rule this skill already owns** — read, preserve,
complement, bump `updated:` — with `id:`, `created:`, `type:` and `related:`
immutable. Per part:

| Part | On a file that already exists |
|---|---|
| `## Changes` | Re-derive from the full change set and add only the bullets not already present, matching on the `type(scope): summary` prefix. Every existing bullet is kept **verbatim** |
| `## TL;DR` | **Rewritten** to cover the delivery as it now stands |
| `## Breaking` / `## Migration` | Complemented like Changes. A `none` that stopped being true is replaced |
| `## Quick Ref` → `touched`, `keywords` | Re-derived. Both come from the tree and go stale |
| `## Quick Ref` → `domain`, `patterns` | **Left alone.** Nothing in the tree can tell a human's correction from a stale value |
| `## QA Evidence` | Unchanged behaviour: the section is replaced, never appended to |

**Why `TL;DR` is rewritten while `Changes` is appended to.** They are different
kinds of statement. A bullet is a fact about one change and stays true; a summary
is a claim about the whole delivery and stops being true the moment it grows.

- **Frontmatter:** `id: CHG[NNNN]`, `type: changelog`, `date:`, `related: [[NNNN]F | [NNNN]H]`
- **Sections:** TL;DR · Changes · Breaking · Migration
- **Depth floor:**
  - **Changes** — every merged change as `type(scope): summary — {{doc:<ID>}}` when applicable. Granular enough that a reader can locate the relevant PR/commit.
  - **Breaking** — every breaking change with: what breaks, for whom, from which version. `none` is valid if true.
  - **Migration** — step-by-step migration instructions when breaking is non-empty. Include rollback notes.
- **Compression:** Changes = Conventional-Commit-style bullets per Changelog Voice above. Breaking = bullets or `none`. Migration = numbered steps.
- **Hard bans:** release marketing copy, subjective adjectives, omitting breaking changes to make the release look smoother.

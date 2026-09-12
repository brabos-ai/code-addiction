import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A docs corpus that looks like a real installation rather than a clean one.
 *
 * Every shape the membership rule has to survive is here on purpose:
 *   - a feature and a hotfix, each anchored on its own `*-about`
 *   - attachments in four different recognised types, in both changelog layouts
 *   - the user's OWN files beside codeadd's, with and without frontmatter —
 *     the reason membership is decided by `type:` and never by a path glob
 *   - a wiki page carrying `area`, `description` and `sources`
 *   - `.codeadd/wiki/index.md`, which self-excludes by carrying no frontmatter
 *   - one relation pointing at an id that resolves to nothing
 *
 * A fixture with only well-formed documents tests the happy path twice and the
 * rules that actually decide membership not at all.
 */

const FILES = {
  // ---- the feature the other two point at, so precedence is testable ------
  'docs/features/0009F-ledger/about.md': `---
id: 0009F
type: feature-about
slug: ledger
status: live
created: 2026-07-01
updated: 2026-07-10
related: []
tags: [ledger]
---

## TL;DR
The ledger stores one row per transaction. Every later feature writes through it.

## Relations
None

## Observations
- [constraint] a ledger row is append-only #ledger
`,

  // ---- a feature: one node, three attachments -----------------------------
  'docs/features/0042F-itemised-purchase/about.md': `---
id: 0042F
type: feature-about
slug: itemised-purchase
status: live
created: 2026-08-01
updated: 2026-08-20
related: [0009F]
tags: [purchases, ledger]
---

## TL;DR
A purchase can be split into itemised lines. It exists because a single total
hid which items drove a month's spend, and the ledger now stores one row per item.

## Problem
Totals alone cannot answer "what did I actually buy".

## Relations
- depends_on [[0009F]] — the ledger schema this splits rows in
- links_to [[CHG0001]]

## Observations
- [measurement] 82% of purchases carry more than one item #purchases
- [constraint] the ledger row id must stay stable across a split
`,

  'docs/features/0042F-itemised-purchase/plan.md': `---
id: 0042F
type: feature-plan
created: 2026-08-02
updated: 2026-08-02
related: [0042F]
---

## TL;DR
The build order for the itemised purchase split.
`,

  'docs/features/0042F-itemised-purchase/changelog.md': `---
id: CHG0001
type: changelog
date: 2026-08-20
related: [0042F]
---

## TL;DR
Shipped the itemised purchase split.

## Changes
- feat(ledger): one row per item — {{doc:0042F}}

## Relations
- part_of [[0042F]]
`,

  'docs/features/0042F-itemised-purchase/discovery.md': `---
id: 0042F
type: feature-discovery
created: 2026-08-01
updated: 2026-08-01
related: []
---

## TL;DR
Where the ledger writes a purchase today.
`,

  // ---- a hotfix: one node, one legacy attachment ---------------------------
  'docs/features/0051H-token-refresh/about.md': `---
id: 0051H
type: hotfix-about
slug: token-refresh
status: live
severity: high
created: 2026-09-01
updated: 2026-09-01
related: [0042F]
tags: [auth]
---

## TL;DR
The refresh shipped without an expiry test, so every session past one hour dropped.

## Symptom
Sessions ended at exactly 60 minutes. The ledger in {{doc:0009F}} records the gap
as a silent write failure, which is how this surfaced at all.

## Relations
- caused_by [[0042F]] — the purchase split added the call that refreshes twice
- links_to [[0099F]]

## Observations
- [cause] refresh shipped with no expiry test #auth
`,

  'docs/features/0051H-token-refresh/related.md': `---
id: 0051H-related
type: hotfix-related
created: 2026-09-01
updated: 2026-09-01
related: [0051H]
---

## TL;DR
Assets this hotfix touched.

## Impacted Files
- src/auth/refresh.ts:41 — the expiry branch that never ran
- src/auth/session.ts:12 — the caller

## Follow-ups
- {{doc:0042F}} introduced the second refresh call and deserves a regression test
`,

  // ---- the changelog directory layout, which also exists in the wild -------
  'docs/changelog/CHG0002.md': `---
id: CHG0002
type: changelog
date: 2026-09-01
related: [0051H]
---

## TL;DR
Shipped the token refresh fix.

## Relations
- part_of [[0051H]]
`,

  // ---- the user's own material, which must be invisible --------------------
  'docs/chat-gpt/transcript.md': `# A chat transcript

No frontmatter at all. This belongs to the user.
`,

  'docs/critical-findings.md': `---
author: someone
updated: 2026-09-02
---

# Findings

Frontmatter, but no \`type:\` key. Still the user's.
`,

  // ---- the wiki: the second node kind --------------------------------------
  '.codeadd/wiki/backend.md': `---
type: reference
area: backend
description: How the API worker is built — routing, persistence and tenancy.
sources: [src/api/app.ts, src/api/features/**, src/auth/*.ts]
commit: a0c8873
tags: [api, tenancy]
---

## TL;DR
The API worker and the three layers it is split into.
`,

  '.codeadd/wiki/index.md': `# Wiki

A hub of links with no content of its own, and no frontmatter.
`,
};

/**
 * Write the fixture into a fresh temp directory and return its path.
 * The caller removes it; nothing here registers a hook.
 */
export function makeDocsCorpus(extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-docs-'));
  for (const [rel, body] of Object.entries({ ...FILES, ...extra })) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  return root;
}

/** A tree with no `docs/` and no provider map — neither corpus is present. */
export function makeEmptyTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-empty-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# nothing here\n', 'utf8');
  return root;
}

export function removeTree(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

/**
 * The ids the fixture expects to become NODES, and what kind each is.
 *
 * Two work items and one reference page. Everything else in the fixture is an
 * attachment or is skipped: `plan.md`, `discovery.md`, both changelogs and
 * `related.md` all carry a recognised `type:` that does not end in `-about`,
 * and the user's two files carry no `type:` at all.
 */
export const EXPECTED_NODES = {
  '0009F': 'work item',
  '0042F': 'work item',
  '0051H': 'work item',
  'wiki/backend': 'reference page',
};

/** Files the membership rule must skip, and report once. */
export const EXPECTED_SKIPPED = [
  '.codeadd/wiki/index.md',
  'docs/chat-gpt/transcript.md',
  'docs/critical-findings.md',
];

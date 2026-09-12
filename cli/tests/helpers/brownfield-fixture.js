import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A project as it looks the moment BEFORE the migration runs: the pre-format
 * shape, with every edge source the design measured and nothing in the new one.
 *
 * Derived from the measured installation rather than invented. It carries all
 * five sources, the two documents that must not be touched, and one id that
 * resolves to nothing — because a fixture where every id resolves tests the
 * unresolved path not at all.
 */
const FILES = {
  'docs/features/0009F-ledger/about.md': `---
id: 0009F
type: feature-about
slug: ledger
status: live
created: 2026-07-01
updated: 2026-07-10
related: []
---

## TL;DR
The ledger stores one row per transaction.

## Problem
Every feature needs one place to write a transaction.
`,

  'docs/features/0042F-itemised-purchase/about.md': `---
id: 0042F
type: feature-about
slug: itemised-purchase
status: live
created: 2026-08-01
updated: 2026-08-20
related: [0009F]
---

## TL;DR
A purchase can be split into itemised lines.

## Problem
Totals alone cannot answer what was bought. The split writes through
{{doc:0009F}}, which owns the row shape, and keeps the original total intact.
It also replaces the import path {{doc:0003F}} opened, and reuses the session
scope {{doc:0012F}} defines.

## References
- {{doc:0099F}} was the earlier attempt and does not exist any more.
`,

  'docs/features/0042F-itemised-purchase/changelog.md': `---
id: CHG0001
type: changelog
date: 2026-08-20
related: [0042F]
---

## TL;DR
Shipped the split.
`,

  'docs/features/0051H-token-refresh/about.md': `---
id: 0051H
type: hotfix-about
slug: token-refresh
severity: high
status: live
created: 2026-09-01
updated: 2026-09-01
related: [0042F, 0012F]
---

## TL;DR
The refresh shipped without an expiry test.

## Symptom
Sessions ended at 60 minutes.
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

## Impacted Docs
- {{doc:0042F}}

## Follow-ups
- {{doc:0042F}} introduced the second refresh call and deserves a regression test
- {{doc:0009F}} still logs the gap as a silent write failure and should raise instead
`,

  'docs/features/0012F-session-store/about.md': `---
id: 0012F
type: feature-about
slug: session-store
status: live
created: 2026-06-15
updated: 2026-06-15
related: []
---

## TL;DR
Sessions live in their own store.
`,

  // A document superseded by another, the fifth source.
  'docs/features/0003F-old-import/about.md': `---
id: 0003F
type: feature-about
slug: old-import
status: superseded
superseded_by: 0042F
created: 2026-06-01
updated: 2026-08-20
related: []
---

## TL;DR
The first import, replaced by the itemised split.
`,

  // A work item with no TL;DR content at all. The migration must NOT invent one.
  'docs/features/0060F-blank/about.md': `---
id: 0060F
type: feature-about
slug: blank
status: draft
created: 2026-09-05
updated: 2026-09-05
related: []
---

## TL;DR

## Problem
Nobody wrote the summary.
`,

  // The user's own material. Untouched, unindexed, unreported except as skipped.
  'docs/chat-gpt/transcript.md': `# A chat transcript

No frontmatter at all. {{doc:0042F}} appears here and must produce no edge.
`,

  'docs/critical-findings.md': `---
author: someone
updated: 2026-09-02
related: [0042F]
---

# Findings

Frontmatter, no type: key. Still the user's, and its related: is not harvested.
`,
};

export function makeBrownfield(extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-brown-'));
  for (const [rel, body] of Object.entries({ ...FILES, ...extra })) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  return root;
}

export function removeTree(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

/** Every markdown file in the tree, path → content. */
export function snapshot(root) {
  const out = {};
  const walk = (dir, rel = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), next);
      else out[next] = fs.readFileSync(path.join(dir, entry.name), 'utf8');
    }
  };
  walk(root);
  return out;
}

/**
 * The added lines, per file, between two snapshots — the diff L3.2 must SHOW
 * rather than summarise.
 *
 * @returns {{added: Record<string,string[]>, removed: Record<string,string[]>, changedFiles: string[]}}
 */
export function diff(before, after) {
  const added = {};
  const removed = {};
  const changedFiles = [];
  for (const file of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = (before[file] ?? '').split('\n');
    const b = (after[file] ?? '').split('\n');
    if (a.join('\n') === b.join('\n')) continue;
    changedFiles.push(file);

    // Every line of `before`, in order, must still be present in `after`. What
    // is left over in `after` is what the run added.
    const remaining = [...b];
    const lost = [];
    for (const line of a) {
      const at = remaining.indexOf(line);
      if (at === -1) lost.push(line);
      else remaining.splice(at, 1);
    }
    // Only non-empty entries are recorded, so a caller can assert
    // `removed` is {} and read that as 'nothing was lost, in any file'.
    const gained = remaining.filter((l) => l.trim());
    const lostLines = lost.filter((l) => l.trim());
    if (gained.length) added[file] = gained;
    if (lostLines.length) removed[file] = lostLines;
  }
  return { added, removed, changedFiles: changedFiles.sort() };
}

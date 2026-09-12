import { describe, it, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { treeFixture } from './helpers/tree-fixture.js';

/**
 * L1 for the shared tree fixture (plan 2026-09-11T005514, F1).
 *
 * The helper exists to invert WHEN the copy happens. The old shape copied two
 * full trees, normalized 332 files and deleted them in a top-level beforeEach,
 * so 38 of qa-reachability's 43 tests paid for a directory they never opened —
 * 75.5s of a 164s serial run, on the clean checkout this was built against.
 * The helper builds the template once per test file and hands out a private
 * copy only to a test that asks.
 *
 * Almost everything here runs against synthetic source trees rather than the
 * real built output. The four consumers prove the real tree still works; this
 * file proves the mechanism, and a mechanism test that copied 332 real files
 * per case would reintroduce the cost it exists to remove. The one deliberate
 * exception is the repo-relative resolution level, which has to name a real
 * path to prove anything at all.
 */

const OPEN = [];
const PREFIXES = [];
const SOURCE_PREFIX = `tfsrc-${randomUUID().slice(0, 8)}-`;

/**
 * A prefix no other run can collide with.
 *
 * Several levels here assert on what the helper left in the system temp dir,
 * and a fixed prefix makes those assertions read every leftover any earlier
 * run abandoned — a crashed run then fails the next one for no reason. The
 * random segment scopes each assertion to the run that made it.
 */
function newPrefix() {
  const prefix = `tf-${randomUUID().slice(0, 8)}-`;
  PREFIXES.push(prefix);
  return prefix;
}

function fixture(opts) {
  const f = treeFixture(opts);
  OPEN.push(f);
  return f;
}

afterEach(() => {
  while (OPEN.length) OPEN.pop().dispose();
  const owned = [...PREFIXES, SOURCE_PREFIX];
  for (const e of fs.readdirSync(os.tmpdir())) {
    if (owned.some((p) => e.startsWith(p))) {
      fs.rmSync(path.join(os.tmpdir(), e), { recursive: true, force: true });
    }
  }
  PREFIXES.length = 0;
});

/**
 * A synthetic source tree. `files` maps a relative path to its exact bytes.
 *
 * Its prefix is run-scoped for the same reason the fixture prefixes are: the
 * afterEach sweep deletes by prefix, and a fixed one would reach into a
 * concurrent vitest process's live source trees on a shared temp dir.
 */
function sourceTree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), SOURCE_PREFIX));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return dir;
}

/**
 * EVERYTHING the helper put on disk under this prefix, template included.
 * L1.1 needs this one: an eager template is exactly the defect it exists to
 * catch, and an observer that filtered the template out would pass on it.
 */
const onDisk = (prefix) => fs.readdirSync(os.tmpdir()).filter((e) => e.startsWith(prefix));

/**
 * Only the roots handed out. L1.4 needs this one: cleanup() reclaims roots and
 * dispose() reclaims the template, so an observer that saw both would assert
 * the opposite of the design.
 */
const handed = (prefix) => onDisk(prefix).filter((e) => !e.startsWith(`${prefix}template-`));

describe('L1.1 — a fixture nobody asks for copies nothing', () => {
  it('constructing the handle creates no directory on disk', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'a\n' });
    const before = onDisk(prefix);

    fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    // The whole point of the change: a test file that never calls root() must
    // pay nothing. An eager template shows up here, which is why this reads
    // every entry under the prefix rather than only the handed-out roots.
    expect(onDisk(prefix)).toEqual(before);
  });

  it('the first root() call is what puts a tree on disk', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'a\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    const root = f.root();

    expect(fs.existsSync(path.join(root, '.claude', 'a.md'))).toBe(true);
  });
});

describe('L1.2 — two roots are two roots', () => {
  it('returns different paths, and a write in one is invisible in the other', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'original\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    const first = f.root();
    const second = f.root();

    expect(first).not.toBe(second);

    fs.writeFileSync(path.join(first, '.claude', 'a.md'), 'mutated\n');

    expect(fs.readFileSync(path.join(second, '.claude', 'a.md'), 'utf8')).toBe('original\n');
    expect(fs.existsSync(path.join(second, 'leaked.md'))).toBe(false);
  });
});

describe('L1.3 — the template is built once', () => {
  it('a second root() reflects the source as it was at the first, not as it is now', () => {
    const prefix = newPrefix();
    // The observable form of "built once". If the helper re-read the source on
    // every call, the mutation below would reach the second copy.
    //
    // normalize is ON here on purpose: the level this stands for is worded as
    // "a second root() does not re-run the line-ending normalization", and a
    // fixture built without it would leave that half untested. The second
    // copy carrying the FIRST copy's normalized bytes is what proves the walk
    // did not run again.
    const src = sourceTree({ 'a.md': 'original\r\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }], normalize: true });

    const first = f.root();
    fs.writeFileSync(path.join(src, 'a.md'), 'changed at the source\r\n');
    const second = f.root();

    expect(fs.readFileSync(path.join(first, '.claude', 'a.md'), 'utf8')).toBe('original\n');
    expect(fs.readFileSync(path.join(second, '.claude', 'a.md'), 'utf8')).toBe('original\n');
  });
});

describe('L1.6 — a missing required source fails loudly', () => {
  it('throws, naming the path and the command that produces it', () => {
    // Three of the four consumers declare `node scripts/build.js` as a
    // precondition in their own header, and their old hooks copied unguarded,
    // so an unbuilt tree threw one ENOENT in beforeEach. Skipping silently
    // would hand them an empty root and move the failure somewhere unhelpful.
    const missing = path.join(os.tmpdir(), `${SOURCE_PREFIX}absent`);
    const f = fixture({ prefix: newPrefix(), copy: [{ src: missing, dest: '.claude' }] });

    expect(() => f.root()).toThrow(/required source is missing/);
    expect(() => f.root()).toThrow(/scripts\/build\.js/);
  });

  it('optional: true is what buys the skip, and only for the entry that asks', () => {
    // injection-exclusivity copies every provider directory, and one that has
    // not been built is a normal state there and nowhere else.
    const src = sourceTree({ 'x.md': 'x\n' });
    const absent = path.join(os.tmpdir(), `${SOURCE_PREFIX}absent2`);
    const f = fixture({
      prefix: newPrefix(),
      copy: [{ src, dest: '.claude' }, { src: absent, dest: '.cursor', optional: true }],
    });

    const root = f.root();

    expect(fs.existsSync(path.join(root, '.claude', 'x.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, '.cursor'))).toBe(false);
  });
});

describe('L1.4 — cleanup removes every root handed out', () => {
  it('removes them all, including one handed to a test that threw', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'a\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    const survived = f.root();
    let thrown;
    try {
      thrown = f.root();
      throw new Error('the test under simulation failed here');
    } catch {
      // swallowed on purpose — afterEach still runs for a throwing test, and
      // cleanup must not depend on the test having finished cleanly.
    }

    f.cleanup();

    expect(fs.existsSync(survived)).toBe(false);
    expect(fs.existsSync(thrown)).toBe(false);
    expect(handed(prefix)).toEqual([]);
  });

  it('a root handed out after a cleanup is tracked by the next cleanup', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'a\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    f.root();
    f.cleanup();
    const second = f.root();
    f.cleanup();

    expect(fs.existsSync(second)).toBe(false);
  });
});

describe('L1.5 — line-ending normalization', () => {
  it('normalize: true turns a CRLF source into an LF copy', () => {
    const prefix = newPrefix();
    // A real installed project carries LF, because the release ZIP is built on
    // CI. A Windows checkout with core.autocrlf=true materializes CRLF, which
    // the LF-based injection regexes do not match.
    const src = sourceTree({ 'a.md': 'one\r\ntwo\r\n', 'b.json': '{\r\n  "x": 1\r\n}\r\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.codeadd' }], normalize: true });

    const root = f.root();

    expect(fs.readFileSync(path.join(root, '.codeadd', 'a.md'), 'utf8')).toBe('one\ntwo\n');
    expect(fs.readFileSync(path.join(root, '.codeadd', 'b.json'), 'utf8')).toBe('{\n  "x": 1\n}\n');
  });

  it('normalization reaches a nested directory, not just the top level', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'deep/nested/a.md': 'one\r\ntwo\r\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.codeadd' }], normalize: true });

    const root = f.root();

    expect(fs.readFileSync(path.join(root, '.codeadd', 'deep', 'nested', 'a.md'), 'utf8')).toBe('one\ntwo\n');
  });

  it('normalization leaves a non-markdown, non-json file alone', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.sh': '#!/bin/sh\r\necho hi\r\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.codeadd' }], normalize: true });

    const root = f.root();

    expect(fs.readFileSync(path.join(root, '.codeadd', 'a.sh'), 'utf8')).toBe('#!/bin/sh\r\necho hi\r\n');
  });

  it('the default is OFF, so CRLF survives where no caller asked for LF', () => {
    const prefix = newPrefix();
    // Three of the four consumers never normalized. Defaulting to on would
    // change what they assert on a CRLF checkout, which F4 forbids.
    const src = sourceTree({ 'a.md': 'one\r\ntwo\r\n' });
    const f = fixture({ prefix, copy: [{ src, dest: '.claude' }] });

    const root = f.root();

    expect(fs.readFileSync(path.join(root, '.claude', 'a.md'), 'utf8')).toBe('one\r\ntwo\r\n');
  });
});

describe('L1 — the call shapes the four consumers need', () => {
  it('writes the manifest into every copy, at the path the caller names', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'x.md': 'x\n' });
    const data = { version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} };
    const f = fixture({
      prefix,
      copy: [{ src, dest: '.codeadd' }],
      manifest: { at: '.codeadd/manifest.json', data },
    });

    const first = f.root();
    const second = f.root();

    for (const root of [first, second]) {
      const written = JSON.parse(fs.readFileSync(path.join(root, '.codeadd', 'manifest.json'), 'utf8'));
      expect(written).toEqual(data);
    }
  });

  it('reclaims a template attempt that threw, so a retry leaks nothing', () => {
    // buildTemplate() creates its directory before it can fail, and a failure
    // here is reachable: a missing source now throws. The attempt must still
    // be reclaimed, and the retry must not inherit a half-built template.
    const prefix = newPrefix();
    const missing = path.join(os.tmpdir(), `${SOURCE_PREFIX}absent3`);
    const f = treeFixture({ prefix, copy: [{ src: missing, dest: '.claude' }] });

    expect(() => f.root()).toThrow();
    expect(() => f.root()).toThrow();
    expect(onDisk(prefix).length).toBeGreaterThan(0); // the attempts are on disk

    f.dispose();

    expect(onDisk(prefix)).toEqual([]);
  });

  it('resolves a repo-relative source against the repository root', () => {
    const prefix = newPrefix();
    // The four consumers name their sources as 'framwork/.claude' and the
    // like, which is what PROVIDERS already carries.
    const f = fixture({ prefix, copy: [{ src: 'framwork/.codeadd', dest: '.codeadd' }] });

    const root = f.root();

    expect(fs.existsSync(path.join(root, '.codeadd', 'commands', 'add.plan.md'))).toBe(true);
  });

  it('dispose removes the template as well as the roots', () => {
    const prefix = newPrefix();
    const src = sourceTree({ 'a.md': 'a\n' });
    const f = treeFixture({ prefix, copy: [{ src, dest: '.claude' }] });

    const root = f.root();
    f.dispose();

    expect(fs.existsSync(root)).toBe(false);
    expect(handed(prefix)).toEqual([]);
  });
});

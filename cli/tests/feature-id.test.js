/**
 * feature-id.test.js — the native global allocator (L2).
 *
 * The allocator counts docs/features/[NNNN][L]-* folders and nothing else. Each
 * fixture runs three ways: the native calculate(), and BOTH native public
 * entries (`next-id.cjs` and `status.cjs next-id`). One allocator, two public
 * adapters, one answer.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, '..', '..');
const idc = require(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'feature-id.cjs'));

const NEXT_ID = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'next-id.cjs');
const STATUS = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'status.cjs');

const ROOTS = [];

afterEach(() => {
  for (const dir of ROOTS.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const fixture = (name) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  ROOTS.push(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
};

const featureDir = (root, slug) => {
  fs.mkdirSync(path.join(root, 'docs', 'features', slug), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'features', slug, 'about.md'), `# ${slug}\n`);
};

/** The two native public entries, in the fixture root. */
const nodeNextId = (entry, args, cwd) =>
  execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8', cwd }).trim();

/** One fixture, one letter: the core and both native entries must agree. */
const expectAllThree = (root, letter, id) => {
  expect(idc.calculate(root, letter)).toEqual({ ok: true, id });
  expect(nodeNextId(NEXT_ID, [letter], root)).toBe(id);
  expect(nodeNextId(STATUS, ['next-id', letter], root)).toBe(id);
};

describe('L2 — calculate: absent and empty sources', () => {
  it('a fresh project with nothing on disk gets exactly 0001 — for every letter', () => {
    const root = fixture('id-absent-');
    for (const letter of ['F', 'H']) {
      expect(idc.calculate(root, letter)).toEqual({ ok: true, id: `0001${letter}` });
    }
  });

  it('an EMPTY docs/features dir is also absent', () => {
    const root = fixture('id-empty-');
    fs.mkdirSync(path.join(root, 'docs', 'features'), { recursive: true });
    for (const letter of ['F', 'H']) {
      expect(idc.calculate(root, letter)).toEqual({ ok: true, id: `0001${letter}` });
    }
  });
});

describe('L2 — calculate: what counts and what does not', () => {
  it('only docs/features/[NNNN][L]-* folders are counted, across letters', () => {
    const root = fixture('id-mixed-');
    featureDir(root, '0042F-login');
    featureDir(root, '0015H-fix');
    expectAllThree(root, 'F', '0043F');
    expectAllThree(root, 'H', '0043H');
  });

  it('the next number continues after the highest existing folder', () => {
    const root = fixture('id-next-');
    featureDir(root, '0003F-a');
    featureDir(root, '0007H-b');
    featureDir(root, '0005F-c');
    expectAllThree(root, 'F', '0008F');
  });

  it('a docs/backlog.jsonl holding a higher id than any folder does NOT raise the number', () => {
    const root = fixture('id-backlog-ignored-');
    featureDir(root, '0002F-a');
    fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), '{"id":"0050F","title":"t"}\n');
    expectAllThree(root, 'F', '0003F');
  });

  it('a FILE under docs/features is not a directory — can never count', () => {
    const root = fixture('id-file-');
    fs.mkdirSync(path.join(root, 'docs', 'features'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'features', '0009F-article.md'), '# x');
    expectAllThree(root, 'F', '0001F');
  });

  it('immediate directories only: a nested one level down does not count', () => {
    const root = fixture('id-nested-');
    fs.mkdirSync(path.join(root, 'docs', 'features', 'sub', '0012F-x'), { recursive: true });
    expectAllThree(root, 'F', '0001F');
  });

  it('digits in the temp path above docs/ never count', () => {
    const root = fixture('id-0421-parent-');
    featureDir(root, '0001F-x');
    expectAllThree(root, 'F', '0002F');
  });

  it('a slug year does not count — the id lives in the basename, not the slug', () => {
    const root = fixture('id-year-');
    featureDir(root, '0001F-auth-2024');
    expectAllThree(root, 'F', '0002F');
  });
});

describe('L2 — the boardRoot option is gone', () => {
  it('calculate ignores boardRoot', () => {
    const root = fixture('id-noboard-root-');
    const other = fixture('id-noboard-other-');
    featureDir(root, '0007F-thing');
    featureDir(other, '0099F-elsewhere');
    expect(idc.calculate(root, 'F', { boardRoot: other })).toEqual({ ok: true, id: '0008F' });
  });

  it('scanIds takes one argument and returns the folder ids only', () => {
    expect(idc.scanIds.length).toBe(1);
    const root = fixture('id-scan-');
    featureDir(root, '0004F-x');
    const scanned = idc.scanIds(root);
    expect(scanned.ok).toBe(true);
    expect([...scanned.ids]).toEqual(['0004F']);
  });

  it('the module no longer exports the backlog anchor', () => {
    expect(idc.RAW_ID_RE).toBeUndefined();
  });
});

describe('L2 — calculate: exhaustion and unreadable sources', () => {
  it('9999 is refused by calculate but the public adapters keep five-digit output', () => {
    const root = fixture('id-max-');
    featureDir(root, '9999F-mid');
    expect(idc.calculate(root, 'F')).toEqual({ ok: false, reason: 'id-exhausted' });
    for (const entry of [[NEXT_ID, ['F']], [STATUS, ['next-id', 'F']]]) {
      expect(nodeNextId(entry[0], entry[1], root)).toBe('10000F');
    }
  });

  it('9998 inside the four-digit space still allocates — exactly 9999', () => {
    const root = fixture('id-9998-');
    featureDir(root, '9998F-x');
    expect(idc.calculate(root, 'F')).toEqual({ ok: true, id: '9999F' });
  });

  it('an UNREADABLE docs/features is an explicit failure', () => {
    const root = fixture('id-featunread-');
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'features'), 'a file, not a directory\n');
    expect(idc.calculate(root, 'F')).toEqual({ ok: false, reason: 'features-unreadable' });
  });
});

describe('L2 — the allocator requires no import-time I/O', () => {
  it('requiring the module changes nothing anywhere on disk', () => {
    const snapshot = () => {
      const file = path.join(ROOT, 'docs', 'backlog.jsonl');
      return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    };
    const before = snapshot();
    require(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'feature-id.cjs'));
    expect(snapshot()).toBe(before);
  });
});

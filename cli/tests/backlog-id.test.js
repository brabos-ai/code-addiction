/**
 * backlog-id.test.js — the native global allocator (L2).
 *
 * Every fixture the plan lists, run three ways: the native calculate(), and
 * BOTH shell calculators of the pre-cutover chain (next-id.sh and status.sh
 * next-id) for every readable fixture. The agreement is the characterization
 * the plan requires before the wrapper cutover, and it is also why the
 * raw-text anchor chosen matches what the shells actually grep — their own
 * header comment's claim about work_id substrings was probed false (a row
 * whose work_id is the max yields base+1, not base+43), so the parity here
 * is against BEHAVIOR, documented in the module header.
 *
 * RED-first: this module did not exist; the ledger records today's native-add
 * and file-entry failures before it landed.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, '..', '..');
const idc = require(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'backlog-id.cjs'));

const NEXT_ID_SH = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'next-id.sh');
const STATUS_SH = path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'status.sh');

const ROOTS = [];

afterEach(() => {
  for (const dir of ROOTS.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const fixture = (name) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  ROOTS.push(dir);
  return dir;
};

const featureDir = (root, slug) => {
  fs.mkdirSync(path.join(root, 'docs', 'features', slug), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'features', slug, 'about.md'), `# ${slug}\n`);
};

const backlogRow = (root, line) => {
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), line + '\n');
};

/** A valid minified ticket row, overridden per fixture. */
const ticketRow = (fields = {}) => JSON.stringify({
  id: fields.id ?? '0000B',
  title: fields.title ?? 't',
  theme: '',
  labels: [],
  tldr: 't',
  notes: [],
  done_when: 't',
  paths: [],
  grounded: false,
  status: fields.status ?? 'open',
  created_at: '2026-09-20T00:00:00Z',
  updated_at: '2026-09-20T00:00:00Z',
  comments: [],
  feature: fields.feature ?? null,
  work_id: fields.work_id ?? null,
});

/** The two shell calculators, in the fixture root. Unconditional — no skip
 *  path exists; a fixture that cannot be compared stops the suite. */
const shellNextId = (scriptPath, args, cwd) =>
  execFileSync('bash', [scriptPath, ...args], { encoding: 'utf8', cwd }).trim();

/** One fixture, one letter: native and both shells must agree, or it stops. */
const expectAllThree = (root, letter, id) => {
  expect(idc.calculate(root, letter)).toEqual({ ok: true, id });
  expect(shellNextId(NEXT_ID_SH, [letter], root)).toBe(id);
  expect(shellNextId(STATUS_SH, ['next-id', letter], root)).toBe(id);
};

describe('L2 — calculate: absent and empty sources', () => {
  it('a fresh project with nothing on disk gets exactly 0001 — for every letter', () => {
    const root = fixture('id-absent-');
    for (const letter of ['F', 'H', 'B']) {
      expect(idc.calculate(root, letter)).toEqual({ ok: true, id: `0001${letter}` });
    }
  });

  it('an EMPTY docs/features dir and an empty backlog are also absent', () => {
    const root = fixture('id-empty-');
    fs.mkdirSync(path.join(root, 'docs', 'features'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), '');
    for (const letter of ['F', 'B']) {
      expect(idc.calculate(root, letter)).toEqual({ ok: true, id: `0001${letter}` });
    }
  });
});

describe('L2 — calculate: what counts and what does not', () => {
  it('mixed letters: one counter over docs/features and the board together', () => {
    const root = fixture('id-mixed-');
    featureDir(root, '0042F-login');
    backlogRow(root, ticketRow({ id: '0015B' }));
    expectAllThree(root, 'B', '0043B');
    expectAllThree(root, 'F', '0043F');
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

describe('L2 — calculate: the exact raw-text anchor, and its neighbors', () => {
  it('damaged JSON still yields its id — the anchor does not need a parse', () => {
    const root = fixture('id-damaged-');
    backlogRow(root, ticketRow({ id: '0006B' }));
    backlogRow(root, '{"id":"0014B","title":"truncated');
    expectAllThree(root, 'B', '0015B');
  });

  it('a row whose truncated id LOST ITS QUOTE yields nothing native and nothing shell — parity on the worst edge', () => {
    // The plan's "exact raw-text expression" wording is the contract: the
    // shells' grep requires the trailing quote. The probe settled the loose
    // form would hand out base+1. So a row truncated before its closing
    // quote falls out of every allocator the same way, and the next id is
    // exactly what no-damage would give above it.
    const root = fixture('id-truncated-');
    backlogRow(root, ticketRow({ id: '0003B' }));
    backlogRow(root, '{"id":"0042B');  // no closing quote on the value
    backlogRow(root, '{"id":"0009B","title":"after"}');
    expectAllThree(root, 'B', '0010B');
  });

  it('raw field whitespace parity: `"id": "0042B"` with a space counts NOTHING', () => {
    const root = fixture('id-space-');
    backlogRow(root, ticketRow({ id: '0042B' }).replace('"id":"0042B"', '"id": "0042B"'));
    expectAllThree(root, 'B', '0001B');
  });

  it('an id mentioned inside a TITLE is a false positive both implementations refuse', () => {
    const root = fixture('id-title-');
    backlogRow(root, ticketRow({ id: '0001B', title: 'the 0042F story' }));
    expectAllThree(root, 'B', '0002B');
  });

  it('an escaped-quote fake anchor inside a title is not matched by native or shell', () => {
    const root = fixture('id-escape-');
    backlogRow(root, ticketRow({ id: '0001B', title: 'see \\"id\\":\\"0042V\\" doc' }));
    expectAllThree(root, 'B', '0002B');
  });

  it('a work_id substring is NOT counted — the shells demonstrably do not either', () => {
    // The allocators' own header comment claims the anchor catches this; the
    // probe proved otherwise and the parity requirement pinned the behavior.
    const root = fixture('id-workid-');
    backlogRow(root, ticketRow({ id: '0001B', work_id: '0043F' }));
    expectAllThree(root, 'F', '0002F');
    expectAllThree(root, 'B', '0002B');
  });
});

describe('L2 — calculate: exhaustion and unreadable sources', () => {
  it('9999 refuses explicitly; the shells would emit the five-digit id the wrapper filters', () => {
    const root = fixture('id-max-');
    featureDir(root, '9999F-mid');
    backlogRow(root, ticketRow({ id: '9999B' }));
    const native = idc.calculate(root, 'B');
    expect(native).toEqual({ ok: false, reason: 'id-exhausted' });
    // The old calculators overflow: next-id.sh and status.sh print five
    // digits, and the wrapper's `^[0-9]{4}B$` filter is what refused the
    // chain. The native refusal preserves that effective rejection.
    expect(shellNextId(NEXT_ID_SH, ['B'], root)).toBe('10000B');
    expect(shellNextId(STATUS_SH, ['next-id', 'B'], root)).toBe('10000B');
  });

  it('9998 inside the four-digit space still allocates — exactly 9999', () => {
    const root = fixture('id-9998-');
    backlogRow(root, ticketRow({ id: '9998B' }));
    expect(idc.calculate(root, 'B')).toEqual({ ok: true, id: '9999B' });
  });

  it('an UNREADABLE backlog is an explicit failure, not a silent skip', () => {
    const root = fixture('id-unreadable-');
    fs.mkdirSync(path.join(root, 'docs', 'backlog.jsonl'), { recursive: true });
    const native = idc.calculate(root, 'B');
    expect(native).toEqual({ ok: false, reason: 'backlog-unreadable' });
  });

  it('an UNREADABLE docs/features is an explicit failure too', () => {
    const root = fixture('id-featunread-');
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'features'), 'a file, not a directory\n');
    const native = idc.calculate(root, 'F');
    expect(native).toEqual({ ok: false, reason: 'features-unreadable' });
  });
});

describe('L2 — the allocator requires no import-time I/O', () => {
  it('requiring the module changes nothing anywhere on disk', () => {
    const before = fs.readFileSync(path.join(ROOT, 'docs', 'backlog.jsonl'), 'utf8');
    require(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'backlog-id.cjs'));
    expect(fs.readFileSync(path.join(ROOT, 'docs', 'backlog.jsonl'), 'utf8')).toBe(before);
  });
});

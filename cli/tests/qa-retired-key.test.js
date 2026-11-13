import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * qa-project-seed, decision 12 — the retired QA sign-in key and the "test password" wording are gone
 * from the product. `framwork/.codeadd/` and `cli/src/` name them nowhere, except inside the marked
 * removal region of migration 0008 in `cli/src/migrations.js`
 * (between `// retired-qa-key:begin` and `// retired-qa-key:end`).
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SCAN = [path.join('framwork', '.codeadd'), path.join('cli', 'src')];
const REMOVAL_FILE = 'cli/src/migrations.js';
const BEGIN = '// retired-qa-key:begin';
const END = '// retired-qa-key:end';
const TERMS = [/authSeed/i, /test password/i];
const SKIP_DIRS = new Set(['node_modules', '.git']);
// Build output and sidecars are generated from the sources scanned here, never authored.
const SKIP_FILES = new Set(['artefact-graph.json', 'injection-points.json', 'contracts.json']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return SKIP_FILES.has(e.name) ? [] : [path.join(dir, e.name)];
  });
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

/** Lines (1-based) naming a retired term, ignoring the marked region of the one allowed file. */
function hits(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const allowedFile = rel(file) === REMOVAL_FILE;
  let inside = false;
  const out = [];
  lines.forEach((line, i) => {
    if (allowedFile && line.includes(BEGIN)) inside = true;
    const named = TERMS.some((re) => re.test(line));
    if (named && !(allowedFile && inside)) out.push(`${rel(file)}:${i + 1}`);
    if (allowedFile && line.includes(END)) inside = false;
  });
  return out;
}

describe('the retired QA key leaves the product (L3.2)', () => {
  const files = SCAN.flatMap((d) => walk(path.join(ROOT, d)));

  it('walks a real tree', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('names neither the retired key nor "test password" anywhere but the marked region of migration 0008', () => {
    expect(files.flatMap(hits)).toEqual([]);
  });

  it('the marked region exists exactly once and holds the removal code', () => {
    const text = fs.readFileSync(path.join(ROOT, REMOVAL_FILE), 'utf8');
    expect(text.split(BEGIN).length - 1).toBe(1);
    expect(text.split(END).length - 1).toBe(1);
    const region = text.slice(text.indexOf(BEGIN), text.indexOf(END));
    expect(region).toContain('dropRetiredQaKeys');
    expect(region).toContain('removeRetiredQaKeys');
  });
});

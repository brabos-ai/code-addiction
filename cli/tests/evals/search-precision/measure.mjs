// measure.mjs — runs the 20 discovery queries through a `delivered.cjs` and reports
// top-3 hits, bytes per query and which queries flood (return every entry).
//
// Used two ways: cli/tests/search-precision.test.js imports `measure` for the
// "after" numbers, and a human runs it against an OLD scripts directory to record
// the "before" baseline (Decision 7):
//   node cli/tests/evals/search-precision/measure.mjs <scripts-dir>
// The fixture index is a versioned snapshot of this repository's delivery index.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const require = createRequire(import.meta.url);
const { DOCS_ROOT } = require(path.join(REPO, 'framwork', '.codeadd', 'scripts', 'docs-root.cjs'));

export const FIXTURE = path.join(HERE, 'delivered.jsonl');
export const QUERIES = JSON.parse(fs.readFileSync(path.join(HERE, 'queries.json'), 'utf8'));
export const SCRIPTS = path.join(REPO, 'framwork', '.codeadd', 'scripts');

/** A throwaway git repository whose docs root holds the fixture index. */
export function makeFixtureRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'search-precision-'));
  execFileSync('git', ['init', '-q', repo]);
  fs.mkdirSync(path.join(repo, ...DOCS_ROOT.split('/')), { recursive: true });
  fs.writeFileSync(path.join(repo, '.git', 'info', 'exclude'), DOCS_ROOT + '\n');
  fs.copyFileSync(FIXTURE, path.join(repo, ...DOCS_ROOT.split('/'), 'delivered.jsonl'));
  return repo;
}

export function fixtureEntryCount() {
  return new Set(fs.readFileSync(FIXTURE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).id)).size;
}

/** Run `read <query>` of the delivered.cjs in `scriptsDir`. */
export function runRead(repo, scriptsDir, query) {
  const res = spawnSync(process.execPath, [path.join(scriptsDir, 'delivered.cjs'), 'read', query, '--no-verify'], {
    cwd: repo,
    encoding: 'utf8',
  });
  const lines = res.stdout.split('\n');
  const rows = lines.filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  const keys = Object.fromEntries(lines.filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { status: res.status, stdout: res.stdout, rows, keys };
}

export function measure(scriptsDir) {
  const repo = makeFixtureRepo();
  const total = fixtureEntryCount();
  try {
    let top3 = 0;
    const bytes = [];
    const floods = [];
    const per = [];
    for (const q of QUERIES) {
      const r = runRead(repo, scriptsDir, q.query);
      const ids = r.rows.map((x) => x.id);
      const hit = ids.slice(0, 3).includes(q.expect);
      if (hit) top3++;
      bytes.push(r.stdout.length);
      const matched = Number(r.keys.MATCHED ?? Number(r.keys.MATCHED_LIVE || 0) + Number(r.keys.MATCHED_DEAD || 0));
      if (matched >= total) floods.push(q.query);
      per.push({ query: q.query, hit, bytes: r.stdout.length, matched });
    }
    return { top3, total: QUERIES.length, bytes, maxBytes: Math.max(...bytes), meanBytes: Math.round(bytes.reduce((a, b) => a + b, 0) / bytes.length), floods, per };
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ? path.resolve(process.argv[2]) : SCRIPTS;
  const m = measure(dir);
  console.log(JSON.stringify({ top3: `${m.top3}/${m.total}`, meanBytes: m.meanBytes, maxBytes: m.maxBytes, floods: m.floods.length }, null, 1));
  for (const p of m.per) console.log(`${p.hit ? 'HIT ' : 'miss'} ${String(p.bytes).padStart(6)}B matched=${p.matched} ${p.query}`);
}

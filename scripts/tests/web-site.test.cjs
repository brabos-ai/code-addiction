'use strict';
// =============================================================================
// web-site — static assertions over the public site source under web/
// =============================================================================
// Plan: docs/plans/2026-10-25T101906-PLAN--site-ux-polish.md (ticket 0068B).
// web/ has no test runner of its own, so the site's source-level contract is
// held here, the way graph-mermaid.test.js already reads docs.astro.
// Rendered behaviour (computed fonts, scrollWidth, focus, search) is proven on
// `npm --prefix web run preview` with a headless browser, not in this file.
//
// Run: node scripts/run-tests.js scripts scripts/tests/web-site.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB = path.join(ROOT, 'web');
const read = rel => fs.readFileSync(path.join(WEB, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(WEB, rel));
const CSS = () => read('src/styles/global.css');
const HOME = () => read('src/pages/index.astro');
const DOCS = () => read('src/pages/docs.astro');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- F1 fonts
test('F1: @theme declares --font-display/-body/-mono and no --font-family- key', () => {
  const css = CSS();
  for (const k of ['--font-display', '--font-body', '--font-mono']) {
    assert.match(css, new RegExp(`${k}\s*:`), `${k} missing from @theme`);
  }
  assert.doesNotMatch(css, /--font-family-/, 'Tailwind v4 reads --font-*, not --font-family-*');
});

test('F1: no Google Fonts reference anywhere under web/src', () => {
  const hits = walk(path.join(WEB, 'src')).filter(f => /fonts\.googleapis\.com/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(hits, []);
});

test('F1: the v3 tailwind.config.mjs is gone', () => {
  assert.equal(exists('tailwind.config.mjs'), false);
});

test('F1: web/package.json lists the three fontsource packages', () => {
  const deps = JSON.parse(read('package.json')).dependencies;
  for (const p of ['@fontsource-variable/outfit', '@fontsource/syne', '@fontsource-variable/jetbrains-mono']) {
    assert.ok(deps[p], `${p} missing from dependencies`);
  }
});

// ------------------------------------------------- F2 one CommandLine component
test('F2: CommandLine.astro has a labelled copy button, a live region and a wrapping command', () => {
  assert.ok(exists('src/components/CommandLine.astro'), 'component missing');
  const c = read('src/components/CommandLine.astro');
  assert.match(c, /<button/);
  assert.match(c, /aria-label=\{?[`"']Copy/);
  assert.match(c, /aria-live="polite"/);
  assert.match(c, /min-w-0 break-all/);
});

test('F2: neither page keeps a hand-rolled clipboard handler, cmd- id or copyCmd', () => {
  for (const [name, src] of [['index', HOME()], ['docs', DOCS()]]) {
    assert.doesNotMatch(src, /onclick="navigator\.clipboard/, `${name}: inline clipboard onclick`);
    assert.doesNotMatch(src, /id="cmd-/, `${name}: cmd- id`);
    assert.doesNotMatch(src, /copyCmd\(/, `${name}: copyCmd`);
  }
});

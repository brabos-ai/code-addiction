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

// ------------------------------------------------------ F3 mobile overflow
test('F3: the home hero section clips its glow and the docs main can shrink', () => {
  const hero = HOME().match(/<section class="min-h-screen[^>]*>/);
  assert.ok(hero, 'hero section not found');
  assert.match(hero[0], /overflow-hidden/);
  const main = DOCS().match(/<main class="flex-1 lg:ml-64[^>]*>/);
  assert.ok(main, 'docs main not found');
  assert.match(main[0], /min-w-0/);
});

// ------------------------------------------------------------ F4 focus ring
test('F4: one global :focus-visible rule in the accent colour, and no focus:outline-none', () => {
  assert.match(CSS(), /:focus-visible\s*\{[^}]*outline:[^;}]*(accent|#00ff88)/);
  assert.doesNotMatch(HOME(), /focus:outline-none/);
  assert.doesNotMatch(DOCS(), /focus:outline-none/);
});

// -------------------------------------------------------------- F5 contrast
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('F5: --color-muted reaches 4.5:1 against the #050505 surface', () => {
  const m = CSS().match(/--color-muted:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, '--color-muted not found');
  assert.ok(contrast(m[1], '#050505') >= 4.5, `${m[1]} is ${contrast(m[1], '#050505').toFixed(2)}:1`);
});

test('F5: no 10px text in either page or the flow-diagram label', () => {
  assert.doesNotMatch(HOME(), /text-\[10px\]/);
  assert.doesNotMatch(DOCS(), /text-\[10px\]/);
  assert.doesNotMatch(CSS(), /font-size:\s*10px/);
});

// ---------------------------------------------------------- F6 reduced motion
test('F6: a prefers-reduced-motion block turns off fade-up, bounce, cursor blink and smooth scroll', () => {
  const css = CSS();
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(at >= 0, 'no reduced-motion block');
  const block = css.slice(at);
  for (const s of ['.fade-up', '.animate-bounce', '.cursor-blink', 'scroll-behavior']) {
    assert.ok(block.includes(s), `${s} not covered`);
  }
});

test('F6: hero text never starts at opacity 0', () => {
  const css = CSS();
  const rule = css.match(/\.fade-up\s*\{[^}]*\}/);
  assert.ok(rule, '.fade-up rule missing');
  assert.doesNotMatch(rule[0], /opacity:\s*0\b/);
  const kf = css.match(/@keyframes fadeUp\s*\{[\s\S]*?\n\}/);
  assert.ok(kf, 'fadeUp keyframes missing');
  assert.doesNotMatch(kf[0], /opacity:\s*0\b/);
});

test('F6: the Cytoscape zoom and fit calls honour reduced motion', () => {
  const docs = DOCS();
  assert.match(docs, /prefers-reduced-motion/);
  assert.doesNotMatch(docs, /\{\s*duration:\s*(350|180)\s*\}/, 'animate() still has a fixed duration');
});

// ------------------------------------------------------------- F7 copy slips
test('F7: home page copy: no Portuguese accessible names, a space before the hero break, Why anchor', () => {
  const home = HOME();
  for (const s of ['Ver imagem', 'ampliar', 'Fechar']) assert.ok(!home.includes(s), `${s} still present`);
  assert.doesNotMatch(home, /#flows/);
  assert.doesNotMatch(home, /id="flows"/);
  assert.match(home, /delivery\. <br class="hidden sm:block"\/>/);
  assert.equal((home.match(/href="#why"/g) || []).length, 2, 'desktop and mobile links both point at #why');
  assert.match(home, /<!-- Why section -->\s*<section id="why"/);
});

test('F7: the docs page keeps its own #flows section', () => {
  assert.match(DOCS(), /<section id="flows"/);
});

// ------------------------------------------------------- F8 one provider source
function providerEntries() {
  const src = read('src/data/providers.ts');
  return [...src.matchAll(/^\s*\{\s*key:\s*"([^"]+)"([^}]*)\}/gm)].map(m => ({
    key: m[1],
    name: (m[2].match(/name:\s*"([^"]+)"/) || [])[1],
    dir: (m[2].match(/\bdir:\s*"([^"]+)"/) || [])[1],
    agentsDir: (m[2].match(/agentsDir:\s*"([^"]+)"/) || [])[1],
  }));
}

test('F8: providers.ts holds exactly the six registry providers, with unique names and registry directories', () => {
  assert.ok(exists('src/data/providers.ts'), 'providers.ts missing');
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8')).providers;
  const entries = providerEntries();
  assert.equal(entries.length, 6);
  assert.deepEqual(entries.map(e => e.key).sort(), Object.keys(reg).sort());
  assert.equal(new Set(entries.map(e => e.name)).size, 6, 'display names must be unique');
  for (const e of entries) {
    const strip = d => d.replace(/^framwork\//, '') + '/';
    assert.equal(e.dir, strip(reg[e.key].dir), `${e.key} dir`);
    assert.equal(e.agentsDir, reg[e.key].agentsDir ? strip(reg[e.key].agentsDir) : undefined, `${e.key} agentsDir`);
  }
});

test('F8: both pages render from providers.ts and keep no hand-written provider tile', () => {
  assert.match(HOME(), /data\/providers/);
  assert.match(DOCS(), /data\/providers/);
  assert.doesNotMatch(HOME(), /\.zcode\//);
  assert.doesNotMatch(HOME(), /Codex \(OpenAI\)/);
  assert.doesNotMatch(DOCS(), /<tr><td class="py-3 pr-4 text-muted-light">/);
});

test('F8: the Antigravity and ZCode caveat survives under the docs table', () => {
  assert.match(DOCS(), /Antigravity is deferred because/);
  assert.match(DOCS(), /ZCode reads commands and skills from the same/);
});

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
    assert.match(css, new RegExp(`${k}\\s*:`), `${k} missing from @theme`);
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

// ------------------------------------------------------ F9 menus and lightbox
test('F9: both menu toggles expose aria-controls and aria-expanded', () => {
  const home = HOME().match(/<button id="mobile-menu-toggle"[^>]*>/);
  const docs = DOCS().match(/<button id="docs-sidebar-toggle"[^>]*>/);
  assert.ok(home && docs, 'toggle button not found');
  for (const t of [home[0], docs[0]]) {
    assert.match(t, /aria-controls="[^"]+"/);
    assert.match(t, /aria-expanded="false"/);
  }
  assert.match(home[0], /aria-controls="mobile-menu"/);
  assert.match(docs[0], /aria-controls="docs-sidebar"/);
});

test('F9: Escape closes the menus, and the lightbox is a native dialog opened with showModal', () => {
  assert.match(HOME(), /<dialog id="flowchart-modal"/);
  assert.match(HOME(), /\.showModal\(\)/);
  assert.match(HOME(), /'Escape'|"Escape"/);
  assert.match(DOCS(), /'Escape'|"Escape"/);
  assert.doesNotMatch(HOME(), /id="flowchart-modal"[^>]*class="hidden/);
});

// ------------------------------------------------------------ F10 where am I
test('F10: sidebar link order equals the order of the sections in the page', () => {
  const docs = DOCS();
  const sections = [...docs.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
  const aside = docs.match(/<aside id="docs-sidebar"[\s\S]*?<\/aside>/)[0];
  const links = [...aside.matchAll(/<li><a href="#([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(links, sections);
});

test('F10: an IntersectionObserver over section[id] sets aria-current on the sidebar link', () => {
  const docs = DOCS();
  assert.match(docs, /new IntersectionObserver/);
  assert.match(docs, /section\[id\]/);
  assert.match(docs, /aria-current/);
});

// ------------------------------------------- F11 share preview and dark scheme
test('F11: the layout carries og:image, a large twitter card, a canonical link and color-scheme', () => {
  const layout = read('src/layouts/Layout.astro');
  assert.match(layout, /property="og:image"/);
  assert.match(layout, /name="twitter:card"\s+content="summary_large_image"/);
  assert.match(layout, /rel="canonical"/);
  assert.match(layout, /name="color-scheme"\s+content="dark"/);
});

test('F11: the Astro config sets site to the public origin', () => {
  assert.match(read('astro.config.mjs'), /site:\s*"https:\/\/code\.brabos\.ai"/);
});

test('F11: og.png is 1200x630 by its PNG header', () => {
  assert.ok(exists('public/og.png'), 'og.png missing');
  const buf = fs.readFileSync(path.join(WEB, 'public', 'og.png'));
  assert.equal(buf.toString('latin1', 1, 4), 'PNG');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});

test('F11: :root declares color-scheme: dark and Mermaid gets brand themeVariables', () => {
  assert.match(CSS(), /:root\s*\{[^}]*color-scheme:\s*dark/);
  assert.match(DOCS(), /themeVariables/);
});

// ------------------------------------------------- F14 the map reads the file
test('F14: docs.astro carries no inline node literal and fetches /ecosystem.json', () => {
  const docs = DOCS();
  assert.doesNotMatch(docs, /\{data:\{id:'add',/);
  assert.doesNotMatch(docs, /var RAW = \[/);
  assert.match(docs, /fetch\('\/ecosystem\.json'\)/);
});

test('F14: the map is 60vh tall on a phone and the node list is not hidden there', () => {
  const docs = DOCS();
  assert.match(docs, /id="eco-cy"[^>]*h-\[60vh\]/);
  assert.doesNotMatch(docs, /id="eco-sidebar" class="hidden lg:flex/);
});

// ------------------------------------------------------------ F17 Pagefind
test('F17: the web build indexes dist with pagefind and pagefind is a devDependency', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts.build, /^astro build && pagefind --site dist$/);
  assert.ok(pkg.devDependencies && pkg.devDependencies.pagefind, 'pagefind missing from devDependencies');
});

test('F17: the docs body is tagged for indexing and every section heading has an anchor id', () => {
  const docs = DOCS();
  assert.match(docs, /<main[^>]*data-pagefind-body/);
  const sections = [...docs.matchAll(/<section id="([^"]+)"[^>]*>\s*(?:<p[^>]*>[^<]*<\/p>\s*)?<(h[12])([^>]*)>/g)];
  assert.ok(sections.length >= 14, `only ${sections.length} sections matched`);
  for (const [, id, , attrs] of sections) assert.match(attrs, /\bid="/, `section ${id} heading has no id`);
});

test('F17: a search trigger opens on click and on Ctrl+K / Cmd+K, and the nav drops the repeated links', () => {
  const docs = DOCS();
  assert.match(docs, /id="docs-search-open"/);
  assert.match(docs, /e(vent)?\.(ctrlKey|metaKey)[\s\S]{0,80}\.key\.toLowerCase\(\) === 'k'/);
  const nav = docs.match(/<nav[^>]*class="fixed top-0[\s\S]*?<\/nav>/)[0];
  for (const h of ['#commands', '#graph', '#flows']) assert.ok(!nav.includes(`href="${h}"`), `nav still links ${h}`);
});

test('F17: #eco-search has an accessible name and the list has an empty state', () => {
  const docs = DOCS();
  assert.match(docs.match(/<input id="eco-search"[^>]*>/)[0], /aria-label="[^"]+"/);
  assert.match(docs, /id="eco-empty"/);
});

// -------------------------------------------------------- F18 terminal session
test('F18: a static /add-plan to /add-build session sits between the hero and the trail, in the HTML', () => {
  const home = HOME();
  const at = home.indexOf('id="session"');
  assert.ok(at > home.indexOf('<!-- Hero -->'), 'session block missing or before the hero');
  assert.ok(at < home.indexOf('id="trail"'), 'session block must come right after the hero');
  const block = home.slice(at, home.indexOf('id="trail"'));
  assert.match(block, /\/add-plan/);
  assert.match(block, /\/add-build/);
  assert.doesNotMatch(block, /<video/);
});

test('F18: the typing effect is a transform-only mask, added by JS, and off under reduced motion', () => {
  const css = CSS();
  assert.match(css, /\.js-typing \.term-line::after/);
  const kf = css.match(/@keyframes termReveal\s*\{[\s\S]*?\n\}/);
  assert.ok(kf, 'termReveal keyframes missing');
  assert.match(kf[0], /transform:/);
  assert.doesNotMatch(kf[0], /(width|opacity|height|left)\s*:/);
  const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(rm.includes('.term-line'), 'reduced-motion block does not cover .term-line');
  assert.doesNotMatch(css.match(/\.term-line\s*\{[^}]*\}/)[0], /opacity:\s*0/);
});

// ------------------------------------------- F19 scroll reveal and spotlight
test('F19: reveal targets are marked in the HTML but only the page script hides them', () => {
  const home = HOME();
  // Decided 9: at most 1-2 animated elements per view. A section header is one element (its h2), the
  // Why cards reveal as one grid, so a view never animates more than two.
  assert.equal((home.match(/<\w+ data-reveal/g) || []).length, 5, 'four section h2 and the Why grid');
  assert.doesNotMatch(home, /<p data-reveal/, 'eyebrow lines do not animate on their own');
  assert.doesNotMatch(home, /<div[^>]*(why-card[^>]*data-reveal|data-reveal[^>]*why-card)/, 'cards reveal through their grid');
  assert.match(home, /<div data-reveal class="grid sm:grid-cols-2 lg:grid-cols-4/);
  assert.doesNotMatch(home, /class="[^"]*\breveal\b/, 'a hidden state in the markup would hide content without JS');
  assert.match(home, /classList\.add\('reveal'\)/);
  assert.match(home, /new IntersectionObserver/);
});

test('F19: the reveal hidden state is transform and opacity only and is cleared under reduced motion', () => {
  const css = CSS();
  const hidden = css.match(/\.reveal\s*\{[^}]*\}/);
  assert.ok(hidden, '.reveal rule missing');
  assert.match(hidden[0], /opacity:\s*0/);
  assert.doesNotMatch(hidden[0], /(width|height|top|left|margin)\s*:/);
  assert.match(css, /\.reveal\.is-visible\s*\{/);
  const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(rm.includes('.reveal'), 'reduced-motion block does not cover .reveal');
});

test('F19: the Why-card spotlight follows the pointer on hover devices only, never under reduced motion', () => {
  const css = CSS();
  const home = HOME();
  assert.match(css, /@media \(hover: hover\)[\s\S]*?\.why-card::before/);
  assert.match(css, /--mx/);
  assert.match(home, /pointermove/);
  assert.match(home, /--mx/);
  assert.ok((home.match(/why-card/g) || []).length >= 4, 'four Why cards');
  assert.match(home, /hover: hover/);
  assert.match(home, /prefers-reduced-motion: reduce/);
});

// -------------------------------------------------- F20 page transition
test('F20: every inline script that binds handlers binds on astro:page-load', () => {
  for (const [name, src] of [['index', HOME()], ['docs', DOCS()]]) {
    const scripts = [...src.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.ok(scripts.length > 0, `${name}: no inline script found`);
    for (const [i, body] of scripts.entries()) {
      if (/addEventListener/.test(body)) {
        assert.match(body, /document\.addEventListener\('astro:page-load'/, `${name} script #${i + 1} binds handlers without astro:page-load`);
      }
    }
  }
});

test('F20: the layout turns on the client router and the navs share a transition name', () => {
  const layout = read('src/layouts/Layout.astro');
  assert.match(layout, /import \{ ClientRouter \} from "astro:transitions"/);
  assert.match(layout, /<ClientRouter \/>/);
  assert.match(HOME(), /<nav[^>]*transition:name="site-nav"/);
  assert.match(DOCS(), /<nav[^>]*transition:name="site-nav"/);
});

test('F20: document-level handlers are released before the page is swapped', () => {
  for (const [name, src] of [['index', HOME()], ['docs', DOCS()]]) {
    assert.match(src, /astro:before-swap/, `${name}: nothing releases document listeners`);
    assert.match(src, /signal:/, `${name}: document listeners carry no abort signal`);
  }
});

test('F20: a script that outlives its page binds once and guards work that finishes after a navigation', () => {
  assert.match(read('src/components/CommandLine.astro'), /__commandLineBound/);
  const docs = DOCS();
  assert.match(docs, /if \(!document\.getElementById\('docs-sidebar'\)\) return;/);
  assert.match(docs, /if \(!target\.isConnected\) return;/);
  assert.match(docs, /if \(!document\.getElementById\('eco-cy'\)\) return;/);
});

// ------------------------------------------ Lighthouse accessibility findings
test('Lighthouse a11y: inline links are underlined, the map hint has contrast, the search label matches its text', () => {
  const docs = DOCS();
  assert.doesNotMatch(docs, /class="text-accent hover:underline"/, 'a link inside text must not rely on colour alone');
  assert.doesNotMatch(docs, /text-muted-light\/70/, 'the map hint sits at 3.9:1 with the opacity');
  const btn = docs.match(/<button type="button" id="docs-search-open"[^>]*>/);
  assert.ok(btn, 'desktop search button not found');
  assert.doesNotMatch(btn[0], /aria-label=/, 'the visible text already names the button; a different label fails label-in-name');
  assert.match(docs, /<kbd[^>]*aria-hidden="true"/);
});

// ====================================================================
// 0069B site-i18n — plan docs/plans/2026-10-25T194930-PLAN--site-i18n.md
// ====================================================================
const I18N = name => read(`src/i18n/${name}`);

test('i18n F1: the Astro config routes en (default, unprefixed) and pt-br', () => {
  const cfg = read('astro.config.mjs');
  assert.match(cfg, /defaultLocale:\s*["']en["']/);
  assert.match(cfg, /locales:\s*\[\s*["']en["']\s*,\s*["']pt-br["']\s*\]/);
  assert.match(cfg, /routing:\s*\{[^}]*prefixDefaultLocale:\s*false/);
});

test('i18n F2: the strings modules exist, pt-br is typed Strings, and the guards run at module load', () => {
  for (const f of ['en.ts', 'pt-br.ts', 'index.ts']) assert.ok(exists(`src/i18n/${f}`), `${f} missing`);
  assert.match(I18N('pt-br.ts'), /:\s*Strings\b/);
  assert.match(I18N('en.ts'), /export type Strings\b/);
  const idx = I18N('index.ts');
  assert.match(idx, /export (function|const) useT\b/);
  assert.match(idx, /export (function|const) localeHref\b/);
  assert.match(idx, /export (function|const) alternateUrls\b/);
  assert.match(idx, /SAME_IN_BOTH/);
  assert.match(idx, /^assertParity\(\);/m, 'parity guard must run at top level');
  assert.match(idx, /^assertTranslated\(\);/m, 'same-value guard must run at top level');
});

test('i18n F3: the layout sets lang from the locale and emits hreflang, canonical and og:locale', () => {
  const layout = read('src/layouts/Layout.astro');
  assert.doesNotMatch(layout, /<html lang="en"/);
  assert.match(layout, /<html lang=\{/);
  assert.match(layout, /hreflang="en"/);
  assert.match(layout, /hreflang="pt-BR"/);
  assert.match(layout, /hreflang="x-default"/);
  assert.match(layout, /rel="canonical"/);
  assert.match(layout, /property="og:locale"/);
  assert.match(layout, /og:locale:alternate/);
});

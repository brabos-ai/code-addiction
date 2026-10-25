#!/usr/bin/env node
/**
 * qa-preflight.cjs — deterministic QA prerequisite probes.
 *
 * Shared by /add-review and /add-qa-setup. Native port of qa-preflight.sh
 * (F13); the shipped shell entry stays as the baseline comparison until F20
 * retires it.
 *
 * Usage: node .codeadd/scripts/qa-preflight.cjs a
 *        node .codeadd/scripts/qa-preflight.cjs b <FEATURE_DIR> [SPEC_GLOB]
 *
 * Reads the project's `.codeadd/settings.json`, section `qa` (schema: add--settings):
 *   QA_CONFIG comes from qa.baseUrl; QA_RECEIPT and QA_CONTRACT_* from qa["setup-shape"]
 *   and qa["framework-version"]. A file that does not parse is broken for both; a file
 *   with no qa section reads as missing for both.
 *
 * Output: KEY=STATUS lines. Statuses: ok | missing | broken | not-probed.
 *   On QA_CONTRACT_MATCH=broken only, five more rows say why: the receipt shape and
 *   its framework-version, the shipped shape, the version that last changed it
 *   (unknown when the sidecar predates the field) and the action to take.
 *   QA_FEATURE_STATE is the RAW manifest value (true|false|unset|no-manifest);
 *   the calling command applies default semantics — the defaults registry lives
 *   in the CLI (cli/src/features.js) and is not duplicated here.
 *
 * Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse.
 *
 * Built-ins only. No shell.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

// Single source of the manifest feature key. cli/src/features.js owns the
// registry; this is the one place a shipped script names the key, so a future
// rename has exactly one line to change here.
const QA_FEATURE_KEY = 'qa-pipeline';

function write(line) {
  process.stdout.write(line + '\n');
}

function usage() {
  process.stdout.write(
    'Usage: node .codeadd/scripts/qa-preflight.cjs a | node .codeadd/scripts/qa-preflight.cjs b <FEATURE_DIR> [SPEC_GLOB]\n',
  );
  process.exitCode = 2;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

// --- baseUrl locality --------------------------------------------------------

/**
 * The Docker bridge network is 172.16.0.0/12 (172.16-172.31 ONLY — 172.32.* is
 * public), plus the host gateway alias.
 */
function isLocalHost(host) {
  if (!host) return false;
  if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host === '[::1]') return true;
  if (host.startsWith('127.')) return true;
  if (host.endsWith('.local') || host.endsWith('.test')) return true;
  if (host.startsWith('192.168.') || host.startsWith('10.')) return true;
  if (/^172\.1[6-9]\./.test(host)) return true;
  if (/^172\.2[0-9]\./.test(host)) return true;
  if (/^172\.3[01]\./.test(host)) return true;
  if (host === 'host.docker.internal') return true;
  return false;
}

// --- runner probes -----------------------------------------------------------

/** Resolve the PROJECT's @playwright/test from cwd, never this file's dir. */
function resolvePlaywright() {
  try {
    return require.resolve('@playwright/test', { paths: [process.cwd()] });
  } catch {
    return null;
  }
}

/** Probe the installed project's CLI directly: no npx shim or network install. */
function playwrightCliOk() {
  try {
    const packageFile = require.resolve('@playwright/test/package.json', { paths: [process.cwd()] });
    const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.playwright;
    if (!bin) return false;
    const result = spawnSync(process.execPath, [path.resolve(path.dirname(packageFile), bin), '--version'], {
      stdio: 'ignore',
      shell: false,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/** Real headless launch; only meaningful with a working runner. */
async function chromiumOk(resolved) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const pw = createRequire(__filename)(resolved);
    const browser = await pw.chromium.launch();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

// --- glob presence -----------------------------------------------------------

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function segmentMatch(pattern, segment) {
  let re = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '[') {
      let j = i + 1;
      let cls = '[';
      if (pattern[j] === '!' || pattern[j] === '^') {
        cls += '^';
        j += 1;
      }
      while (j < pattern.length && pattern[j] !== ']') {
        cls += pattern[j];
        j += 1;
      }
      cls += ']';
      re += cls;
      i = j;
    } else {
      re += escapeRe(c);
    }
  }
  re += '$';
  return new RegExp(re).test(segment);
}

function matchSegments(patterns, segments) {
  if (patterns.length === 0) return segments.length === 0;
  const [head, ...rest] = patterns;
  if (head === '**') {
    for (let i = 0; i <= segments.length; i += 1) {
      if (matchSegments(rest, segments.slice(i))) return true;
    }
    return false;
  }
  if (segments.length === 0) return false;
  if (!segmentMatch(head, segments[0])) return false;
  return matchSegments(rest, segments.slice(1));
}

function collectEntries(dir, rel, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    out.push(child);
    if (entry.isDirectory()) collectEntries(path.join(dir, entry.name), child, out);
  }
}

/** `compgen -G`: true when the glob matches at least one existing path. */
function globHasMatch(pattern) {
  const norm = String(pattern).replace(/\\/g, '/');
  const segments = norm.split('/').filter((s) => s !== '');
  let base = '.';
  let idx = 0;
  while (idx < segments.length && !/[*?[]/.test(segments[idx])) {
    base = path.join(base, segments[idx]);
    idx += 1;
  }
  const rest = segments.slice(idx);
  if (rest.length === 0) return fs.existsSync(base);

  const found = [];
  collectEntries(base, '', found);
  return found.some((rel) => matchSegments(rest, rel === '' ? [] : rel.split('/')));
}

// --- receipt + contract shape ------------------------------------------------

/**
 * The `qa` section of .codeadd/settings.json.
 *   { state: 'absent' }              no file, or a file with no qa section
 *   { state: 'broken' }              the file does not parse (or qa is not an object)
 *   { state: 'ok', qa: {...} }       the section
 */
function readQaSection(file) {
  if (!isFile(file)) return { state: 'absent' };
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { state: 'broken' };
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return { state: 'broken' };
  if (!Object.prototype.hasOwnProperty.call(doc, 'qa')) return { state: 'absent' };
  if (doc.qa === null || typeof doc.qa !== 'object' || Array.isArray(doc.qa)) return { state: 'broken' };
  return { state: 'ok', qa: doc.qa };
}

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/** Does the section hold any value field (the scaffolded QA values)? */
function hasValueFields(qa) {
  return ['baseUrl', 'viewports', 'bootHint', 'authSeed'].some((k) => has(qa, k));
}

/** Does the section hold any receipt field? */
function hasReceiptFields(qa) {
  return ['setup-shape', 'first-run', 'last-run'].some((k) => has(qa, k));
}

/** A bare `sha256:<hex>`; '' for anything else. */
function recordedShape(qa) {
  const v = qa['setup-shape'];
  return typeof v === 'string' && /^sha256:[0-9a-f]+$/.test(v) ? v : '';
}

/** Receipt `framework-version`; '' when absent or not a string. */
function receiptVersion(qa) {
  const v = qa['framework-version'];
  return typeof v === 'string' ? v : '';
}

function readCurrentShape(text) {
  let afterKey = false;
  for (const line of text.split('\n')) {
    if (/"add-qa-setup"\s*:/.test(line)) afterKey = true;
    if (afterKey && /"shape"\s*:\s*"sha256:[0-9a-f]+"/.test(line)) {
      const m = /sha256:[0-9a-f]+/.exec(line);
      if (m) return m[0];
    }
  }
  return '';
}

/**
 * The version that last changed the shipped QA shape, parsed from the sidecar so
 * another contract's `changed_in` can never be mistaken for add-qa-setup's.
 */
function readChangedIn(text) {
  try {
    const v = JSON.parse(text).contracts['add-qa-setup'].changed_in;
    return typeof v === 'string' && v ? v : '';
  } catch {
    return '';
  }
}

// --- phases ------------------------------------------------------------------

async function phaseA() {
  // Feature state (raw manifest read)
  const manifest = path.resolve(process.cwd(), '.codeadd', 'manifest.json');
  if (!isFile(manifest)) {
    write('QA_FEATURE_STATE=no-manifest');
  } else {
    let state = 'unset';
    try {
      const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      const has =
        parsed.features &&
        Object.prototype.hasOwnProperty.call(parsed.features, QA_FEATURE_KEY);
      state = has ? String(parsed.features[QA_FEATURE_KEY]) : 'unset';
    } catch {
      state = 'unset';
    }
    write(`QA_FEATURE_STATE=${state}`);
  }

  // .codeadd/settings.json → qa — parse + require baseUrl; dependent probes short-circuit.
  const settings = readQaSection(path.resolve(process.cwd(), '.codeadd', 'settings.json'));
  if (settings.state === 'absent' || (settings.state === 'ok' && !hasValueFields(settings.qa))) {
    write('QA_CONFIG=missing');
    write('QA_BASEURL=');
    write('QA_BASEURL_LOCAL=not-probed');
    write('QA_BASEURL_REACHABLE=not-probed');
  } else {
    let baseUrl = null;
    if (settings.state === 'ok' && typeof settings.qa.baseUrl === 'string' && settings.qa.baseUrl) {
      baseUrl = settings.qa.baseUrl;
    }

    if (baseUrl === null) {
      write('QA_CONFIG=broken');
      write('QA_BASEURL=');
      write('QA_BASEURL_LOCAL=not-probed');
      write('QA_BASEURL_REACHABLE=not-probed');
    } else {
      write('QA_CONFIG=ok');
      write(`QA_BASEURL=${baseUrl}`);
      // Local/throwaway host check runs FIRST: a non-local baseUrl is refused
      // anyway, so reachability is never probed against a remote host.
      let host = '';
      try {
        host = new URL(baseUrl).hostname;
      } catch {
        host = '';
      }
      const local = isLocalHost(host) ? 'ok' : 'broken';
      write(`QA_BASEURL_LOCAL=${local}`);
      if (local === 'ok') {
        let reachable = 'broken';
        try {
          await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
          reachable = 'ok';
        } catch {
          reachable = 'broken';
        }
        write(`QA_BASEURL_REACHABLE=${reachable}`);
      } else {
        write('QA_BASEURL_REACHABLE=not-probed');
      }
    }
  }

  // Runner — must be the PROJECT's @playwright/test, then a functional probe.
  const resolved = resolvePlaywright();
  if (resolved && playwrightCliOk()) {
    write('QA_RUNNER=ok');
    const chromium = await chromiumOk(resolved);
    write(`QA_CHROMIUM=${chromium ? 'ok' : 'broken'}`);
  } else {
    write('QA_RUNNER=missing');
    write('QA_CHROMIUM=not-probed');
  }

  // qa-project skill — generated at setup time into a provider skills dir.
  // `.agent` (antigrav) and `.agents` (codex) are different providers.
  let skill = 'missing';
  for (const dir of ['.claude', '.agents', '.agent', '.cursor', '.opencode']) {
    if (isFile(path.resolve(process.cwd(), dir, 'skills', 'qa-project', 'SKILL.md'))) {
      skill = 'ok';
      break;
    }
  }
  write(`QA_PROJECT_SKILL=${skill}`);

  // Receipt + shipped shape. Diagnosis only — callers decide block vs work.
  const sidecar = path.resolve(process.cwd(), '.codeadd', 'contracts.json');
  if (settings.state === 'absent' || (settings.state === 'ok' && !hasReceiptFields(settings.qa))) {
    write('QA_RECEIPT=missing');
    write('QA_CONTRACT_MATCH=not-probed');
  } else {
    const recorded = settings.state === 'ok' ? recordedShape(settings.qa) : '';
    if (!recorded) {
      write('QA_RECEIPT=broken');
      write('QA_CONTRACT_MATCH=not-probed');
    } else {
      write('QA_RECEIPT=ok');
      if (!isFile(sidecar)) {
        write('QA_CONTRACT_MATCH=missing');
      } else {
        const current = readCurrentShape(fs.readFileSync(sidecar, 'utf8'));
        if (!current) {
          write('QA_CONTRACT_MATCH=missing');
        } else if (recorded === current) {
          write('QA_CONTRACT_MATCH=ok');
        } else {
          write('QA_CONTRACT_MATCH=broken');
          write(`QA_CONTRACT_RECEIPT_SHAPE=${recorded}`);
          write(`QA_CONTRACT_RECEIPT_VERSION=${receiptVersion(settings.qa) || 'unknown'}`);
          write(`QA_CONTRACT_SHIPPED_SHAPE=${current}`);
          write(`QA_CONTRACT_CHANGED_IN=${readChangedIn(fs.readFileSync(sidecar, 'utf8')) || 'unknown'}`);
          write('QA_CONTRACT_ACTION=/add-qa-setup');
        }
      }
    }
  }
}

function phaseB(featureDir, specGlob) {
  if (!featureDir) {
    usage();
    return;
  }

  const screens = path.resolve(featureDir, '_tests', 'screens.json');
  if (!isFile(screens)) {
    write('QA_SCREENS=missing');
  } else {
    let ok = true;
    try {
      JSON.parse(fs.readFileSync(screens, 'utf8'));
    } catch {
      ok = false;
    }
    write(`QA_SCREENS=${ok ? 'ok' : 'broken'}`);
  }

  // Spec presence — the caller resolves the glob from the generated qa-project
  // skill (never guesses); with no glob the probe is honestly not-probed.
  if (!specGlob) {
    write('QA_SPECS=not-probed');
  } else {
    write(`QA_SPECS=${globHasMatch(specGlob) ? 'ok' : 'missing'}`);
  }
}

async function main(argv) {
  const phase = argv[0] || '';
  switch (phase) {
    case 'a':
      await phaseA();
      return undefined;
    case 'b':
      phaseB(argv[1] || '', argv[2] || '');
      return undefined;
    default:
      return usage();
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    () => {},
    (err) => {
      // Diagnosis, never a gate: an unexpected probe error still exits 0 with
      // whatever was already reported. Usage sets exit 2 before this point.
      if (process.exitCode !== 2) process.exitCode = 0;
      if (err && err.stack) process.stderr.write(`${err.stack}\n`);
    },
  );
}

module.exports = { isLocalHost, globHasMatch, phaseA, phaseB };

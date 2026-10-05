'use strict';
// =============================================================================
// qa-preflight — native port of framwork/.codeadd/scripts/tests/qa-preflight.bats
// =============================================================================
// Target: framwork/.codeadd/scripts/qa-preflight.cjs (F27; intentionally Red
// until the native entry lands).
//
// Contract: KEY=STATUS lines with statuses ok|missing|broken|not-probed, plus
// the RAW QA_FEATURE_STATE (true|false|unset|no-manifest). Diagnosis, never a
// gate: exit 0 whatever the probes; exit 2 only on CLI misuse.
//
// Run: node --test scripts/tests/qa-preflight.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

/** A throwaway project root used as the child's cwd; cleaned via t.after. */
function project(t) {
  const base = h.mkTmp('codeadd-qa-preflight-');
  t.after(() => h.rmrf(base));
  return base;
}

function writeManifest(base, content) {
  h.write(path.join(base, '.codeadd', 'manifest.json'), content);
}

function writeConfig(base, content) {
  h.write(path.join(base, 'docs', 'qa', 'config.json'), content);
}

// ─── Phase A: feature state (raw manifest read) ──────────────────────────────

test('qa-preflight#001 — phase a: no manifest → QA_FEATURE_STATE=no-manifest, exit 0', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=no-manifest/);
});

test('qa-preflight#002 — manifest without features key → QA_FEATURE_STATE=unset', (t) => {
  const base = project(t);
  writeManifest(base, '{"version":"0.0.0","providers":["claude"]}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=unset/);
});

test('qa-preflight#003 — features.qa-pipeline=true → QA_FEATURE_STATE=true', (t) => {
  const base = project(t);
  writeManifest(base, '{"features":{"qa-pipeline":true}}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=true/);
});

test('qa-preflight#004 — features.qa-pipeline=false → QA_FEATURE_STATE=false', (t) => {
  const base = project(t);
  writeManifest(base, '{"features":{"qa-pipeline":false}}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=false/);
});

test('qa-preflight#005 — malformed manifest → QA_FEATURE_STATE=unset, still exit 0', (t) => {
  const base = project(t);
  writeManifest(base, '{"features":{"qa-pipeline":');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_FEATURE_STATE=unset/);
  assert.match(res.output, /QA_PROJECT_SKILL=/);
});

// ─── Phase A: config.json + short-circuit of dependent probes ────────────────

test('qa-preflight#006 — config missing → QA_CONFIG=missing, baseUrl probes not-probed', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_CONFIG=missing/);
  assert.match(res.output, /QA_BASEURL_REACHABLE=not-probed/);
  assert.match(res.output, /QA_BASEURL_LOCAL=not-probed/);
});

test('qa-preflight#007 — config invalid JSON → QA_CONFIG=broken, baseUrl probes not-probed', (t) => {
  const base = project(t);
  writeConfig(base, '{not json');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_CONFIG=broken/);
  assert.match(res.output, /QA_BASEURL_REACHABLE=not-probed/);
});

test('qa-preflight#008 — config without baseUrl → QA_CONFIG=broken', (t) => {
  const base = project(t);
  writeConfig(base, '{"viewports":{}}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_CONFIG=broken/);
});

test('qa-preflight#009 — local baseUrl on closed port → LOCAL=ok, REACHABLE=broken', (t) => {
  const base = project(t);
  writeConfig(base, '{"baseUrl":"http://127.0.0.1:1"}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_CONFIG=ok/);
  assert.match(res.output, /QA_BASEURL=http:\/\/127\.0\.0\.1:1/);
  assert.match(res.output, /QA_BASEURL_LOCAL=ok/);
  assert.match(res.output, /QA_BASEURL_REACHABLE=broken/);
});

test('qa-preflight#010 — production baseUrl → QA_BASEURL_LOCAL=broken (refuse remote hosts)', (t) => {
  const base = project(t);
  writeConfig(base, '{"baseUrl":"https://app.example.com"}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_BASEURL_LOCAL=broken/);
});

test('qa-preflight#011 — docker bridge baseUrl (172.16/12) → QA_BASEURL_LOCAL=ok', (t) => {
  const base = project(t);
  writeConfig(base, '{"baseUrl":"http://172.17.0.2:3000"}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_BASEURL_LOCAL=ok/);
});

test('qa-preflight#012 — host.docker.internal baseUrl → QA_BASEURL_LOCAL=ok', (t) => {
  const base = project(t);
  writeConfig(base, '{"baseUrl":"http://host.docker.internal:3000"}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_BASEURL_LOCAL=ok/);
});

test('qa-preflight#013 — 172.32.x is public, NOT the docker bridge → QA_BASEURL_LOCAL=broken', (t) => {
  const base = project(t);
  writeConfig(base, '{"baseUrl":"http://172.32.0.5:3000"}');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_BASEURL_LOCAL=broken/);
});

// ─── Phase A: runner + chromium short-circuit ────────────────────────────────

test('qa-preflight#014 — runner absent in project → QA_RUNNER=missing, QA_CHROMIUM=not-probed', (t) => {
  const base = project(t);
  // Pinned environment: the temp dir is created outside any JS project, but
  // require.resolve walks parent dirs AND a user-level node_modules above the
  // temp dir makes this unprovable. The Bats suite asserted the absence and
  // failed on such a host; a native suite must be honest instead of green for
  // the wrong reason, so an unresolvable runner is required to run the probe.
  const probe = h.runNode(['-e', "require.resolve('@playwright/test')"], { cwd: base });
  if (probe.status === 0) {
    return t.skip('@playwright/test resolvable from the fixture cwd; runner-absence is unprovable here');
  }
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_RUNNER=missing/);
  assert.match(res.output, /QA_CHROMIUM=not-probed/);
});

// ─── Phase A: qa-project skill ───────────────────────────────────────────────

test('qa-preflight#015 — qa-project skill present in a provider skills dir → ok', (t) => {
  const base = project(t);
  h.write(path.join(base, '.claude', 'skills', 'qa-project', 'SKILL.md'), '# qa-project\n');
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_PROJECT_SKILL=ok/);
});

test('qa-preflight#016 — qa-project skill absent → missing', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_PROJECT_SKILL=missing/);
});

// ─── Phase B: screens.json + spec glob ───────────────────────────────────────

test('qa-preflight#017 — phase b: screens.json missing → QA_SCREENS=missing', (t) => {
  const base = project(t);
  fs.mkdirSync(path.join(base, 'docs', 'features', '0001F-x'), { recursive: true });
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SCREENS=missing/);
});

test('qa-preflight#018 — phase b: screens.json invalid JSON → QA_SCREENS=broken', (t) => {
  const base = project(t);
  h.write(path.join(base, 'docs', 'features', '0001F-x', '_tests', 'screens.json'), '{broken');
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SCREENS=broken/);
});

test('qa-preflight#019 — phase b: valid screens.json → QA_SCREENS=ok', (t) => {
  const base = project(t);
  h.write(
    path.join(base, 'docs', 'features', '0001F-x', '_tests', 'screens.json'),
    '{"feature":"0001F","screens":[]}',
  );
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SCREENS=ok/);
});

test('qa-preflight#020 — phase b: no spec glob arg → QA_SPECS=not-probed', (t) => {
  const base = project(t);
  fs.mkdirSync(path.join(base, 'docs', 'features', '0001F-x'), { recursive: true });
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SPECS=not-probed/);
});

test('qa-preflight#021 — phase b: spec glob with a match → QA_SPECS=ok', (t) => {
  const base = project(t);
  fs.mkdirSync(path.join(base, 'docs', 'features', '0001F-x'), { recursive: true });
  h.write(path.join(base, 'e2e', 'login.qa.spec.ts'), '');
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x', 'e2e/*.qa.spec.*'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SPECS=ok/);
});

test('qa-preflight#022 — phase b: spec glob without match → QA_SPECS=missing', (t) => {
  const base = project(t);
  fs.mkdirSync(path.join(base, 'docs', 'features', '0001F-x'), { recursive: true });
  fs.mkdirSync(path.join(base, 'e2e'), { recursive: true });
  const res = h.runScript('qa-preflight', ['b', 'docs/features/0001F-x', 'e2e/*.qa.spec.*'], { cwd: base });
  assert.equal(res.status, 0, res.output);
  assert.match(res.output, /QA_SPECS=missing/);
});

// ─── CLI contract ────────────────────────────────────────────────────────────

test('qa-preflight#023 — diagnosis is never a gate: everything missing still exits 0', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['a'], { cwd: base });
  assert.equal(res.status, 0, res.output);
});

test('qa-preflight#024 — unknown phase → exit 2 with usage (CLI misuse is not a diagnosis)', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['nope'], { cwd: base });
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /Usage/);
});

test('qa-preflight#025 — phase b without FEATURE_DIR → exit 2 with usage', (t) => {
  const base = project(t);
  const res = h.runScript('qa-preflight', ['b'], { cwd: base });
  assert.equal(res.status, 2, res.output);
  assert.match(res.output, /Usage/);
});

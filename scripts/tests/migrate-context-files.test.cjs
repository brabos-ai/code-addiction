'use strict';
// =============================================================================
// NATIVE PORT — migrate-context-files (F27, target F16's
// framwork/.codeadd/scripts/migrate-context-files.cjs)
// =============================================================================
// Ported from framwork/.codeadd/scripts/tests/migrate-context-files.bats (10
// cases). The one property every test protects: no line of a migrated file is
// lost. Candidates are processed in order — CLAUDE.md, .claude/CLAUDE.md,
// GEMINI.md — and a candidate is deleted only after AGENTS.md was written.
// CLAUDE.local.md is personal and is only reported.
//
// ⛔ RED IS EXPECTED: migrate-context-files.cjs does not exist yet.
//
// Run: node --test scripts/tests/migrate-context-files.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const abs = (dir, rel) => path.join(dir, rel);

/** Every non-empty line of `src` appears in AGENTS.md (substring, CR-tolerant). */
function assertAllLinesInAgents(dir, src) {
  const agents = h.read(abs(dir, 'AGENTS.md'));
  for (const raw of src.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line === '') continue;
    assert.ok(agents.includes(line), `missing line: ${line}`);
  }
}

test('migrate-context-files#001 CLAUDE.md alone becomes AGENTS.md verbatim and is deleted', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const original = '# Project\n\nRule one.\n';
    h.write(abs(dir, 'CLAUDE.md'), original);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:CLAUDE.md:created'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.md')), false);
    assert.equal(h.read(abs(dir, 'AGENTS.md')), original, 'byte-for-byte');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#002 .claude/CLAUDE.md alone becomes AGENTS.md and is deleted', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const original = '# Nested\n\nKeep me.\n';
    h.write(abs(dir, '.claude/CLAUDE.md'), original);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:.claude/CLAUDE.md:created'));
    assert.equal(fs.existsSync(abs(dir, '.claude/CLAUDE.md')), false);
    assert.equal(h.read(abs(dir, 'AGENTS.md')), original);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#003 old add-wiki shape: both copies are duplicates, AGENTS.md unchanged', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const claude = '# Project\n\nRule one.\n';
    h.write(abs(dir, 'CLAUDE.md'), claude);
    h.write(abs(dir, 'GEMINI.md'), claude);
    const agents = '# Project\n\nRule one.\n\n---\n\n## Shell policy (Windows)\nUse Git Bash.\n';
    h.write(abs(dir, 'AGENTS.md'), agents);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:CLAUDE.md:duplicate'));
    assert.ok(res.output.includes('MIGRATED:GEMINI.md:duplicate'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.md')), false);
    assert.equal(fs.existsSync(abs(dir, 'GEMINI.md')), false);
    assert.equal(h.read(abs(dir, 'AGENTS.md')), agents, 'already-contained content is not re-appended');
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#004 CRLF candidate against LF AGENTS.md counts as contained', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    h.write(abs(dir, 'CLAUDE.md'), '# Project\r\n\r\nRule one.\r\n');
    h.write(abs(dir, 'AGENTS.md'), '# Project\n\nRule one.\n\n## Shell policy (Windows)\n');
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:CLAUDE.md:duplicate'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.md')), false);
    assert.equal(h.read(abs(dir, 'AGENTS.md')).includes('Migrated from'), false);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#005 hand-written CLAUDE.md different from AGENTS.md is appended whole under a heading', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const claude = '# My Claude notes\n\n- Always use pnpm.\n- Never touch prod.\n';
    const agents = '# Agents\n\nCodex rules here.\n';
    h.write(abs(dir, 'CLAUDE.md'), claude);
    h.write(abs(dir, 'AGENTS.md'), agents);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:CLAUDE.md:appended'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.md')), false);
    const out = h.read(abs(dir, 'AGENTS.md'));
    assert.ok(out.split('\n').includes('## Migrated from CLAUDE.md'));
    assertAllLinesInAgents(dir, claude);
    assertAllLinesInAgents(dir, agents);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#006 all three candidates, each different: every line of every file lands in AGENTS.md', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const root = '# Root claude\nalpha line\n';
    const nested = '# Nested claude\nbeta line\n';
    const gemini = '# Gemini\ngamma line\n';
    h.write(abs(dir, 'CLAUDE.md'), root);
    h.write(abs(dir, '.claude/CLAUDE.md'), nested);
    h.write(abs(dir, 'GEMINI.md'), gemini);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('MIGRATED:CLAUDE.md:created'));
    assert.ok(res.output.includes('MIGRATED:.claude/CLAUDE.md:appended'));
    assert.ok(res.output.includes('MIGRATED:GEMINI.md:appended'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.md')), false);
    assert.equal(fs.existsSync(abs(dir, '.claude/CLAUDE.md')), false);
    assert.equal(fs.existsSync(abs(dir, 'GEMINI.md')), false);
    for (const src of [root, nested, gemini]) assertAllLinesInAgents(dir, src);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#007 CLAUDE.local.md is left in place and reported', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    h.write(abs(dir, 'CLAUDE.local.md'), 'personal\n');
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('LEGACY_LOCAL:CLAUDE.local.md'));
    assert.equal(fs.existsSync(abs(dir, 'CLAUDE.local.md')), true, 'personal context is never touched');
    assert.equal(fs.existsSync(abs(dir, 'AGENTS.md')), false);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#008 nothing to migrate reports CONTEXT_MIGRATION:none and writes nothing', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('CONTEXT_MIGRATION:none'));
    assert.equal(fs.existsSync(abs(dir, 'AGENTS.md')), false);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#009 AGENTS.md alone is left byte-identical', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    const agents = '# Agents\nonly file\n';
    h.write(abs(dir, 'AGENTS.md'), agents);
    const res = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.output.includes('CONTEXT_MIGRATION:none'));
    assert.equal(h.read(abs(dir, 'AGENTS.md')), agents);
  } finally {
    h.rmrf(dir);
  }
});

test('migrate-context-files#010 a second run changes nothing', () => {
  const dir = h.mkTmp('codeadd-ctx-');
  try {
    h.write(abs(dir, 'CLAUDE.md'), '# My notes\nkeep\n');
    h.write(abs(dir, 'AGENTS.md'), '# Agents\nother\n');
    const first = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(first.status, 0, first.output);
    const after = h.read(abs(dir, 'AGENTS.md'));
    const second = h.runScript('migrate-context-files', [], { cwd: dir });
    assert.equal(second.status, 0, second.output);
    assert.ok(second.output.includes('CONTEXT_MIGRATION:none'));
    assert.equal(h.read(abs(dir, 'AGENTS.md')), after, 'idempotent');
  } finally {
    h.rmrf(dir);
  }
});

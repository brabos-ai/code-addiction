import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pruneObsolete } from '../src/release-copy.js';

const root = path.resolve(import.meta.dirname, '../..');
const codeadd = path.join(root, 'framwork/.codeadd');
const helpPath = path.join(codeadd, 'commands/add-help.md');
const read = (p) => fs.readFileSync(p, 'utf8');

describe('add-help command', () => {
  it('exists, and the old `add` command does not', () => {
    expect(fs.existsSync(helpPath)).toBe(true);
    expect(fs.existsSync(path.join(codeadd, 'commands/add.md'))).toBe(false);
  });

  it('names every source it answers from', () => {
    const src = read(helpPath);
    for (const source of [
      'manifest.json',
      'agent-mode/README.md',
      'codeadd --help',
      'Main Flows',
      'Command Next-Steps Routing',
      'Features',
      'Plugins',
    ]) {
      expect(src, `add-help.md names ${source}`).toContain(source);
    }
  });

  it('runs the installed binary first and npx only as the fallback', () => {
    const src = read(helpPath);
    expect(src).toContain('npx --yes codeadd --help');
    expect(src.indexOf('codeadd --help')).toBeLessThan(src.indexOf('npx --yes codeadd --help'));
  });

  it('carries no STEP id from the old namespace and none of the four stale references', () => {
    const src = read(helpPath);
    expect(src).not.toMatch(/STEP add\./);
    expect(src).toMatch(/STEP add-help\./);
    expect(src).not.toContain('/health-check');
    expect(src).not.toMatch(/(?<!add--)dev-environment-setup/);
    expect(src).not.toMatch(/classify-6|detect-3/);
    expect(src).not.toContain('.claude/commands/add-[');
  });
});

describe('add--ecosystem routing for add-help', () => {
  const eco = () => read(path.join(codeadd, 'skills/add--ecosystem/SKILL.md'));

  it('routes `codeadd update` to `/add-wiki update`', () => {
    expect(eco()).toMatch(/^\|\s*`?codeadd update`?\s*\|[^\n]*\.codeadd\/wiki\/[^\n]*\|[^\n]*`\/add-wiki update`/m);
  });

  it('names add-help, not add, in its description, command row and mention', () => {
    const src = eco();
    expect(src).toContain('Loaded by /add-help');
    expect(src).toMatch(/^\| add-help \|/m);
    expect(src).not.toMatch(/^\| add \|/m);
    expect(src).toMatch(/^- mention: \/add-help$/m);
    expect(src).not.toMatch(/^- mention: \/add$/m);
  });
});

describe('an install that had the old `add` command', () => {
  it.each([
    '.claude/commands/add.md',
    '.agents/skills/add/SKILL.md',
  ])('loses %s on update', (old) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-help-prune-'));
    try {
      fs.mkdirSync(path.dirname(path.join(dir, old)), { recursive: true });
      fs.writeFileSync(path.join(dir, old), '# add\n');
      const removed = pruneObsolete(dir, [old], new Set([old.replace(/add(\.md|\/SKILL\.md)$/, 'add-help$1')]));
      expect(removed).toBe(1);
      expect(fs.existsSync(path.join(dir, old))).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

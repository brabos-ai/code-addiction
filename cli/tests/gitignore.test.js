import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { getInstalledDirs, writeGitignoreBlock } from '../src/gitignore.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-gitignore-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// getInstalledDirs
// ---------------------------------------------------------------------------

describe('getInstalledDirs', () => {
  it('always includes the .codeadd/* pair that keeps board.json committable', () => {
    const dirs = getInstalledDirs([]);
    expect(dirs).toContain('.codeadd/*');
    expect(dirs).toContain('!.codeadd/board.json');
    expect(dirs).not.toContain('.codeadd/');
  });

  it('includes provider dest dirs for selected keys', () => {
    const dirs = getInstalledDirs(['claude', 'codex']);
    expect(dirs).toContain('.claude/');
    expect(dirs).toContain('.agents/');
  });

  it('returns only the .codeadd pair when no providers selected', () => {
    const dirs = getInstalledDirs([]);
    expect(dirs).toEqual(['.codeadd/*', '!.codeadd/board.json']);
  });

  it('includes all known providers when all are selected', () => {
    const dirs = getInstalledDirs(['claude', 'codex', 'antigrav', 'cursor']);
    expect(dirs).toContain('.codeadd/*');
    expect(dirs).toContain('.claude/');
    expect(dirs).toContain('.agents/');
    expect(dirs).toContain('.agent/');
    expect(dirs).toContain('.cursor/');
  });

  it('silently ignores unknown provider keys', () => {
    const dirs = getInstalledDirs(['unknown-provider']);
    expect(dirs).toEqual(['.codeadd/*', '!.codeadd/board.json']);
  });

  it('every provider entry has a trailing slash (the .codeadd pair is a pattern)', () => {
    const dirs = getInstalledDirs(['claude', 'codex']);
    for (const dir of dirs.filter((d) => !d.startsWith('.codeadd/') && !d.startsWith('!'))) {
      expect(dir).toMatch(/\/$/);
    }
  });

  it('deduplicates when two providers share same dest', () => {
    const dirs = getInstalledDirs(['claude', 'codex', 'antigrav']);
    // codex (.agents/) and antigrav (.agent/) are different dirs — no dedup needed
    // but if same dest were shared, Set would deduplicate
    expect(dirs).toContain('.agents/');
    expect(dirs).toContain('.agent/');
    expect(new Set(dirs).size).toBe(dirs.length);
  });
});

// ---------------------------------------------------------------------------
// writeGitignoreBlock
// ---------------------------------------------------------------------------

describe('writeGitignoreBlock', () => {
  it('creates .gitignore with ADD block when file does not exist', () => {
    writeGitignoreBlock(tmpDir, ['.codeadd/', '.claude/']);

    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(content).toContain('# ADD - managed by code-addiction');
    expect(content).toContain('.codeadd/');
    expect(content).toContain('.claude/');
    expect(content).toContain('# END ADD');
  });

  it('appends block to existing .gitignore that has no block', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\ndist/\n', 'utf8');

    writeGitignoreBlock(tmpDir, ['.codeadd/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('dist/');
    expect(content).toContain('# ADD - managed by code-addiction');
    expect(content).toContain('.codeadd/');
    expect(content).toContain('# END ADD');
  });

  it('replaces existing ADD block in-place', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(
      gitignorePath,
      'node_modules/\n# ADD - managed by code-addiction\n.codeadd/\n.claude/\n# END ADD\ndist/\n',
      'utf8'
    );

    writeGitignoreBlock(tmpDir, ['.codeadd/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    // User entries preserved
    expect(content).toContain('node_modules/');
    expect(content).toContain('dist/');
    // Block updated: .claude/ removed, .codeadd/ kept
    expect(content).toContain('.codeadd/');
    expect(content).not.toContain('.claude/');
    // Only one ADD block
    const blockCount = (content.match(/# ADD - managed by code-addiction/g) || []).length;
    expect(blockCount).toBe(1);
  });

  it('does not touch entries outside the ADD block on update', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(
      gitignorePath,
      'node_modules/\n.env\n# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n*.log\n',
      'utf8'
    );

    writeGitignoreBlock(tmpDir, ['.codeadd/', '.claude/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('.env');
    expect(content).toContain('*.log');
  });

  it('adds new provider to existing block on update', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(
      gitignorePath,
      '# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n',
      'utf8'
    );

    writeGitignoreBlock(tmpDir, ['.codeadd/', '.claude/', '.agents/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('.claude/');
    expect(content).toContain('.agents/');
  });

  it('removes provider from block when removed from installation', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(
      gitignorePath,
      '# ADD - managed by code-addiction\n.codeadd/\n.claude/\n.agents/\n# END ADD\n',
      'utf8'
    );

    writeGitignoreBlock(tmpDir, ['.codeadd/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).not.toContain('.claude/');
    expect(content).not.toContain('.agents/');
    expect(content).toContain('.codeadd/');
  });

  it('file ends with newline after write', () => {
    writeGitignoreBlock(tmpDir, ['.codeadd/']);
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('does not add blank line prefix when .gitignore is empty', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '', 'utf8');

    writeGitignoreBlock(tmpDir, ['.codeadd/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content.startsWith('# ADD')).toBe(true);
  });

  it('block structure is correct: START, dirs, END in order', () => {
    writeGitignoreBlock(tmpDir, ['.codeadd/', '.claude/']);
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');

    const startIdx = content.indexOf('# ADD - managed by code-addiction');
    const endIdx = content.indexOf('# END ADD');
    const codeaddIdx = content.indexOf('.codeadd/');
    const claudeIdx = content.indexOf('.claude/');

    expect(startIdx).toBeLessThan(codeaddIdx);
    expect(codeaddIdx).toBeLessThan(claudeIdx);
    expect(claudeIdx).toBeLessThan(endIdx);
  });

  it('installer block replacement preserves the separate QA evidence block', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    const qaBlock = '# ADD QA evidence - managed by add-qa-setup\ndocs/features/**/_tests/run-*/\n# END ADD QA evidence\n';
    fs.writeFileSync(
      gitignorePath,
      `node_modules/\n# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n\n${qaBlock}`,
      'utf8'
    );

    writeGitignoreBlock(tmpDir, ['.codeadd/', '.claude/']);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('.claude/');
    expect(content).toContain(qaBlock.trim());
    expect((content.match(/# ADD QA evidence - managed by add-qa-setup/g) || [])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// F7 — board.json is the one tracked file under .codeadd/
// ---------------------------------------------------------------------------

describe('the .codeadd pair (board.json stays committable)', () => {
  const gitIgnored = (cwd, rel) => spawnSync('git', ['check-ignore', '-q', rel], { cwd }).status === 0;

  it('writes the pair in place of .codeadd/, and git agrees', () => {
    spawnSync('git', ['init', '-q'], { cwd: tmpDir });
    writeGitignoreBlock(tmpDir, getInstalledDirs(['claude']));
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(content).toContain('.codeadd/*\n!.codeadd/board.json');
    expect(content.split('\n')).not.toContain('.codeadd/');
    fs.mkdirSync(path.join(tmpDir, '.codeadd'));
    expect(gitIgnored(tmpDir, '.codeadd/board.json')).toBe(false);
    expect(gitIgnored(tmpDir, '.codeadd/manifest.json')).toBe(true);
  });

  it('rewrites an existing bare .codeadd/ line outside the block into the pair, once', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n.codeadd/\ndist/\n', 'utf8');
    writeGitignoreBlock(tmpDir, getInstalledDirs([]));
    writeGitignoreBlock(tmpDir, getInstalledDirs([]));
    const lines = fs.readFileSync(gitignorePath, 'utf8').split('\n');
    expect(lines).not.toContain('.codeadd/');
    expect(lines.filter((l) => l === '.codeadd/*')).toHaveLength(1);
    expect(lines.filter((l) => l === '!.codeadd/board.json')).toHaveLength(1);
    expect(lines).toContain('node_modules/');
    expect(lines).toContain('dist/');
  });

  it('an old block that held .codeadd/ is replaced by the pair', () => {
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '# ADD - managed by code-addiction\n.codeadd/\n.claude/\n# END ADD\n', 'utf8');
    writeGitignoreBlock(tmpDir, getInstalledDirs(['claude']));
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('.codeadd/*\n!.codeadd/board.json\n.claude/');
    expect(content.split('\n')).not.toContain('.codeadd/');
  });
});

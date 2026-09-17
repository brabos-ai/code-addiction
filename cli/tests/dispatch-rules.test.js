import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The shared dispatch rule every dispatching product command points at.
 *
 * A model that fills every optional field of its engine's task tool passed an
 * invented id into the resume field on a fresh dispatch, and the dispatch was
 * rejected. The rule lives once, names no provider, and every command that
 * dispatches a subagent must reach it — including a command added later.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const COMMANDS_DIR = path.join(ROOT, 'framwork', '.codeadd', 'commands');
const REF_REL = 'add-subagent-driven-development/references/dispatch-rules.md';
const REF_PATH = path.join(ROOT, 'framwork', '.codeadd', 'skills', ...REF_REL.split('/'));

function dispatchingCommands() {
  return fs
    .readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /\bDISPATCH\b/.test(fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf8')));
}

function usesBlock(src) {
  const m = src.match(/<!-- uses:([\s\S]*?)-->/);
  return m ? m[1] : '';
}

describe('dispatch-rules reference', () => {
  it('exists and states that a fresh dispatch leaves resume and session fields empty', () => {
    expect(fs.existsSync(REF_PATH), `missing ${REF_REL}`).toBe(true);
    const text = fs.readFileSync(REF_PATH, 'utf8').toLowerCase();
    expect(text).toContain('resume');
    expect(text).toContain('session');
    expect(text, 'must say only an id returned by an earlier dispatch may be passed').toContain('earlier dispatch');
  });

  it('names no provider and no provider-specific parameter', () => {
    expect(fs.existsSync(REF_PATH), `missing ${REF_REL}`).toBe(true);
    const text = fs.readFileSync(REF_PATH, 'utf8').toLowerCase();
    for (const banned of ['opencode', 'claude', 'codex', 'cursor', 'antigravity', 'ses_', 'task_id']) {
      expect(text, `reference must not name ${banned}`).not.toContain(banned);
    }
  });
});

describe('every dispatching command reaches the rule', () => {
  const commands = dispatchingCommands();

  it('finds the dispatching commands', () => {
    expect(commands.sort()).toEqual([
      'add.audit.md',
      'add.build.md',
      'add.diagnose.md',
      'add.hotfix.md',
      'add.new.md',
      'add.plan.md',
      'add.review.md',
      'add.wiki.md',
    ]);
  });

  for (const cmd of commands) {
    it(`${cmd} points at the reference and declares it`, () => {
      const src = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf8');
      expect(src).toContain(`{{skill:${REF_REL}}}`);
      expect(usesBlock(src)).toContain(`- skill: ${REF_REL}`);
    });
  }
});

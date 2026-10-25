import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ticket 0009B — scripts-via-file.
 * Validation Matrix L1: long content goes to a file, never into an inline heredoc.
 *
 * Every row was written RED against the pre-plan tree, except L1.6, which is a
 * drift guard: it is green before and after the change by design.
 *
 * Reads files from disk only. Nothing here writes into the checkout.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const WORKBENCH = path.join(ROOT, 'workbench');

const read = (p) => fs.readFileSync(p, 'utf8');

const RULE_TOKEN = '.codeadd/.temp/<random-slug>.<ext>';
const HEREDOC_OPENER = /<<'?EOF/;

const ADD_PULL_REQUEST = read(path.join(CODEADD, 'commands', 'add-pull-request.md'));
const ADD_BUILD = read(path.join(CODEADD, 'commands', 'add-build.md'));
const ADD_WIKI = read(path.join(CODEADD, 'commands', 'add-wiki.md'));
const AGENTS_MD_STYLE = read(path.join(CODEADD, 'skills', 'add--agents-md-style', 'SKILL.md'));
const FRAMEWORK_BUILD = read(path.join(WORKBENCH, 'skills', 'add-framework--build', 'SKILL.md'));
const BUILDING_COMMANDS = read(path.join(WORKBENCH, 'skills', 'building-commands', 'SKILL.md'));
const AGENTS_MD = read(path.join(ROOT, 'AGENTS.md'));

function walkMarkdown(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/**
 * Body of the section opened by `heading`, up to the next heading of the same
 * or a higher level, outside code fences: the publish-update section holds
 * headings and a thematic break inside its own fenced template. The heading is
 * matched at the start of a line so prose that quotes it never opens the range.
 */
function section(source, heading) {
  const lines = source.split('\n');
  const from = lines.findIndex((l) => l.startsWith(heading));
  if (from === -1) return null;
  const level = heading.match(/^#+/)[0].length;
  let to = lines.length;
  let fenced = false;
  for (let i = from + 1; i < lines.length; i++) {
    if (lines[i].startsWith('```')) fenced = !fenced;
    if (fenced) continue;
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) {
      to = i;
      break;
    }
  }
  return lines.slice(from, to).join('\n');
}

/** Lines strictly between two whole-line markers, blank lines included. */
function linesBetween(source, startMarker, endMarker) {
  const lines = source.split('\n').map((l) => l.replace(/\s+$/, ''));
  const from = lines.indexOf(startMarker);
  if (from === -1) return null;
  const to = lines.indexOf(endMarker, from);
  if (to === -1) return null;
  return lines.slice(from + 1, to);
}

const SHELL_START = '[//]: # (codeadd-shell:start)';
const SHELL_END = '[//]: # (codeadd-shell:end)';

describe('L1 — scripts-via-file guard', () => {
  it('L1.1 no .md under framwork/.codeadd or workbench carries a heredoc opener', () => {
    const offenders = [];
    for (const dir of [CODEADD, WORKBENCH]) {
      for (const file of walkMarkdown(dir)) {
        read(file)
          .split('\n')
          .forEach((line, i) => {
            if (HEREDOC_OPENER.test(line)) {
              offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
            }
          });
      }
    }
    expect(offenders).toEqual([]);
  });

  it('L1.2 publish-create writes the body to a temp file and passes --body-file', () => {
    const body = section(ADD_PULL_REQUEST, '### STEP add-pull-request.publish-create');
    expect(body).not.toBeNull();
    expect(body).toContain('--body-file');
    expect(body).toContain('.codeadd/.temp/');
    expect(body).not.toContain('--body "$(');
  });

  it('L1.3 publish-update does the same and keeps title-never-modified and append-only', () => {
    const body = section(ADD_PULL_REQUEST, '### STEP add-pull-request.publish-update');
    expect(body).not.toBeNull();
    expect(body).toContain('--body-file');
    expect(body).toContain('.codeadd/.temp/');
    expect(body).not.toContain('--body "$(');
    expect(body).toContain('Title is **never** modified');
    expect(body).toContain('append-only');
  });

  it('L1.4 add-build publish row says --body-file, points at add-pull-request, and declares it', () => {
    const row = ADD_BUILD.split('\n').find((l) => l.startsWith('| Otherwise, the user says yes'));
    expect(row).toBeDefined();
    expect(row).toContain('--body-file');
    expect(row).toContain('add-pull-request');
    const uses = ADD_BUILD.slice(ADD_BUILD.indexOf('<!-- uses:'), ADD_BUILD.indexOf('-->'));
    expect(uses).toContain('- command: /add-pull-request');
  });

  it('L1.5 the codeadd-shell block carries the rule and keeps the agent-mode pointer', () => {
    const block = linesBetween(ADD_WIKI, SHELL_START, SHELL_END);
    expect(block).not.toBeNull();
    const text = block.join('\n');
    expect(text).toContain(RULE_TOKEN);
    expect(text).toContain('.codeadd/agent-mode/README.md');
  });

  it('L1.6 DRIFT GUARD (green before and after): add--agents-md-style states the block line count', () => {
    const block = linesBetween(ADD_WIKI, SHELL_START, SHELL_END);
    expect(block).not.toBeNull();
    const m = AGENTS_MD_STYLE.match(/The Runtime policy managed block adds (\d+) more\./);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBe(block.length);
  });

  it('L1.7 add-framework--build publish row says --body-file', () => {
    const row = FRAMEWORK_BUILD.split('\n').find((l) => l.startsWith('| Yes | `git push -u origin <branch>`'));
    expect(row).toBeDefined();
    expect(row).toContain('--body-file');
  });

  it('L1.8 building-commands "Intent Over Script" and AGENTS.md both carry the rule', () => {
    const authoring = section(BUILDING_COMMANDS, '## Command Blocks: Intent Over Script');
    expect(authoring).not.toBeNull();
    expect(authoring).toContain(RULE_TOKEN);
    expect(AGENTS_MD).toContain(RULE_TOKEN);
  });
});

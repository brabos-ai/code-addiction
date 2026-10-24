import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 0061B — add--ux-design ships its design core and nothing else.
 * Reads the source tree only and writes nothing. It never spells a removed
 * filename, so the repository-wide grep for those names stays empty.
 *
 * If a later card adds a file to add--ux-design/, update CORE_FILES in the same commit.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const SKILL_DIR = path.join(CODEADD, 'skills', 'add--ux-design');

const CORE_FILES = [
  'SKILL.md',
  'critique-rubric.md',
  'design-contract.md',
  'design-direction.md',
  'modern-patterns.md',
  'saas-patterns.md',
  'ux-laws-principles.md',
  'ux-writing.md',
];

const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

function walkMarkdown(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Text from the first line containing `startMarker` up to the next line starting with `endPrefix`.
function sectionFrom(text, startMarker, endPrefix) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.includes(startMarker));
  expect(start, `marker not found: ${startMarker}`).toBeGreaterThanOrEqual(0);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith(endPrefix)) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

describe('add--ux-design keeps only its design core', () => {
  it('holds exactly the eight design-core files', () => {
    expect(fs.readdirSync(SKILL_DIR).sort()).toEqual([...CORE_FILES].sort());
  });

  it('every {{skill:add--ux-design/<file>}} token points at a file that exists', () => {
    const missing = [];
    const token = /\{\{skill:add--ux-design\/([^}\s]+)\}\}/g;
    for (const file of walkMarkdown(CODEADD)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(token)) {
        if (!fs.existsSync(path.join(SKILL_DIR, match[1]))) {
          missing.push(`${path.relative(ROOT, file)} -> ${match[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('no bundled library-doc filename is named in the skill, the layout agent or the two commands', () => {
    const files = [
      'framwork/.codeadd/skills/add--ux-design/SKILL.md',
      'framwork/.codeadd/agents/ux-layout-agent.md',
      'framwork/.codeadd/commands/add-ux.md',
      'framwork/.codeadd/commands/add-build.md',
    ];
    for (const file of files) {
      const hits = read(...file.split('/')).match(/[a-z0-9-]+-docs\.md/g) ?? [];
      expect(hits, file).toEqual([]);
    }
  });

  it('component and library APIs point at the project own conventions', () => {
    const layout = read('framwork', '.codeadd', 'agents', 'ux-layout-agent.md');
    expect(layout).toContain('wiki/conventions.md');
    expect(layout).toContain('design-context.md');

    const addUx = sectionFrom(
      read('framwork', '.codeadd', 'commands', 'add-ux.md'),
      '## STEP add-ux.docs',
      '## STEP',
    );
    expect(addUx).toContain('wiki/conventions.md');
    expect(addUx).toContain('AGENTS.md');

    const addBuild = sectionFrom(
      read('framwork', '.codeadd', 'commands', 'add-build.md'),
      '## MANDATORY: Load Development Skill',
      '## ',
    );
    expect(addBuild).toContain('wiki/conventions.md');
    expect(addBuild).toContain('AGENTS.md');
  });

  it('ecosystem index and docs page describe add--ux-design the same way, without a library name', () => {
    const ecosystem = read('framwork', '.codeadd', 'skills', 'add--ecosystem', 'SKILL.md');
    const row = ecosystem.split('\n').find((line) => line.startsWith('| add--ux-design |'));
    expect(row, 'ecosystem row').toBeDefined();
    const ecosystemDesc = row.split('|')[2].trim();

    const docs = read('web', 'src', 'pages', 'docs.astro');
    const entry = docs.match(/\{ name: "ux-design", desc: "([^"]*)"/);
    expect(entry, 'docs.astro entry').not.toBeNull();

    expect(entry[1]).toBe(ecosystemDesc);
    expect(ecosystemDesc.toLowerCase()).not.toContain('shadcn');
    expect(entry[1].toLowerCase()).not.toContain('shadcn');
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'framwork/provider-map.json'), 'utf8'));
const graph = JSON.parse(fs.readFileSync(path.join(root, 'framwork/.codeadd/artefact-graph.json'), 'utf8'));

describe('product resource names — RED against the old namespace', () => {
  it('assigns one hyphen to commands and two to skills, leaving root add intact', () => {
    expect(Object.keys(map.commands)).toContain('add');
    for (const name of Object.keys(map.commands).filter((n) => n !== 'add')) {
      expect(name).toMatch(/^add-[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(fs.existsSync(path.join(root, `framwork/.codeadd/commands/${name}.md`))).toBe(true);
    }
    for (const name of Object.keys(map.skills)) {
      expect(name).toMatch(/^add--[a-z0-9]+(?:-[a-z0-9]+)*$/);
      const file = path.join(root, `framwork/.codeadd/skills/${name}/SKILL.md`);
      expect(fs.readFileSync(file, 'utf8')).toMatch(new RegExp(`^name: ${name}$`, 'm'));
    }
  });

  it('builds logical names for each provider, including commands-as-skills', () => {
    expect(Object.keys(map.providers)).toHaveLength(6);
    for (const provider of Object.values(map.providers)) {
      for (const [kind, name] of [['commands', 'add-new'], ['skills', 'add--commit']]) {
        const rel = provider[kind].replace('{name}', name);
        expect(fs.existsSync(path.join(root, provider.dir, rel))).toBe(true);
      }
    }
  });

  it('emits new graph nodes and retains handoff, skill and fragment relations', () => {
    const nodes = graph.nodes;
    const find = (id) => nodes.find((n) => n.id === id);
    expect(find('product/command/add.new')).toBeUndefined();
    expect(find('product/skill/add-commit')).toBeUndefined();
    expect(find('product/command/add-new')).toBeDefined();
    expect(find('product/skill/add--commit')).toBeDefined();
    expect(find('product/skill/add--gitnexus')).toBeDefined();
    const edges = graph.edges;
    expect(edges.some((e) => e.from === 'product/command/add' && e.to === 'product/command/add-new' && e.type === 'HANDS_OFF_TO')).toBe(true);
    expect(edges.some((e) => e.from === 'product/command/add-build' && e.to === 'product/skill/add--commit' && e.type === 'USES_SKILL')).toBe(true);
    expect(edges.some((e) => e.to === 'product/command/add-plan' && e.type === 'INJECTS_INTO')).toBe(true);
  });
});

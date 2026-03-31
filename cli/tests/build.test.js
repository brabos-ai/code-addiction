import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { stripHtmlComments, escapeTomlString, TRANSFORMERS, METADATA, buildAgents, buildResources, readMap } = require('../../scripts/build.js');

// ---------------------------------------------------------------------------
// stripHtmlComments
// ---------------------------------------------------------------------------

describe('stripHtmlComments', () => {
  it('removes a single-line comment', () => {
    expect(stripHtmlComments('before <!-- comment --> after'))
      .toBe('before  after');
  });

  it('removes a multi-line comment', () => {
    const input = 'before\n<!-- multi\nline\ncomment -->\nafter';
    expect(stripHtmlComments(input)).toBe('before\n\nafter');
  });

  it('removes multiple comments', () => {
    const input = '<!-- a -->hello<!-- b -->world<!-- c -->';
    expect(stripHtmlComments(input)).toBe('helloworld');
  });

  it('removes AUTO-GENERATED header', () => {
    const input = '<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add.md -->\nContent';
    expect(stripHtmlComments(input)).toBe('Content');
  });

  it('removes feature markers', () => {
    const input = '<!-- feature:tdd:step -->injected content<!-- /feature:tdd:step -->';
    expect(stripHtmlComments(input)).toBe('injected content');
  });

  it('collapses triple+ newlines to double', () => {
    const input = 'a\n\n\n\n\nb';
    expect(stripHtmlComments(input)).toBe('a\n\nb');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtmlComments('  \n\ncontent\n\n  ')).toBe('content');
  });

  it('preserves markdown code blocks with angle brackets', () => {
    const input = 'text\n```html\n<div>not a comment</div>\n```\nmore';
    expect(stripHtmlComments(input)).toBe(input);
  });

  it('returns empty string for comment-only content', () => {
    expect(stripHtmlComments('<!-- only comment -->')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// escapeTomlString
// ---------------------------------------------------------------------------

describe('escapeTomlString', () => {
  it('escapes double quotes', () => {
    expect(escapeTomlString('say "hello"')).toBe('say \\"hello\\"');
  });

  it('escapes backslashes', () => {
    expect(escapeTomlString('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('escapes newlines and tabs', () => {
    expect(escapeTomlString('line1\nline2\ttab')).toBe('line1\\nline2\\ttab');
  });

  it('handles combined special chars', () => {
    expect(escapeTomlString('"a\\b\n"')).toBe('\\"a\\\\b\\n\\"');
  });

  it('passes through normal strings unchanged', () => {
    expect(escapeTomlString('simple text')).toBe('simple text');
  });
});

// ---------------------------------------------------------------------------
// METADATA generators
// ---------------------------------------------------------------------------

describe('METADATA', () => {
  describe('mdFrontmatter', () => {
    it('generates command frontmatter (no name)', () => {
      const result = METADATA.mdFrontmatter({ name: 'add', description: 'Gateway', skillFormat: false });
      expect(result).toBe('---\ndescription: Gateway\n---\n\n');
    });

    it('generates skill frontmatter (with name)', () => {
      const result = METADATA.mdFrontmatter({ name: 'add', description: 'Gateway', skillFormat: true });
      expect(result).toBe('---\nname: add\ndescription: Gateway\n---\n\n');
    });
  });

  describe('tomlHeader', () => {
    it('generates TOML comment with source path', () => {
      const result = METADATA.tomlHeader({ name: 'add.plan' });
      expect(result).toBe('# AUTO-GENERATED - source: framwork/.codeadd/commands/add.plan.md\n');
    });
  });
});

// ---------------------------------------------------------------------------
// TRANSFORMERS
// ---------------------------------------------------------------------------

describe('TRANSFORMERS', () => {
  describe('md', () => {
    it('adds frontmatter with description', () => {
      const result = TRANSFORMERS.md('# Hello', { name: 'add.test', description: 'Test cmd', skillFormat: false });
      expect(result).toBe('---\ndescription: Test cmd\n---\n\n# Hello');
    });

    it('adds skill frontmatter when skillFormat is true', () => {
      const result = TRANSFORMERS.md('# Hello', { name: 'add.test', description: 'Test cmd', skillFormat: true });
      expect(result).toBe('---\nname: add.test\ndescription: Test cmd\n---\n\n# Hello');
    });
  });

  describe('toml', () => {
    it('wraps content in TOML prompt heredoc', () => {
      const result = TRANSFORMERS.toml('# My Command\n\nDo things.', {
        name: 'add.plan',
        description: 'Technical planning',
      });

      expect(result).toContain('description = "Technical planning"');
      expect(result).toContain('prompt = """');
      expect(result).toContain('# My Command\n\nDo things.');
      expect(result).toContain('"""');
    });

    it('includes AUTO-GENERATED comment as TOML comment', () => {
      const result = TRANSFORMERS.toml('content', { name: 'add', description: 'desc' });
      expect(result).toMatch(/^# AUTO-GENERATED/);
    });

    it('escapes description with special chars', () => {
      const result = TRANSFORMERS.toml('content', {
        name: 'add',
        description: 'Uses "quotes" and \\backslash',
      });
      expect(result).toContain('description = "Uses \\"quotes\\" and \\\\backslash"');
    });

    it('preserves multi-line markdown content inside heredoc', () => {
      const content = '# Title\n\n## Section\n\n- item 1\n- item 2\n\n```js\ncode();\n```';
      const result = TRANSFORMERS.toml(content, { name: 'add', description: 'test' });

      const promptStart = result.indexOf('prompt = """\n') + 'prompt = """\n'.length;
      const promptEnd = result.lastIndexOf('\n"""');
      const extracted = result.slice(promptStart, promptEnd);
      expect(extracted).toBe(content);
    });

    it('delegates header to METADATA.tomlHeader', () => {
      const result = TRANSFORMERS.toml('content', { name: 'add.build', description: 'desc' });
      expect(result).toContain(METADATA.tomlHeader({ name: 'add.build' }));
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: full pipeline on a realistic command
// ---------------------------------------------------------------------------

describe('full pipeline', () => {
  it('strips comments then transforms to TOML', () => {
    const source = [
      '<!-- AUTO-GENERATED - DO NOT EDIT -->',
      '# Add Plan',
      '',
      '<!-- feature:tdd:step-list -->',
      '<!-- /feature:tdd:step-list -->',
      '',
      'Plan your features.',
      '',
      '<!-- internal note -->',
    ].join('\n');

    const cleaned = stripHtmlComments(source);
    expect(cleaned).not.toContain('<!--');
    expect(cleaned).toContain('# Add Plan');
    expect(cleaned).toContain('Plan your features.');

    const toml = TRANSFORMERS.toml(cleaned, { name: 'add.plan', description: 'Planning' });
    expect(toml).toContain('description = "Planning"');
    expect(toml).toContain('prompt = """');
    expect(toml).not.toContain('<!--');
  });

  it('strips comments then transforms to MD', () => {
    const source = '<!-- AUTO-GENERATED -->\n# Hello\n\n<!-- comment -->\nWorld';
    const cleaned = stripHtmlComments(source);
    const md = TRANSFORMERS.md(cleaned, { name: 'add', description: 'Gateway', skillFormat: false });

    expect(md).toContain('---\ndescription: Gateway\n---');
    expect(md).toContain('# Hello');
    expect(md).toContain('World');
    expect(md).not.toContain('<!--');
  });
});

// ---------------------------------------------------------------------------
// provider-map.json: capabilities field validation
// ---------------------------------------------------------------------------

describe('provider-map.json capabilities', () => {
  const mapPath = path.resolve(import.meta.dirname, '..', '..', 'framwork', 'provider-map.json');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  it('every provider has a capabilities object', () => {
    for (const [key, p] of Object.entries(map.providers)) {
      expect(p, `provider ${key} missing capabilities`).toHaveProperty('capabilities');
    }
  });

  it('capabilities has all required fields', () => {
    const requiredFields = ['hooks', 'agentDispatch', 'mcp', 'nativeFormat', 'slashCommands'];
    for (const [key, p] of Object.entries(map.providers)) {
      for (const field of requiredFields) {
        expect(p.capabilities, `provider ${key} missing capabilities.${field}`).toHaveProperty(field);
      }
    }
  });

  it('nativeFormat is a known transformer key', () => {
    const knownFormats = Object.keys(TRANSFORMERS);
    for (const [key, p] of Object.entries(map.providers)) {
      expect(knownFormats, `provider ${key} has unknown format "${p.capabilities.nativeFormat}"`)
        .toContain(p.capabilities.nativeFormat);
    }
  });

  it('gemini uses toml nativeFormat', () => {
    expect(map.providers.gemini.capabilities.nativeFormat).toBe('toml');
    expect(map.providers.gemini.commands).toContain('.toml');
  });

  it('claude has all capabilities enabled', () => {
    const caps = map.providers.claude.capabilities;
    expect(caps.hooks).toBe(true);
    expect(caps.agentDispatch).toBe(true);
    expect(caps.mcp).toBe(true);
    expect(caps.slashCommands).toBe(true);
  });

  it('claude provider has agents pattern', () => {
    expect(map.providers.claude).toHaveProperty('agents');
    expect(map.providers.claude.agents).toBe('agents/{name}.md');
  });

  it('providers without agents pattern are skipped by agentStrategy', () => {
    for (const [key, p] of Object.entries(map.providers)) {
      if (key === 'claude') continue;
      expect(p.agents, `provider ${key} should NOT have agents pattern`).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// provider-map.json: agents section
// ---------------------------------------------------------------------------

describe('provider-map.json agents section', () => {
  const mapPath = path.resolve(import.meta.dirname, '..', '..', 'framwork', 'provider-map.json');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  const expectedAgents = [
    'ux-agent',
    'backend-agent',
    'frontend-agent',
    'reviewer-agent',
    'discovery-agent',
    'architecture-agent',
    'system-design-agent',
    'database-agent',
  ];

  it('has agents section', () => {
    expect(map).toHaveProperty('agents');
    expect(typeof map.agents).toBe('object');
  });

  it('contains all 8 expected agents', () => {
    const agentNames = Object.keys(map.agents);
    for (const name of expectedAgents) {
      expect(agentNames, `missing agent: ${name}`).toContain(name);
    }
    expect(agentNames).toHaveLength(8);
  });

  it('every agent has a description', () => {
    for (const [name, entry] of Object.entries(map.agents)) {
      expect(entry, `agent ${name} missing description`).toHaveProperty('description');
      expect(entry.description.length, `agent ${name} description is empty`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Agent source files: frontmatter validation
// ---------------------------------------------------------------------------

describe('agent source files', () => {
  const agentsDir = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd', 'agents');

  const expectedAgents = [
    'ux-agent',
    'backend-agent',
    'frontend-agent',
    'reviewer-agent',
    'discovery-agent',
    'architecture-agent',
    'system-design-agent',
    'database-agent',
  ];

  it('all agent source files exist', () => {
    for (const name of expectedAgents) {
      const filePath = path.join(agentsDir, `${name}.md`);
      expect(fs.existsSync(filePath), `missing agent source: ${name}.md`).toBe(true);
    }
  });

  for (const name of [
    'ux-agent',
    'backend-agent',
    'frontend-agent',
    'reviewer-agent',
    'discovery-agent',
    'architecture-agent',
    'system-design-agent',
    'database-agent',
  ]) {
    describe(`${name}`, () => {
      const filePath = path.join(agentsDir, `${name}.md`);
      const content = fs.readFileSync(filePath, 'utf8');

      it('has YAML frontmatter', () => {
        expect(content).toMatch(/^---\n/);
        expect(content.indexOf('---', 3)).toBeGreaterThan(3);
      });

      it('has name field matching filename', () => {
        const match = content.match(/^name:\s*(.+)$/m);
        expect(match, 'missing name field').not.toBeNull();
        expect(match[1].trim()).toBe(name);
      });

      it('has description field', () => {
        expect(content).toMatch(/^description:\s*.+$/m);
      });

      it('has model field', () => {
        expect(content).toMatch(/^model:\s*(sonnet|opus|haiku|inherit)/m);
      });

      it('has memory: project', () => {
        expect(content).toMatch(/^memory:\s*project$/m);
      });

      it('has "leaf agent" constraint in body', () => {
        expect(content).toContain('do NOT dispatch other agents');
      });
    });
  }

  it('read-only agents use disallowedTools', () => {
    const readOnlyAgents = ['reviewer-agent', 'discovery-agent', 'architecture-agent'];
    for (const name of readOnlyAgents) {
      const content = fs.readFileSync(path.join(agentsDir, `${name}.md`), 'utf8');
      expect(content, `${name} should have disallowedTools`).toMatch(/^disallowedTools:/m);
      expect(content, `${name} should disallow Write`).toContain('Write');
      expect(content, `${name} should disallow Edit`).toContain('Edit');
    }
  });

  it('implementation agents have skills preloaded', () => {
    const agentsWithSkills = {
      'ux-agent': ['add-ux-design'],
      'backend-agent': ['add-backend-development', 'add-database-development'],
      'frontend-agent': ['add-frontend-development'],
      'reviewer-agent': ['add-code-review', 'add-security-audit'],
      'discovery-agent': ['add-feature-discovery', 'add-feature-specification'],
      'architecture-agent': ['add-architecture-discovery', 'add-backend-architecture', 'add-frontend-architecture'],
      'database-agent': ['add-database-development'],
    };

    for (const [name, skills] of Object.entries(agentsWithSkills)) {
      const content = fs.readFileSync(path.join(agentsDir, `${name}.md`), 'utf8');
      for (const skill of skills) {
        expect(content, `${name} should reference skill ${skill}`).toContain(skill);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// buildAgents: passthrough transform
// ---------------------------------------------------------------------------

describe('buildAgents', () => {
  const map = readMap();
  const builtDir = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.claude', 'agents');

  it('builds agent files to .claude/agents/', () => {
    const count = buildAgents(map);
    expect(count).toBe(8);
  });

  it('built files preserve original frontmatter (passthrough)', () => {
    const sourcePath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd', 'agents', 'reviewer-agent.md');
    const builtPath = path.join(builtDir, 'reviewer-agent.md');

    const source = fs.readFileSync(sourcePath, 'utf8');
    const built = fs.readFileSync(builtPath, 'utf8');

    // Passthrough means content is identical (only HTML comments stripped)
    expect(built).toContain('name: reviewer-agent');
    expect(built).toContain('model: sonnet');
    expect(built).toContain('disallowedTools: Write, Edit, NotebookEdit');
    expect(built).toContain('memory: project');
    // Should NOT have the md transformer's frontmatter wrapper
    expect(built).not.toMatch(/^---\ndescription:/);
  });

  it('does not build agents for providers without agents pattern', () => {
    const geminiAgentsDir = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.gemini', 'agents');
    expect(fs.existsSync(geminiAgentsDir)).toBe(false);
  });

  it('handles missing agents section gracefully', () => {
    const mapWithoutAgents = { ...map };
    delete mapWithoutAgents.agents;
    const count = buildAgents(mapWithoutAgents);
    expect(count).toBe(0);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const {
  stripHtmlComments,
  escapeTomlString,
  resolveResourcePaths,
  lintResourcePaths,
  copyDirRecursive,
  _resetLintCache,
  TRANSFORMERS,
  METADATA,
  buildAgents,
  readMap,
} = require('../../scripts/build.js');

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
    'doc-reviewer-agent',
    'feature-history-agent',
    'git-history-agent',
  ];

  it('has agents section', () => {
    expect(map).toHaveProperty('agents');
    expect(typeof map.agents).toBe('object');
  });

  it('contains all 11 expected agents', () => {
    const agentNames = Object.keys(map.agents);
    for (const name of expectedAgents) {
      expect(agentNames, `missing agent: ${name}`).toContain(name);
    }
    expect(agentNames).toHaveLength(11);
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
    'doc-reviewer-agent',
    'feature-history-agent',
    'git-history-agent',
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
    expect(count).toBe(11);
  });

  it('built files preserve original frontmatter (passthrough)', () => {
    const sourcePath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd', 'agents', 'reviewer-agent.md');
    const builtPath = path.join(builtDir, 'reviewer-agent.md');

    const source = fs.readFileSync(sourcePath, 'utf8');
    const built = fs.readFileSync(builtPath, 'utf8');

    // Passthrough means content is identical (only HTML comments stripped)
    expect(built).toContain('name: reviewer-agent');
    expect(built).toContain('model: sonnet');
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

// ---------------------------------------------------------------------------
// resolveResourcePaths: variable resolution per provider
// ---------------------------------------------------------------------------

describe('resolveResourcePaths', () => {
  const claudeProvider = {
    dir: 'framwork/.claude',
    commands: 'commands/{name}.md',
    skills: 'skills/{name}/SKILL.md',
  };
  const geminiProvider = {
    dir: 'framwork/.gemini',
    commands: 'commands/{name}.toml',
    skills: 'skills/{name}/SKILL.md',
  };

  it('resolves {{cmd:NAME}} to provider-specific command path', () => {
    expect(resolveResourcePaths('See {{cmd:add.plan}}', claudeProvider))
      .toBe('See .claude/commands/add.plan.md');
    expect(resolveResourcePaths('See {{cmd:add.plan}}', geminiProvider))
      .toBe('See .gemini/commands/add.plan.toml');
  });

  it('resolves {{skill:NAME/FILE}} to provider-specific skill path', () => {
    expect(resolveResourcePaths('Read {{skill:add-foo/SKILL.md}}', claudeProvider))
      .toBe('Read .claude/skills/add-foo/SKILL.md');
  });

  it('resolves {{skill:NAME/SUBFILE}} for non-SKILL.md files', () => {
    expect(resolveResourcePaths('Grep {{skill:add-ux-design/shadcn-docs.md}}', claudeProvider))
      .toBe('Grep .claude/skills/add-ux-design/shadcn-docs.md');
  });

  it('resolves {{addpath:X}} to literal .codeadd/X regardless of provider', () => {
    expect(resolveResourcePaths('{{addpath:skills/project-patterns/backend.md}}', claudeProvider))
      .toBe('.codeadd/skills/project-patterns/backend.md');
    expect(resolveResourcePaths('{{addpath:skills/project-patterns/backend.md}}', geminiProvider))
      .toBe('.codeadd/skills/project-patterns/backend.md');
    expect(resolveResourcePaths('{{addpath:manifest.json}}', claudeProvider))
      .toBe('.codeadd/manifest.json');
  });

  it('resolves multiple variables in one string', () => {
    const input = '{{cmd:add.plan}} loads {{skill:add-foo/SKILL.md}} writes {{addpath:scripts/x.sh}}';
    expect(resolveResourcePaths(input, claudeProvider))
      .toBe('.claude/commands/add.plan.md loads .claude/skills/add-foo/SKILL.md writes .codeadd/scripts/x.sh');
  });

  it('leaves unknown variables intact', () => {
    expect(resolveResourcePaths('value {{unknown:foo}} stays', claudeProvider))
      .toBe('value {{unknown:foo}} stays');
  });

  it('strips framwork/ prefix from provider.dir', () => {
    // provider.dir starts with framwork/ but resolved paths must not include it
    expect(resolveResourcePaths('{{cmd:x}}', claudeProvider)).not.toContain('framwork/');
  });
});

// ---------------------------------------------------------------------------
// lintResourcePaths: warning emission and dedup
// ---------------------------------------------------------------------------

describe('lintResourcePaths', () => {
  let warnSpy;

  beforeEach(() => {
    _resetLintCache();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns on raw .codeadd/commands/ reference', () => {
    lintResourcePaths('see .codeadd/commands/add.plan.md', '/fake/file.md');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/raw \.codeadd\/commands\//);
  });

  it('warns on raw .codeadd/skills/ reference', () => {
    lintResourcePaths('see .codeadd/skills/foo/SKILL.md', '/fake/file.md');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/raw \.codeadd\/skills\//);
  });

  it('ignores raw paths inside fenced code blocks', () => {
    const content = [
      '```',
      '.codeadd/skills/foo/SKILL.md',
      '.codeadd/commands/bar.md',
      '```',
      'plain text after',
    ].join('\n');
    lintResourcePaths(content, '/fake/file.md');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not lint the resource-path-convention skill itself', () => {
    lintResourcePaths(
      '.codeadd/commands/x.md and .codeadd/skills/y/z.md',
      '/path/add-resource-path-convention/SKILL.md',
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('dedups: same source path linted multiple times emits warnings only once', () => {
    const content = '.codeadd/skills/foo/SKILL.md';
    lintResourcePaths(content, '/fake/dupe.md');
    lintResourcePaths(content, '/fake/dupe.md');
    lintResourcePaths(content, '/fake/dupe.md');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('different source paths produce independent warnings', () => {
    lintResourcePaths('.codeadd/skills/a.md', '/fake/a.md');
    lintResourcePaths('.codeadd/skills/b.md', '/fake/b.md');
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('emits both warnings if a line has both raw patterns', () => {
    lintResourcePaths('.codeadd/commands/x.md and .codeadd/skills/y/z.md', '/fake/multi.md');
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// copyDirRecursive: provider-aware sibling transformation
// ---------------------------------------------------------------------------

describe('copyDirRecursive', () => {
  let tmpRoot;
  let src;
  let dest;

  const provider = {
    dir: 'framwork/.claude',
    commands: 'commands/{name}.md',
    skills: 'skills/{name}/SKILL.md',
  };

  beforeEach(() => {
    _resetLintCache();
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'build-test-'));
    src = path.join(tmpRoot, 'src');
    dest = path.join(tmpRoot, 'dest');
    fs.mkdirSync(src, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('without provider: copies markdown verbatim (variables preserved)', () => {
    fs.writeFileSync(path.join(src, 'note.md'), 'Read {{skill:add-foo/SKILL.md}} now');
    copyDirRecursive(src, dest);
    const out = fs.readFileSync(path.join(dest, 'note.md'), 'utf8');
    expect(out).toBe('Read {{skill:add-foo/SKILL.md}} now');
  });

  it('with provider: resolves {{skill:}} in .md files', () => {
    fs.writeFileSync(path.join(src, 'note.md'), 'Read {{skill:add-foo/SKILL.md}}');
    copyDirRecursive(src, dest, provider);
    const out = fs.readFileSync(path.join(dest, 'note.md'), 'utf8');
    expect(out).toBe('Read .claude/skills/add-foo/SKILL.md');
  });

  it('with provider: resolves {{addpath:}} to literal .codeadd/X', () => {
    fs.writeFileSync(path.join(src, 'note.md'), 'Write {{addpath:skills/project-patterns/backend.md}}');
    copyDirRecursive(src, dest, provider);
    const out = fs.readFileSync(path.join(dest, 'note.md'), 'utf8');
    expect(out).toBe('Write .codeadd/skills/project-patterns/backend.md');
  });

  it('with provider: copies non-md files verbatim (no transformation)', () => {
    const jsonContent = '{"placeholder": "{{skill:do-not-touch/x.md}}"}';
    fs.writeFileSync(path.join(src, 'data.json'), jsonContent);
    copyDirRecursive(src, dest, provider);
    expect(fs.readFileSync(path.join(dest, 'data.json'), 'utf8')).toBe(jsonContent);
  });

  it('recurses into subdirectories propagating provider', () => {
    const sub = path.join(src, 'sub');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'nested.md'), '{{cmd:add.plan}}');
    copyDirRecursive(src, dest, provider);
    const out = fs.readFileSync(path.join(dest, 'sub', 'nested.md'), 'utf8');
    expect(out).toBe('.claude/commands/add.plan.md');
  });

  it('returns the count of files copied', () => {
    fs.writeFileSync(path.join(src, 'a.md'), 'a');
    fs.writeFileSync(path.join(src, 'b.txt'), 'b');
    fs.mkdirSync(path.join(src, 'sub'));
    fs.writeFileSync(path.join(src, 'sub', 'c.md'), 'c');
    expect(copyDirRecursive(src, dest, provider)).toBe(3);
  });

  it('strips HTML comments from .md siblings when provider supplied', () => {
    fs.writeFileSync(path.join(src, 'note.md'), 'before <!-- internal --> after');
    copyDirRecursive(src, dest, provider);
    expect(fs.readFileSync(path.join(dest, 'note.md'), 'utf8')).toBe('before  after');
  });
});

// ---------------------------------------------------------------------------
// Integration: real skill with siblings goes through full sibling pipeline
// ---------------------------------------------------------------------------

describe('skill sibling files integration', () => {
  it('add-architecture-discovery analyzer siblings have {{addpath:}} resolved literally', () => {
    const claudePath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.claude', 'skills', 'add-architecture-discovery', 'backend-analyzer.md');
    const geminiPath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.gemini', 'skills', 'add-architecture-discovery', 'backend-analyzer.md');

    const claudeOut = fs.readFileSync(claudePath, 'utf8');
    const geminiOut = fs.readFileSync(geminiPath, 'utf8');

    // {{addpath:}} resolves identically across providers
    expect(claudeOut).toContain('.codeadd/skills/project-patterns/backend.md');
    expect(geminiOut).toContain('.codeadd/skills/project-patterns/backend.md');

    // No leaked variable placeholders
    expect(claudeOut).not.toContain('{{addpath:');
    expect(geminiOut).not.toContain('{{addpath:');
  });

  it('add-health-check documentation-analyzer has {{skill:}} resolved per provider', () => {
    const claudePath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.claude', 'skills', 'add-health-check', 'documentation-analyzer.md');
    const geminiPath = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.gemini', 'skills', 'add-health-check', 'documentation-analyzer.md');

    const claudeOut = fs.readFileSync(claudePath, 'utf8');
    const geminiOut = fs.readFileSync(geminiPath, 'utf8');

    expect(claudeOut).toContain('.claude/skills/add-claude-md-style/SKILL.md');
    expect(geminiOut).toContain('.gemini/skills/add-claude-md-style/SKILL.md');

    expect(claudeOut).not.toContain('{{skill:');
    expect(geminiOut).not.toContain('{{skill:');
  });
});

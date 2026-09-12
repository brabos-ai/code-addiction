import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  MCP_CONFIG,
  SERVER_NAME,
  registrationFor,
  registrationLine,
  registerProvider,
  writeMcpRegistration,
} from '../src/mcp-registration.js';
import { PROVIDERS, resolveSelected } from '../src/providers.js';

/**
 * Plan 2026-09-12T104012 — F14 and F15, MCP registration.
 * Validation Matrix level L4.4, plus the three failure modes the design names
 * for registration: install-only, a pin never rewritten, and a duplicate entry.
 */

const ALL = Object.keys(PROVIDERS).map((key) => ({ key }));

let cwd;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-reg-'));
});

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(cwd, rel), 'utf8'));

describe('F14 — the registration form', () => {
  it('is npx over the pinned package, with the corpus selected', () => {
    expect(registrationFor('1.2.3')).toEqual({
      command: 'npx',
      args: ['-y', 'codeadd@1.2.3', 'mcp', '--corpus=docs'],
    });
  });

  it('installs nothing into the user tree — the entry is the whole delivery', () => {
    writeMcpRegistration(cwd, [{ key: 'claude' }], '1.2.3');
    const stray = fs.readdirSync(cwd).filter((n) => n !== '.mcp.json');
    expect(stray).toEqual([]);
  });

  it('covers every provider the map declares, writing or printing', () => {
    // A provider missing from the table would silently get nothing at all,
    // which reads exactly like a provider that was never selected.
    for (const key of Object.keys(PROVIDERS)) {
      expect(MCP_CONFIG[key], key).toBeTruthy();
      expect(MCP_CONFIG[key].file, key).toBeTypeOf('string');
    }
  });
});

describe('F14 — what gets written, per provider shape', () => {
  it('writes the common mcpServers object for claude, cursor and antigrav', () => {
    for (const key of ['claude', 'cursor', 'antigrav']) {
      const result = registerProvider(cwd, key, '1.2.3');
      expect(result.status, key).toBe('written');
      const config = readJson(MCP_CONFIG[key].file);
      expect(config.mcpServers[SERVER_NAME], key).toEqual(registrationFor('1.2.3'));
    }
  });

  it("writes opencode's own shape, not the common one", () => {
    expect(registerProvider(cwd, 'opencode', '1.2.3').status).toBe('written');
    const config = readJson('opencode.json');
    expect(config.mcp[SERVER_NAME]).toEqual({
      type: 'local',
      command: ['npx', '-y', 'codeadd@1.2.3', 'mcp', '--corpus=docs'],
      enabled: true,
    });
    expect(config.mcpServers).toBeUndefined();
  });

  it('prints rather than writes TOML, and touches no file', () => {
    const result = registerProvider(cwd, 'codex', '1.2.3');
    expect(result.status).toBe('print');
    expect(result.file).toBe('.codex/config.toml');
    expect(result.line).toContain('codeadd@1.2.3');
    expect(fs.existsSync(path.join(cwd, '.codex'))).toBe(false);
  });

  it('prints for a provider the table does not know', () => {
    const result = registerProvider(cwd, 'some-future-editor', '1.2.3');
    expect(result.status).toBe('print');
    expect(result.line).toBe(registrationLine('1.2.3'));
  });
});

describe('F14 — it never damages a config it did not write', () => {
  it('keeps every other server already configured', () => {
    fs.writeFileSync(
      path.join(cwd, '.mcp.json'),
      JSON.stringify({ mcpServers: { theirs: { command: 'node', args: ['x.js'] } } }),
      'utf8',
    );
    registerProvider(cwd, 'claude', '1.2.3');
    const config = readJson('.mcp.json');
    expect(config.mcpServers.theirs).toEqual({ command: 'node', args: ['x.js'] });
    expect(config.mcpServers[SERVER_NAME]).toBeTruthy();
  });

  it('keeps sibling top-level keys in an mcpServers config too', () => {
    // Not the same assertion as the one above it: that one proves another
    // SERVER survives, this one proves another top-level KEY does. A write that
    // replaces the whole object rather than merging into it passes the first
    // and fails this, which is how the gap was found.
    fs.writeFileSync(
      path.join(cwd, '.mcp.json'),
      JSON.stringify({ $schema: 'https://example.invalid/mcp.json', inputs: [{ id: 'token' }] }),
      'utf8',
    );
    registerProvider(cwd, 'claude', '1.2.3');
    const config = readJson('.mcp.json');
    expect(config.$schema).toBe('https://example.invalid/mcp.json');
    expect(config.inputs).toEqual([{ id: 'token' }]);
    expect(config.mcpServers[SERVER_NAME]).toBeTruthy();
  });

  it('keeps sibling top-level keys the provider owns', () => {
    fs.writeFileSync(
      path.join(cwd, 'opencode.json'),
      JSON.stringify({ $schema: 'https://opencode.ai/config.json', theme: 'dark' }),
      'utf8',
    );
    registerProvider(cwd, 'opencode', '1.2.3');
    const config = readJson('opencode.json');
    expect(config.theme).toBe('dark');
    expect(config.$schema).toBe('https://opencode.ai/config.json');
  });

  it('leaves a config it cannot parse exactly as it found it', () => {
    const broken = '{ "mcpServers": { oops';
    fs.writeFileSync(path.join(cwd, '.mcp.json'), broken, 'utf8');
    const result = registerProvider(cwd, 'claude', '1.2.3');
    expect(result.status).toBe('unreadable');
    expect(fs.readFileSync(path.join(cwd, '.mcp.json'), 'utf8')).toBe(broken);
    expect(result.line).toContain('codeadd@1.2.3');
  });

  it('never throws, whatever one provider does', () => {
    fs.writeFileSync(path.join(cwd, '.mcp.json'), 'not json at all', 'utf8');
    const outcome = writeMcpRegistration(cwd, ALL, '1.2.3');
    expect(outcome.results).toHaveLength(ALL.length);
    expect(outcome.written).toBeGreaterThan(0);
  });
});

describe('F14 — L4.4 exactly one entry, and the pin matches the version', () => {
  it('writing twice leaves exactly one entry', () => {
    registerProvider(cwd, 'claude', '1.2.3');
    const second = registerProvider(cwd, 'claude', '1.2.3');
    expect(second.status).toBe('current');
    const config = readJson('.mcp.json');
    expect(Object.keys(config.mcpServers)).toEqual([SERVER_NAME]);
  });

  it('a later version rewrites the pin rather than adding a second entry', () => {
    registerProvider(cwd, 'claude', '1.0.0');
    const bumped = registerProvider(cwd, 'claude', '1.1.0');
    expect(bumped.status).toBe('written');
    const config = readJson('.mcp.json');
    expect(Object.keys(config.mcpServers)).toEqual([SERVER_NAME]);
    expect(config.mcpServers[SERVER_NAME].args).toContain('codeadd@1.1.0');
    expect(JSON.stringify(config)).not.toContain('codeadd@1.0.0');
  });

  it('the same holds for opencode, whose shape is different', () => {
    registerProvider(cwd, 'opencode', '1.0.0');
    registerProvider(cwd, 'opencode', '1.1.0');
    const config = readJson('opencode.json');
    expect(Object.keys(config.mcp)).toEqual([SERVER_NAME]);
    expect(config.mcp[SERVER_NAME].command).toContain('codeadd@1.1.0');
  });

  it('L4.4 every writable provider ends with one entry after install and update', () => {
    const providers = resolveSelected(Object.keys(PROVIDERS), 'project');
    writeMcpRegistration(cwd, providers, '1.0.0'); // install
    writeMcpRegistration(cwd, providers, '1.1.0'); // update

    for (const [key, config] of Object.entries(MCP_CONFIG)) {
      if (config.format === 'toml') continue;
      const written = readJson(config.file);
      const servers = config.format === 'opencode' ? written.mcp : written.mcpServers;
      expect(Object.keys(servers), key).toEqual([SERVER_NAME]);
      expect(JSON.stringify(servers[SERVER_NAME]), key).toContain('codeadd@1.1.0');
    }
  });
});

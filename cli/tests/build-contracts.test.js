import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Setup-contract extraction guard (plan 0068).
 *
 * `scripts/build.js` extracts a command's `## Materializes` declaration into the
 * build-emitted sidecar `framwork/.codeadd/contracts.json`. The declaration is the
 * SINGLE source of every shape the command materializes into a user's project, and
 * `shape` is a hand-declared hash of it: the build recomputes and refuses to ship a
 * changed shape. Identity is the hash — there is no version integer and no recipe chain.
 *
 * Cases 3-5 are non-negotiable. The declaration deliberately embeds a fenced
 * markdown template carrying its own H2s (`## Conventions`, `## Auth / Seed`). A
 * naive `^## ` boundary scan ends the block at the first of them, which silently
 * defeats two mechanisms at once: everything below stops participating in `shape`
 * (drift ships green) and everything below escapes the resource-path-variable ban
 * (a per-provider-divergent contract ships). Without these three cases the blind
 * spot is invisible — every other assertion here passes while half the declaration
 * goes unguarded.
 */

const require = createRequire(import.meta.url);
const {
  sliceContractBlock,
  contractShape,
  extractContract,
  collectContract,
  writeContracts,
  _resetContracts,
} = require('../../scripts/build.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REAL_COMMAND = path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add-qa-setup.md');

const TMP_DIRS = [];

function tmpOut() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contracts-out-'));
  TMP_DIRS.push(dir);
  return path.join(dir, 'contracts.json');
}

afterAll(() => {
  for (const dir of TMP_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A command source carrying a `## Materializes` block whose embedded template
 * holds fenced H2s — the exact structure the real command has.
 */
function source(opts = {}) {
  const {
    contract = 'add-qa-setup',
    shape = 'sha256:0000000000000000',
    owner = 'setup',
    yamlExtra = '',
    afterYaml = '',
    belowFencedHeading = '',
    trailingWs = '',
  } = opts;

  return `---
description: fixture command
---

# Fixture

## Required Skills

Load nothing.

---

## Materializes

> Single source of truth for every shape this command writes.${trailingWs}

\`\`\`yaml
contract: ${contract}
shape: ${shape}
${yamlExtra}paths:
  - path: docs/qa/config.json
    owner: ${owner}
    step: 7
  - path: <provider skills dir>/qa-project/SKILL.md
    owner: setup
    step: 6
  - path: FEATURE_DIR/_tests/screens.json
    owner: shared
    step: 8
\`\`\`
${afterYaml}
### \`<provider skills dir>/qa-project/SKILL.md\`

\`\`\`markdown
---
name: qa-project
---

# Project QA Conventions

## Conventions
- **Runner:** <e.g. @playwright/test>

## Auth / Seed
- SENTINEL_BELOW_FENCED_HEADING${belowFencedHeading}
\`\`\`

---

## Next Real Section

This H2 is outside every fence and DOES end the block.
`;
}

/** Replace the placeholder `shape:` with the value the build computes for that block. */
function sealed(opts = {}) {
  const raw = source(opts);
  return raw.replace(/^shape: .*$/m, `shape: ${contractShape(sliceContractBlock(raw))}`);
}

beforeEach(() => _resetContracts());

// ---------------------------------------------------------------------------
// Extraction + required fields
// ---------------------------------------------------------------------------

describe('contract extraction', () => {
  it('case 1 — a source with no "## Materializes" produces no contract, and does not throw', () => {
    const plain = '---\ndescription: x\n---\n\n# Plain command\n\n## STEP 1\n\nDo a thing.\n';
    expect(extractContract(plain, 'add.plain')).toBeNull();
    collectContract(plain, 'add.plain');
    const out = tmpOut();
    expect(writeContracts(out)).toBe(0);
  });

  it('case 2 — a valid block yields contract/shape/paths with owners preserved', () => {
    const c = extractContract(sealed(), 'add-qa-setup');
    expect(c.contract).toBe('add-qa-setup');
    expect(c.shape).toMatch(/^sha256:[0-9a-f]{16}$/);
    expect(c.version).toBeUndefined();
    expect(c.recipes).toBeUndefined();
    expect(c.paths).toHaveLength(3);
    expect(c.paths.map((p) => p.owner)).toEqual(['setup', 'setup', 'shared']);
    expect(c.paths[0].path).toBe('docs/qa/config.json');
  });

  it('case 13 — a missing "contract" or a missing "shape" fails loud', () => {
    const missingField = /missing a required field/i;
    const noContract = sealed().replace(/^contract: .*\n/m, '');
    expect(() => extractContract(noContract, 'add-qa-setup')).toThrow(missingField);
    const noShape = source().replace(/^shape: .*\n/m, '');
    expect(() => extractContract(noShape, 'add-qa-setup')).toThrow(missingField);
  });

  it('the sidecar key must match the command name', () => {
    expect(() => extractContract(sealed({ contract: 'add.typo' }), 'add-qa-setup'))
      .toThrow(/declares contract: add\.typo/);
  });

  it('a duplicate contract key fails loud instead of overwriting', () => {
    collectContract(sealed({ contract: 'a.dupe' }), 'a.dupe');
    expect(() => collectContract(sealed({ contract: 'a.dupe' }), 'a.dupe')).toThrow(/Duplicate contract/);
  });
});

// ---------------------------------------------------------------------------
// I1 — fence-aware section boundary (non-negotiable)
// ---------------------------------------------------------------------------

describe('I1 — the block boundary is fence-aware', () => {
  it('case 3 — a "##" heading inside a fence does NOT end the section', () => {
    const block = sliceContractBlock(source());
    expect(block).toContain('## Conventions');
    expect(block).toContain('SENTINEL_BELOW_FENCED_HEADING');
    expect(block).not.toContain('Next Real Section');
  });

  it('case 4 — editing one character BELOW a fenced "##" heading moves the shape', () => {
    const before = contractShape(sliceContractBlock(source()));
    const after = contractShape(sliceContractBlock(source({ belowFencedHeading: '.' })));
    expect(after).not.toBe(before);
  });

  it('case 5 — a resource-path variable BELOW a fenced "##" heading is still banned', () => {
    const raw = source({ belowFencedHeading: '\n- {{skill:add--qa/SKILL.md}}' });
    expect(() => extractContract(raw, 'add-qa-setup')).toThrow(/resource-path variable/i);
  });
});

// ---------------------------------------------------------------------------
// I3 — resource-path variable ban
// ---------------------------------------------------------------------------

describe('I3 — no resource-path variables in the block', () => {
  it('case 6 — a variable in the yaml preamble fails loud', () => {
    const raw = source({ yamlExtra: 'note: {{skill:add--qa/SKILL.md}}\n' });
    expect(() => extractContract(raw, 'add-qa-setup')).toThrow(/resource-path variable/i);
  });

  it('each of the three namespaces is banned in its resolvable form', () => {
    for (const v of ['{{cmd:add-plan}}', '{{skill:add--qa/SKILL.md}}', '{{addpath:manifest.json}}']) {
      expect(() => extractContract(source({ afterYaml: `\n${v}\n` }), 'add-qa-setup'))
        .toThrow(/resource-path variable/i);
    }
  });

  it('a whitespace-padded variable is banned — it still resolves per provider', () => {
    for (const v of ['{{cmd: add-plan}}', '{{skill: add--qa/SKILL.md}}', '{{addpath: manifest.json}}']) {
      expect(() => extractContract(source({ afterYaml: `\n${v}\n` }), 'add-qa-setup'))
        .toThrow(/resource-path variable/i);
    }
  });

  it('the EMPTY forms are documentation, not references, and are allowed', () => {
    const raw = sealed({ afterYaml: '\nVariables ({{cmd:}}, {{skill:}}, {{addpath:}}) are FORBIDDEN here.\n' });
    expect(() => extractContract(raw, 'add-qa-setup')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// I2 — what the shape is, and is not, sensitive to
// ---------------------------------------------------------------------------

describe('I2 — shape sensitivity', () => {
  const base = () => contractShape(sliceContractBlock(source()));

  it('case 7 — an HTML comment anywhere in the block does not move the shape', () => {
    const withComment = source({ afterYaml: '\n<!-- source-only dev note -->\n' });
    expect(contractShape(sliceContractBlock(withComment))).toBe(base());
  });

  it('CRLF line endings do not move the shape', () => {
    const lf = contractShape(sliceContractBlock(source()));
    const crlf = contractShape(sliceContractBlock(source().replace(/\n/g, '\r\n')));
    expect(crlf).toBe(lf);
  });

  it('case 8 — trailing whitespace and blank lines around the block do not move the shape', () => {
    const noisy = source({ trailingWs: '   ' });
    expect(contractShape(sliceContractBlock(noisy))).toBe(base());
    const padded = source().replace(/^## Materializes[ \t]*$/m, '## Materializes\n\n');
    expect(contractShape(sliceContractBlock(padded))).toBe(base());
  });

  it('case 9 — changing a declared owner moves the shape', () => {
    expect(contractShape(sliceContractBlock(source({ owner: 'shared' })))).not.toBe(base());
  });

  it('case 9 — the shape line itself is excluded (it cannot hash itself)', () => {
    const a = contractShape(sliceContractBlock(source({ shape: 'sha256:1111111111111111' })));
    expect(a).toBe(base());
  });
});

// ---------------------------------------------------------------------------
// I4 — declared shape is the baseline
// ---------------------------------------------------------------------------

describe('I4 — the declared shape gates a forgotten paste', () => {
  it('case 10 — a declared shape that differs from the computed one fails, printing the computed value', () => {
    const raw = source({ shape: 'sha256:dead0000dead0000' });
    const computed = contractShape(sliceContractBlock(raw));
    let err;
    try {
      extractContract(raw, 'add-qa-setup');
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.message).toContain(computed);
    expect(err.message).toMatch(/Set shape:/);
    expect(err.message).not.toMatch(/version|## v\d/);
  });
});

// ---------------------------------------------------------------------------
// I7/I8 — sidecar output, determinism, total failure
// ---------------------------------------------------------------------------

describe('I7/I8 — sidecar output', () => {
  it('case 14 — the sidecar matches the declared shape, sorts keys, and is deterministic', () => {
    collectContract(sealed({ contract: 'z.last' }), 'z.last');
    collectContract(sealed({ contract: 'a.first' }), 'a.first');

    const out = tmpOut();
    expect(writeContracts(out)).toBe(2);
    const first = fs.readFileSync(out, 'utf8');
    const parsed = JSON.parse(first);

    expect(parsed.version).toBe(1);
    expect(Object.keys(parsed.contracts)).toEqual(['a.first', 'z.last']);
    const entry = parsed.contracts['a.first'];
    expect(Object.keys(entry).sort()).toEqual(['paths', 'shape']);
    expect(entry.paths[0]).toMatchObject({ path: 'docs/qa/config.json', owner: 'setup' });
    expect(entry.version).toBeUndefined();
    expect(entry.recipes).toBeUndefined();

    _resetContracts();
    collectContract(sealed({ contract: 'z.last' }), 'z.last');
    collectContract(sealed({ contract: 'a.first' }), 'a.first');
    writeContracts(out);
    expect(fs.readFileSync(out, 'utf8')).toBe(first);
  });

  it('case 16 — a firing gate contributes nothing, leaving no partial contract', () => {
    collectContract(sealed({ contract: 'a.good' }), 'a.good');

    expect(() => collectContract(source({ contract: 'b.bad', shape: 'sha256:dead0000dead0000' }), 'b.bad'))
      .toThrow(/shape changed/);

    const out = tmpOut();
    expect(writeContracts(out)).toBe(1);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(Object.keys(parsed.contracts)).toEqual(['a.good']);
    expect(parsed.contracts['b.bad']).toBeUndefined();
  });

  it('wiring — the emitted sidecar covers commands that declare a block, and nothing else', () => {
    const sidecar = path.join(ROOT, 'framwork', '.codeadd', 'contracts.json');
    expect(fs.existsSync(sidecar), 'sidecar missing — run `node scripts/build.js` first').toBe(true);
    const parsed = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    const commandDir = path.join(ROOT, 'framwork', '.codeadd', 'commands');
    const declaring = fs.readdirSync(commandDir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => /^## Materializes[ \t]*$/m.test(fs.readFileSync(path.join(commandDir, f), 'utf8')))
      .map((f) => f.replace(/\.md$/, ''));
    expect(Object.keys(parsed.contracts).sort()).toEqual(declaring.sort());
    expect(declaring).toContain('add-qa-setup');
  });
});

// ---------------------------------------------------------------------------
// The real source
// ---------------------------------------------------------------------------

describe('the shipped add-qa-setup contract', () => {
  it('case 15 — extracts with .gitignore as shared state and no version/recipes', () => {
    const c = extractContract(fs.readFileSync(REAL_COMMAND, 'utf8'), 'add-qa-setup');
    expect(c).not.toBeNull();
    expect(c.contract).toBe('add-qa-setup');
    expect(c.version).toBeUndefined();
    expect(c.recipes).toBeUndefined();
    expect(c.paths.map((p) => p.path)).toEqual([
      '.codeadd/settings.json#qa',
      '<provider skills dir>/qa-project/SKILL.md',
      'FEATURE_DIR/_tests/screens.json',
      '.gitignore',
    ]);
    expect(c.paths.map((p) => p.owner)).toEqual(['shared', 'setup', 'shared', 'shared']);
  });

  it('the declaration embeds fenced H2s — the structure cases 3-5 guard', () => {
    const block = sliceContractBlock(fs.readFileSync(REAL_COMMAND, 'utf8'));
    expect(block).toContain('## Managed App Lifecycle');
    expect(block).toContain('## Auth / Seed');
  });
});

// ---------------------------------------------------------------------------
// changed-in — the version in which the shape last changed
// ---------------------------------------------------------------------------

describe('changed-in', () => {
  const CHANGED = 'changed-in: 1.3.2\n';

  it('the line is outside the hash — the shape is the same with and without it', () => {
    const without = source();
    const withLine = source({ yamlExtra: CHANGED });
    expect(contractShape(sliceContractBlock(withLine))).toBe(contractShape(sliceContractBlock(without)));
  });

  it('a valid MAJOR.MINOR.PATCH is emitted as changed_in, right after shape', () => {
    collectContract(sealed({ yamlExtra: CHANGED }), 'add-qa-setup');
    const out = tmpOut();
    writeContracts(out);
    const text = fs.readFileSync(out, 'utf8');
    expect(JSON.parse(text).contracts['add-qa-setup'].changed_in).toBe('1.3.2');
    expect(text.indexOf('"shape"')).toBeLessThan(text.indexOf('"changed_in"'));
    expect(text.indexOf('"changed_in"')).toBeLessThan(text.indexOf('"paths"'));
  });

  it('a block without the line emits no changed_in key', () => {
    collectContract(sealed(), 'add-qa-setup');
    const out = tmpOut();
    writeContracts(out);
    expect(JSON.parse(fs.readFileSync(out, 'utf8')).contracts['add-qa-setup']).not.toHaveProperty('changed_in');
  });

  it('a value that is not MAJOR.MINOR.PATCH fails the build', () => {
    for (const bad of ['1.3', 'v1.3.2', '1.3.2-beta']) {
      expect(() => extractContract(sealed({ yamlExtra: `changed-in: ${bad}\n` }), 'add-qa-setup'), bad)
        .toThrow(/changed-in/);
    }
  });

  it('only the FIRST changed-in line leaves the hash — a template line at column 0 still moves it', () => {
    const base = source({ yamlExtra: CHANGED });
    const withTemplateLine = source({ yamlExtra: CHANGED, belowFencedHeading: '\nchanged-in: 9.9.9' });
    expect(contractShape(sliceContractBlock(withTemplateLine)))
      .not.toBe(contractShape(sliceContractBlock(base)));
  });

  it('a shape mismatch tells the author to set both shape and changed-in', () => {
    expect(() => extractContract(source({ yamlExtra: CHANGED }), 'add-qa-setup'))
      .toThrow(/changed-in/);
  });
});

describe('the shipped add-qa-setup changed-in', () => {
  it('keeps the shape installed projects already hold and records the version that set it', () => {
    const sidecar = path.join(ROOT, 'framwork', '.codeadd', 'contracts.json');
    const c = extractContract(fs.readFileSync(REAL_COMMAND, 'utf8'), 'add-qa-setup');
    // The shape moved with the settings file: the last pre-refactor shape is sha256:25b937ee17628d6b.
    expect(c.shape).toMatch(/^sha256:[0-9a-f]{16}$/);
    expect(c.shape).not.toBe('sha256:25b937ee17628d6b');
    expect(c.changed_in).toBe('1.7.0');
    expect(fs.existsSync(sidecar), 'sidecar missing — run `node scripts/build.js` first').toBe(true);
    const built = JSON.parse(fs.readFileSync(sidecar, 'utf8')).contracts['add-qa-setup'];
    expect(built.shape).toBe(c.shape);
    expect(built.changed_in).toBe('1.7.0');
    expect(built.paths[0]).toMatchObject({ path: '.codeadd/settings.json#qa', owner: 'shared' });
  });
});

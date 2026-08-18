import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Setup-contract extraction guard (plan 0061, Task 2).
 *
 * `scripts/build.js` extracts a command's `## Materializes` declaration into the
 * build-emitted sidecar `framwork/.codeadd/contracts.json`. The declaration is the
 * SINGLE source of every shape the command materializes into a user's project, and
 * `shape` is a hand-declared hash of it: the build recomputes and refuses to ship a
 * changed shape without a `version` bump.
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
const REAL_COMMAND = path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.qa-setup.md');

const RECIPES = 'skills/add-qa/references/setup-contract.md';
const TMP_DIRS = [];

/** A throwaway `.codeadd` root carrying a recipe file with the given `## vN` sections. */
function codeaddWith(versions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-contracts-'));
  TMP_DIRS.push(dir);
  const file = path.join(dir, RECIPES);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = versions.map((v) => `## v${v}\n\n### Delta\n\nno change\n`).join('\n');
  fs.writeFileSync(file, `# Recipes\n\n${body}`, 'utf8');
  return dir;
}

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
    contract = 'add.qa-setup',
    version = 1,
    shape = 'sha256:0000000000000000',
    recipes = RECIPES,
    owner = 'setup',
    yamlExtra = '',
    afterYaml = '',
    belowFencedHeading = '',
    trailingWs = '',
    dropRecipes = false,
  } = opts;

  const recipesLine = dropRecipes ? '' : `recipes: ${recipes}\n`;

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
version: ${version}
shape: ${shape}
${recipesLine}${yamlExtra}paths:
  - path: docs/qa/config.json
    owner: ${owner}
    step: 7
  - path: <provider skills dir>/qa-project/SKILL.md
    owner: setup
    step: 6
  - path: FEATURE_DIR/_tests/screens.json
    owner: shared
    co-owner: add.plan STEP 10.0
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
    expect(extractContract(plain, 'add.plain', codeaddWith([1]))).toBeNull();
    collectContract(plain, 'add.plain', codeaddWith([1]));
    const out = tmpOut();
    expect(writeContracts(out)).toBe(0);
  });

  it('case 2 — a valid block yields contract/version/shape/recipes/paths with owners preserved', () => {
    const c = extractContract(sealed(), 'add.qa-setup', codeaddWith([1]));
    expect(c.contract).toBe('add.qa-setup');
    expect(c.version).toBe(1);
    expect(c.shape).toMatch(/^sha256:[0-9a-f]{16}$/);
    expect(c.recipes).toBe(RECIPES);
    expect(c.paths).toHaveLength(3);
    expect(c.paths.map((p) => p.owner)).toEqual(['setup', 'setup', 'shared']);
    expect(c.paths[0].path).toBe('docs/qa/config.json');
  });

  it('case 13 — a missing "recipes", a non-integer "version", or a missing "shape" fails loud', () => {
    const dir = codeaddWith([1]);
    const missingField = /missing a required field/i;
    expect(() => extractContract(sealed({ dropRecipes: true }), 'add.qa-setup', dir)).toThrow(missingField);
    expect(() => extractContract(sealed({ version: 'one' }), 'add.qa-setup', dir)).toThrow(missingField);
    // A block with no `shape:` line at all must say "add a shape line", not route
    // through the I4 mismatch path and tell the author to bump `version`.
    const noShape = source().replace(/^shape: .*\n/m, '');
    expect(() => extractContract(noShape, 'add.qa-setup', dir)).toThrow(missingField);
  });

  it('the sidecar key must match the command name', () => {
    // A mistyped `contract:` keys the sidecar under a name status.sh never finds.
    expect(() => extractContract(sealed({ contract: 'add.typo' }), 'add.qa-setup', codeaddWith([1])))
      .toThrow(/declares contract: add\.typo/);
  });

  it('a duplicate contract key fails loud instead of overwriting', () => {
    const dir = codeaddWith([1]);
    collectContract(sealed({ contract: 'a.dupe' }), 'a.dupe', dir);
    expect(() => collectContract(sealed({ contract: 'a.dupe' }), 'a.dupe', dir)).toThrow(/Duplicate contract/);
  });

  it('recipes must live under skills/ — the only root both resolvers share', () => {
    const dir = codeaddWith([1]);
    fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'scripts', 'setup-contract.md'), '## v1\n', 'utf8');
    expect(() => extractContract(sealed({ recipes: 'scripts/setup-contract.md' }), 'add.qa-setup', dir))
      .toThrow(/MUST start with "skills\/"/);
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
    // ...and the first H2 outside every fence DOES end it.
    expect(block).not.toContain('Next Real Section');
  });

  it('case 4 — editing one character BELOW a fenced "##" heading moves the shape', () => {
    const before = contractShape(sliceContractBlock(source()));
    const after = contractShape(sliceContractBlock(source({ belowFencedHeading: '.' })));
    expect(after).not.toBe(before);
  });

  it('case 5 — a resource-path variable BELOW a fenced "##" heading is still banned', () => {
    const raw = source({ belowFencedHeading: '\n- {{skill:add-qa/SKILL.md}}' });
    expect(() => extractContract(raw, 'add.qa-setup', codeaddWith([1]))).toThrow(/resource-path variable/i);
  });
});

// ---------------------------------------------------------------------------
// I3 — resource-path variable ban
// ---------------------------------------------------------------------------

describe('I3 — no resource-path variables in the block', () => {
  it('case 6 — a variable in the yaml preamble fails loud', () => {
    const raw = source({ yamlExtra: 'note: {{skill:add-qa/SKILL.md}}\n' });
    expect(() => extractContract(raw, 'add.qa-setup', codeaddWith([1]))).toThrow(/resource-path variable/i);
  });

  it('each of the three namespaces is banned in its resolvable form', () => {
    const dir = codeaddWith([1]);
    for (const v of ['{{cmd:add.plan}}', '{{skill:add-qa/SKILL.md}}', '{{addpath:manifest.json}}']) {
      expect(() => extractContract(source({ afterYaml: `\n${v}\n` }), 'add.qa-setup', dir))
        .toThrow(/resource-path variable/i);
    }
  });

  it('a whitespace-padded variable is banned — it still resolves per provider', () => {
    // resolveResourcePaths matches [^}]+, so `{{cmd: add.plan}}` DOES substitute
    // (to a path with a leading space) and would produce a different shape per
    // build target. A ban keyed on [^}\s]+ would wave it straight through.
    const dir = codeaddWith([1]);
    for (const v of ['{{cmd: add.plan}}', '{{skill: add-qa/SKILL.md}}', '{{addpath: manifest.json}}']) {
      expect(() => extractContract(source({ afterYaml: `\n${v}\n` }), 'add.qa-setup', dir))
        .toThrow(/resource-path variable/i);
    }
  });

  it('the EMPTY forms are documentation, not references, and are allowed', () => {
    // `{{cmd:}}` / `{{skill:}}` / `{{addpath:}}` match no resolveResourcePaths()
    // pattern (each requires [^}]+), so they ship identically to every provider and
    // cannot produce a per-target shape. The block's own prose names them to state
    // the ban — a gate that rejected them would forbid the declaration from
    // documenting itself.
    const raw = sealed({ afterYaml: '\nVariables ({{cmd:}}, {{skill:}}, {{addpath:}}) are FORBIDDEN here.\n' });
    expect(() => extractContract(raw, 'add.qa-setup', codeaddWith([1]))).not.toThrow();
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

  it('case 8 — trailing whitespace and blank lines around the block do not move the shape', () => {
    const noisy = source({ trailingWs: '   ' });
    expect(contractShape(sliceContractBlock(noisy))).toBe(base());
    // Blank lines must go INSIDE the boundary. Appending them to the end of the
    // file lands below the terminating H2, where the slicer never looks, so the
    // assertion would hold trivially. Normalization here is performed by
    // stripHtmlComments (collapse 3+ newlines, then trim) inside the slicer;
    // canonicalContractBody's own trim is a defensive duplicate of it.
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

describe('I4 — the declared shape gates a forgotten version bump', () => {
  it('case 10 — a declared shape that differs from the computed one fails, printing the computed value', () => {
    const raw = source({ shape: 'sha256:dead0000dead0000' });
    const computed = contractShape(sliceContractBlock(raw));
    let err;
    try {
      extractContract(raw, 'add.qa-setup', codeaddWith([1]));
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.message).toContain(computed);
    expect(err.message).toMatch(/version/);
  });
});

// ---------------------------------------------------------------------------
// I5 — recipe chain completeness
// ---------------------------------------------------------------------------

describe('I5 — the recipe chain must be complete', () => {
  it('case 11 — version 2 declared with only "## v1" on file fails, naming v2', () => {
    expect(() => extractContract(sealed({ version: 2 }), 'add.qa-setup', codeaddWith([1])))
      .toThrow(/## v2/);
  });

  it('case 12 — version 3 with "## v1" + "## v3" fails, naming the hole at v2', () => {
    let err;
    try {
      extractContract(sealed({ version: 3 }), 'add.qa-setup', codeaddWith([1, 3]));
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.message).toContain('## v2');
    // Distinct from the "you bumped and forgot the recipe" message — a hole means
    // reconciliation cannot walk 1..N sequentially, a different bug with a different fix.
    expect(err.message).toMatch(/chain|sequential/i);
  });

  it('a recipes path pointing at no file at all fails loud', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-norecipes-'));
    TMP_DIRS.push(empty);
    expect(() => extractContract(sealed(), 'add.qa-setup', empty)).toThrow(/missing recipe file/i);
  });
});

// ---------------------------------------------------------------------------
// I7/I8 — sidecar output, determinism, total failure
// ---------------------------------------------------------------------------

describe('I7/I8 — sidecar output', () => {
  it('case 14 — the sidecar matches the declared shape, sorts keys, and is deterministic', () => {
    const dir = codeaddWith([1]);
    collectContract(sealed({ contract: 'z.last' }), 'z.last', dir);
    collectContract(sealed({ contract: 'a.first' }), 'a.first', dir);

    const out = tmpOut();
    expect(writeContracts(out)).toBe(2);
    const first = fs.readFileSync(out, 'utf8');
    const parsed = JSON.parse(first);

    expect(parsed.version).toBe(1);
    expect(Object.keys(parsed.contracts)).toEqual(['a.first', 'z.last']);
    const entry = parsed.contracts['a.first'];
    expect(Object.keys(entry).sort()).toEqual(['paths', 'recipes', 'shape', 'version']);
    expect(entry.paths[0]).toMatchObject({ path: 'docs/qa/config.json', owner: 'setup' });

    _resetContracts();
    collectContract(sealed({ contract: 'z.last' }), 'z.last', dir);
    collectContract(sealed({ contract: 'a.first' }), 'a.first', dir);
    writeContracts(out);
    expect(fs.readFileSync(out, 'utf8')).toBe(first);
  });

  it('case 16 — a firing gate contributes nothing, leaving no partial contract', () => {
    // Asserting "the file does not exist" would be vacuous: writeContracts is never
    // reached on a throw, so nothing writes to that path under ANY implementation —
    // including one that accumulates a half-parsed contract. Prove the accumulator
    // instead: the throw must precede accumulation.
    const dir = codeaddWith([1]);
    collectContract(sealed({ contract: 'a.good' }), 'a.good', dir);

    expect(() => collectContract(source({ contract: 'b.bad', shape: 'sha256:dead0000dead0000' }), 'b.bad', dir))
      .toThrow(/shape changed/);

    const out = tmpOut();
    expect(writeContracts(out)).toBe(1);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(Object.keys(parsed.contracts)).toEqual(['a.good']);
    expect(parsed.contracts['b.bad']).toBeUndefined();
  });

  it('wiring — the emitted sidecar covers commands that declare a block, and nothing else', () => {
    // Pins Task 4.4: collectContract runs in the COMMAND build pass only. CI builds
    // before it tests (ci.yml: "Build framework provider files" precedes "Run tests"),
    // so this reads the real artefact. A refactor that stopped calling collectContract
    // in buildResources would leave every isolated unit test green but fail here.
    const sidecar = path.join(ROOT, 'framwork', '.codeadd', 'contracts.json');
    expect(fs.existsSync(sidecar), 'sidecar missing — run `node scripts/build.js` first').toBe(true);
    const parsed = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    const commandDir = path.join(ROOT, 'framwork', '.codeadd', 'commands');
    const declaring = fs.readdirSync(commandDir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => /^## Materializes[ \t]*$/m.test(fs.readFileSync(path.join(commandDir, f), 'utf8')))
      .map((f) => f.replace(/\.md$/, ''));
    expect(Object.keys(parsed.contracts).sort()).toEqual(declaring.sort());
    expect(declaring).toContain('add.qa-setup');
  });
});

// ---------------------------------------------------------------------------
// The real source
// ---------------------------------------------------------------------------

describe('the shipped add.qa-setup contract', () => {
  it('case 15 — extracts at version 2 with .gitignore as shared state', () => {
    const c = extractContract(fs.readFileSync(REAL_COMMAND, 'utf8'), 'add.qa-setup');
    expect(c).not.toBeNull();
    expect(c.contract).toBe('add.qa-setup');
    expect(c.version).toBe(2);
    expect(c.recipes).toBe(RECIPES);
    expect(c.paths.map((p) => p.path)).toEqual([
      'docs/qa/config.json',
      '<provider skills dir>/qa-project/SKILL.md',
      'FEATURE_DIR/_tests/screens.json',
      '.gitignore',
    ]);
    expect(c.paths.map((p) => p.owner)).toEqual(['setup', 'setup', 'shared', 'shared']);
  });

  it('the declaration embeds fenced H2s — the structure cases 3-5 guard', () => {
    const block = sliceContractBlock(fs.readFileSync(REAL_COMMAND, 'utf8'));
    expect(block).toContain('## Managed App Lifecycle');
    expect(block).toContain('## Auth / Seed');
  });
});

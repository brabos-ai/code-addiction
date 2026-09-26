const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const tool = path.resolve(__dirname, '..', 'rename-product-artefacts.js');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'add-rename-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (name, data) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
    return file;
  };
  put('framwork/provider-map.json', JSON.stringify({ commands: { add: {}, 'add.plan': {} }, skills: { 'add-commit': {} } }));
  put('framwork/.codeadd/commands/add.plan.md', 'Load {{skill:add-commit/SKILL.md}}; run /add.plan\n');
  put('framwork/.codeadd/skills/add-commit/SKILL.md', '---\nname: add-commit\n---\n');
  put('README.md', 'Use /add.plan with add-commit\n');
  put('docs/deliveries/old/plan.md', 'Historic /add.plan and add-commit\n');
  return { root, put };
}

function run(root, ...args) {
  return spawnSync(process.execPath, [tool, ...args, '--scope', 'all', '--root', root], { encoding: 'utf8' });
}

test('preview is deterministic JSONL with separate summary; apply migrates active files only', (t) => {
  const { root } = fixture(t);
  const first = run(root, 'preview');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, run(root, 'preview').stdout);
  const records = first.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(records[0].type, 'header');
  assert.equal(records.at(-1).type, 'footer');
  assert.match(first.stderr, /records=\d+ files=\d+ bytes=\d+/);
  assert.ok(records.some((r) => r.type === 'edit' && r.before.includes('/add.plan') && r.after.includes('/add-plan')));
  const previewPath = path.join(root, 'preview.jsonl');
  const filePreview = run(root, 'preview', '--output', previewPath);
  assert.equal(filePreview.status, 0, filePreview.stderr);
  assert.equal(fs.readFileSync(previewPath, 'utf8'), first.stdout);
  assert.match(filePreview.stdout, /records=\d+ files=\d+ bytes=\d+/);
  assert.equal(filePreview.stderr, '');
  const apply = run(root, 'apply', '--preview', previewPath);
  assert.equal(apply.status, 0, apply.stderr);
  assert.ok(fs.existsSync(path.join(root, 'framwork/.codeadd/commands/add-plan.md')));
  assert.ok(fs.existsSync(path.join(root, 'framwork/.codeadd/skills/add--commit/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(root, 'framwork/.codeadd/commands/add.plan.md')));
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /\/add-plan with add--commit/);
  assert.match(fs.readFileSync(path.join(root, 'docs/deliveries/old/plan.md'), 'utf8'), /\/add\.plan/);
});

test('stale preview or conflicting destination fails before any write', (t) => {
  const { root, put } = fixture(t);
  const preview = path.join(root, 'preview.jsonl');
  assert.equal(run(root, 'preview', '--output', preview).status, 0);
  put('README.md', 'Changed /add.plan\n');
  assert.notEqual(run(root, 'apply', '--preview', preview).status, 0);
  assert.ok(fs.existsSync(path.join(root, 'framwork/.codeadd/commands/add.plan.md')));
  assert.equal(run(root, 'preview', '--output', preview).status, 0);
  put('framwork/.codeadd/commands/add-plan.md', 'occupied');
  assert.notEqual(run(root, 'apply', '--preview', preview).status, 0);
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), 'Changed /add.plan\n');
});

test('truncated or forged preview is rejected and stdin apply is supported', (t) => {
  const { root } = fixture(t);
  const preview = run(root, 'preview').stdout;
  assert.notEqual(spawnSync(process.execPath, [tool, 'apply', '--preview', '-', '--scope', 'all', '--root', root], {
    input: preview.split('\n').slice(0, -2).join('\n') + '\n', encoding: 'utf8',
  }).status, 0);
  assert.notEqual(spawnSync(process.execPath, [tool, 'apply', '--preview', '-', '--scope', 'all', '--root', root], {
    input: preview.replace('add.plan', 'add.bad'), encoding: 'utf8',
  }).status, 0);
  assert.ok(fs.existsSync(path.join(root, 'framwork/.codeadd/commands/add.plan.md')));
  const applied = spawnSync(process.execPath, [tool, 'apply', '--preview', '-', '--scope', 'all', '--root', root], {
    input: preview, encoding: 'utf8',
  });
  assert.equal(applied.status, 0, applied.stderr);
});

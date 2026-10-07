const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
test('root command contract includes every individual and group route', () => {
  const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).scripts;
  const selections = { test: 'framework', 'test:framework': 'framework', 'test:cli': 'cli', 'test:scripts': 'scripts', 'test:package': 'package', 'test:board': 'board', 'test:board:e2e': 'board-e2e', 'test:all': 'all' };
  for (const [name, suite] of Object.entries(selections)) assert.equal(scripts[name], `node scripts/run-tests.js ${suite}`);
});
test('active guidance is environment-agnostic and individual CLI filters use their scoped command', () => {
  const product = fs.readFileSync(path.join(root, 'workbench/skills/add-framework-product-layer/SKILL.md'), 'utf8');
  const done = fs.readFileSync(path.join(root, 'workbench/skills/add-framework--done/SKILL.md'), 'utf8');
  const rename = fs.readFileSync(path.join(root, 'workbench/skills/add-product-artefact-renaming/SKILL.md'), 'utf8');
  for (const text of [product, done, rename]) {
    assert.doesNotMatch(text, /CODEADD_TESTS_RUNNER|npm test --|runs? natively|native routes|native copy/);
  }
  assert.match(product, /npm run test:cli --/); assert.match(done, /npm run test:all/);
  assert.match(rename, /npm run test:cli/);
});

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

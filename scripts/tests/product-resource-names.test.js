const test = require('node:test');
const assert = require('node:assert/strict');
const build = require('../build.js');

test('builder rejects wrong product names but keeps root add', () => {
  assert.equal(typeof build.assertProductNames, 'function');
  assert.doesNotThrow(() => build.assertProductNames({ commands: { add: {}, 'add-new': {} }, skills: { 'add--commit': {} } }));
  assert.throws(() => build.assertProductNames({ commands: { 'add.new': {} }, skills: {} }), /command.*add\.new/i);
  assert.throws(() => build.assertProductNames({ commands: {}, skills: { 'add-commit': {} } }), /skill.*add-commit/i);
});

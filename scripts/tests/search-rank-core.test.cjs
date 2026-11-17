'use strict';
// search-rank-core.test.cjs — the ranking algorithm shared by `delivered.cjs read`
// (this core) and the MCP `search` (mcp/rank.mjs, its twin). RED-FIRST: the module
// did not exist when this file was written.
// Run: node --test scripts/tests/search-rank-core.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const h = require('./helpers.cjs');

const core = require(path.join(h.SCRIPTS_DIR, 'search-rank-core.cjs'));

const doc = (id, fields) => ({ id, fields });
const W = { name: 3, words: 2, what: 1 };

test('search-rank-core#001 tokenize drops stopwords and short terms', () => {
  assert.deepEqual(core.tokenize('Economia de tokens para o QA'), ['economia', 'tokens']);
});

test('search-rank-core#002 diacritics fold and hyphenated ids split', () => {
  assert.deepEqual(core.tokenize('relevância'), core.tokenize('relevancia'));
  assert.deepEqual(core.tokenize('add-framework--done'), ['add', 'framework', 'done']);
});

test('search-rank-core#003 a term matches a whole word or a word prefix, never a fragment', () => {
  const docs = [doc('A', { name: 'authGoogleHandler' }), doc('B', { name: 'tokens budget' })];
  assert.deepEqual(core.rank(docs, 'auth', { weights: W }).rows.map((r) => r.doc.id), ['A']);
  assert.equal(core.rank(docs, 'ken', { weights: W }).rows.length, 0);
});

test('search-rank-core#004 a rare term outweighs common ones', () => {
  const docs = [
    doc('common', { name: 'qa setup guide', words: 'qa setup' }),
    doc('rare', { name: 'seed notes', words: 'seed' }),
    doc('c2', { name: 'qa runner', words: 'qa' }),
    doc('c3', { name: 'setup wizard', words: 'setup' }),
    doc('c4', { name: 'qa setup again', words: 'qa setup' }),
  ];
  const rows = core.rank(docs, 'qa seed setup', { weights: W }).rows;
  assert.equal(rows[0].doc.id, 'rare');
});

test('search-rank-core#005 scores: first is exactly 1, all in [0,1], non-increasing', () => {
  const docs = [doc('a', { name: 'tokens tokens' }), doc('b', { name: 'tokens economy' }), doc('c', { name: 'other tokens thing here now' })];
  const rows = core.rank(docs, 'tokens economy', { weights: W }).rows;
  assert.equal(rows[0].score, 1);
  for (let i = 0; i < rows.length; i++) {
    assert.ok(rows[i].score >= 0 && rows[i].score <= 1);
    if (i) assert.ok(rows[i].score <= rows[i - 1].score);
  }
});

test('search-rank-core#006 cut stops on a floor and on a drop, and a later page always advances', () => {
  const mk = (scores) => scores.map((s, i) => ({ id: 'r' + i, score: s }));
  assert.equal(core.cut(mk([1, 0.9, 0.2, 0.1]), { limit: 5 }).stop, 'floor');
  assert.equal(core.cut(mk([1, 0.9, 0.2, 0.1]), { limit: 5 }).rows.length, 2);
  const drop = core.cut(mk([1, 0.9, 0.4, 0.35]), { limit: 5 });
  assert.equal(drop.stop, 'drop');
  assert.equal(drop.rows.length, 2);
  const later = core.cut(mk([1, 0.9, 0.2, 0.1]), { limit: 5, offset: 2 });
  assert.equal(later.rows[0].id, 'r2');
  assert.equal(later.rows.length, 1);
  assert.equal(later.stop, 'floor');
  assert.equal(core.cut(mk([1, 0.9, 0.8]), { limit: 2 }).stop, 'limit');
  assert.equal(core.cut(mk([1, 0.9, 0.8]), { limit: 2 }).nextOffset, 2);
  assert.equal(core.cut(mk([1, 0.9]), { limit: 5 }).stop, 'end');
  assert.equal(core.cut(mk([1, 0.9]), { limit: 5 }).nextOffset, null);
});

test('search-rank-core#007 budget drops whole rows from the end and keeps at least one', () => {
  const big = (id, score) => ({ id, score, pad: 'x'.repeat(3000) });
  const out = core.cut([big('a', 1), big('b', 0.95), big('c', 0.9)], { limit: 5 });
  assert.equal(out.stop, 'budget');
  assert.deepEqual(out.rows.map((r) => r.id), ['a', 'b']);
  assert.ok(out.rows.map((r) => JSON.stringify(r)).join('\n').length <= core.BUDGET_TOKENS * core.CHARS_PER_TOKEN);
  const huge = core.cut([{ id: 'a', score: 1, pad: 'x'.repeat(20000) }, big('b', 0.9)], { limit: 5 });
  assert.equal(huge.rows.length, 1);
  assert.equal(huge.stop, 'budget');
  for (const r of out.rows) assert.doesNotThrow(() => JSON.parse(JSON.stringify(r)));
});

test('search-rank-core#008 a query of only dropped terms matches nothing', () => {
  const docs = [doc('a', { name: 'de para tokens' })];
  const out = core.rank(docs, 'de para o', { weights: W });
  assert.equal(out.rows.length, 0);
  assert.equal(out.stop, 'no-terms');
});

test('search-rank-core#009 chains: head matched is one row; an older match carries superseded_by', () => {
  const sup = { B: 'A', C: 'B' };
  const head = core.collapseChains([{ id: 'C', score: 1 }, { id: 'A', score: 0.8 }, { id: 'B', score: 0.5 }, { id: 'Z', score: 0.4 }], sup);
  assert.deepEqual(head.map((r) => r.id), ['A', 'Z']);
  assert.deepEqual(head[0].replaces.slice().sort(), ['B', 'C']);
  assert.equal(head[0].score, 1);
  const old = core.collapseChains([{ id: 'B', score: 1 }, { id: 'Z', score: 0.4 }], sup);
  assert.deepEqual(old.map((r) => r.id), ['B', 'Z']);
  assert.equal(old[0].superseded_by, 'A');
});

test('search-rank-core#010 snippet is about 200 chars, on word boundaries, from the highest-weight matching field', () => {
  const longText = 'lorem ipsum '.repeat(40) + 'tokens economy ' + 'dolor sit '.repeat(40);
  const out = core.rank([doc('a', { name: 'plain', what: longText, words: 'tokens' })], 'tokens', { weights: W });
  assert.equal(out.rows[0].field, 'words');
  assert.equal(out.rows[0].snippet, 'tokens');
  const only = core.rank([doc('a', { name: 'plain', what: longText })], 'economy', { weights: W }).rows[0];
  assert.ok(only.snippet.length <= 215, String(only.snippet.length));
  assert.ok(only.snippet.includes('economy'));
  assert.ok(!/\s{2}/.test(only.snippet));
  assert.equal(core.snippet('short text', ['short']), 'short text');
});

test('search-rank-core#011 tie-break comparator orders equal scores', () => {
  const docs = [doc('b', { name: 'tokens' }), doc('a', { name: 'tokens' })];
  const rows = core.rank(docs, 'tokens', { weights: W, compare: (x, y) => (x.id < y.id ? -1 : 1) }).rows;
  assert.deepEqual(rows.map((r) => r.doc.id), ['a', 'b']);
});

test('search-rank-core#012 tunables are exported', () => {
  for (const k of ['DEFAULT_LIMIT', 'MAX_LIMIT', 'FLOOR', 'DROP_RATIO', 'BUDGET_TOKENS', 'CHARS_PER_TOKEN', 'MIN_TERM_LEN', 'K1', 'B', 'SNIPPET_CHARS']) {
    assert.equal(typeof core[k], 'number', k);
  }
  assert.equal(core.DEFAULT_LIMIT, 5);
  assert.equal(core.MAX_LIMIT, 20);
  assert.equal(core.FLOOR, 0.3);
  assert.equal(core.DROP_RATIO, 0.5);
  assert.equal(core.BUDGET_TOKENS, 2000);
  assert.equal(core.CHARS_PER_TOKEN, 4);
});

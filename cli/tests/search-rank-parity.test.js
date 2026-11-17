import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

// The ranking algorithm is written twice — framwork/.codeadd/scripts/search-rank-core.cjs
// (delivered.cjs read) and mcp/rank.mjs (the MCP search). This file is what holds them
// identical: the same inputs through both, the same answers out.

const REPO = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
const cjs = require(path.join(REPO, 'framwork', '.codeadd', 'scripts', 'search-rank-core.cjs'));
const esm = await import(path.join(REPO, 'mcp', 'rank.mjs'));

const W = { name: 3, words: 2, what: 1 };
const doc = (id, fields) => ({ id, fields });

const CORPUS = [
  doc('0091F', { name: 'qa-project-seed', words: 'qa seed senha teste password test', what: 'O seed de QA fica fora do git, sem senha fixa' }),
  doc('0084B', { name: 'docs-branch-fixes', words: 'docs branch authSeed settings', what: 'authSeed sai do settings.json versionado' }),
  doc('0040F', { name: 'qa-setup', words: 'qa setup credenciais credentials', what: 'credenciais de teste no settings' }),
  doc('0050F', { name: 'economia-de-tokens', words: 'token economy economia tokens', what: 'Relevância e orçamento de tokens' }),
  doc('0051F', { name: 'relevancia-search', words: 'relevance search ranking', what: 'ranking por relevância' }),
  doc('0060F', { name: 'add-framework--done', words: 'close merge archive', what: 'close-out of a delivery' }),
  doc('0061F', { name: 'tie-a', words: 'tie', what: 'same' }),
  doc('0062F', { name: 'tie-b', words: 'tie', what: 'same' }),
];

const QUERIES = [
  'senha de teste QA',
  'economia de tokens',
  'relevância',
  'relevancia',
  'add-framework--done',
  'auth',
  'de da para o',
  'the of and',
  'ranking search relevance',
  'tie',
  'seed',
  'xyzzy',
  '',
];

const CHAIN = { B: 'A', C: 'B', X: 'Y' };
const CHAIN_ROWS = [
  { id: 'C', score: 1 }, { id: 'A', score: 0.8 }, { id: 'B', score: 0.5 },
  { id: 'Y', score: 0.45 }, { id: 'X', score: 0.4 }, { id: 'Z', score: 0.35 },
];

describe('rank parity — search-rank-core.cjs and mcp/rank.mjs', () => {
  it('exports the same names and the same tunables', () => {
    for (const k of Object.keys(cjs)) {
      expect(k in esm, k).toBe(true);
      if (typeof cjs[k] === 'number') expect(esm[k], k).toBe(cjs[k]);
    }
    for (const k of Object.keys(esm)) expect(k in cjs, k).toBe(true);
    expect([...esm.STOPWORDS].sort()).toEqual([...cjs.STOPWORDS].sort());
  });

  it('tokenize agrees', () => {
    for (const q of [...QUERIES, 'Economia de tokens para o QA', 'authGoogleHandler', 'Ação—relevância_2']) {
      expect(esm.tokenize(q), q).toEqual(cjs.tokenize(q));
    }
  });

  it('rank agrees: order, scores, fields, snippets, stop', () => {
    for (const q of QUERIES) {
      const a = cjs.rank(CORPUS, q, { weights: W });
      const b = esm.rank(CORPUS, q, { weights: W });
      expect(b.stop, q).toBe(a.stop);
      expect(b.terms, q).toEqual(a.terms);
      expect(b.rows.map((r) => r.doc.id), q).toEqual(a.rows.map((r) => r.doc.id));
      a.rows.forEach((r, i) => {
        expect(Math.abs(b.rows[i].score - r.score)).toBeLessThan(1e-9);
        expect(b.rows[i].field).toBe(r.field);
        expect(b.rows[i].snippet).toBe(r.snippet);
      });
    }
  });

  it('rank agrees with a tie-break comparator', () => {
    const compare = (x, y) => (x.id < y.id ? 1 : -1);
    const a = cjs.rank(CORPUS, 'tie same', { weights: W, compare });
    const b = esm.rank(CORPUS, 'tie same', { weights: W, compare });
    expect(b.rows.map((r) => r.doc.id)).toEqual(a.rows.map((r) => r.doc.id));
  });

  it('collapseChains agrees', () => {
    expect(esm.collapseChains(CHAIN_ROWS, CHAIN)).toEqual(cjs.collapseChains(CHAIN_ROWS, CHAIN));
    expect(esm.collapseChains(CHAIN_ROWS, new Map(Object.entries(CHAIN)))).toEqual(cjs.collapseChains(CHAIN_ROWS, CHAIN));
    expect(esm.collapseChains([{ id: 'B', score: 1 }], CHAIN)).toEqual(cjs.collapseChains([{ id: 'B', score: 1 }], CHAIN));
  });

  it('cut agrees: floor, drop, limit, end, budget, offset', () => {
    const mk = (s) => s.map((score, i) => ({ id: 'r' + i, score }));
    const big = (n) => Array.from({ length: n }, (_, i) => ({ id: 'b' + i, score: 1 - i * 0.01, pad: 'x'.repeat(3000) }));
    const cases = [
      [mk([1, 0.9, 0.2, 0.1]), { limit: 5 }],
      [mk([1, 0.9, 0.4, 0.35]), { limit: 5 }],
      [mk([1, 0.9, 0.8]), { limit: 2 }],
      [mk([1, 0.9]), { limit: 5 }],
      [mk([1, 0.9, 0.2, 0.1]), { limit: 5, offset: 2 }],
      [mk([1, 0.9, 0.8]), { limit: 99 }],
      [mk([1, 0.9, 0.8]), { limit: 5, offset: 9 }],
      [mk([1, 0.1, 0.05]), { limit: 5, relevance: false }],
      [big(6), { limit: 5 }],
      [[{ id: 'h', score: 1, pad: 'x'.repeat(20000) }, ...big(1)], { limit: 5 }],
    ];
    for (const [rows, opts] of cases) {
      const a = cjs.cut(rows, opts);
      const b = esm.cut(rows, opts);
      expect(b, JSON.stringify(opts)).toEqual(a);
    }
  });

  it('snippet agrees', () => {
    const text = 'lorem ipsum '.repeat(40) + 'Relevância dos tokens ' + 'dolor sit '.repeat(40);
    for (const terms of [['relevancia'], ['tokens'], ['nothing'], []]) {
      expect(esm.snippet(text, terms)).toBe(cjs.snippet(text, terms));
    }
  });
});

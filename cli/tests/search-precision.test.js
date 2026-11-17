import { describe, it, expect } from 'vitest';
import { measure, runRead, makeFixtureRepo, fixtureEntryCount, QUERIES, SCRIPTS } from './evals/search-precision/measure.mjs';
import fs from 'node:fs';

/**
 * docs-search-precision — the card's done-criteria, over a versioned snapshot of this
 * repository's own delivery index (cli/tests/evals/search-precision/delivered.jsonl)
 * and 20 discovery questions, ten pt-BR and ten English, each with its expected id.
 *
 * Queries, expected ids and the fixture's pt-BR `words` were committed BEFORE any
 * ranking code and are not edited afterwards except by a ledger ruling.
 *
 * The "before" baseline is a separate measurement of the OLD read, skipped in CI:
 *   SEARCH_BASELINE_SCRIPTS=<old scripts dir> npx vitest run tests/search-precision.test.js
 * or, without vitest: node cli/tests/evals/search-precision/measure.mjs <old scripts dir>
 */

describe('search precision — the delivery-index read over 20 real questions', () => {
  const after = measure(SCRIPTS);

  it('the expected delivery is in the top 3 for at least 18 of 20 queries', () => {
    expect(QUERIES).toHaveLength(20);
    expect(QUERIES.filter((q) => q.lang === 'pt')).toHaveLength(10);
    expect(QUERIES.filter((q) => q.lang === 'en')).toHaveLength(10);
    expect(after.top3, JSON.stringify(after.per.filter((p) => !p.hit))).toBeGreaterThanOrEqual(18);
  });

  it('no query returns every entry of the fixture, even those containing de, da or para', () => {
    expect(QUERIES.some((q) => /\b(de|da|para)\b/.test(q.query))).toBe(true);
    expect(after.floods).toEqual([]);
    const repo = makeFixtureRepo();
    try {
      const total = fixtureEntryCount();
      for (const stop of ['de da para', 'the of and', 'para o de']) {
        const r = runRead(repo, SCRIPTS, stop);
        expect(r.keys.MATCHED, stop).toBe('0');
        expect(r.keys.STOP).toBe('no-terms');
        expect(r.rows).toHaveLength(0);
      }
      expect(total).toBeGreaterThan(50);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('every query answers in at most 8,000 characters (~2,000 tokens) and every row parses', () => {
    expect(after.maxBytes).toBeLessThanOrEqual(8000);
  });

  it('every row carries a score, a status and a non-empty snippet, and the first scores 1', () => {
    const repo = makeFixtureRepo();
    try {
      for (const q of QUERIES) {
        const r = runRead(repo, SCRIPTS, q.query);
        expect(r.rows.length, q.query).toBeGreaterThan(0);
        expect(r.rows[0].score).toBe(1);
        for (const row of r.rows) {
          expect(typeof row.score).toBe('number');
          expect(row.score).toBeGreaterThanOrEqual(0);
          expect(row.score).toBeLessThanOrEqual(1);
          expect(row.status).toBeTruthy();
          expect(row.snippet.length).toBeGreaterThan(0);
          expect(row.snippet.length).toBeLessThanOrEqual(215);
        }
        expect(r.keys.RETURNED).toBe(String(r.rows.length));
      }
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it.skipIf(!process.env.SEARCH_BASELINE_SCRIPTS)('baseline: measures the OLD read for the ledger (Decision 7)', () => {
    const before = measure(process.env.SEARCH_BASELINE_SCRIPTS);
    console.log(`BEFORE top3=${before.top3}/20 meanBytes=${before.meanBytes} maxBytes=${before.maxBytes} floods=${before.floods.length}`);
    console.log(`AFTER  top3=${after.top3}/20 meanBytes=${after.meanBytes} maxBytes=${after.maxBytes} floods=${after.floods.length}`);
    expect(before.total).toBe(20);
  });
});

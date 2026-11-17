/**
 * search-rank-core.cjs — The ranking algorithm behind `delivered.cjs read`.
 *
 * Side-effect free: it reads nothing, writes nothing and never exits. The MCP
 * `search` runs the same algorithm from `mcp/rank.mjs` — two files, one
 * behaviour, held identical by cli/tests/search-rank-parity.test.js. A change
 * here is a change there.
 *
 * WHAT IT DOES
 *   tokenize  lowercase, fold diacritics, split on non-alphanumerics, drop terms
 *             under MIN_TERM_LEN and the pt+en stopwords
 *   rank      field-weighted BM25. A query term matches a document token that
 *             EQUALS it or STARTS WITH it — a word or a word prefix, never a
 *             fragment. Scores are normalised to the first row (1.0).
 *   snippet   ~SNIPPET_CHARS of the field that matched, cut on word boundaries
 *   collapseChains  one row per supersession chain
 *   cut       the relevance cut (floor, drop), the limit, and the token budget,
 *             which drops WHOLE rows from the end and never cuts a row
 *
 * `rank` and `cut` report why they stopped in `stop`:
 *   drop | floor | limit | budget | end | no-terms
 * A query whose every term is dropped matches NOTHING (`no-terms`), never everything.
 *
 * Every constant below is a declared tunable. Changing one needs before/after
 * numbers from the eval suite and an updated line in
 * add--doc-schemas/references/delivery-index.md.
 */

'use strict';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const MIN_TERM_LEN = 3;
const K1 = 1.2;
const B = 0.75;
// A row under FLOOR of the first, or under DROP_RATIO of the row before it, ends the page.
const FLOOR = 0.3;
const DROP_RATIO = 0.5;
const BUDGET_TOKENS = 2000;
const CHARS_PER_TOKEN = 4;
const SNIPPET_CHARS = 200;

const STOPWORDS = new Set((
  // pt
  'a o as os um uma uns umas de da do das dos em na no nas nos por para pra com sem sob sobre entre ate ' +
  'e ou mas que se como quando onde qual quais quem isso isto esse essa esses essas este esta estes estas ' +
  'aquele aquela ao aos pelo pela pelos pelas ser foi sao era tem ter mais menos muito muita ja nao sim ' +
  'seu sua seus suas meu minha nosso nossa ele ela eles elas voce voces tambem so ' +
  // en
  'the an and or but of to in on at by for with from as is are was were be been being it its this that ' +
  'these those not no do does did has have had will would can could should may might into over under ' +
  'about than then there here what which who whom when where why how all any each some such too very ' +
  'just also our your their his her they them you we he she i me my'
).split(/\s+/).filter(Boolean));

// A word is a run of letters, digits and combining marks, so `relevância` stays one
// word whether it arrives composed or decomposed.
const WORD = /[\p{L}\p{N}\p{M}]+/gu;

function fold(word) {
  return word.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}

function keep(token) {
  return token.length >= MIN_TERM_LEN && !STOPWORDS.has(token);
}

/** Tokens of a text, folded, short words and stopwords dropped. Order and repeats kept. */
function tokenize(text) {
  const out = [];
  const s = String(text === undefined || text === null ? '' : text);
  for (const m of s.matchAll(WORD)) {
    const t = fold(m[0]);
    if (keep(t)) out.push(t);
  }
  return out;
}

function matches(token, term) {
  return token === term || token.startsWith(term);
}

/**
 * ~`max` characters of `text` around the first word matching a term, cut on word
 * boundaries. No match: the head of the text. Whitespace is collapsed.
 */
function snippet(text, terms, max) {
  const limit = max || SNIPPET_CHARS;
  const s = String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim();
  if (s.length <= limit) return s;
  let at = -1;
  const list = terms || [];
  for (const m of s.matchAll(WORD)) {
    const t = fold(m[0]);
    if (list.some((term) => matches(t, term))) {
      at = m.index;
      break;
    }
  }
  let start = at < 0 ? 0 : Math.max(0, at - Math.floor(limit / 3));
  if (start > 0) {
    const sp = s.indexOf(' ', start);
    start = sp === -1 ? start : sp + 1;
  }
  let end = Math.min(s.length, start + limit);
  if (end < s.length) {
    const sp = s.lastIndexOf(' ', end);
    if (sp > start) end = sp;
  }
  return (start > 0 ? '...' : '') + s.slice(start, end).trim() + (end < s.length ? '...' : '');
}

/**
 * Rank `docs` — `{ id, fields: { name: text } }` — against `query`.
 *   opts.weights  { field: weight }; only these fields are searched
 *   opts.compare  (docA, docB) => number, the tie-break for equal scores
 * Returns `{ terms, rows, stop }`; each row `{ doc, raw, score, field, snippet }`
 * with `score` normalised to the first row.
 */
function rank(docs, query, opts = {}) {
  const weights = opts.weights || {};
  const fieldNames = Object.keys(weights);
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return { terms, rows: [], stop: 'no-terms' };

  const N = docs.length;
  const tokenized = docs.map((d) => {
    const per = {};
    for (const f of fieldNames) per[f] = tokenize(d.fields && d.fields[f]);
    return per;
  });
  const avg = {};
  for (const f of fieldNames) {
    let sum = 0;
    for (const per of tokenized) sum += per[f].length;
    avg[f] = N ? sum / N || 1 : 1;
  }

  // tf[t][d][f]: tokens of field f in doc d that match term t
  const tf = terms.map((t) => tokenized.map((per) => {
    const o = {};
    for (const f of fieldNames) {
      let c = 0;
      for (const tok of per[f]) if (matches(tok, t)) c++;
      o[f] = c;
    }
    return o;
  }));
  const df = tf.map((perDoc) => perDoc.filter((o) => fieldNames.some((f) => o[f] > 0)).length);

  const rows = [];
  for (let i = 0; i < N; i++) {
    let raw = 0;
    let matched = false;
    for (let t = 0; t < terms.length; t++) {
      let weighted = 0;
      for (const f of fieldNames) {
        const c = tf[t][i][f];
        if (!c) continue;
        matched = true;
        const norm = 1 - B + B * (tokenized[i][f].length / avg[f]);
        weighted += weights[f] * (c / norm);
      }
      if (!weighted) continue;
      const idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
      raw += idf * ((weighted * (K1 + 1)) / (weighted + K1));
    }
    if (!matched || !(raw > 0)) continue;
    // The field that explains the match: highest weight holding a matching token.
    let field = null;
    for (const f of [...fieldNames].sort((a, b) => weights[b] - weights[a])) {
      if (tokenized[i][f].some((tok) => terms.some((t) => matches(tok, t)))) {
        field = f;
        break;
      }
    }
    rows.push({ doc: docs[i], raw, field, index: i });
  }

  rows.sort((a, b) => {
    if (Math.abs(a.raw - b.raw) > 1e-12) return b.raw - a.raw;
    if (opts.compare) {
      const c = opts.compare(a.doc, b.doc);
      if (c) return c;
    }
    return a.index - b.index;
  });

  const top = rows.length ? rows[0].raw : 1;
  return {
    terms,
    stop: null,
    rows: rows.map((r) => ({
      doc: r.doc,
      raw: r.raw,
      score: r.raw / top,
      field: r.field,
      snippet: r.field ? snippet(r.doc.fields[r.field], terms) : '',
    })),
  };
}

/**
 * One row per supersession chain. `supersededBy` maps an id to the id replacing it
 * (an object or a Map). Rows are `{ id, score, ... }`, best first. The head of a
 * chain matched: it is the row, `replaces` lists the older ids that matched too.
 * Only an older member matched: the best-scoring member is the row, carrying
 * `superseded_by` = the head. Either way the row takes the chain's best score.
 */
function collapseChains(rows, supersededBy) {
  const next = (id) => (supersededBy instanceof Map ? supersededBy.get(id) : supersededBy && supersededBy[id]);
  const headOf = (id) => {
    const seen = new Set([id]);
    let cur = id;
    for (let n = next(cur); n && !seen.has(n); n = next(cur)) {
      seen.add(n);
      cur = n;
    }
    return cur;
  };
  const groups = new Map();
  for (const r of rows) {
    const head = headOf(r.id);
    if (!groups.has(head)) groups.set(head, []);
    groups.get(head).push(r);
  }
  const out = [];
  for (const [head, members] of groups) {
    const best = members.reduce((a, b) => (b.score > a.score ? b : a), members[0]);
    const headRow = members.find((m) => m.id === head);
    const rep = headRow || best;
    const row = Object.assign({}, rep, { score: best.score });
    const others = members.filter((m) => m !== rep).map((m) => m.id);
    if (others.length) row.replaces = others;
    if (!headRow) row.superseded_by = head;
    out.push({ row, first: rows.indexOf(members[0]) });
  }
  out.sort((a, b) => (b.row.score - a.row.score) || (a.first - b.first));
  return out.map((x) => x.row);
}

/**
 * The relevance cut, the limit and the budget over a ranked, normalised list.
 *   opts.limit      rows per page (default DEFAULT_LIMIT, capped at MAX_LIMIT)
 *   opts.offset     rows to skip; the first row of a page is never cut by relevance
 *   opts.relevance  false for an enumeration that carries no score
 *   opts.serialize  row -> string, what the budget measures (default JSON.stringify)
 * Returns `{ rows, stop, nextOffset }`; `nextOffset` is null at the end of the list.
 */
function cut(rows, opts = {}) {
  const limit = Math.min(Math.max(1, Math.trunc(opts.limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const offset = Math.max(0, Math.trunc(opts.offset) || 0);
  const relevance = opts.relevance !== false;
  const serialize = opts.serialize || JSON.stringify;
  const page = rows.slice(offset);
  const kept = [];
  let stop = 'end';
  for (let i = 0; i < page.length; i++) {
    if (i >= limit) {
      stop = 'limit';
      break;
    }
    if (relevance && i > 0) {
      if (page[i].score < FLOOR) {
        stop = 'floor';
        break;
      }
      if (page[i].score < DROP_RATIO * page[i - 1].score) {
        stop = 'drop';
        break;
      }
    }
    kept.push(page[i]);
  }
  const budget = BUDGET_TOKENS * CHARS_PER_TOKEN;
  const size = (list) => list.reduce((n, r) => n + serialize(r).length + 1, 0);
  while (kept.length > 1 && size(kept) > budget) {
    kept.pop();
    stop = 'budget';
  }
  const consumed = offset + kept.length;
  return { rows: kept, stop, nextOffset: consumed < rows.length ? consumed : null };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_TERM_LEN,
  K1,
  B,
  FLOOR,
  DROP_RATIO,
  BUDGET_TOKENS,
  CHARS_PER_TOKEN,
  SNIPPET_CHARS,
  STOPWORDS,
  tokenize,
  rank,
  cut,
  snippet,
  collapseChains,
};

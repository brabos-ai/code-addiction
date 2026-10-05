/**
 * delivery-index-core.cjs — The per-project delivery index, core operations.
 *
 * The side-effect-free boundary that `delivered.cjs` renders and that other
 * native readers (root graph history, the MCP history/touched reader) can call
 * directly instead of spawning a shell. It parses no argv, writes nothing to
 * stdout/stderr and never calls process.exit: every operation returns a plain
 * result object, and the entry owns the KEY=VALUE/JSONL protocol.
 *
 * It DOES read and append `docs/delivered.jsonl` — that is the domain, not a
 * boundary violation — and it runs one binary, git, through argument arrays
 * with shell:false for the corpus and the `touched` commit derivation.
 *
 * CONTRACT (preserved from delivered.sh):
 *   - The corpus is every file git does not ignore
 *     (`git ls-files --cached --others --exclude-standard`) minus `docs/`,
 *     which also removes the index. A filesystem walk would report build output
 *     and stale deleted copies alive; a tracked-only scan would report fresh
 *     uncommitted work dead.
 *   - `write` appends ONE minified line per call, generating `v` and `ts`; it
 *     never rewrites an existing line. Hard bans refuse with a `REFUSED=` name.
 *   - `read` matches PER TERM over id/name/words/node/items[].what/items[].find
 *     (never items[].at), scores by DISTINCT terms hit, sorts status rank ->
 *     score -> recency -> id, and cuts two independent buckets (5 live, 2 dead)
 *     with NO backfill. `--no-verify` returns the stored status.
 *   - `verify` reports each entry; only `--repair` writes, and a repair is a
 *     NEW line (`by=verify`, `status=changed`) that points at a UNIQUE match.
 *   - `touched` answers in TWO layers: `complete` from the derived commit (the
 *     first-parent commit that introduced the entry's line and touched
 *     something outside docs/) and `curated` from the item anchors. The answer
 *     field is `answer`, never `layer`, so the record's own layer survives.
 *   - A corrupt index line is skipped and REPORTED by number, never fatal; an
 *     absent index is an empty result, never an error.
 *
 * Exports operations returning structured results:
 *   resolveRoot(cwd)                     -> { ok, root } | { ok:false, error }
 *   createContext({ root, index })       -> context for the operations below
 *   performWrite(ctx, raw)               -> refused | cannot-write-index | summary
 *   performRead(ctx, opts)               -> counts, skipped, entries
 *   performVerify(ctx, opts)             -> results, repaired, skipped | error
 *   performTouched(ctx, opts)            -> complete, curated, curatedOnly, ...
 *
 * Dependencies: Node >= 18 built-ins and git. No bash, no WSL.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const STATUSES = ['live', 'changed', 'gone', 'superseded'];
const RANK = { live: 0, changed: 1, superseded: 2, gone: 3 };
const REQUIRED = ['id', 'layer', 'by', 'status', 'name', 'words', 'commits', 'origin', 'items'];
const MAX_BYTES = 5 * 1024 * 1024;

// A declared tunable, not a discovery. Changing either needs evidence and an
// updated line in add--doc-schemas/references/delivery-index.md.
const DEFAULT_LIVE_CAP = 5;
const DEAD_CAP = 2;
// One past the over-match ceiling: a scan that reaches 21 has already proved
// the answer is "more than 20" and stops reading a whole monorepo.
const OVER_MATCH_CEILING = 20;
const FIND_SCAN_CAP = OVER_MATCH_CEILING + 1;
// A find resolving in 6-20 files is accepted but flagged LOOSE for the preview.
const LOOSE_THRESHOLD = 6;

/** Normalise a repository-relative path: backslashes to slashes, drop one `./`. */
function norm(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

/** Second-precision UTC timestamp, the format the index records. */
function nowTs() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function refused(name) {
  return { ok: false, exit: 2, refused: name };
}

/**
 * The repository root for `cwd`, via `git rev-parse --show-toplevel`. A failure
 * is an answer (`not-a-git-repository`), never a throw: this runs in the MCP
 * server too, where a throw would kill every later query.
 */
function resolveRoot(cwd) {
  const res = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: cwd || process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
  });
  if (res.error || res.status !== 0) return { ok: false, error: 'not-a-git-repository' };
  const root = String(res.stdout || '').replace(/\r?\n$/, '');
  if (!root) return { ok: false, error: 'not-a-git-repository' };
  return { ok: true, root };
}

/**
 * A context binds one repository root and its index path. The corpus is
 * computed once and cached, because every item check walks it.
 */
function createContext({ root, index } = {}) {
  return {
    root,
    index: index || path.join(root, 'docs', 'delivered.jsonl'),
    _corpus: null,
    _corpusSet: null,
  };
}

// ─── git and the corpus ──────────────────────────────────────────────────────

/** One git call, argv array, explicit cwd, no shell. `null` when git cannot answer. */
function git(ctx, args) {
  try {
    const res = spawnSync('git', args, {
      cwd: ctx.root,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
    });
    if (res.error || res.status !== 0) return null;
    return res.stdout || '';
  } catch (e) {
    return null;
  }
}

/** The corpus, computed once. Absent git degrades to the empty corpus. */
function corpus(ctx) {
  if (ctx._corpus) return ctx._corpus;
  const raw = git(ctx, ['-c', 'core.quotePath=false', 'ls-files', '--cached', '--others', '--exclude-standard']);
  const text = raw === null ? '' : raw;
  // `docs/` is subtracted before normalisation, matching the shell's grep: the
  // index lives under docs/, so this removes it too.
  ctx._corpus = text.split(/\r?\n/)
    .filter((l) => l && !l.startsWith('docs/'))
    .map(norm)
    .filter(Boolean);
  ctx._corpusSet = new Set(ctx._corpus);
  return ctx._corpus;
}

function inCorpus(ctx, rel) {
  corpus(ctx);
  return ctx._corpusSet.has(norm(rel));
}

/**
 * Byte-exact, case-sensitive match over a Buffer. A File carrying a NUL in its
 * first 8KB is skipped the way `grep -I` skips it: an identifier does not live
 * inside a PNG, and a coincidental byte run there would report a deleted thing
 * alive.
 */
function fileHas(ctx, rel, needle) {
  try {
    const abs = path.join(ctx.root, norm(rel));
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size > MAX_BYTES) return false;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8192).includes(0)) return false;
    return buf.includes(needle);
  } catch (e) {
    return false;
  }
}

/** Corpus files containing `needle`. `cap` stops the scan early. */
function filesMatching(ctx, needle, cap) {
  const hits = [];
  for (const rel of corpus(ctx)) {
    if (fileHas(ctx, rel, needle)) {
      hits.push(rel);
      if (cap && hits.length >= cap) break;
    }
  }
  return hits;
}

// ─── the index ───────────────────────────────────────────────────────────────

/**
 * The last line per id, in first-seen order, plus the 1-based numbers of lines
 * that would not parse. A corrupt line is skipped and REPORTED, never fatal.
 */
function loadIndex(ctx) {
  const byId = new Map();
  const skipped = [];
  let raw;
  try {
    raw = fs.readFileSync(ctx.index, 'utf8');
  } catch (e) {
    return { byId, skipped };
  }
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch (e) {
      skipped.push(i + 1);
      continue;
    }
    if (!rec || typeof rec !== 'object' || !rec.id) {
      skipped.push(i + 1);
      continue;
    }
    byId.set(rec.id, rec);
  }
  return { byId, skipped };
}

/** The persisted shape: a fixed key order, item-level `node` normalised away. */
function serialize(rec) {
  const o = {
    v: 1,
    ts: rec.ts,
    id: rec.id,
    layer: rec.layer,
    by: rec.by,
    status: rec.status,
    name: rec.name,
    words: rec.words,
    commits: rec.commits,
    origin: rec.origin,
    items: rec.items.map((it) => ({ what: it.what, at: it.at, find: it.find })),
  };
  if (rec.status === 'superseded') o.superseded_by = rec.superseded_by;
  if (rec.node) o.node = rec.node;
  return JSON.stringify(o);
}

/** Append lines; a write the filesystem refuses is the one exit-1 case. */
function append(ctx, lines) {
  try {
    fs.mkdirSync(path.dirname(ctx.index), { recursive: true });
    fs.appendFileSync(ctx.index, lines.map((l) => l + '\n').join(''));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'cannot-write-index' };
  }
}

function countLines(ctx) {
  try {
    return fs.readFileSync(ctx.index, 'utf8').split('\n').filter((l) => l.trim()).length;
  } catch (e) {
    return 0;
  }
}

// ─── verification ────────────────────────────────────────────────────────────

/**
 * Two tiers, so a read stays cheap: one file read at the recorded `at` settles
 * the common live case; only a failure costs the corpus-wide search that
 * separates changed from gone.
 *
 * Aggregation: superseded (declared) wins; else ALL items gone -> gone; else
 * ANY item gone or changed -> changed; else live. "ANY gone -> gone" is wrong:
 * an entry with live items is not absent from the source, it lost a capability.
 */
function verifyEntry(ctx, rec) {
  if (rec.status === 'superseded') return { status: 'superseded', repairs: [] };

  const items = Array.isArray(rec.items) ? rec.items : [];
  if (items.length === 0) return { status: rec.status, repairs: [] };

  let gone = 0;
  let changed = 0;
  const repairs = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || !it.find) continue;
    if (inCorpus(ctx, it.at) && fileHas(ctx, it.at, it.find)) continue;

    const hits = filesMatching(ctx, it.find);
    if (hits.length === 0) {
      gone++;
      continue;
    }
    changed++;
    // No automatic repair without a unique match: repointing `at` at the wrong
    // file looks freshly verified, which is worse than an honestly stale one.
    if (hits.length === 1) repairs.push({ index: i, to: hits[0] });
  }

  let status = 'live';
  if (gone === items.length) status = 'gone';
  else if (gone > 0 || changed > 0) status = 'changed';
  return { status, repairs };
}

// ─── write ───────────────────────────────────────────────────────────────────

function performWrite(ctx, raw) {
  let rec;
  try {
    rec = JSON.parse(raw);
  } catch (e) {
    return refused('invalid-json');
  }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return refused('invalid-json');

  for (const f of REQUIRED) {
    const v = rec[f];
    if (v === undefined || v === null || v === '') return refused('missing-field');
  }
  if (typeof rec.layer !== 'string' || ['product', 'internal'].indexOf(rec.layer) === -1) return refused('missing-field');
  if (typeof rec.by !== 'string' || ['done', 'verify', 'human'].indexOf(rec.by) === -1) return refused('missing-field');
  if (!Array.isArray(rec.commits) || rec.commits.length < 1) return refused('no-commits');
  if (STATUSES.indexOf(rec.status) === -1) return refused('bad-status');
  if (rec.status === 'superseded' && !rec.superseded_by) return refused('superseded-without-by');

  // A superseded line is declared AFTER its replacement deleted its files, so
  // the anchor checks below cannot apply to it. Its pointer is what it carries.
  const superseded = rec.status === 'superseded';
  if (superseded && !loadIndex(ctx).byId.has(rec.superseded_by)) return refused('superseded-by-unknown');

  if (!Array.isArray(rec.items)) return refused('missing-field');
  if (rec.items.length === 0) return refused('no-items');

  const loose = [];
  for (const it of rec.items) {
    if (!it || typeof it !== 'object') return refused('missing-field');
    for (const f of ['what', 'at', 'find']) {
      if (it[f] === undefined || it[f] === null || it[f] === '') return refused('missing-field');
    }
    if (/\s/.test(it.find)) return refused('find-whitespace');

    const at = norm(it.at);
    if (at === 'docs' || at.indexOf('docs/') === 0) return refused('item-in-docs');
    // "Exists but excluded" is what `ignored` means. A superseded line stops
    // here: item-ignored and the anchor search both read the repository NOW.
    if (superseded) continue;
    if (fs.existsSync(path.join(ctx.root, at)) && !inCorpus(ctx, at)) return refused('item-ignored');

    const hits = filesMatching(ctx, it.find, FIND_SCAN_CAP);
    if (hits.length === 0) return refused('find-absent');
    if (hits.length > OVER_MATCH_CEILING) return refused('find-over-matched');
    if (hits.length >= LOOSE_THRESHOLD) loose.push(it.find);
  }

  const created = !fs.existsSync(ctx.index);
  rec.ts = nowTs();
  const appended = append(ctx, [serialize(rec)]);
  if (!appended.ok) return { ok: false, exit: 1, error: appended.error };

  return { ok: true, entry: rec.id, created, lines: countLines(ctx), loose };
}

// ─── read ────────────────────────────────────────────────────────────────────

function performRead(ctx, opts = {}) {
  const { byId, skipped } = loadIndex(ctx);
  const q = String(opts.query === undefined ? '' : opts.query).toLowerCase();
  const layer = opts.layer || '';

  let list = Array.from(byId.values());
  if (layer) list = list.filter((e) => e.layer === layer);

  // `node` is in the haystack because graph history asks with the artefact's
  // BARE NAME; `items[].at` is deliberately NOT, because it is a hint that
  // --repair rewrites and matching it would return an entry on a stale path.
  // PER-TERM, substring, DEDUPED: the score is the count of DISTINCT terms hit.
  const TERMS = [...new Set(q.split(/\s+/).filter(Boolean))];

  // Held beside the entry, not on it: these objects are serialised straight to
  // the caller, and a `_score` property would ship into the JSON.
  const SCORE = new Map();

  list = list.filter((e) => {
    const items = Array.isArray(e.items) ? e.items : [];
    const hay = [e.id, e.name, e.words, e.node || '']
      .concat(items.map((it) => (it && it.what) || ''))
      .concat(items.map((it) => (it && it.find) || ''))
      .join(' ')
      .toLowerCase();
    // An all-whitespace query keeps its old meaning — everything matches.
    if (TERMS.length === 0) {
      SCORE.set(e, 0);
      return true;
    }
    let hits = 0;
    for (const t of TERMS) if (hay.indexOf(t) !== -1) hits += 1;
    SCORE.set(e, hits);
    return hits > 0;
  });

  // Bounded to what MATCHED, never to the file: the sort below ranks on status,
  // so every matched entry must be verified before the cut can choose.
  if (!opts.noVerify) {
    for (const e of list) e.status = verifyEntry(ctx, e).status;
  }

  list.sort((a, b) => {
    const ra = RANK[a.status] === undefined ? 9 : RANK[a.status];
    const rb = RANK[b.status] === undefined ? 9 : RANK[b.status];
    if (ra !== rb) return ra - rb;
    // Score outranks recency: answering more of the query beats being newer.
    const sa = SCORE.get(a) || 0;
    const sb = SCORE.get(b) || 0;
    if (sa !== sb) return sb - sa;
    if (a.ts !== b.ts) return a.ts < b.ts ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // TWO INDEPENDENT CAPS. The list is sorted live -> changed -> superseded ->
  // gone, so one `slice(0, limit)` always cut from the gone end. NO BACKFILL:
  // unused dead slots never go to live entries.
  const requested = typeof opts.limit === 'string' ? parseInt(opts.limit, 10) : opts.limit;
  const LIVE_CAP = Number.isFinite(requested) && requested > 0 ? Math.trunc(requested) : DEFAULT_LIVE_CAP;
  const DEAD = new Set(['superseded', 'gone']);
  // An unknown status goes in the LIVE bucket — dropping it is the failure the
  // caps exist to fix, and `write` refuses any non-four status anyway.
  const liveList = list.filter((e) => !DEAD.has(e.status));
  const deadList = list.filter((e) => DEAD.has(e.status));

  const returnedLive = liveList.slice(0, LIVE_CAP);
  const returnedDead = deadList.slice(0, DEAD_CAP);

  return {
    ok: true,
    matchedLive: liveList.length,
    matchedDead: deadList.length,
    returnedLive: returnedLive.length,
    returnedDead: returnedDead.length,
    liveCap: LIVE_CAP,
    deadCap: DEAD_CAP,
    skipped,
    entries: [...returnedLive, ...returnedDead],
  };
}

// ─── verify ──────────────────────────────────────────────────────────────────

function performVerify(ctx, opts = {}) {
  const { byId, skipped } = loadIndex(ctx);
  let list = Array.from(byId.values());
  if (opts.id) list = list.filter((e) => e.id === opts.id);

  const newLines = [];
  const results = [];
  let repaired = 0;

  for (const e of list) {
    const r = verifyEntry(ctx, e);
    results.push({ id: e.id, status: r.status });
    if (!opts.repair || r.repairs.length === 0) continue;

    // A repair is a NEW LINE. Nothing is rewritten in place; last line wins.
    const copy = JSON.parse(JSON.stringify(e));
    for (const rep of r.repairs) copy.items[rep.index].at = rep.to;
    copy.ts = nowTs();
    copy.by = 'verify';
    // `changed` on a repaired line means "a pointer was just repaired", not
    // "something is broken here".
    copy.status = 'changed';
    newLines.push(serialize(copy));
    repaired++;
  }

  if (newLines.length) {
    const appended = append(ctx, newLines);
    // On a refused repair append the already-computed results are returned so
    // the entry can print them before the ERROR line, as the shell did.
    if (!appended.ok) return { ok: false, exit: 1, error: appended.error, results };
  }

  return { ok: true, results, repaired, skipped };
}

// ─── touched ─────────────────────────────────────────────────────────────────

/**
 * Every delivery's commit, in ONE git walk. `-p` over the index gives each
 * commit with its added lines; an id first seen on a `+` line going backwards
 * is the commit that introduced it.
 *
 * FIRST PARENT: a merge commit is what delivers. `--first-parent -m` reads the
 * merge diffed against its first parent, which is the whole delivery, instead
 * of naming the branch commit that touched only docs/. Newest first, so the
 * LAST assignment for an id is its oldest commit — the introducing one.
 */
function deliveryCommits(ctx) {
  const log = git(ctx, ['log', '--first-parent', '-m', '--format=C %h', '-p', '--', 'docs/delivered.jsonl']);
  if (log === null) return null;
  const owner = new Map();
  let sha = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('C ')) {
      sha = line.slice(2).trim();
      continue;
    }
    if (!sha || line.charAt(0) !== '+') continue;
    const m = line.match(/"id":"([^"]+)"/);
    if (m) owner.set(m[1], sha);
  }
  return owner;
}

/** First-parent commits that touched anything outside `docs/`. `null` when git cannot answer. */
function nonDocsCommits(ctx) {
  const res = git(ctx, ['log', '--first-parent', '--format=%h', '--', '.', ':(exclude)docs']);
  if (res === null) return null;
  return new Set(res.split('\n').map((x) => x.trim()).filter(Boolean));
}

/** First-parent commits touching one path. `null` when git cannot answer. */
function commitsTouching(ctx, p) {
  const res = git(ctx, ['log', '--first-parent', '--format=%h', '--', p]);
  if (res === null) return null;
  return new Set(res.split('\n').map((x) => x.trim()).filter(Boolean));
}

function performTouched(ctx, opts = {}) {
  const wanted = (Array.isArray(opts.paths) ? opts.paths : [])
    .map((x) => norm(String(x).trim()))
    .filter(Boolean);
  const { byId, skipped } = loadIndex(ctx);

  const owners = deliveryCommits(ctx);
  const nonDocs = nonDocsCommits(ctx);
  const touching = new Map();
  for (const w of wanted) touching.set(w, commitsTouching(ctx, w));

  const complete = [];
  const curated = [];
  let curatedOnly = 0;

  for (const e of Array.from(byId.values())) {
    const sha = owners ? owners.get(e.id) || null : null;

    // A commit that changed nothing outside docs/ describes the recording, not
    // the delivery. A history git cannot walk lands here too. Both mean the
    // same to a caller: the commit cannot answer, the anchors can.
    const usable = sha !== null && nonDocs !== null && nonDocs.has(sha);

    const hitComplete = usable
      ? wanted.filter((w) => {
        const s = touching.get(w);
        return s !== null && s !== undefined && s.has(sha);
      })
      : [];
    if (hitComplete.length) {
      complete.push(Object.assign({}, e, { answer: 'complete', commit: sha, matched: hitComplete }));
      continue;
    }

    // `at` is a hint that --repair rewrites, so the ENTRY's verified status
    // travels with the hit. `answer` — never `layer` — is the answer field,
    // because `layer` is the record's own product|internal field.
    const items = Array.isArray(e.items) ? e.items : [];
    const hitCurated = [];
    for (const it of items) {
      if (!it || !it.at) continue;
      if (wanted.indexOf(norm(it.at)) !== -1) hitCurated.push({ at: norm(it.at), what: it.what, find: it.find });
    }
    if (hitCurated.length) {
      const status = opts.noVerify ? e.status : verifyEntry(ctx, e).status;
      curated.push(Object.assign({}, e, { status, answer: 'curated', commit: sha, matched: hitCurated }));
      // SCOPED TO THE ANSWER, never to the index: counting every unusable entry
      // would be a constant per repository.
      if (!usable) curatedOnly++;
    }
  }

  return {
    ok: true,
    complete,
    curated,
    curatedOnly,
    // An empty answer and an absent index are different facts.
    indexPresent: byId.size > 0,
    skipped,
  };
}

module.exports = {
  STATUSES,
  RANK,
  REQUIRED,
  DEFAULT_LIVE_CAP,
  DEAD_CAP,
  norm,
  nowTs,
  resolveRoot,
  createContext,
  git,
  corpus,
  inCorpus,
  fileHas,
  filesMatching,
  loadIndex,
  serialize,
  countLines,
  verifyEntry,
  performWrite,
  performRead,
  performVerify,
  performTouched,
  deliveryCommits,
  nonDocsCommits,
  commitsTouching,
};

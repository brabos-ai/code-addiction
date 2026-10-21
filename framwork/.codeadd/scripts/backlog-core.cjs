/**
 * backlog-core.cjs — Defaults, validation, and operation orchestration.
 *
 * Exposes one executeBacklog operation taking an explicit absolute root,
 * a normalized mode, mode-specific fields, raw record text for record modes,
 * and a supplied newId for add. No argv/stdin/stdout, no process exit,
 * no shell/Git, no cwd mutation.
 */

const storage = require('./backlog-storage.cjs');

const DEFAULT_DEFS = {
  columns: [
    { name: 'backlog',  order: 1, label: 'Backlog'  },
    { name: 'shaping',  order: 2, label: 'Shaping'  },
    { name: 'planning', order: 3, label: 'Planning' },
    { name: 'building', order: 4, label: 'Building' },
    { name: 'review',   order: 5, label: 'Review'   },
    { name: 'release',  order: 6, label: 'Release'  },
    { name: 'done',     order: 7, label: 'Done'     },
    { name: 'dropped',  order: 8, label: 'Dropped', hidden: true }
  ],
  statuses: [
    { name: 'open',      order: 1, column: 'backlog',  label: 'Open',       means: 'decided, nobody picked it up' },
    { name: 'refining',  order: 2, column: 'shaping',  label: 'Refining',   means: 'add-brainstorm or add-new running' },
    { name: 'shaped',    order: 3, column: 'shaping',  label: 'Shaped',     means: 'about.md exists, waiting to plan' },
    { name: 'planning',  order: 4, column: 'planning', label: 'Planning',   means: 'add-plan running' },
    { name: 'planned',   order: 5, column: 'planning', label: 'Planned',    means: 'plan approved, waiting to build' },
    { name: 'doing',     order: 6, column: 'building', label: 'Doing',      means: 'add-build running' },
    { name: 'in-review', order: 7, column: 'review',   label: 'In review',  means: 'build finished, PR may not exist yet; waiting for review and merge' },
    { name: 'awaiting-release', order: 8, column: 'release', label: 'Awaiting release', means: 'merged, waiting for a release' },
    { name: 'done',      order: 9, column: 'done',     label: 'Done',       means: 'delivered' },
    { name: 'dropped',   order: 10, column: 'dropped', label: 'Dropped',    means: 'decided against' }
  ],
  labels: [
    { name: 'feature',     label: 'Feature',     means: 'new capability' },
    { name: 'bug',         label: 'Bug',         means: 'something broken' },
    { name: 'improvement', label: 'Improvement', means: 'better version of what exists' },
    { name: 'docs',        label: 'Docs',        means: 'documentation only' },
    { name: 'chore',       label: 'Chore',       means: 'upkeep with no user-facing change' }
  ],
  release_flow: false
};

const WRITE_MODES = ['add', 'update', 'comment', 'move', 'remove', 'release', 'release-flow', 'sync-defs'];
const RESERVED = ['id', 'created_at', 'updated_at'];
const REQUIRED = ['title', 'tldr', 'done_when'];

function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function findRow(rows, id) {
  return rows.find(r => r.ticket && r.ticket.id === id) || null;
}

/**
 * Add the seeded entry called `name` to `list` when no entry has that name.
 * It goes right before the first entry already in `list` that the seeded order
 * puts after it, and takes that entry's `order`, pushing it and every later one
 * up by one — the board sorts by `order`, so the new entry lands where the
 * defaults put it. For `awaiting-release` that entry is `done`. With no such
 * entry it goes last.
 */
function addInDefaultOrder(list, name, seeded) {
  if (list.some(e => e && e.name === name)) return;
  const entry = JSON.parse(JSON.stringify(seeded.find(e => e.name === name)));
  let at = -1;
  for (const later of seeded.slice(seeded.findIndex(e => e.name === name) + 1)) {
    at = list.findIndex(e => e && e.name === later.name);
    if (at !== -1) break;
  }
  const orders = list.map(e => (e && Number.isFinite(e.order) ? e.order : 0));
  if (at === -1 || !Number.isFinite(list[at].order)) {
    entry.order = Math.max(0, ...orders) + 1;
    list.push(entry);
    return;
  }
  const pivot = list[at].order;
  for (const e of list) if (e && Number.isFinite(e.order) && e.order >= pivot) e.order += 1;
  entry.order = pivot;
  list.splice(at, 0, entry);
}

/**
 * Add every default status the definitions lack. Pure: no I/O, the argument is
 * not touched. Entries already in the file are never edited, renamed or removed;
 * the only key that moves on one is `order`, shifted to make room. `awaiting-release`
 * is added only when `release_flow` is true. A column is added only when the file
 * already has a `columns` array and an added status names a column it lacks.
 *
 * @returns {{next: object, added: string[]}} added = the status names, in default order
 */
function mergeDefaultStatuses(defs) {
  const next = JSON.parse(JSON.stringify(defs));
  const added = [];
  if (!next || !Array.isArray(next.statuses)) return { next, added };
  for (const seeded of DEFAULT_DEFS.statuses) {
    if (seeded.name === 'awaiting-release' && next.release_flow !== true) continue;
    if (next.statuses.some(e => e && e.name === seeded.name)) continue;
    addInDefaultOrder(next.statuses, seeded.name, DEFAULT_DEFS.statuses);
    added.push(seeded.name);
    if (Array.isArray(next.columns)) addInDefaultOrder(next.columns, seeded.column, DEFAULT_DEFS.columns);
  }
  return { next, added };
}

/**
 * Execute a backlog operation.
 *
 * @param {object} params
 * @param {string} params.root - absolute path to the project root
 * @param {string} params.mode - one of: list, search, get, add, update, comment, move, remove,
 *   release, release-flow, sync-defs
 * @param {string} [params.targetId] - ticket id for update/comment/remove/move
 * @param {string} [params.moveDir] - 'top'|'bottom'|'after' for move
 * @param {string} [params.moveAnchor] - anchor id for move --after
 * @param {string} [params.filter] - status filter for list ('open' or '*')
 * @param {string} [params.query] - search query
 * @param {string} [params.rawRecord] - raw JSON text for add/update/comment
 * @param {string} [params.newId] - allocated id for add
 * @param {string} [params.version] - the release name for release
 * @param {string} [params.flag] - 'on'|'off' for release-flow
 * @returns {object} result
 */
function executeBacklog(params) {
  const { root, mode } = params;
  const isWrite = WRITE_MODES.includes(mode);

  // Argument checks come before anything is read or seeded: a refused call writes nothing.
  if (mode === 'release' && (typeof params.version !== 'string' || params.version === '' || /\s/.test(params.version))) {
    return { ok: false, refusal: 'bad-version', diagnostics: [] };
  }
  if (mode === 'release-flow' && params.flag !== 'on' && params.flag !== 'off') {
    return { ok: false, refusal: 'bad-flag', diagnostics: [] };
  }

  // sync-defs reads only the definitions file. An absent one stays absent (reads already
  // fall back to the defaults); a file the core cannot parse is never overwritten.
  if (mode === 'sync-defs') {
    const found = storage.readDefs(root);
    if (found.status === 'absent') return { ok: true, defsAdded: [], diagnostics: [] };
    if (found.status === 'invalid') return { ok: false, refusal: 'definitions-unreadable', diagnostics: [] };
    const merged = mergeDefaultStatuses(found.defs);
    if (merged.added.length) {
      try { storage.writeDefs(root, merged.next); }
      catch { return { ok: false, writeFailure: 'definitions' }; }
    }
    return { ok: true, defsAdded: merged.added, diagnostics: [] };
  }

  // Load board first, then definitions
  const board = storage.readBoard(root);
  const defsResult = storage.readDefs(root);

  // Choose effective definitions
  let defs;
  let defsProvenance;
  if (defsResult.status === 'usable') {
    defs = defsResult.defs;
    defsProvenance = 'file';
  } else if (defsResult.status === 'absent') {
    if (isWrite) {
      // Seed absent definitions for writes
      try { storage.writeDefs(root, DEFAULT_DEFS); }
      catch { return { ok: false, writeFailure: 'definitions' }; }
      defs = DEFAULT_DEFS;
      defsProvenance = 'seeded';
    } else {
      defs = DEFAULT_DEFS;
      defsProvenance = 'default';
    }
  } else {
    // invalid — fall back to defaults, report diagnostic
    defs = DEFAULT_DEFS;
    defsProvenance = 'fallback';
  }

  const diagnostics = [];
  if (defsResult.status === 'invalid' && defsResult.diagnostic === 'json-error') {
    diagnostics.push({ key: 'DEFS_UNREADABLE', value: 'yes' });
  }

  // A status the file lacks but the defaults carry is accepted, and the merged definitions are
  // held back: they are written right before the board, after every other check, so a refused
  // write leaves both files untouched.
  let mergedDefs = null;
  let defsAdded = [];
  const knowsStatus = (status) => {
    if (defs.statuses.some(s => s.name === status)) return true;
    if (defsProvenance !== 'file') return false;
    const merged = mergeDefaultStatuses(defs);
    if (!merged.added.includes(status)) return false;
    mergedDefs = merged.next;
    defsAdded = merged.added;
    return true;
  };
  const writeMergedDefs = () => {
    if (!mergedDefs) return true;
    try { storage.writeDefs(root, mergedDefs); return true; }
    catch { return false; }
  };

  // Parse record for write modes that need it
  let record = null;
  if (['update', 'comment'].includes(mode) && !findRow(board.rows, params.targetId)) {
    return { ok: false, refusal: 'unknown-id', diagnostics };
  }
  if (['add', 'update', 'comment'].includes(mode)) {
    try {
      record = JSON.parse(params.rawRecord || '');
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return { ok: false, refusal: 'invalid-json', diagnostics };
      }
    } catch (e) {
      return { ok: false, refusal: 'invalid-json', diagnostics };
    }
  }

  // ── Writes ──────────────────────────────────────────────────────────────

  if (mode === 'add') {
    // Validate record
    for (const f of RESERVED) {
      if (Object.prototype.hasOwnProperty.call(record, f)) {
        return { ok: false, refusal: 'reserved-field', diagnostics };
      }
    }
    for (const f of REQUIRED) {
      if (typeof record[f] !== 'string' || record[f].trim() === '') {
        return { ok: false, refusal: 'missing-field', diagnostics };
      }
    }
    const status = typeof record.status === 'string' && record.status !== '' ? record.status : 'open';
    if (!knowsStatus(status)) {
      return { ok: false, refusal: 'unknown-status', diagnostics };
    }
    if (findRow(board.rows, params.newId)) {
      return { ok: false, refusal: 'duplicate-id', diagnostics };
    }

    const ts = now();
    const ticket = {
      id: params.newId,
      title: record.title,
      theme: typeof record.theme === 'string' ? record.theme : '',
      labels: Array.isArray(record.labels) ? record.labels : [],
      tldr: record.tldr,
      notes: Array.isArray(record.notes) ? record.notes : [],
      done_when: record.done_when,
      paths: Array.isArray(record.paths) ? record.paths : [],
      grounded: record.grounded === true,
      status,
      created_at: ts,
      updated_at: ts,
      comments: [],
      feature: typeof record.feature === 'string' ? record.feature : null,
      work_id: typeof record.work_id === 'string' ? record.work_id : null,
      release: typeof record.release === 'string' ? record.release : null
    };

    board.rows.push({ n: board.rows.length + 1, text: JSON.stringify(ticket), ticket });
    if (!writeMergedDefs()) return { ok: false, writeFailure: 'definitions' };
    try { storage.writeBoard(root, board.rows); }
    catch { return { ok: false, writeFailure: 'backlog' }; }
    return { ok: true, ticketId: ticket.id, diagnostics, defsProvenance, defsAdded };
  }

  if (mode === 'update' || mode === 'comment') {
    const row = findRow(board.rows, params.targetId);
    if (!row) return { ok: false, refusal: 'unknown-id', diagnostics };
    const t = row.ticket;

    if (mode === 'update') {
      for (const f of RESERVED) {
        if (Object.prototype.hasOwnProperty.call(record, f)) {
          return { ok: false, refusal: 'reserved-field', diagnostics };
        }
      }
      for (const f of REQUIRED) {
        if (Object.prototype.hasOwnProperty.call(record, f)) {
          if (typeof record[f] !== 'string' || record[f].trim() === '') {
            return { ok: false, refusal: 'missing-field', diagnostics };
          }
        }
      }
      if (Object.prototype.hasOwnProperty.call(record, 'status')) {
        if (!knowsStatus(record.status)) {
          return { ok: false, refusal: 'unknown-status', diagnostics };
        }
      }
      if (Object.prototype.hasOwnProperty.call(record, 'comments')) {
        return { ok: false, refusal: 'reserved-field', diagnostics };
      }
      for (const k of Object.keys(record)) t[k] = record[k];
    } else {
      if (typeof record.content !== 'string' || record.content.trim() === '') {
        return { ok: false, refusal: 'missing-field', diagnostics };
      }
      t.comments = Array.isArray(t.comments) ? t.comments : [];
      t.comments.push({ content: record.content, created_at: now() });
    }

    t.updated_at = now();
    row.text = JSON.stringify(t);
    if (!writeMergedDefs()) return { ok: false, writeFailure: 'definitions' };
    try { storage.writeBoard(root, board.rows); }
    catch { return { ok: false, writeFailure: 'backlog' }; }
    return { ok: true, ticketId: t.id, diagnostics, defsAdded };
  }

  if (mode === 'remove') {
    const row = findRow(board.rows, params.targetId);
    if (!row) return { ok: false, refusal: 'unknown-id', diagnostics };
    try { storage.writeBoard(root, board.rows.filter(r => r !== row)); }
    catch { return { ok: false, writeFailure: 'backlog' }; }
    return { ok: true, ticketId: params.targetId, diagnostics };
  }

  if (mode === 'move') {
    const row = findRow(board.rows, params.targetId);
    if (!row) return { ok: false, refusal: 'unknown-id', diagnostics };
    const rest = board.rows.filter(r => r !== row);
    let next;
    if (params.moveDir === 'top') {
      next = [row].concat(rest);
    } else if (params.moveDir === 'bottom') {
      next = rest.concat([row]);
    } else {
      const anchor = findRow(rest, params.moveAnchor);
      if (!anchor) return { ok: false, refusal: 'unknown-id', diagnostics };
      const at = rest.indexOf(anchor);
      next = rest.slice(0, at + 1).concat([row], rest.slice(at + 1));
    }
    try { storage.writeBoard(root, next); }
    catch { return { ok: false, writeFailure: 'backlog' }; }
    return { ok: true, ticketId: params.targetId, diagnostics };
  }

  if (mode === 'release') {
    // Every ticket waiting for this release is closed with the version, in one file write.
    // A ticket whose `release` field or `release:<x>` label names another version is skipped.
    // Versions compare without a leading v; the version is written exactly as given.
    const bare = (v) => String(v).trim().replace(/^v/i, '');
    const wanted = bare(params.version);
    const namesOther = (t) => {
      const declared = [];
      if (t.release !== undefined && t.release !== null && String(t.release).trim() !== '') declared.push(t.release);
      for (const l of Array.isArray(t.labels) ? t.labels : []) {
        if (typeof l === 'string' && l.startsWith('release:')) declared.push(l.slice('release:'.length));
      }
      return declared.some((v) => bare(v) !== wanted);
    };
    const ts = now();
    const ticketIds = [];
    const skippedIds = [];
    for (const row of board.rows) {
      const t = row.ticket;
      if (!t || t.status !== 'awaiting-release') continue;
      if (namesOther(t)) { skippedIds.push(t.id); continue; }
      t.release = params.version;
      t.status = 'done';
      t.updated_at = ts;
      row.text = JSON.stringify(t);
      ticketIds.push(t.id);
    }
    if (ticketIds.length) {
      try { storage.writeBoard(root, board.rows); }
      catch { return { ok: false, writeFailure: 'backlog' }; }
    }
    return { ok: true, ticketIds, skippedIds, diagnostics };
  }

  if (mode === 'release-flow') {
    // A file the core cannot parse is never overwritten.
    if (defsResult.status === 'invalid') return { ok: false, refusal: 'definitions-unreadable', diagnostics };
    const next = JSON.parse(JSON.stringify(defs));
    next.release_flow = params.flag === 'on';
    if (params.flag === 'on') {
      addInDefaultOrder(next.statuses, 'awaiting-release', DEFAULT_DEFS.statuses);
      if (Array.isArray(next.columns)) addInDefaultOrder(next.columns, 'release', DEFAULT_DEFS.columns);
    }
    // Written only when something changed, so a hand-formatted file is not reformatted for nothing.
    if (JSON.stringify(next) !== JSON.stringify(defs)) {
      try { storage.writeDefs(root, next); }
      catch { return { ok: false, writeFailure: 'definitions' }; }
    }
    return { ok: true, releaseFlow: params.flag, diagnostics };
  }

  // ── Reads ───────────────────────────────────────────────────────────────

  const parsed = board.rows.filter(r => r.ticket);
  const damaged = board.rows.filter(r => !r.ticket);

  // Global status counts over the WHOLE board, before any filter, in
  // first-occurrence order. Entries, not an object, so the adapter can
  // serialize the ordering without depending on enumeration order, and
  // numeric-status names never collide with object prototype keys.
  const statusCountMap = new Map();
  for (const r of parsed) {
    const s = r.ticket.status;
    if (typeof s === 'string') {
      statusCountMap.set(s, (statusCountMap.get(s) || 0) + 1);
    }
  }
  const statusCounts = [...statusCountMap.entries()];

  let hits = parsed;
  if (mode === 'get') {
    // The exact detail read: an exact, case-sensitive id match with no
    // status filter — the one read that returns a ticket's whole body.
    hits = parsed.filter(r => r.ticket.id === params.targetId);
  } else if (mode === 'list') {
    const filter = params.filter || 'open';
    if (filter !== '*') hits = parsed.filter(r => r.ticket.status === filter);
  } else if (mode === 'search') {
    const q = String(params.query || '').toLowerCase();
    hits = parsed.filter(r => {
      const t = r.ticket;
      // Exact id equality, case-insensitive, joins the text fields — a
      // target known by id is answered by search without separating reads.
      if (typeof t.id === 'string' && t.id.toLowerCase() === q) return true;
      const hay = [t.title || '', t.tldr || ''].concat(Array.isArray(t.notes) ? t.notes : []).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  // Undefined statuses: first-seen unique across all parsed rows
  const defined = new Set(defs.statuses.map(s => s.name));
  const undef = [];
  for (const r of parsed) {
    if (!defined.has(r.ticket.status) && !undef.includes(r.ticket.status)) {
      undef.push(r.ticket.status);
    }
  }

  return {
    ok: true,
    read: true,
    present: board.present,
    total: parsed.length,
    returned: hits.length,
    damaged: damaged.map(d => d.n),
    undefinedStatuses: undef,
    statusCounts,
    rows: hits.map(r => r.text),
    tickets: hits.map(r => r.ticket),
    diagnostics,
    defsProvenance,
    defsStatus: defsResult.status,
    defs: defsResult.status === 'usable' ? defsResult.defs : null,
    releaseFlow: defsResult.status === 'usable' && defsResult.defs.release_flow === true
  };
}

module.exports = { executeBacklog, mergeDefaultStatuses, DEFAULT_DEFS };

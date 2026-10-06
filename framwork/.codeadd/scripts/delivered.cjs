/**
 * delivered.cjs — The per-project delivery index entry point.
 *
 * The native replacement for delivered.sh. It owns argv parsing, the
 * KEY=VALUE + JSONL protocol, the process exit codes and stdin; every domain
 * rule lives in the side-effect-free `delivery-index-core.cjs` beside it.
 *
 * Usage: node .codeadd/scripts/delivered.cjs write < record.json
 *        node .codeadd/scripts/delivered.cjs read <query> [--layer product|internal] [--limit N] [--no-verify]
 *        node .codeadd/scripts/delivered.cjs verify [<id>] [--repair]
 *        node .codeadd/scripts/delivered.cjs touched <path> [<path>...]
 *
 * Dependencies: Node >= 22.19.0 built-ins and git. No bash, no WSL. The entry IS a
 * Node program, so the shell's separate `node` lookup (`ERROR=node-missing`) is
 * retired; the surviving hard dependency is git, for the corpus, and an unmet
 * one is an `ERROR=` value distinct from `REFUSED=`, exit 2.
 *
 * Output: KEY=VALUE lines, plus JSONL entries on `read`/`touched`. A line
 * starting with `{` is an entry; anything else is a key.
 *
 * Exits: 0 for probe results — `read`, `verify` and `touched` always exit 0,
 *        including on an absent index. 1 ONLY when the filesystem refuses a
 *        write. 2 for caller error: a bad mode, bad arguments, a record
 *        breaking a hard ban (REFUSED=<name>), or a missing git root
 *        (ERROR=not-a-git-repository).
 */

'use strict';

const fs = require('node:fs');
const core = require('./delivery-index-core.cjs');

const USAGE = [
  'Usage: node .codeadd/scripts/delivered.cjs write < record.json',
  '       node .codeadd/scripts/delivered.cjs read <query> [--layer product|internal] [--limit N] [--no-verify]',
  '       node .codeadd/scripts/delivered.cjs verify [<id>] [--repair]',
  '       node .codeadd/scripts/delivered.cjs touched <path> [<path>...]',
].join('\n') + '\n';

function usage() {
  process.stderr.write(USAGE);
}

/**
 * Parse the argument grammar exactly as delivered.sh did. Returns
 * `{ ok:false }` for every misuse so the caller can print usage and exit 2.
 */
function parseInvocation(argv) {
  const args = [...argv];
  const mode = args[0] || '';
  if (!mode) return { ok: false };
  args.shift();

  if (mode === 'write') {
    if (args.length !== 0) return { ok: false };
    return { ok: true, mode };
  }

  if (mode === 'read') {
    const query = args[0] || '';
    if (!query) return { ok: false };
    args.shift();

    let layer = '';
    let limit = '5'; // the LIVE cap; the dead cap is fixed in the core
    let noVerify = false;
    while (args.length > 0) {
      const a = args[0];
      if (a === '--layer') {
        const v = args[1] === undefined ? '' : args[1];
        if (!v) return { ok: false };
        layer = v;
        args.splice(0, 2);
      } else if (a === '--limit') {
        limit = args[1] === undefined ? '' : args[1];
        args.splice(0, 2);
      } else if (a === '--no-verify') {
        noVerify = true;
        args.shift();
      } else {
        return { ok: false };
      }
    }
    if (layer !== '' && layer !== 'product' && layer !== 'internal') return { ok: false };
    if (!/^[0-9]+$/.test(limit)) return { ok: false };
    const parsed = parseInt(limit, 10);
    if (!(parsed > 0)) return { ok: false };
    return { ok: true, mode, query, layer, limit: parsed, noVerify };
  }

  if (mode === 'verify') {
    let id = '';
    let repair = false;
    while (args.length > 0) {
      const a = args[0];
      if (a === '--repair') {
        repair = true;
        args.shift();
      } else if (a.startsWith('--')) {
        return { ok: false };
      } else {
        if (id) return { ok: false };
        id = a;
        args.shift();
      }
    }
    return { ok: true, mode, id, repair };
  }

  if (mode === 'touched') {
    if (args.length === 0) return { ok: false };
    return { ok: true, mode, paths: args };
  }

  return { ok: false };
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (e) {
    return '';
  }
}

function write(text) {
  process.stdout.write(text);
}

function main(argv) {
  const inv = parseInvocation(argv);
  if (!inv.ok) {
    usage();
    process.exit(2);
  }

  const rootRes = core.resolveRoot(process.cwd());
  if (!rootRes.ok) {
    write('ERROR=' + rootRes.error + '\n');
    process.exit(2);
  }
  const ctx = core.createContext({ root: rootRes.root });

  if (inv.mode === 'write') {
    const r = core.performWrite(ctx, readStdin());
    if (!r.ok) {
      if (r.refused) {
        write('REFUSED=' + r.refused + '\n');
        process.exit(2);
      }
      write('ERROR=' + r.error + '\n');
      process.exit(r.exit || 1);
    }
    let out = 'ENTRY=' + r.entry + '\n';
    out += 'CREATED=' + String(r.created) + '\n';
    out += 'LINES=' + String(r.lines) + '\n';
    for (const f of r.loose) out += 'LOOSE=' + f + '\n';
    write(out);
    process.exit(0);
  }

  if (inv.mode === 'read') {
    const r = core.performRead(ctx, inv);
    let out = 'MATCHED_LIVE=' + String(r.matchedLive) + '\n';
    out += 'MATCHED_DEAD=' + String(r.matchedDead) + '\n';
    out += 'RETURNED_LIVE=' + String(r.returnedLive) + '\n';
    out += 'RETURNED_DEAD=' + String(r.returnedDead) + '\n';
    out += 'LIVE_CAP=' + String(r.liveCap) + '\n';
    out += 'DEAD_CAP=' + String(r.deadCap) + '\n';
    out += 'SKIPPED_LINES=' + r.skipped.join(',') + '\n';
    for (const e of r.entries) out += JSON.stringify(e) + '\n';
    write(out);
    process.exit(0);
  }

  if (inv.mode === 'verify') {
    const r = core.performVerify(ctx, inv);
    let out = '';
    for (const x of r.results) out += x.id + '=' + x.status + '\n';
    if (!r.ok) {
      out += 'ERROR=' + r.error + '\n';
      write(out);
      process.exit(r.exit || 1);
    }
    out += 'REPAIRED=' + String(r.repaired) + '\n';
    out += 'SKIPPED_LINES=' + r.skipped.join(',') + '\n';
    write(out);
    process.exit(0);
  }

  if (inv.mode === 'touched') {
    const r = core.performTouched(ctx, inv);
    let out = 'TOUCHED_COMPLETE=' + String(r.complete.length) + '\n';
    out += 'TOUCHED_CURATED=' + String(r.curated.length) + '\n';
    out += 'CURATED_ONLY=' + String(r.curatedOnly) + '\n';
    out += 'INDEX_PRESENT=' + (r.indexPresent ? '1' : '0') + '\n';
    out += 'SKIPPED_LINES=' + r.skipped.join(',') + '\n';
    for (const e of r.complete) out += JSON.stringify(e) + '\n';
    for (const e of r.curated) out += JSON.stringify(e) + '\n';
    write(out);
    process.exit(0);
  }

  // parseInvocation admits only the four modes above.
  usage();
  process.exit(2);
}

module.exports = { parseInvocation, main, USAGE, core };

if (require.main === module) {
  main(process.argv.slice(2));
}

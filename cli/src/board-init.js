import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { log } from '@clack/prompts';
import { readManifest } from './injection-core.js';

/**
 * Enabling the `board` feature creates the board: it runs the shipped
 * `.codeadd/scripts/board-init.cjs` in the project, which writes
 * `.codeadd/board.json`, pushes the orphan `board` branch to `origin`, makes the
 * clone and stages the config. The explicit enable is the consent; the only push is
 * the `board` branch, never code.
 *
 * Only the enable of `board`, in project scope, with no `.codeadd/board.json` yet.
 * Every failure is ONE warning line and never changes the enable's result: a missing
 * origin, an empty remote or a refused push must not undo a feature the user asked for.
 */

const SCRIPT = path.join('.codeadd', 'scripts', 'board-init.cjs');
const CONFIG = path.join('.codeadd', 'board.json');
const RUN_LATER = 'node .codeadd/scripts/board-init.cjs';
const TIMEOUT_MS = 120_000;

/** Run the script with the project as cwd. */
function defaultExec(ctx) {
  return spawnSync(process.execPath, [ctx.script], { cwd: ctx.cwd, encoding: 'utf8', timeout: TIMEOUT_MS });
}

let boardInitExec = defaultExec;

/**
 * Test seam: replace the spawn. Pass null (or nothing) to restore the real one.
 * @param {((ctx: {cwd: string, script: string}) => {status: number|null, stdout?: string, error?: Error, signal?: string|null})|null} [fn]
 */
export function setBoardInitExec(fn) {
  boardInitExec = fn ?? defaultExec;
}

function parseReport(stdout) {
  const kv = {};
  for (const raw of String(stdout ?? '').split('\n')) {
    const line = raw.replace(/\r$/, '');
    const eq = line.indexOf('=');
    if (eq > 0 && /^[A-Z_]+$/.test(line.slice(0, eq))) kv[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return kv;
}

function warnLater(why) {
  log.warn(`The board was not created (${why}). Fix that, then run: ${RUN_LATER}`);
}

/**
 * @param {string} cwd  the scope-resolved install root
 * @param {string} name  the feature being enabled
 * @param {{scope?: 'project'|'global', exec?: Function}} [options]
 *   `scope` defaults to the manifest's, then to `project`.
 * @returns {{status: 'skipped'|'created'|'ready'|'failed'}}
 */
export function initBoardOnEnable(cwd, name, { scope, exec } = {}) {
  if (name !== 'board') return { status: 'skipped' };
  if ((scope ?? readManifest(cwd)?.scope ?? 'project') !== 'project') return { status: 'skipped' };
  if (fs.existsSync(path.join(cwd, CONFIG))) return { status: 'skipped' };

  const script = path.join(cwd, SCRIPT);
  if (!fs.existsSync(script)) {
    warnLater('board-init.cjs is not installed');
    return { status: 'failed' };
  }

  let res;
  try {
    res = (exec ?? boardInitExec)({ cwd, script });
  } catch (e) {
    warnLater(e.message.split('\n')[0]);
    return { status: 'failed' };
  }
  if (res.error || res.signal) {
    warnLater(res.error ? res.error.message.split('\n')[0] : `killed by ${res.signal}`);
    return { status: 'failed' };
  }
  const kv = parseReport(res.stdout);
  if (res.status !== 0 || kv.ERROR) {
    warnLater(kv.ERROR ? `ERROR=${kv.ERROR}` : `exit ${res.status}`);
    return { status: 'failed' };
  }
  log.info(`BOARD=${kv.BOARD ?? 'created'}`);
  if (kv.CODE_CHANGES === 'staged') log.info('Commit .codeadd/board.json so the team shares the board.');
  return { status: kv.BOARD === 'ready' ? 'ready' : 'created' };
}

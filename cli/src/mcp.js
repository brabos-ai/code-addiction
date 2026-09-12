import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * `codeadd mcp` — hand the process to the graph server.
 *
 * The server source lives in `mcp/` at the repository root and `scripts/build.js`
 * copies it to `cli/src/mcp/` before publish, so this module is a thin bridge
 * between the CLI's dispatch and a directory that is generated rather than
 * authored. It is separate from every other subcommand for one reason:
 *
 * ⛔ NOTHING ON THIS PATH MAY WRITE TO STDOUT except a JSON-RPC frame.
 *
 * Every other subcommand reports through `@clack/prompts`, which writes to
 * stdout. One `intro()` or one `outro()` here corrupts the stream and the client
 * sees garbage rather than an error. That is why `runCli` routes `mcp` before
 * its own try/catch, and why the failure below is written to stderr by hand.
 */

const PACKAGED = 'mcp/server.mjs';

/** Where the packaged server sits, relative to this file. */
export function serverPath(dir = import.meta.dirname) {
  return path.join(dir, PACKAGED);
}

export function isPackaged(dir = import.meta.dirname) {
  return fs.existsSync(serverPath(dir));
}

/**
 * @param {string[]} argv  everything after the `mcp` subcommand
 * @param {string} [dir]   where to look for the packaged server; the default is
 *                         this file's own directory, and the parameter exists
 *                         so the not-packaged branch is reachable from a test
 *                         after the build has generated the real copy.
 * @returns {Promise<number>} the exit code, never thrown
 */
export async function mcp(argv = [], dir = import.meta.dirname) {
  const target = serverPath(dir);
  if (!fs.existsSync(target)) {
    process.stderr.write(
      `codeadd mcp: the graph server is not packaged in this install (${PACKAGED} is missing).\n` +
        'From a source checkout, run `node scripts/build.js` to generate it.\n',
    );
    return 2;
  }

  const { main } = await import(pathToFileURL(target).href);
  main(argv);
  return process.exitCode ?? 0;
}

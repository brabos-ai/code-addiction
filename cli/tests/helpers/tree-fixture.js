import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A shared, on-demand copy of the real built tree, for the suites that need a
 * writable project root to run enable/disable against.
 *
 * Four test files used to carry their own version of this: a top-level
 * `beforeEach` that copied `framwork/.claude` and `framwork/.codeadd` into a
 * temp dir, normalized line endings across every file in the copy, and deleted
 * the lot afterwards. The copy is correct. Its placement was not — in
 * qa-reachability.smoke.test.js only 5 of 43 tests ever opened the result, and
 * the other 38 paid ~2.4s each for a directory they never touched. That one
 * file was 55.7% of the whole suite's serial runtime.
 *
 * So the cost is inverted here rather than removed. The template is built once
 * per test file, lazily, on the first `root()` call; each call after that
 * copies the template instead of re-reading the source, and a test that never
 * calls `root()` pays nothing at all.
 *
 * Isolation is unchanged: every `root()` call returns its own directory, so two
 * tests can never see each other's writes.
 *
 * Usage — one handle per test file, at module scope:
 *
 *   const fixture = treeFixture({
 *     prefix: 'qa-reach-',
 *     copy: [
 *       { src: 'framwork/.claude', dest: '.claude' },
 *       { src: 'framwork/.codeadd', dest: '.codeadd' },
 *     ],
 *     manifest: { at: '.codeadd/manifest.json', data: { ... } },
 *     normalize: true,
 *   });
 *
 *   afterEach(() => fixture.cleanup());
 *   afterAll(() => fixture.dispose());
 *
 *   it('...', () => { const cwd = fixture.root(); ... });
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

/**
 * A real installed project carries LF files, because the release ZIP is built
 * on CI. A Windows checkout with core.autocrlf=true materializes CRLF instead,
 * which the LF-based injection regexes do not match — so a caller that wants
 * the fixture to reproduce the real installed state asks for `normalize: true`.
 *
 * It runs on the template, once, rather than on every handed-out copy.
 */
function normalizeLineEndings(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) normalizeLineEndings(p);
    else if (/\.(md|json)$/.test(entry.name)) {
      const raw = fs.readFileSync(p, 'utf8');
      if (raw.includes('\r\n')) fs.writeFileSync(p, raw.replaceAll('\r\n', '\n'), 'utf8');
    }
  }
}

/**
 * @param {object} opts
 * @param {string} opts.prefix        mkdtemp prefix, so a leak is traceable to its file
 * @param {{src: string, dest: string}[]} opts.copy
 *        `src` absolute, or relative to the repository root — the shape
 *        `PROVIDERS` already carries. A `src` that does not exist is skipped:
 *        a provider whose tree has not been built is a normal state.
 * @param {{at: string, data: object}} [opts.manifest]  written into every copy
 * @param {boolean} [opts.normalize=false]  CRLF → LF across .md and .json
 */
export function treeFixture({ prefix, copy, manifest = null, normalize = false }) {
  let template = null;
  const handedOut = [];

  function buildTemplate() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}template-`));
    for (const { src, dest } of copy) {
      const from = path.isAbsolute(src) ? src : path.join(REPO_ROOT, src);
      if (!fs.existsSync(from)) continue;
      fs.cpSync(from, path.join(dir, dest), { recursive: true });
    }
    if (normalize) normalizeLineEndings(dir);
    if (manifest) {
      const at = path.join(dir, manifest.at);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, JSON.stringify(manifest.data, null, 2));
    }
    return dir;
  }

  return {
    /** A private copy of the template. Build it on the first call, never before. */
    root() {
      template ??= buildTemplate();
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
      fs.cpSync(template, dir, { recursive: true });
      handedOut.push(dir);
      return dir;
    },

    /** Per test. Safe to call when nothing was handed out, and after a throw. */
    cleanup() {
      while (handedOut.length) {
        fs.rmSync(handedOut.pop(), { recursive: true, force: true });
      }
    },

    /** Per file. Reclaims the template too, so nothing outlives the run. */
    dispose() {
      this.cleanup();
      if (template) {
        fs.rmSync(template, { recursive: true, force: true });
        template = null;
      }
    },
  };
}

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
 * the other 38 paid for a directory they never touched. On the clean checkout
 * this change was built against, that one file took 75.5s of a 164s serial
 * run: 46% of the suite, ~1.8s per test, for a fixture 88% of its tests did
 * not open.
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
 * @param {{src: string, dest: string, optional?: boolean}[]} opts.copy
 *        `src` absolute, or relative to the repository root — the shape
 *        `PROVIDERS` already carries.
 *
 *        A missing `src` THROWS unless the entry sets `optional: true`. Every
 *        one of these trees is gitignored build output, so "missing" means
 *        `node scripts/build.js` has not run — which three of the four callers
 *        declare as a precondition in their own file header, and used to fail
 *        loudly on because their hook copied unguarded. Only
 *        injection-exclusivity wants the skip, for provider directories that
 *        legitimately may not have been built.
 * @param {{at: string, data: object}} [opts.manifest]  written into every copy
 * @param {boolean} [opts.normalize=false]  CRLF → LF across .md and .json
 */
export function treeFixture({ prefix, copy, manifest = null, normalize = false }) {
  let template = null;
  const handedOut = [];
  // Every template directory this fixture has created, complete or not. A
  // buildTemplate() that throws half way through still leaves one behind, and
  // an untracked one leaks once per attempt.
  const scratch = [];

  function buildTemplate() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}template-`));
    scratch.push(dir);
    for (const { src, dest, optional = false } of copy) {
      const from = path.isAbsolute(src) ? src : path.join(REPO_ROOT, src);
      if (!fs.existsSync(from)) {
        if (optional) continue;
        throw new Error(
          `tree-fixture: required source is missing: ${from}\n` +
            'These trees are build output. Run `node scripts/build.js` first.',
        );
      }
      fs.cpSync(from, path.join(dir, dest), { recursive: true });
    }
    if (normalize) normalizeLineEndings(dir);
    if (manifest) {
      const at = path.join(dir, manifest.at);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, JSON.stringify(manifest.data, null, 2));
    }
    // Assigned last, and only here: a half-built directory must never become
    // the thing root() copies. A caller that retries after a failure builds a
    // fresh one, and `scratch` still reclaims the abandoned attempt.
    template = dir;
  }

  const fixture = {
    /** A private copy of the template. Build it on the first call, never before. */
    root() {
      if (template === null) buildTemplate();
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
      // Tracked before the copy, for the same reason `scratch` is.
      handedOut.push(dir);
      fs.cpSync(template, dir, { recursive: true });
      return dir;
    },

    /** Per test. Safe to call when nothing was handed out, and after a throw. */
    cleanup() {
      while (handedOut.length) {
        fs.rmSync(handedOut.pop(), { recursive: true, force: true });
      }
    },

    /** Per file. Reclaims every template attempt too, so nothing outlives the run. */
    dispose() {
      fixture.cleanup();
      while (scratch.length) {
        fs.rmSync(scratch.pop(), { recursive: true, force: true });
      }
      template = null;
    },
  };

  return fixture;
}

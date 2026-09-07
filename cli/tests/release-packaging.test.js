import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const { SIDECARS } = createRequire(import.meta.url)('../../scripts/build.js');

/**
 * Release packaging guard.
 *
 * The release ZIP is assembled by the "Package framework zip" step in
 * .github/workflows/release.yml via a `for subdir in <list>; do ... zip` loop.
 * Only the directories named in that list ship to users. The installer then
 * copies everything under `framwork/.codeadd/` from the ZIP, so any post-install
 * runtime asset dir under `.codeadd/` that is omitted from the packaging list is
 * silently never delivered.
 *
 * Regression: `.codeadd/plugins` was missing from the list, so `plugins enable`
 * found no fragments/skills and no-op'd (0 commands, 0 skills). This locks the
 * runtime `.codeadd/*` dirs into the packaging list.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const RELEASE_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release.yml');
const CATALOG = path.join(ROOT, 'cli', 'src', 'plugins.json');

/**
 * Extract the token list from the packaging `for subdir in <list>; do` loop.
 * @returns {string[]}
 */
function packagedSubdirs() {
  const yml = fs.readFileSync(RELEASE_WORKFLOW, 'utf8');
  const match = yml.match(/for subdir in ([^;]+); do/);
  if (!match) throw new Error('packaging loop `for subdir in ...; do` not found in release.yml');
  return match[1].trim().split(/\s+/);
}

describe('release packaging', () => {
  it('ships every post-install runtime .codeadd/* dir', () => {
    const subdirs = packagedSubdirs();
    // These hold assets consumed AFTER install (not build-source compiled into
    // provider dirs). Each must be in the ZIP or the feature breaks at runtime.
    for (const required of ['.codeadd/scripts', '.codeadd/fragments', '.codeadd/templates', '.codeadd/plugins']) {
      expect(subdirs, `release.yml packaging list missing ${required}`).toContain(required);
    }
  });

  it('ships .codeadd/plugins whenever the catalog defines plugins', () => {
    const raw = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
    const { '$schema-doc': _doc, ...plugins } = raw;
    if (Object.keys(plugins).length === 0) return; // no plugins → nothing to ship
    expect(packagedSubdirs()).toContain('.codeadd/plugins');
  });

  /**
   * Every build-emitted sidecar must reach BOTH of its non-JS consumers.
   *
   * These levels are DERIVED from `SIDECARS` in scripts/build.js — the build's
   * own list — and never from names written here. That distinction is the whole
   * point. Commit 56bc22d fixed "the registry has three consumers, and the build
   * only checked two"; a test that enumerates sidecar names is that same bug
   * rewritten, because adding a fourth sidecar leaves it green while the file
   * ships to nobody and dirties every working tree.
   *
   * A sidecar is a single file, not a subdir, so the `for subdir` loop never
   * sweeps it up: each needs an explicit line in release.yml and in
   * framwork/.gitignore.
   */
  it('ships every build-emitted sidecar in the release zip', () => {
    const yml = fs.readFileSync(RELEASE_WORKFLOW, 'utf8');

    expect(SIDECARS.length).toBeGreaterThan(0);
    for (const name of SIDECARS) {
      expect(yml, `release.yml does not package ${name} — it would ship to nobody`)
        .toContain(`framwork/.codeadd/${name}`);
    }
  });

  it('gitignores every build-emitted sidecar', () => {
    const ignore = fs.readFileSync(path.join(ROOT, 'framwork', '.gitignore'), 'utf8')
      .split('\n').map((l) => l.trim());

    for (const name of SIDECARS) {
      expect(ignore, `framwork/.gitignore does not ignore ${name} — every build dirties the tree`)
        .toContain(`.codeadd/${name}`);
    }
  });

  it('the sidecar list matches what the build actually emitted, both ways', () => {
    // Guards the guard, against the BUILD OUTPUT rather than build.js source.
    // An earlier version of this level searched the source for each name and was
    // vacuous: the SIDECARS array itself contains them, so a bogus entry
    // satisfied its own check. Proven by adding a fake fourth sidecar — the two
    // levels above failed and this one passed.
    //
    // Requires `node scripts/build.js` to have run, which CI does before
    // `npm test` and which build-contracts.test.js already relies on.
    const dir = path.join(ROOT, 'framwork', '.codeadd');

    for (const name of SIDECARS) {
      expect(fs.existsSync(path.join(dir, name)), `the build never emitted ${name}`).toBe(true);
    }

    // The other direction: a sidecar the build writes but SIDECARS omits would
    // leave the packaging and gitignore levels checking the wrong set.
    const emitted = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => e.name);

    expect(emitted.sort()).toEqual([...SIDECARS].sort());
  });
});

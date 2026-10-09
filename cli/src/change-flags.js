/**
 * The flags that say what an installation should look like, read the same way by
 * `install` and `modify`.
 *
 * A leaf module on purpose: `cli.js` imports both commands, so the commands cannot
 * import their flag reader back from it without a cycle.
 */

/**
 * Every value of a flag that may be repeated and may carry a comma list:
 * `--x a,b --x c` and `--x=a,b` both work. Values are trimmed and de-duplicated.
 *
 * @param {string[]} argv
 * @param {string} flag
 * @returns {string[] | undefined}  undefined when the flag is absent
 */
export function getArgValues(argv, flag) {
  const values = [];
  let found = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    let raw;
    if (arg.startsWith(`${flag}=`)) {
      raw = arg.slice(flag.length + 1);
    } else if (arg === flag) {
      raw = argv[i + 1];
      if (raw === undefined || raw.startsWith('--')) {
        throw new Error(`Missing value for ${flag}. Use ${flag} <name[,name]>.`);
      }
      i++;
    } else {
      continue;
    }

    found = true;
    if (!raw.trim()) throw new Error(`Missing value for ${flag}. Use ${flag} <name[,name]>.`);
    for (const value of raw.split(',').map((v) => v.trim())) {
      if (value && !values.includes(value)) values.push(value);
    }
  }

  return found ? values : undefined;
}

/** `--enable-x` / `--disable-x` as a `{name: boolean}` delta map. A name in both is an error. */
function readDeltas(argv, enableFlag, disableFlag) {
  const map = {};
  for (const name of getArgValues(argv, enableFlag) ?? []) map[name] = true;
  for (const name of getArgValues(argv, disableFlag) ?? []) {
    if (map[name] === true) throw new Error(`"${name}" is both in ${enableFlag} and ${disableFlag}. Pick one.`);
    map[name] = false;
  }
  return map;
}

/**
 * @param {string[]} argv
 * @returns {{
 *   providers: string[] | undefined,
 *   features: Record<string, boolean>,
 *   plugins: Record<string, boolean>,
 *   force: boolean,
 *   gitignore: false | undefined,
 *   any: boolean
 * }}
 *   `providers` is the FINAL set (`none` is the empty set); `features` and `plugins`
 *   are deltas, so a name left out is a name left alone. `gitignore` is `false` only
 *   when `--no-gitignore` is present. `any` is true when a flag asks for a change to
 *   providers, features or plugins — `--force`, `--no-gitignore` and the scope flags
 *   change how a change is made, never whether there is one.
 */
export function readChangeFlags(argv) {
  let providers = getArgValues(argv, '--providers');
  if (providers?.includes('none')) {
    if (providers.length > 1) throw new Error('--providers none cannot be combined with provider names.');
    providers = [];
  }

  const features = readDeltas(argv, '--enable-feature', '--disable-feature');
  const plugins = readDeltas(argv, '--enable-plugin', '--disable-plugin');

  return {
    providers,
    features,
    plugins,
    force: argv.includes('--force'),
    gitignore: argv.includes('--no-gitignore') ? false : undefined,
    any: providers !== undefined || Object.keys(features).length > 0 || Object.keys(plugins).length > 0,
  };
}

/**
 * log-iteration.cjs — Append one iteration entry to a feature's
 * `docs/features/<id>/iterations.md` (token-optimized).
 *
 * F17 audit outcome: PRESERVED, not retired. `log-iteration.sh` is the shell
 * source of record; this native entry is its behavioural port and keeps every
 * case the Bats suite characterized. The shell origin is not removed here —
 * F20 owns retirement only after all callers cut over (F18).
 *
 * CONTRACT (verbatim from the shell):
 *   node .codeadd/scripts/log-iteration.cjs <type> <slug> <what> <files>
 *        [cmd] [--feature N] [--epic name]
 *
 *   type   fix|enhance|refactor|add|remove|config
 *   slug   short kebab identifier
 *   what   brief description, cut to 60 CHARACTERS (not bytes, not padded)
 *   files  affected files
 *   cmd    command label (default `/dev`; an empty 5th arg also defaults)
 *
 * Flags are recognized only from the 6th argument onward and in any order.
 * `--feature` takes a numeric value; `--epic` a non-empty one. Both accept the
 * `--flag=value` spelling. Any other argument is `ERROR:unknown_argument`.
 *
 * The feature id is discovered from the current branch
 * (`feature/0001F-name` or `fix/0001H-name`) via
 * `git rev-parse --abbrev-ref HEAD`. The feature directory must already exist.
 *
 * Output:
 *   LOGGED:I<N>
 *   FEATURE:<id>
 *   FILE:docs/features/<id>/iterations.md
 *   ENTRY:<type>:<slug>|<what-60>
 *   FEATURE_COMPLETE:<N>        (only with --feature N)
 *   EPIC:<name>                 (only with --epic name)
 *
 * Exit codes: 0 success, 1 any caller/environment error (`ERROR:<slug>`).
 * Errors are printed to stdout, matching the shell's `echo` stream.
 *
 * Dependencies: Node built-ins + the `git` executable. No shell.
 */

'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const TYPES = ['fix', 'enhance', 'refactor', 'add', 'remove', 'config'];
const USAGE = 'USAGE: node .codeadd/scripts/log-iteration.cjs <type> <slug> <what> <files> [cmd] [--feature N] [--epic name]';

const HEADER = '# Iterations\n'
  + '\n'
  + '> AI agent context. Token-optimized format.\n'
  + '> Format: ## I{n}|{date}|{cmd}|{type} \\n {slug}|{what}|{files}\n'
  + '\n';

const WHAT_LIMIT = 60;

function fail(lines) {
  for (const line of lines) process.stdout.write(line + '\n');
  process.exit(1);
}

/** Local calendar day as `YYYY-MM-DD`, mirroring `date +%Y-%m-%d`. */
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Parse the flag tail (arguments from index 5 on). Returns
 * `{ featureNum, epicName }` or reports the shell's exact error and exits 1.
 */
function parseFlags(argv) {
  const flags = argv.slice(5);
  let featureNum = '';
  let epicName = '';

  for (let i = 0; i < flags.length;) {
    const arg = flags[i];
    if (arg === '--feature') {
      const value = flags[i + 1];
      if (value === undefined || !/^[0-9]+$/.test(value)) {
        fail(['ERROR:--feature requires a numeric argument']);
      }
      featureNum = value;
      i += 2;
    } else if (arg.startsWith('--feature=')) {
      const value = arg.slice('--feature='.length);
      if (!/^[0-9]+$/.test(value)) {
        fail([`ERROR:--feature value must be numeric, got: ${value}`]);
      }
      featureNum = value;
      i += 1;
    } else if (arg === '--epic') {
      const value = flags[i + 1];
      if (value === undefined || value === '') {
        fail(['ERROR:--epic requires a non-empty argument']);
      }
      epicName = value;
      i += 2;
    } else if (arg.startsWith('--epic=')) {
      const value = arg.slice('--epic='.length);
      if (value === '') {
        fail(['ERROR:--epic value must not be empty']);
      }
      epicName = value;
      i += 1;
    } else {
      fail([`ERROR:unknown_argument: ${arg}`]);
    }
  }

  return { featureNum, epicName };
}

/** Resolve the feature id from the current branch, or exit `not_on_feature_branch`. */
function detectFeature() {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (result.error && result.error.code === 'ENOENT') {
    fail(['ERROR:git_not_found']);
  }
  const branch = result.status === 0 ? String(result.stdout || '').trim() : '';
  const match = /([0-9]{4}[A-Z]-[^/\s]+)$/.exec(branch);
  if (!match) {
    fail(['ERROR:not_on_feature_branch', `BRANCH:${branch || '<detached HEAD>'}`]);
  }
  return { featureId: match[1], branch };
}

/** Next iteration number: last `## I<n>` + 1, or 1 when the file is absent. */
function nextIteration(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fs.writeFileSync(file, HEADER);
    return 1;
  }
  try {
    fs.accessSync(file, fs.constants.W_OK);
  } catch (e) {
    fail(['ERROR:no_write_permission', `PATH:${file}`]);
  }
  const content = fs.readFileSync(file, 'utf8');
  let last = 0;
  for (const m of content.matchAll(/^## I([0-9]+)/gm)) last = Number(m[1]);
  return last + 1;
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.length < 4) {
    fail(['ERROR:missing_required_args', USAGE]);
  }

  const type = argv[0];
  const slug = argv[1];
  const what = argv[2];
  const files = argv[3];
  const cmd = argv[4] === undefined || argv[4] === '' ? '/dev' : argv[4];

  if (type === '') fail(['ERROR:empty_arg_type']);
  if (slug === '') fail(['ERROR:empty_arg_slug']);
  if (what === '') fail(['ERROR:empty_arg_what']);
  if (files === '') fail(['ERROR:empty_arg_files']);

  const { featureNum, epicName } = parseFlags(argv);

  if (!TYPES.includes(type)) {
    fail([`ERROR:invalid_type '${type}'. Allowed: fix|enhance|refactor|add|remove|config`]);
  }

  const { featureId } = detectFeature();
  const featureDir = `docs/features/${featureId}`;
  const iterationsFile = `${featureDir}/iterations.md`;

  if (!fs.existsSync(featureDir) || !fs.statSync(featureDir).isDirectory()) {
    fail(['ERROR:feature_dir_not_found', `PATH:${featureDir}`]);
  }
  try {
    fs.accessSync(featureDir, fs.constants.W_OK);
  } catch (e) {
    fail(['ERROR:no_write_permission', `PATH:${featureDir}`]);
  }

  const dateToday = today();
  if (!dateToday) fail(['ERROR:date_command_failed_or_produced_empty_output']);

  const num = nextIteration(iterationsFile);

  // `cut -c1-60` is character-based; `[...str]` iterates code points.
  const whatTruncated = [...what].slice(0, WHAT_LIMIT).join('');

  let featureHeader = '';
  let featureMarker = '';
  if (featureNum !== '') {
    featureHeader = `|feature:${featureNum}`;
    featureMarker = `[FEATURE ${featureNum} COMPLETE]`;
  }
  if (epicName !== '') {
    featureHeader += `|epic:${epicName}`;
  }

  let entry = `## I${num}|${dateToday}|${cmd}|${type}${featureHeader}\n`;
  entry += `${slug}|${whatTruncated}|${files}\n`;
  if (featureMarker !== '') entry += `${featureMarker}\n`;
  entry += '\n';
  fs.appendFileSync(iterationsFile, entry);

  const stdout = [
    `LOGGED:I${num}`,
    `FEATURE:${featureId}`,
    `FILE:${iterationsFile}`,
    `ENTRY:${type}:${slug}|${whatTruncated}`,
  ];
  if (featureNum !== '') stdout.push(`FEATURE_COMPLETE:${featureNum}`);
  if (epicName !== '') stdout.push(`EPIC:${epicName}`);
  process.stdout.write(stdout.join('\n') + '\n');
  process.exit(0);
}

main();

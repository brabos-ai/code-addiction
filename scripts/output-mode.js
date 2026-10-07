#!/usr/bin/env node
/**
 * Resolves the workbench output mode: how an `add-framework--*` run closes — `prose`, `json` or `both`.
 * Usage: node scripts/output-mode.js [--root <dir>]
 * Output: `OUTPUT_MODE=prose|json|both`, then one `OUTPUT_MODE_WARNING=<source>:<value>` per source
 *   holding an invalid value. Nothing else is printed.
 * Sources, first valid wins: env `CODEADD_OUTPUT`, then `output.mode` in `<root>/workbench/settings.json`,
 *   then `prose`. `<root>` is the repository this script sits in; `--root` overrides it.
 * Exit: 0 on every resolution — a missing file, a bad value or unparseable JSON all fall toward `prose`.
 * `add-final-report` owns what each mode prints. Built-ins only: the repository root takes no dependency.
 */
const fs = require('node:fs');
const path = require('node:path');

const MODES = ['prose', 'json', 'both'];

/** Pure: `settingsText` is the file's text, or undefined when the file is absent. */
function resolve({ env = {}, settingsText } = {}) {
  const warnings = [];
  const fromEnv = env.CODEADD_OUTPUT;
  if (fromEnv !== undefined && fromEnv !== '') {
    if (MODES.includes(fromEnv)) return { mode: fromEnv, warnings };
    warnings.push(`env:${fromEnv}`);
  }
  if (settingsText !== undefined) {
    let value;
    try {
      const parsed = JSON.parse(settingsText);
      value = parsed && parsed.output ? parsed.output.mode : undefined;
    } catch {
      warnings.push('settings:unparseable');
      return { mode: 'prose', warnings };
    }
    if (value !== undefined) {
      if (typeof value === 'string' && MODES.includes(value)) return { mode: value, warnings };
      warnings.push(`settings:${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
  }
  return { mode: 'prose', warnings };
}

function main(argv) {
  const at = argv.indexOf('--root');
  const root = at !== -1 && argv[at + 1] ? path.resolve(argv[at + 1]) : path.resolve(__dirname, '..');
  let settingsText;
  try { settingsText = fs.readFileSync(path.join(root, 'workbench', 'settings.json'), 'utf8'); } catch { /* absent or unreadable: no source */ }
  const { mode, warnings } = resolve({ env: process.env, settingsText });
  const lines = [`OUTPUT_MODE=${mode}`, ...warnings.map(w => `OUTPUT_MODE_WARNING=${w.replace(/\s+/g, '_')}`)];
  process.stdout.write(lines.join('\n') + '\n');
}

module.exports = { resolve, MODES };
if (require.main === module) main(process.argv.slice(2));

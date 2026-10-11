import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { cancel, outro, log } from '@clack/prompts';
import { install } from './installer.js';
import { update } from './updater.js';
import { uninstall } from './uninstaller.js';
import { doctor } from './doctor.js';
import { validate } from './validator.js';
import { config } from './config.js';
import { features } from './features.js';
import { plugins } from './plugins.js';
import { providers, modify } from './modify.js';
import { migrate } from './migrations.js';
import { mcp } from './mcp.js';
import { promptUninstallScope } from './prompt.js';

// What each flag takes, for the error message. A flag not listed gets a generic hint.
const VALUE_HINTS = { '--version': '<tag|main>', '--channel': '<stable|beta>' };

export function getArgValue(argv, flag) {
  const hint = VALUE_HINTS[flag] ?? '<value>';
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) {
    const value = inline.slice(flag.length + 1).trim();
    if (!value) {
      throw new Error(`Missing value for ${flag}. Use ${flag} ${hint}.`);
    }
    return value;
  }

  const index = argv.indexOf(flag);
  if (index === -1) return undefined;

  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}. Use ${flag} ${hint}.`);
  }
  return value;
}

/**
 * Resolve the install target from CLI flags.
 * --global / --user → home directory (scope 'global'); otherwise cwd (scope 'project').
 * @param {string} cwd
 * @param {string[]} argv
 * @returns {{ targetDir: string, scope: 'project'|'global', global: boolean }}
 */
export function resolveTarget(cwd, argv) {
  const global = argv.includes('--global') || argv.includes('--user');
  return global
    ? { targetDir: os.homedir(), scope: 'global', global: true }
    : { targetDir: cwd, scope: 'project', global: false };
}

/**
 * Probe both manifest locations to determine uninstall scope without requiring a flag.
 * Only used by the uninstall branch when no scope flag is present.
 * @param {string} cwd
 * @returns {Promise<Array<{targetDir: string, scope: 'project'|'global'}>>}
 */
export async function resolveUninstallScope(cwd) {
  const projectManifest = path.join(cwd, '.codeadd', 'manifest.json');
  const globalManifest = path.join(os.homedir(), '.codeadd', 'manifest.json');
  const hasProject = fs.existsSync(projectManifest);
  const hasGlobal = fs.existsSync(globalManifest);

  if (hasProject && hasGlobal) {
    const choice = await promptUninstallScope();
    if (choice === 'both') {
      return [
        { targetDir: cwd, scope: 'project' },
        { targetDir: os.homedir(), scope: 'global' },
      ];
    }
    return choice === 'global'
      ? [{ targetDir: os.homedir(), scope: 'global' }]
      : [{ targetDir: cwd, scope: 'project' }];
  }
  if (hasProject) return [{ targetDir: cwd, scope: 'project' }];
  if (hasGlobal) return [{ targetDir: os.homedir(), scope: 'global' }];
  return [];
}

export const USAGE = `
Usage: codeadd <command>

Commands:
  install                      Install Code Addiction files into your project
  install --version <tag>      Install a specific release tag (e.g. v2.0.1)
  install --channel <channel>  Install from a release channel (stable or beta)
  install --global             Install at user level (home dir, all projects)
  install --providers <a,b|none>
                               Choose providers up front; "none" installs the core only.
                               Required when stdin is not a terminal (bots, CI)
  install --enable-feature <name> / --disable-feature <name>
  install --enable-plugin <name> / --disable-plugin <name>
                               Change features and plugins on top of the defaults.
                               Repeat the flag or use commas: --enable-feature board,qa-pipeline
  install --no-gitignore       Do not write the .gitignore block (default: written)
  install --force              Overwrite existing .codeadd/ or provider files without asking
                               (an installation already registered is changed with modify or update)
  update                       Update to latest release (respects current channel)
  update --version <tag>       Update to a specific release tag
  update --channel <channel>   Update and switch release channel (stable or beta)
  uninstall                    Remove Code Addiction files from your project
  doctor                       Check environment health (Node, Git, installation)
  validate                     Validate file integrity via SHA-256 hashes
  validate --repair             Restore missing/modified files from release
  features list                List optional features and their state
  features enable <name>       Enable a feature (inject into commands)
  features disable <name>      Disable a feature (remove from commands)
  plugins list                 List external-tool plugins and their state
  plugins enable <name>        Enable a plugin (validate tool, inject + activate skills)
  plugins disable <name>       Disable a plugin (remove injections + skills)
  providers list               List providers and which are installed
  providers add <name>         Add a provider, keeping features and plugins
  providers remove <name>      Remove a provider (asks first; --force skips)
  modify                       Edit providers, features and plugins in one screen
  modify --providers <a,b|none>
                               Set the FINAL provider set, with no prompt (removing one needs --force)
  modify --enable-feature <name> / --disable-feature <name>
  modify --enable-plugin <name> / --disable-plugin <name>
                               Turn features and plugins on or off, with no prompt.
                               A name left out is left alone. With no TTY, modify needs at least one of these
  mcp --corpus=<name>          Serve the knowledge graph over MCP stdio (docs | artefacts)
  mcp --corpus=<name> --action=<verb>
                               Answer one verb and exit, for a provider with no MCP configured
  migrate                      Apply pending one-off repairs to this install
  migrate --list               List applied and pending migrations
  migrate --dry-run            Show what migrate would do, write nothing
  config show                  Display installation configuration
  config show --verbose         Display config + check for updates

  (--global / --user installs into your home dir instead of the project; applies to install/update/uninstall/doctor/validate/config/features/plugins/providers/modify)

  Without a terminal (stdin is not a TTY) nothing is ever asked: the command finishes, or exits 1
  with a message naming the missing flag. Destructive steps (removing a provider, overwriting
  existing files) need --force. A plugin whose tool is not detected is applied last and exits 1.

Examples:
  npx codeadd install
  npx codeadd install --version v2.0.1
  npx codeadd install --channel beta
  npx codeadd install --global
  npx codeadd update
  npx codeadd update --version v2.0.0
  npx codeadd update --channel stable
  npx codeadd update --global
  npx codeadd uninstall
  npx codeadd uninstall --force
  npx codeadd uninstall --global
  npx codeadd providers list
  npx codeadd providers add cursor
  npx codeadd providers remove codex --force
  npx codeadd modify
  npx codeadd install --providers claude,codex --enable-feature board
  npx codeadd install --providers claude --force
  npx codeadd install --providers none
  npx codeadd modify --providers claude --force --disable-feature tdd-pipeline
  npx codeadd modify --enable-plugin gitnexus
  npx codeadd doctor
  npx codeadd validate
  npx codeadd validate --repair
  npx codeadd config show
  npx codeadd config show --verbose
  npx codeadd mcp --corpus=docs
  npx codeadd mcp --corpus=docs --action=search --args='{"terms":"auth"}'
`;

/**
 * Execute the CLI with an explicit argv (excluding node and the script path).
 * @param {string[]} argv
 */
export async function runCli(argv) {
  const subcommand = argv[0];
  const args = argv.slice(1);

  // ⛔ ROUTED BEFORE EVERYTHING ELSE, AND OUTSIDE THE try/catch BELOW.
  // The graph server speaks JSON-RPC on stdout and nothing else may appear
  // there. `resolveTarget`, `@clack/prompts` and the catch block's `outro()`
  // all write to stdout, so one shared code path would corrupt every session.
  if (subcommand === 'mcp') {
    const code = await mcp(args);
    if (code) process.exit(code);
    return;
  }

  // `--help` / `-h` after any subcommand shows the usage and runs nothing. It is
  // checked before resolveTarget, which can prompt, and before any subcommand,
  // so `update --help` can never update. (`mcp` returned above and keeps its own
  // arguments; the top-level `--help` still reaches the final else below.)
  if (args.includes('--help') || args.includes('-h')) {
    log.message(USAGE);
    process.exit(0);
  }

  const cwd = process.cwd();
  const { targetDir, scope, global } = resolveTarget(cwd, args);

  try {
    if (subcommand === 'install') {
      const version = getArgValue(args, '--version');
      const channel = getArgValue(args, '--channel');
      // install owns the scope prompt (interactive UX); pass raw cwd + global flag.
      await install(cwd, { version, channel, global, args });
    } else if (subcommand === 'update') {
      const version = getArgValue(args, '--version');
      const channel = getArgValue(args, '--channel');
      await update(targetDir, { version, channel }, scope);
    } else if (subcommand === 'uninstall') {
      const force = args.includes('--force');
      const hasScopeFlag = args.includes('--global') || args.includes('--user');
      if (hasScopeFlag) {
        await uninstall(targetDir, force, scope);
      } else {
        const targets = await resolveUninstallScope(cwd);
        if (targets.length === 0) {
          await uninstall(cwd, force, 'project');
        } else {
          for (const { targetDir: td, scope: sc } of targets) {
            await uninstall(td, force, sc);
          }
        }
      }
    } else if (subcommand === 'doctor') {
      await doctor(targetDir, scope);
    } else if (subcommand === 'validate') {
      const repair = args.includes('--repair');
      await validate(targetDir, repair, scope);
    } else if (subcommand === 'features') {
      await features(targetDir, args, scope);
    } else if (subcommand === 'plugins') {
      await plugins(targetDir, args, scope);
    } else if (subcommand === 'providers') {
      await providers(targetDir, args, scope);
    } else if (subcommand === 'modify') {
      await modify(targetDir, args, scope);
    } else if (subcommand === 'migrate') {
      // Reachable even when `update` would early-return on an already-current
      // project — which is the only way such a project can be repaired.
      await migrate(targetDir, args, scope);
    } else if (subcommand === 'config') {
      const subCmd = args[0];
      if (subCmd === 'show') {
        const verbose = args.includes('--verbose');
        await config(targetDir, verbose, scope);
      } else {
        log.message(USAGE);
        process.exit(1);
      }
    } else {
      log.message(USAGE);
      process.exit(subcommand === '--help' || subcommand === '-h' ? 0 : 1);
    }
  } catch (err) {
    if (err && err.message === 'USER_CANCEL') {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    outro(`Error: ${err.message}`);
    process.exit(1);
  }
}

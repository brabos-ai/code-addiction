#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { cancel, outro, log } from '@clack/prompts';
import { install } from '../src/installer.js';
import { update } from '../src/updater.js';
import { uninstall } from '../src/uninstaller.js';
import { doctor } from '../src/doctor.js';
import { validate } from '../src/validator.js';
import { config } from '../src/config.js';
import { features } from '../src/features.js';
import { plugins } from '../src/plugins.js';
import { promptUninstallScope } from '../src/prompt.js';

const subcommand = process.argv[2];
const args = process.argv.slice(3);

function getArgValue(argv, flag) {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) {
    const value = inline.slice(flag.length + 1).trim();
    if (!value) {
      throw new Error(`Missing value for ${flag}. Use ${flag} <tag|main>.`);
    }
    return value;
  }

  const index = argv.indexOf(flag);
  if (index === -1) return undefined;

  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}. Use ${flag} <tag|main>.`);
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

const USAGE = `
Usage: codeadd <command>

Commands:
  install                      Install Code Addiction files into your project
  install --version <tag>      Install a specific release tag (e.g. v2.0.1)
  install --channel <channel>  Install from a release channel (stable or beta)
  install --global             Install at user level (home dir, all projects)
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
  config show                  Display installation configuration
  config show --verbose         Display config + check for updates

  (--global / --user installs into your home dir instead of the project; applies to install/update/uninstall/doctor/validate/config/features/plugins)

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
  npx codeadd doctor
  npx codeadd validate
  npx codeadd validate --repair
  npx codeadd config show
  npx codeadd config show --verbose
`;

async function main() {
  const cwd = process.cwd();
  const { targetDir, scope, global } = resolveTarget(cwd, args);

  try {
    if (subcommand === 'install') {
      const version = getArgValue(args, '--version');
      const channel = getArgValue(args, '--channel');
      // install owns the scope prompt (interactive UX); pass raw cwd + global flag.
      await install(cwd, { version, channel, global });
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

// Run only when invoked as a script (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

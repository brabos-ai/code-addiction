#!/usr/bin/env node
import { cancel, outro, log } from '@clack/prompts';
import { install } from '../src/installer.js';
import { update } from '../src/updater.js';
import { uninstall } from '../src/uninstaller.js';
import { doctor } from '../src/doctor.js';
import { validate } from '../src/validator.js';
import { config } from '../src/config.js';
import { features } from '../src/features.js';

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

const USAGE = `
Usage: codeadd <command>

Commands:
  install                    Install Code Addiction files into your project
  install --version <tag>    Install a specific release tag (e.g. v2.0.1)
  update                     Update to latest release
  update --version <tag>     Update to a specific release tag
  uninstall                  Remove Code Addiction files from your project
  doctor                     Check environment health (Node, Git, installation)
  validate                   Validate file integrity via SHA-256 hashes
  validate --repair           Restore missing/modified files from release
  features list              List optional features and their state
  features enable <name>     Enable a feature (inject into commands)
  features disable <name>    Disable a feature (remove from commands)
  config show                Display installation configuration
  config show --verbose       Display config + check for updates

Examples:
  npx codeadd install
  npx codeadd install --version v2.0.1
  npx codeadd update
  npx codeadd update --version v2.0.0
  npx codeadd uninstall
  npx codeadd uninstall --force
  npx codeadd doctor
  npx codeadd validate
  npx codeadd validate --repair
  npx codeadd config show
  npx codeadd config show --verbose
`;

async function main() {
  const cwd = process.cwd();

  try {
    if (subcommand === 'install') {
      const version = getArgValue(args, '--version');
      await install(cwd, { version });
    } else if (subcommand === 'update') {
      const version = getArgValue(args, '--version');
      await update(cwd, { version });
    } else if (subcommand === 'uninstall') {
      const force = args.includes('--force');
      await uninstall(cwd, force);
    } else if (subcommand === 'doctor') {
      await doctor(cwd);
    } else if (subcommand === 'validate') {
      const repair = args.includes('--repair');
      await validate(cwd, repair);
    } else if (subcommand === 'features') {
      await features(cwd, args);
    } else if (subcommand === 'config') {
      const subCmd = args[0];
      if (subCmd === 'show') {
        const verbose = args.includes('--verbose');
        await config(cwd, verbose);
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

main();

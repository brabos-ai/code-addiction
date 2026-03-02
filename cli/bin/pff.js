#!/usr/bin/env node
import { cancel, outro, log } from '@clack/prompts';
import { install } from '../src/installer.js';
import { update } from '../src/updater.js';
import { uninstall } from '../src/uninstaller.js';
import { doctor } from '../src/doctor.js';
import { validate } from '../src/validator.js';
import { config } from '../src/config.js';

const subcommand = process.argv[2];
const args = process.argv.slice(3);

const USAGE = `
Usage: pff <command>

Commands:
  install              Install PFF files into your project
  update               Update installed PFF files to latest version
  uninstall            Remove PFF files from your project
  doctor               Check environment health (Node, Git, PFF installation)
  validate             Validate file integrity via SHA-256 hashes
  validate --repair    Restore missing/modified files from release
  config show          Display installation configuration
  config show --verbose  Display config + check for updates

Examples:
  npx pff install
  npx pff update
  npx pff uninstall
  npx pff uninstall --force
  npx pff doctor
  npx pff validate
  npx pff validate --repair
  npx pff config show
  npx pff config show --verbose
`;

async function main() {
  const cwd = process.cwd();

  try {
    if (subcommand === 'install') {
      await install(cwd);
    } else if (subcommand === 'update') {
      await update(cwd);
    } else if (subcommand === 'uninstall') {
      const force = args.includes('--force');
      await uninstall(cwd, force);
    } else if (subcommand === 'doctor') {
      await doctor(cwd);
    } else if (subcommand === 'validate') {
      const repair = args.includes('--repair');
      await validate(cwd, repair);
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

'use strict';

// Loaded only by the guarded acceptance suites. Catch direct Windows process
// creation as well as absolute Bash paths, which a PATH .cmd shim cannot cover.
const cp = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');
const MESSAGE = 'Bash is rejected in this framework/test boundary; use Node.';
const bashCommand = /(?:^|[\s;&|"'])[^\s;&|"']*\bbash(?:\.exe|\.cmd)?(?=$|[\s"'])/i;

for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync']) {
  const original = cp[name];
  cp[name] = function (command, ...args) {
    if (bashCommand.test(String(command))) {
      const error = new Error(MESSAGE);
      error.code = 'CODEADD_BASH_REFUSED';
      throw error;
    }
    // Tests deliberately clear debugger NODE_OPTIONS. Preserve only this
    // acceptance preload when a caller supplies its own child environment.
    const index = args.findIndex((arg) => arg && typeof arg === 'object' && !Array.isArray(arg));
    if (index !== -1 && args[index].env) {
      const env = { ...args[index].env };
      env.CODEADD_NO_BASH_PRELOAD = __filename;
      env.NODE_OPTIONS = `--require=${JSON.stringify(__filename)}`;
      args[index] = { ...args[index], env };
    }
    return original.call(this, command, ...args);
  };
}
syncBuiltinESMExports();

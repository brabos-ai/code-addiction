# Test transport packs without a path in `tar -f`

## Outcome

`npm test` and the other container suites run again on Windows with Git Bash's GNU tar on the host. `pack()` in `scripts/test-transport.cjs` builds the source archive without ever giving tar a path.

## Why

`pack()` passed the absolute archive path to `tar -f`. On Windows that path starts with `C:`, and GNU tar reads `C:` as a remote host: `tar: Cannot connect to C: resolve failed`, exit 128. `pack()` runs on the host, not in the container, so the tar that fails is the host's: Git Bash's `/usr/bin/tar`. It came in with bc0e579, whose predecessor streamed tar to stdout.

## Changes

- `scripts/test-transport.cjs` `pack()` opens the target with `fs.openSync(file, 'w')` and runs `tar -c -f - .` with stdout on that descriptor. The descriptor is closed in a `finally`. The existing error handling stays. Both callers (the initial tree and the watch sync) go through `pack()`, so both get the fix; the test calls `pack()` directly.
- `scripts/tests/test-transport.test.cjs` runs `pack()` in a child process with a target `C:/tree.tar` inside a folder named `C:`. It asserts exit 0, `ustar` at offset 257, the argument after `-f` is `-`, and no tar argument is absolute or drive-letter. On Windows, which cannot create a `C:` folder, the target is a real absolute drive path.

## Validation

Before the fix, with GNU tar the new test failed on `tar: Cannot connect to C: resolve failed`, exit 128. With Windows bsdtar the old `pack()` does not fail that way, and the check that the argument after `-f` is `-` is what catches it.

After the fix, `node scripts/run-tests.js scripts` (run from PowerShell): 655 tests, 655 pass, 0 fail, 0 cancelled, 0 skipped, exit code 0. The new test, `pack writes the archive without passing the target to tar -f`, is among them.

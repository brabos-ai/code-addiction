# Test transport packs without a path in `tar -f`

## Outcome

`npm test` and the other container suites run again on Windows with Git Bash's GNU tar. `pack()` in `scripts/test-transport.cjs` builds the source archive without ever giving tar a path.

## Why

`pack()` passed the absolute archive path to `tar -f`. On Windows that path starts with `C:`, and GNU tar (Git Bash, and the Linux test container) reads `C:` as a remote host: `tar: Cannot connect to C: resolve failed`, exit 128. It came in with bc0e579, whose predecessor streamed tar to stdout.

## Changes

- `scripts/test-transport.cjs` `pack()` opens the target with `fs.openSync(file, 'w')` and runs `tar -c -f - .` with stdout on that descriptor. The descriptor is closed in a `finally`. The existing error handling stays. Both callers (the initial tree and the watch sync) are covered.
- `scripts/tests/test-transport.test.cjs` runs `pack()` in a child process with a target `C:/tree.tar` inside a folder named `C:`. It asserts exit 0, `ustar` at offset 257, the argument after `-f` is `-`, and no tar argument is absolute or drive-letter. On Windows, which cannot create a `C:` folder, the target is a real absolute drive path.

## Validation

The new test failed before the fix (`tar: Cannot connect to C: resolve failed`, exit 128) and passes after it.

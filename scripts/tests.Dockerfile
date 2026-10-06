# The optional Linux image `scripts/run-tests.js` runs a suite in when asked for
# with CODEADD_TESTS_RUNNER=docker.
#
# It is NOT the default on any platform. The root scripts suite runs under
# Node's built-in test runner, and the cli suite runs natively, so a normal run
# needs no daemon and no image. The container survives as an explicit opt-in for
# reproducing a Linux run from a Windows host, where vitest's Windows native
# bindings do not load.
#
# The image is built on demand and tagged with a hash of this file plus
# cli/package.json and cli/package-lock.json, so editing any of the three
# rebuilds it on the next run. Nothing rebuilds it by hand.

FROM node:22-bookworm-slim

# ca-certificates is here for apt itself; git and jq are what the suites and the
# scripts under test actually call. No GNU parallel: the native scripts suite
# needs no fork-per-case parallelism, and Bats is gone.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      git \
      jq \
 && rm -rf /var/lib/apt/lists/*

# The cli dependencies are installed HERE, not taken from the checkout.
# A Windows `cli/node_modules` carries Windows builds of vitest's native
# bindings (@rolldown/binding-win32-x64-msvc), which do not load on Linux. The
# runner copies the checkout into /code as a tarball that leaves
# cli/node_modules out, so this layer is the only copy the container sees.
#
# The build context is a scratch directory holding only this file and the two
# package files — never the repository, which would drag node_modules across
# the file bridge for nothing.
WORKDIR /code/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci --no-audit --no-fund

# No Bats is installed, and the root scripts suite never needs it: it runs on
# the container's own Node through `node --test scripts/tests/*.test.cjs`.

# No global git identity is set here, and that too is deliberate. The GitHub
# runner has none either, and several tests under framwork/.codeadd/scripts/
# create their own repository and configure it themselves. An image that
# supplied a fallback identity would be more permissive than CI, which is how a
# local run comes back green on something the merge gate rejects.

WORKDIR /code

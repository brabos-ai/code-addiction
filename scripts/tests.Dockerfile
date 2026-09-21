# The Linux image `scripts/run-tests.js` runs both test suites in on Windows.
#
# bats spends its time forking, and process creation under Git Bash on Windows
# costs far more than on Linux: the same 386 tests take about 69 minutes there
# and about a minute on CI. The cli vitest suite pays the same tax on every file
# that spawns a subprocess. Inside this image both run at Linux speed and give
# the answer CI gives.
#
# The image is built on demand and tagged with a hash of this file plus
# cli/package.json and cli/package-lock.json, so editing any of the three
# rebuilds it on the next run. Nothing rebuilds it by hand.

FROM node:22-bookworm-slim

# ca-certificates is here for apt itself; git, jq and parallel are what the
# suites and the scripts under test actually call. `parallel` backs `bats -j`.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      git \
      jq \
      parallel \
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

# bats is deliberately NOT installed here, and this is not an oversight.
# Debian bookworm ships 1.8.2; this repository pins 1.13.0 in its root
# package.json, and that pinned copy is what the CI job runs. The container
# executes ./node_modules/.bin/bats out of the mounted repository instead, so
# the local gate and the merge gate grade on the same binary. Installing the
# distribution package would quietly put them on two.

# No global git identity is set here, and that too is deliberate. The GitHub
# runner has none either, and several tests under framwork/.codeadd/scripts/
# create their own repository and configure it themselves. An image that
# supplied a fallback identity would be more permissive than CI, which is how a
# local run comes back green on something the merge gate rejects.

WORKDIR /code

# The Linux image `scripts/run-bats.js` runs the bats suite in on Windows.
#
# The suite takes about 69 minutes on Windows under Git Bash and 63 seconds on
# Linux CI, because bats spends its time forking and process creation costs far
# more there. Inside this image the same 386 tests run in about half a minute.
#
# The image is built on demand and tagged with a hash of this file, so editing
# anything below rebuilds it on the next run. Nothing rebuilds it by hand.

FROM node:22-bookworm-slim

# ca-certificates is here for apt itself; git, jq and parallel are what the
# suite and its scripts under test actually call. `parallel` backs `bats -j`.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      git \
      jq \
      parallel \
 && rm -rf /var/lib/apt/lists/*

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

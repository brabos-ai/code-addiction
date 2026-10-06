# Linux test dependencies for every supported local command, hashed with all manifest/lock inputs.
# Source is copied per run; host dependencies never overwrite these Linux modules.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git jq \
 && rm -rf /var/lib/apt/lists/*
# No Bats, GNU parallel or global git identity: scripts use Node and configure fixture Git themselves.
WORKDIR /code
COPY package.json package-lock.json ./
WORKDIR /code/cli
COPY cli/package.json cli/package-lock.json ./
RUN npm ci --no-audit --no-fund
WORKDIR /code/board
COPY board/package.json board/package-lock.json ./
RUN npm ci --no-audit --no-fund
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/codeadd-browsers
RUN node node_modules/@playwright/test/cli.js install --with-deps chromium
WORKDIR /code

#!/bin/bash
# ============================================
# QA-PREFLIGHT
# Deterministic QA prerequisite probes shared by /add.qa and /add.qa-setup
# ============================================
# Usage: bash .codeadd/scripts/qa-preflight.sh a
#        bash .codeadd/scripts/qa-preflight.sh b <FEATURE_DIR> [SPEC_GLOB]
# Dependencies: bash, node >= 18 (JSON parsing + HTTP probe; guaranteed by the CLI)
# Output: KEY=STATUS lines. Statuses: ok | missing | broken | not-probed.
#         QA_FEATURE_STATE is the RAW manifest value (true|false|unset|no-manifest);
#         the calling command applies default semantics — the defaults registry
#         lives in the CLI (cli/src/features.js) and is not duplicated here.
# Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse.
# ============================================

# -u only: -e would defeat the always-exit-0 diagnosis contract, and every
# probe already reports its own failure as a STATUS rather than a non-zero exit.
set -u

usage() {
  echo "Usage: qa-preflight.sh a | qa-preflight.sh b <FEATURE_DIR> [SPEC_GLOB]"
  exit 2
}

PHASE="${1:-}"

# --- Phase A: project-level probes ---
phase_a() {
  local FEATURE_STATE CONFIG BASEURL HOST LOCAL SKILL d RECEIPT SIDECAR RECORDED CURRENT

  # Feature state (raw manifest read)
  if [ ! -f .codeadd/manifest.json ]; then
    echo "QA_FEATURE_STATE=no-manifest"
  else
    FEATURE_STATE=$(node -e "
      try {
        const j = JSON.parse(require('fs').readFileSync('.codeadd/manifest.json', 'utf8'));
        const has = j.features && Object.prototype.hasOwnProperty.call(j.features, 'qa-pipeline');
        console.log(has ? String(j.features['qa-pipeline']) : 'unset');
      } catch (e) { console.log('unset'); }
    " 2>/dev/null)
    echo "QA_FEATURE_STATE=${FEATURE_STATE:-unset}"
  fi

  # config.json — parse + require baseUrl; dependent probes short-circuit to not-probed
  CONFIG="docs/qa/config.json"
  BASEURL=""
  if [ ! -f "$CONFIG" ]; then
    echo "QA_CONFIG=missing"
    echo "QA_BASEURL="
    echo "QA_BASEURL_LOCAL=not-probed"
    echo "QA_BASEURL_REACHABLE=not-probed"
  else
    if BASEURL=$(node -e "
      const j = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      if (typeof j.baseUrl !== 'string' || !j.baseUrl) process.exit(1);
      process.stdout.write(j.baseUrl);
    " "$CONFIG" 2>/dev/null); then
      echo "QA_CONFIG=ok"
      echo "QA_BASEURL=$BASEURL"
      # Local/throwaway host check runs FIRST: a non-local baseUrl is refused
      # anyway, so reachability is never probed against a remote host.
      HOST=$(node -e "console.log(new URL(process.argv[1]).hostname)" "$BASEURL" 2>/dev/null)
      case "$HOST" in
        localhost|127.*|0.0.0.0|::1|\[::1\]|*.local|*.test|192.168.*|10.*) LOCAL=ok ;;
        # Docker: the bridge network is 172.16.0.0/12 (172.16-172.31 ONLY —
        # 172.32.* is public), plus the host gateway alias.
        172.1[6-9].*|172.2[0-9].*|172.3[01].*|host.docker.internal) LOCAL=ok ;;
        *) LOCAL=broken ;;
      esac
      echo "QA_BASEURL_LOCAL=$LOCAL"
      if [ "$LOCAL" = "ok" ]; then
        if node -e "fetch(process.argv[1], { signal: AbortSignal.timeout(5000) }).then(() => process.exit(0), () => process.exit(1))" "$BASEURL" >/dev/null 2>&1; then
          echo "QA_BASEURL_REACHABLE=ok"
        else
          echo "QA_BASEURL_REACHABLE=broken"
        fi
      else
        echo "QA_BASEURL_REACHABLE=not-probed"
      fi
    else
      echo "QA_CONFIG=broken"
      echo "QA_BASEURL="
      echo "QA_BASEURL_LOCAL=not-probed"
      echo "QA_BASEURL_REACHABLE=not-probed"
    fi
  fi

  # Runner — must be the PROJECT's @playwright/test (require.resolve walks
  # node_modules only, never the global npm prefix a stray CLI could live in),
  # then a functional probe. Never a network install (--no-install).
  if node -e "require.resolve('@playwright/test')" >/dev/null 2>&1 \
     && npx --no-install playwright --version >/dev/null 2>&1; then
    echo "QA_RUNNER=ok"
    # Chromium — real headless launch, only meaningful with a working runner
    if node -e "
      (async () => {
        const { chromium } = require('@playwright/test');
        const b = await chromium.launch();
        await b.close();
      })().then(() => process.exit(0), () => process.exit(1));
    " >/dev/null 2>&1; then
      echo "QA_CHROMIUM=ok"
    else
      echo "QA_CHROMIUM=broken"
    fi
  else
    echo "QA_RUNNER=missing"
    echo "QA_CHROMIUM=not-probed"
  fi

  # qa-project skill — generated at setup time into a provider skills dir
  SKILL=missing
  # Provider install destinations per cli/src/providers.js — `.agent` (antigrav)
  # and `.agents` (codex) are different providers; `.gemini` is not a provider.
  for d in .claude .agents .agent .cursor .opencode; do
    if [ -f "$d/skills/qa-project/SKILL.md" ]; then SKILL=ok; break; fi
  done
  echo "QA_PROJECT_SKILL=$SKILL"

  # Receipt + shipped shape. Diagnosis only — callers decide block vs work-to-do.
  RECEIPT="docs/qa/qa-setup.md"
  SIDECAR=".codeadd/contracts.json"
  if [ ! -f "$RECEIPT" ]; then
    echo "QA_RECEIPT=missing"
    echo "QA_CONTRACT_MATCH=not-probed"
  else
    RECORDED=$(awk 'NR==1 && $0~/^---\r?$/{f=1;next} f && $0~/^---\r?$/{exit} f' "$RECEIPT" 2>/dev/null | \
      grep -E '^setup-shape:[[:space:]]*sha256:[0-9a-f]+[[:space:]]*\r?$' | \
      sed -E 's/^setup-shape:[[:space:]]*(sha256:[0-9a-f]+).*$/\1/' | head -1 || true)
    if [ -z "${RECORDED:-}" ]; then
      echo "QA_RECEIPT=broken"
      echo "QA_CONTRACT_MATCH=not-probed"
    else
      echo "QA_RECEIPT=ok"
      if [ ! -f "$SIDECAR" ]; then
        echo "QA_CONTRACT_MATCH=missing"
      else
        CURRENT=$(awk '/"add\.qa-setup"[[:space:]]*:/{f=1}
                       f && /"shape"[[:space:]]*:[[:space:]]*"sha256:[0-9a-f]+"/{
                           if (match($0, /sha256:[0-9a-f]+/)) print substr($0, RSTART, RLENGTH);
                           exit
                       }' "$SIDECAR" 2>/dev/null || true)
        if [ -z "${CURRENT:-}" ]; then
          echo "QA_CONTRACT_MATCH=missing"
        elif [ "$RECORDED" = "$CURRENT" ]; then
          echo "QA_CONTRACT_MATCH=ok"
        else
          echo "QA_CONTRACT_MATCH=broken"
        fi
      fi
    fi
  fi
}

# --- Phase B: feature-scoped probes ---
phase_b() {
  local FEATURE_DIR="$1"
  local SPEC_GLOB="$2"
  local SCREENS
  [ -n "$FEATURE_DIR" ] || usage

  SCREENS="$FEATURE_DIR/_tests/screens.json"
  if [ ! -f "$SCREENS" ]; then
    echo "QA_SCREENS=missing"
  elif node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$SCREENS" >/dev/null 2>&1; then
    echo "QA_SCREENS=ok"
  else
    echo "QA_SCREENS=broken"
  fi

  # Spec presence — the caller resolves the glob from the generated qa-project
  # skill (never guesses); with no glob the probe is honestly not-probed.
  if [ -z "$SPEC_GLOB" ]; then
    echo "QA_SPECS=not-probed"
  elif compgen -G "$SPEC_GLOB" >/dev/null; then
    echo "QA_SPECS=ok"
  else
    echo "QA_SPECS=missing"
  fi
}

case "$PHASE" in
  a) phase_a ;;
  b) phase_b "${2:-}" "${3:-}" ;;
  *) usage ;;
esac

exit 0

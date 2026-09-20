#!/usr/bin/env bats

setup() {
  load 'test_helper/common-setup'
  common_setup
  SCRIPT="$SCRIPTS_DIR/hotfix-gates.sh"
}

teardown() {
  common_teardown
}

baseline_body() {
  bash "$SCRIPT" diagnosis-baseline | sed -n '/^BASELINE_BEGIN$/,/^BASELINE_END$/p' | sed '1d;$d'
}

write_handoff() {
  local path=$1 baseline=$2 citation=${3:-src/fault.txt:1}
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<EOF
---
id: DIAG-test
type: diagnose-report
created: 2026-09-19
updated: 2026-09-19
related: []
tags: [test]
---
## Hotfix Handoff
route: hotfix
accepted: true
diagnosed-branch: $(git branch --show-current)
diagnosed-commit: $(git rev-parse HEAD)
predicate: WHEN test THEN fixed BUT CURRENTLY broken
root-cause: test cause
### Findings
| ID | Severity | Area | Citation | Symbol | Finding | Required change |
|---|---|---|---|---|---|---|
| DIAG-F001 | major | test | $citation |  | broken | fix |
### Confirmed Relations
None
### Working Tree Baseline
\`\`\`text
$baseline
\`\`\`
EOF
}

@test "usage errors exit 2" {
  run bash "$SCRIPT"
  [ "$status" -eq 2 ]
  run bash "$SCRIPT" unknown
  [ "$status" -eq 2 ]
}

@test "diagnosis-baseline emits full identity and clean state" {
  run bash "$SCRIPT" diagnosis-baseline
  [ "$status" -eq 0 ]
  [[ "$output" == *"DIAGNOSED_BRANCH=main"* ]]
  [[ "$output" == *"DIAGNOSED_COMMIT=$(git rev-parse HEAD)"* ]]
  [[ "$output" == *$'BASELINE_BEGIN\nclean\nBASELINE_END'* ]]
}

@test "diagnosis-baseline preserves staged unstaged deleted and untracked state" {
  printf 'base\n' > tracked.txt
  printf 'gone\n' > deleted.txt
  git add tracked.txt deleted.txt
  git commit -m fixture -q
  printf 'staged\n' > tracked.txt
  git add tracked.txt
  printf 'unstaged\r\n' > tracked.txt
  rm deleted.txt
  printf '' > empty.txt

  run bash "$SCRIPT" diagnosis-baseline
  [ "$status" -eq 0 ]
  [[ "$output" == *$'staged\t100644\t'*$'\t747261636b65642e747874'* ]]
  [[ "$output" == *$'unstaged\t100644\t'*$'\t747261636b65642e747874'* ]]
  [[ "$output" == *$'deleted\t100644\t-\t64656c657465642e747874'* ]]
  [[ "$output" == *$'untracked\t100644\te3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\t656d7074792e747874'* ]]
}

@test "diagnosis-baseline distinguishes symlinks executables renames and unusual names" {
  printf 'old\n' > old.txt
  git add old.txt
  git commit -m old -q
  git mv old.txt new.txt
  printf '#!/bin/sh\nexit 0\n' > executable.sh
  chmod +x executable.sh
  ln -s new.txt link.txt
  unusual=$'odd\tname\n.txt'
  printf 'odd\n' > "$unusual"

  run bash "$SCRIPT" diagnosis-baseline
  [ "$status" -eq 0 ]
  [[ "$output" == *$'deleted\t100644\t-\t6f6c642e747874'* ]]
  [[ "$output" == *$'staged\t100644\t'*$'\t6e65772e747874'* ]]
  [[ "$output" == *$'untracked\t100755\t'*$'\t65786563757461626c652e7368'* ]]
  [[ "$output" == *$'untracked\t120000\t'*$'\t6c696e6b2e747874'* ]]
  [[ "$output" == *$'\t6f6464096e616d650a2e747874'* ]]
}

@test "diagnosis-check distinguishes unchanged unrelated and overlapping drift" {
  mkdir -p docs/diagnose src
  printf 'fault\n' > src/fault.txt
  git add src/fault.txt
  git commit -m fault -q
  write_handoff docs/diagnose/report.md clean

  run bash "$SCRIPT" diagnosis-check docs/diagnose/report.md
  [ "$status" -eq 0 ]
  [[ "$output" == *"DIAGNOSIS=unchanged"* ]]
  [[ "$output" == *"OVERLAP=none"* ]]

  printf 'notes\n' > notes.txt
  run bash "$SCRIPT" diagnosis-check docs/diagnose/report.md
  [ "$status" -eq 0 ]
  [[ "$output" == *"DIAGNOSIS=delta"* ]]
  [[ "$output" == *"OVERLAP=none"* ]]

  printf 'changed\n' > src/fault.txt
  run bash "$SCRIPT" diagnosis-check docs/diagnose/report.md
  [ "$status" -eq 0 ]
  [[ "$output" == *"OVERLAP=present"* ]]
}

@test "diagnosis-check rejects a missing diagnosed commit" {
  mkdir -p docs/diagnose
  write_handoff docs/diagnose/report.md clean
  sed -i 's/^diagnosed-commit:.*/diagnosed-commit: 0000000000000000000000000000000000000000/' docs/diagnose/report.md
  run bash "$SCRIPT" diagnosis-check docs/diagnose/report.md
  [ "$status" -eq 3 ]
}

@test "snapshot-wave and diff-wave isolate adds changes modes and deletes" {
  printf 'before\n' > one.txt
  printf 'delete\n' > two.txt
  printf '6f6e652e747874\n74776f2e747874\n6e65772e747874\n' > paths.hex
  run bash "$SCRIPT" snapshot-wave paths.hex
  [ "$status" -eq 0 ]
  snapshot=$(printf '%s\n' "$output" | sed -n 's/^SNAPSHOT=//p')
  printf 'after\n' > one.txt
  rm two.txt
  printf 'new\n' > new.txt
  package="$TEST_TEMP_DIR/wave.txt"

  run bash "$SCRIPT" diff-wave "$snapshot" "$package"
  [ "$status" -eq 0 ]
  [[ "$output" == *"CHANGED=3"* ]]
  [ -s "$package" ]
  grep -q '^HOTFIX_CORRECTION_PACKAGE v1$' "$package"
  grep -q '6f6e652e747874' "$package"
  grep -q '74776f2e747874' "$package"
  grep -q '6e65772e747874' "$package"
}

@test "review fingerprint validates exact paths and detects receipt tampering" {
  git switch -c hotfix/0001H-test -q
  mkdir -p docs/features/0001H-test src
  printf 'fixed\n' > src/fault.txt
  printf '{}\n' > docs/features/0001H-test/iterations.jsonl
  cat > docs/features/0001H-test/about.md <<'EOF'
## Review
status: passed
reviewer: inline
reviewed-at: 2026-09-19T00:00:00Z
reviewed-tree: sha256:<PENDING>
build: passed
pinned-test: none:not-applicable
### Reviewed Paths
```text
present	100644	0000000000000000000000000000000000000000000000000000000000000000	646f63732f66656174757265732f30303031482d746573742f61626f75742e6d64
```
### Findings
| ID | Severity | Confidence | Citation | Route | Disposition | Re-review | Detail |
|---|---|---|---|---|---|---|---|
EOF

  run bash "$SCRIPT" review-manifest docs/features/0001H-test
  [ "$status" -eq 0 ]
  manifest=$(printf '%s\n' "$output" | sed -n '/^PATHS_BEGIN$/,/^PATHS_END$/p' | sed '1d;$d')
  awk -v manifest="$manifest" '
    /^```text$/ && !done { print; print manifest; skip=1; done=1; next }
    skip && /^```$/ { skip=0; print; next }
    !skip { print }
  ' docs/features/0001H-test/about.md > docs/features/0001H-test/about.tmp
  mv docs/features/0001H-test/about.tmp docs/features/0001H-test/about.md

  run bash "$SCRIPT" review-fingerprint docs/features/0001H-test
  [ "$status" -eq 0 ]
  fingerprint=$(printf '%s\n' "$output" | sed -n 's/^REVIEWED_TREE=//p')
  sed -i "s#sha256:<PENDING>#$fingerprint#" docs/features/0001H-test/about.md

  run bash "$SCRIPT" review-validate docs/features/0001H-test
  [ "$status" -eq 0 ]
  [[ "$output" == *"HOTFIX_REVIEW=ok"* ]]

  git add src/fault.txt docs/features/0001H-test/about.md docs/features/0001H-test/iterations.jsonl
  git commit -m reviewed -q
  run bash "$SCRIPT" review-validate docs/features/0001H-test --tree HEAD
  [ "$status" -eq 0 ]
  [[ "$output" == *"HOTFIX_REVIEW=ok"* ]]

  printf 'late\n' > src/later.txt
  run bash "$SCRIPT" review-validate docs/features/0001H-test
  [ "$status" -eq 3 ]
  [[ "$output" == *"HOTFIX_REVIEW=stale"* ]]
  rm src/later.txt

  sed -i 's/^status: passed$/status: blocked/' docs/features/0001H-test/about.md
  run bash "$SCRIPT" review-validate docs/features/0001H-test
  [ "$status" -eq 3 ]
  [[ "$output" == *"HOTFIX_REVIEW=blocked"* ]]
  sed -i 's/^status: blocked$/status: passed/' docs/features/0001H-test/about.md

  printf '\ntampered\n' >> docs/features/0001H-test/about.md
  run bash "$SCRIPT" review-validate docs/features/0001H-test
  [ "$status" -eq 3 ]
  [[ "$output" == *"HOTFIX_REVIEW=stale"* ]]
}

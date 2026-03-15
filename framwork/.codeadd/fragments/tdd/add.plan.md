<!-- section:step-list -->
STEP 9:  Test-Spec subagent       → AFTER area subagents, generates contract test cases
<!-- /section:step-list -->

<!-- section:step9 -->

---

## STEP 9: Test-Spec Subagent (AFTER area subagents)

**When to create:** ALWAYS — runs after all area subagents complete.

**MANDATORY:** Load skill BEFORE dispatch: `.codeadd/skills/test-specification/SKILL.md`

**Dispatch prompt:**
```
You are the TEST SPECIFICATION SPECIALIST for feature ${FEATURE_ID}.

## MANDATORY: Load Skill
READ: .codeadd/skills/test-specification/SKILL.md — follow ALL rules.

## MANDATORY: Self-Bootstrap Context (FIRST STEP)
Execute BEFORE any other action:

1. Run: bash .codeadd/scripts/status.sh
2. Parse FEATURE_ID from output
3. Read feature docs IN ORDER:
   - docs/features/${FEATURE_ID}/about.md (PRIMARY — RFs, RNs, RNFs)
   - docs/features/${FEATURE_ID}/discovery.md
4. Read area planning outputs (contracts):
   - docs/features/${FEATURE_ID}/plan-database.md (if exists — entities, tables)
   - docs/features/${FEATURE_ID}/plan-backend.md (if exists — endpoints, DTOs, commands)
   - docs/features/${FEATURE_ID}/plan-frontend.md (if exists — pages, components)

## Your Task
Generate contract test cases derived from RFs/RNs in about.md + technical contracts from plan-*.md files.

Rules:
- Tests validate CONTRACT (input/output), NEVER internal implementation
- Each RF generates at least 1 test case
- Each RN generates positive AND negative test cases
- Use nomenclature: [area]-[RF/RN]-[scenario]
- Map test cases to test files

## Output Format
Write to: docs/features/${FEATURE_ID}/plan-test-spec.md

Use the EXACT format from the test-specification skill:

## Test Specification

### Contract Tests (from RFs/RNs)

| ID | Test Case | Area | RF/RN | Input | Expected Output | Verify |
|----|-----------|------|-------|-------|-----------------|--------|
| T01 | [max 10 words] | [backend/frontend/database] | [RF/RN ID] | [request/action] | [response/result] | [assertion] |

### Test File Mapping

| Area | Test File | Test IDs |
|------|-----------|----------|
| [area] | [path] | [T01, T02...] |

### Coverage vs Requirements

| RF/RN | Test Cases | Covered? |
|-------|------------|----------|
| [RF01] | [T01, T03] | ✅ |

## Rules
- NO implementation code — only test specifications
- Coverage vs Requirements MUST show 100%
- Keep under 40 lines
- Test cases are CONTRACTS: what goes in, what comes out
```

**⛔ DO NOT skip this subagent. Test specs are MANDATORY for TDD pipeline.**
<!-- /section:step9 -->

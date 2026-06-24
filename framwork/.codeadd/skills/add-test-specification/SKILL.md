---
name: add-test-specification
description: Generate contract test cases from feature requirements (RFs/RNs) and technical contracts. Use when add.plan needs to produce plan-test-spec.md mapping each requirement to testable cases before implementation.
---

# Test Specification — Contract Test Cases

> **LANG:** Respond in user's native language. Tech terms in English.

## Purpose

Derive **contract** test cases (input → expected output) from `about.md` requirements (RFs/RNs) plus technical contracts in `plan-*.md`. Tests validate the contract, **never** internal implementation.

## Rules

- Each **RF** generates at least 1 test case.
- Each **RN** generates a **positive AND a negative** case.
- Nomenclature: `[area]-[RF/RN]-[scenario]`.
- Tests assert observable behavior (request/response, action/result) — not internals.
- Coverage vs Requirements MUST show 100%.
- Output is a **specification only** — NO implementation code.
- Keep the document under ~40 lines (token-efficient).

## Output Format

Write to `docs/features/${FEATURE_ID}/plan-test-spec.md`:

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

## Handoff to RED

These specs become the RED phase in `add-tdd`: each row is one failing test to write first. The implementer writes the test from the contract, confirms it fails for the right reason, then implements minimal GREEN code.

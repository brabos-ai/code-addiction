<!-- section:step-list -->
STEP 3.5: Test Spec Coverage    → Validate plan-test-spec.md vs implementation (TDD)
<!-- /section:step-list -->

<!-- section:spec-audit -->

### 3.5 Test Specification Coverage (TDD)

IF `plan-test-spec.md` exists in feature directory:
1. READ `docs/features/${FEATURE_ID}/plan-test-spec.md`
2. EXTRACT test case table (ID, Area, RF/RN mapping)
3. For EACH test case ID:
   a. SEARCH for corresponding test file (from Test File Mapping table)
   b. VERIFY test implementation exists and covers the contract
   c. Status: ✅ IMPLEMENTED | ⚠️ PARTIAL | ❌ MISSING
4. COMPUTE TEST_COVERAGE: X/Y test cases implemented

**Include in Spec Audit output:**
```
TEST_SPEC_COVERAGE: X/Y test cases implemented
TEST_MISSING: [list of missing test IDs with RF/RN]
TEST_STATUS: COVERED | PARTIAL | UNCOVERED
```

⛔ IF TEST_STATUS = UNCOVERED: flag in Quality Gate as ⚠️ DIVERGENT
<!-- /section:spec-audit -->

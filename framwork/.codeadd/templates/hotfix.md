# Hotfix: {{TITLE}}

> **ID:** {{HOTFIX_ID}}
> **Branch:** {{BRANCH_NAME}}
> **Created:** {{DATETIME}}
> **Priority:** {{PRIORITY}}

---

## Problem Description

- **What is happening:** [2-3 sentences describing the bug]
- **Expected behavior:** [1 sentence: what should happen]
- **Impact:** [Production | Staging | User-facing | Performance | Security | Data Integrity]
- **Affected area:** [Frontend | Backend | Workers | Database | Integration]

## Investigation

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Error Messages / Logs

```
[Paste relevant error output, stack trace, or logs]
```

### Root Cause Analysis

[Explain why the bug was happening. Include:
- Which component/module failed
- What condition triggered it
- Why the existing logic was wrong]

## Solution

### Approach

[Describe the fix in 2-3 sentences. What was changed and why this approach works.]

### Files Modified

- `path/to/file.ts` - [brief description of change]
- `path/to/other.ts` - [brief description of change]

### Changes Made

[Technical details:
- Specific code changes
- Logic modifications
- Configuration updates
- Database migrations (if any)]

## Verification

- [ ] Bug no longer reproduces (tested locally)
- [ ] Build passes (backend + frontend + linting)
- [ ] Related functionality still works
- [ ] No regressions in adjacent code paths
- [ ] Edge cases considered

## Notes

[Additional observations, lessons learned, follow-up tasks, or related issues]

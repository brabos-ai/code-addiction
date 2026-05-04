# Discovery: {{TASK_NAME}}

> **Branch:** {{BRANCH_NAME}}
> **Feature:** {{FEATURE_ID}}
> **Date:** {{DATE}}

---

## Codebase Analysis

### Commit History
[Recent relevant commits]

### Related Files
- `path/to/file.ts` - [relevance]

### Similar Features
- [similar feature and what to reuse]

### Patterns
[Existing codebase patterns that must be followed]

## Technical Context

### Infrastructure
[Stack, deploy, relevant infra]

### Dependencies
[Libs, external services]

### Integration Points
[Where the feature connects with existing code]

## Files Mapping

### To Create
- `path/to/new-file.ts` - [purpose]

### To Modify
- `path/to/existing-file.ts` - [what changes]

## Technical Assumptions

| Assumption | Impact if Wrong |
|------------|-----------------|
| [assumption] | [consequence] |

## References

### Files Consulted
- `path/to/file.ts`

### Documentation
- [relevant links]

### Related Features (history)
- F[XXXX]-[name] - [relationship]

## Related Features

| Feature | Relation | Key Files | Impact |
|---------|----------|-----------|--------|
| F[XXXX]-[name] | extends\|depends\|conflicts\|shares-pattern\|shares-domain | `src/path/` | [expected action] |

<!-- refs: F[XXXX] -->

**Relationship types:**
- `extends` — reuse code, follow pattern
- `depends` — verify dependency exists and is stable
- `conflicts` — map areas of conflict
- `shares-pattern` — follow pattern for consistency
- `shares-domain` — review to avoid duplication

## Summary for Planning

### Executive Summary
[2-3 sentences]

### Key Decisions
- [important decision]

### Critical Files
- `path/to/critical.ts` - [why it is critical]

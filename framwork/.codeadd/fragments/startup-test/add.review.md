<!-- section:step-list -->
STEP 7: Application Startup Test → IoC/DI runtime validation
<!-- /section:step-list -->

<!-- section:step -->

---

## STEP 7: Application Startup Test (PRD0034)

**Validates IoC/DI at runtime — build passing ≠ app starting.**

```
1. CHECK: does `start:test` exist in package.json scripts?
2. IF NOT EXISTS:
   a. ANALYZE project: framework (NestJS, Express, Next.js, Fastify), entry point, bootstrap method
   b. CREATE ./scripts/bootstrap-check.ts (or .js as appropriate)
      The script MUST: bootstrap completely, NOT listen()/serve(), exit(0) if OK, exit(1) with error if failed
   c. ADD to package.json: "start:test": "ts-node ./scripts/bootstrap-check.ts"
3. EXECUTE: npm run start:test
4. IF exit code 0: STARTUP_CHECK: PASSED → proceed to STEP 8
5. IF exit code 1:
   - Check if error is DI/IoC: "can't resolve dependencies", "is not a provider", etc.
     → DI ERROR: AUTO-FIX, re-run. If still failing → BLOCKED
   - Check if error is connection: DB/Redis/external service unavailable
     → CONNECTION ERROR: STARTUP_CHECK: SKIPPED (environment-specific, not code error)
```

**⛔ IF STARTUP_CHECK FAILS (DI error, not connection):**
- ⛔ DO NOT USE: Write to create review.md
- ✅ DO: Fix DI error, re-run startup test
<!-- /section:step -->

<!-- section:quality-gate -->
| Startup Test | ✅ PASSED / ⚠️ SKIPPED / ❌ BLOCKED | Bootstrap check result |
<!-- /section:quality-gate -->

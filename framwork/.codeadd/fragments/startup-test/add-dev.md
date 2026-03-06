<!-- section:step-list -->
STEP 12: Application Startup Test  → IoC/DI runtime validation
<!-- /section:step-list -->

<!-- section:step -->

---

## STEP 12: Application Startup Test (PRD0034)

**Validates IoC/DI at runtime — compilation passing ≠ app starting.**

```
1. CHECK: does `start:test` exist in package.json scripts?
2. IF NOT EXISTS:
   a. ANALYZE project: framework (NestJS, Express, Next.js, Fastify, etc.), entry point, bootstrap method
   b. CREATE script at ./scripts/bootstrap-check.ts (or .js as appropriate)
      The script MUST:
      - Perform complete bootstrap (resolve all DI/IoC)
      - NOT call listen() / serve() (no port binding, no hang)
      - exit(0) if bootstrap succeeds
      - exit(1) with descriptive error message if bootstrap fails
   c. ADD to package.json: "start:test": "ts-node ./scripts/bootstrap-check.ts" (or equivalent)
   d. EXAMPLE for NestJS:
      ```typescript
      // scripts/bootstrap-check.ts
      import { NestFactory } from '@nestjs/core';
      import { AppModule } from '../src/app.module';
      async function main() {
        const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
        await app.init();
        await app.close();
        console.log('Bootstrap check passed');
        process.exit(0);
      }
      main().catch((err) => {
        console.error('Bootstrap check FAILED:', err.message);
        process.exit(1);
      });
      ```
3. IF EXISTS: proceed directly to execution
4. EXECUTE: npm run start:test
5. IF exit code 0: STARTUP_CHECK: PASSED → proceed to STEP 13
6. IF exit code 1:
   - Show error output (usually reveals EXACTLY which DI provider is missing)
   - AUTO-FIX if possible (e.g.: add missing provider to module)
   - Re-run: npm run start:test
   - IF still failing: BLOCKED — show error and stop
```

**⛔ IF STARTUP_CHECK FAILS AND NOT AUTO-FIXABLE:**
- ⛔ DO NOT: Proceed to STEP 13 (Log Iteration)
- ⛔ DO NOT: Report completion to user
- ✅ DO: Fix DI/IoC error, re-run, confirm PASSED

**NOTE:** Script lives in `./scripts/` and is versioned (useful for future CI). If startup fails due to DB/Redis connection (not DI), treat as SKIPPED with note — connection errors are environment-specific, DI errors are code errors.
<!-- /section:step -->

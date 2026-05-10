---
name: add-plan-based-features
description: Use when adding plan-gated features, flags, limits, or validating plan access via IPlanService
---

# Plan-Based Features

## Overview

This template uses a **3-layer feature system** stored in JSONB. Features are managed via Manager app and validated via `IPlanService`. **DO NOT create new guards, schemas, or feature systems - use the existing pattern.**

## When to Use

- Adding a new boolean feature (flag) gated by plan
- Adding a new numeric limit (workspaces, users, projects)
- Validating feature access in a controller/service
- Modifying which plans have access to a feature

## When NOT to Use

- Non-plan-gated authentication or session checks
- Role-based access control (RBAC) unrelated to subscription tier
- Generic feature flags (A/B tests, experiments) unrelated to billing
- Per-user preferences or workspace settings stored outside plans

## The 3-Layer Structure

| Layer | Purpose | Example |
|-------|---------|---------|
| `limits` | Numeric caps | `workspaces:3, usersPerWorkspace:5` |
| `flags` | Boolean toggles | `reportsExport:true, apiAccess:false` |
| `display` | UI display | `badge, ctaText, displayFeatures[]` |

```typescript
// libs/domain/src/types/PlanFeatures.ts
interface PlanFeatures {
  limits: PlanLimits;   // Quantitative constraints
  flags: PlanFlags;     // Boolean toggles
  display: PlanDisplay; // UI/marketing info
}
```

## Key Files (DO NOT RECREATE)

| File | Purpose |
|------|---------|
| `libs/domain/src/types/PlanFeatures.ts` | Type definitions |
| `libs/backend/src/billing/IPlanService.ts` | Validation interface |
| `apps/backend/src/api/modules/billing/plan.service.ts` | Implementation |
| `libs/app-database/migrations/20250101002_seed_default_plans.js` | Default plans |

## Adding a New Feature Flag

### Step 1: Update Plans via Manager

Plans are managed via Manager app (`/plans`). Use the UI to:
1. Edit the plan
2. Add the flag to `features.flags`
3. Save

### Step 2: Validate in Service/Controller

```typescript
// In your service
@Inject('IPlanService')
private readonly planService: IPlanService;

async exportReport(workspaceId: string) {
  const canExport = await this.planService.canUseFeature(workspaceId, 'reportsExport');
  if (!canExport) {
    throw new ForbiddenException('Upgrade your plan to export reports');
  }
  // ... export logic
}
```

## Adding a New Limit

### Step 1: Update Type

```typescript
// libs/domain/src/types/PlanFeatures.ts
export interface PlanLimits {
  workspaces: number;
  usersPerWorkspace: number;
  projects?: number; // NEW LIMIT
}
```

### Step 2: Update Plans

Update via Manager or migration:

```javascript
// Update all plans with new limit
const plans = await knex('plans').select('*');
for (const plan of plans) {
  const features = JSON.parse(plan.features);
  features.limits.projects = plan.code === 'FREE' ? 3 :
                             plan.code === 'STARTER' ? 10 : 50;
  await knex('plans').where('id', plan.id).update({
    features: JSON.stringify(features)
  });
}
```

### Step 3: Validate Usage

```typescript
// Create validation method in PlanService
async validateProjectCreation(workspaceId: string, currentCount: number): Promise<ValidationResult> {
  const plan = await this.getWorkspacePlan(workspaceId);
  const limit = plan.features.limits.projects ?? Infinity;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Project limit of ${limit} reached. Please upgrade.`
    };
  }
  return { allowed: true };
}
```

## IPlanService Methods

```typescript
interface IPlanService {
  canUseFeature(workspaceId: string, featureName: string): Promise<boolean>;
  checkLimit(workspaceId: string, limitName: string): Promise<FeatureCheckResult>;
  getWorkspacePlan(workspaceId: string): Promise<Plan>;
  validateWorkspaceCreation(accountId: string): Promise<ValidationResult>;
  validateUserAddition(workspaceId: string): Promise<ValidationResult>;
}
```

## Plan Codes

Use these exact codes (defined in `libs/domain/src/enums/PlanCode.ts`):

| Code | Tier |
|------|------|
| `FREE` | Free tier |
| `STARTER` | Basic paid |
| `PROFESSIONAL` | Full features |

## Common Mistakes

| Error | Fix |
|-------|-----|
| Creating new FeatureGuard | Use `IPlanService.canUseFeature()` |
| Adding JSONB column for features | Already exists - just update data |
| Creating new PlanFeatures interface | Use existing in `libs/domain/src/types/` |
| Hardcoding feature checks | Use dynamic flag names with `canUseFeature()` |
| Using wrong plan codes | Use `FREE`, `STARTER`, `PROFESSIONAL` |

## Flow: Plan → Features → Validation

Manager defines features → Subscription links workspace via `plan_price_id` → `PlanService.getWorkspacePlan()` resolves active plan → `canUseFeature()` / `checkLimit()` validates access → Controller/Service allows or blocks operation.

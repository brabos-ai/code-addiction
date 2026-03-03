---
name: plan-based-features
description: Use when implementing features that vary by subscription plan, adding new feature flags or limits, validating plan access in controllers, or modifying plan-gated functionality - provides the 3-layer PlanFeatures pattern and IPlanService integration
---

# Plan-Based Features

## Overview

This template uses a **3-layer feature system** stored in JSONB. Features are managed via Manager app and validated via `IPlanService`. **DO NOT create new guards, schemas, or feature systems - use the existing pattern.**

## When to Use

- Adding a new boolean feature (flag) gated by plan
- Adding a new numeric limit (workspaces, users, projects)
- Validating feature access in a controller/service
- Modifying which plans have access to a feature

## The 3-Layer Structure

```typescript
// libs/domain/src/types/PlanFeatures.ts
interface PlanFeatures {
  limits: PlanLimits;   // Quantitative constraints
  flags: PlanFlags;     // Boolean toggles
  display: PlanDisplay; // UI/marketing info
}
```

{"layers":{"limits":{"purpose":"Numeric caps","example":"workspaces:3,usersPerWorkspace:5"},"flags":{"purpose":"Feature toggles","example":"reportsExport:true,apiAccess:false"},"display":{"purpose":"UI display","example":"badge,ctaText,displayFeatures[]"}}}

## Key Files (DO NOT RECREATE)

{"files":{"libs/domain/src/types/PlanFeatures.ts":"Type definitions","libs/backend/src/billing/IPlanService.ts":"Validation interface","apps/backend/src/api/modules/billing/plan.service.ts":"Implementation","libs/app-database/migrations/20250101002_seed_default_plans.js":"Default plans"}}

## Adding a New Feature Flag

### Step 1: Update Type (if new flag name)

Only if adding a COMMONLY USED flag that should be typed:

```typescript
// libs/domain/src/types/PlanFeatures.ts
export interface PlanFlags {
  [key: string]: boolean;
  // Add commonly used flags for type safety:
  reportsExport?: boolean;
}
```

### Step 2: Update Plans via Manager

Plans are managed via Manager app (`/plans`). Use the UI to:
1. Edit the plan
2. Add the flag to `features.flags`
3. Save

Or create a migration to update existing plans:

```javascript
// libs/app-database/migrations/YYYYMMDD_add_reports_export_flag.js
exports.up = async function(knex) {
  // Update PROFESSIONAL plan to enable the flag
  const plan = await knex('plans').where('code', 'PROFESSIONAL').first();
  const features = JSON.parse(plan.features);
  features.flags.reportsExport = true;
  await knex('plans').where('code', 'PROFESSIONAL').update({
    features: JSON.stringify(features)
  });
};
```

### Step 3: Validate in Service/Controller

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
      reason: `Limite de ${limit} projetos atingido. Faça upgrade.`
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

{"codes":{"FREE":"Free tier","STARTER":"Basic paid","PROFESSIONAL":"Full features"}}

## Common Mistakes

{"mistakes":[{"err":"Creating new FeatureGuard","fix":"Use IPlanService.canUseFeature()"},{"err":"Adding JSONB column for features","fix":"Already exists - just update data"},{"err":"Creating new PlanFeatures interface","fix":"Use existing in libs/domain/src/types/"},{"err":"Hardcoding feature checks","fix":"Use dynamic flag names with canUseFeature()"},{"err":"Using wrong plan codes","fix":"Use FREE, STARTER, PROFESSIONAL"}]}

## Flow: Plan → Features → Validation

```
1. Manager: Define plan features (limits, flags, display)
        ↓
2. Subscription: Links workspace to plan via plan_price_id
        ↓
3. PlanService.getWorkspacePlan(): Resolves active plan
        ↓
4. canUseFeature() / checkLimit(): Validates access
        ↓
5. Controller/Service: Allows or blocks operation
```

## Quick Reference

```typescript
// Check boolean flag
const allowed = await planService.canUseFeature(workspaceId, 'flagName');

// Check numeric limit
const result = await planService.checkLimit(workspaceId, 'limitName');
// result: { allowed: boolean, current?: number, limit?: number }

// Get workspace's plan
const plan = await planService.getWorkspacePlan(workspaceId);
// Access: plan.features.flags, plan.features.limits

// Validate operations
const canCreate = await planService.validateWorkspaceCreation(accountId);
const canAddUser = await planService.validateUserAddition(workspaceId);
// Both return: { allowed: boolean, reason?: string }
```

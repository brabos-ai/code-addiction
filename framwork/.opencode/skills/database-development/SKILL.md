<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/database-development/SKILL.md -->
---
name: database-development
description: |
  Database architecture: entities, repositories, migrations, naming, multi-tenancy — stack-agnostic. Consult stack-context.md for ORM. Use when implementing database layer.
---

# Database Development

Skill for implementing the database layer following universal data architecture principles.

**Use for:** Entities, Migrations, Repositories, Enums, Database types
**Do not use for:** Controllers/DTOs (backend-development), Frontend (ux-design)

**Stack orientation:** Consult `.codeadd/project/stack-context.md` for the ORM and database in use. Apply these principles using the project's ORM API.

---

## Entities

TypeScript interfaces representing domain objects.

```typescript
export interface User {
  id: string;
  accountId: string;  // multi-tenant
  email: string;
  role: UserRole;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

{"rules":["interfaces not classes","camelCase props","reference enums from domain layer","include id, createdAt, updatedAt","include accountId for multi-tenant"]}

**MANDATORY:** Export in barrel file (entities/index.ts).

---

## Enums

```typescript
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
```

{"rules":["PascalCase name","lowercase string values","export in index.ts","use enums over free strings for constrained values"]}

---

## Naming Convention

{"database":"snake_case — user_id, created_at, account_id"}
{"application":"camelCase — userId, createdAt, accountId"}
{"mapping":"repository layer converts between the two via mapper function (toEntity / toPersistence)"}

Use appropriate database types for each column:
- **Identifiers:** UUID
- **Structured data:** JSONB (PostgreSQL) / JSON (MySQL, SQLite)
- **Timestamps:** timestamp with timezone
- **Constrained values:** string column + application-level enum (portable across databases)

---

## Migrations

{"naming":"YYYYMMDDNNN_description_snake_case.[ext]","example":"20251221001_create_invites_table"}

Principles — apply using your project's migration tool syntax:

1. **One migration per change** — do not bundle unrelated schema changes
2. **Never edit an existing migration** — create a new one
3. **Always implement both up and down** — every migration must be reversible
4. **Descriptive names** — the filename should explain the change
5. **Foreign keys** with explicit references and intentional cascade behavior
6. **Indexes** on frequently queried columns (account_id, lookup fields, composite indexes for multi-column queries)
7. **Default values** for id (UUID generation), created_at, updated_at

{"standard_columns":{"id":"UUID, primary key, auto-generated","account_id":"UUID, NOT NULL, FK to accounts, CASCADE delete","created_at":"timestamp, default now()","updated_at":"timestamp, default now()"}}

---

## Repository Pattern

### Interface (contract)

```typescript
export interface IInviteRepository {
  findById(id: string): Promise<Invite | null>;
  findByAccountId(accountId: string): Promise<Invite[]>;
  create(data: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invite>;
  update(id: string, data: Partial<Invite>): Promise<Invite>;
  delete(id: string): Promise<void>;
}
```

### Implementation

The implementation uses the project's ORM. Key rules:

```typescript
// Mapper: snake_case (database) → camelCase (domain)
private toEntity(row: any): Invite {
  return {
    id: row.id,
    accountId: row.account_id,
    email: row.email,
    // ...
  };
}
```

{"rules":["return domain entities NOT raw rows","use toEntity() mapper for snake→camel conversion","ALWAYS filter by account_id/tenant_id","interface defines contract, implementation uses project ORM"]}

---

## Barrel Exports (MANDATORY)

Maintain organized exports for every new entity, enum, repository, and interface:

```typescript
// repositories/index.ts
export * from './UserRepository';
export * from './InviteRepository';

// interfaces/index.ts
export * from './IUserRepository';
export * from './IInviteRepository';

// entities/index.ts
export * from './User';
export * from './Invite';

// enums/index.ts
export * from './UserRole';
export * from './InviteStatus';
```

---

## Multi-Tenancy

**EVERY query MUST filter by account_id/tenant_id. No exceptions.**

```typescript
// WRONG — leaks data across tenants
async findAll(): Promise<User[]> { /* query without tenant filter */ }

// CORRECT — scoped to tenant
async findByAccountId(accountId: string): Promise<User[]> { /* query filtered by account_id */ }
```

{"rules":["account_id FK with CASCADE delete","validate tenant filtering in repository, not in service layer","every table with user data must have account_id column"]}

---

## Relationships

- Explicit foreign keys — always declare FK constraints in migrations
- Cascade with care — document WHERE and WHY cascade deletes are used
- Prefer `CASCADE` for child records that cannot exist without parent (e.g., invites → account)
- Prefer `RESTRICT` or `SET NULL` when child records have independent value

---

## Data Validation

- Validate at entry layer (DTO/input validation), not in database
- Database guarantees referential integrity (FKs, NOT NULL, UNIQUE)
- Application guarantees business rules (format, ranges, permissions)

---

## KISS Principle

- Simple query > complex query
- If you need nested subqueries, rethink the data model
- Prefer multiple simple queries over one complex join when clarity matters
- Optimize only when there is a measured performance problem

---

## Validation Checklist

### Entities
- [ ] Entity is an `interface` (not class)
- [ ] Exported in entities barrel file (index.ts)
- [ ] Properties use camelCase
- [ ] Has `id`, `createdAt`, `updatedAt` fields
- [ ] Has `accountId` field (if multi-tenant)

### Enums
- [ ] Located in enums directory
- [ ] Exported in enums barrel file (index.ts)
- [ ] Values are lowercase strings (e.g., `OWNER = 'owner'`)

### Migration
- [ ] Naming follows `YYYYMMDDNNN_description_snake_case` pattern
- [ ] Has both `up` and `down` (reversible)
- [ ] Foreign keys defined with proper references
- [ ] Indexes on frequently queried columns (account_id, lookup fields)
- [ ] `account_id` FK has CASCADE delete
- [ ] Never modifies an existing migration file

### Repository
- [ ] Interface defines contract with domain types
- [ ] Implementation uses project's ORM (see stack-context.md)
- [ ] Both exported in respective barrel files (index.ts)
- [ ] Returns domain entities (not raw database rows)
- [ ] Every query filters by `account_id` / tenant_id
- [ ] Uses mapper (toEntity) for snake_case → camelCase conversion

### Build
- [ ] Project builds without errors after changes

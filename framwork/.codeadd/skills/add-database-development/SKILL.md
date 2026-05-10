---
name: add-database-development
description: |
  Database layer: entities, repos, migrations, multi-tenancy. Stack-agnostic. Consult CLAUDE.md for ORM.
---

# Database Development

Skill for implementing the database layer following universal data architecture principles.

**Use for:** Entities, Migrations, Repositories, Enums, Database types
**Do not use for:** Controllers/DTOs (`backend-development`), Frontend (`ux-design`), API contracts, query optimization tuning

**Stack orientation:** Consult `CLAUDE.md ## Architecture Contract` for the ORM and database in use. Apply these principles using the project's ORM API.

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

Rules:

- Use interfaces, not classes
- camelCase props
- Reference enums from domain layer
- Include `id`, `createdAt`, `updatedAt`
- Include `accountId` for multi-tenant

**MANDATORY:** Export in barrel file (`entities/index.ts`).

---

## Enums

```typescript
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
```

Rules:

- PascalCase name
- Lowercase string values
- Export in `index.ts`
- Use enums over free strings for constrained values

---

## Naming Convention

| Layer | Casing | Example |
|---|---|---|
| Database | snake_case | `user_id`, `created_at`, `account_id` |
| Application | camelCase | `userId`, `createdAt`, `accountId` |

The repository layer converts between the two via mapper functions (`toEntity` / `toPersistence`).

Use appropriate database types for each column:

- **Identifiers:** UUID
- **Structured data:** JSONB (PostgreSQL) / JSON (MySQL, SQLite)
- **Timestamps:** timestamp with timezone
- **Constrained values:** string column + application-level enum (portable across databases)

---

## Migrations

Naming: `YYYYMMDDNNN_description_snake_case.[ext]` — e.g. `20251221001_create_invites_table`.

Principles — apply using your project's migration tool syntax:

1. **One migration per change** — do not bundle unrelated schema changes
2. **Never edit an existing migration** — create a new one
3. **Always implement both `up` and `down`** — every migration must be reversible
4. **Descriptive names** — the filename should explain the change
5. **Relationships** — explicit FK constraints with intentional cascade behavior; prefer `CASCADE` for child records that cannot exist without parent (e.g., invites → account), `RESTRICT` or `SET NULL` when child has independent value; document WHERE and WHY cascade is used
6. **Indexes** on frequently queried columns (`account_id`, lookup fields, composite indexes for multi-column queries)
7. **Default values** for `id` (UUID generation), `created_at`, `updated_at`

Standard columns (lookup):

| Column | Definition |
|---|---|
| `id` | UUID, primary key, auto-generated |
| `account_id` | UUID, NOT NULL, FK to accounts, CASCADE delete |
| `created_at` | timestamp, default `now()` |
| `updated_at` | timestamp, default `now()` |

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

Rules:

- Return domain entities, NOT raw rows
- Use `toEntity()` mapper for snake → camel conversion
- ALWAYS filter by `account_id`/`tenant_id`
- Interface defines contract; implementation uses project ORM

---

## Barrel Exports (MANDATORY)

Maintain organized exports for every new entity, enum, repository, and interface:

```typescript
// One barrel per directory: entities/, enums/, repositories/, interfaces/
export * from './User';
export * from './Invite';
// ...add every new file
```

---

## Multi-Tenancy

**EVERY query MUST filter by `account_id`/`tenant_id`. No exceptions.**

```typescript
async findAll(): Promise<User[]> { /* WRONG — leaks data across tenants */ }
async findByAccountId(accountId: string): Promise<User[]> { /* CORRECT — scoped */ }
```

Rules:

- `account_id` FK with CASCADE delete
- Validate tenant filtering in repository, not in service layer
- Every table with user data must have an `account_id` column

---

## Validation Checklist

### Entities

- [ ] Entity is an `interface` (not class)
- [ ] Exported in entities barrel file (`index.ts`)
- [ ] Properties use camelCase
- [ ] Has `id`, `createdAt`, `updatedAt` fields
- [ ] Has `accountId` field (if multi-tenant)

### Enums

- [ ] Exported in enums barrel file (`index.ts`)
- [ ] Values are lowercase strings (e.g., `OWNER = 'owner'`)

### Migration

- [ ] Naming follows `YYYYMMDDNNN_description_snake_case` pattern
- [ ] Has both `up` and `down` (reversible)
- [ ] Foreign keys defined with proper references and intentional cascade
- [ ] Indexes on frequently queried columns (`account_id`, lookup fields)
- [ ] `account_id` FK has CASCADE delete
- [ ] Never modifies an existing migration file

### Repository

- [ ] Interface defines contract with domain types
- [ ] Both interface and implementation exported in barrel files
- [ ] Returns domain entities (not raw database rows)
- [ ] Every query filters by `account_id` / `tenant_id`
- [ ] Uses mapper (`toEntity`) for snake_case → camelCase conversion

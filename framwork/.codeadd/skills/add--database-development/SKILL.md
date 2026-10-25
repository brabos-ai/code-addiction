---
name: add--database-development
description: |
  Database layer: entities, repos, migrations, multi-tenancy. Stack-agnostic. Follow project conventions (wiki) for the ORM.
---

# Database Development

Skill for implementing the database layer following universal data architecture principles.

**Use for:** Entities, Migrations, Repositories, Enums, Database types
**Do not use for:** Controllers/DTOs (`backend-development`), Frontend (`ux-design`), API contracts, query optimization tuning

**Stack orientation:** Project conventions: follow `{{addpath:wiki/conventions.md}}` → `## Stack Conventions` (+ `{{addpath:wiki/domains/<area>.md}}`); a one-line critical rule may live in `AGENTS.md`. If absent, apply the agnostic defaults and follow the nearest existing code; never impose tenancy, DI registration or barrels unless the project uses them. The defaults are written once in the backend development skill (`backend-development`) → `## Project Conventions First`. Apply these principles using the project's ORM API (row `ORM / data access`).

---

## Entities

Domain objects in the project's language, in the form neighbouring entity files use (row `Entity language`). The block below is one stack's illustration (TypeScript), not a mandate.

```typescript
export interface User {
  id: string;
  accountId: string;  // only when row `Tenancy` = yes
  email: string;
  role: UserRole;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- Follow the form neighbouring entities use (interface, class, record, struct)
- Property casing follows the project
- Reference enums from the domain layer
- Include `id`, `createdAt`, `updatedAt`
- Include the tenant key (e.g. `accountId`) only when row `Tenancy` = yes

Export in the folder's barrel file only when row `Barrels` = yes.

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
- Export in `index.ts` only when row `Barrels` = yes
- Use enums over free strings for constrained values

---

## Naming Convention

Follow the project's naming. When persistence naming differs from domain naming (a common case, shown here), convert between the two with mapper functions (e.g. `toEntity` / `toPersistence`); when it does not differ, no mapper is needed.

| Layer | Casing | Example |
|---|---|---|
| Database | snake_case | `user_id`, `created_at` |
| Application | camelCase | `userId`, `createdAt` |

Defaults for column types, unless the project differs:

- **Identifiers:** UUID
- **Structured data:** JSONB (PostgreSQL) / JSON (MySQL, SQLite)
- **Timestamps:** timestamp with timezone
- **Constrained values:** string column + application-level enum (portable across databases)

---

## Migrations

Naming: follow the existing migration files. When there are none, the default is `YYYYMMDDNNN_description_snake_case.[ext]` — e.g. `20251221001_create_invites_table`.

Principles — apply using your project's migration tool syntax:

1. **One migration per change** — do not bundle unrelated schema changes
2. **Never edit an existing migration** — create a new one
3. **Always implement both `up` and `down`** — every migration must be reversible
4. **Descriptive names** — the filename should explain the change
5. **Relationships** — explicit FK constraints with intentional cascade behavior; prefer `CASCADE` for child records that cannot exist without parent (e.g., invites → account), `RESTRICT` or `SET NULL` when child has independent value; document WHERE and WHY cascade is used
6. **Indexes** on frequently queried columns (lookup fields, composite indexes for multi-column queries; the tenant key too when row `Tenancy` = yes)
7. **Default values** for `id` (UUID generation), `created_at`, `updated_at`

Standard columns (lookup):

| Column | Definition |
|---|---|
| `id` | UUID, primary key, auto-generated |
| `created_at` | timestamp, default `now()` |
| `updated_at` | timestamp, default `now()` |

When row `Tenancy` = yes, add the tenant key column (e.g. `account_id`: UUID, NOT NULL, FK to accounts, CASCADE delete).

---

## Repository Pattern

Use a repository (and mapper) only when the project already uses them or persistence naming differs from domain naming (row `ORM / data access`). Otherwise follow the project's data-access style.

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
- Use a mapper (e.g. `toEntity()`) for snake → camel conversion when the naming differs
- When row `Tenancy` = yes, scope every query by the recorded key (see Multi-Tenancy)
- Interface defines contract; implementation uses project ORM

---

## Barrel Exports

Applied only when row `Barrels` = yes (do not create new barrels otherwise). Maintain organized exports for every new entity, enum, repository, and interface:

```typescript
// One barrel per directory: entities/, enums/, repositories/, interfaces/
export * from './User';
export * from './Invite';
// ...add every new file
```

---

## Multi-Tenancy

Only when row `Tenancy` = yes. Without it, do not add tenancy; raise it as a planning question.

**EVERY query MUST filter by the recorded tenant key (e.g. `account_id`). No exceptions.**

```typescript
async findAll(): Promise<User[]> { /* WRONG — leaks data across tenants */ }
async findByAccountId(accountId: string): Promise<User[]> { /* CORRECT — scoped */ }
```

Rules:

- Tenant key FK with CASCADE delete
- Validate tenant filtering in the data-access layer, not in the service layer
- Every table with user data must have the tenant key column

---

## Validation Checklist

### Entities

- [ ] Entity uses the form of neighbouring entity files
- [ ] If the project uses barrels: exported in the entities barrel file
- [ ] Properties follow the project's casing
- [ ] Has `id`, `createdAt`, `updatedAt` fields
- [ ] If row `Tenancy` = yes: has the tenant key field

### Enums

- [ ] If the project uses barrels: exported in the enums barrel file
- [ ] Values are lowercase strings (e.g., `OWNER = 'owner'`)

### Migration

- [ ] Naming follows the existing migration files (default `YYYYMMDDNNN_description_snake_case` when none)
- [ ] Has both `up` and `down` (reversible)
- [ ] Foreign keys defined with proper references and intentional cascade
- [ ] Indexes on frequently queried columns (lookup fields; tenant key if row `Tenancy` = yes)
- [ ] If row `Tenancy` = yes: tenant key FK has CASCADE delete
- [ ] Never modifies an existing migration file

### Repository

- [ ] Interface defines contract with domain types
- [ ] If the project uses barrels: interface and implementation exported in them
- [ ] Returns domain entities (not raw database rows)
- [ ] If row `Tenancy` = yes: every query filters by the recorded tenant key
- [ ] If naming differs: uses a mapper (e.g. `toEntity`) for snake_case → camelCase conversion

---
name: database-development
description: |
  Padrões de Database layer: Entities, Migrations, Repositories, Kysely types, JSONB.
---

# Database Development

Skill para implementação de Database layer seguindo padrões do projeto.

**Use para:** Entities, Migrations, Repositories, Kysely types, Enums
**Não use para:** Controllers/DTOs (backend-development), Frontend (ux-design)

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

---

## Structure

```
libs/domain/src/
├── entities/{User,Account}.ts + index.ts
└── enums/{UserRole,EntityStatus}.ts + index.ts

libs/app-database/
├── migrations/YYYYMMDDNNN_description.js
└── src/
    ├── types/{UsersTable,Database}.ts
    ├── interfaces/I{User}Repository.ts + index.ts
    └── repositories/{User}Repository.ts + index.ts
```

---

## Entities

{"location":"libs/domain/src/entities/[Entity].ts"}

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

{"rules":["interfaces not classes","camelCase props","ref enums from @pff/domain","include id,createdAt,updatedAt","include accountId for multi-tenant"]}

**MANDATORY:** Export in `libs/domain/src/entities/index.ts`

---

## Enums

{"location":"libs/domain/src/enums/[EnumName].ts"}

```typescript
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}
```

{"rules":["PascalCase name","lowercase string values","export in index.ts"]}

---

## Kysely Types

{"location":"libs/app-database/src/types/[Table]Table.ts"}

```typescript
export interface UsersTable {
  id: Generated<string>;
  account_id: string;           // snake_case
  email: string;
  role: 'owner' | 'admin';      // string union not enum
  metadata: ColumnType<Record<string, unknown>, string, string>;  // JSONB
  created_at: Generated<Date>;
}
```

{"naming":{"domain":"userId","kysely":"user_id","db":"user_id"}}

**Add to Database.ts:**
```typescript
export interface Database {
  users: UsersTable;
  invites: InvitesTable;  // new table
}
```

---

## JSONB

{"read":"Kysely returns PARSED object → NO JSON.parse()"}
{"write":"Pass object directly → NO JSON.stringify()"}

```typescript
// WRONG
const data = JSON.parse(result.metadata);  // already object
await db.insertInto('x').values({ metadata: JSON.stringify({}) });

// CORRECT
const data = result.metadata;
await db.insertInto('x').values({ metadata: { key: 'value' } });
```

---

## Migrations

{"naming":"YYYYMMDDNNN_description_snake_case.js"}
{"example":"20251221001_create_invites_table.js"}

```javascript
exports.up = function(knex) {
  return knex.schema.createTable('invites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    t.string('email').notNullable();
    t.string('status').notNullable().defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.index('account_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('invites');
};
```

{"columnTypes":{"uuid":"t.uuid('id')","string":"t.string('name')","text":"t.text('desc')","int":"t.integer('n')","bool":"t.boolean('active')","timestamp":"t.timestamp('at')","jsonb":"t.jsonb('meta')","enum":"t.string('status')"}}

{"commands":["npm run migrate:latest","npm run migrate:rollback","npm run migrate:status"]}

---

## Repository

{"interface":"libs/app-database/src/interfaces/I[Entity]Repository.ts"}
{"impl":"libs/app-database/src/repositories/[Entity]Repository.ts"}

```typescript
// Interface
export interface IInviteRepository {
  findById(id: string): Promise<Invite | null>;
  findByAccountId(accountId: string): Promise<Invite[]>;
  create(data: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invite>;
  update(id: string, data: Partial<Invite>): Promise<Invite>;
  delete(id: string): Promise<void>;
}

// Implementation
@Injectable()
export class InviteRepository implements IInviteRepository {
  constructor(@Inject('DATABASE') private readonly db: Kysely<Database>) {}

  async findByAccountId(accountId: string): Promise<Invite[]> {
    const rows = await this.db
      .selectFrom('invites')
      .where('account_id', '=', accountId)  // MANDATORY tenant filter
      .selectAll()
      .execute();
    return rows.map(this.toEntity);
  }

  private toEntity(row: any): Invite {
    return {
      id: row.id,
      accountId: row.account_id,  // snake_case → camelCase
      // ...
    };
  }
}
```

{"rules":["return domain entities NOT raw rows","use toEntity() for snake→camel","ALWAYS filter by account_id","use @Inject('DATABASE')"]}

---

## Barrel Exports (MANDATORY)

```typescript
// libs/app-database/src/repositories/index.ts
export * from './UserRepository';
export * from './InviteRepository';

// libs/app-database/src/interfaces/index.ts
export * from './IUserRepository';
export * from './IInviteRepository';

// libs/domain/src/entities/index.ts
export * from './User';
export * from './Invite';

// libs/domain/src/enums/index.ts
export * from './UserRole';
export * from './InviteStatus';
```

---

## Multi-Tenancy

**EVERY query MUST filter by account_id**

```typescript
// WRONG
async findAll() { return this.db.selectFrom('users').selectAll().execute(); }

// CORRECT
async findByAccountId(accountId: string) {
  return this.db.selectFrom('users').where('account_id', '=', accountId).selectAll().execute();
}
```

{"fk":"account_id CASCADE delete"}

---

## Date Handling

{"read":"Kysely returns Date objects → NO new Date() needed"}
{"compare":"use Date objects not strings"}

---

## Validation Checklist

### Entities
- [ ] Entity is an `interface` (not class) in `libs/domain/src/entities/`
  → Check: file uses `export interface`, not `export class`
- [ ] Exported in `libs/domain/src/entities/index.ts`
  → Check: barrel file has `export * from './EntityName'`
- [ ] Properties use camelCase
  → Check: no snake_case properties in entity interface
- [ ] Has `id`, `createdAt`, `updatedAt` fields
  → Check: entity interface includes all 3 fields
- [ ] Has `accountId` field (if multi-tenant)
  → Check: entity includes accountId for tenant isolation

### Enums
- [ ] Located in `libs/domain/src/enums/`
  → Check: enum file is in correct directory
- [ ] Exported in `libs/domain/src/enums/index.ts`
  → Check: barrel file has `export * from './EnumName'`
- [ ] Values are lowercase strings (e.g., `OWNER = 'owner'`)
  → Check: enum values use lowercase string literals

### Kysely Types
- [ ] Table type in `libs/app-database/src/types/`
  → Check: `[Table]Table.ts` file exists
- [ ] Added to `Database` interface in `Database.ts`
  → Check: Database interface includes new table mapping
- [ ] Columns use snake_case (e.g., `account_id`, `created_at`)
  → Check: all column names in table type use snake_case
- [ ] JSONB columns use `ColumnType<Record<string, unknown>, string, string>`
  → Check: JSONB fields use proper ColumnType, not plain object

### Migration
- [ ] Naming follows `YYYYMMDDNNN_description_snake_case.js`
  → Check: migration filename matches pattern
- [ ] Has both `up` and `down` functions
  → Check: file exports `exports.up` and `exports.down`
- [ ] Foreign keys defined with proper references
  → Check: `.references('id').inTable('table')` on FK columns
- [ ] Indexes on frequently queried columns
  → Check: `t.index('column')` for account_id and lookup fields
- [ ] `account_id` has `CASCADE` delete
  → Check: `.onDelete('CASCADE')` on account_id FK

### Repository
- [ ] Interface in `libs/app-database/src/interfaces/I[Entity]Repository.ts`
  → Check: interface file exists with correct naming
- [ ] Implementation in `libs/app-database/src/repositories/[Entity]Repository.ts`
  → Check: implementation file exists with `@Injectable()` decorator
- [ ] Both exported in respective `index.ts` files
  → Check: interface and impl barrel exports updated
- [ ] Returns domain entities (not raw database rows)
  → Check: methods return entity type, use `toEntity()` mapper
- [ ] Every query filters by `account_id`
  → Check: all query methods include `.where('account_id', '=', accountId)`
- [ ] Uses `toEntity()` for snake_case→camelCase conversion
  → Check: private `toEntity` method exists and is used

### Build
- [ ] Build passes: `npm run build -w @pff/database -w @pff/domain`
  → Check: run build command, zero errors

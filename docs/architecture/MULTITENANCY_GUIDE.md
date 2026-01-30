# Multitenancy Architecture Guide

> Last Updated: 2026-01-30

## Overview

Aluminify uses a **shared-database, shared-schema** multitenancy model where all tenants share the same PostgreSQL database and tables. Tenant isolation is enforced at multiple layers:

1. **Database Layer** — Row Level Security (RLS) policies filter data by `empresa_id`
2. **Function Layer** — SECURITY DEFINER helper functions resolve tenant context
3. **Application Layer** — Middleware validates tenant access on every request
4. **Trigger Layer** — INSERT triggers validate `empresa_id` on critical tables

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Client Request                                                   │
├──────────────────────────────────────────────────────────────────┤
│  1. Next.js Middleware                                            │
│     ├── Resolve tenant (subdomain / custom domain / slug)        │
│     ├── Set x-tenant-id, x-tenant-slug headers                  │
│     └── Rate limit check (per-tenant)                            │
├──────────────────────────────────────────────────────────────────┤
│  2. Route Handler / Server Component                              │
│     ├── requireTenantUser(slug) — auth + tenant validation       │
│     ├── Create user-scoped DB client (getDatabaseClientAsUser)   │
│     └── Use RepositoryFactory for data access                    │
├──────────────────────────────────────────────────────────────────┤
│  3. Supabase RLS Layer                                            │
│     ├── get_user_empresa_id() — resolve user's tenant            │
│     ├── Policy: empresa_id = get_user_empresa_id()               │
│     └── validate_empresa_id() trigger on INSERT                  │
├──────────────────────────────────────────────────────────────────┤
│  4. PostgreSQL                                                    │
│     └── Data filtered by empresa_id (automatic via RLS)          │
└──────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Tenant Resolution

Tenants are identified by their `slug` in the URL path (`/escola-abc/dashboard`) or by subdomain (`escola-abc.alumnify.com.br`). The resolution flow:

1. **Middleware** resolves the tenant and sets headers (`x-tenant-id`)
2. **Server components** call `requireTenantUser(slug)` which:
   - Authenticates the user via `requireUser()`
   - Resolves the slug to `empresaId` via `resolveTenantId()`
   - Validates user belongs to that tenant
   - Redirects if mismatch

### Database Client Selection

| Client | Function | Use Case |
|---|---|---|
| `getDatabaseClientAsUser(token)` | Respects RLS | **Default** — user-facing operations |
| `getDatabaseClient()` | Bypasses RLS | System operations (cron, webhooks, admin) |
| `createRepositoryFactory()` | Respects RLS | **Recommended** — creates typed repositories |

**Rule**: Always use `createRepositoryFactory()` or `getDatabaseClientAsUser()` for tenant-scoped operations. Only use `getDatabaseClient()` when you explicitly need to bypass tenant isolation.

### RLS Policy Pattern

Every table with `empresa_id` should have these policies:

```sql
-- SELECT: Users see only their tenant's data
CREATE POLICY "select_own_empresa"
ON public.{table} FOR SELECT TO authenticated
USING (empresa_id = public.get_user_empresa_id());

-- INSERT: Users can only insert into their tenant
CREATE POLICY "insert_own_empresa"
ON public.{table} FOR INSERT TO authenticated
WITH CHECK (empresa_id = public.get_user_empresa_id());

-- UPDATE: Users can only update their tenant's data
CREATE POLICY "update_own_empresa"
ON public.{table} FOR UPDATE TO authenticated
USING (empresa_id = public.get_user_empresa_id())
WITH CHECK (empresa_id = public.get_user_empresa_id());

-- DELETE: Users can only delete their tenant's data
CREATE POLICY "delete_own_empresa"
ON public.{table} FOR DELETE TO authenticated
USING (empresa_id = public.get_user_empresa_id());
```

### Helper Functions

All tenant-context functions use `SECURITY DEFINER` to bypass RLS (avoiding recursion) and `SET search_path = ''` for security:

| Function | Purpose |
|---|---|
| `get_user_empresa_id()` | Returns the empresa_id of the authenticated user |
| `is_empresa_admin()` | Checks if user is admin of their empresa |
| `validate_user_tenant_access(uuid)` | Validates user belongs to specific tenant |
| `get_user_empresa_ids()` | Returns all empresas for multi-tenant users |

## Adding a New Table

When creating a new tenant-scoped table:

1. **Add `empresa_id` column**:
   ```sql
   empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE
   ```

2. **Enable RLS**:
   ```sql
   ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
   ```

3. **Add standard policies** (see pattern above)

4. **Add composite index**:
   ```sql
   CREATE INDEX idx_{table}_empresa_{common_column}
   ON public.{table}(empresa_id, {common_filter_column});
   ```

5. **Add validation trigger**:
   ```sql
   CREATE TRIGGER trg_validate_empresa_id
   BEFORE INSERT ON public.{table}
   FOR EACH ROW
   EXECUTE FUNCTION public.validate_empresa_id();
   ```

6. **Update TypeScript types**: Run `npx supabase gen types typescript`

## Repository Pattern

Repositories accept a `SupabaseClient` in their constructor and use it for all queries:

```typescript
export class MyRepositoryImpl implements MyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByEmpresa(empresaId: string): Promise<MyEntity[]> {
    const { data, error } = await this.client
      .from('my_table')
      .select('*')
      .eq('empresa_id', empresaId);
    // ...
  }
}
```

Use the `RepositoryFactory` to create instances:

```typescript
import { createRepositoryFactory } from '@/app/shared/core/repository-factory';

const factory = await createRepositoryFactory();
const repo = factory.create(MyRepositoryImpl);
```

## Security Checklist for New Features

- [ ] Table has `empresa_id` column (NOT NULL for tenant-scoped data)
- [ ] RLS is enabled on the table
- [ ] SELECT/INSERT/UPDATE/DELETE policies filter by `empresa_id`
- [ ] Composite index on `(empresa_id, common_filter_column)` exists
- [ ] `validate_empresa_id()` trigger is applied
- [ ] Repository uses `getDatabaseClientAsUser()` or `RepositoryFactory`
- [ ] API routes call `requireTenantUser()` before data access
- [ ] No use of `getDatabaseClient()` for user-facing operations
- [ ] TypeScript types are regenerated after migration

## Audit and Monitoring

- **Audit log**: `tenant_access_log` table tracks access patterns
- **Logging function**: `log_tenant_access(table, operation, count, metadata)`
- **Cleanup**: `cleanup_tenant_access_log(90)` removes entries older than 90 days
- **Advisors**: Run `mcp__supabase__get_advisors('security')` to check for RLS gaps

## Rate Limiting

Per-tenant rate limits are enforced at the application layer:

| Plan | Requests/min |
|---|---|
| basico | 100 |
| profissional | 500 |
| enterprise | 2000 |

Usage:
```typescript
import { rateLimitService } from '@/app/shared/core/services/rate-limit';

const allowed = rateLimitService.checkLimit(empresaId, 'basico');
if (!allowed) {
  return new Response('Too Many Requests', { status: 429 });
}
```

## Troubleshooting

### "infinite recursion detected in policy"
A RLS policy on table A queries table B, whose RLS policy queries table A. Fix by using `SECURITY DEFINER` helper functions that bypass RLS.

### "permission denied for table usuarios"
A RLS policy uses `SECURITY INVOKER` and tries to access a table it doesn't have permission for. Fix by changing the function to `SECURITY DEFINER`.

### "empresa_id does not match user tenant"
The `validate_empresa_id()` trigger rejected an INSERT because the `empresa_id` doesn't match the authenticated user's tenant. This is expected behavior — the user is trying to insert data into another tenant.

### Data visible across tenants
1. Check that the table has RLS enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. Check that policies filter by `empresa_id`: `USING (empresa_id = get_user_empresa_id())`
3. Check that the application uses `getDatabaseClientAsUser()` not `getDatabaseClient()`

# RLS Risk Matrix

> Generated: 2026-01-30
> Purpose: Classify all RLS policies by risk level for the multitenant architecture.

## Risk Classification

| Level | Description | Action |
|---|---|---|
| **CRITICAL** | Policies that allow data leakage between tenants | Immediate fix required |
| **HIGH** | Policies with recursion risk or significant performance impact | Fix in next sprint |
| **MEDIUM** | Policies that are redundant, inconsistent, or poorly documented | Schedule cleanup |
| **LOW** | Policies that work correctly but could be optimized | Nice to have |

## Policy Analysis

### CRITICAL — Potential Cross-Tenant Leaks

| Table | Policy | Issue | Remediation |
|---|---|---|---|
| `module_definitions` | `USING (true)` | Exposes all module definitions to all users | **Acceptable** — global config table, no tenant-specific data |
| `submodule_definitions` | `USING (true)` | Exposes all submodule definitions to all users | **Acceptable** — global config table, no tenant-specific data |

> **Status:** No critical cross-tenant leak policies found. The `USING(true)` policies only apply to global configuration tables that do not contain tenant-specific data.

### HIGH — Recursion or Performance Risk

| Table | Policy | Issue | Remediation |
|---|---|---|---|
| `empresas` | `Usuarios veem apenas sua empresa` | Uses subquery on `usuarios` table — if `usuarios` RLS also queries `empresas`, creates circular dependency | Use `get_user_empresa_id()` (SECURITY DEFINER) to break cycle |
| `usuarios` | SELECT policies | Multiple policies with different access patterns could cause unexpected interactions | Consolidate into fewer, clearer policies |
| `cursos` | 7 policies | High policy count increases evaluation overhead on every query | Consider consolidating overlapping policies |

### MEDIUM — Inconsistency or Redundancy

| Table | Policies | Issue | Remediation |
|---|---|---|---|
| `agendamentos` | 8 policies | Highest policy count — multiple overlapping SELECT/UPDATE/DELETE policies | Audit for redundancy |
| `agendamento_bloqueios` | 8 policies | Same pattern as agendamentos | Audit for redundancy |
| `alunos_cursos` | 7 policies | High count for a junction table | Some may be legacy |
| `api_keys` | 7 policies | No empresa_id column — relies on created_by for isolation | Add empresa_id column |
| `materiais_curso` | 6 policies | Has a `{public}` role SELECT policy | Review if anonymous access is needed |

### LOW — Optimization Opportunities

| Table | Policy | Issue | Remediation |
|---|---|---|---|
| Various | Policies using `EXISTS (SELECT 1 FROM usuarios u WHERE ...)` | Direct table lookup instead of `get_user_empresa_id()` function | Standardize on function call for consistency |
| `coupons`, `products`, `transactions` | Uses `usuarios_empresas` subquery | Good pattern but verbose | Consider helper function |
| Branding tables | Single policies | Only admin-level access defined | May need read access for regular users |

## Security Function Audit

| Function | Security | Volatility | Config | Risk |
|---|---|---|---|---|
| `get_user_empresa_id()` | DEFINER | STABLE | `search_path=""` | LOW |
| `is_empresa_admin()` | DEFINER | STABLE | `search_path=""` | LOW |
| `is_empresa_admin(uuid, uuid)` | DEFINER | STABLE | `search_path=""` | LOW |
| `is_empresa_owner(uuid)` | DEFINER | STABLE | `search_path=""` | LOW |
| `user_belongs_to_empresa(uuid)` | DEFINER | STABLE | `search_path=""` | LOW |
| `aluno_matriculado_empresa(uuid)` | DEFINER | STABLE | `search_path=""` | LOW |
| `get_aluno_empresa_id()` | DEFINER | STABLE | `search_path=""` | LOW |
| **`get_aluno_empresas()`** | **INVOKER** | STABLE | `search_path=""` | **HIGH** |
| `is_aluno()` | DEFINER | STABLE | `search_path=""` | LOW |
| `handle_new_user()` | DEFINER | VOLATILE | `search_path=""` | LOW |

### Key Finding

Only **`get_aluno_empresas()`** remains as `SECURITY INVOKER`. All other critical tenant-context functions have been correctly set to `SECURITY DEFINER` through previous migrations.

## Recommendations Priority

1. **Fix `get_aluno_empresas()`** — Change to SECURITY DEFINER (Migration needed)
2. **Add `validate_user_tenant_access()` function** — Utility for application-level validation
3. **Add `empresa_id` to `api_keys` and `tenant_logos`** — Direct tenant filtering
4. **Create composite indexes** — Performance improvement for tenant-scoped queries
5. **Consolidate high-count policies** — Reduce RLS evaluation overhead
6. **Add audit logging** — Track cross-tenant access attempts
7. **Implement application-level rate limiting** — Per-tenant request quotas

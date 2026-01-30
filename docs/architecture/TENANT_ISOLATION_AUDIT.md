# Tenant Isolation Audit

> Generated: 2026-01-30
> Last Updated: 2026-01-30
> Status: Post-hardening — all critical and high issues resolved

## Executive Summary

This document provides a comprehensive inventory of all tables, their tenant isolation mechanisms, RLS policies, and security functions in the Aluminify multitenant architecture. The audit was updated after applying security hardening migrations on 2026-01-30.

**Resolved Issues:**
- `get_aluno_empresas()` upgraded to SECURITY DEFINER
- `api_keys` now has `empresa_id` column with backfill and autofill trigger
- `tenant_logos` now has `empresa_id` column with backfill
- Composite indexes added for all major tenant-scoped query patterns
- `validate_empresa_id()` trigger protects INSERT on critical tables
- `tenant_access_log` table created for audit logging

## 1. Table Inventory

### Tables WITH `empresa_id` (42 tables)

| Table | RLS Enabled | Policy Count | Composite Indexes | Notes |
|---|---|---|---|---|
| agendamento_bloqueios | Yes | 8 | empresa_tipo_data | |
| agendamento_configuracoes | Yes | 4 | empresa_id | |
| agendamento_disponibilidade | Yes | 3 | empresa_id | |
| agendamento_notificacoes | Yes | 3 | empresa_id | |
| agendamento_recorrencia | Yes | 5 | professor_empresa_ativo | |
| agendamentos | Yes | 8 | empresa_data | |
| ai_agents | Yes | 2 | empresa_slug_unique | Admin-only management |
| api_keys | Yes | 4 | empresa_id | **NEW** empresa_id added |
| atividades | Yes | 5 | empresa_modulo | |
| aulas | Yes | 5 | empresa_modulo | |
| aulas_concluidas | Yes | 3 | empresa_id | |
| chat_conversation_history | Yes | 2 | empresa_id | |
| chat_conversations | Yes | 2 | empresa_user | |
| color_palettes | Yes | 1 | empresa_id | Branding |
| coupons | Yes | 4 | empresa_code_unique | E-commerce |
| cronogramas | Yes | 3 | empresa_created | |
| cursos | Yes | 7 | empresa_disciplina | Core academic |
| custom_theme_presets | Yes | 1 | empresa_default | Branding |
| disciplinas | Yes | 4 | nome_empresa_unique | |
| flashcards | Yes | 4 | empresa_modulo | |
| font_schemes | Yes | 1 | empresa_id | Branding |
| frentes | Yes | 5 | empresa_curso | |
| materiais_curso | Yes | 6 | empresa_curso | |
| matriculas | Yes | 5 | empresa_usuario | |
| modulos | Yes | 5 | empresa_frente | |
| papeis | Yes | 6 | nome_empresa_unique | Custom roles per tenant |
| payment_providers | Yes | 4 | empresa_provider_unique | E-commerce |
| products | Yes | 4 | empresa_provider_unique | E-commerce |
| progresso_atividades | Yes | 5 | empresa_usuario | |
| progresso_flashcards | Yes | 4 | empresa_aluno | |
| regras_atividades | Yes | 2 | empresa_id | |
| segmentos | Yes | 4 | nome_empresa_unique | |
| sessoes_estudo | Yes | 3 | empresa_usuario | |
| tenant_access_log | Yes | 1 | empresa_created, usuario | **NEW** audit log |
| tenant_branding | Yes | 1 | empresa_unique | |
| tenant_logos | Yes | 1 | empresa_id | **NEW** empresa_id added |
| tenant_module_visibility | Yes | 2 | empresa_module_unique | |
| tenant_submodule_visibility | Yes | 2 | empresa_module_sub | |
| transactions | Yes | 4 | empresa_provider_unique | E-commerce |
| turmas | Yes | 3 | empresa_id | |
| usuarios | Yes | 6 | empresa_active, email_empresa | Core user table |
| usuarios_disciplinas | Yes | 5 | empresa_id | |
| usuarios_empresas | Yes | 4 | active_bindings | Tenant binding |

### Tables WITHOUT `empresa_id` (9 tables)

| Table | RLS Enabled | Policy Count | Isolation Mechanism | Risk Level |
|---|---|---|---|---|
| alunos_cursos | Yes | 7 | Junction: usuario_id + curso RLS | LOW |
| alunos_turmas | Yes | 3 | Junction: usuario_id + turma RLS | LOW |
| cronograma_itens | Yes | 2 | Child: cronograma_id join | LOW |
| cronograma_semanas_dias | Yes | 2 | Child: cronograma_id join | LOW |
| cronograma_tempo_estudos | Yes | 2 | Child: cronograma_id join | LOW |
| cursos_disciplinas | Yes | 4 | Junction: curso_id join | LOW |
| empresas | Yes | 2 | IS the tenant table | N/A |
| module_definitions | Yes | 1 | USING(true) — global config | NONE |
| submodule_definitions | Yes | 1 | USING(true) — global config | NONE |

## 2. Helper Functions Inventory

All functions now use `SECURITY DEFINER` and `SET search_path = ''`:

| Function | Arguments | Security | Volatility | Status |
|---|---|---|---|---|
| `get_user_empresa_id` | — | DEFINER | STABLE | OK |
| `get_auth_user_empresa_id` | — | DEFINER | STABLE | OK |
| `get_aluno_empresa_id` | — | DEFINER | STABLE | OK |
| `get_aluno_empresas` | — | DEFINER | STABLE | **FIXED** |
| `get_user_empresa_ids` | — | DEFINER | STABLE | **NEW** |
| `is_empresa_admin` | — | DEFINER | N/A | OK |
| `is_empresa_admin` | user_id, empresa_id | DEFINER | N/A | OK |
| `is_empresa_owner` | empresa_id | DEFINER | STABLE | OK |
| `user_belongs_to_empresa` | empresa_id | DEFINER | STABLE | OK |
| `aluno_matriculado_empresa` | empresa_id | DEFINER | N/A | OK |
| `is_aluno` | — | DEFINER | STABLE | OK |
| `is_professor` | — | DEFINER | STABLE | OK |
| `validate_user_tenant_access` | tenant_id | DEFINER | STABLE | **NEW** |
| `validate_empresa_id` | — (trigger) | DEFINER | N/A | **NEW** |
| `log_tenant_access` | table, op, count, meta | DEFINER | N/A | **NEW** |
| `cleanup_tenant_access_log` | days | DEFINER | N/A | **NEW** |

## 3. Data Dependency Tree

```
empresas (tenant root)
├── usuarios (empresa_id) ──────────┐
├── usuarios_empresas ──────────────┤
├── cursos ─────────────────────────┤
│   ├── frentes                     │
│   ├── modulos                     │
│   │   ├── aulas                   │
│   │   ├── flashcards              │
│   │   └── atividades              │
│   ├── materiais_curso             │
│   └── cursos_disciplinas (via curso join)
├── disciplinas                     │
├── segmentos                       │
├── cronogramas                     │
│   ├── cronograma_itens (via join) │
│   ├── cronograma_semanas_dias     │
│   └── cronograma_tempo_estudos    │
├── agendamentos                    │
├── turmas                          │
├── tenant_branding                 │
│   └── tenant_logos (empresa_id)   │
├── papeis                          │
├── ai_agents                       │
├── api_keys (empresa_id)           │
├── tenant_access_log               │
└── payment/finance tables          │
                                    │
alunos_cursos (junction via cursos + usuarios)
alunos_turmas (junction via turmas + usuarios)
```

## 4. Security Hardening Applied (2026-01-30)

### Migrations Applied

1. **fix_helper_functions_security_context** — Fixed `get_aluno_empresas()` to SECURITY DEFINER, added `validate_user_tenant_access()` and `get_user_empresa_ids()`, standardized autofill triggers.

2. **fix_rls_recursion_all_tables** — Replaced `empresas` SELECT policy subquery with `get_user_empresa_id()` function call to break recursion cycle. Added fast-path patterns for self-referencing policies.

3. **optimize_helper_functions_stable** — Marked all helper functions as STABLE for transaction-level caching. Optimized lookup order to check `usuarios` first (unified model).

4. **add_empresa_id_missing_tables** — Added `empresa_id` to `api_keys` and `tenant_logos` with backfill from related data. Updated RLS policies to use empresa_id directly.

5. **create_composite_indexes** — Added 16 composite indexes for common tenant-scoped query patterns. Added extended statistics for planner optimization.

6. **security_hardening_rls_and_triggers** — Removed overly broad `{public}` role policies. Added `validate_empresa_id()` trigger on 11 critical tables. Added storage quota columns.

7. **add_tenant_audit_log** — Created audit log table with RLS, logging function, and auto-cleanup function.

## 5. Remaining Considerations

- **Junction tables**: `alunos_cursos`, `alunos_turmas`, `cursos_disciplinas` rely on parent table RLS for isolation. This is an acceptable design for junction tables.
- **Cronograma child tables**: Use EXISTS subqueries to validate access via parent cronograma. Performance is acceptable with current indexes.
- **Global config tables**: `module_definitions` and `submodule_definitions` use `USING(true)` which is correct for system-wide configuration data.

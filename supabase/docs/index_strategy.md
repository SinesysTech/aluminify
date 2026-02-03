# Index Strategy Documentation

This document catalogs all indexes in the Aluminify database, with special attention to indexes that may appear "unused" in `pg_stat_user_indexes` but serve critical infrastructure purposes. **Do not remove indexes listed here without understanding their category.**

## Why Indexes May Show Zero Scans

PostgreSQL's `pg_stat_user_indexes.idx_scan` counter only tracks explicit index scans from user queries. It does **not** count:

1. **RLS policy evaluation** — When the query planner inlines RLS `USING(...)` clauses, index usage during policy evaluation is attributed to the underlying table scan, not the index stats.
2. **Foreign key constraint checks** — `ON DELETE CASCADE`, `ON DELETE SET NULL`, and referential integrity checks use indexes internally but don't increment `idx_scan`.
3. **Low-traffic features** — New feature tables may have indexes that will be used once the feature scales.

---

## Section 1: RLS Tenant Isolation Indexes (empresa_id)

These indexes are **critical** for multi-tenant RLS performance. Every RLS policy that checks `empresa_id = get_user_empresa_id()` relies on these indexes for efficient filtering. Without them, every RLS check would trigger a sequential scan.

**Rule: NEVER remove these indexes.**

| Index Name | Table | Definition |
|---|---|---|
| `idx_agendamento_disponibilidade_empresa_id` | agendamento_disponibilidade | `btree (empresa_id)` |
| `idx_chat_conversations_empresa_id` | chat_conversations | `btree (empresa_id)` |
| `idx_chat_conversations_empresa_user` | chat_conversations | `btree (empresa_id, user_id)` |
| `idx_custom_theme_presets_is_default` | custom_theme_presets | `btree (empresa_id, is_default) WHERE is_default = true` |
| `idx_disciplinas_empresa_id` | disciplinas | `btree (empresa_id) WHERE empresa_id IS NOT NULL` |
| `idx_disciplinas_empresa_id_null` | disciplinas | `btree (id) WHERE empresa_id IS NULL` |
| `idx_empresa_oauth_creds_empresa_provider` | empresa_oauth_credentials | `btree (empresa_id, provider) WHERE active = true` |
| `idx_frentes_empresa_curso` | frentes | `btree (empresa_id, curso_id)` |
| `idx_frentes_empresa_id` | frentes | `btree (empresa_id)` |
| `idx_modalidades_curso_empresa_id` | modalidades_curso | `btree (empresa_id)` |
| `idx_modulos_empresa_frente` | modulos | `btree (empresa_id, frente_id)` |
| `idx_plantao_uso_mensal_empresa_id` | plantao_uso_mensal | `btree (empresa_id)` |
| `idx_progresso_atividades_empresa_id` | progresso_atividades | `btree (empresa_id)` |
| `idx_progresso_atividades_empresa_usuario` | progresso_atividades | `btree (empresa_id, usuario_id)` |
| `idx_progresso_flashcards_empresa_aluno` | progresso_flashcards | `btree (empresa_id, usuario_id)` |
| `idx_regras_atividades_empresa_id` | regras_atividades | `btree (empresa_id)` |
| `idx_segmentos_empresa_id` | segmentos | `btree (empresa_id) WHERE empresa_id IS NOT NULL` |
| `idx_sessoes_estudo_empresa_usuario` | sessoes_estudo | `btree (empresa_id, usuario_id)` |
| `idx_tenant_logos_empresa_id` | tenant_logos | `btree (empresa_id)` |
| `idx_usuarios_disciplinas_empresa_id` | usuarios_disciplinas | `btree (empresa_id)` |

---

## Section 2: Foreign Key Support Indexes

These indexes support `ON DELETE CASCADE` and `ON DELETE SET NULL` operations. Without them, deleting a parent row triggers sequential scans on the child table to find referencing rows. This is especially critical for cascade deletes on `cursos`, `frentes`, `modulos`, `disciplinas`, etc.

**Rule: Do not remove unless the corresponding FK constraint is also removed.**

| Index Name | Table | Column | Supports FK to |
|---|---|---|---|
| `idx_cronograma_tempo_estudos_frente_id` | cronograma_tempo_estudos | `frente_id` | frentes |
| `idx_cursos_disciplina_id` | cursos | `disciplina_id` | disciplinas |
| `idx_cursos_segmento_id` | cursos | `segmento_id` | segmentos |
| `idx_cursos_modalidade_id` | cursos | `modalidade_id` | modalidades_curso |
| `idx_sessoes_estudo_frente_id` | sessoes_estudo | `frente_id` | frentes |
| `idx_sessoes_estudo_modulo_id` | sessoes_estudo | `modulo_id` | modulos |
| `idx_sessoes_disciplina` | sessoes_estudo | `disciplina_id` | disciplinas |
| `idx_usuarios_disciplinas_curso_id` | usuarios_disciplinas | `curso_id` | cursos |
| `idx_usuarios_disciplinas_disciplina_id` | usuarios_disciplinas | `disciplina_id` | disciplinas |
| `idx_usuarios_disciplinas_frente_id` | usuarios_disciplinas | `frente_id` | frentes |
| `idx_usuarios_disciplinas_modulo_id` | usuarios_disciplinas | `modulo_id` | modulos |
| `idx_usuarios_disciplinas_turma_id` | usuarios_disciplinas | `turma_id` | turmas |
| `idx_alunos_turmas_turma_id` | alunos_turmas | `turma_id` | turmas |
| `idx_regras_atividades_curso` | regras_atividades | `curso_id` | cursos |
| `idx_tenant_branding_color_palette_id` | tenant_branding | `color_palette_id` | color_palettes |
| `idx_tenant_branding_font_scheme_id` | tenant_branding | `font_scheme_id` | font_schemes |
| `idx_custom_theme_presets_color_palette_id` | custom_theme_presets | `color_palette_id` | color_palettes |
| `idx_custom_theme_presets_font_scheme_id` | custom_theme_presets | `font_scheme_id` | font_schemes |
| `idx_curso_modulos_module_id` | curso_modulos | `module_id` | module_definitions |

---

## Section 3: New Feature Indexes

These indexes support tables for features with low current usage (financeiro, AI agents, coupons). They are small (8-40 KB each) and will become critical as usage scales. Total overhead is negligible.

**Rule: Review after 6 months of production usage. Remove only if the feature is deprecated.**

| Index Name | Table | Definition |
|---|---|---|
| `idx_ai_agents_created_by` | ai_agents | `btree (created_by)` |
| `idx_ai_agents_is_active` | ai_agents | `btree (is_active) WHERE is_active = true` |
| `idx_ai_agents_is_default` | ai_agents | `btree (is_default) WHERE is_default = true` |
| `idx_ai_agents_slug` | ai_agents | `btree (slug)` |
| `idx_ai_agents_updated_by` | ai_agents | `btree (updated_by)` |
| `idx_coupons_active` | coupons | `btree (active) WHERE active = true` |
| `idx_coupons_valid_until` | coupons | `btree (valid_until) WHERE valid_until IS NOT NULL` |
| `idx_payment_providers_active` | payment_providers | `btree (active) WHERE active = true` |
| `idx_products_active` | products | `btree (active) WHERE active = true` |
| `idx_products_provider_product_id` | products | `btree (provider_product_id)` |
| `idx_transactions_buyer_email` | transactions | `btree (buyer_email)` |
| `idx_transactions_coupon_id` | transactions | `btree (coupon_id)` |
| `idx_transactions_provider_tx` | transactions | `btree (provider, provider_transaction_id)` |
| `idx_transactions_status` | transactions | `btree (status)` |

---

## Section 4: General Purpose Indexes

Other indexes that show zero scans but serve specific query patterns or will be used as features are exercised more.

| Index Name | Table | Purpose |
|---|---|---|
| `idx_agendamento_bloqueios_criado_por` | agendamento_bloqueios | Audit trail: who created the block |
| `idx_agendamento_bloqueios_periodo` | agendamento_bloqueios | GiST range index for overlap checks |
| `idx_agendamento_notificacoes_pending` | agendamento_notificacoes | Partial index for unread notifications |
| `idx_notificacoes_enviado` | agendamento_notificacoes | Notification delivery status lookup |
| `idx_agendamento_relatorios_gerado_em` | agendamento_relatorios | Report chronological ordering |
| `idx_agendamento_relatorios_gerado_por` | agendamento_relatorios | Report author lookup |
| `idx_agendamento_relatorios_tipo` | agendamento_relatorios | Report type filtering |
| `idx_alunos_turmas_status` | alunos_turmas | Active student enrollment filtering |
| `idx_chat_conversations_session_id` | chat_conversations | AI chat session lookup |
| `idx_color_palettes_created_by` | color_palettes | FK audit: palette creator |
| `idx_color_palettes_updated_by` | color_palettes | FK audit: palette updater |
| `idx_curso_modulos_created_by` | curso_modulos | FK audit: module assignment creator |
| `idx_curso_plantao_quotas_created_by` | curso_plantao_quotas | FK audit |
| `idx_curso_plantao_quotas_updated_by` | curso_plantao_quotas | FK audit |
| `idx_disciplinas_created_by` | disciplinas | FK audit: discipline creator |
| `idx_empresa_oauth_credentials_configured_by` | empresa_oauth_credentials | FK audit |
| `idx_font_schemes_created_by` | font_schemes | FK audit |
| `idx_font_schemes_updated_by` | font_schemes | FK audit |
| `idx_frentes_created_by` | frentes | FK audit |
| `idx_modalidades_curso_created_by` | modalidades_curso | FK audit |
| `idx_papeis_is_system` | papeis | Partial index for system roles |
| `idx_progresso_flash_aluno` | progresso_flashcards | SRS next review lookup |
| `idx_progresso_flashcards_data_revisao` | progresso_flashcards | Review scheduling |
| `idx_progresso_flashcards_ultimo_feedback` | progresso_flashcards | Feedback-based filtering |
| `idx_segmentos_created_by` | segmentos | FK audit |
| `idx_sessoes_estudo_usuario_modulo_inicio` | sessoes_estudo | Session lookup by user+module |
| `idx_tenant_access_log_usuario` | tenant_access_log | Audit log per-user lookup |
| `idx_tenant_branding_created_by` | tenant_branding | FK audit |
| `idx_tenant_branding_updated_by` | tenant_branding | FK audit |
| `idx_tenant_logos_logo_type` | tenant_logos | Logo type filtering |
| `idx_tenant_module_visibility_created_by` | tenant_module_visibility | FK audit |
| `idx_tenant_module_visibility_updated_by` | tenant_module_visibility | FK audit |
| `idx_tenant_submodule_visibility_created_by` | tenant_submodule_visibility | FK audit |
| `idx_tenant_submodule_visibility_module_submodule` | tenant_submodule_visibility | Composite lookup |
| `idx_tenant_submodule_visibility_updated_by` | tenant_submodule_visibility | FK audit |
| `idx_turmas_ativo` | turmas | Active class filtering |
| `idx_ue_ativo` | usuarios_empresas | Active membership filtering |
| `idx_usuarios_empresas_papel_id` | usuarios_empresas | Role assignment lookup |

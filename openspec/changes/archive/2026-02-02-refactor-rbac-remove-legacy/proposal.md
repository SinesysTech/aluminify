# Change: Refactor RBAC - Remove Legacy Code and Add Papéis Management UI

## Why

O sistema de papéis (RBAC) atual contém código legado de compatibilidade com o sistema antigo de roles ("professor", "empresa") que não é mais necessário. Além disso, falta uma UI completa para gerenciamento de papéis (criar, editar, visualizar matriz de permissões). Isso gera:

1. **Dívida técnica**: Tipos e funções deprecated ainda presentes no código
2. **Confusão**: Duas formas de verificar permissões (legado vs novo)
3. **Funcionalidade incompleta**: Sem UI para gerenciar papéis customizados

## What Changes

### Remoção de Código Legado

- **BREAKING**: Remover tipo `LegacyAppUserRole` de `types/shared/entities/user.ts`
- **BREAKING**: Remover tipo `LegacyUserRole` de `backend/auth/types.ts`
- Remover arrays legados `PROFESSOR_ROLES`, `ADMIN_ROLES` (com valores antigos) de `lib/roles.ts`
- Remover mapeamento `LEGACY_ROUTE_BY_ROLE` de `lib/roles.ts`
- Remover funções deprecated:
  - `isProfessorRole()`
  - `roleSatisfies()`
  - `hasRequiredRole()`
  - `isAdminRole()` (versão legada)
- Remover código de compatibilidade em `backend/auth/middleware.ts` que mapeia "professor"/"empresa" → "usuario"
- Remover código de compatibilidade em `lib/auth.ts`
- Remover campo deprecated `isAdmin` de `AuthUser`
- Remover campo deprecated `isEmpresaAdmin` de `AppUser`

### Migração de Dados

- Atualizar metadata de usuários no Supabase Auth que ainda têm `role="professor"` ou `role="empresa"` para `role="usuario"`

### Nova UI de Gerenciamento de Papéis

- Página de listagem de papéis (`/empresa/(gestao)/detalhes/papeis`)
- Formulário de criação/edição de papel customizado
- Componente de matriz de permissões (grid visual para editar permissões)
- Integração com APIs existentes (`/api/empresas/[id]/papeis`)

## Impact

- **Affected specs**: rbac (novo)
- **Affected code**:
  - `types/shared/entities/user.ts`
  - `backend/auth/types.ts`
  - `lib/roles.ts`
  - `lib/auth.ts`
  - `backend/auth/middleware.ts`
  - `app/api/user/profile/route.ts`
  - `app/(modules)/empresa/(gestao)/detalhes/papeis/` (novo)
  - `components/admin/papel-form.tsx` (novo)
  - `components/admin/permissions-matrix.tsx` (novo)

## Risk Assessment

- **Baixo risco**: O sistema já usa o novo modelo de papéis (`usuarios.papel_id` → `papeis`)
- **Migração necessária**: Usuários com metadata legado precisam ser atualizados
- **Rollback**: Se necessário, os tipos podem ser restaurados rapidamente

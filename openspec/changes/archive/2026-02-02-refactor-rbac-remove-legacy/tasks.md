# Tasks: Refactor RBAC - Remove Legacy Code and Add Papéis Management UI

## 1. Migração de Dados

- [x] 1.1 Criar migration SQL para atualizar metadata de usuários com role="professor" para role="usuario"
- [x] 1.2 Criar migration SQL para atualizar metadata de usuários com role="empresa" para role="usuario"
- [x] 1.3 Validar que não existem mais usuários com roles legados após migration

## 2. Remoção de Tipos Legados

- [x] 2.1 Remover `LegacyAppUserRole` de `types/shared/entities/user.ts`
- [x] 2.2 Remover `isEmpresaAdmin` de `AppUser` em `types/shared/entities/user.ts`
- [x] 2.3 Remover `LegacyUserRole` de `backend/auth/types.ts`
- [x] 2.4 Remover `isAdmin` deprecated de `AuthUser` em `backend/auth/types.ts`

## 3. Limpeza de lib/roles.ts

- [x] 3.1 Remover import de `LegacyAppUserRole`
- [x] 3.2 Remover array `PROFESSOR_ROLES`
- [x] 3.3 Remover array `ADMIN_ROLES` (versão legada com "empresa")
- [x] 3.4 Remover `LEGACY_ROUTE_BY_ROLE`
- [x] 3.5 Remover função `isProfessorRole()`
- [x] 3.6 Remover função `roleSatisfies()`
- [x] 3.7 Remover função `hasRequiredRole()`
- [x] 3.8 Atualizar função `isAdminRole()` para aceitar apenas `RoleTipo`
- [x] 3.9 Simplificar `getDefaultRouteForRole()` para usar apenas `AppUserRole`
- [x] 3.10 Atualizar função `canImpersonate()` para usar nova assinatura

## 4. Limpeza de lib/auth.ts

- [x] 4.1 Remover import de `LegacyAppUserRole` e `hasRequiredRole`
- [x] 4.2 Remover lógica de mapeamento "professor"/"empresa" → "usuario" em `getAuthenticatedUser()`
- [x] 4.3 Remover tipo `allowedRoles` de `RequireUserOptions`
- [x] 4.4 Remover checagem de `hasRequiredRole` em `requireUser()`
- [x] 4.5 Atualizar callers de `requireUser({ allowedRoles: [...] })` para usar permissões

## 5. Limpeza de backend/auth/middleware.ts

- [x] 5.1 Remover import de `LegacyUserRole`
- [x] 5.2 Remover lógica de mapeamento "professor"/"empresa" → "usuario" em `mapSupabaseUserToAuthUser()`
- [x] 5.3 Simplificar tipagem de `metadataRole`

## 6. Limpeza de app/api/user/profile/route.ts

- [x] 6.1 Remover lógica de mapeamento legado
- [x] 6.2 Remover derivação de `isEmpresaAdmin` da resposta

## 7. Componente de Matriz de Permissões

- [x] 7.1 Criar `components/admin/permissions-matrix.tsx`
- [x] 7.2 Implementar grid visual com recursos x ações
- [x] 7.3 Implementar lógica de dependência (view required for create/edit/delete)
- [x] 7.4 Implementar modo somente leitura
- [x] 7.5 Adicionar labels traduzidos para recursos e ações

## 8. Formulário de Papel

- [x] 8.1 Criar `components/admin/papel-form.tsx`
- [x] 8.2 Implementar campos: nome, tipo, descrição
- [x] 8.3 Integrar componente de matriz de permissões
- [x] 8.4 Implementar validação de formulário
- [x] 8.5 Implementar preview de permissões antes de salvar

## 9. Páginas de Gerenciamento de Papéis

- [x] 9.1 Criar `app/(modules)/empresa/(gestao)/detalhes/papeis/page.tsx` - listagem
- [x] 9.2 Implementar tabela de papéis com badges (sistema/customizado)
- [x] 9.3 Criar `app/(modules)/empresa/(gestao)/detalhes/papeis/novo/page.tsx` - criar
- [x] 9.4 Criar `app/(modules)/empresa/(gestao)/detalhes/papeis/[papelId]/page.tsx` - editar
- [x] 9.5 Implementar dialog de confirmação para exclusão
- [ ] 9.6 Adicionar link no menu lateral de admin

## 10. Validação e Testes

- [x] 10.1 Verificar que build compila sem erros de tipo
- [ ] 10.2 Testar login com usuários de diferentes papéis
- [ ] 10.3 Testar criação de papel customizado via UI
- [ ] 10.4 Testar edição de papel customizado via UI
- [ ] 10.5 Testar que papéis do sistema não podem ser editados/excluídos
- [ ] 10.6 Testar atribuição de papel customizado a usuário

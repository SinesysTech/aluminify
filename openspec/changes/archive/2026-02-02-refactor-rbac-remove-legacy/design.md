# Design: RBAC Legacy Removal and Papéis Management UI

## Context

O sistema atual possui dois modelos de roles coexistindo:

1. **Legado**: Roles armazenados em `auth.users.user_metadata.role` com valores "professor", "empresa", "aluno", "superadmin"
2. **Novo**: Roles definidos na tabela `papeis` com tipos `RoleTipo` (professor, professor_admin, staff, admin, monitor) e permissões granulares em JSONB

O código contém mapeamentos de compatibilidade que convertem o modelo legado para o novo, mas todos os usuários já utilizam o novo modelo há tempo suficiente para remover a compatibilidade.

## Goals / Non-Goals

### Goals
- Remover 100% do código legado de roles
- Simplificar o fluxo de autenticação/autorização
- Fornecer UI completa para gerenciamento de papéis
- Manter compatibilidade com dados existentes (migrar, não quebrar)

### Non-Goals
- Alterar a estrutura da tabela `papeis`
- Modificar as permissões padrão dos papéis do sistema
- Implementar papéis hierárquicos ou herança de permissões

## Decisions

### 1. Migração de Dados via SQL

**Decisão**: Criar uma migration SQL para atualizar `auth.users.raw_user_meta_data` diretamente.

**Alternativas consideradas**:
- Script Node.js via Admin API → Mais complexo, requer service_role key
- Trigger no login → Deixaria dados inconsistentes até o usuário logar

**Justificativa**: Migration SQL é atômica, auditável e pode ser revertida facilmente.

### 2. Simplificação de `lib/roles.ts`

**Decisão**: Manter apenas as funções baseadas em `RoleTipo` e `RolePermissions`:
- `isTeachingRoleTipo(tipo)`
- `isAdminRoleTipo(tipo)`
- `hasPermission(permissions, resource, action)`
- `canView/canCreate/canEdit/canDelete(permissions, resource)`
- `getDefaultRouteForRole(role)` - simplificado para usar apenas `AppUserRole`
- `getViewableResources(permissions)`

**Remover**:
- `PROFESSOR_ROLES`, `ADMIN_ROLES` (arrays legados)
- `LEGACY_ROUTE_BY_ROLE`
- `isProfessorRole()`, `roleSatisfies()`, `hasRequiredRole()`
- `isAdminRole()` com assinatura legada

### 3. Refatoração de `lib/auth.ts`

**Decisão**: Remover lógica de mapeamento legado em `getAuthenticatedUser()` e `requireUser()`.

**Mudanças**:
- Remover checagem de `role === "professor" || role === "empresa"`
- Usar diretamente `role as AppUserRole` após validação
- Remover parâmetro `allowedRoles` de `requireUser()` (usar permissões granulares)

### 4. UI de Papéis - Estrutura de Páginas

**Decisão**: Criar páginas em `/empresa/(gestao)/detalhes/papeis/`:

```
app/(modules)/empresa/(gestao)/detalhes/papeis/
├── page.tsx              # Lista de papéis
├── novo/
│   └── page.tsx          # Criar papel customizado
└── [papelId]/
    └── page.tsx          # Editar papel (apenas customizados)
```

### 5. Componente de Matriz de Permissões

**Decisão**: Criar um componente visual de grid com:
- Linhas: Recursos (cursos, disciplinas, alunos, etc.)
- Colunas: Ações (view, create, edit, delete)
- Células: Checkboxes interativos

**Justificativa**: Visualização em matriz é mais intuitiva do que formulários separados para cada recurso.

## Risks / Trade-offs

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Usuários com metadata legado não migrados | Baixa | Alto | Migration SQL antes do deploy |
| Código externo dependendo de tipos legados | Baixa | Médio | Busca exaustiva por usos |
| UI de permissões confusa | Média | Baixo | Preview das permissões antes de salvar |

## Migration Plan

### Fase 1: Migração de Dados (antes do deploy de código)
1. Executar migration SQL para atualizar metadata de usuários
2. Validar que todos os usuários têm `role` válido ("aluno", "usuario", "superadmin")

### Fase 2: Remoção de Código Legado
1. Remover tipos legados
2. Atualizar imports em todos os arquivos afetados
3. Remover funções deprecated
4. Simplificar middleware e auth

### Fase 3: Nova UI
1. Criar página de listagem de papéis
2. Criar componente de matriz de permissões
3. Criar formulário de papel
4. Integrar com APIs existentes

### Rollback Plan
- Se problemas críticos: restaurar tipos legados via cherry-pick
- Dados já migrados não precisam de rollback (valores novos são superset dos antigos)

## Open Questions

1. ~~Devemos manter a função `getDefaultRouteForRole` ou migrar completamente para rotas baseadas em permissões?~~ **Resposta**: Manter simplificada, pois é útil para redirecionamento pós-login.

2. ~~Papéis do sistema devem ser editáveis pela UI?~~ **Resposta**: Não, `is_system=true` permanece imutável.

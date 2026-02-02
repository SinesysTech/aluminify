# RBAC (Role-Based Access Control) Specification

## ADDED Requirements

### Requirement: Clean Role Type System

O sistema DEVE utilizar exclusivamente os tipos de role modernos, sem suporte a tipos legados.

#### Scenario: User role identification
- **WHEN** um usuário faz login no sistema
- **THEN** seu role DEVE ser um de: "aluno", "usuario", "superadmin"
- **AND** se for "usuario", DEVE ter um `papel_id` válido na tabela `papeis`

#### Scenario: Role type validation
- **WHEN** o sistema verifica o tipo de papel de um usuário
- **THEN** o tipo DEVE ser um de: "professor", "professor_admin", "staff", "admin", "monitor"
- **AND** tipos legados como "empresa" NÃO DEVEM ser aceitos

---

### Requirement: Permission-Based Authorization

O sistema DEVE utilizar permissões granulares por recurso ao invés de checagens baseadas em role.

#### Scenario: Resource access check
- **WHEN** um usuário tenta acessar um recurso (cursos, alunos, etc.)
- **THEN** o sistema DEVE verificar a permissão específica (view, create, edit, delete)
- **AND** NÃO DEVE usar arrays de roles permitidos (PROFESSOR_ROLES, ADMIN_ROLES)

#### Scenario: Permission structure
- **WHEN** permissões são verificadas
- **THEN** DEVEM seguir a estrutura `RolePermissions` com recursos:
  - dashboard, cursos, disciplinas, alunos, usuarios
  - agendamentos, flashcards, materiais
  - configuracoes, branding, relatorios

---

### Requirement: Papéis Management UI

O sistema DEVE fornecer uma interface administrativa para gerenciar papéis customizados.

#### Scenario: List papéis
- **WHEN** um admin acessa `/empresa/(gestao)/detalhes/papeis`
- **THEN** DEVE ver a lista de papéis disponíveis (sistema + customizados)
- **AND** papéis do sistema DEVEM ser marcados como "Sistema"
- **AND** papéis customizados DEVEM ter opções de editar/excluir

#### Scenario: Create custom papel
- **WHEN** um admin clica em "Novo Papel"
- **THEN** DEVE ver um formulário com:
  - Nome do papel (obrigatório)
  - Tipo base (professor, staff, monitor) - dropdown
  - Descrição (opcional)
  - Matriz de permissões editável
- **AND** ao salvar, o papel DEVE ser criado via POST `/api/empresas/[id]/papeis`

#### Scenario: Edit custom papel
- **WHEN** um admin clica em editar um papel customizado
- **THEN** DEVE ver o formulário preenchido com os dados atuais
- **AND** DEVE poder alterar nome, descrição e permissões
- **AND** ao salvar, o papel DEVE ser atualizado via PATCH `/api/empresas/[id]/papeis/[papelId]`

#### Scenario: Cannot edit system papéis
- **WHEN** um admin visualiza um papel do sistema (is_system=true)
- **THEN** NÃO DEVE haver botão de editar ou excluir
- **AND** DEVE exibir apenas as informações de leitura

#### Scenario: Delete custom papel
- **WHEN** um admin tenta excluir um papel customizado
- **THEN** DEVE exibir confirmação antes de excluir
- **AND** se houver usuários usando o papel, DEVE exibir aviso
- **AND** ao confirmar, DEVE chamar DELETE `/api/empresas/[id]/papeis/[papelId]`

---

### Requirement: Permissions Matrix Component

O sistema DEVE fornecer um componente visual de matriz para editar permissões.

#### Scenario: Matrix display
- **WHEN** o componente de matriz é renderizado
- **THEN** DEVE exibir um grid com:
  - Linhas: cada recurso (Cursos, Disciplinas, Alunos, etc.)
  - Colunas: ações (Visualizar, Criar, Editar, Excluir)
  - Células: checkboxes para cada permissão

#### Scenario: Matrix interaction
- **WHEN** um usuário marca/desmarca uma permissão na matriz
- **THEN** o estado DEVE ser atualizado imediatamente
- **AND** permissões dependentes DEVEM ser tratadas:
  - Se desmarcar "view", desmarcar automaticamente create/edit/delete
  - Se marcar "create"/"edit"/"delete", marcar automaticamente "view"

#### Scenario: Read-only matrix
- **WHEN** a matriz é renderizada em modo leitura (para papéis do sistema)
- **THEN** os checkboxes DEVEM estar desabilitados
- **AND** DEVE exibir indicação visual de que é somente leitura

---

## REMOVED Requirements

### Requirement: Legacy Role Compatibility

**Reason**: O sistema não precisa mais suportar roles legados ("professor", "empresa" como UserRole).

**Migration**: Todos os usuários com metadata legado serão migrados via SQL para usar os novos valores.

#### Scenario: Legacy role mapping (REMOVIDO)
- Mapeamento de "professor" → "usuario" removido
- Mapeamento de "empresa" → "usuario" removido
- Arrays PROFESSOR_ROLES e ADMIN_ROLES removidos
- Funções isProfessorRole, roleSatisfies, hasRequiredRole removidas

---

### Requirement: Deprecated AuthUser Fields

**Reason**: Os campos `isAdmin` e `isEmpresaAdmin` são redundantes com o sistema de permissões.

**Migration**: Código que usa esses campos deve migrar para usar `permissions` ou `roleType`.

#### Scenario: isAdmin check (REMOVIDO)
- Usar `isAdminRoleTipo(roleType)` ou verificar permissões específicas

#### Scenario: isEmpresaAdmin check (REMOVIDO)
- Usar `roleType === 'admin' || roleType === 'professor_admin'`

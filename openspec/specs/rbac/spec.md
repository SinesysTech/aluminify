# RBAC (Role-Based Access Control) Specification

### Requirement: Clean Role Type System

O sistema DEVE utilizar exclusivamente os tipos de role modernos: "aluno", "usuario", "superadmin". Tipos legados ("professor", "empresa" como UserRole) foram removidos.

#### Scenario: User role identification
- **WHEN** um usuario faz login no sistema
- **THEN** seu role DEVE ser um de: "aluno", "usuario", "superadmin"
- **AND** se for "usuario", DEVE ter um `papel_id` valido na tabela `papeis`

---

### Requirement: Permission-Based Authorization

O sistema DEVE utilizar permissoes granulares por recurso ao inves de checagens baseadas em role.

#### Scenario: Resource access check
- **WHEN** um usuario tenta acessar um recurso
- **THEN** o sistema DEVE verificar a permissao especifica (view, create, edit, delete)

---

### Requirement: Papeis Management UI

O sistema DEVE fornecer interface administrativa para gerenciar papeis customizados em `/empresa/(gestao)/detalhes/papeis`.

#### Scenario: List papeis
- **WHEN** admin acessa a pagina de papeis
- **THEN** ve lista de papeis (sistema + customizados) com opcoes de editar/excluir para customizados

#### Scenario: Create/Edit custom papel
- **WHEN** admin cria ou edita papel customizado
- **THEN** formulario com nome, tipo base, descricao e matriz de permissoes editavel

#### Scenario: Cannot edit system papeis
- **WHEN** admin visualiza papel do sistema (is_system=true)
- **THEN** nao ha opcoes de editar ou excluir

---

### Requirement: Permissions Matrix Component

Componente visual de grid com recursos x acoes (view, create, edit, delete) com checkboxes e logica de dependencia automatica.

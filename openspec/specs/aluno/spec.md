# Aluno Module Architecture Specification

### Requirement: Self-Contained Module Structure

O modulo 'aluno' deve ser self-contained em `app/[tenant]/(modules)/aluno` com subdiretorios: components, hooks, lib, services, types.

#### Scenario: No Outer Dependencies
- **GIVEN** um arquivo dentro de `app/[tenant]/(modules)/aluno`
- **THEN** nao deve importar de `components/aluno` (legacy) nem de `app/(modules)/aluno` (legacy)

---

### Requirement: Migrated Components

Componentes especificos de aluno devem estar dentro do escopo do modulo em `app/[tenant]/(modules)/aluno/components/`.

**Nota:** Esta migracao ainda nao foi implementada. As tasks estao pendentes.

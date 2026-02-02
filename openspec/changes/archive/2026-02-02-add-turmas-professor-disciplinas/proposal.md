# Change: Implementar Modelagem Correta de Turmas e Professor-Disciplina

## Why

O modelo de dados atual não suporta adequadamente a hierarquia de negócio de cursinhos livres (preparatórios para ENEM, concursos, residência médica):
1. **Falta tabela de turmas** - Cursos podem ter múltiplas turmas (manhã, tarde) ou turma única = curso
2. **Falta vínculo professor-disciplina** - Professores lecionam disciplinas com flexibilidade de escopo (geral, por curso, por turma, por frente, por módulo)
3. **Falta configuração de acesso contínuo** - Empresa precisa configurar se alunos mantêm acesso após término do curso
4. **chat_conversations sem tenant isolation** - Tabela não possui empresa_id

## What Changes

### Novas Tabelas
- **turmas** - Representa turmas dentro de um curso (ex: "Manhã", "Tarde", "Noturno")
- **alunos_turmas** - Vincula alunos a turmas específicas (N:N)
- **professores_disciplinas** - Vínculo flexível professor-disciplina com escopo opcional (curso, turma, frente, módulo)

### Modificações
- **empresas.configuracoes** - Adicionar campos JSON para configurar acesso contínuo de alunos
- **chat_conversations** - Adicionar coluna empresa_id para isolamento multi-tenant
- **chat_conversation_history** - Adicionar coluna empresa_id para isolamento multi-tenant

### RLS Policies
- Criar policies para novas tabelas com isolamento por empresa_id
- Adicionar policies para professor ver apenas dados de suas disciplinas
- Atualizar policies de chat para usar empresa_id

## Impact

- Affected code:
  - APIs de matrícula de alunos
  - Dashboard de professor (ver progresso apenas de suas disciplinas)
  - Sistema de chat (TobIAs)
  - Configurações da empresa
- **BREAKING**: Nenhuma mudança breaking - todas as alterações são aditivas
- Migration: Dados existentes em alunos_cursos serão mantidos, turmas são opcionais

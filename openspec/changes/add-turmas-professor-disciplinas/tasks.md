# Tasks: Implementar Modelagem de Turmas e Professor-Disciplina

## 1. Schema de Banco de Dados

### 1.1 Criar tabela turmas
- [ ] 1.1.1 Criar tabela turmas (id, empresa_id, curso_id, nome, data_inicio, data_fim, acesso_apos_termino, dias_acesso_extra, ativo)
- [ ] 1.1.2 Criar índices (empresa_id, curso_id)
- [ ] 1.1.3 Criar RLS policies para turmas

### 1.2 Criar tabela alunos_turmas
- [ ] 1.2.1 Criar tabela alunos_turmas (aluno_id, turma_id, data_entrada, data_saida, status, created_at)
- [ ] 1.2.2 Criar constraint de chave primária composta (aluno_id, turma_id)
- [ ] 1.2.3 Criar RLS policies para alunos_turmas

### 1.3 Criar tabela professores_disciplinas
- [ ] 1.3.1 Criar tabela professores_disciplinas com campos flexíveis:
  - id (uuid, PK)
  - professor_id (FK → professores.id)
  - disciplina_id (FK → disciplinas.id)
  - empresa_id (FK → empresas.id)
  - curso_id (FK → cursos.id, opcional)
  - turma_id (FK → turmas.id, opcional)
  - frente_id (FK → frentes.id, opcional)
  - modulo_id (FK → modulos.id, opcional)
  - ativo (boolean)
  - created_at, updated_at
- [ ] 1.3.2 Criar índices compostos para consultas frequentes
- [ ] 1.3.3 Criar RLS policies para professores_disciplinas

### 1.4 Modificar tabelas existentes
- [ ] 1.4.1 Adicionar empresa_id à chat_conversations
- [ ] 1.4.2 Backfill empresa_id em chat_conversations via user_id → alunos/professores
- [ ] 1.4.3 Adicionar empresa_id à chat_conversation_history
- [ ] 1.4.4 Atualizar RLS policies de chat_conversations
- [ ] 1.4.5 Atualizar RLS policies de chat_conversation_history

### 1.5 Configurações da Empresa
- [ ] 1.5.1 Documentar estrutura JSON para empresas.configuracoes:
  - aluno_acesso_continuo_sistema (boolean)
  - aluno_acesso_continuo_cursos (boolean)
  - dias_acesso_apos_curso (integer)

## 2. Helper Functions

- [ ] 2.1 Criar função is_professor_da_disciplina(disciplina_id uuid) RETURNS boolean
- [ ] 2.2 Criar função get_professor_disciplinas() RETURNS uuid[] (lista de disciplina_ids do professor)
- [ ] 2.3 Criar função aluno_em_turma(turma_id uuid) RETURNS boolean

## 3. RLS Policies para Acesso de Professor

- [ ] 3.1 Atualizar policy de cronogramas para professor ver apenas de suas disciplinas
- [ ] 3.2 Atualizar policy de progresso_atividades para professor ver apenas de suas disciplinas
- [ ] 3.3 Atualizar policy de aulas_concluidas para professor ver apenas de suas disciplinas
- [ ] 3.4 Atualizar policy de sessoes_estudo para professor ver apenas de suas disciplinas

## 4. Gerar Types

- [ ] 4.1 Gerar TypeScript types atualizados via Supabase
- [ ] 4.2 Atualizar lib/database.types.ts

## 5. Testes

- [ ] 5.1 Verificar RLS policies com diferentes roles (aluno, professor, admin)
- [ ] 5.2 Verificar isolamento multi-tenant das novas tabelas
- [ ] 5.3 Verificar acesso de professor limitado às suas disciplinas

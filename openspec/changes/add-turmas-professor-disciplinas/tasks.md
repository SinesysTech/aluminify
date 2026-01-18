# Tasks: Implementar Modelagem de Turmas e Professor-Disciplina

## 1. Schema de Banco de Dados

### 1.1 Criar tabela turmas
- [x] 1.1.1 Criar tabela turmas (id, empresa_id, curso_id, nome, data_inicio, data_fim, acesso_apos_termino, dias_acesso_extra, ativo)
- [x] 1.1.2 Criar índices (empresa_id, curso_id)
- [x] 1.1.3 Criar RLS policies para turmas

### 1.2 Criar tabela alunos_turmas
- [x] 1.2.1 Criar tabela alunos_turmas (aluno_id, turma_id, data_entrada, data_saida, status, created_at)
- [x] 1.2.2 Criar constraint de chave primária composta (aluno_id, turma_id)
- [x] 1.2.3 Criar RLS policies para alunos_turmas

### 1.3 Criar tabela professores_disciplinas
- [x] 1.3.1 Criar tabela professores_disciplinas com campos flexíveis:
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
- [x] 1.3.2 Criar índices compostos para consultas frequentes
- [x] 1.3.3 Criar RLS policies para professores_disciplinas

### 1.4 Modificar tabelas existentes
- [x] 1.4.1 Adicionar empresa_id à chat_conversations
- [x] 1.4.2 Backfill empresa_id em chat_conversations via user_id → alunos/professores
- [x] 1.4.3 Adicionar empresa_id à chat_conversation_history
- [x] 1.4.4 Atualizar RLS policies de chat_conversations
- [x] 1.4.5 Atualizar RLS policies de chat_conversation_history

### 1.5 Configurações da Empresa
- [x] 1.5.1 Documentar estrutura JSON para empresas.configuracoes:
  - aluno_acesso_continuo_sistema (boolean)
  - aluno_acesso_continuo_cursos (boolean)
  - dias_acesso_apos_curso (integer)

## 2. Helper Functions

- [x] 2.1 Criar função is_professor_da_disciplina(disciplina_id uuid) RETURNS boolean
- [x] 2.2 Criar função get_professor_disciplinas() RETURNS uuid[] (lista de disciplina_ids do professor)
- [x] 2.3 Criar função aluno_em_turma(turma_id uuid) RETURNS boolean

## 3. RLS Policies para Acesso de Professor

- [x] 3.1 Atualizar policy de cronogramas para professor ver apenas de suas disciplinas
- [x] 3.2 Atualizar policy de progresso_atividades para professor ver apenas de suas disciplinas
- [x] 3.3 Atualizar policy de aulas_concluidas para professor ver apenas de suas disciplinas
- [x] 3.4 Atualizar policy de sessoes_estudo para professor ver apenas de suas disciplinas

## 4. Gerar Types

- [x] 4.1 Gerar TypeScript types atualizados via Supabase
- [x] 4.2 Atualizar lib/database.types.ts

## 5. Testes

- [ ] 5.1 Verificar RLS policies com diferentes roles (aluno, professor, admin)
- [ ] 5.2 Verificar isolamento multi-tenant das novas tabelas
- [ ] 5.3 Verificar acesso de professor limitado às suas disciplinas

---

## Implementação Concluída

### Migrações Aplicadas:
1. `create_turmas_table` - Tabela turmas com RLS
2. `create_alunos_turmas_table` - Tabela alunos_turmas com enum e RLS
3. `create_professores_disciplinas_table` - Vínculo flexível professor-disciplina
4. `add_empresa_id_to_chat_tables` - empresa_id nas tabelas de chat com backfill
5. `create_professor_disciplina_helper_functions` - Funções helper para RLS
6. `update_rls_professor_disciplina_access` - RLS policies atualizadas para acesso de professor

### Funções Helper Criadas:
- `is_professor_da_disciplina(disciplina_id)` - Verifica se usuário é professor da disciplina
- `get_professor_disciplinas()` - Retorna array de disciplina_ids do professor
- `professor_tem_acesso_modulo(modulo_id)` - Verifica acesso a módulo via disciplina
- `professor_tem_acesso_frente(frente_id)` - Verifica acesso a frente via disciplina
- `aluno_em_turma(turma_id)` - Verifica se aluno está na turma

### TypeScript Types:
- Arquivo `lib/database.types.ts` atualizado com todos os novos tipos

# Data Model Specification

### Requirement: Turmas dentro de Cursos

O sistema DEVE permitir que cursos tenham multiplas turmas opcionais.

Uma turma representa uma divisao do curso (ex: "Manha", "Tarde", "Noturno") com:
- Nome identificador
- Datas de inicio e fim (opcionais, podem herdar do curso)
- Configuracao de acesso apos termino
- Status ativo/inativo

Cursos sem turmas cadastradas continuam funcionando normalmente via `alunos_cursos`.

#### Scenario: Curso com multiplas turmas
- **WHEN** admin cria um curso "Extensivo ENEM 2025"
- **AND** adiciona turmas "Manha" e "Tarde"
- **THEN** alunos podem ser matriculados em turmas especificas via `alunos_turmas`

#### Scenario: Curso sem turmas (turma unica = curso)
- **WHEN** admin cria um curso sem adicionar turmas
- **THEN** alunos sao matriculados diretamente no curso via `alunos_cursos`
- **AND** o sistema funciona como antes

---

### Requirement: Vinculo Aluno-Turma

O sistema DEVE permitir vincular alunos a turmas especificas.

O vinculo inclui:
- Data de entrada na turma
- Data de saida (opcional)
- Status: ativo, concluido, cancelado, trancado

#### Scenario: Aluno matriculado em turma
- **WHEN** admin matricula aluno na turma "Manha" do curso
- **THEN** registro e criado em `alunos_turmas` com status "ativo"
- **AND** aluno tem acesso ao conteudo do curso

#### Scenario: Aluno transferido de turma
- **WHEN** admin transfere aluno da turma "Manha" para "Tarde"
- **THEN** registro antigo e atualizado com data_saida e status "concluido"
- **AND** novo registro e criado na turma "Tarde"

---

### Requirement: Vinculo Professor-Disciplina Flexivel

O sistema DEVE permitir vincular professores a disciplinas com diferentes niveis de escopo.

Niveis de escopo (do mais amplo ao mais especifico):
1. **Geral**: Professor leciona a disciplina em toda a empresa
2. **Por Curso**: Professor leciona apenas em um curso especifico
3. **Por Turma**: Professor leciona apenas em uma turma especifica
4. **Por Frente**: Professor leciona apenas uma frente da disciplina
5. **Por Modulo**: Professor leciona apenas um modulo especifico

O escopo mais especifico tem prioridade sobre o mais amplo.

#### Scenario: Professor geral de disciplina
- **WHEN** admin vincula professor a disciplina "Matematica" sem especificar escopo
- **THEN** professor tem acesso a todos os dados de "Matematica" em toda a empresa

#### Scenario: Professor especifico de curso
- **WHEN** admin vincula professor a disciplina "Matematica" no curso "Extensivo 2025"
- **THEN** professor ve apenas dados de "Matematica" no curso "Extensivo 2025"

#### Scenario: Professor de frente especifica
- **WHEN** admin vincula professor a frente "Algebra" da disciplina "Matematica"
- **THEN** professor ve apenas dados da frente "Algebra"

#### Scenario: Multiplos professores na mesma disciplina
- **WHEN** dois professores sao vinculados a mesma disciplina com escopos diferentes
- **THEN** cada professor ve apenas os dados do seu escopo

---

### Requirement: Configuracao de Acesso Continuo

O sistema DEVE permitir que a empresa configure se alunos mantem acesso apos termino do curso.

Configuracoes disponiveis em `empresas.configuracoes` (JSONB):
- `aluno_acesso_continuo_sistema`: Se true, aluno mantem acesso ao sistema apos curso terminar
- `aluno_acesso_continuo_cursos`: Se true, aluno mantem acesso ao conteudo dos cursos concluidos
- `dias_acesso_apos_curso`: Dias extras de acesso apos termino (0 = sem acesso extra)

A turma pode sobrescrever a configuracao da empresa com `acesso_apos_termino` e `dias_acesso_extra`.

#### Scenario: Aluno com acesso continuo
- **WHEN** empresa configura `aluno_acesso_continuo_cursos: true`
- **AND** aluno conclui o curso
- **THEN** aluno mantem acesso ao conteudo do curso indefinidamente

#### Scenario: Aluno com acesso limitado apos curso
- **WHEN** empresa configura `dias_acesso_apos_curso: 30`
- **AND** aluno conclui o curso em 01/01/2025
- **THEN** aluno tem acesso ate 31/01/2025

#### Scenario: Turma sobrescreve configuracao da empresa
- **WHEN** empresa configura `dias_acesso_apos_curso: 30`
- **AND** turma especifica configura `dias_acesso_extra: 60`
- **THEN** alunos dessa turma tem 60 dias de acesso extra (nao 30)

---

### Requirement: Isolamento de Chat por Tenant

O sistema DEVE isolar conversas de chat por empresa.

Tabelas `chat_conversations` e `chat_conversation_history` DEVEM ter coluna `empresa_id` com:
- RLS policy para isolamento por tenant
- Backfill automatico via user_id -> alunos.empresa_id ou professores.empresa_id

#### Scenario: Chat isolado por empresa
- **WHEN** aluno da empresa A envia mensagem no chat
- **THEN** conversa e armazenada com empresa_id da empresa A
- **AND** usuarios da empresa B nao podem ver a conversa

---

### Requirement: Visibilidade de Professor Limitada as Suas Disciplinas

O sistema DEVE limitar o que professor pode ver aos dados de suas disciplinas vinculadas.

Professor DEVE ver apenas:
- Cronogramas de alunos com disciplinas que leciona
- Progresso de atividades nas disciplinas que leciona
- Aulas concluidas nas disciplinas que leciona
- Sessoes de estudo nas disciplinas que leciona

#### Scenario: Professor ve apenas suas disciplinas
- **WHEN** professor esta vinculado apenas a disciplina "Matematica"
- **AND** acessa dashboard de progresso
- **THEN** ve progresso de alunos apenas em "Matematica"
- **AND** nao ve dados de "Portugues" ou outras disciplinas

#### Scenario: Professor sem vinculo nao ve nada
- **WHEN** professor nao esta vinculado a nenhuma disciplina
- **THEN** professor nao ve dados de progresso de alunos
- **AND** sistema exibe mensagem informativa

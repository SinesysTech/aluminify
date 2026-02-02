## ADDED Requirements

### Requirement: Turmas dentro de Cursos

O sistema DEVE permitir que cursos tenham múltiplas turmas opcionais.

Uma turma representa uma divisão do curso (ex: "Manhã", "Tarde", "Noturno") com:
- Nome identificador
- Datas de início e fim (opcionais, podem herdar do curso)
- Configuração de acesso após término
- Status ativo/inativo

Cursos sem turmas cadastradas continuam funcionando normalmente via `alunos_cursos`.

#### Scenario: Curso com múltiplas turmas

- **WHEN** admin cria um curso "Extensivo ENEM 2025"
- **AND** adiciona turmas "Manhã" e "Tarde"
- **THEN** alunos podem ser matriculados em turmas específicas via `alunos_turmas`

#### Scenario: Curso sem turmas (turma única = curso)

- **WHEN** admin cria um curso sem adicionar turmas
- **THEN** alunos são matriculados diretamente no curso via `alunos_cursos`
- **AND** o sistema funciona como antes

---

### Requirement: Vínculo Aluno-Turma

O sistema DEVE permitir vincular alunos a turmas específicas.

O vínculo inclui:
- Data de entrada na turma
- Data de saída (opcional)
- Status: ativo, concluído, cancelado, trancado

#### Scenario: Aluno matriculado em turma

- **WHEN** admin matricula aluno na turma "Manhã" do curso
- **THEN** registro é criado em `alunos_turmas` com status "ativo"
- **AND** aluno tem acesso ao conteúdo do curso

#### Scenario: Aluno transferido de turma

- **WHEN** admin transfere aluno da turma "Manhã" para "Tarde"
- **THEN** registro antigo é atualizado com data_saida e status "concluido"
- **AND** novo registro é criado na turma "Tarde"

---

### Requirement: Vínculo Professor-Disciplina Flexível

O sistema DEVE permitir vincular professores a disciplinas com diferentes níveis de escopo.

Níveis de escopo (do mais amplo ao mais específico):
1. **Geral**: Professor leciona a disciplina em toda a empresa
2. **Por Curso**: Professor leciona apenas em um curso específico
3. **Por Turma**: Professor leciona apenas em uma turma específica
4. **Por Frente**: Professor leciona apenas uma frente da disciplina
5. **Por Módulo**: Professor leciona apenas um módulo específico

O escopo mais específico tem prioridade sobre o mais amplo.

#### Scenario: Professor geral de disciplina

- **WHEN** admin vincula professor à disciplina "Matemática" sem especificar escopo
- **THEN** professor tem acesso a todos os dados de "Matemática" em toda a empresa

#### Scenario: Professor específico de curso

- **WHEN** admin vincula professor à disciplina "Matemática" no curso "Extensivo 2025"
- **THEN** professor vê apenas dados de "Matemática" no curso "Extensivo 2025"

#### Scenario: Professor de frente específica

- **WHEN** admin vincula professor à frente "Álgebra" da disciplina "Matemática"
- **THEN** professor vê apenas dados da frente "Álgebra"

#### Scenario: Múltiplos professores na mesma disciplina

- **WHEN** dois professores são vinculados à mesma disciplina com escopos diferentes
- **THEN** cada professor vê apenas os dados do seu escopo

---

### Requirement: Configuração de Acesso Contínuo

O sistema DEVE permitir que a empresa configure se alunos mantêm acesso após término do curso.

Configurações disponíveis em `empresas.configuracoes` (JSONB):
- `aluno_acesso_continuo_sistema`: Se true, aluno mantém acesso ao sistema após curso terminar
- `aluno_acesso_continuo_cursos`: Se true, aluno mantém acesso ao conteúdo dos cursos concluídos
- `dias_acesso_apos_curso`: Dias extras de acesso após término (0 = sem acesso extra)

A turma pode sobrescrever a configuração da empresa com `acesso_apos_termino` e `dias_acesso_extra`.

#### Scenario: Aluno com acesso contínuo

- **WHEN** empresa configura `aluno_acesso_continuo_cursos: true`
- **AND** aluno conclui o curso
- **THEN** aluno mantém acesso ao conteúdo do curso indefinidamente

#### Scenario: Aluno com acesso limitado após curso

- **WHEN** empresa configura `dias_acesso_apos_curso: 30`
- **AND** aluno conclui o curso em 01/01/2025
- **THEN** aluno tem acesso até 31/01/2025

#### Scenario: Turma sobrescreve configuração da empresa

- **WHEN** empresa configura `dias_acesso_apos_curso: 30`
- **AND** turma específica configura `dias_acesso_extra: 60`
- **THEN** alunos dessa turma têm 60 dias de acesso extra (não 30)

---

### Requirement: Isolamento de Chat por Tenant

O sistema DEVE isolar conversas de chat por empresa.

Tabelas `chat_conversations` e `chat_conversation_history` DEVEM ter coluna `empresa_id` com:
- RLS policy para isolamento por tenant
- Backfill automático via user_id → alunos.empresa_id ou professores.empresa_id

#### Scenario: Chat isolado por empresa

- **WHEN** aluno da empresa A envia mensagem no chat
- **THEN** conversa é armazenada com empresa_id da empresa A
- **AND** usuários da empresa B não podem ver a conversa

---

### Requirement: Visibilidade de Professor Limitada às Suas Disciplinas

O sistema DEVE limitar o que professor pode ver aos dados de suas disciplinas vinculadas.

Professor DEVE ver apenas:
- Cronogramas de alunos com disciplinas que leciona
- Progresso de atividades nas disciplinas que leciona
- Aulas concluídas nas disciplinas que leciona
- Sessões de estudo nas disciplinas que leciona

#### Scenario: Professor vê apenas suas disciplinas

- **WHEN** professor está vinculado apenas à disciplina "Matemática"
- **AND** acessa dashboard de progresso
- **THEN** vê progresso de alunos apenas em "Matemática"
- **AND** não vê dados de "Português" ou outras disciplinas

#### Scenario: Professor sem vínculo não vê nada

- **WHEN** professor não está vinculado a nenhuma disciplina
- **THEN** professor não vê dados de progresso de alunos
- **AND** sistema exibe mensagem informativa

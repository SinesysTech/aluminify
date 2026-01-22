## ADDED Requirements

### Requirement: Transferencia em Massa de Alunos entre Cursos

O sistema DEVE permitir transferir multiplos alunos de um curso para outro.

A transferencia entre cursos:
- Remove alunos de `alunos_cursos` do curso de origem
- Adiciona alunos em `alunos_cursos` do curso de destino
- Opcionalmente atualiza registros em `matriculas`
- Retorna resultado detalhado por aluno

#### Scenario: Transferencia de 10 alunos entre cursos

- **GIVEN** admin esta na lista de alunos do curso "Extensivo 2025"
- **WHEN** admin seleciona 10 alunos
- **AND** escolhe transferir para curso "Intensivo 2025"
- **THEN** todos os 10 alunos sao removidos de `alunos_cursos` do curso origem
- **AND** todos os 10 alunos sao adicionados em `alunos_cursos` do curso destino
- **AND** sistema retorna resultado detalhado por aluno

#### Scenario: Falha parcial na transferencia

- **GIVEN** admin seleciona 5 alunos para transferir
- **WHEN** 2 alunos ja estao matriculados no curso destino
- **THEN** 3 alunos sao transferidos com sucesso
- **AND** 2 alunos retornam status "skipped" com mensagem "Aluno ja matriculado no curso de destino"

#### Scenario: Tentativa de transferir para o mesmo curso

- **WHEN** admin tenta transferir alunos para o mesmo curso de origem
- **THEN** sistema retorna erro de validacao
- **AND** nenhuma transferencia e realizada

---

### Requirement: Transferencia em Massa de Alunos entre Turmas

O sistema DEVE permitir transferir multiplos alunos de uma turma para outra dentro do mesmo curso.

A transferencia entre turmas:
- Atualiza registro antigo em `alunos_turmas` com status configurado e data_saida
- Cria novo registro em `alunos_turmas` com status "ativo"
- Ambas turmas devem pertencer ao mesmo curso

#### Scenario: Transferencia entre turmas do mesmo curso

- **GIVEN** admin esta na lista de alunos da turma "Manha" do curso "Extensivo 2025"
- **WHEN** admin seleciona alunos
- **AND** escolhe transferir para turma "Tarde" do mesmo curso
- **THEN** registros antigos em `alunos_turmas` sao atualizados com status configurado
- **AND** novos registros sao criados na turma destino com status "ativo"

#### Scenario: Tentativa de transferir para turma de outro curso

- **WHEN** admin tenta transferir alunos para turma de curso diferente
- **THEN** sistema retorna erro de validacao "As turmas devem pertencer ao mesmo curso"
- **AND** nenhuma transferencia e realizada

#### Scenario: Status configuravel na transferencia

- **GIVEN** admin seleciona alunos para transferir
- **WHEN** admin escolhe status "cancelado" para registros antigos
- **THEN** registros em `alunos_turmas` da turma origem recebem status "cancelado"
- **AND** campo `data_saida` e preenchido com data atual

---

### Requirement: Selecao em Massa de Alunos

O sistema DEVE permitir selecionar multiplos alunos na interface de listagem.

A selecao inclui:
- Checkboxes individuais por linha
- Checkbox de selecao de pagina inteira
- Opcoes de selecao rapida (10, 20, 30, todos)

#### Scenario: Selecao rapida de quantidade predefinida

- **GIVEN** admin esta na lista de alunos com 50 registros
- **WHEN** admin clica em "Selecionar 10 primeiros"
- **THEN** os 10 primeiros alunos da lista sao selecionados
- **AND** contador exibe "10 aluno(s) selecionado(s)"

#### Scenario: Selecao de todos os alunos

- **GIVEN** admin esta na lista de alunos com 50 registros
- **WHEN** admin clica em "Selecionar todos"
- **THEN** todos os 50 alunos sao selecionados
- **AND** contador exibe "50 aluno(s) selecionado(s)"

#### Scenario: Limpar selecao

- **GIVEN** admin tem 10 alunos selecionados
- **WHEN** admin clica em "Limpar selecao"
- **THEN** todos os alunos sao desmarcados
- **AND** barra de acoes desaparece

---

### Requirement: Barra de Acoes em Massa

O sistema DEVE exibir barra de acoes quando alunos estao selecionados.

A barra de acoes:
- Aparece fixada na parte inferior da tela
- Exibe contagem de alunos selecionados
- Oferece botao "Transferir" para iniciar transferencia
- Oferece botao "Limpar" para desmarcar todos

#### Scenario: Barra de acoes aparece com selecao

- **GIVEN** nenhum aluno esta selecionado
- **AND** barra de acoes nao esta visivel
- **WHEN** admin seleciona ao menos 1 aluno
- **THEN** barra de acoes aparece na parte inferior da tela
- **AND** exibe contagem de selecionados e botao "Transferir"

#### Scenario: Barra de acoes desaparece sem selecao

- **GIVEN** admin tem alunos selecionados
- **AND** barra de acoes esta visivel
- **WHEN** admin desmarca todos os alunos
- **THEN** barra de acoes desaparece

---

### Requirement: Dialog de Transferencia

O sistema DEVE exibir dialog para configurar transferencia apos selecao.

O dialog inclui:
- Tipo de transferencia: Curso ou Turma
- Lista de destinos disponiveis
- Opcoes adicionais (status para turmas)
- Confirmacao e resultado

#### Scenario: Dialog de transferencia entre cursos

- **GIVEN** admin selecionou alunos e clicou em "Transferir"
- **WHEN** dialog abre
- **THEN** admin pode escolher tipo "Curso"
- **AND** lista de cursos disponiveis e exibida (exceto curso atual)
- **AND** admin pode confirmar transferencia

#### Scenario: Dialog de transferencia entre turmas

- **GIVEN** admin selecionou alunos de uma turma e clicou em "Transferir"
- **WHEN** dialog abre e admin escolhe tipo "Turma"
- **THEN** lista de turmas do mesmo curso e exibida (exceto turma atual)
- **AND** admin pode escolher status para registros antigos
- **AND** admin pode confirmar transferencia

#### Scenario: Exibicao de resultado da transferencia

- **GIVEN** admin confirmou transferencia
- **WHEN** API processa e retorna resultado
- **THEN** dialog exibe resumo: total, sucessos, falhas
- **AND** lista detalhada mostra status de cada aluno
- **AND** admin pode fechar dialog e lista e atualizada

# Student Management Specification

### Requirement: Transferencia em Massa de Alunos entre Cursos

O sistema DEVE permitir transferir multiplos alunos de um curso para outro.

A transferencia entre cursos:
- Remove alunos de `alunos_cursos` do curso de origem
- Adiciona alunos em `alunos_cursos` do curso de destino
- Retorna resultado detalhado por aluno

#### Scenario: Transferencia de multiplos alunos entre cursos
- **GIVEN** admin esta na lista de alunos do curso origem
- **WHEN** admin seleciona alunos e escolhe transferir para outro curso
- **THEN** todos os alunos sao transferidos e sistema retorna resultado detalhado

#### Scenario: Falha parcial na transferencia
- **GIVEN** admin seleciona alunos para transferir
- **WHEN** alguns alunos ja estao matriculados no curso destino
- **THEN** alunos validos sao transferidos e alunos duplicados retornam status "skipped"

#### Scenario: Tentativa de transferir para o mesmo curso
- **WHEN** admin tenta transferir alunos para o mesmo curso de origem
- **THEN** sistema retorna erro de validacao

---

### Requirement: Transferencia em Massa de Alunos entre Turmas

O sistema DEVE permitir transferir multiplos alunos de uma turma para outra dentro do mesmo curso.

#### Scenario: Transferencia entre turmas do mesmo curso
- **GIVEN** admin seleciona alunos de uma turma
- **WHEN** admin escolhe transferir para outra turma do mesmo curso
- **THEN** registros antigos sao atualizados e novos registros criados na turma destino

#### Scenario: Tentativa de transferir para turma de outro curso
- **WHEN** admin tenta transferir alunos para turma de curso diferente
- **THEN** sistema retorna erro de validacao

---

### Requirement: Selecao em Massa de Alunos

O sistema DEVE permitir selecionar multiplos alunos na interface de listagem com checkboxes individuais, selecao de pagina inteira e opcoes de selecao rapida (10, 20, 30, todos).

#### Scenario: Selecao rapida de quantidade predefinida
- **WHEN** admin clica em "Selecionar N primeiros"
- **THEN** os N primeiros alunos da lista sao selecionados

---

### Requirement: Barra de Acoes em Massa

O sistema DEVE exibir barra de acoes fixa na parte inferior da tela quando alunos estao selecionados, com contagem e botoes de transferir/limpar.

---

### Requirement: Dialog de Transferencia

O sistema DEVE exibir dialog para configurar transferencia com tipo (Curso/Turma), lista de destinos, opcoes adicionais e exibicao de resultado.

---

### Requirement: Importacao de Alunos via Excel

O sistema DEVE fornecer interface de importacao de alunos em massa com upload de CSV/XLSX, download de modelo formatado, e feedback detalhado de resultados.

#### Scenario: Usuario importa arquivo valido
- **WHEN** usuario seleciona arquivo CSV ou XLSX valido e clica "Importar"
- **THEN** sistema processa e exibe resumo (criados, ignorados, falhos)

#### Scenario: Download de modelo Excel
- **WHEN** usuario clica "Baixar Modelo"
- **THEN** arquivo XLSX com planilhas "Dados" e "Instrucoes" e baixado com campos obrigatorios marcados

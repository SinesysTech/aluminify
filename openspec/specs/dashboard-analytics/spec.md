# Dashboard Analytics Specification

### Requirement: Dominio estrategico separado por modalidade
O sistema SHALL retornar, no payload do dashboard do aluno, metricas de **Dominio Estrategico** separadas por modalidade:

- **Flashcards (memoria)**: derivado de `progresso_flashcards.ultimo_feedback`
- **Questoes (aplicacao)**: derivado de `progresso_atividades.questoes_acertos/questoes_totais`

As metricas SHALL ser expostas para os eixos:
- **Modulos de Base** (`modulos.importancia = 'Base'`)
- **Alta Recorrencia** (`modulos.importancia = 'Alta'`)

#### Scenario: Aluno com dados de flashcards e questoes
- **WHEN** o aluno possui registros em `progresso_flashcards` e `progresso_atividades` para modulos do eixo
- **THEN** o payload contem `flashcardsScore` e `questionsScore` como percentuais 0-100

#### Scenario: Aluno sem dados em uma das modalidades
- **WHEN** o aluno nao possui registros em uma modalidade para modulos do eixo
- **THEN** o score daquela modalidade e `null` (sem evidencia), e a outra modalidade permanece calculada

### Requirement: Recomendacoes acionaveis no dominio estrategico
O sistema SHALL retornar recomendacoes de estudo baseadas nos modulos com pior desempenho/recall dentro dos eixos estrategicos.

Cada recomendacao SHALL incluir:
- Identificacao do modulo (`moduloId`, `moduloNome`)
- Importancia do modulo (`importancia`)
- Scores por modalidade (`flashcardsScore`, `questionsScore`)
- Um motivo curto (`reason`)

#### Scenario: Recomendacoes priorizam piores modulos com evidencia
- **WHEN** existem modulos com evidencia (flashcards e/ou questoes)
- **THEN** o sistema retorna uma lista ordenada pelos piores modulos primeiro

### Requirement: Dashboard filtros hierarquicos
O sistema SHALL permitir que o usuario selecione um escopo de analise no dashboard entre **Curso**, **Disciplina**, **Frente** e **Modulo**, e que os cards afetados reflitam esse escopo.

#### Scenario: Usuario alterna o nivel de analise
- **WHEN** o usuario alterna o nivel de analise do card
- **THEN** o card MUST recarregar apenas seus dados e exibir os valores no novo nivel

### Requirement: Distribuicao de tempo por nivel
O sistema SHALL exibir a distribuicao do tempo de estudo por **Disciplina**, **Frente** ou **Modulo**, respeitando o escopo selecionado.

#### Scenario: Distribuicao por frente dentro de uma disciplina
- **WHEN** o usuario seleciona nivel **Frente** e escopo **Disciplina**
- **THEN** o card MUST mostrar a distribuicao do tempo entre frentes daquela disciplina

#### Scenario: Sessoes sem modulo sao agrupadas
- **WHEN** o usuario seleciona nivel **Modulo**
- **THEN** sessoes sem `modulo_id` MUST ser agrupadas como "Nao identificado"

### Requirement: Performance por nivel
O sistema SHALL calcular performance de questoes a partir de `progresso_atividades` e permitir visualizacao por **Disciplina**, **Frente** e **Modulo**.

#### Scenario: Item nao iniciado
- **WHEN** nao houver progresso concluido para uma entidade do nivel selecionado
- **THEN** a entidade MUST aparecer com status "Nao iniciada"

### Requirement: Dominio Estrategico filtravel por escopo e por modulo
O sistema SHALL permitir filtrar o card **Dominio Estrategico** por **Curso**, **Disciplina**, **Frente** e **Modulo**, mantendo os eixos **Flashcards** e **Questoes** no mesmo card.

#### Scenario: Nivel Modulo com seletor e ranking
- **WHEN** o usuario seleciona nivel **Modulo**
- **THEN** o card MUST oferecer um seletor de modulo e uma lista/ranking de modulos no escopo, exibindo Flashcards e Questoes por modulo

#### Scenario: Sem filtro por modo
- **WHEN** o usuario utiliza o card Dominio Estrategico
- **THEN** o card MUST NOT oferecer filtro por "Modo"

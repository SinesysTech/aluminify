## ADDED Requirements

### Requirement: Domínio estratégico separado por modalidade
O sistema SHALL retornar, no payload do dashboard do aluno, métricas de **Domínio Estratégico** separadas por modalidade:

- **Flashcards (memória)**: derivado de `progresso_flashcards.ultimo_feedback`
- **Questões (aplicação)**: derivado de `progresso_atividades.questoes_acertos/questoes_totais`

As métricas SHALL ser expostas para os eixos:
- **Módulos de Base** (`modulos.importancia = 'Base'`)
- **Alta Recorrência** (`modulos.importancia = 'Alta'`)

#### Scenario: Aluno com dados de flashcards e questões
- **WHEN** o aluno possui registros em `progresso_flashcards` e `progresso_atividades` para módulos do eixo
- **THEN** o payload contém `flashcardsScore` e `questionsScore` como percentuais 0–100

#### Scenario: Aluno sem dados em uma das modalidades
- **WHEN** o aluno não possui registros em uma modalidade para módulos do eixo
- **THEN** o score daquela modalidade é `null` (sem evidência), e a outra modalidade permanece calculada

### Requirement: Recomendações acionáveis no domínio estratégico
O sistema SHALL retornar recomendações de estudo baseadas nos módulos com pior desempenho/recall dentro dos eixos estratégicos.

Cada recomendação SHALL incluir:
- Identificação do módulo (`moduloId`, `moduloNome`)
- Importância do módulo (`importancia`)
- Scores por modalidade (`flashcardsScore`, `questionsScore`)
- Um motivo curto (`reason`)

#### Scenario: Recomendações priorizam piores módulos com evidência
- **WHEN** existem módulos com evidência (flashcards e/ou questões)
- **THEN** o sistema retorna uma lista ordenada pelos piores módulos primeiro


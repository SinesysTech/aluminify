## ADDED Requirements

### Requirement: Dashboard filtros hierárquicos
O sistema SHALL permitir que o usuário selecione um escopo de análise no dashboard entre **Curso**, **Disciplina**, **Frente** e **Módulo**, e que os cards afetados reflitam esse escopo.

#### Scenario: Usuário alterna o nível de análise
- **WHEN** o usuário alterna o nível de análise do card
- **THEN** o card MUST recarregar apenas seus dados e exibir os valores no novo nível

### Requirement: Distribuição de tempo por nível
O sistema SHALL exibir a distribuição do tempo de estudo por **Disciplina**, **Frente** ou **Módulo**, respeitando o escopo selecionado.

#### Scenario: Distribuição por frente dentro de uma disciplina
- **WHEN** o usuário seleciona nível **Frente** e escopo **Disciplina**
- **THEN** o card MUST mostrar a distribuição do tempo entre frentes daquela disciplina

#### Scenario: Sessões sem módulo são agrupadas
- **WHEN** o usuário seleciona nível **Módulo**
- **THEN** sessões sem `modulo_id` MUST ser agrupadas como “Não identificado”

### Requirement: Performance por nível
O sistema SHALL calcular performance de questões a partir de `progresso_atividades` e permitir visualização por **Disciplina**, **Frente** e **Módulo**.

#### Scenario: Item não iniciado
- **WHEN** não houver progresso concluído para uma entidade do nível selecionado
- **THEN** a entidade MUST aparecer com status “Não iniciada”

### Requirement: Domínio Estratégico filtrável por escopo e por módulo
O sistema SHALL permitir filtrar o card **Domínio Estratégico** por **Curso**, **Disciplina**, **Frente** e **Módulo**, mantendo os eixos **Flashcards** e **Questões** no mesmo card.

#### Scenario: Nível Módulo com seletor e ranking
- **WHEN** o usuário seleciona nível **Módulo**
- **THEN** o card MUST oferecer um seletor de módulo e uma lista/ranking de módulos no escopo, exibindo Flashcards e Questões por módulo

#### Scenario: Sem filtro por modo
- **WHEN** o usuário utiliza o card Domínio Estratégico
- **THEN** o card MUST NOT oferecer filtro por “Modo”


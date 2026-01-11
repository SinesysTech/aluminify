## Why
Hoje o card **Domínio Estratégico** mostra valores mockados (fixos), e mesmo quando houver cálculo real, um único percentual mistura duas habilidades diferentes:

- **Flashcards** → memória/recall (lembrar/explicar)
- **Questões/Atividades** → aplicação (resolver, interpretação, pressão)

Separar as métricas torna o painel **acionável**: o aluno entende se deve reforçar memória, treinar aplicação, ou ambos.

## What Changes
- Separar o “Domínio Estratégico” em **duas métricas por eixo**:
  - **Flashcards (memória)**: derivado de `progresso_flashcards.ultimo_feedback`
  - **Questões (aplicação)**: derivado de `progresso_atividades.questoes_totais/questoes_acertos` (apenas atividades concluídas)
- Manter os eixos atuais do card:
  - **Módulos de Base** → `modulos.importancia = 'Base'`
  - **Alta Recorrência** → `modulos.importancia = 'Alta'`
- Incluir no payload recomendações “o que fazer agora” (top 3 módulos com pior cenário), para transformar o painel em guia de estudo.

## Impact
- **Backend**
  - `backend/services/dashboard-analytics/dashboard-analytics.service.ts`: substituir `getStrategicDomain()` mockado por cálculo real.
- **Contrato de dados**
  - `types/dashboard.ts`: `StrategicDomain` passará a incluir métricas separadas (flashcards vs questões) e recomendações.
- **Frontend**
  - `components/dashboard/strategic-domain.tsx`: atualizar UI para renderizar 2 barras (flashcards/questões) por eixo e exibir recomendações.

## Out of Scope (agora)
- Criar novos campos no banco; a primeira versão usa somente tabelas existentes.
- Construir modelos avançados (IRT, modelos probabilísticos) — manter algoritmo simples e explicável.


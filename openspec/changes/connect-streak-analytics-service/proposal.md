## Why

A página de Sala de Estudos (`client.tsx`) exibe um contador de streak (dias consecutivos de estudo) hardcoded como `0`. O serviço de analytics do dashboard (`dashboard-analytics.service.ts`) já foi implementado recentemente (commit `f77c13c8`) e fornece dados de engajamento do aluno, incluindo streak. Conectar esse dado real melhora a experiência do aluno e dá utilidade a um serviço já existente.

## What Changes

- Substituir o `useState(0)` hardcoded por uma chamada ao serviço de analytics do dashboard
- Buscar o valor real de `streakDays` do aluno autenticado
- Tratar estados de loading e erro da requisição

## Capabilities

### New Capabilities
- `study-room-streak-integration`: Integrar dados de streak do serviço de analytics na Sala de Estudos

### Modified Capabilities
<!-- Nenhuma capability existente é modificada -->

## Impact

- `app/[tenant]/(modules)/sala-de-estudos/client.tsx`: Substituição de estado hardcoded por fetch de dados
- Dependência no serviço de dashboard analytics (já existente)
- Pode envolver criação de API route ou reutilização de endpoint existente
- Sem breaking changes

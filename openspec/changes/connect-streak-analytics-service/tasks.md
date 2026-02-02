## 1. Hook de Fetch do Streak

- [ ] 1.1 Criar hook `useStreakDays` no módulo sala-de-estudos que chama `GET /api/dashboard/user` via TanStack Query e retorna `{ streakDays, isLoading, isError }`
- [ ] 1.2 Configurar `staleTime` e opções de retry adequadas para a query

## 2. Integração no Client

- [ ] 2.1 Substituir `useState(0)` hardcoded em `client.tsx` pelo hook `useStreakDays`
- [ ] 2.2 Passar `isLoading` para `ProgressoStatsCard` para exibir estado de loading
- [ ] 2.3 Tratar estado de erro com fallback para `0`

## 3. Loading State no Componente

- [ ] 3.1 Adicionar prop `isLoading` ao `ProgressoStatsCard` e exibir skeleton/placeholder no lugar do streak durante loading

## 4. Validação

- [ ] 4.1 Verificar que o streak exibe valor real ao carregar a página
- [ ] 4.2 Verificar que loading state aparece durante fetch
- [ ] 4.3 Verificar que a página funciona normalmente quando o fetch falha

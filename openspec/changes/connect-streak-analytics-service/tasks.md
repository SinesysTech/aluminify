## 1. Hook de Fetch do Streak

- [x] 1.1 Criar hook `useStreakDays` no módulo sala-de-estudos que chama `GET /api/dashboard/user` via useState + useEffect e retorna `{ streakDays, isLoading, isError }`
- [x] 1.2 Configurar tratamento de erro com fallback para 0

## 2. Integração no Client

- [x] 2.1 Substituir `useState(0)` hardcoded em `client.tsx` pelo hook `useStreakDays`
- [x] 2.2 Passar `isLoading` para `ProgressoStatsCard` para exibir estado de loading
- [x] 2.3 Tratar estado de erro com fallback para `0`

## 3. Loading State no Componente

- [x] 3.1 Adicionar prop `isStreakLoading` ao `ProgressoStatsCard` e exibir skeleton no lugar do streak durante loading

## 4. Validação

- [x] 4.1 Verificar que o streak exibe valor real ao carregar a página
- [x] 4.2 Verificar que loading state aparece durante fetch
- [x] 4.3 Verificar que a página funciona normalmente quando o fetch falha

# Fluxo Completo do Serviço de Calendário

## Visão Geral

O serviço de calendário permite visualizar e gerenciar as aulas do cronograma de estudos em formato de calendário, com capacidade de filtrar por dias da semana e atualizar a distribuição de datas.

---

## 1. ENTRADA - Página do Calendário

**Arquivo:** `app/(dashboard)/aluno/cronograma/calendario/page.tsx`

### Fluxo Inicial:
1. **Verificação de Autenticação**
   - Verifica se o usuário está autenticado
   - Redireciona para `/auth/login` se não estiver

2. **Busca do Cronograma**
   - Busca o cronograma mais recente do aluno na tabela `cronogramas`
   - Ordena por `created_at DESC` e pega o primeiro (`limit(1)`)
   - Se não encontrar, exibe mensagem para criar um cronograma

3. **Renderização**
   - Se encontrar cronograma: renderiza `ScheduleCalendarView` com o `cronogramaId`
   - Se não encontrar: exibe card com botão para criar cronograma

---

## 2. CARREGAMENTO DOS DADOS - ScheduleCalendarView

**Arquivo:** `components/schedule-calendar-view.tsx`

### useEffect Principal (linhas 145-359):

#### 2.1. Busca do Cronograma
```typescript
// Busca dados do cronograma
const { data: cronogramaData } = await supabase
  .from('cronogramas')
  .select('*')
  .eq('id', cronogramaId)
  .single()
```

#### 2.2. Busca dos Itens do Cronograma
```typescript
// Busca itens com data_prevista
const { data: itensData } = await supabase
  .from('cronograma_itens')
  .select('id, aula_id, semana_numero, ordem_na_semana, concluido, data_conclusao, data_prevista')
  .eq('cronograma_id', cronogramaId)
  .order('semana_numero', { ascending: true })
  .order('ordem_na_semana', { ascending: true })
```

**⚠️ PONTO DE ATENÇÃO:** A busca inclui `data_prevista`, que é o campo que armazena a data calculada para cada item.

#### 2.3. Busca das Aulas (com joins complexos)
- Busca aulas em lotes de 100 (para evitar limite de query)
- Faz joins com: `modulos` → `frentes` → `disciplinas`
- Monta estrutura completa com hierarquia: Disciplina → Frente → Módulo → Aula

#### 2.4. Cálculo de Datas dos Itens
**Função:** `calcularDatasItens` (linhas 361-426)

**Lógica:**
1. **Se o item tem `data_prevista`:**
   - Usa a `data_prevista` diretamente do banco
   - Parseia a data (formato YYYY-MM-DD ou ISO)
   - Cria Date no horário local para evitar problemas de timezone

2. **Se o item NÃO tem `data_prevista` (fallback):**
   - Calcula baseado em `semana_numero` e `ordem_na_semana`
   - Usa `data_inicio` do cronograma
   - Calcula: `inicioSemana + (ordem_na_semana - 1) % diasEstudoSemana`

**⚠️ PONTO DE ATENÇÃO:** O fallback pode gerar datas incorretas se a distribuição de dias da semana mudou.

#### 2.5. Criação do Mapa por Data
```typescript
const mapaPorData = new Map<string, ItemComData[]>()
itensComData.forEach(item => {
  const dataKey = normalizarDataParaKey(item.data) // Formato: 'yyyy-MM-dd'
  if (!mapaPorData.has(dataKey)) {
    mapaPorData.set(dataKey, [])
  }
  mapaPorData.get(dataKey)!.push(item)
})
```

**⚠️ PONTO DE ATENÇÃO:** A função `normalizarDataParaKey` normaliza a data para formato string 'yyyy-MM-dd' sempre no horário local.

#### 2.6. Busca da Distribuição de Dias
```typescript
const { data: distribuicaoData } = await supabase
  .from('cronograma_semanas_dias')
  .select('dias_semana')
  .eq('cronograma_id', cronogramaId)
  .maybeSingle()
```

- Carrega os dias da semana selecionados (ex: [1,2,3,4,5] = segunda a sexta)
- Define estado `diasSelecionados`

---

## 3. FILTRO POR DIAS DA SEMANA

**Hook:** `useMemo` - `itensPorDataFiltrados` (linhas 935-1022)

### Lógica do Filtro:
1. Itera sobre `itensPorData` (mapa original)
2. Para cada data:
   - Extrai o dia da semana (0=domingo, 1=segunda, ..., 6=sábado)
   - Verifica se o dia está em `diasSelecionados`
   - Se estiver, adiciona ao mapa filtrado

**⚠️ PONTO DE ATENÇÃO:** O filtro funciona corretamente apenas se as datas dos itens estão nos dias selecionados. Se houver itens com `data_prevista` em dias não selecionados, eles não aparecerão no calendário.

---

## 4. MODIFICADORES DO CALENDÁRIO

**Hook:** `useMemo` - `modifiers` (linhas 1027-1104)

### Modificadores Criados:
1. **`hasAulas`**: Verifica se há itens na data específica
   - Usa `itensPorDataFiltrados` (já filtrado por dias)
   - Retorna `true` se há itens naquela data

2. **`hasConcluidas`**: Verifica se há itens concluídos na data
   - Verifica se algum item na data tem `concluido === true`

**⚠️ PONTO DE ATENÇÃO:** Os modificadores dependem de `itensPorDataFiltrados`, que por sua vez depende de `diasSelecionados`. Se os dias mudarem, os modificadores precisam ser recriados.

---

## 5. ATUALIZAÇÃO DA DISTRIBUIÇÃO DE DIAS

**Função:** `handleSalvarDistribuicao` (linhas 805-930)

### Fluxo Completo:

#### 5.1. Validação
- Verifica se `cronogramaId` é válido
- Verifica se há dias selecionados

#### 5.2. Chamada à API
```typescript
const response = await fetch(`/api/cronograma/${cronogramaId}/distribuicao-dias`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    dias_semana: diasSelecionados,
  }),
})
```

#### 5.3. Aguardar Processamento do Backend
- Aguarda tempo estimado baseado no número de dias selecionados
- Faz verificações progressivas para confirmar que as datas foram atualizadas
- Verifica amostra de itens para ver se os dias selecionados aparecem

**⚠️ PONTO DE ATENÇÃO:** O frontend aguarda um tempo fixo (3-5 segundos) antes de recarregar. Se o backend demorar mais, pode haver inconsistência.

#### 5.4. Recarregamento dos Dados
- Chama `recarregarCronograma()` para buscar dados atualizados
- Força atualização do calendário com `setCalendarForceUpdate`

---

## 6. API - Atualização de Distribuição de Dias

**Arquivo:** `app/api/cronograma/[id]/distribuicao-dias/route.ts`

### Handler PUT (linhas 91-163):

#### 6.1. Validação
- Extrai `cronogramaId` da URL ou contexto
- Valida que `dias_semana` é um array válido

#### 6.2. Chamada ao Serviço
```typescript
const distribuicao = await cronogramaService.atualizarDistribuicaoDias(
  {
    cronograma_id: cronogramaId,
    dias_semana: body.dias_semana,
  },
  request.user.id,
)
```

---

## 7. SERVIÇO - Atualização e Recalculo de Datas

**Arquivo:** `backend/services/cronograma/cronograma.service.ts`

### 7.1. `atualizarDistribuicaoDias` (linhas 1655-1738)

#### Passos:
1. **Validação de Dias**
   - Verifica que todos os dias estão entre 0-6
   - Verifica que o cronograma pertence ao usuário

2. **Salvar/Atualizar Distribuição**
   - Se existe: atualiza `cronograma_semanas_dias`
   - Se não existe: cria novo registro

3. **Recalcular Datas**
   - Chama `recalcularDatasItens(cronogramaId, userId)`

### 7.2. `recalcularDatasItens` (linhas 1744-1994)

**⚠️ ESTA É A FUNÇÃO CRÍTICA QUE CALCULA AS DATAS**

#### Algoritmo Round-Robin:

1. **Busca Dados:**
   - Busca cronograma (para pegar `data_inicio`)
   - Busca distribuição de dias
   - Busca todos os itens ordenados por `semana_numero` e `ordem_na_semana`

2. **Encontra Primeiro Dia Útil:**
   ```typescript
   const diaSemanaInicio = dataInicio.getDay()
   let primeiroDiaUtilIndex = diasOrdenados.findIndex(dia => dia >= diaSemanaInicio)
   ```

3. **Distribuição Round-Robin:**
   - Para cada item, distribui sequencialmente entre os dias selecionados
   - Exemplo: Se dias = [1,2,3,4,5] (seg-sex):
     - Item 1 → Segunda
     - Item 2 → Terça
     - Item 3 → Quarta
     - Item 4 → Quinta
     - Item 5 → Sexta
     - Item 6 → Segunda (próxima semana)
     - ...

4. **Cálculo da Data:**
   ```typescript
   const diaSemanaEscolhido = diasOrdenados[indiceDiaAtual]
   const dataItem = new Date(dataAtual)
   const diaSemanaAtual = dataItem.getDay()
   let diasParaAdicionar = diaSemanaEscolhido - diaSemanaAtual
   if (diasParaAdicionar < 0) {
     diasParaAdicionar += 7 // Próxima semana
   }
   dataItem.setDate(dataItem.getDate() + diasParaAdicionar)
   ```

5. **Atualização em Lote:**
   - Atualiza cada item com sua `data_prevista` calculada
   - Faz UPDATE individual para cada item (não é bulk update)

**⚠️ PONTOS DE ATENÇÃO:**
- O algoritmo atualiza itens **sequencialmente** (um por um), o que pode ser lento para muitos itens
- A lógica de avanço de semana pode ter bugs se os dias selecionados não forem consecutivos
- Não há transação, então se falhar no meio, alguns itens podem ficar desatualizados

---

## 8. RENDERIZAÇÃO DO CALENDÁRIO

**Componente:** `Calendar` (de `@/components/ui/calendar`)

### Props Passadas:
- `mode="range"`: Permite seleção de intervalo
- `selected={dateRange}`: Range selecionado
- `modifiers={modifiers}`: Modificadores para marcar datas
- `modifiersClassNames`: Classes CSS para datas com aulas/concluídas

### Marcações Visuais:
- **Azul claro:** Datas com aulas (`hasAulas`)
- **Verde claro:** Datas com aulas concluídas (`hasConcluidas`)

---

## 9. LISTA DE AULAS POR PERÍODO

**Renderização Condicional** (linhas 1334-1568)

### Lógica:
1. Filtra itens baseado no `dateRange` selecionado
2. Usa `itensPorData` (mapa original, não filtrado) para mostrar TODAS as aulas do período
3. Agrupa por data e renderiza cards

**⚠️ PONTO DE ATENÇÃO:** A lista mostra TODAS as aulas do período, independente do filtro de dias da semana. Isso pode ser confuso para o usuário.

---

## PONTOS DE ERRO IDENTIFICADOS

### 🔴 CRÍTICOS:

1. **Race Condition no Recalculo de Datas**
   - O frontend aguarda tempo fixo (3-5s) antes de recarregar
   - Se o backend demorar mais (muitos itens), os dados podem não estar atualizados
   - **Solução:** Implementar polling ou WebSocket para notificar quando terminar

2. **Atualização Sequencial de Itens**
   - `recalcularDatasItens` atualiza itens um por um
   - Para 998 itens, pode levar vários segundos
   - **Solução:** Usar bulk update ou transação

3. **Falta de Transação**
   - Se o recálculo falhar no meio, alguns itens ficam desatualizados
   - **Solução:** Usar transação do Supabase ou rollback manual

4. **Timezone Issues**
   - Múltiplas conversões de data podem causar problemas de timezone
   - **Solução:** Padronizar uso de UTC ou horário local consistentemente

### 🟡 MÉDIOS:

5. **Fallback de Cálculo de Data**
   - Se `data_prevista` não existir, usa cálculo baseado em semana/ordem
   - Pode gerar datas incorretas se a distribuição mudou
   - **Solução:** Sempre recalcular quando distribuição mudar

6. **Filtro de Dias Pode Esconder Itens**
   - Itens com `data_prevista` em dias não selecionados não aparecem
   - Usuário pode não entender por que algumas aulas não aparecem
   - **Solução:** Mostrar aviso ou recalcular automaticamente

7. **Dependências de Hooks**
   - Múltiplos `useMemo` e `useEffect` com dependências complexas
   - Pode causar re-renders desnecessários
   - **Solução:** Otimizar dependências e usar `useCallback` onde apropriado

### 🟢 BAIXOS:

8. **Logs Excessivos**
   - Muitos `console.log` podem impactar performance em produção
   - **Solução:** Usar logger condicional baseado em `NODE_ENV`

9. **Cache do Supabase**
   - Frontend pode estar usando cache antigo
   - **Solução:** Forçar busca sem cache após atualizações

---

## FLUXO RESUMIDO

```
1. Usuário acessa /aluno/cronograma/calendario
   ↓
2. Página busca cronograma do aluno
   ↓
3. ScheduleCalendarView carrega:
   - Dados do cronograma
   - Itens com data_prevista
   - Aulas (com joins)
   - Distribuição de dias
   ↓
4. Calcula datas dos itens (usa data_prevista ou fallback)
   ↓
5. Cria mapa por data (itensPorData)
   ↓
6. Filtra por dias selecionados (itensPorDataFiltrados)
   ↓
7. Cria modificadores para o calendário
   ↓
8. Renderiza calendário com marcações
   ↓
9. Usuário altera dias selecionados
   ↓
10. Clica em "Salvar e Atualizar Calendário"
    ↓
11. Frontend chama API PUT /api/cronograma/{id}/distribuicao-dias
    ↓
12. API chama cronogramaService.atualizarDistribuicaoDias
    ↓
13. Serviço salva distribuição e chama recalcularDatasItens
    ↓
14. recalcularDatasItens:
    - Busca itens
    - Calcula datas (round-robin)
    - Atualiza data_prevista de cada item (sequencial)
    ↓
15. Frontend aguarda e recarrega dados
    ↓
16. Calendário atualiza com novas datas
```

---

## PRÓXIMOS PASSOS PARA CORREÇÃO

1. **Implementar bulk update** no `recalcularDatasItens`
2. **Adicionar transação** para garantir atomicidade
3. **Implementar polling/notificação** para saber quando o recálculo terminar
4. **Otimizar dependências** dos hooks React
5. **Adicionar tratamento de erros** mais robusto
6. **Testar edge cases** (mudança de dias, muitos itens, etc.)



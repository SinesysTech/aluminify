# Fluxo Detalhado de Geração de Cronograma

## 📋 Visão Geral

O sistema gera cronogramas seguindo este fluxo:
1. **Frontend**: Usuário seleciona disciplinas e módulos
2. **Frontend**: Envia requisição para API
3. **Backend**: Busca frentes das disciplinas
4. **Backend**: Busca módulos das frentes
5. **Backend**: Filtra módulos pelos selecionados (se houver)
6. **Backend**: Busca aulas dos módulos filtrados
7. **Backend**: Filtra aulas por prioridade mínima
8. **Backend**: Distribui aulas nas semanas
9. **Backend**: Persiste no banco de dados

---

## 🔍 PASSO A PASSO DETALHADO

### **ETAPA 1: Frontend - Seleção de Disciplinas e Módulos**

**Arquivo**: `components/schedule-wizard.tsx`

#### 1.1 Carregamento de Módulos (linhas 456-713)

Quando o usuário seleciona um curso e disciplinas:

```typescript
// Linha 480-485: Busca frentes do curso e disciplinas selecionadas
const { data: frentesData } = await supabase
  .from('frentes')
  .select('id, nome, disciplina_id, disciplinas(nome)')
  .eq('curso_id', cursoSelecionado)
  .in('disciplina_id', disciplinasIds)
```

**⚠️ PONTO CRÍTICO 1**: Aqui busca TODAS as frentes das disciplinas selecionadas que pertencem ao curso.

#### 1.2 Busca de Módulos (linhas 512-525)

```typescript
// Linha 512-516: Busca módulos das frentes encontradas
const { data: modulosData } = await supabase
  .from('modulos')
  .select('id, nome, numero_modulo, frente_id')
  .in('frente_id', frenteIds)
```

**⚠️ PONTO CRÍTICO 2**: Busca TODOS os módulos das frentes encontradas.

#### 1.3 Construção da Árvore (linhas 627-653)

```typescript
// Linha 628-653: Constrói árvore frentes > módulos > aulas
const arvore = frentesData.map((frente: any) => {
  const modulos = (modulosPorFrente.get(frente.id) || []).map(...)
  return { id: frente.id, nome: frente.nome, modulos }
})
```

#### 1.4 Seleção Automática de Todos os Módulos (linha 679-680)

```typescript
// Linha 679-680: Seleciona TODOS os módulos automaticamente
const todosModulos = arvoreComModulos.flatMap((frente) => 
  frente.modulos.map((modulo: any) => modulo.id)
)
setModulosSelecionados(todosModulos)
```

**✅ AQUI**: Todos os módulos de todas as frentes são selecionados automaticamente.

#### 1.5 Envio para API (linhas 858-861)

```typescript
// Linha 858: Envia módulos selecionados para API
modulos_ids: data.modulos_ids && data.modulos_ids.length > 0 
  ? data.modulos_ids 
  : undefined,
```

**⚠️ PONTO CRÍTICO 3**: Se `modulos_ids` estiver vazio ou undefined, o backend não filtra por módulos.

---

### **ETAPA 2: API - Recepção da Requisição**

**Arquivo**: `app/api/cronograma/route.ts`

#### 2.1 Processamento do Payload (linhas 82-90)

```typescript
// Linha 85: Processa modulos_ids
modulos_ids: Array.isArray(body?.modulos_ids) 
  ? body.modulos_ids 
  : undefined,
```

**✅ AQUI**: Se for array válido, passa adiante. Se não, passa `undefined`.

---

### **ETAPA 3: Backend - Busca de Aulas**

**Arquivo**: `backend/services/cronograma/cronograma.service.ts`

#### 3.1 Busca de Frentes (linhas 369-403)

```typescript
// Linha 369-376: Busca frentes das disciplinas selecionadas
let frentesQuery = client
  .from('frentes')
  .select('id, nome, disciplina_id')
  .in('disciplina_id', disciplinasIds);

if (cursoId) {
  frentesQuery = frentesQuery.eq('curso_id', cursoId);
}
```

**✅ AQUI**: Busca TODAS as frentes das disciplinas que pertencem ao curso.

**Log esperado**: `[CronogramaService] Frentes encontradas por disciplina`

#### 3.2 Busca de Módulos (linhas 410-448)

```typescript
// Linha 410-417: Busca módulos das frentes encontradas
let modulosQuery = client
  .from('modulos')
  .select('id, frente_id, frentes(nome, disciplina_id)')
  .in('frente_id', frenteIds);

if (cursoId) {
  modulosQuery = modulosQuery.eq('curso_id', cursoId);
}
```

**✅ AQUI**: Busca TODOS os módulos das frentes encontradas.

**Log esperado**: `[CronogramaService] Módulos encontrados por frente`

#### 3.3 Filtro de Módulos Selecionados (linhas 450-551)

**⚠️⚠️⚠️ PONTO CRÍTICO 4 - AQUI ESTÁ O PROBLEMA POTENCIAL ⚠️⚠️⚠️**

```typescript
// Linha 450: Se há módulos selecionados, filtra
if (modulosSelecionados && modulosSelecionados.length > 0) {
  // Linha 477: FILTRA módulos pelos selecionados
  moduloIds = moduloIds.filter((id) => modulosSelecionados.includes(id));
  
  // Linha 490-501: Verifica quais frentes têm módulos selecionados
  modulosData?.forEach((modulo: any) => {
    if (moduloIds.includes(modulo.id)) {
      frentesComModulosSelecionados.add(modulo.frente_id);
    }
  });
  
  // Linha 525: Identifica frentes SEM módulos selecionados
  const frentesSemModulos = frenteIds.filter(id => 
    !frentesComModulosSelecionados.has(id)
  );
}
```

**🔴 PROBLEMA POTENCIAL**: 
- Se os módulos da frente C de matemática NÃO estiverem no array `modulosSelecionados`, eles serão EXCLUÍDOS
- Isso fará com que a frente C não tenha módulos selecionados
- Consequentemente, nenhuma aula da frente C será buscada

**Log esperado**: 
- `[CronogramaService] Módulos ANTES do filtro por frente`
- `[CronogramaService] Módulos DEPOIS do filtro por frente`
- `[CronogramaService] ⚠️⚠️⚠️ Frentes sem módulos selecionados (CRÍTICO)`

#### 3.4 Busca de Aulas (linhas 560-590)

```typescript
// Linha 560-587: Busca aulas dos módulos filtrados
let aulasQuery = client
  .from('aulas')
  .select('...')
  .in('modulo_id', moduloIds)  // ⚠️ Usa apenas módulos filtrados
  .gte('prioridade', prioridadeMinimaEfetiva)
  .neq('prioridade', 0);
```

**🔴 PROBLEMA**: Se os módulos da frente C foram excluídos no passo anterior, nenhuma aula será buscada.

#### 3.5 Filtro por Curso (linhas 681-690)

```typescript
// Linha 681-685: Filtra aulas por curso_id da frente
if (cursoId) {
  aulasData = aulasDataRaw.filter((aula: any) => {
    const frenteCursoId = aula.modulos?.frentes?.curso_id;
    return frenteCursoId === cursoId;
  });
}
```

**✅ AQUI**: Filtra apenas aulas que pertencem ao curso selecionado.

#### 3.6 Validação Final (linhas 781-806)

```typescript
// Linha 787-798: Verifica status de todas as frentes
const frentesComStatus = frenteIds.map(frenteId => {
  const temAulas = frentesComAulas.has(frenteId);
  const totalAulas = aulas.filter(a => a.frente_id === frenteId).length;
  return { frente_id, frente_nome, tem_aulas, total_aulas };
});
```

**Log esperado**: 
- `[CronogramaService] Status de todas as frentes`
- `[CronogramaService] ❌❌❌ FRENTES SEM AULAS NO CRONOGRAMA`

---

## 🐛 POSSÍVEIS CAUSAS DO PROBLEMA

### **Causa 1: Módulos da Frente C não estão sendo selecionados no Frontend**

**Sintoma**: Os módulos da frente C não aparecem no array `modulosSelecionados`

**Verificação**: 
- Verificar log `[CronogramaService] Módulos ANTES do filtro por frente`
- Verificar se a frente C aparece na lista
- Verificar se os módulos da frente C estão no array

### **Causa 2: Módulos da Frente C não estão sendo enviados para API**

**Sintoma**: Os módulos estão selecionados no frontend, mas não chegam no backend

**Verificação**:
- Verificar log `[Cronograma API] Payload preparado` - verificar `modulos_ids` count
- Verificar se todos os módulos estão no array enviado

### **Causa 3: Módulos da Frente C não pertencem ao curso selecionado**

**Sintoma**: Os módulos existem, mas não são encontrados na busca

**Verificação**:
- Verificar se a frente C tem `curso_id` correto
- Verificar se os módulos da frente C têm `curso_id` correto
- Verificar log `[CronogramaService] Módulos encontrados por frente`

### **Causa 4: Aulas da Frente C não têm prioridade suficiente**

**Sintoma**: Módulos estão selecionados, mas nenhuma aula é encontrada

**Verificação**:
- Verificar se as aulas têm `prioridade >= prioridadeMinima`
- Verificar log `[CronogramaService] ⚠️ Frente ... tem X módulo(s) selecionado(s) mas nenhuma aula foi encontrada`

### **Causa 5: Filtro de curso_id está excluindo aulas**

**Sintoma**: Aulas são encontradas, mas são filtradas depois

**Verificação**:
- Verificar se `aula.modulos.frentes.curso_id === cursoId`
- Verificar log `[CronogramaService] Aulas encontradas por frente`

---

## 🔧 COMO DEBUGAR

1. **Gere um novo cronograma** com Física e Matemática
2. **Verifique os logs no terminal** na seguinte ordem:

   a. `[CronogramaService] Frentes encontradas por disciplina`
      - Deve mostrar 3 frentes de Física e 3 frentes de Matemática
   
   b. `[CronogramaService] Módulos encontrados por frente`
      - Deve mostrar módulos de TODAS as frentes, incluindo frente C de matemática
   
   c. `[CronogramaService] Módulos ANTES do filtro por frente`
      - Deve mostrar módulos de TODAS as frentes
   
   d. `[CronogramaService] Módulos DEPOIS do filtro por frente`
      - **AQUI É O PROBLEMA**: Se a frente C não aparecer, os módulos não foram selecionados
   
   e. `[CronogramaService] ⚠️⚠️⚠️ Frentes sem módulos selecionados`
      - Se a frente C aparecer aqui, confirma que os módulos não foram selecionados
   
   f. `[CronogramaService] Aulas encontradas por frente`
      - Deve mostrar aulas de TODAS as frentes
   
   g. `[CronogramaService] Status de todas as frentes`
      - **AQUI CONFIRMA O PROBLEMA**: Se frente C tiver `tem_aulas: false`, confirma o bug

3. **Compare os arrays**:
   - Array de módulos ANTES do filtro vs DEPOIS do filtro
   - Array de módulos selecionados enviado do frontend
   - Verifique se os IDs dos módulos da frente C estão presentes

---

## ✅ SOLUÇÃO PROPOSTA

Se o problema for que os módulos da frente C não estão sendo selecionados:

1. **Verificar no frontend** se a frente C está sendo incluída quando seleciona "todos os módulos"
2. **Verificar se há algum filtro** que está excluindo a frente C
3. **Adicionar validação** para garantir que todas as frentes tenham módulos selecionados

Se o problema for que as aulas não têm prioridade suficiente:

1. **Ajustar prioridade mínima** ou
2. **Ajustar prioridade das aulas** da frente C no banco de dados


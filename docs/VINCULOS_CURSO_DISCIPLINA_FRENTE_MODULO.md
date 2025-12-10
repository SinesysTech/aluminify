# 🔗 Vínculos entre Curso, Disciplina, Frente e Módulo

Este documento explica os vínculos entre as entidades do sistema e como fazer buscas corretas considerando esses vínculos.

---

## 📊 Estrutura de Vínculos

```
Curso
  └── cursos_disciplinas (relacionamento muitos-para-muitos)
      └── Disciplina
          └── Frente (tem curso_id e disciplina_id)
              └── Módulo (tem frente_id e curso_id - pode ser NULL)
                  └── Aula (tem modulo_id e curso_id - pode ser NULL)
```

---

## 🗄️ Estrutura no Banco de Dados

### Tabela: `cursos_disciplinas`
- Relacionamento muitos-para-muitos entre cursos e disciplinas
- `curso_id` → Referência ao curso
- `disciplina_id` → Referência à disciplina

### Tabela: `frentes`
- `id` - UUID único
- `disciplina_id` - Referência à disciplina (obrigatório)
- `curso_id` - Referência ao curso (obrigatório - adicionado na migration `20251125`)
- `nome` - Nome da frente

**⚠️ IMPORTANTE:** Frentes devem ter `curso_id` preenchido.

### Tabela: `modulos`
- `id` - UUID único
- `frente_id` - Referência à frente (obrigatório)
- `curso_id` - Referência ao curso (pode ser NULL - dados legados)
- `nome` - Nome do módulo
- `numero_modulo` - Número do módulo

**⚠️ IMPORTANTE:** Módulos podem ter `curso_id = NULL` para compatibilidade com dados legados. Quando a frente tem `curso_id`, os módulos daquela frente pertencem ao mesmo curso, mesmo que `curso_id` seja NULL.

### Tabela: `aulas`
- `id` - UUID único
- `modulo_id` - Referência ao módulo (obrigatório)
- `curso_id` - Referência ao curso (pode ser NULL - dados legados)
- `nome` - Nome da aula

**⚠️ IMPORTANTE:** Aulas podem ter `curso_id = NULL` para compatibilidade com dados legados.

---

## 🔍 Como Buscar Corretamente

### 1. Buscar Frentes de uma Disciplina e Curso

```typescript
const { data: frentes } = await supabase
  .from('frentes')
  .select('id, nome, disciplina_id, curso_id')
  .eq('disciplina_id', disciplinaId)
  .eq('curso_id', cursoId) // Frentes devem ter curso_id preenchido
  .order('nome', { ascending: true })
```

**Regra:** Frentes sempre devem ter `curso_id` preenchido.

---

### 2. Buscar Módulos de uma Frente (considerando curso)

**Opção A: Aceitar módulos com curso_id NULL (compatibilidade com dados legados)**

```typescript
const { data: modulos } = await supabase
  .from('modulos')
  .select('id, nome, numero_modulo, frente_id, curso_id')
  .eq('frente_id', frenteId)
  .or(`curso_id.eq.${cursoId},curso_id.is.null`) // Aceitar null ou igual ao curso
  .order('numero_modulo', { ascending: true })
```

**Opção B: Apenas módulos com curso_id preenchido (mais restritivo)**

```typescript
const { data: modulos } = await supabase
  .from('modulos')
  .select('id, nome, numero_modulo, frente_id, curso_id')
  .eq('frente_id', frenteId)
  .eq('curso_id', cursoId) // Apenas módulos com curso_id preenchido
  .order('numero_modulo', { ascending: true })
```

**Recomendação:** Use a **Opção A** para compatibilidade com dados legados, especialmente se houver módulos sem `curso_id` preenchido.

---

### 3. Buscar Aulas de um Módulo (considerando curso)

**Opção A: Aceitar aulas com curso_id NULL (compatibilidade)**

```typescript
const { data: aulas } = await supabase
  .from('aulas')
  .select('id, nome, numero_aula, modulo_id, curso_id')
  .eq('modulo_id', moduloId)
  .or(`curso_id.eq.${cursoId},curso_id.is.null`) // Aceitar null ou igual ao curso
  .order('numero_aula', { ascending: true })
```

**Opção B: Apenas aulas com curso_id preenchido**

```typescript
const { data: aulas } = await supabase
  .from('aulas')
  .select('id, nome, numero_aula, modulo_id, curso_id')
  .eq('modulo_id', moduloId)
  .eq('curso_id', cursoId) // Apenas aulas com curso_id preenchido
  .order('numero_aula', { ascending: true })
```

**Recomendação:** Use a **Opção A** para compatibilidade.

---

## 📋 Checklist de Vínculos

### Ao buscar frentes:
- [ ] Filtrar por `disciplina_id`
- [ ] Filtrar por `curso_id` (obrigatório - frentes devem ter curso_id)

### Ao buscar módulos:
- [ ] Filtrar por `frente_id` (obrigatório)
- [ ] Considerar `curso_id` (pode ser NULL - usar `.or()` para aceitar null)
- [ ] Se a frente tem `curso_id`, os módulos pertencem ao mesmo curso (mesmo que null)

### Ao buscar aulas:
- [ ] Filtrar por `modulo_id` (obrigatório)
- [ ] Considerar `curso_id` (pode ser NULL - usar `.or()` para aceitar null)

---

## 🔧 Exemplos de Uso

### Exemplo 1: Buscar módulos para upload de flashcards

```typescript
// 1. Buscar frentes da disciplina no curso
const { data: frentes } = await supabase
  .from('frentes')
  .select('id, nome')
  .eq('disciplina_id', disciplinaId)
  .eq('curso_id', cursoId)

// 2. Buscar módulos da frente (aceitar curso_id null)
const { data: modulos } = await supabase
  .from('modulos')
  .select('id, nome, numero_modulo')
  .eq('frente_id', frenteId)
  .or(`curso_id.eq.${cursoId},curso_id.is.null`)
```

### Exemplo 2: Buscar módulos para cronograma

```typescript
// Buscar módulos das frentes, considerando curso
let modulosQuery = supabase
  .from('modulos')
  .select('id, nome, numero_modulo, frente_id, curso_id')
  .in('frente_id', frenteIds)

if (cursoId) {
  // Aceitar módulos com curso_id null ou igual ao curso
  modulosQuery = modulosQuery.or(`curso_id.eq.${cursoId},curso_id.is.null`)
}
```

---

## ⚠️ Problemas Comuns

### Problema: "Nenhum módulo encontrado para a frente selecionada"

**Causa:** Busca está usando `.eq('curso_id', cursoId)` mas módulos têm `curso_id = NULL`.

**Solução:** Use `.or(\`curso_id.eq.${cursoId},curso_id.is.null\`)` para aceitar módulos com curso_id null.

### Problema: "Nenhuma frente encontrada"

**Causa:** Frente não tem `curso_id` preenchido ou não pertence à disciplina.

**Solução:** Verifique se a frente tem `curso_id` preenchido e se pertence à disciplina correta.

---

## 📝 Notas Importantes

1. **Dados Legados:** Módulos e aulas criados antes da migration `20251125` podem ter `curso_id = NULL`. O sistema deve aceitar esses registros para compatibilidade.

2. **Frentes:** Sempre devem ter `curso_id` preenchido. Se uma frente não tem `curso_id`, é um erro de dados.

3. **Hierarquia:** Se uma frente tem `curso_id = X`, todos os módulos daquela frente pertencem ao curso X, mesmo que os módulos tenham `curso_id = NULL`.

4. **Validação:** Ao criar/atualizar módulos, considere preencher `curso_id` automaticamente com o `curso_id` da frente.

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0










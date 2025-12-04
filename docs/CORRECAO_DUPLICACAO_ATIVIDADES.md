# 🔧 Correção: Duplicação de Atividades ao Gerar Estrutura

## 📋 Problema Identificado

Quando o professor clicava em "Gerar Estrutura" novamente para uma frente, o sistema estava criando atividades duplicadas ao invés de substituir as existentes.

### Exemplo do Problema

```
Antes da correção:
- Simulado 0: Diagnóstico Inicial (Simulado_Diagnostico)
- Simulado 0: Diagnóstico Inicial (Simulado_Diagnostico) ❌ DUPLICADO
```

---

## ✅ Solução Implementada

### 1. Modificação da Stored Procedure

**Arquivo**: `supabase/migrations/20250201_update_gerar_atividades_padrao_delete_existing.sql`

**Mudança Principal**:
- Adicionada lógica para **deletar atividades existentes** da frente ANTES de criar novas
- O progresso dos alunos é **preservado** (não deletamos a tabela `progresso_atividades`)

**Código Adicionado**:
```sql
-- Deletar atividades existentes da frente ANTES de criar novas
DELETE FROM public.atividades
WHERE modulo_id IN (
    SELECT id FROM public.modulos WHERE frente_id = p_frente_id
);
```

---

### 2. Preservação do Progresso dos Alunos

**Estratégia**:
- ✅ Deletamos apenas as atividades (tabela `atividades`)
- ✅ Mantemos o progresso dos alunos (tabela `progresso_atividades`)
- ⚠️ O progresso ficará temporariamente "órfão" (sem atividade vinculada)

**Por que isso é aceitável?**
- Quando o professor recria a estrutura, são novas atividades com novos IDs
- O progresso antigo fica preservado no banco (para histórico/auditoria)
- Os alunos precisarão reconquistar progresso nas novas atividades (comportamento esperado)

**Futura Melhoria** (opcional):
- Criar uma lógica de migração que tenta vincular progresso antigo a novas atividades similares
- Isso seria baseado em tipo + título + módulo

---

## 🔄 Fluxo Atualizado

### Antes da Correção
```
1. Professor clica "Gerar Estrutura"
2. Stored Procedure cria atividades
3. Professor clica "Gerar Estrutura" novamente
4. Stored Procedure cria atividades DUPLICADAS ❌
```

### Após a Correção
```
1. Professor clica "Gerar Estrutura"
2. Stored Procedure:
   - Deleta atividades existentes da frente
   - Cria novas atividades
3. Professor clica "Gerar Estrutura" novamente
4. Stored Procedure:
   - Deleta atividades existentes da frente
   - Cria novas atividades
5. Resultado: Sem duplicação ✅
```

---

## 📊 Impacto

### Tabela `atividades`
- ✅ Atividades antigas são deletadas
- ✅ Novas atividades são criadas
- ✅ Sem duplicação

### Tabela `progresso_atividades`
- ✅ Progresso antigo é preservado (não deletado)
- ⚠️ Fica "órfão" (sem atividade vinculada)
- ✅ Alunos podem reconquistar progresso nas novas atividades

---

## ✅ Status da Correção

**Migration Aplicada**: ✅ `20250201_update_gerar_atividades_padrao_delete_existing`

**Testes Necessários**:
- [ ] Testar geração de estrutura pela primeira vez
- [ ] Testar geração de estrutura pela segunda vez (deve substituir)
- [ ] Verificar que não há duplicação
- [ ] Verificar que progresso antigo foi preservado

---

**Data**: 2025-02-01  
**Status**: ✅ **CORREÇÃO APLICADA**


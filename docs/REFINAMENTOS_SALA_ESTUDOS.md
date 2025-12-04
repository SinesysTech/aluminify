# 🔧 Refinamentos e Validações Críticas: Sala de Estudos

Este documento destaca os refinamentos e validações críticas que devem ser implementados na Sala de Estudos.

---

## 1. ⚠️ Validação de Matrícula Ativa

### O que fazer:
**SEMPRE** filtrar apenas matrículas ativas em todas as queries que buscam atividades do aluno.

### Por quê:
Alunos podem cancelar ou trancar cursos. Não devemos mostrar atividades de cursos inativos.

### Onde implementar:
- ✅ Query SQL principal (Item 9.1 do plano)
- ✅ Service layer `listByAlunoMatriculas`
- ✅ Todas as APIs que listam atividades do aluno

### SQL:
```sql
WHERE mat.aluno_id = :aluno_id
  AND mat.ativo = true  -- ⚠️ CRÍTICO
```

### Validação adicional (opcional):
```sql
AND CURRENT_DATE BETWEEN mat.data_inicio_acesso AND mat.data_fim_acesso
```

---

## 2. 🎨 Tratamento Visual de Atividades Sem Arquivo

### O que fazer:
Quando uma atividade não tem `arquivo_url`, o botão de visualizar deve estar claramente desabilitado e diferenciado.

### Comportamento esperado:

#### ✅ Com Arquivo (`arquivo_url` existe):
- Botão **habilitado**
- Ícone: `Eye` (visualizar)
- Texto: "Visualizar PDF"
- Cor: padrão do tema
- Ação: Abre PDF em nova aba

#### ❌ Sem Arquivo (`arquivo_url` é `null`):
- Botão **desabilitado**
- Ícone: `FileX` (arquivo não disponível)
- Texto: "PDF não disponível"
- Cor: Cinza, opaco (muted)
- Tooltip: "Arquivo ainda não disponível"
- Ação: Nenhuma (desabilitado)

### Onde implementar:
- `components/atividade-checklist-row.tsx`

### Código exemplo:
```tsx
{arquivoUrl ? (
  <Button onClick={() => window.open(arquivoUrl, '_blank')}>
    <Eye className="h-4 w-4 mr-2" />
    Visualizar PDF
  </Button>
) : (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button disabled variant="ghost" className="opacity-50">
        <FileX className="h-4 w-4 mr-2" />
        PDF não disponível
      </Button>
    </TooltipTrigger>
    <TooltipContent>Arquivo ainda não disponível</TooltipContent>
  </Tooltip>
)}
```

---

## 3. 📊 Contadores de Progresso Contextuais

### O que fazer:
Os contadores devem refletir o que está sendo exibido (considerando filtros) e indicar o total geral quando houver filtros ativos.

### Comportamento esperado:

#### ProgressoStatsCard:
- **Sem filtros**: Mostra total geral
  ```
  Total: 50 | Pendentes: 30 | Concluídas: 5
  ```
- **Com filtros**: Mostra filtrado + total geral
  ```
  Total: 10 de 50 | Pendentes: 7 | Concluídas: 1
  ```

#### Accordions (por módulo):
- Mostra sempre do que está sendo exibido
  ```
  Módulo 1: 2/5 atividades concluídas
  ```
- Se houver filtros por status, reflete isso

### Onde implementar:
- `components/progresso-stats-card.tsx`
- `components/modulo-activities-accordion.tsx`

### Lógica:
```tsx
// Estatísticas filtradas
const atividadesFiltradas = atividades.filter(/* filtros aplicados */);
const totalFiltrado = atividadesFiltradas.length;
const concluidasFiltradas = atividadesFiltradas.filter(a => a.status === 'Concluido').length;

// Se houver filtros, mostrar "de X totais"
{hasFilters && (
  <span className="text-muted-foreground text-sm">
    de {totalGeral} totais
  </span>
)}
```

---

## 4. 📚 Ordenação Didática Rigorosa

### O que fazer:
Garantir que módulos e atividades sejam exibidos na ordem didática correta, respeitando `numero_modulo` e `ordem_exibicao`.

### Por quê:
A ordem didática é fundamental para o aprendizado. Módulos e atividades devem seguir a sequência planejada.

### Onde implementar:

#### Backend (SQL):
```sql
ORDER BY 
  c.nome ASC,                                    -- Cursos
  d.nome ASC,                                    -- Disciplinas
  f.nome ASC,                                    -- Frentes
  COALESCE(m.numero_modulo, 0) ASC,             -- ⚠️ Módulos (ordem didática)
  COALESCE(a.ordem_exibicao, 0) ASC            -- ⚠️ Atividades (ordem didática)
```

#### Frontend:
- **Não reordenar** os dados recebidos do backend
- Manter a ordem exata retornada pela API
- Usar índices do array para garantir ordem

### Validações:
- ✅ Módulos sem `numero_modulo` vão para o final (COALESCE com 0)
- ✅ Atividades sem `ordem_exibicao` vão para o final (COALESCE com 0)
- ✅ Ordem numérica crescente (1, 2, 3...)
- ✅ Frontend não altera a ordem

### Código exemplo (Frontend):
```tsx
// ✅ CORRETO: Manter ordem do backend
{modulos.map((modulo) => (
  <ModuloAccordion key={modulo.id} modulo={modulo} />
))}

// ❌ ERRADO: Reordenar
{modulos.sort((a, b) => a.numero_modulo - b.numero_modulo).map(...)}
```

---

## 📋 Checklist de Implementação dos Refinamentos

### Backend
- [ ] Query SQL filtra `mat.ativo = true`
- [ ] Validação de período de acesso (opcional)
- [ ] Ordenação SQL respeitando `numero_modulo` e `ordem_exibicao`
- [ ] Uso de `COALESCE` para tratar valores null

### Frontend - Atividade Checklist Row
- [ ] Botão desabilitado quando `arquivo_url` é null
- [ ] Ícone `FileX` para arquivo não disponível
- [ ] Tooltip explicativo
- [ ] Estilo visual diferenciado (cinza, opaco)

### Frontend - Estatísticas
- [ ] Contadores refletem filtros ativos
- [ ] Mostrar "de X totais" quando houver filtros
- [ ] Atualização em tempo real

### Frontend - Ordenação
- [ ] Não reordenar dados do backend
- [ ] Manter ordem exata da API
- [ ] Validar ordem durante testes

---

## 🎯 Prioridade

### 🔴 Crítico (Obrigatório):
1. Validação de matrícula ativa (`mat.ativo = true`)
2. Ordenação didática respeitada

### 🟡 Importante (Recomendado):
3. Tratamento visual de atividades sem arquivo
4. Contadores contextuais

---

## 📝 Notas de Implementação

1. **Validação de Matrícula**: Testar com aluno que tenha matrícula inativa
2. **Sem Arquivo**: Testar com atividades que ainda não têm PDF
3. **Contadores**: Testar com e sem filtros ativos
4. **Ordenação**: Validar visualmente que módulos/atividades estão na ordem correta

---

**Documento de Referência**: Use este documento durante a implementação para garantir que todos os refinamentos sejam aplicados corretamente.




# Plano de Remoção: Funcionalidade Kanban do Cronograma

## 📋 1. Contexto e Avaliação

### 1.1 O que foi implementado
A funcionalidade de Kanban foi implementada para visualizar o cronograma de estudos em formato de quadro kanban, permitindo:
- Visualização de itens do cronograma organizados por semana (colunas)
- Drag and drop para reordenar itens dentro da mesma semana
- Drag and drop para mover itens entre semanas
- Marcação de itens como concluídos
- Visualização mobile com accordions
- Visualização desktop com colunas horizontais

### 1.2 Componentes e Arquivos Identificados

#### Frontend
1. **Página principal**: `app/(dashboard)/aluno/cronograma/kanban/page.tsx`
   - Carrega cronograma do aluno
   - Renderiza componente ScheduleKanban
   - Gerencia estado de conclusão de itens

2. **Componente principal**: `components/schedule-kanban.tsx`
   - Implementa lógica de drag and drop usando @dnd-kit
   - Renderiza versão mobile (accordions) e desktop (colunas)
   - Gerencia atualização de ordem e semana dos itens

3. **Componente genérico**: `components/ui/shadcn-io/kanban/index.tsx`
   - Componente kanban genérico (não utilizado em outros lugares)
   - Baseado em @dnd-kit

4. **Navegação**: `components/app-sidebar.tsx`
   - Item de menu "Quadro Kanban" (linha 72-76)

#### Dependências
- `@dnd-kit/core`: ^6.3.1
- `@dnd-kit/modifiers`: ^9.0.0
- `@dnd-kit/sortable`: ^10.0.0
- `@dnd-kit/utilities`: ^3.2.2

#### Documentação
- `docs/VERIFICACAO_COMPLETA_SISTEMA.md` - menciona a rota kanban
- `docs/MOBILE_UX_PLAN.md` - menciona adaptação do kanban

### 1.3 Impacto e Dependências

#### ✅ Funcionalidades que NÃO serão afetadas:
- **Cronograma principal** (`/aluno/cronograma`) - página independente
- **Calendário** (`/aluno/cronograma/calendario`) - página independente
- **Criação de cronograma** (`/aluno/cronograma/novo`) - página independente
- **Backend de cronograma** (`backend/services/cronograma/`) - não depende do kanban
- **APIs de cronograma** - não dependem do kanban
- **Tabelas do banco** - não precisam ser alteradas
- **Outras páginas do sistema** - não referenciam o kanban

#### ⚠️ Funcionalidades que serão removidas:
- Visualização kanban do cronograma
- Drag and drop de itens do cronograma
- Reordenação visual de itens por semana

---

## 🎯 2. Plano de Remoção

### Fase 1: Remoção de Arquivos e Componentes

#### 1.1 Remover página do kanban
**Arquivo**: `app/(dashboard)/aluno/cronograma/kanban/page.tsx`
- **Ação**: Deletar arquivo e diretório completo
- **Impacto**: Usuários que acessarem `/aluno/cronograma/kanban` receberão 404
- **Alternativa**: Redirecionar para `/aluno/cronograma` (opcional)

#### 1.2 Remover componente ScheduleKanban
**Arquivo**: `components/schedule-kanban.tsx`
- **Ação**: Deletar arquivo
- **Impacto**: Nenhum (apenas usado na página kanban)

#### 1.3 Remover componente kanban genérico
**Arquivo**: `components/ui/shadcn-io/kanban/index.tsx`
- **Ação**: Deletar arquivo e diretório
- **Impacto**: Nenhum (não utilizado em outros lugares)

### Fase 2: Remoção de Referências

#### 2.1 Remover item do menu de navegação
**Arquivo**: `components/app-sidebar.tsx`
- **Linha**: 72-76
- **Ação**: Remover objeto do array `navMainData`:
```typescript
{
  title: "Quadro Kanban",
  url: "/aluno/cronograma/kanban",
  icon: LayoutGrid,
  roles: ALL_ROLES,
},
```
- **Impacto**: Item "Quadro Kanban" desaparecerá do menu lateral

#### 2.2 Remover import não utilizado (se houver)
**Arquivo**: `components/app-sidebar.tsx`
- **Ação**: Verificar se `LayoutGrid` ainda é usado. Se não, remover do import
- **Impacto**: Nenhum

### Fase 3: Limpeza de Dependências

#### 3.1 Remover pacotes @dnd-kit
**Arquivo**: `package.json`
- **Ação**: Remover as seguintes dependências:
  - `@dnd-kit/core`
  - `@dnd-kit/modifiers`
  - `@dnd-kit/sortable`
  - `@dnd-kit/utilities`
- **Comando**: `npm uninstall @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities`
- **Impacto**: Redução do tamanho do bundle

### Fase 4: Atualização de Documentação

#### 4.1 Atualizar documentação de verificação
**Arquivo**: `docs/VERIFICACAO_COMPLETA_SISTEMA.md`
- **Linha**: 54
- **Ação**: Remover ou marcar como removido:
  - Remover: `- ✅ `/aluno/cronograma/kanban` - Visualização Kanban`
  - Ou adicionar: `- ❌ `/aluno/cronograma/kanban` - Visualização Kanban (REMOVIDO)`

#### 4.2 Atualizar plano mobile (opcional)
**Arquivo**: `docs/MOBILE_UX_PLAN.md`
- **Ação**: Marcar seção do kanban como removida ou deletar referências

---

## 📝 3. Checklist de Execução

### Pré-remoção
- [ ] Fazer backup do código atual (git commit)
- [ ] Verificar se há usuários ativos usando a funcionalidade (logs/analytics)
- [ ] Comunicar remoção aos stakeholders (se necessário)

### Remoção de Arquivos
- [ ] Deletar `app/(dashboard)/aluno/cronograma/kanban/page.tsx`
- [ ] Deletar diretório `app/(dashboard)/aluno/cronograma/kanban/`
- [ ] Deletar `components/schedule-kanban.tsx`
- [ ] Deletar `components/ui/shadcn-io/kanban/index.tsx`
- [ ] Deletar diretório `components/ui/shadcn-io/kanban/`

### Remoção de Referências
- [ ] Remover item "Quadro Kanban" de `components/app-sidebar.tsx`
- [ ] Remover import `LayoutGrid` se não utilizado (verificar outros usos)
- [ ] Verificar se há outras referências com `grep -r "kanban"` (case-insensitive)

### Limpeza de Dependências
- [ ] Executar `npm uninstall @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Verificar `package-lock.json` foi atualizado
- [ ] Verificar se outras dependências não foram afetadas

### Atualização de Documentação
- [ ] Atualizar `docs/VERIFICACAO_COMPLETA_SISTEMA.md`
- [ ] Atualizar `docs/MOBILE_UX_PLAN.md` (opcional)

### Testes Pós-remoção
- [ ] Verificar que o app compila sem erros (`npm run build`)
- [ ] Verificar que não há erros de lint (`npm run lint`)
- [ ] Testar navegação no menu (verificar que item foi removido)
- [ ] Testar acesso direto à URL `/aluno/cronograma/kanban` (deve retornar 404 ou redirecionar)
- [ ] Testar outras páginas do cronograma (devem funcionar normalmente)
- [ ] Verificar que não há imports quebrados

### Validação Final
- [ ] Executar busca por "kanban" no código (não deve encontrar referências)
- [ ] Executar busca por "ScheduleKanban" no código (não deve encontrar referências)
- [ ] Executar busca por "@dnd-kit" no código (não deve encontrar referências)
- [ ] Verificar que o bundle foi reduzido (opcional)

---

## 🔍 4. Comandos de Verificação

### Verificar referências antes da remoção:
```bash
# Buscar todas as referências a kanban
grep -r -i "kanban" --exclude-dir=node_modules --exclude-dir=.git

# Buscar referências ao componente ScheduleKanban
grep -r "ScheduleKanban" --exclude-dir=node_modules --exclude-dir=.git

# Buscar referências ao @dnd-kit
grep -r "@dnd-kit" --exclude-dir=node_modules --exclude-dir=.git
```

### Verificar referências após a remoção:
```bash
# Deve retornar vazio ou apenas referências em documentação
grep -r -i "kanban" --exclude-dir=node_modules --exclude-dir=.git
grep -r "ScheduleKanban" --exclude-dir=node_modules --exclude-dir=.git
grep -r "@dnd-kit" --exclude-dir=node_modules --exclude-dir=.git
```

---

## ⚠️ 5. Considerações Importantes

### 5.1 Redirecionamento (Opcional)
Se quiser redirecionar usuários que acessarem a URL antiga:

**Criar**: `app/(dashboard)/aluno/cronograma/kanban/page.tsx`
```typescript
import { redirect } from 'next/navigation'

export default function KanbanPage() {
  redirect('/aluno/cronograma')
}
```

**Recomendação**: Não é necessário, pois a funcionalidade está sendo removida intencionalmente.

### 5.2 Dados no Banco de Dados
- **Não é necessário** alterar tabelas do banco
- Os dados de `cronograma_itens` continuam válidos
- Apenas a visualização kanban está sendo removida
- Outras visualizações (lista, calendário) continuam funcionando

### 5.3 Compatibilidade
- A remoção não afeta:
  - Cronogramas existentes
  - Dados de conclusão de itens
  - APIs do backend
  - Outras funcionalidades do sistema

### 5.4 Rollback
Se precisar reverter a remoção:
- Use `git revert` ou `git reset` para voltar ao commit anterior
- Reinstale dependências: `npm install @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities`

---

## 📊 6. Estimativa de Impacto

### Arquivos a serem removidos:
- 3 arquivos de código
- 1 diretório de página
- 1 diretório de componente

### Linhas de código a serem removidas:
- ~430 linhas (página kanban)
- ~605 linhas (componente schedule-kanban)
- ~338 linhas (componente kanban genérico)
- **Total**: ~1.373 linhas

### Dependências a serem removidas:
- 4 pacotes npm
- Redução estimada do bundle: ~50-100KB (gzipped)

### Tempo estimado:
- **Remoção**: 15-30 minutos
- **Testes**: 15-30 minutos
- **Total**: 30-60 minutos

---

## ✅ 7. Resumo Executivo

**Objetivo**: Remover completamente a funcionalidade de visualização kanban do cronograma sem afetar outras funcionalidades do sistema.

**Escopo**:
- Remover página, componentes e dependências relacionadas ao kanban
- Remover referências no menu de navegação
- Atualizar documentação

**Riscos**: ⚠️ BAIXO
- Funcionalidade isolada
- Não afeta backend ou banco de dados
- Outras visualizações do cronograma continuam funcionando

**Benefícios**:
- Redução do tamanho do bundle
- Simplificação da base de código
- Menos manutenção

---

**Status**: 📝 Plano criado - Pronto para execução


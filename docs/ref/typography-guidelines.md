# Typography Guidelines

Guia de padronização tipográfica para manter consistência visual em toda a aplicação.

---

## Contextos Tipográficos

O Design System define **duas escalas tipográficas** diferentes:

| Contexto | Escala | Uso |
|----------|--------|-----|
| **Landing Pages** | Grande (text-4xl+) | Hero, marketing, páginas públicas |
| **Área Logada (App)** | Compacta (text-2xl max) | Dashboard, gestão, formulários |

Este documento foca na **Área Logada**.

---

## Hierarquia Tipográfica - Área Logada

### Escala Visual

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar Trigger] │ Breadcrumb              │ [Actions]   │ ← Header (h=56px)
├────────────────────┼────────────────────────────────────────┤
│                    │                                        │
│  Sidebar           │  PAGE TITLE (H1)                       │ ← .page-title
│  - Menu Item       │  Descrição da página                   │ ← .page-subtitle
│  - Menu Item       │                                        │
│                    │  ┌─ SECTION TITLE (H2) ───────────────┐│ ← .section-title
│                    │  │                                    ││
│                    │  │  ┌─ Card ─────────────────────────┐││
│                    │  │  │ CARD TITLE (H3)                │││ ← .card-title
│                    │  │  │ Conteúdo do card               │││
│                    │  │  └────────────────────────────────┘││
│                    │  │                                    ││
│                    │  └────────────────────────────────────┘│
│                    │                                        │
└────────────────────┴────────────────────────────────────────┘
```

### Classes Utilitárias (globals.css)

| Nível | Classe | Especificações | Tamanho |
|-------|--------|----------------|---------|
| H1 | `.page-title` | `text-2xl font-bold tracking-tight text-foreground` | 24px |
| H1 (desc) | `.page-subtitle` | `text-sm text-muted-foreground` | 14px |
| H2 | `.section-title` | `text-lg font-semibold text-foreground` | 18px |
| H2 (desc) | `.section-subtitle` | `text-sm text-muted-foreground` | 14px |
| H3 | `.card-title` | `text-base font-semibold text-foreground` | 16px |
| Empty | `.empty-state-title` | `text-lg font-semibold text-foreground` | 18px |

### Hierarquia Interna de Cards (Dashboard)

Para títulos dentro de cards de métricas/gráficos no dashboard:

| Elemento | Classes | Exemplo |
|----------|---------|---------|
| Título do card | `text-sm font-medium text-muted-foreground` | "Tempo de Estudo" |
| Valor principal | `text-2xl font-bold tracking-tight` | "4h 32min" |
| Subtexto | `text-xs text-muted-foreground` | "vs. semana anterior" |

### Hierarquia de Gráficos/Seções Internas

| Elemento | Classes | Uso |
|----------|---------|-----|
| Título de seção interna | `text-base md:text-lg font-semibold text-foreground` | Títulos de gráficos |
| Legenda/Label | `text-sm text-muted-foreground` | Rótulos de eixos |
| Valores destacados | `text-xl font-bold` | Números em destaque |

---

## Sidebar - Hierarquia

| Elemento | Classes | Tamanho |
|----------|---------|---------|
| Logo/Nome da org | `text-sm font-semibold` | 14px |
| Group Label | `text-xs font-medium text-sidebar-foreground/70` | 12px |
| Menu Item | `text-sm` | 14px |
| Menu Item (ativo) | `text-sm font-medium` | 14px |
| Submenu Item | `text-sm` | 14px |

---

## Espaçamento Padrão

### Container Principal (dashboard-layout.tsx)

```tsx
// Padding do conteúdo principal
className="p-4 md:px-8 md:py-6 pb-20 md:pb-8"
```

### Espaçamento entre Elementos

| Contexto | Classes | Valor |
|----------|---------|-------|
| Page title → content | `mb-6` ou `mb-8` | 24-32px |
| Section title → content | `mb-4` | 16px |
| Card padding | `p-4` ou `p-6` | 16-24px |
| Grid gap (cards) | `gap-4` ou `gap-6` | 16-24px |
| Entre seções | `mb-8` | 32px |

## Quando Usar Cada Classe

### `.page-title`
Use para o titulo principal de cada pagina. Deve haver apenas um por pagina.

```tsx
<h1 className="page-title">Alunos</h1>
```

### `.page-subtitle`
Use para a descricao que acompanha o titulo principal da pagina.

```tsx
<p className="page-subtitle">Gerencie matriculas, progresso e status financeiro.</p>
```

### `.section-title`
Use para titulos de secoes dentro de uma pagina.

```tsx
<h2 className="section-title mb-2">Empresas</h2>
```

### `.section-subtitle`
Use para descricoes de secoes.

```tsx
<p className="section-subtitle">Gerencie todas as empresas do sistema</p>
```

### `.card-title`
Use para titulos dentro de cards.

```tsx
<h3 className="card-title">Configuracoes</h3>
```

### `.empty-state-title`
Use para titulos em estados vazios (quando nao ha dados).

```tsx
<h3 className="empty-state-title mb-2">Base de alunos vazia</h3>
```

## Componentes Padronizados

Para maior consistencia, utilize os componentes de `components/ui/data-page.tsx`:

- `DataPageHeader` - Header padrao para paginas de dados
- `DataPageEmptyState` - Estado vazio padronizado

### Exemplo com DataPageHeader

```tsx
import { DataPageHeader } from '@/components/ui/data-page'

<DataPageHeader
  title="Alunos"
  description="Gerencie matriculas, progresso e status financeiro."
  actions={<Button>Novo Aluno</Button>}
/>
```

### Exemplo com DataPageEmptyState

```tsx
import { DataPageEmptyState } from '@/components/ui/data-page'
import { UserPlus } from 'lucide-react'

<DataPageEmptyState
  icon={UserPlus}
  title="Base de alunos vazia"
  description="Adicione alunos manualmente ou importe em massa."
  actions={<Button>Adicionar Aluno</Button>}
/>
```

## Regras Gerais

1. **Nunca use cores hardcoded** como `#71717A` ou `#09090B` para texto. Use as classes utilitarias que ja incluem suporte a dark mode.

2. **Evite misturar estilos** - Use as classes utilitarias ou os componentes padronizados, nao ambos.

3. **Consistencia entre paginas** - Todas as paginas de dados devem seguir o mesmo padrao visual.

4. **Dark mode** - Todas as classes utilitarias ja incluem variantes para dark mode usando `dark:`.

## Arquivos de Referencia

- Classes CSS: `app/globals.css`
- Componentes: `components/ui/data-page.tsx`
- Exemplo de uso: `app/(modules)/usuario/(gestao)/alunos/components/client-page.tsx`

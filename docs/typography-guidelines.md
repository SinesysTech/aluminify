# Typography Guidelines

Guia de padronizacao tipografica para manter consistencia visual em toda a aplicacao.

## Classes Utilitarias

As classes utilitarias de tipografia estao definidas em `app/globals.css` dentro de `@layer utilities`.

### Hierarquia de Titulos

| Classe | Uso | Especificacoes |
|--------|-----|----------------|
| `.page-title` | Titulos principais de paginas (H1) | `text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50` |
| `.page-subtitle` | Subtitulos/descricoes de paginas | `text-sm text-zinc-500 dark:text-zinc-400` |
| `.section-title` | Titulos de secoes (H2) | `text-lg font-semibold text-zinc-900 dark:text-zinc-50` |
| `.section-subtitle` | Subtitulos de secoes | `text-sm text-zinc-500 dark:text-zinc-400` |
| `.card-title` | Titulos de cards (H3) | `text-base font-semibold text-zinc-900 dark:text-zinc-50` |
| `.empty-state-title` | Titulos de estados vazios | `text-lg font-semibold text-zinc-900 dark:text-zinc-50` |

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
- Exemplo de uso: `app/(dashboard)/admin/alunos/components/client-page.tsx`

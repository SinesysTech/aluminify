# Aluminify Component Library

Quick reference for all landing page components with copy-paste examples.

---

## Navigation

### Sticky Navigation with Blur

```tsx
<nav className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light/80 dark:border-border-dark/80 transition-colors">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
    {/* Logo */}
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="material-icons-outlined text-white text-sm">
          dashboard
        </span>
      </div>
      <span className="font-display font-bold text-lg tracking-tight">
        Aluminify
      </span>
    </Link>

    {/* Links */}
    <div className="hidden md:flex items-center gap-6">
      <Link
        href="/features"
        className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-white transition-colors"
      >
        Recursos
      </Link>
      {/* More links... */}
    </div>

    {/* CTA */}
    <Link
      href="/signup"
      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
    >
      Começar Agora
    </Link>
  </div>
</nav>
```

---

## Buttons

### Primary Button (Large)

```tsx
<button className="bg-primary text-white hover:bg-primary-hover px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-zinc-200 dark:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Começar Gratuitamente
</button>
```

### Primary Button with Icon

```tsx
<button className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-hover px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-zinc-200 dark:shadow-none transition-all group">
  <span>Ver Demo</span>
  <span className="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">
    arrow_forward
  </span>
</button>
```

### Secondary/Outline Button

```tsx
<button className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark px-8 py-3.5 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
  Ver Preços
</button>
```

### Small Button (Nav CTA)

```tsx
<button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-sm transition-all">
  Começar Agora
</button>
```

### Ghost Button

```tsx
<button className="text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-white transition-colors font-medium">
  Saiba mais
</button>
```

---

## Cards

### Feature Card

```tsx
<div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
    <span className="material-icons-outlined text-blue-600 dark:text-blue-400">
      psychology
    </span>
  </div>
  <h3 className="text-xl font-bold mb-2">IA Integrada</h3>
  <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
    Tutor virtual que aprende com seu progresso e adapta o conteúdo.
  </p>
</div>
```

### Pricing Card

```tsx
<div className="p-8 rounded-2xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
  <h3 className="text-xl font-bold mb-2">Pro</h3>
  <p className="text-text-muted-light dark:text-text-muted-dark text-sm mb-6">
    Para escolas em crescimento
  </p>
  <div className="flex items-baseline gap-1 mb-8">
    <span className="text-4xl font-bold">R$199</span>
    <span className="text-text-muted-light dark:text-text-muted-dark">
      /mês
    </span>
  </div>
  <ul className="space-y-3 mb-8">
    <li className="flex items-center gap-3 text-sm">
      <span className="material-icons-outlined text-green-500 text-sm">
        check
      </span>
      <span>Até 500 alunos</span>
    </li>
    {/* More items... */}
  </ul>
  <button className="w-full bg-primary text-white hover:bg-primary-hover py-3 rounded-lg font-medium transition-all">
    Selecionar Plano
  </button>
</div>
```

### Highlighted Pricing Card

```tsx
<div className="p-8 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border-2 border-blue-500 shadow-lg scale-[1.02]">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold">Enterprise</h3>
    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
      Popular
    </span>
  </div>
  {/* Rest of card content... */}
</div>
```

---

## Badges

Use the `Badge` component from `@/components/ui/badge` for all badge implementations.

### Available Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `default` | Primary actions, main status | `<Badge>Ativo</Badge>` |
| `secondary` | Secondary information | `<Badge variant="secondary">Info</Badge>` |
| `success` | Positive status, completed | `<Badge variant="success">Concluído</Badge>` |
| `warning` | Attention required | `<Badge variant="warning">Pendente</Badge>` |
| `info` | Informational | `<Badge variant="info">Novo</Badge>` |
| `destructive` | Errors, danger | `<Badge variant="destructive">Erro</Badge>` |
| `outline` | Minimal, subtle | `<Badge variant="outline">Tag</Badge>` |

### Importance Level Badges (Solid)

Use these for importance/priority levels with high contrast (solid background + white text):

| Variant | Color | Use Case |
|---------|-------|----------|
| `importance-base` | Blue | Base/foundational items |
| `importance-high` | Red | High priority/importance |
| `importance-medium` | Amber | Medium priority |
| `importance-low` | Emerald | Low priority |

```tsx
import { Badge } from '@/components/ui/badge'

// Importance levels
<Badge variant="importance-base">Base</Badge>
<Badge variant="importance-high">Alta</Badge>
<Badge variant="importance-medium">Média</Badge>
<Badge variant="importance-low">Baixa</Badge>
```

### Status Badge with Dot

For real-time status indicators (online/offline, live):

```tsx
<Badge variant="outline" className="flex items-center gap-2">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
  Online
</Badge>
```

### ⚠️ Anti-Patterns to Avoid

**NEVER** use inline color styles like this:

```tsx
// ❌ DON'T DO THIS - deprecated pattern
<Badge className="bg-blue-500/10 text-blue-500">Base</Badge>
<Badge className="bg-red-500/10 text-red-500">Alta</Badge>

// ✅ DO THIS INSTEAD - use semantic variants
<Badge variant="importance-base">Base</Badge>
<Badge variant="importance-high">Alta</Badge>
```

**Why?**
- Inconsistent visual identity across the app
- Hard to maintain and update colors
- Poor contrast ratio (especially in light mode)
- Breno has expressed strong preference against this pattern

### Migration Guide

Replace old inline color patterns with semantic variants:

| Old Pattern | New Pattern |
|-------------|-------------|
| `bg-blue-500/10 text-blue-500` | `variant="importance-base"` |
| `bg-red-500/10 text-red-500` | `variant="importance-high"` |
| `bg-yellow-500/10 text-yellow-500` | `variant="importance-medium"` |
| `bg-green-500/10 text-green-500` | `variant="importance-low"` |
| `bg-green-500/10 text-green-700` | `variant="success"` |
| `bg-orange-500/10 text-orange-700` | `variant="warning"` |

---

## Hero Section

### Hero with Gradient Title

```tsx
<section className="pt-24 pb-16 lg:pt-32 lg:pb-24 relative overflow-hidden">
  {/* Background Pattern */}
  <div className="absolute inset-0 bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-size-[40px_40px] opacity-50 z-0 pointer-events-none"></div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-8">
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
      <span className="text-xs font-medium">Lançamento v2.0</span>
    </div>

    {/* Title */}
    <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
      O LMS que sua escola
      <br />
      <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-600 to-black dark:from-zinc-300 dark:to-white">
        merece.
      </span>
    </h1>

    {/* Subtitle */}
    <p className="text-lg md:text-xl text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto mb-12 leading-relaxed">
      Gerencie cursos, turmas e progresso com uma plataforma moderna,
      inteligente e feita para o Brasil.
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button className="bg-primary text-white hover:bg-primary-hover px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-zinc-200 dark:shadow-none transition-all">
        Começar Gratuitamente
      </button>
      <button className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark px-8 py-3.5 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
        Ver Demo
      </button>
    </div>
  </div>
</section>
```

---

## Section Patterns

### Section with Border

```tsx
<section className="py-20 lg:py-24 border-t border-border-light dark:border-border-dark">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* Content */}</div>
</section>
```

### Section with Background

```tsx
<section className="py-20 lg:py-24 bg-surface-light dark:bg-surface-dark">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* Content */}</div>
</section>
```

### Section Header

```tsx
<div className="text-center mb-16">
  <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
    Recursos que fazem a diferença
  </h2>
  <p className="text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto">
    Tudo que você precisa para transformar a experiência educacional.
  </p>
</div>
```

---

## Footer

### Full Footer

```tsx
<footer className="py-16 lg:py-20 border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      {/* Logo Column */}
      <div className="col-span-2 md:col-span-1">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-icons-outlined text-white text-sm">
              dashboard
            </span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Aluminify
          </span>
        </Link>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          O LMS open source para escolas brasileiras.
        </p>
      </div>

      {/* Link Columns */}
      <div>
        <h4 className="font-bold text-sm mb-4">Produto</h4>
        <ul className="space-y-2">
          <li>
            <Link
              href="/features"
              className="text-sm text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-white transition-colors"
            >
              Recursos
            </Link>
          </li>
          {/* More links... */}
        </ul>
      </div>
    </div>

    {/* Copyright */}
    <div className="pt-8 border-t border-border-light dark:border-border-dark text-center">
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
        &copy; 2026 Aluminify. Todos os direitos reservados.
      </p>
    </div>
  </div>
</footer>
```

---

## Tables

### Pricing Comparison Table

```tsx
<div className="rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
  <table className="w-full">
    <thead className="bg-zinc-50 dark:bg-zinc-900/50">
      <tr>
        <th className="py-4 px-6 text-left text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
          Recurso
        </th>
        <th className="py-4 px-6 text-center text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
          Free
        </th>
        <th className="py-4 px-6 text-center text-sm font-bold uppercase tracking-wider text-blue-600">
          Pro
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border-light dark:divide-border-dark">
      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
        <td className="py-4 px-6 font-medium">Alunos</td>
        <td className="py-4 px-6 text-center">50</td>
        <td className="py-4 px-6 text-center">500</td>
      </tr>
      {/* More rows... */}
    </tbody>
  </table>
</div>
```

---

## Terminal Mockup

```tsx
<div className="max-w-3xl mx-auto rounded-xl overflow-hidden bg-[#1e1e1e] text-left border border-zinc-700 shadow-2xl">
  {/* Window Controls */}
  <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d] border-b border-zinc-700">
    <div className="flex gap-1.5">
      <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
      <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
    </div>
    <div className="text-xs text-zinc-400 ml-2 font-mono">bash</div>
  </div>

  {/* Terminal Content */}
  <div className="p-6 font-mono text-sm text-zinc-300">
    <div className="mb-2">
      <span className="text-green-400">~</span> git clone
      https://github.com/aluminify/core.git
    </div>
    <div className="mb-2 text-zinc-500">
      Cloning into &apos;aluminify-core&apos;...
    </div>
    <div>
      <span className="text-green-400">~</span>{" "}
      <span className="animate-pulse">_</span>
    </div>
  </div>
</div>
```

---

## Browser Mockup

```tsx
<div className="rounded-xl overflow-hidden border border-border-light dark:border-border-dark shadow-2xl">
  {/* Browser Chrome */}
  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 flex items-center gap-3 border-b border-border-light dark:border-border-dark">
    <div className="flex gap-1.5">
      <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
      <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
      <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
    </div>
    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-md px-4 py-1.5 text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-2">
      <span className="material-icons-outlined text-green-500 text-xs">
        lock
      </span>
      app.aluminify.com/dashboard
    </div>
  </div>

  {/* Content */}
  <div className="bg-white dark:bg-surface-dark aspect-video">
    {/* Dashboard mockup content */}
  </div>
</div>
```

---

## Usage Guidelines

### Import Icons

```html
<link
  href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
  rel="stylesheet"
/>
```

### Dark Mode

All components use `dark:` variants. Wrap your app with a dark mode provider that adds the `dark` class to the root element.

### Responsive Design

- Mobile-first approach
- Use `md:` and `lg:` breakpoints for larger screens
- Test at 375px, 768px, 1024px, 1440px

---

_Part of Aluminify Design System v2.0_

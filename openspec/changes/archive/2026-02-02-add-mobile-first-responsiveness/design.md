# Design: Mobile-First Responsiveness

## Context
O projeto Aluminify utiliza Tailwind CSS v4 com sistema de temas customizáveis. A responsividade atual é implementada de forma ad-hoc, sem padrões consistentes. O sidebar usa shadcn/ui com suporte a offcanvas, mas outros componentes variam em qualidade de implementação mobile.

**Stakeholders:**
- Alunos (maior volume, frequentemente acessam via celular)
- Professores (mix de dispositivos)
- Administradores (predominantemente desktop)

**Restrições:**
- Manter compatibilidade com Tailwind CSS v4
- Não quebrar funcionalidade existente
- Mudanças devem ser incrementais

## Goals / Non-Goals

### Goals
- Experiência mobile-first em todas as páginas
- Navegação intuitiva em dispositivos touch
- Performance otimizada para conexões móveis
- Acessibilidade WCAG 2.1 AA em todos os breakpoints

### Non-Goals
- Aplicativo nativo (PWA futuro, fora do escopo)
- Suporte a dispositivos < 320px de largura
- Redesign visual completo (apenas adaptações de layout)

## Decisions

### 1. Sistema de Breakpoints

**Decisão:** Manter breakpoints Tailwind padrão com aliases semânticos.

```css
/* Mobile First - base é mobile */
--breakpoint-sm: 640px;   /* Mobile grande / Phablet */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape / Desktop pequeno */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Desktop grande */
```

**Alternativas consideradas:**
- Bootstrap breakpoints (576, 768, 992, 1200) - rejeitado por inconsistência com Tailwind
- Custom breakpoints baseados em dispositivos populares - rejeitado por complexidade de manutenção

### 2. Navegação Mobile

**Decisão:** Implementar bottom navigation bar para mobile, mantendo sidebar para desktop.

```
Mobile (<768px):
┌─────────────────────────┐
│ Header compacto         │
├─────────────────────────┤
│                         │
│   Conteúdo principal    │
│                         │
├─────────────────────────┤
│ Home │ Aulas │ + │ AI │ │
└─────────────────────────┘

Desktop (>=1024px):
┌────┬────────────────────┐
│    │ Header             │
│ S  ├────────────────────┤
│ I  │                    │
│ D  │ Conteúdo principal │
│ E  │                    │
│    │                    │
└────┴────────────────────┘
```

**Alternativas consideradas:**
- Hamburger menu only - rejeitado por esconder navegação crítica
- Floating action button - rejeitado por cobrir conteúdo

### 3. Tabelas Responsivas

**Decisão:** Padrão híbrido - cards em mobile, tabelas em desktop.

```tsx
// Padrão de implementação
<div className="block md:hidden">
  {/* Card view para mobile */}
  <ResponsiveCardList data={data} />
</div>
<div className="hidden md:block">
  {/* Table view para desktop */}
  <DataTable data={data} columns={columns} />
</div>
```

**Alternativas consideradas:**
- Scroll horizontal em tabelas - rejeitado por UX ruim
- Colunas colapsáveis - rejeitado por complexidade

### 4. Touch Targets

**Decisão:** Mínimo 44x44px para todos os elementos interativos.

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  /* ou padding equivalente */
  padding: 12px;
}
```

### 5. Container Queries vs Media Queries

**Decisão:** Usar media queries como padrão, container queries apenas para componentes isolados.

Container queries são úteis para:
- Cards que aparecem em diferentes contextos
- Componentes de widget reutilizáveis

Media queries para:
- Layouts de página
- Navegação global
- Componentes de formulário

### 6. Hook de Breakpoint

**Decisão:** Criar `useBreakpoint()` hook unificado.

```typescript
// hooks/use-breakpoint.ts
export function useBreakpoint() {
  return {
    isMobile: boolean,      // < 768px
    isTablet: boolean,      // 768px - 1023px
    isDesktop: boolean,     // >= 1024px
    breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl',
    width: number
  }
}
```

### 7. Espaçamento Responsivo

**Decisão:** CSS custom properties com valores responsivos via clamp().

```css
:root {
  --space-page-x: clamp(1rem, 5vw, 2rem);
  --space-page-y: clamp(1rem, 3vh, 2.5rem);
  --space-section: clamp(0.75rem, 2vw, 1.5rem);
  --space-component: clamp(0.5rem, 1.5vw, 1rem);
}
```

## Risks / Trade-offs

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Breaking changes em componentes existentes | Alto | Implementação incremental, testes visuais |
| Performance em dispositivos low-end | Médio | Lazy loading, code splitting por breakpoint |
| Inconsistência durante migração | Médio | Style guide atualizado, revisão de PRs |
| Aumento de CSS bundle size | Baixo | Tailwind purge automático |

## Migration Plan

### Fase 1: Infraestrutura (Semana 1)
1. Adicionar design tokens responsivos em `globals.css`
2. Criar/atualizar `useBreakpoint()` hook
3. Documentar padrões no style guide

### Fase 2: Componentes Base (Semana 2-3)
1. Atualizar Button, Input, Card para touch targets
2. Implementar bottom navigation component
3. Criar ResponsiveTable/CardList pattern

### Fase 3: Layouts (Semana 3-4)
1. Refatorar Sidebar para melhor UX mobile
2. Implementar header responsivo
3. Atualizar modais para full-screen mobile

### Fase 4: Páginas (Semana 4-6)
1. Dashboard pages (aluno, professor, admin)
2. Formulários e wizards
3. Landing page e auth

### Rollback
- Feature flags não necessários (mudanças CSS são backwards-compatible)
- Git revert disponível para cada fase
- Testes visuais capturam regressões

## Open Questions

1. **Bottom nav items:** Quais 4-5 itens são mais críticos para navegação mobile?
   - Sugestão: Home, Aulas/Turmas, Ação rápida (+), IA, Perfil

2. **Offline support:** Implementar service worker para cache de assets em mobile?
   - Fora do escopo atual, considerar para futuro

3. **Gestos:** Implementar swipe para voltar/navegar no mobile?
   - Considerar para Fase 2
